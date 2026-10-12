// 公開ページに出してはいけない語のチェック。リポジトリが Public なので、語そのものは置かず
// 小文字化した語の SHA-256 だけを持つ。語の一覧は非公開の QEI Release Manager 側(docs/site/forbidden-words.md)で管理する。
import { createHash } from "node:crypto";

export const FORBIDDEN_HASHES = new Set([
  "586937124e151c46f21a2de1d49b6236c168a5d2902b3c8926c2c54a8b78a416",
  "60965168ce762e949600281ba6d01fee136e5b6e8257b1f216f9025ed324474c",
  "7d3194f79e645c42e4396dda38be04766810ec6a00d00aced3ffc2a0a1f1a9ef",
  "d931372ba7f836a0bf8405601b0a293927ba20bf368f12b2cf3affc384c8a9da",
  "3db1f560db626918c55619d64ee4f32a0cdafd42eb319b641581edf619a2d36f",
  "b2829c6a942030d7fe785c5cc8b8bfd3e78aced621e575b6db8801087a1e2274",
  "f54523b98ed36f1ddf64619f95923484e32a5a84a14415a87af1f150c8209e2d",
  "08a3242bf78bcc3cc809e78bf317268a6b0660f69485cb1b34feb382495240cf",
  "edd466a1452cc37547ed859c0d6ba1123bafd5a3bf022cc73fdc9a27602b73d0",
]);

export const sha256 = (word) => createHash("sha256").update(word).digest("hex");

/** 英数字の語ごとに小文字化してハッシュ照合する。禁止語を含めば true */
export function hasForbiddenWord(text, hashes = FORBIDDEN_HASHES) {
  const words = new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  for (const w of words) if (hashes.has(sha256(w))) return true;
  return false;
}
