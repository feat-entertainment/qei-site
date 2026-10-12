import { test } from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { build } from "../build.mjs";
import { sha256 } from "../src/forbidden.mjs";
import { fixture, writeFixtureRoot } from "./fixture.mjs";

async function setup(data) {
  const root = await mkdtemp(path.join(tmpdir(), "qei-root-"));
  await writeFixtureRoot(root, data);
  return { root, outDir: path.join(root, "site") };
}

test("ページ・アセット・CNAME を出力する", async () => {
  const { root, outDir } = await setup();
  const files = await build({ root, outDir, today: "2026-10-12" });
  assert.ok(files.includes("releases/cached-emotion/index.html"));
  for (const f of ["index.html", "styles.css", "main.js", "CNAME", ".nojekyll", "assets/logo.png", "assets/artwork/404-humanity.jpg"]) {
    await access(path.join(outDir, f));
  }
  assert.equal((await readFile(path.join(outDir, "CNAME"), "utf8")).trim(), "qei.feat-entertainment.com");
});

test("CSS / JS の URL に中身のハッシュを付け、キャッシュされた古い版を使わせない", async () => {
  const { root, outDir } = await setup();
  await build({ root, outDir, today: "2026-10-12" });
  const top = await readFile(path.join(outDir, "index.html"), "utf8");
  const css = await readFile(path.join(outDir, "styles.css"));
  const js = await readFile(path.join(outDir, "main.js"));
  const short = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);
  assert.ok(top.includes(`href="/styles.css?v=${short(css)}"`), "styles.css にハッシュが付いていない");
  assert.ok(top.includes(`src="/main.js?v=${short(js)}"`), "main.js にハッシュが付いていない");
});

test("ジャケットが無ければ曲名つきで失敗", async () => {
  const { root, outDir } = await setup();
  await rm(path.join(root, "assets/artwork/404-humanity.jpg"));
  await assert.rejects(build({ root, outDir, today: "2026-10-12" }), /404 Humanity/);
});

test("前回の出力は消してから作り直す", async () => {
  const data = fixture();
  const { root, outDir } = await setup(data);
  await build({ root, outDir, today: "2026-10-12" });
  data.site.releases.pop();
  await writeFixtureRoot(root, data);
  const files = await build({ root, outDir, today: "2026-10-12" });
  assert.ok(!files.includes("releases/404-humanity/index.html"));
  await assert.rejects(access(path.join(outDir, "releases/404-humanity/index.html")));
});

test("禁止語を含むページがあれば、ページ名つきで失敗し出力を消さない", async () => {
  const forbidden = new Set([sha256("forbiddenword")]);
  const data = fixture();
  data.site.releases[0].title = "Made with ForbiddenWord";
  const { root, outDir } = await setup(fixture());
  await build({ root, outDir, today: "2026-10-12", forbidden });
  await writeFixtureRoot(root, data);
  await assert.rejects(build({ root, outDir, today: "2026-10-12", forbidden }), (e) => /index\.html/.test(e.message) && !/forbiddenword/i.test(e.message));
  await access(path.join(outDir, "index.html"));
});
