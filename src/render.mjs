// サイトの HTML を生成する(純粋関数)。戻り値は { 出力相対パス: HTML }。
// 本体は index.html の 1 ページ。releases/<slug>/ は X 等でシェアしたときに曲のジャケットを出すための OGP 用ページで、開くとトップの曲の位置へ移動する
import { isReleased } from "./data.mjs";
import { html, raw } from "./html.mjs";
import { icon, platformIcon } from "./icons.mjs";

const fmtDate = (d) => d.replaceAll("-", ".");
const shareUrl = (r) => `/releases/${r.slug}/`;
const anchorUrl = (r) => `/#${r.slug}`;
const byDateDesc = (a, b) => (a.date ?? a.releaseDate) < (b.date ?? b.releaseDate) ? 1 : (a.date ?? a.releaseDate) > (b.date ?? b.releaseDate) ? -1 : 0;
const ext = (href, label, cls = "", iconName = null) =>
  html`<a class="${cls}" href="${href}" target="_blank" rel="noopener">${iconName ? icon(iconName) : ""}${label}</a>`;
const xHandle = (url) => `@${url.replace(/\/+$/, "").split("/").pop()}`;
/** 配信サービスのアーティストページ(profile.json の artistLinks。無ければ空) */
const artistLinkButtons = (profile) => (profile.artistLinks ?? []).map((l) => html` ${ext(l.url, l.platform, "btn", platformIcon(l.platform))}`);

function layout(ctx, { path, title, description, image, redirect, body }) {
  const { site, profile } = ctx;
  const name = site.artist.name;
  const fullTitle = title ? `${title} | ${name}` : `${name} Official Site`;
  const desc = description ?? profile.aiNotice;
  const img = image ?? site.artist.logo;
  const ogImage = img ? `${profile.siteUrl}/${img}` : null;
  return String(html`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#000000">
${redirect ? html`<meta http-equiv="refresh" content="0; url=${redirect}">` : ""}
<title>${fullTitle}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="${path === "/" ? "website" : "article"}">
<meta property="og:site_name" content="${name} Official Site">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${profile.siteUrl}${path}">
${ogImage ? html`<meta property="og:image" content="${ogImage}">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Share+Tech+Mono&display=swap">
<link rel="stylesheet" href="${ctx.assetUrls?.css ?? "/styles.css"}">
<script src="${ctx.assetUrls?.js ?? "/main.js"}" defer></script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="/">${site.artist.logo ? html`<img src="/${site.artist.logo}" alt="" width="36" height="36">` : ""}<span class="glitch" data-text="${name}">${name}</span></a>
  <nav class="nav">
    <a href="/#discography">Discography</a>
    <a href="/#news">News</a>
    <a href="/#contact">Contact</a>
    ${ext(profile.x, "X", "nav-x", "x")}
  </nav>
</header>
<main class="main">
${body}
</main>
<footer class="site-footer">
  <p class="ai-notice" lang="en">${profile.aiNotice}</p>
  <p class="footer-links">${ext(profile.x, `X ${xHandle(profile.x)}`, "", "x")}${(profile.artistLinks ?? []).map((l) => html` · ${ext(l.url, l.platform, "", platformIcon(l.platform))}`)}</p>
  <p class="copyright">© ${ctx.today.slice(0, 4)} ${profile.label}</p>
</footer>
</body>
</html>
`);
}

function linkList(r) {
  if (r.links.length) return html`<ul class="links">${r.links.map((l) => html`<li>${ext(l.url, l.platform, "btn", platformIcon(l.platform))}</li>`)}</ul>`;
  if (r.preSaveUrl) return html`<ul class="links"><li>${ext(r.preSaveUrl, "Listen", "btn btn-primary", "note")}</li></ul>`;
  return "";
}

function stateAttrs(r, today) {
  return raw(`class="%CLS%${isReleased(r, today) ? " is-released" : ""}" data-release-date="${r.releaseDate}"`);
}
const withClass = (attrs, cls) => raw(String(attrs).replace("%CLS%", cls));

function upcomingBlock(r) {
  return html`<div class="when-upcoming">
  <p class="badge">Coming Soon</p>
  <p class="countdown" data-countdown="${r.releaseDate}"></p>
  ${r.preSaveUrl ? html`<p>${ext(r.preSaveUrl, "Pre-save", "btn btn-primary", "note")}</p>` : ""}
</div>`;
}

function card(r, today) {
  return html`<li ${withClass(stateAttrs(r, today), "card")} id="${r.slug}">
  <img src="/${r.artwork}" alt="${r.title}" loading="lazy" width="600" height="600">
  <span class="card-title">${r.title}</span>
  ${r.titleEn && r.titleEn !== r.title ? html`<span class="card-title-en" lang="en">${r.titleEn}</span>` : ""}
  <span class="card-meta">${r.type} · ${fmtDate(r.releaseDate)}</span>
  ${upcomingBlock(r)}
  <div class="when-released">${linkList(r)}</div>
</li>`;
}

export function newsItems(site, news, today) {
  const auto = site.releases
    .filter((r) => isReleased(r, today))
    .map((r) => ({ date: r.releaseDate, title: `${r.type}「${r.title}」配信開始`, url: anchorUrl(r) }));
  return [...auto, ...news.filter((n) => n.date <= today)].sort(byDateDesc);
}

function newsList(items) {
  return html`<ul class="news">${items.map((n) => html`<li>
  <time datetime="${n.date}">${fmtDate(n.date)}</time>
  <div>${n.url ? html`<a href="${n.url}">${n.title}</a>` : n.title}${n.body ? html`<p>${n.body}</p>` : ""}</div>
</li>`)}</ul>`;
}

function homePage(ctx) {
  const { site, today, profile } = ctx;
  const sorted = [...site.releases].sort(byDateDesc);
  const hero = sorted.find((r) => isReleased(r, today)) ?? sorted.at(-1);
  const news = newsItems(site, ctx.news, today);
  const body = html`
${hero ? html`<section ${withClass(stateAttrs(hero, today), "hero")} id="top">
  <img class="hero-art" src="/${hero.artwork}" alt="${hero.title}" width="1200" height="1200">
  <div class="hero-info">
    <p class="eyebrow"><span class="when-released">Latest Release</span><span class="when-upcoming">Coming Soon</span></p>
    <h1 class="glitch" data-text="${hero.title}">${hero.title}</h1>
    <p class="release-date">${hero.type} · ${fmtDate(hero.releaseDate)}</p>
    ${upcomingBlock(hero)}
    <div class="when-released">${linkList(hero)}</div>
  </div>
</section>` : ""}
<section class="intro">
  <p class="ai-notice" lang="en">${profile.aiNotice}</p>
  <p class="intro-links">${ext(profile.x, `Follow ${xHandle(profile.x)} on X`, "btn", "x")}${artistLinkButtons(profile)}</p>
</section>
<section class="section" id="discography">
  <h2 class="section-title">Discography</h2>
  <ul class="cards">${sorted.map((r) => card(r, today))}</ul>
</section>
<section class="section" id="news">
  <h2 class="section-title">News</h2>
  ${news.length ? newsList(news) : html`<p class="muted">お知らせはまだありません。</p>`}
</section>
<section class="section contact" id="contact">
  <h2 class="section-title">Contact</h2>
  <p>お仕事のご依頼・お問い合わせは、所属レーベル ${profile.label} までご連絡ください。</p>
  <p><a class="btn btn-primary" href="mailto:${profile.contactEmail}">${icon("mail")}${profile.contactEmail}</a></p>
  <p>${ext(profile.companyUrl, `${profile.label} Website`, "btn", "globe")} ${ext(profile.x, `X ${xHandle(profile.x)}`, "btn", "x")}</p>
</section>`;
  return layout(ctx, { path: "/", body });
}

/** シェア用ページ: 曲の OGP を持ち、開くとトップの曲の位置へ移動する */
function sharePage(ctx, r) {
  const body = html`<p class="redirect"><a href="${anchorUrl(r)}">${r.title}</a></p>`;
  return layout(ctx, {
    path: shareUrl(r),
    title: r.title,
    description: `${ctx.site.artist.name}「${r.title}」${fmtDate(r.releaseDate)} Release`,
    image: r.artwork,
    redirect: anchorUrl(r),
    body,
  });
}

function notFoundPage(ctx) {
  const body = html`<section class="not-found">
  <h1 class="glitch" data-text="404">404</h1>
  <p>ページが見つかりません。</p>
  <p><a class="btn" href="/">Top</a></p>
</section>`;
  return layout(ctx, { path: "/404.html", title: "Not Found", body });
}

export function renderSite(ctx) {
  const pages = { "index.html": homePage(ctx), "404.html": notFoundPage(ctx) };
  for (const r of ctx.site.releases) pages[`releases/${r.slug}/index.html`] = sharePage(ctx, r);
  return pages;
}
