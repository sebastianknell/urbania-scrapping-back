import dotenv from "dotenv";
dotenv.config();

export default {
  REDIS_HOST: process.env.REDIST_HOST as string,
  REDIS_PORT: Number(process.env.REDIS_PORT as string),
  SMTP_HOST: process.env.SMTP_HOST as string,
  SMTP_PORT: Number(process.env.SMTP_PORT as string),
  SMTP_USER: process.env.SMTP_USER as string,
  SMTP_PASS: process.env.SMTP_PASS as string,
};
