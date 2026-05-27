import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ROOT_README = join(ROOT, "README.md");

const SOURCES = [
  { pkg: "@middy/core" },
  { pkg: "@aws-lambda-powertools/event-handler" },
  { pkg: "@codegenie/serverless-express" },
  { pkg: "@fastify/aws-lambda" },
  { pkg: "serverless-h3" },
  { pkg: "hono", label: "hono/aws-lambda" },
  { pkg: "itty-router" },
  { pkg: "lambda-api" },
  { pkg: "serverless-http" },
];

async function main() {
  const rows = SOURCES.map(({ pkg, label }) => ({ pkg, label: label ?? pkg }));
  rows.sort((a, b) => a.label.localeCompare(b.label));

  const body = rows
    .map(
      ({ pkg, label }) =>
        `- [\`${label}\`](https://www.npmjs.com/package/${pkg})`,
    )
    .join("\n");

  const marker = "<!-- sources -->";
  const block = `${marker}\n\n${body}\n\n${marker}`;
  const pattern = new RegExp(`${marker}[\\s\\S]*?${marker}`);

  const content = await readFile(ROOT_README, "utf8");
  let next;
  if (pattern.test(content)) {
    next = content.replace(pattern, block);
  } else {
    next = `${content.replace(/\s+$/, "")}\n\n## Sources\n\n${block}\n`;
  }
  await writeFile(ROOT_README, next);
  console.log(`Updated Sources list (${rows.length} packages).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
