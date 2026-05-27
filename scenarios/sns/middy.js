import middy from "@middy/core";
import { eventSNS } from "../../lib/events.js";

const handler = middy().handler(async (event) => ({
  ok: true,
  records: event.Records.length,
}));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventSNS);
};
beforeEach();

export const bench = () => handler(event, ctx);
