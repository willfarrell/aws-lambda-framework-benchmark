import { AutoRouter } from "itty-router";
import { eventV1 } from "../../lib/events.js";

const router = AutoRouter();
router.get("/", () => ({ hello: "world" }));

const handler = async (event) => {
  const qs = event.queryStringParameters
    ? `?${new URLSearchParams(event.queryStringParameters).toString()}`
    : "";
  const request = new Request(`http://localhost${event.path}${qs}`, {
    method: event.httpMethod,
    headers: event.headers,
  });
  const response = await router.fetch(request);
  const body = await response.text();
  const headers = {};
  for (const [k, v] of response.headers.entries()) headers[k] = v;
  return { statusCode: response.status, headers, body };
};

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV1);
};
beforeEach();

export const bench = () => handler(event, ctx);
