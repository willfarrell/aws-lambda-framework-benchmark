import createApi from "lambda-api";
import { eventV2Post } from "../../lib/events.js";
import { greet, zodSchema } from "../../lib/schema.js";

const api = createApi();

api.post("/", (req) => greet(zodSchema.parse(req.body)));

api.use((err, _req, res, next) => {
  if (err?.name === "ZodError") {
    res.status(400).json({ error: "Bad Request", issues: err.issues });
    return;
  }
  next();
});

const ctx = {};
let event;
export const beforeEach = () => {
  event = structuredClone(eventV2Post);
};
beforeEach();

export const bench = () => api.run(event, ctx);
