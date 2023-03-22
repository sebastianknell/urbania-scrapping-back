import IORedis from "ioredis"
import { Queue, Worker } from "bullmq";
import throng from "throng"
import { sendScrappingCsv } from "./crawler.js";
import { Query } from "./model/query.js";
import environment from "./environment.js";

export const queueName = "background-jobs";

export const connectionOptions = {
  connection: new IORedis(environment.REDIS_URL),
};

let workers = process.env.WEB_CONCURRENCY || 1;

function start() {
  const backgroundJobs = new Queue(queueName, connectionOptions);
  
  const worker = new Worker(
    queueName,
    async (job) => {
      const query: Query = job.data.query;
      const email: string = job.data.email;
      const filename = await sendScrappingCsv(query, email);
      return filename;
    },
    connectionOptions
  );
}

throng({workers, start});