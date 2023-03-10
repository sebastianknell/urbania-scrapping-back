import express from "express";
import cors from "cors";
import statusCodes from "http-status-codes";
import http from "http";
import { WebSocket } from "ws";
import { Job } from "bullmq";
import environment from "./environment.js";
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
  const jobId = job.id;
  console.log(jobId);
  res.json({ jobId });
});

app.get("/get-districts", async (req, res) => {
  res.json(districts.sort((a, b) => a.value.localeCompare(b.value)));
});

app.get("/download-csv/:filename", async (req, res) => {
  console.log("downloading file");
  const filename = req.params.filename;
  res.download(`files/${filename}`, "scrapping.csv");
});

const port = 5000;
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", async (ws: WebSocket) => {
  console.log("Socket connected");

  worker.on("completed", (job) => {
    console.log("job completed");
    ws.send(
      JSON.stringify({
        jobId: job.id,
        filename: job.returnvalue,
      })
    );
  });
});

//start our server
server.listen(port, () => {
  console.log(`Server started on port ${port} :)`);
});
