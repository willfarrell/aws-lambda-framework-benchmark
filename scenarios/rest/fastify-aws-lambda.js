import awsLambdaFastify from "@fastify/aws-lambda";
import Fastify from "fastify";
import { eventV1 } from "../../lib/events.js";

const app = Fastify({ logger: false });
app.get("/", async () => ({ hello: "world" }));

const handler = awsLambdaFastify(app);
await app.ready();

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV1);
};
beforeEach();

export const bench = () => handler(event, ctx);
