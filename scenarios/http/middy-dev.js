import middy from "@middy-dev/core";
import httpRouter from "@middy-dev/http-router";
import { eventV2 } from "../../lib/events.js";

const body = JSON.stringify({ hello: "world" });
const headers = { "content-type": "application/json" };

const routes = [
  {
    method: "GET",
    path: "/",
    handler: async () => ({ statusCode: 200, headers, body }),
  },
];

const handler = middy().handler(httpRouter(routes));

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2);
};
beforeEach();

export const bench = () => handler(event, ctx);
