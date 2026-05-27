import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from "@aws-lambda-powertools/batch";
import { eventSQS } from "../../lib/events.js";

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record) => ({ messageId: record.messageId });

const handler = (event, context) =>
  processPartialResponse(event, recordHandler, processor, { context });

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventSQS);
};
beforeEach();

export const bench = () => handler(event, ctx);
