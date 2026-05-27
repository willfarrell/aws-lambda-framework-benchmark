import createApi from "lambda-api";
import { eventV1 } from "../../lib/events.js";

const api = createApi();
api.get("/", () => ({ hello: "world" }));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV1);
};
beforeEach();

export const bench = () => api.run(event, ctx);
