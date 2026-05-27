import { AutoRouter } from "itty-router";
import { eventV2 } from "../../lib/events.js";

const router = AutoRouter();
router.get("/", () => ({ hello: "world" }));

const handler = async (event) => {
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const request = new Request(`http://localhost${event.rawPath}${qs}`, {
    method: event.requestContext.http.method,
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
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, ctx);
