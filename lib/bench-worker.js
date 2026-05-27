// Runs a single benchmark candidate in its own process so that only one
// framework is ever resident at a time. This keeps memory low enough to run
// every scenario even on small Lambda tiers (128/256 MB) and better mirrors
// real Lambda, where a function loads exactly one wrapper.
//
// Usage: node lib/bench-worker.js <absolute-candidate-file> <display-name>
// Emits one line to stdout: __BENCH_RESULT__<json-row>
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Bench } from "tinybench";

const TIME = Number(process.env.TIME) || 1000;
const WARMUP = Number(process.env.WARMUP) || 100;
const ITERATIONS = Number(process.env.ITERATIONS) || 10;

const RESULT_PREFIX = "__BENCH_RESULT__";
const [, , file, name] = process.argv;
// Resolve against cwd so both an absolute host path (local mode) and a path
// relative to the container WORKDIR (docker mode) import correctly.
const fileUrl = pathToFileURL(resolve(file)).href;

const emit = (row) => {
  process.stdout.write(`${RESULT_PREFIX}${JSON.stringify(row)}\n`);
};

try {
  const mod = await import(fileUrl);
  if (typeof mod.bench !== "function") {
    emit({ candidate: name, error: "no bench export" });
    process.exit(0);
  }
  const bench = new Bench({
    name,
    time: TIME,
    warmupIterations: WARMUP,
    iterations: ITERATIONS,
  });
  bench.add(name, mod.bench, { beforeEach: mod.beforeEach });
  await bench.run();
  const r = bench.tasks[0]?.result;
  if (!r || r.error || !r.latency || !r.throughput) {
    emit({ candidate: name, error: r?.error?.message ?? "no result" });
    process.exit(0);
  }
  emit({
    candidate: name,
    "p50 ns": Math.round(r.latency.p50 * 1e6),
    "p99 ns": Math.round(r.latency.p99 * 1e6),
    "ops/sec": Math.round(r.throughput.mean).toLocaleString(),
  });
} catch (err) {
  emit({ candidate: name, error: err.message });
  process.exit(0);
}
