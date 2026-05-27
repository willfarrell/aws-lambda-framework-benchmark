import serverlessExpress from "@codegenie/serverless-express";
import express from "express";
import { eventV2 } from "../../lib/events.js";

const app = express();
app.get("/", (_req, res) => res.json({ hello: "world" }));

const handler = serverlessExpress({ app });

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, ctx);
