import serverlessExpress from "@codegenie/serverless-express";
import express from "express";
import { eventSNS } from "../../lib/events.js";

const app = express();
app.use(express.json());
app.post("/sns", (req, res) => {
  res.json({ ok: true, records: req.body.Records?.length ?? 0 });
});

const handler = serverlessExpress({
  app,
  eventSourceRoutes: { AWS_SNS: "/sns" },
});

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventSNS);
};
beforeEach();

export const bench = () => handler(event, ctx);
