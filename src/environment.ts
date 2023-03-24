export default {
  // REDIS_HOST: process.env.REDIST_HOST as string,
  // REDIS_PORT: Number(process.env.REDIS_PORT as string),
  REDIS_URL: process.env.REDIS_URL as string,
  // SMTP_HOST: process.env.SMTP_HOST as string,
  // SMTP_PORT: Number(process.env.SMTP_PORT as string),
  // SMTP_USER: process.env.SMTP_USER as string,
  // SMTP_PASS: process.env.SMTP_PASS as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  S3_BUCKET: process.env.S3_BUCKET as string,
};
