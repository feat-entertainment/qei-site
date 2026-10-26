# QEI 公式サイト(qei.feat-entertainment.com)

依存ゼロの静的サイトジェネレーター。設計書・実装計画・公開禁止語の一覧は非公開の QEI Release Manager リポジトリの `docs/site/` にある(このリポジトリは Public のため置かない)。

## 守ること
- **このリポジトリは Public。** コード・テスト・コミットメッセージ・`data/` を含むすべてが公開物。使用した制作ツール名・本名は、どこにも書かない
- **AI 制作であることは公言するが、制作ツール名は出さない。** 本名・ISRC・UPC・歌詞・制作情報も出さない
- 公開禁止語は `src/forbidden.mjs` に SHA-256 だけを置き、`build()` が生成 HTML を照合する(エラーにも語は出さない。Actions のログは公開されるため)。語を追加するときは RM 側の一覧を更新し、ハッシュだけをここに足す
- `data/site.json`・`assets/artwork/`・`assets/logo.jpg` は QEI Release Manager の「HP用に書き出し」が上書きする。手で編集しない(曲情報は RM で直す)
- 手で編集するのは `data/news.json`(お知らせ)と `data/profile.json`(X・配信サービスのアーティストページ `artistLinks`・連絡先・AI 公言文。公言文はユーザー指定の英文で確定)だけ
- 黒基調(ライトモードなし)。npm 依存を追加しない
- **多言語(2026-10-27 ユーザー指示。NEKO KONEKO の公式サイトと同じ作り)**: 日本語(直下)・English(`/en/`)・Português(`/pt/`)・中文 簡体字(`/zh/`)・한국어(`/ko/`)。言語ごとの文は `src/i18n.mjs`(翻訳はネイティブ未確認)。ヘッダーの切り替えは今のページの各言語版へ移るだけ。曲名・AI 公言文(英文)はどの言語でもそのまま。お知らせの `title`/`body` は文字列か `{ ja, en, pt, zh, ko }`(無い言語は日本語)。404 は直下に 1 つ(日英併記)
- 出力先 `site/` は git 管理外。GitHub Actions がビルドして Pages に配信する(毎日 JST 00:05 にも再ビルド)

## コマンド
- `npm test` / `npm run build`
- ローカル確認: `npm run build` → `python -m http.server 8080 -d site` → http://localhost:8080
