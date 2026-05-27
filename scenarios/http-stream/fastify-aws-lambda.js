import "../../lib/awslambda-stub.js";
import { pipeline } from "node:stream/promises";
import awsLambdaFastify from "@fastify/aws-lambda";
import Fastify from "fastify";
import { eventV2 } from "../../lib/events.js";
import { createNullStream } from "../../lib/null-stream.js";

const app = Fastify({ logger: false });
app.get("/", async () => ({ hello: "world" }));

const proxy = awsLambdaFastify(app, { payloadAsStream: true });
await app.ready();

const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const { meta, stream } = await proxy(event, context);
    const out = awslambda.HttpResponseStream.from(responseStream, meta);
    await pipeline(stream, out);
  },
);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, createNullStream(), ctx);
