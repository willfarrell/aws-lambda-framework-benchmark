import serverlessExpress from "@codegenie/serverless-express";
import express from "express";
import { eventSQS } from "../../lib/events.js";

const app = express();
app.use(express.json());
app.post("/sqs", (req, res) => {
  res.json({
    processed: req.body.Records?.length ?? 0,
    batchItemFailures: [],
  });
});

const handler = serverlessExpress({
  app,
  eventSourceRoutes: { AWS_SQS: "/sqs" },
});

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventSQS);
};
beforeEach();

export const bench = () => handler(event, ctx);
