import "../../lib/awslambda-stub.js";
import { Router } from "@aws-lambda-powertools/event-handler/http";
import { eventV2 } from "../../lib/events.js";
import { createNullStream } from "../../lib/null-stream.js";

const app = new Router();
app.get("/", async () => ({ hello: "world" }));

const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    await app.resolveStream(event, context, { responseStream });
  },
);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, createNullStream(), ctx);
