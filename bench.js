import { spawn } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { writeReport } from "./lib/report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = join(__dirname, "lib", "bench-worker.js");
const RESULT_PREFIX = "__BENCH_RESULT__";

const TIME = Number(process.env.TIME) || 1000;
const WARMUP = Number(process.env.WARMUP) || 100;
const ITERATIONS = Number(process.env.ITERATIONS) || 10;

// Docker mode: when BENCH_DOCKER_IMAGE is set, each candidate runs in its own
// container with the full tier memory/cores — so a single framework gets the
// whole Lambda memory allotment, exactly as it would in production. The
// orchestrator stays on the host and never imports a framework.
const DOCKER_IMAGE = process.env.BENCH_DOCKER_IMAGE;
const DOCKER_MEM = process.env.BENCH_DOCKER_MEM;
const DOCKER_CPUS = process.env.BENCH_DOCKER_CPUS;
const DOCKER_CPUSET = process.env.BENCH_DOCKER_CPUSET;

const displayNames = {
  rest: "REST Event",
  http: "HTTP Event",
  "http-real-world": "HTTP Event (Real World)",
  "http-stream": "HTTP Event (w/ Stream Response)",
  sqs: "SQS Event",
  sns: "SNS Event",
};

const scenarios = {
  rest: [
    { name: "@middy/core + @middy/http-router", file: "scenarios/rest/middy.js" },
    { name: "@codegenie/serverless-express", file: "scenarios/rest/serverless-express.js" },
    { name: "@fastify/aws-lambda", file: "scenarios/rest/fastify-aws-lambda.js" },
    { name: "lambda-api", file: "scenarios/rest/lambda-api.js" },
    { name: "serverless-http (express)", file: "scenarios/rest/serverless-http.js" },
    { name: "hono (hono/aws-lambda)", file: "scenarios/rest/hono.js" },
    { name: "@aws-lambda-powertools/event-handler", file: "scenarios/rest/powertools.js" },
    { name: "itty-router", file: "scenarios/rest/itty-router.js" },
  ],
  http: [
    { name: "@middy/core + @middy/http-router", file: "scenarios/http/middy.js" },
    { name: "@codegenie/serverless-express", file: "scenarios/http/serverless-express.js" },
    { name: "@fastify/aws-lambda", file: "scenarios/http/fastify-aws-lambda.js" },
    { name: "lambda-api", file: "scenarios/http/lambda-api.js" },
    { name: "serverless-http (express)", file: "scenarios/http/serverless-http.js" },
    { name: "hono (hono/aws-lambda)", file: "scenarios/http/hono.js" },
    { name: "@aws-lambda-powertools/event-handler", file: "scenarios/http/powertools.js" },
    { name: "itty-router", file: "scenarios/http/itty-router.js" },
  ],
  "http-real-world": [
    { name: "@middy/core + @middy/http-router", file: "scenarios/http-real-world/middy.js" },
    { name: "@codegenie/serverless-express", file: "scenarios/http-real-world/serverless-express.js" },
    { name: "@fastify/aws-lambda", file: "scenarios/http-real-world/fastify-aws-lambda.js" },
    { name: "lambda-api", file: "scenarios/http-real-world/lambda-api.js" },
    { name: "serverless-http (express)", file: "scenarios/http-real-world/serverless-http.js" },
    { name: "hono (hono/aws-lambda)", file: "scenarios/http-real-world/hono.js" },
    { name: "@aws-lambda-powertools/event-handler", file: "scenarios/http-real-world/powertools.js" },
    { name: "itty-router", file: "scenarios/http-real-world/itty-router.js" },
  ],
  "http-stream": [
    { name: "@middy/core + @middy/http-router", file: "scenarios/http-stream/middy.js" },
    { name: "@fastify/aws-lambda (payloadAsStream)", file: "scenarios/http-stream/fastify-aws-lambda.js" },
    { name: "@aws-lambda-powertools/event-handler (resolveStream)", file: "scenarios/http-stream/powertools.js" },
    { name: "hono (streamHandle)", file: "scenarios/http-stream/hono.js" },
  ],
  sqs: [
    { name: "@middy/core (event-batch-handler + event-batch-parser)", file: "scenarios/sqs/middy.js" },
    { name: "@aws-lambda-powertools/batch (BatchProcessor)", file: "scenarios/sqs/powertools.js" },
    { name: "@codegenie/serverless-express (eventSourceRoutes)", file: "scenarios/sqs/serverless-express.js" },
  ],
  sns: [
    { name: "@middy/core", file: "scenarios/sns/middy.js" },
    { name: "@codegenie/serverless-express (eventSourceRoutes)", file: "scenarios/sns/serverless-express.js" },
  ],
};

// Build the command for one candidate. Local mode runs the worker directly;
// docker mode runs it inside a fresh, memory-capped container.
function candidateCommand(file, name) {
  if (DOCKER_IMAGE) {
    const rel = relative(__dirname, file); // e.g. scenarios/rest/middy.js
    return [
      "docker",
      [
        "run", "--rm",
        `--cpus=${DOCKER_CPUS}`,
        `--cpuset-cpus=${DOCKER_CPUSET}`,
        `--memory=${DOCKER_MEM}m`,
        `--memory-swap=${DOCKER_MEM}m`,
        "--tmpfs", "/tmp:size=512m,mode=1777",
        "-e", `TIME=${TIME}`,
        "-e", `WARMUP=${WARMUP}`,
        "-e", `ITERATIONS=${ITERATIONS}`,
        "-e", `AWS_LAMBDA_FUNCTION_MEMORY_SIZE=${DOCKER_MEM}`,
        DOCKER_IMAGE,
        "lib/bench-worker.js", rel, name,
      ],
    ];
  }
  return [process.execPath, [WORKER, file, name]];
}

// Each candidate runs in its own process/container: only one wrapper is ever
// resident, so even small Lambda tiers stay under their memory limit. A crash
// (OOM -> exit 137 from docker, or SIGKILL locally) becomes an error row
// instead of aborting the whole run.
function runCandidate(file, name) {
  const [cmd, args] = candidateCommand(file, name);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: process.env,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.on("error", (err) =>
      resolve({ candidate: name, error: `spawn failed: ${err.message}` }),
    );
    child.on("close", (code, signal) => {
      const line = out.split("\n").find((l) => l.startsWith(RESULT_PREFIX));
      if (line) {
        try {
          return resolve(JSON.parse(line.slice(RESULT_PREFIX.length)));
        } catch {
          /* fall through to error row */
        }
      }
      const oom = code === 137 || signal === "SIGKILL";
      resolve({
        candidate: name,
        error: oom ? "OOM" : `worker exit ${code ?? signal}`,
      });
    });
  });
}

const filter = process.argv[2];
const entries = Object.entries(scenarios).filter(([k]) => !filter || k === filter);
if (entries.length === 0) {
  console.error(`Unknown scenario: ${filter}. Available: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}

const mode = DOCKER_IMAGE
  ? `docker ${DOCKER_MEM}MB/${DOCKER_CPUS}core per candidate`
  : "local per-candidate";
console.log(`Config: time=${TIME}ms warmup=${WARMUP} iterations=${ITERATIONS} node=${process.version} (${mode} isolation)`);

for (const [scenarioName, candidates] of entries) {
  const displayName = displayNames[scenarioName] ?? scenarioName;
  console.log(`\n=== ${displayName} ===`);
  const rows = [];
  for (const c of candidates) {
    rows.push(await runCandidate(join(__dirname, c.file), c.name));
  }
  rows.sort(
    (a, b) => (a["p50 ns"] ?? Infinity) - (b["p50 ns"] ?? Infinity),
  );
  console.table(rows);
  await writeReport(scenarioName, displayName, rows);
}
