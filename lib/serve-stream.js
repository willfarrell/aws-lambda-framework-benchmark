import "./awslambda-stub.js";
import { createServer } from "node:http";
import { makeV2Event } from "./event-v2.js";

export function serveStream(handler) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer(async (req, res) => {
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      if (chunks.length) body = Buffer.concat(chunks).toString("utf8");
    }
    const event = makeV2Event(req, body);
    try {
      await handler(event, res, {});
    } catch (err) {
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
      res.end(err?.message ?? "error");
    }
  });
  server.listen(port, "127.0.0.1", () => process.send?.("ready"));
}
