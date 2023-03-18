import { Queue, Worker } from "bullmq";
import { sendScrappingCsv } from "./crawler.js";
import { Query } from "./model/query.js";
import environment from "./environment.js";
import IORedis from "ioredis"

const connectionOptions = {
  connection: new IORedis(environment.REDIS_URL),
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
