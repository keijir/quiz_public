// 学年と テーマの 定義。
// 問題は すべて scripts/quizgen/ で 作り、quizzes-extra.js に 書き出す（このファイルには 書かない）。
// 問題の 項目:
// - id: 単元コード＋連番（例 m4-kawari-03）。一度つけたら変えない（履歴は id で管理）
// - lv: がくねん / cat: テーマ / unit: 単元（scripts/quizgen/units.py）
// - a: せいかい / w: まちがいの選択肢（表示時にシャッフルされる）
// - e: こたえのあとに出るひとこと（省略可）
// - say: よみあげ用の文（省略時は q をそのまま読む。かんじの よみの もんだい など こたえが ばれる ときに つかう）

window.LEVELS = [
  { id: "k", name: "ねんちょう", short: "ねんちょう" },
  { id: "1", name: "1ねんせい", short: "1ねん" },
  { id: "2", name: "2ねんせい", short: "2ねん" },
  { id: "3", name: "3ねんせい", short: "3ねん" },
  { id: "4", name: "4年生", short: "4ねん" },
  { id: "5", name: "5年生", short: "5ねん" },
  { id: "6", name: "6年生", short: "6ねん" },
];

// icon は site/icons.js の アイコン名
window.CATEGORIES = [
  { id: "animal", name: "どうぶつ", icon: "paw", color: "#ffb74d" },
  { id: "food", name: "たべもの", icon: "onigiri", color: "#e57373" },
  { id: "number", name: "かず", icon: "num", color: "#64b5f6" },
  { id: "shape", name: "いろ・かたち", icon: "shapes", color: "#ba68c8" },
  { id: "nazo", name: "なぞなぞ", icon: "nazo", color: "#4db6ac" },
  { id: "vehicle", name: "のりもの", icon: "bus", color: "#7986cb" },
  { id: "life", name: "せいかつ", icon: "house", color: "#aed581" },
  { id: "word", name: "ことば", icon: "hira", color: "#f06292" },
  { id: "nature", name: "しぜん・きせつ", icon: "flower", color: "#81c784" },
  { id: "hyougen", name: "おと・うた", icon: "note", color: "#ffd54f" },
  // 算数は 学習指導要領の 4領域ごとに 分ける（docs/curriculum.md）
  { id: "keisan", name: "けいさん", icon: "calc", color: "#4fc3f7" },
  { id: "zukei", name: "ずけい", icon: "ruler", color: "#7e57c2" },
  { id: "hakaru", name: "はかる・とけい", icon: "clock", color: "#26a69a" },
  { id: "henka", name: "へんか・わりあい", icon: "trend", color: "#ef6c00" },
  { id: "data", name: "グラフ・データ", icon: "bars", color: "#5c6bc0" },
  { id: "kanji", name: "かんじ", icon: "kanji", color: "#ff8a65" },
  { id: "science", name: "りか", icon: "flask", color: "#9ccc65" },
  { id: "society", name: "しゃかい", icon: "map", color: "#a1887f" },
  { id: "eigo", name: "えいご", icon: "abc", color: "#4db6ac" },
  { id: "katei", name: "かてい", icon: "pot", color: "#ff8a80" },
];

// リンク集（学年タブの さいごの「リンク」タブ）。べつの サイトを あたらしい タブで ひらく
window.LINKS = [
  {
    name: "かんじ くみたて",
    desc: "パーツを くみあわせて かんじを つくろう",
    url: "https://script.google.com/macros/s/AKfycbwazSI_1cNcUgUt2Invr5w80QzsQUFUth33C-niCDIlIXXSrmwrsy6WZ3rn7jH1JZev/exec",
    icon: "kanji",
    color: "#ff8a65",
  },
];

window.QUIZZES = [];
