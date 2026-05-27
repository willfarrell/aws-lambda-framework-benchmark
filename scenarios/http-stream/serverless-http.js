import "../../lib/awslambda-stub.js";
import express from "express";
import serverless from "serverless-http";
import { eventV2 } from "../../lib/events.js";
import { createNullStream } from "../../lib/null-stream.js";

const app = express();
app.get("/", (_req, res) => res.json({ hello: "world" }));

const handler = serverless(app, { provider: "aws" });

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, createNullStream(), ctx);
