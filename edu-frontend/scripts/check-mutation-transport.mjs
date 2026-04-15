import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const CANONICAL_TRANSPORT = path.normalize(path.join("src", "lib", "api.ts"));
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const mutationFetchPattern =
  /fetch\s*\([\s\S]{0,500}?method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/g;

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return FILE_EXTENSIONS.has(ext);
}

function collectFilesRecursively(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursively(fullPath, files);
      continue;
    }

    if (shouldScanFile(fullPath)) files.push(fullPath);
  }

  return files;
}

function toRelativePath(absolutePath) {
  return path.relative(ROOT, absolutePath);
}

function isCanonicalTransportFile(relativePath) {
  return path.normalize(relativePath) === CANONICAL_TRANSPORT;
}

function detectMutationFetchViolations() {
  const files = collectFilesRecursively(SRC_DIR);
  const violations = [];

  for (const filePath of files) {
    const relativePath = toRelativePath(filePath);
    if (isCanonicalTransportFile(relativePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(mutationFetchPattern);
    if (!matches) continue;

    violations.push({ relativePath, count: matches.length });
  }

  return violations;
}

const violations = detectMutationFetchViolations();

if (violations.length === 0) {
  console.log("[transport-audit] PASS: no raw mutation fetch callers outside src/lib/api.ts");
  process.exit(0);
}

console.error("[transport-audit] FAIL: raw mutation fetch callers detected:");
for (const violation of violations) {
  console.error(` - ${violation.relativePath} (${violation.count} match(es))`);
}
console.error(
  "[transport-audit] Route authenticated/state-changing requests through src/lib/api.ts."
);
process.exit(1);
