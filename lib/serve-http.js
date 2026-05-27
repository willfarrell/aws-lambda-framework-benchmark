import { createServer } from "node:http";
import { makeV2Event } from "./event-v2.js";

export function serveHttp(handler) {
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
      const result = await handler(event, {});
      const status = result?.statusCode ?? 200;
      const headers = result?.headers ?? { "content-type": "application/json" };
      res.writeHead(status, headers);
      res.end(result?.body ?? "");
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(err?.message ?? "error");
    }
  });
  server.listen(port, "127.0.0.1", () => process.send?.("ready"));
}
