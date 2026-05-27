import { Router } from "@aws-lambda-powertools/event-handler/http";
import { parse } from "@aws-lambda-powertools/parser";
import { eventV2Post } from "../../lib/events.js";
import { greet, zodSchema } from "../../lib/schema.js";

const app = new Router();
app.post("/", async ({ req }) => {
  const body = parse(await req.json(), undefined, zodSchema);
  return greet(body);
});

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => app.resolve(event, ctx);
