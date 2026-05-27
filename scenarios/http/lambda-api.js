import createApi from "lambda-api";
import { eventV2 } from "../../lib/events.js";

const api = createApi();
api.get("/", () => ({ hello: "world" }));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => api.run(event, ctx);
