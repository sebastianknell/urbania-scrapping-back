import express from "express";
import cors from "cors";
import { backgroundJobs } from "./queue.js";
import { Query } from "./model/query.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/scrapping", async (req, res) => {
  // TODO validate query and email
  const query: Query = req.body.query;
  const email: string = req.body.email;
  await backgroundJobs.add("send-email", { query, email });
  console.log("hey");
  res.status(200).send();
});

// app.get("/get-districts", async (req: Request, res: Response) => {});

// app.get("/get-property-types", async (req: Request, res: Response) => {});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
