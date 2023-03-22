import express from "express";
import cors from "cors";
import statusCodes from "http-status-codes";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { Queue, QueueEvents } from "bullmq";
import { queueName, connectionOptions } from "./queueConfig.js";
import { Query } from "./model/query.js";
import { districts } from "./data.js";
import { validateQuery } from "./utils/validation-utils.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const backgroundJobs = new Queue(queueName, connectionOptions);
const backgroundJobsEvents = new QueueEvents(queueName, connectionOptions);

app.post("/scrapping", async (req, res) => {
  console.log("scrapping");
  const query: Query = req.body.query;
  const email: string = req.body.email;
  if (!validateQuery(query)) {
    res.status(statusCodes.BAD_REQUEST).send();
    return;
  }
  const job = await backgroundJobs.add("send-email", { query, email });
  const jobId = Number(job.id);
  console.log(jobId);
  res.json({ jobId });
});

app.get("/get-districts", async (req, res) => {
  res.json(districts.sort((a, b) => a.value.localeCompare(b.value)));
});

app.get("/download-csv/:filename", async (req, res) => {
  console.log("downloading file");
  const filename = req.params.filename;
  const filePath = path.join("files", filename);
  res.download(filePath, filename);
});

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", async (ws: WebSocket) => {
  console.log("Socket connected");

  backgroundJobsEvents.removeAllListeners("completed");
  backgroundJobsEvents.on("completed", ({jobId, returnvalue}) => {
    console.log(`Job ${jobId} completed at: ${new Date().toLocaleString()}`);
    ws.send(
      JSON.stringify({
        jobId: Number(jobId),
        filename: returnvalue,
      })
    );
  })
});

server.listen(port, () => {
  console.log(`Server started on port ${port} :)`);
});
