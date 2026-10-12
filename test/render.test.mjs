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

test("全ページが出力される", () => {
  assert.deepEqual(Object.keys(render()).sort(), [
    "404.html", "contact/index.html", "discography/index.html", "index.html", "news/index.html",
    "releases/404-humanity/index.html", "releases/cached-emotion/index.html",
  ]);
});

test("配信中の曲ページは配信ボタンと is-released を持つ", () => {
  const page = render()["releases/cached-emotion/index.html"];
  assert.match(page, /class="release is-released"/);
  assert.match(page, /href="https:\/\/open.spotify.com\/album\/7pmF8zRKoF6kwvv532XTwC"/);
  assert.match(page, /<meta property="og:image" content="https:\/\/qei.feat-entertainment.com\/assets\/artwork\/cached-emotion.jpg">/);
  assert.match(page, /<title>感情コピー \| QEI<\/title>/);
});

test("未リリースの曲ページは Coming Soon とカウントダウン", () => {
  const page = render()["releases/404-humanity/index.html"];
  assert.match(page, /class="release" data-release-date="2026-10-30"/);
  assert.match(page, /Coming Soon/);
  assert.match(page, /data-countdown="2026-10-30"/);
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

test("内部リンクはすべて出力ページか assets を指す", () => {
  const pages = render();
  const exists = (href) => {
    const p = href.replace(/^\//, "");
    return p === "" || p in pages || `${p}index.html` in pages || /^(assets\/|styles.css$|main.js$)/.test(p);
  };
  for (const [file, page] of Object.entries(pages)) {
    for (const [, href] of page.matchAll(/(?:href|src)="(\/[^"]*)"/g)) assert.ok(exists(href), `${file}: ${href}`);
  }
});

test("タイトルの HTML はエスケープされる", () => {
  const f = fixture();
  f.site.releases[0].title = "<script>x</script>";
  assert.doesNotMatch(render(f)["releases/cached-emotion/index.html"], /<script>x/);
});

test("newsItems は配信済みリリースを自動追加し、未来の記事は出さない", () => {
  const f = fixture();
  f.news.push({ date: "2026-12-01", title: "未来の記事" });
  const items = newsItems(f.site, f.news, TODAY);
  assert.deepEqual(items.map((n) => n.date), ["2026-10-09", "2026-10-01"]);
  assert.equal(items[0].url, "/releases/cached-emotion/");
});

test("トップは最新の配信中リリースと次のリリースを出す", () => {
  const top = render()["index.html"];
  assert.match(top, /class="hero[^"]*"[\s\S]*感情コピー/);
  assert.match(top, /Next Release[\s\S]*404 Humanity/);
});
