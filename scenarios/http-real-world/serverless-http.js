import express from "express";
import serverless from "serverless-http";
import { eventV2Post } from "../../lib/events.js";
import { greet, zodSchema } from "../../lib/schema.js";

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
  const body = zodSchema.parse(req.body);
  res.json(greet(body));
});

app.use((err, _req, res, _next) => {
  if (err?.name === "ZodError") {
    res.status(400).json({ error: "Bad Request", issues: err.issues });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
});

const handler = serverless(app);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => handler(event, ctx);
