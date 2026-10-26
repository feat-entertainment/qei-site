// 多言語対応(2026-10-27 ユーザー指示: NEKO KONEKO の公式サイトと同じ 日本語・English・Português・中文(簡体字)・한국어)。
// 日本語はサイト直下(/)、他の言語は /en/ などの下に同じ構成のページを出す。
// 曲名・アーティスト名・英語の見出し(Discography / News / Contact)はどの言語でもそのまま。

/** dir: 出力先のフォルダ(日本語は直下)。hreflang / ogLocale はメタ情報用 */
export const LANGS = [
  { code: "ja", dir: "", label: "日本語", hreflang: "ja", ogLocale: "ja_JP" },
  { code: "en", dir: "en/", label: "English", hreflang: "en", ogLocale: "en_US" },
  { code: "pt", dir: "pt/", label: "Português", hreflang: "pt-BR", ogLocale: "pt_BR" },
  { code: "zh", dir: "zh/", label: "中文", hreflang: "zh-Hans", ogLocale: "zh_CN" },
  { code: "ko", dir: "ko/", label: "한국어", hreflang: "ko", ogLocale: "ko_KR" },
];

export const DEFAULT_LANG = LANGS[0];

/** その言語のページの URL パス(先頭 /)。rest はサイト内の相対パス(例 "releases/x/") */
export const langPath = (lang, rest = "") => `/${lang.dir}${rest}`;

const T = {
  ja: {
    siteTitle: (n) => `${n} Official Site`,
    latest: "Latest Release",
    comingSoon: "Coming Soon",
    preSave: "Pre-save",
    listen: "Listen",
    shareOnX: "Share on X",
    releaseOn: (d) => `${d} Release`,
    emptyDiscography: "配信日が決まった曲から、ここに掲載します。",
    emptyNews: "お知らせはまだありません。",
    released: (type, title) => `${type}「${title}」配信開始`,
    contact: (label) => `お仕事のご依頼・お問い合わせは、${label ? `所属レーベル ${label} まで` : "こちらまで"}ご連絡ください。`,
    followOnX: (h) => `Follow ${h} on X`,
    website: (label) => `${label} Website`,
    shareText: (artist, title, d) => `${artist}「${title}」${d} Release`,
    languageMenu: "言語",
  },
  en: {
    siteTitle: (n) => `${n} Official Site`,
    latest: "Latest Release",
    comingSoon: "Coming Soon",
    preSave: "Pre-save",
    listen: "Listen",
    shareOnX: "Share on X",
    releaseOn: (d) => `Release: ${d}`,
    emptyDiscography: "Songs will appear here once their release dates are set.",
    emptyNews: "No news yet.",
    released: (type, title) => `${type} "${title}" is out now`,
    contact: (label) => (label ? `For work requests and inquiries, please contact ${label}.` : "For work requests and inquiries, please contact us here."),
    followOnX: (h) => `Follow ${h} on X`,
    website: (label) => `${label} Website`,
    shareText: (artist, title, d) => `${artist} "${title}" out ${d}`,
    languageMenu: "Language",
  },
  pt: {
    siteTitle: (n) => `${n} Site Oficial`,
    latest: "Último lançamento",
    comingSoon: "Em breve",
    preSave: "Pré-salvar",
    listen: "Ouvir",
    shareOnX: "Compartilhar no X",
    releaseOn: (d) => `Lançamento: ${d}`,
    emptyDiscography: "As músicas aparecem aqui assim que a data de lançamento for definida.",
    emptyNews: "Ainda não há novidades.",
    released: (type, title) => `${type} "${title}" já disponível`,
    contact: (label) => (label ? `Para propostas de trabalho e contato, fale com ${label}.` : "Para propostas de trabalho e contato, fale conosco por aqui."),
    followOnX: (h) => `Siga ${h} no X`,
    website: (label) => `Site da ${label}`,
    shareText: (artist, title, d) => `${artist} "${title}" lançamento ${d}`,
    languageMenu: "Idioma",
  },
  zh: {
    siteTitle: (n) => `${n} 官方网站`,
    latest: "最新作品",
    comingSoon: "即将发行",
    preSave: "预存",
    listen: "收听",
    shareOnX: "分享到 X",
    releaseOn: (d) => `${d} 发行`,
    emptyDiscography: "确定发行日期的歌曲将在这里发布。",
    emptyNews: "暂无消息。",
    released: (type, title) => `${type}《${title}》现已发行`,
    contact: (label) => (label ? `工作委托及咨询，请联系所属厂牌 ${label}。` : "工作委托及咨询，请通过以下方式联系。"),
    followOnX: (h) => `在 X 上关注 ${h}`,
    website: (label) => `${label} 官网`,
    shareText: (artist, title, d) => `${artist}《${title}》${d} 发行`,
    languageMenu: "语言",
  },
  ko: {
    siteTitle: (n) => `${n} 공식 사이트`,
    latest: "최신 발매",
    comingSoon: "공개 예정",
    preSave: "사전 저장",
    listen: "듣기",
    shareOnX: "X에 공유",
    releaseOn: (d) => `${d} 발매`,
    emptyDiscography: "발매일이 정해진 곡부터 여기에 게재됩니다.",
    emptyNews: "아직 소식이 없습니다.",
    released: (type, title) => `${type} 「${title}」 발매`,
    contact: (label) => (label ? `업무 의뢰 및 문의는 소속 레이블 ${label}(으)로 연락해 주세요.` : "업무 의뢰 및 문의는 여기로 연락해 주세요."),
    followOnX: (h) => `X에서 ${h} 팔로우`,
    website: (label) => `${label} 웹사이트`,
    shareText: (artist, title, d) => `${artist} 「${title}」 ${d} 발매`,
    languageMenu: "언어",
  },
};

export const t = (lang) => T[lang.code];

/**
 * 言語ごとに書ける文(プロフィール文・お知らせ)を取り出す。
 * 文字列ならどの言語でもそれ、{ ja, en, ... } ならその言語 → 無ければ日本語。
 */
export function pick(value, lang) {
  if (value == null || typeof value === "string") return value ?? "";
  return value[lang.code] ?? value[DEFAULT_LANG.code] ?? "";
}
