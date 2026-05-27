import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { eventV2 } from "../../lib/events.js";

const app = new Hono();
app.get("/", (c) => c.json({ hello: "world" }));

const handler = handle(app);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, ctx);
