import { createServer } from "node:http";

export function serveInvoke(handler) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    let event = {};
    if (chunks.length) {
      try {
        event = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {}
    }
    try {
      const result = await handler(event, {});
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result ?? null));
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(err?.message ?? "error");
    }
  });
  server.listen(port, "127.0.0.1", () => process.send?.("ready"));
}
