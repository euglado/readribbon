import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const manifest = load("package.json");
const lock = load("package-lock.json");
assert.equal(lock.lockfileVersion, 3, "Require a modern lockfile");
const licenses = new Set(["MIT", "Apache-2.0", "MIT OR Apache-2.0", "0BSD"]);
let count = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!name) continue;
  assert.ok(licenses.has(entry.license), `Review dependency license: ${name}`);
  assert.ok(entry.resolved.startsWith("https://registry.npmjs.org/"), `Review registry: ${name}`);
  assert.match(entry.integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/, `Missing SHA-512: ${name}`);
  assert.ok(!entry.hasInstallScript, `Install script requires review: ${name}`);
  count++;
}
for (const [name, version] of Object.entries({
  ...manifest.dependencies,
  ...manifest.devDependencies,
})) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `Pin direct dependency: ${name}`);
  assert.equal(lock.packages[`node_modules/${name}`]?.version, version);
  assert.equal(
    lock.packages[""]?.dependencies?.[name] ?? lock.packages[""]?.devDependencies?.[name],
    version,
  );
}
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  new RegExp("[A-Za-z0-9_-]{23,28}" + "\\.[A-Za-z0-9_-]{6}\\.[A-Za-z0-9_-]{27,}"),
  new RegExp("gh[pousr]_" + "[A-Za-z0-9]{30,}"),
  /^DISCORD_TOKEN=[ \t]*[^ \t\r\n]/m,
];
let sources = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "coverage"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), "Unexpected symlink in source");
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (/^\.env(?:\.|$)/.test(entry.name) && entry.name !== ".env.example") continue;
    const content = readFileSync(file, "utf8");
    for (const pattern of patterns)
      assert.ok(
        !pattern.test(content),
        `Credential pattern found in ${path.relative(root, file)}; value withheld`,
      );
    sources++;
  }
}
walk(root);
console.log(
  `Supply check: ${count} dependency licenses/registry/SHA-512/no-install-script records; ${sources} source credential-pattern scans passed.`,
);
