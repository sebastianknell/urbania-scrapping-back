import { Worker } from "bullmq";
import throng from "throng"
import { queueName, connectionOptions } from "./queueConfig.js";
import { sendScrappingCsv } from "./crawler.js";
import { Query } from "./model/query.js";

let workers = 1;

function start() {  
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