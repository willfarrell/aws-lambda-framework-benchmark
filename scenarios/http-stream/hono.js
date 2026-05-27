import "../../lib/awslambda-stub.js";
import { Hono } from "hono";
import { streamHandle } from "hono/aws-lambda";
import { eventV2 } from "../../lib/events.js";
import { createNullStream } from "../../lib/null-stream.js";

const app = new Hono();
app.get("/", (c) => c.json({ hello: "world" }));

const handler = streamHandle(app);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, createNullStream(), ctx);
