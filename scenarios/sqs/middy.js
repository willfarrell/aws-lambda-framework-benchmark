import middy from "@middy/core";
import eventBatchHandler from "@middy/event-batch-handler";
import eventBatchParser from "@middy/event-batch-parser";
import { parseJson } from "@middy/event-batch-parser/parseJson";
import { eventSQS } from "../../lib/events.js";

const recordHandler = async (record) => ({ messageId: record.messageId });

const handler = middy(eventBatchHandler(recordHandler)).use(
  eventBatchParser({ body: parseJson() }),
);

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventSQS);
};
beforeEach();

export const bench = () => handler(event, ctx);
