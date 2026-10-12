import { test } from "node:test";
import assert from "node:assert/strict";
import { html, raw } from "../src/html.mjs";
import { newsItems, renderSite } from "../src/render.mjs";
import { hasForbiddenWord, sha256 } from "../src/forbidden.mjs";
import { fixture } from "./fixture.mjs";

const TODAY = "2026-10-12"; // 感情コピーは配信中、404 Humanity は未リリース
const render = (f = fixture(), today = TODAY) => renderSite({ ...f, today });

test("html は値をエスケープし raw はそのまま", () => {
  assert.equal(String(html`<p title="${'"<x>'}">${raw("<b>ok</b>")}</p>`), '<p title="&quot;&lt;x&gt;">' + "<b>ok</b></p>");
});

test("トップ 1 ページ + 404 + 曲ごとのシェア用ページを出力する", () => {
  assert.deepEqual(Object.keys(render()).sort(), [
    "404.html", "index.html", "releases/404-humanity/index.html", "releases/cached-emotion/index.html",
  ]);
});

test("トップに Discography・News・Contact のセクションがある", () => {
  const top = render()["index.html"];
  for (const id of ["discography", "news", "contact"]) assert.match(top, new RegExp(`<section[^>]* id="${id}"`));
  assert.match(top, /href="mailto:info@feat-entertainment.com"/);
});

test("配信中の曲カードは配信ボタンと is-released を持つ", () => {
  const top = render()["index.html"];
  assert.match(top, /<li class="card is-released" data-release-date="2026-10-09" id="cached-emotion">[\s\S]*?open.spotify.com\/album\/7pmF8zRKoF6kwvv532XTwC[\s\S]*?<\/li>/);
});

test("未リリースの曲カードは Coming Soon とカウントダウン", () => {
  const top = render()["index.html"];
  assert.match(top, /<li class="card" data-release-date="2026-10-30" id="404-humanity">[\s\S]*?Coming Soon[\s\S]*?data-countdown="2026-10-30"[\s\S]*?<\/li>/);
});

test("シェア用ページは曲の OGP を持ち、トップの曲の位置へ移動する", () => {
  const page = render()["releases/cached-emotion/index.html"];
  assert.match(page, /<meta property="og:image" content="https:\/\/qei.feat-entertainment.com\/assets\/artwork\/cached-emotion.jpg">/);
  assert.match(page, /<meta property="og:url" content="https:\/\/qei.feat-entertainment.com\/releases\/cached-emotion\/">/);
  assert.match(page, /<title>感情コピー \| QEI<\/title>/);
  assert.match(page, /<meta http-equiv="refresh" content="0; url=\/#cached-emotion">/);
  assert.doesNotMatch(render()["index.html"], /http-equiv="refresh"/);
});

test("AI 制作の公言は全ページにあり、ツール名・非公開情報は出ない", () => {
  const f = fixture();
  for (const [file, page] of Object.entries(render(f))) {
    assert.ok(page.includes(f.profile.aiNotice), `${file} に AI 公言がない`);
    assert.equal(hasForbiddenWord(page), false, `${file} に公開禁止語がある`);
  }
});

test("hasForbiddenWord は語単位・大小文字無視で照合する", () => {
  const hashes = new Set([sha256("secretword")]);
  assert.equal(hasForbiddenWord("<p>Made with SecretWord.</p>", hashes), true);
  assert.equal(hasForbiddenWord("<p>secretwords</p>", hashes), false);
  assert.equal(hasForbiddenWord("<p>nothing here</p>", hashes), false);
});

test("ロゴ設定時もヘッダーにアーティスト名が出る", () => {
  const page = render()["index.html"];
  assert.match(page, /<img src="\/[^"]+" alt="" width="36" height="36">/);
  assert.match(page, /class="brand"[^>]*>.*<span class="glitch"/s);
});

test("X へのリンクが全ページにある", () => {
  for (const page of Object.values(render())) assert.match(page, /href="https:\/\/x.com\/QEIrdz"/);
});

test("内部リンクはすべて出力ページ・assets・トップのセクションを指す", () => {
  const pages = render();
  const exists = (href) => {
    const [p, frag] = href.replace(/^\//, "").split("#");
    if (frag) return p === "" && pages["index.html"].includes(`id="${frag}"`);
    return p === "" || p in pages || `${p}index.html` in pages || /^(assets\/|styles.css$|main.js$)/.test(p);
  };
  for (const [file, page] of Object.entries(pages)) {
    for (const [, href] of page.matchAll(/(?:href|src)="(\/[^"]*)"/g)) assert.ok(exists(href), `${file}: ${href}`);
  }
});

test("タイトルの HTML はエスケープされる", () => {
  const f = fixture();
  f.site.releases[0].title = "<script>x</script>";
  for (const page of Object.values(render(f))) assert.doesNotMatch(page, /<script>x/);
});

test("newsItems は配信済みリリースを自動追加し、未来の記事は出さない", () => {
  const f = fixture();
  f.news.push({ date: "2026-12-01", title: "未来の記事" });
  const items = newsItems(f.site, f.news, TODAY);
  assert.deepEqual(items.map((n) => n.date), ["2026-10-09", "2026-10-01"]);
  assert.equal(items[0].url, "/#cached-emotion");
});

test("ヒーローは最新の配信中リリース、無ければ最も近い未リリース", () => {
  assert.match(render()["index.html"], /class="hero is-released"[^>]*>[\s\S]*?感情コピー/);
  const f = fixture();
  f.site.releases[0].releaseDate = "2026-11-01";
  assert.match(render(f)["index.html"], /class="hero"[^>]*>[\s\S]*?404 Humanity/);
});
