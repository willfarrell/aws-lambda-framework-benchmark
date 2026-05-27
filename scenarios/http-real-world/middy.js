import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpRouter from "@middy/http-router";
import validator from "@middy/validator";
import { eventV2Post } from "../../lib/events.js";
import { ajvValidate, greet } from "../../lib/schema.js";

const headers = { "content-type": "application/json" };

const routes = [
  {
    method: "POST",
    path: "/",
    handler: middy()
      .use(httpJsonBodyParser())
      .use(validator({ eventSchema: (event) => ajvValidate(event.body) }))
      .handler(async (event) => ({
        statusCode: 200,
        headers,
        body: JSON.stringify(greet(event.body)),
      })),
  },
];

const handler = middy().use(httpErrorHandler()).handler(httpRouter(routes));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => handler(event, ctx);
