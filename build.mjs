// data/ と assets/ から site/ に静的サイトを生成する。`node build.mjs`
import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jstToday, loadData } from "./src/data.mjs";
import { FORBIDDEN_HASHES, hasForbiddenWord } from "./src/forbidden.mjs";
import { renderSite } from "./src/render.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

async function mustExist(file, label) {
  try {
    await access(file);
  } catch {
    throw new Error(`${label} がありません: ${path.relative(HERE, file) || file}`);
  }
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function build({ root = HERE, outDir = path.join(HERE, "site"), today = jstToday(), forbidden = FORBIDDEN_HASHES } = {}) {
  const data = await loadData(path.join(root, "data"));
  for (const r of data.site.releases) await mustExist(path.join(root, r.artwork), `「${r.title}」のジャケット`);
  if (data.site.artist.logo) await mustExist(path.join(root, data.site.artist.logo), "ロゴ");

  // CSS / JS は中身のハッシュを URL に付ける(ブラウザに古い版をキャッシュから使わせない)
  const version = async (f) => createHash("sha256").update(await readFile(path.join(HERE, "src", f))).digest("hex").slice(0, 10);
  const assetUrls = { css: `/styles.css?v=${await version("styles.css")}`, js: `/main.js?v=${await version("main.js")}` };

  const pages = renderSite({ ...data, today, assetUrls });
  for (const [rel, body] of Object.entries(pages)) {
    // 語そのものはログ(公開される Actions ログ)に出さない
    if (hasForbiddenWord(body, forbidden)) throw new Error(`${rel} に公開禁止語が含まれています`);
  }
  await rm(outDir, { recursive: true, force: true });
  for (const [rel, body] of Object.entries(pages)) {
    const file = path.join(outDir, rel);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }
  if (await exists(path.join(root, "assets"))) {
    await cp(path.join(root, "assets"), path.join(outDir, "assets"), { recursive: true });
  }
  for (const f of ["styles.css", "main.js"]) await cp(path.join(HERE, "src", f), path.join(outDir, f));
  await cp(path.join(HERE, "CNAME"), path.join(outDir, "CNAME"));
  await writeFile(path.join(outDir, ".nojekyll"), "");
  return Object.keys(pages);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await build();
  console.log(`${files.length} pages → site/`);
}
