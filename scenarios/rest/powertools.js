import { Router } from "@aws-lambda-powertools/event-handler/http";
import { eventV1 } from "../../lib/events.js";

const app = new Router();
app.get("/", async () => ({ hello: "world" }));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV1);
};
beforeEach();

export const bench = () => app.resolve(event, ctx);
