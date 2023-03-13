import express from "express";
import cors from "cors";
import statusCodes from "http-status-codes";
import http from "http";
import path from "path";
import { WebSocket } from "ws";
import { backgroundJobs, worker } from "./queue.js";
import { Query } from "./model/query.js";
import { districts } from "./data.js";
import { validateQuery } from "./utils/validation-utils.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const port = 5000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", async (ws: WebSocket) => {
  console.log("Socket connected");
  worker.removeAllListeners("completed");
  worker.on("completed", (job) => {
    console.log("job completed at:", new Date().toLocaleString());
    ws.send(
      JSON.stringify({
        jobId: Number(job.id),
        filename: job.returnvalue,
      })
    );
  });
});

//start our server
server.listen(port, () => {
  console.log(`Server started on port ${port} :)`);
});
