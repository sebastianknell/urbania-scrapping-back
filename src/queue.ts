import { Queue, Worker } from "bullmq"
import { sendScrappingCsv } from "./crawler.js";
import { Query } from "./model/query.js";

const connectionOptions = {
  connection: {
    host: "localhost",
    port: 6379,
  },
};

export const backgroundJobs = new Queue("background-jobs", connectionOptions);

const worker = new Worker(
  "background-jobs",
  async (job) => {
    const query: Query = job.data.query;
    const email: string = job.data.email;
    sendScrappingCsv(query, email);
    console.log(query, email);
  },
  connectionOptions
);