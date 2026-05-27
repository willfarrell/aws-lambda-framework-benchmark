import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { HTTPException } from "hono/http-exception";
import { eventV2Post } from "../../lib/events.js";
import { greet, zodSchema } from "../../lib/schema.js";

const app = new Hono();

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  return c.json({ error: "Internal Server Error" }, 500);
});

app.post("/", zValidator("json", zodSchema), (c) =>
  c.json(greet(c.req.valid("json"))),
);

const handler = handle(app);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => handler(event, ctx);
