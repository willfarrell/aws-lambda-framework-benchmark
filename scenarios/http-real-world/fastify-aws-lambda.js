import awsLambdaFastify from "@fastify/aws-lambda";
import Fastify from "fastify";
import { eventV2Post } from "../../lib/events.js";
import { greet, jsonSchema } from "../../lib/schema.js";

const app = Fastify({ logger: false });
app.post("/", { schema: { body: jsonSchema } }, async (req) => greet(req.body));

const handler = awsLambdaFastify(app);
await app.ready();

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => handler(event, ctx);
