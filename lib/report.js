import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SUBDIR = process.env.RESULTS_SUBDIR ?? "local";
const RESULTS_DIR = join(ROOT, "results", SUBDIR);
const RESULTS_README = join(RESULTS_DIR, "README.md");
const ROOT_README = join(ROOT, "README.md");
const CANONICAL_SUBDIR = "lambda-512MB";

export function buildMarkdownTable(rows) {
  if (rows.length === 0) return "";
  // Union of keys across rows so failed candidates (which carry an `error`
  // field instead of latency numbers) still surface their reason.
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((r) => `| ${headers.map((h) => r[h] ?? "").join(" | ")} |`)
    .join("\n");
  return `${head}\n${sep}\n${body}\n`;
}

export function buildChartConfig(displayName, rows) {
  const valid = rows.filter((r) => !r.error && r["p50 ns"] != null);
  const labels = valid.map((r) => r.candidate);
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "p99 (µs)",
          data: valid.map((r) => +(r["p99 ns"] / 1000).toFixed(3)),
          backgroundColor:
            "__RAW__pattern.draw('diagonal-right-left', '#f97316', '#7c2d12', 22)",
          borderWidth: 0,
          grouped: false,
          order: 2,
        },
        {
          label: "p50 (µs)",
          data: valid.map((r) => +(r["p50 ns"] / 1000).toFixed(3)),
          backgroundColor: "#15803d",
          borderWidth: 0,
          grouped: false,
          order: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: {
        title: {
          display: true,
          text: `${displayName} — latency (µs, lower is better)`,
        },
        legend: { position: "top" },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "latency (µs)" },
        },
      },
    },
  };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function injectScenario(
  path,
  scenarioSlug,
  displayName,
  table,
  imgPath,
  defaultIntro,
) {
  let content;
  try {
    content = await readFile(path, "utf8");
  } catch {
    content = defaultIntro;
  }
  const marker = `<!-- bench:${scenarioSlug} -->`;
  const pattern = new RegExp(
    `${escapeRegex(marker)}[\\s\\S]*?${escapeRegex(marker)}`,
  );
  const block = `${marker}\n\n${table}\n${marker}`;
  if (pattern.test(content)) {
    content = content.replace(pattern, block);
  } else {
    content += `\n## ${displayName}\n\n![${displayName}](${imgPath})\n\n${block}\n`;
  }
  await writeFile(path, content);
}

function tierLabel() {
  if (SUBDIR === "local") return "local Node";
  const m = SUBDIR.match(/^lambda-(\d+)MB$/);
  return m ? `Lambda ${m[1]} MB / 1 core` : SUBDIR;
}

function slimIntro() {
  return [
    `# Benchmark results — ${tierLabel()}`,
    "",
    "Each candidate is benchmarked with tinybench in its own isolated process (one wrapper at a time, mirroring a real Lambda). Lower p50/p99 is better; `OOM` means the wrapper exceeded this memory tier.",
    "",
  ].join("\n");
}

function rootIntro() {
  return [
    "# aws-lambda-framework-benchmark",
    "",
    "tinybench benchmark comparing AWS Lambda wrappers across REST, HTTP, HTTP (real world), HTTP streaming, SQS, and SNS events. Each candidate runs in its own isolated process (one wrapper at a time, mirroring a real Lambda). Lower p50/p99 is better.",
    "",
    `Numbers below are from [\`results/${CANONICAL_SUBDIR}/\`](results/${CANONICAL_SUBDIR}/) (Lambda 512 MB / 1 core). Other tiers:`,
    "",
    "- [Lambda 128 MB](results/lambda-128MB/README.md)",
    "- [Lambda 256 MB](results/lambda-256MB/README.md)",
    "- [Lambda 512 MB](results/lambda-512MB/README.md) — canonical",
    "- [Lambda 1024 MB](results/lambda-1024MB/README.md)",
    "- [local Node](results/local/README.md)",
    "",
    "```sh",
    "npm install",
    "npm run bench                 # all scenarios, local Node",
    "npm run bench:http            # single scenario, local Node",
    "npm run bench:docker          # all scenarios across Lambda memory tiers",
    "```",
    "",
  ].join("\n");
}

function jsLiteral(value) {
  if (value === null) return "null";
  if (typeof value === "string") {
    if (value.startsWith("__RAW__")) return value.slice(7);
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return `[${value.map(jsLiteral).join(",")}]`;
  if (typeof value === "object") {
    const parts = Object.entries(value).map(
      ([k, v]) => `${JSON.stringify(k)}: ${jsLiteral(v)}`,
    );
    return `{${parts.join(",")}}`;
  }
  return JSON.stringify(value);
}

async function fetchPng(scenarioName, chart) {
  try {
    const res = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: "4",
        format: "png",
        width: 900,
        height: Math.max(220, 60 + chart.data.labels.length * 40),
        chart: jsLiteral(chart),
      }),
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(join(RESULTS_DIR, `${scenarioName}.png`), buf);
    } else {
      console.warn(`  quickchart.io: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.warn(`  quickchart fetch failed: ${err.message}`);
  }
}

export async function writeReport(scenarioSlug, displayName, rows) {
  await mkdir(RESULTS_DIR, { recursive: true });

  const markdown = buildMarkdownTable(rows);
  const chart = buildChartConfig(displayName, rows);

  await writeFile(
    join(RESULTS_DIR, `${scenarioSlug}.json`),
    JSON.stringify(chart, null, 2),
  );
  await fetchPng(scenarioSlug, chart);

  await injectScenario(
    RESULTS_README,
    scenarioSlug,
    displayName,
    markdown,
    `${scenarioSlug}.png`,
    slimIntro(),
  );

  if (SUBDIR === CANONICAL_SUBDIR) {
    await injectScenario(
      ROOT_README,
      scenarioSlug,
      displayName,
      markdown,
      `results/${SUBDIR}/${scenarioSlug}.png`,
      rootIntro(),
    );
  }
}
