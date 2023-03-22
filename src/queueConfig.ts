import IORedis from "ioredis";
import environment from "./environment.js";

export const queueName = "background-jobs";

export const connectionOptions = {
  connection: new IORedis(environment.REDIS_URL),
};