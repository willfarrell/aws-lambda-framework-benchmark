import { createApp, defineEventHandler } from "h3";
import serverless from "serverless-h3";
import { eventV2 } from "../../lib/events.js";

const app = createApp();
app.use(defineEventHandler(() => ({ hello: "world" })));

const handler = serverless(app);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, ctx);
