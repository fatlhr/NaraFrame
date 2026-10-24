#!/usr/bin/env node
// Installs a packed naraframe tarball the way `npm install naraframe` would,
// through a local registry that serves the tarball and passes every other
// package through to registry.npmjs.org, then runs the installed engine.
//
// A file or URL install skips steps npm takes for registry packages (it reads
// a shipped npm-shrinkwrap.json only for those), so this is the check that
// catches a package which packs and installs locally but breaks once
// published. It needs network access to the public registry.
//
//   node scripts/check-registry-install.mjs <naraframe-x.y.z.tgz>
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const UPSTREAM = "https://registry.npmjs.org";
// npm talks to the registry served by this process, so it must run
// asynchronously: a synchronous child would block the server it waits on.
const run = promisify(execFile);

const tarballPath = process.argv[2];
if (!tarballPath) {
  console.error("Usage: node scripts/check-registry-install.mjs <tarball>");
  process.exit(2);
}
const tarball = await readFile(resolve(tarballPath));
const manifest = JSON.parse(
  execFileSync("tar", ["-xzOf", resolve(tarballPath), "package/package.json"], {
    encoding: "utf8",
  }),
);
const entries = execFileSync("tar", ["-tzf", resolve(tarballPath)], {
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});

const server = http.createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(request.url.split("?")[0]);
    if (path === `/${manifest.name}`) {
      const base = `http://127.0.0.1:${server.address().port}`;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          name: manifest.name,
          "dist-tags": { latest: manifest.version },
          versions: {
            [manifest.version]: {
              ...manifest,
              _hasShrinkwrap: entries.includes("package/npm-shrinkwrap.json"),
              dist: {
                tarball: `${base}/${manifest.name}/-/${manifest.name}-${manifest.version}.tgz`,
                shasum: createHash("sha1").update(tarball).digest("hex"),
                integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
              },
            },
          },
        }),
      );
      return;
    }
    if (path.startsWith(`/${manifest.name}/-/`)) {
      response.end(tarball);
      return;
    }
    const upstream = await fetch(`${UPSTREAM}${request.url}`, {
      headers: { accept: request.headers.accept ?? "*/*" },
    });
    response.statusCode = upstream.status;
    const type = upstream.headers.get("content-type");
    if (type) response.setHeader("content-type", type);
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    response.statusCode = 502;
    response.end(String(error));
  }
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const registry = `http://127.0.0.1:${server.address().port}/`;

const scratch = await mkdtemp(join(tmpdir(), "naraframe-registry-check-"));
let failure;
try {
  await run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--registry",
      registry,
      "--cache",
      join(scratch, "cache"),
      "--prefix",
      join(scratch, "install"),
      `${manifest.name}@${manifest.version}`,
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  const event = JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(
          scratch,
          "install/node_modules",
          manifest.name,
          "packages/cli/dist/index.js",
        ),
        "version",
        "--json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );
  if (!event.success || event.data?.version !== manifest.version)
    failure = `version --json answered ${JSON.stringify(event.data)}`;
} catch (error) {
  const lines = `${error.stderr ?? ""}\n${error.message}`.split("\n");
  failure =
    lines.find((line) => /^\w*Error\b/.test(line.trim()))?.trim() ??
    lines.filter(Boolean).at(-1);
} finally {
  server.closeAllConnections();
  server.close();
  await rm(scratch, { recursive: true, force: true });
}

if (failure) {
  console.error(
    `REGISTRY_INSTALL_FAILED: ${manifest.name}@${manifest.version} installed from a registry does not start: ${failure}`,
  );
  process.exit(1);
}
console.log(
  JSON.stringify({
    package: `${manifest.name}@${manifest.version}`,
    registryInstall: "ok",
  }),
);
