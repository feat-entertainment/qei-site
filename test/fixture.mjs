import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function fixture() {
  return {
    site: {
      generatedAt: "2026-10-12T00:00:00.000Z",
      artist: { name: "QEI", reading: "ケイ", logo: "assets/logo.png" },
      releases: [
        {
          slug: "cached-emotion", title: "感情コピー", titleEn: "Cached Emotion", type: "Single",
          releaseDate: "2026-10-09", artwork: "assets/artwork/cached-emotion.jpg",
          preSaveUrl: "https://distrokid.com/hyperfollow/qei/G9J3Xz2bkzi",
          links: [{ platform: "Spotify", url: "https://open.spotify.com/album/7pmF8zRKoF6kwvv532XTwC" }],
        },
        {
          slug: "404-humanity", title: "404 Humanity", titleEn: null, type: "Single",
          releaseDate: "2026-10-30", artwork: "assets/artwork/404-humanity.jpg",
          preSaveUrl: null, links: [],
        },
      ],
    },
    news: [{ date: "2026-10-01", title: "公式サイトを公開しました" }],
    profile: {
      siteUrl: "https://qei.feat-entertainment.com",
      x: "https://x.com/QEIrdz",
      label: "feat.Entertainment.llc",
      contactEmail: "info@feat-entertainment.com",
      companyUrl: "https://feat-entertainment.com/",
      artistLinks: [{ platform: "Amazon Music", url: "https://music.amazon.co.jp/artists/B0BPNDZ311" }],
      aiNotice: "The audio and visuals have been partially modified or entirely generated using AI.",
    },
  };
}

/** build() 用の一時ルート(data/*.json と、中身がダミーのアセット)を作る */
export async function writeFixtureRoot(dir, data = fixture()) {
  await mkdir(path.join(dir, "data"), { recursive: true });
  await mkdir(path.join(dir, "assets", "artwork"), { recursive: true });
  for (const name of ["site", "news", "profile"]) {
    await writeFile(path.join(dir, "data", `${name}.json`), JSON.stringify(data[name]));
  }
  await writeFile(path.join(dir, "assets", "logo.png"), "x");
  for (const r of data.site.releases) await writeFile(path.join(dir, r.artwork), "x");
}
