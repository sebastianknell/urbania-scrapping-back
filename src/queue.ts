import { Queue, Worker } from "bullmq";
import { sendScrappingCsv } from "./crawler.js";
import { Query } from "./model/query.js";
import environment from "./environment.js";

const connectionOptions = {
  connection: {
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
  },
};

const queueName = "background-jobs";
export const backgroundJobs = new Queue(queueName, connectionOptions);

export const worker = new Worker(
  queueName,
  async (job) => {
    const query: Query = job.data.query;
    const email: string = job.data.email;
    const filename = await sendScrappingCsv(query, email);
    return filename;
  },
  connectionOptions
);
