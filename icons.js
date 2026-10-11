// アプリで 使う アイコン（SVG）。絵文字は 端末ごとに 見た目が かわるので、画面の アイコンは ここに そろえる。
// 24×24。線は currentColor、太さ 2、角は 丸く。塗りが 必要な ものは fill="currentColor" stroke="none"。
(function () {
  const T = (s, size, y) => `<text x="12" y="${y || 17}" text-anchor="middle" font-size="${size}" font-weight="800" fill="currentColor" stroke="none">${s}</text>`;
  const F = 'fill="currentColor" stroke="none"';
  const ICONS = {
    // ---- テーマ ----
    paw: `<circle cx="6" cy="10" r="2" ${F}/><circle cx="9.5" cy="5.8" r="2" ${F}/><circle cx="14.5" cy="5.8" r="2" ${F}/><circle cx="18" cy="10" r="2" ${F}/><ellipse cx="12" cy="16" rx="5" ry="4" ${F}/>`,
    onigiri: `<path d="M12 3.5c1.3 0 2.2.8 3 2l5 8.5c1.3 2.3-.2 5-2.8 5H6.8c-2.6 0-4.1-2.7-2.8-5L9 5.5c.8-1.2 1.7-2 3-2z"/><rect x="9" y="13" width="6" height="6.5" rx="1" ${F}/>`,
    num: T("123", 10, 15.5),
    shapes: `<circle cx="7.5" cy="7.5" r="3.5"/><path d="M17 4l4 7h-8z"/><rect x="4" y="14" width="7" height="6" rx="1"/><path d="M17.5 14.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.3 1.3.4-2.6-1.9-1.8 2.6-.4z"/>`,
    nazo: `<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>${T("?", 11, 14.5)}`,
    bus: `<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v2M16 18v2"/><circle cx="8" cy="14.5" r="1" ${F}/><circle cx="16" cy="14.5" r="1" ${F}/>`,
    house: `<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>`,
    flower: `<circle cx="12" cy="5.5" r="2.4"/><circle cx="16.2" cy="8.6" r="2.4"/><circle cx="14.6" cy="13.4" r="2.4"/><circle cx="9.4" cy="13.4" r="2.4"/><circle cx="7.8" cy="8.6" r="2.4"/><circle cx="12" cy="10" r="1.6" ${F}/><path d="M12 15.5V21M12 19c1.5-1.8 3.2-2.2 4.5-1.8"/>`,
    note: `<path d="M9 18V6l11-2.5V16"/><circle cx="6.5" cy="18" r="2.5" ${F}/><circle cx="17.5" cy="16" r="2.5" ${F}/>`,
    hira: T("あ", 15),
    calc: `<path d="M4 7h6M7 4v6M14 7h6M4.5 14.5l5 5M9.5 14.5l-5 5M14 17h6"/><circle cx="17" cy="14.3" r="1" ${F}/><circle cx="17" cy="19.7" r="1" ${F}/>`,
    ruler: `<path d="M4 20V4l16 16z"/><path d="M8 16v-4.5l4.5 4.5z"/><path d="M4 8h2M4 12h2"/>`,
    clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>`,
    trend: `<path d="M3.5 4v16.5H20"/><path d="M7 16l4-4 3 3 6-7"/><path d="M16 8h4v4"/>`,
    bars: `<path d="M3 20.5h18"/><rect x="5" y="12" width="3.5" height="8.5" rx=".5"/><rect x="10.3" y="6" width="3.5" height="14.5" rx=".5"/><rect x="15.6" y="9.5" width="3.5" height="11" rx=".5"/>`,
    kanji: T("字", 15),
    flask: `<path d="M9 3h6M10 3v6l-5.4 9.3A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.7L14 9V3"/><path d="M7.4 15.5h9.2"/>`,
    map: `<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>`,
    abc: T("Aa", 12, 16.5),
    pot: `<path d="M4 10h16v5.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5z"/><path d="M2.5 10h19M10 7h4"/><path d="M9 3.5c0 1 1 1 1 2M14 3.5c0 1 1 1 1 2"/>`,
    // ---- 画面 ----
    book: `<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v14H7.5A2.5 2.5 0 0 0 5 19.5z"/><path d="M5 19.5A2.5 2.5 0 0 0 7.5 22H19v-5"/><path d="M9 7.5h6"/>`,
    sparkle: `<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z" ${F}/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" ${F}/>`,
    dice: `<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.4" ${F}/><circle cx="12" cy="12" r="1.4" ${F}/><circle cx="15.5" cy="15.5" r="1.4" ${F}/>`,
    repeat: `<path d="M4.5 11A7.5 7.5 0 0 1 17.7 6.3L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M19.5 13a7.5 7.5 0 0 1-13.2 4.7L4 15.5"/><path d="M4 20v-4.5h4.5"/>`,
    crown: `<path d="M3.5 8l4.5 4 4-6.5 4 6.5 4.5-4-2 10.5h-13z" ${F}/>`,
    speaker: `<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z" ${F}/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.6 7.6 0 0 1 0 10.8"/>`,
    home: `<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>`,
    ok: `<circle cx="12" cy="12" r="8"/>`,
    ng: `<path d="M6 6l12 12M18 6L6 18"/>`,
    arrow: `<path d="M4.5 12h15M13.5 6l6 6-6 6"/>`,
    flag: `<path d="M5.5 21V4"/><path d="M5.5 4.5h12l-2.5 4 2.5 4h-12z" ${F}/>`,
    star: `<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" ${F}/>`,
    starOff: `<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>`,
    sliders: `<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>`,
    download: `<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>`,
    upload: `<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>`,
    trash: `<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5.5M14 11v5.5"/>`,
    bulb: `<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>`,
    target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" ${F}/>`,
  };
  const svg = (name, cls) =>
    `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.nazo}</svg>`;
  window.ICONS = ICONS;
  window.icon = svg;
})();
