import { AutoRouter, error } from "itty-router";
import { eventV2Post } from "../../lib/events.js";
import { greet, zodSchema } from "../../lib/schema.js";

const router = AutoRouter({
  catch: (err) =>
    err?.name === "ZodError"
      ? error(400, { error: "Bad Request", issues: err.issues })
      : error(500, { error: "Internal Server Error" }),
});

router.post("/", async (request) => {
  const body = zodSchema.parse(await request.json());
  return greet(body);
});

const handler = async (event) => {
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const request = new Request(`http://localhost${event.rawPath}${qs}`, {
    method: event.requestContext.http.method,
    headers: event.headers,
    body: event.body,
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
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => handler(event, ctx);
