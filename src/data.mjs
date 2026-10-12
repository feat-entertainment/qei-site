// data/*.json の読み込みと検証。不正があれば「どこの何が」を書いて失敗させる
import { readFile } from "node:fs/promises";
import path from "node:path";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPES = ["Single", "EP", "Album"];
const isHttps = (v) => typeof v === "string" && /^https:\/\/\S+$/.test(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";

function fail(where, msg) {
  throw new Error(`${where}: ${msg}`);
}

/** 日本時間の今日 "YYYY-MM-DD" */
export function jstToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const isReleased = (release, today) => release.releaseDate <= today;

export function validateSite(site) {
  if (!site || !Array.isArray(site.releases)) fail("site.json", "releases が配列ではありません");
  if (!isText(site.artist?.name)) fail("site.json", "artist.name がありません");
  const slugs = new Set();
  site.releases.forEach((r, i) => {
    const w = `site.json releases[${i}]`;
    for (const k of ["slug", "title", "type", "releaseDate", "artwork"]) if (!isText(r[k])) fail(w, `${k} がありません`);
    if (!SLUG_RE.test(r.slug)) fail(w, `slug が不正: ${r.slug}`);
    if (slugs.has(r.slug)) fail(w, `slug が重複: ${r.slug}`);
    slugs.add(r.slug);
    if (!TYPES.includes(r.type)) fail(w, `type が不正: ${r.type}`);
    if (!DATE_RE.test(r.releaseDate)) fail(w, `releaseDate が不正: ${r.releaseDate}`);
    if (r.preSaveUrl != null && !isHttps(r.preSaveUrl)) fail(w, "preSaveUrl が https の URL ではありません");
    if (!Array.isArray(r.links)) fail(w, "links が配列ではありません");
    r.links.forEach((l, j) => {
      if (!isText(l.platform) || !isHttps(l.url)) fail(`${w}.links[${j}]`, "platform / url(https)が不正");
    });
  });
  return site;
}

export function validateNews(news) {
  if (!Array.isArray(news)) fail("news.json", "配列ではありません");
  news.forEach((n, i) => {
    const w = `news.json[${i}]`;
    if (!DATE_RE.test(n.date ?? "")) fail(w, `date が不正: ${n.date}`);
    if (!isText(n.title)) fail(w, "title がありません");
    if (n.url != null && !isHttps(n.url) && !/^\/[^/]/.test(n.url)) fail(w, "url は https か / 始まりにしてください");
  });
  return news;
}

export function validateProfile(profile) {
  for (const k of ["siteUrl", "x", "companyUrl"]) if (!isHttps(profile?.[k])) fail("profile.json", `${k} が https の URL ではありません`);
  for (const k of ["label", "contactEmail"]) if (!isText(profile[k])) fail("profile.json", `${k} がありません`);
  if (!isText(profile.aiNotice)) fail("profile.json", "aiNotice がありません");
  if (profile.artistLinks != null) {
    if (!Array.isArray(profile.artistLinks)) fail("profile.json", "artistLinks が配列ではありません");
    profile.artistLinks.forEach((l, i) => {
      if (!isText(l?.platform) || !isHttps(l?.url)) fail(`profile.json artistLinks[${i}]`, "platform / url(https)が不正");
    });
  }
  return profile;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    throw new Error(`${path.basename(file)} を読めません: ${e.message}`);
  }
}

export async function loadData(dataDir) {
  const [site, news, profile] = await Promise.all(["site", "news", "profile"].map((n) => readJson(path.join(dataDir, `${n}.json`))));
  return { site: validateSite(site), news: validateNews(news), profile: validateProfile(profile) };
}
