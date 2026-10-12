// サイト全ページの HTML を生成する(純粋関数)。戻り値は { 出力相対パス: HTML }
import { isReleased } from "./data.mjs";
import { html, raw } from "./html.mjs";

const fmtDate = (d) => d.replaceAll("-", ".");
const releaseUrl = (r) => `/releases/${r.slug}/`;
const byDateDesc = (a, b) => (a.date ?? a.releaseDate) < (b.date ?? b.releaseDate) ? 1 : (a.date ?? a.releaseDate) > (b.date ?? b.releaseDate) ? -1 : 0;
const current = (on) => (on ? raw(' aria-current="page"') : "");
const ext = (href, label, cls = "") => html`<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
const xHandle = (url) => `@${url.replace(/\/+$/, "").split("/").pop()}`;

function layout(ctx, { path, title, description, image, body }) {
  const { site, profile } = ctx;
  const name = site.artist.name;
  const fullTitle = title ? `${title} | ${name}` : `${name} Official Site`;
  const desc = description ?? profile.aiNotice;
  const img = image ?? site.artist.logo;
  const ogImage = img ? `${profile.siteUrl}/${img}` : null;
  const section = path.split("/")[1];
  return String(html`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#000000">
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
<link rel="stylesheet" href="/styles.css">
<script src="/main.js" defer></script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="/">${site.artist.logo ? html`<img src="/${site.artist.logo}" alt="" width="36" height="36">` : ""}<span class="glitch" data-text="${name}">${name}</span></a>
  <nav class="nav">
    <a href="/discography/"${current(section === "discography" || section === "releases")}>Discography</a>
    <a href="/news/"${current(section === "news")}>News</a>
    <a href="/contact/"${current(section === "contact")}>Contact</a>
    ${ext(profile.x, "X", "nav-x")}
  </nav>
</header>
<main class="main">
${body}
</main>
<footer class="site-footer">
  <p class="ai-notice" lang="en">${profile.aiNotice}</p>
  <p>${ext(profile.x, `X ${xHandle(profile.x)}`)}</p>
  <p class="copyright">© ${ctx.today.slice(0, 4)} ${profile.label}</p>
</footer>
</body>
</html>
`);
}

function linkList(r) {
  if (r.links.length) return html`<ul class="links">${r.links.map((l) => html`<li>${ext(l.url, l.platform, "btn")}</li>`)}</ul>`;
  if (r.preSaveUrl) return html`<ul class="links"><li>${ext(r.preSaveUrl, "Listen", "btn btn-primary")}</li></ul>`;
  return "";
}

function stateAttrs(r, today) {
  return raw(`class="%CLS%${isReleased(r, today) ? " is-released" : ""}" data-release-date="${r.releaseDate}"`);
}
const withClass = (attrs, cls) => raw(String(attrs).replace("%CLS%", cls));

function card(r, today) {
  return html`<li ${withClass(stateAttrs(r, today), "card")}>
  <a href="${releaseUrl(r)}">
    <img src="/${r.artwork}" alt="${r.title}" loading="lazy" width="600" height="600">
    <span class="card-title">${r.title}</span>
    <span class="card-meta">${r.type} · ${fmtDate(r.releaseDate)}</span>
    <span class="badge when-upcoming">Coming Soon</span>
  </a>
</li>`;
}

function upcomingBlock(r) {
  return html`<div class="when-upcoming">
  <p class="badge">Coming Soon</p>
  <p class="countdown" data-countdown="${r.releaseDate}"></p>
  ${r.preSaveUrl ? html`<p>${ext(r.preSaveUrl, "Pre-save", "btn btn-primary")}</p>` : ""}
</div>`;
}

function releasePage(ctx, r) {
  const body = html`<article ${withClass(stateAttrs(r, ctx.today), "release")}>
  <img class="release-art" src="/${r.artwork}" alt="${r.title}" width="1200" height="1200">
  <div class="release-info">
    <p class="eyebrow">${r.type}</p>
    <h1 class="glitch" data-text="${r.title}">${r.title}</h1>
    ${r.titleEn && r.titleEn !== r.title ? html`<p class="title-en" lang="en">${r.titleEn}</p>` : ""}
    <p class="release-date">${fmtDate(r.releaseDate)} Release</p>
    ${upcomingBlock(r)}
    <div class="when-released">${linkList(r)}</div>
    <p class="ai-notice small" lang="en">${ctx.profile.aiNotice}</p>
    <p><a class="back" href="/discography/">← Discography</a></p>
  </div>
</article>`;
  return layout(ctx, { path: releaseUrl(r), title: r.title, description: `${ctx.site.artist.name}「${r.title}」${fmtDate(r.releaseDate)} Release`, image: r.artwork, body });
}

export function newsItems(site, news, today) {
  const auto = site.releases
    .filter((r) => isReleased(r, today))
    .map((r) => ({ date: r.releaseDate, title: `${r.type}「${r.title}」配信開始`, url: releaseUrl(r) }));
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
  const released = sorted.filter((r) => isReleased(r, today));
  const upcoming = sorted.filter((r) => !isReleased(r, today)).reverse();
  const hero = released[0] ?? upcoming[0];
  const next = released[0] ? upcoming[0] : upcoming[1];
  const news = newsItems(site, ctx.news, today).slice(0, 3);
  const body = html`
${hero ? html`<section ${withClass(stateAttrs(hero, today), "hero")}>
  <a href="${releaseUrl(hero)}"><img class="hero-art" src="/${hero.artwork}" alt="${hero.title}" width="1200" height="1200"></a>
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
  <p>${ext(profile.x, `Follow ${xHandle(profile.x)} on X`, "btn")}</p>
</section>
${next ? html`<section class="next">
  <h2 class="section-title">Next Release</h2>
  <ul class="cards">${card(next, today)}</ul>
  <p class="countdown" data-countdown="${next.releaseDate}"></p>
</section>` : ""}
${news.length ? html`<section>
  <h2 class="section-title">News</h2>
  ${newsList(news)}
  <p><a class="more" href="/news/">All News →</a></p>
</section>` : ""}`;
  return layout(ctx, { path: "/", body });
}

function discographyPage(ctx) {
  const items = [...ctx.site.releases].sort(byDateDesc);
  const body = html`<h1 class="page-title">Discography</h1>
<ul class="cards">${items.map((r) => card(r, ctx.today))}</ul>`;
  return layout(ctx, { path: "/discography/", title: "Discography", body });
}

function newsPage(ctx) {
  const items = newsItems(ctx.site, ctx.news, ctx.today);
  const body = html`<h1 class="page-title">News</h1>
${items.length ? newsList(items) : html`<p class="muted">お知らせはまだありません。</p>`}`;
  return layout(ctx, { path: "/news/", title: "News", body });
}

function contactPage(ctx) {
  const { profile } = ctx;
  const body = html`<h1 class="page-title">Contact</h1>
<section class="contact">
  <p>お仕事のご依頼・お問い合わせは、所属レーベル ${profile.label} までご連絡ください。</p>
  <p><a class="btn btn-primary" href="mailto:${profile.contactEmail}">${profile.contactEmail}</a></p>
  <p>${ext(profile.companyUrl, `${profile.label} Website`, "btn")} ${ext(profile.x, `X ${xHandle(profile.x)}`, "btn")}</p>
</section>`;
  return layout(ctx, { path: "/contact/", title: "Contact", body });
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
  const pages = {
    "index.html": homePage(ctx),
    "discography/index.html": discographyPage(ctx),
    "news/index.html": newsPage(ctx),
    "contact/index.html": contactPage(ctx),
    "404.html": notFoundPage(ctx),
  };
  for (const r of ctx.site.releases) pages[`releases/${r.slug}/index.html`] = releasePage(ctx, r);
  return pages;
}
