(() => {
  "use strict";

  const QUIZZES = window.QUIZZES;
  const CATS = window.CATEGORIES;
  const LEVELS = window.LEVELS;
  const STORE_KEY = "nanikana-quiz-v1";
  const app = document.getElementById("app");

  // ---------- 保存データ ----------
  // results:  { [quizId]: { n: 回答回数, ok: 正解回数, last: 最終日時(ms), lastOk: 最後に正解したか } }
  // sessions: [{ at, mode, total, correct }]  （新しい順・最大100件）
  // seen:     ホームを最後に開いたときに存在したクイズID（「あたらしく ふえた」表示用）
  const defaults = () => ({ results: {}, sessions: [], seen: null, settings: { speak: true, perRound: 5, level: "k", voice: "", rate: 0.95 } });

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults();
      const d = JSON.parse(raw);
      return { ...defaults(), ...d, settings: { ...defaults().settings, ...(d.settings || {}) } };
    } catch (e) {
      return defaults();
    }
  }
  let data = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* 保存できない環境でも遊べるように */ }
  }

  const isDone = (q) => !!data.results[q.id];
  const I = (name, cls) => window.icon(name, cls);
  const catIcon = (c, cls) => `<span class="ci ${cls || ""}" style="--c:${c.color}">${I(c.icon)}</span>`;
  // まちがえた 回数（古い 記録は n − ok で 計算）と、つづけて せいかいした 回数
  const ngOf = (r) => (r ? (r.ng != null ? r.ng : r.n - r.ok) : 0);
  const streakOf = (r) => (r ? (r.streak != null ? r.streak : r.lastOk ? 1 : 0) : 0);
  // にがて：まちがえた ことが あって、まだ 2かい つづけて せいかい していない
  const GRADUATE = 2;
  const isWeak = (q) => { const r = data.results[q.id]; return ngOf(r) > 0 && streakOf(r) < GRADUATE; };
  const weakSort = (a, b) => {
    const ra = data.results[a.id], rb = data.results[b.id];
    return ngOf(rb) - ngOf(ra) || (rb.lastNg || rb.last || 0) - (ra.lastNg || ra.last || 0);
  };
  const lvOf = (q) => q.lv || "k";
  const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
  // いま えらんでいる がくねんの クイズ
  const levelQs = () => QUIZZES.filter((q) => lvOf(q) === data.settings.level);
  // がくねんタブ（7つ → 4つ＋3つの 2だん。はばを こえない ように なまえは みじかく）
  const levelTabs = () => `<div class="levels">${LEVELS.map((l) => {
    const left = QUIZZES.filter((q) => lvOf(q) === l.id && !isDone(q)).length;
    return `<button class="lv ${l.id === data.settings.level ? "on" : ""}" data-act="level" data-lv="${l.id}">
      <b class="${[...(l.short || l.name)].length > 4 ? "long" : ""}">${esc(l.short || l.name)}</b><small>${left ? `のこり ${left}` : I("crown", "crown")}</small></button>`;
  }).join("")}</div>`;
  const catOf = (id) => CATS.find((c) => c.id === id) || { name: id, icon: "nazo", color: "#bbb" };

  // ---------- 小物 ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const fmtDate = (ms) => {
    const d = new Date(ms);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  // 表示用：エスケープして、分数（3/4）を たての 分数に する
  const rich = (s) => esc(s)
    .replace(/🔊/g, () => window.icon("speaker", "inline"))
    .replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>')
    .replace(/([○●■]{2,}|(?<=\s)[○●■](?=\s|$))/gm, '<span class="marks">$1</span>'); // グラフの しるしを 大きく

  // 読み上げ用：絵文字を はずし、記号・単位・分数を 読み方に かえる
  const SPEECH = [
    [/(\d+)\/(\d+)/g, "$2ぶんの$1"],
    [/(\d+):(\d+)/g, "$1 たい $2"],
    [/km²/g, "へいほうキロメートル"], [/cm²/g, "へいほうセンチメートル"], [/m²/g, "へいほうメートル"],
    [/cm³/g, "りっぽうセンチメートル"], [/m³/g, "りっぽうメートル"],
    [/(\d|何)\s*km/g, "$1キロメートル"], [/(\d|何)\s*cm/g, "$1センチメートル"], [/(\d|何)\s*mm/g, "$1ミリメートル"],
    [/(\d|何)\s*mL/g, "$1ミリリットル"], [/(\d|何)\s*dL/g, "$1デシリットル"], [/(\d|何)\s*kg/g, "$1キログラム"],
    [/(\d|何)\s*ha(?![a-z])/g, "$1ヘクタール"], [/(\d|何)\s*a(?![a-z])/g, "$1アール"],
    [/(\d|何)\s*m(?![a-zA-Z])/g, "$1メートル"], [/(\d|何)\s*L(?![a-zA-Z])/g, "$1リットル"],
    [/(\d|何)\s*g(?![a-zA-Z])/g, "$1グラム"], [/(\d|何)\s*t(?![a-zA-Z])/g, "$1トン"],
    [/°/g, "ど"], [/%/g, "パーセント"], [/℃/g, "ど"],
    [/×/g, " かける "], [/÷/g, " わる "], [/＋/g, " たす "], [/−/g, " ひく "], [/＝/g, " は "],
    [/□/g, "しかく"],
  ];
  const plain = (s) => SPEECH.reduce((t, [re, to]) => t.replace(re, to),
    String(s).replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, "")).trim();

  // 英語の 部分は 英語の 声で、それ以外は 日本語の 声で 読む
  const EN_PART = /([A-Za-z][A-Za-z0-9'’ .,!?-]*[A-Za-z.!?]|[A-Za-z])/;
  // 声えらび：設定で えらんだ 声 → なければ 端末の 中で いちばん 自然そうな 声
  // （ニューラル・拡張・高品質の 声を 優先。Edge の Natural、iPhone の Kyoko（拡張）など）
  const VOICE_SCORE = [[/natural|neural|online/i, 50], [/premium|enhanced|拡張|高品質/i, 40], [/google/i, 30], [/siri/i, 25],
    [/nanami|kyoko|o-ren|otoya|hattori|keita|ayumi|haruka/i, 5]];
  const scoreVoice = (v) => VOICE_SCORE.reduce((s, [re, p]) => s + (re.test(v.name) ? p : 0), v.localService ? 0 : 1);
  function voicesFor(lang) {
    const two = lang.slice(0, 2);
    return speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace("_", "-").toLowerCase().startsWith(two));
  }
  function voiceFor(lang) {
    const vs = voicesFor(lang);
    if (lang.startsWith("ja") && data.settings.voice) {
      const chosen = vs.find((v) => v.name === data.settings.voice);
      if (chosen) return chosen;
    }
    const exact = vs.filter((v) => v.lang.replace("_", "-") === lang);
    return (exact.length ? exact : vs).slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
  }
  let speakTimer = null;
  function stopSpeak() {
    clearTimeout(speakTimer);
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // delay：画面が 出てから 一拍 おいて 読む（ミリ秒）
  function speak(text, delay) {
    if (!("speechSynthesis" in window)) return;
    stopSpeak();
    speakTimer = setTimeout(() => {
      try {
        const rate = data.settings.rate || 0.95;
        plain(text).split(EN_PART).forEach((part, i) => {
          if (!part.trim()) return;
          const en = i % 2 === 1;
          const u = new SpeechSynthesisUtterance(part);
          u.lang = en ? "en-US" : "ja-JP";
          u.rate = en ? rate * 0.85 : rate;
          u.pitch = 1;
          const v = voiceFor(u.lang);
          if (v) u.voice = v;
          speechSynthesis.speak(u);
        });
      } catch (e) { /* noop */ }
    }, delay || 0);
  }
  const DELAY_Q = 700;    // 問題を 出してから
  const DELAY_JUDGE = 450; // ピンポンの 音の あと

  let audioCtx = null;
  function beep(ok) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [784, 1047] : [330, 262];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = ok ? "triangle" : "square";
        o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.13;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.22);
      });
    } catch (e) { /* noop */ }
  }

  // ---------- 画面: ホーム ----------
  function renderHome() {
    window.QUIZ_PLAYING = false;
    app.style.paddingBottom = "";
    const qs = levelQs();
    const total = qs.length;
    const notDone = qs.filter((q) => !isDone(q));
    const weak = qs.filter(isWeak);
    const known = data.seen ? new Set(data.seen) : null;
    const added = known ? QUIZZES.filter((q) => !known.has(q.id)) : [];
    const addedByLv = LEVELS.map((l) => [l, added.filter((q) => lvOf(q) === l.id).length]).filter(([, n]) => n);
    // 次回のために、いま存在するIDを記録
    data.seen = QUIZZES.map((q) => q.id);
    save();

    app.innerHTML = `
      <div class="top">
        <div class="title">なにかな？<span>クイズ</span></div>
        <button class="iconbtn" data-act="history">${I("book")} きろく</button>
      </div>
      ${levelTabs()}
      ${added.length ? `<div class="panel">${I("sparkle", "accent")} あたらしい クイズが <b>${added.length}もん</b> ふえたよ！<br><span class="small">${addedByLv.map(([l, n]) => `${esc(l.name)} ${n}もん`).join("・")}</span></div>` : ""}
      <button class="big primary" data-act="start" data-mode="new" ${notDone.length ? "" : "disabled"}>
        <span class="em">${I("sparkle")}</span>
        <span class="grow">まだ やってない クイズ<small>${notDone.length ? `のこり ${notDone.length}もん` : "ぜんぶ やったよ！すごい！"}</small></span>
      </button>
      <button class="big" data-act="start" data-mode="random">
        <span class="em">${I("dice")}</span>
        <span class="grow">ぜんぶから ランダム<small>${total}もんの なかから</small></span>
      </button>
      <button class="big" data-act="start" data-mode="wrong" ${weak.length ? "" : "disabled"}>
        <span class="em">${I("target")}</span>
        <span class="grow">にがて クイズ<small>${weak.length ? `${weak.length}もん・まちがえた かいすうが おおい じゅん` : "いまは ないよ"}</small></span>
      </button>
      <h2>テーマで えらぶ</h2>
      <div class="grid">
        ${CATS.map((c) => {
          const cqs = qs.filter((q) => q.cat === c.id);
          if (!cqs.length) return "";
          const done = cqs.filter(isDone).length;
          const left = cqs.length - done;
          return `<button class="cat" style="--c:${c.color}" data-act="list" data-cat="${c.id}">
            ${left ? `<span class="badge">のこり${left}</span>` : `<span class="badge done">${I("crown")}</span>`}
            ${catIcon(c, "big")}
            <span class="nm">${esc(c.name)}</span>
            <div class="bar"><i style="width:${Math.round((done / cqs.length) * 100)}%"></i></div>
            <span class="cnt">${done} / ${cqs.length}</span>
          </button>`;
        }).join("")}
      </div>
    `;
  }

  // ---------- 出題 ----------
  let round = null;

  function pickQuestions(mode, cat) {
    const n = data.settings.perRound;
    const all = levelQs();
    let pool;
    if (mode === "new") pool = all.filter((q) => !isDone(q));
    else if (mode === "wrong") return shuffle(all.filter(isWeak).sort(weakSort).slice(0, n)); // まちがえた 回数が 多い ものから
    else if (mode === "cat") {
      const qs = all.filter((q) => q.cat === cat);
      // まだやってないものを優先
      pool = [...shuffle(qs.filter((q) => !isDone(q))), ...shuffle(qs.filter(isDone))];
      return pool.slice(0, n);
    } else pool = all;
    return shuffle(pool).slice(0, n);
  }

  function startRound(mode, cat) {
    window.QUIZ_PLAYING = true;
    const qs = pickQuestions(mode, cat);
    if (!qs.length) return renderHome();
    round = {
      mode, cat,
      items: qs.map((q) => ({ q, choices: shuffle([q.a, ...q.w]), firstTime: !isDone(q), ng: ngOf(data.results[q.id]), weak: isWeak(q), answer: null })),
      idx: 0,
    };
    renderQuestion();
  }

  function renderQuestion() {
    const it = round.items[round.idx];
    const c = catOf(it.q.cat);
    app.innerHTML = `
      <div class="top">
        <button class="iconbtn" data-act="${round.single ? "back" : "home"}">${I("home")} もどる</button>
        <div class="progress">${round.items.map((x, i) =>
          `<i class="${x.answer === null ? (i === round.idx ? "now" : "") : x.answer ? "ok" : "ng"}"></i>`).join("")}</div>
        <span class="small">${round.idx + 1}/${round.items.length}</span>
      </div>
      <div class="qcard">
        <div class="catname">${catIcon(c, "sm")} ${esc(c.name)}${it.firstTime ? `<span class="badge new">はじめて</span>` : ""}${it.ng ? `<span class="badge ngc">${I("ng")}${it.ng}かい まちがえた</span>` : ""}</div>
        <div class="qtext">${rich(it.q.q)}</div>
        <button class="speak" data-act="speak" aria-label="よみあげ">${I("speaker")}</button>
      </div>
      <div class="choices ${it.choices.some((ch) => [...ch].length > 8) ? "wide" : ""}">
        ${it.choices.map((ch, i) => `<button class="choice" data-act="answer" data-i="${i}">${rich(ch)}</button>`).join("")}
      </div>
      <div id="judge"></div>
    `;
    app.style.paddingBottom = "";
    if (data.settings.speak) speak(it.q.say || it.q.q, DELAY_Q);
  }

  function answer(i) {
    const it = round.items[round.idx];
    if (it.answer !== null) return;
    const picked = it.choices[i];
    const ok = picked === it.q.a;
    it.answer = ok;

    const r = data.results[it.q.id] || { n: 0, ok: 0 };
    r.ng = ngOf(r) + (ok ? 0 : 1);
    r.streak = ok ? streakOf(r) + 1 : 0;
    r.n += 1;
    if (ok) r.ok += 1;
    r.last = Date.now();
    if (!ok) r.lastNg = r.last;
    r.lastOk = ok;
    // にがてを こくふく（2かい つづけて せいかい）
    it.conquered = it.weak && ok && r.streak >= GRADUATE;
    data.results[it.q.id] = r;
    save();

    const box = app.querySelector(".choices");
    box.classList.add("locked");
    box.querySelectorAll(".choice").forEach((b, j) => {
      const ch = it.choices[j];
      if (ch === it.q.a) b.classList.add("ok");
      else if (j === i) b.classList.add("ng");
      else b.classList.add("dim");
    });
    const dots = app.querySelectorAll(".progress i");
    dots[round.idx].className = ok ? "ok" : "ng";

    beep(ok);
    const last = round.idx === round.items.length - 1;
    const praise = ["せいかい！", "すごい！", "やったね！", "ピンポーン！", "てんさい！"];
    const msg = ok ? praise[Math.floor(Math.random() * praise.length)] : "ざんねん！";
    // 判定は画面下に固定して、スクロールしなくても「つぎへ」が押せるようにする
    const judge = document.getElementById("judge");
    judge.innerHTML = `
      <div class="sheet ${ok ? "is-ok" : "is-ng"}">
        <div class="judge">
          <div class="head"><span class="mark">${I(ok ? "ok" : "ng")}</span><span class="msg">${msg}</span></div>
          ${it.conquered ? `<div class="exp win">${I("crown")} にがてを こくふく！</div>` : it.weak && ok ? `<div class="exp">あと ${GRADUATE - data.results[it.q.id].streak}かい せいかいで にがて こくふく</div>` : ""}
          ${ok ? "" : `<div class="exp ans">こたえは「${rich(it.q.a)}」</div>`}
          ${it.q.e ? `<div class="exp">${I("bulb")} ${rich(it.q.e)}</div>` : ""}
        </div>
        <button class="big primary" data-act="next"><span class="em">${I(round.single ? "list" : last ? "flag" : "arrow")}</span><span class="grow">${round.single ? "いちらんに もどる" : last ? "けっかを みる" : "つぎの もんだい"}</span></button>
      </div>
    `;
    // シートの下に選択肢が隠れないよう余白をとる
    app.style.paddingBottom = judge.firstElementChild.offsetHeight + 16 + "px";
    if (data.settings.speak) speak(ok ? msg + (it.q.e ? "。" + it.q.e : "") : `${msg}。こたえは、${it.q.a}。${it.q.e || ""}`, DELAY_JUDGE);
  }

  function next() {
    if (round.single) return goBack();
    if (round.idx < round.items.length - 1) {
      round.idx += 1;
      renderQuestion();
      window.scrollTo(0, 0);
    } else {
      renderResult();
    }
  }

  function renderResult() {
    window.QUIZ_PLAYING = false;
    app.style.paddingBottom = "";
    const total = round.items.length;
    const correct = round.items.filter((x) => x.answer).length;
    data.sessions.unshift({ at: Date.now(), lv: data.settings.level, mode: round.mode, cat: round.cat || null, total, correct });
    data.sessions = data.sessions.slice(0, 100);
    save();

    const ratio = correct / total;
    const stars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
    const msg = ratio === 1 ? "ぜんもん せいかい！ てんさい！" : ratio >= 0.6 ? "よく できました！" : "がんばったね！ また やってみよう！";
    const left = levelQs().filter((q) => !isDone(q)).length;
    app.innerHTML = `
      <div class="result">
        <div class="stars">${I("star").repeat(stars)}${I("starOff").repeat(3 - stars)}</div>
        <div class="score">${total}もん ちゅう ${correct}もん せいかい</div>
        <div class="qtext" style="font-size:24px">${msg}</div>
        ${round.items.some((x) => x.conquered) ? `<p class="win">${I("crown")} にがてを ${round.items.filter((x) => x.conquered).length}もん こくふく！</p>` : ""}
        <p class="small">${esc(levelOf(data.settings.level).name)}の まだ やってない クイズは あと ${left}もん</p>
      </div>
      <button class="big primary" data-act="start" data-mode="${round.mode}" ${round.cat ? `data-cat="${round.cat}"` : ""}><span class="em">${I("repeat")}</span><span class="grow">もういっかい</span></button>
      <button class="big" data-act="home"><span class="em">${I("home")}</span><span class="grow">はじめに もどる</span></button>
    `;
    if (data.settings.speak) speak(`${total}もんちゅう、${correct}もん せいかい。${msg}`, DELAY_JUDGE);
  }

  function voiceOptions() {
    if (!("speechSynthesis" in window)) return `<option value="">（よみあげ できません）</option>`;
    const vs = voicesFor("ja-JP").slice().sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const best = vs[0];
    return `<option value="">じどう（${esc(best ? best.name : "ひょうじゅん")}）</option>` +
      vs.map((v) => `<option value="${esc(v.name)}" ${v.name === data.settings.voice ? "selected" : ""}>${esc(v.name)}</option>`).join("");
  }

  // ---------- 画面: テーマの もんだい いちらん（1もんずつ えらべる） ----------
  let listView = { cat: null, filter: "all", scroll: 0 };
  function renderList(catId, filter) {
    window.QUIZ_PLAYING = false;
    app.style.paddingBottom = "";
    listView.cat = catId;
    listView.filter = filter || listView.filter || "all";
    const c = catOf(catId);
    const all = levelQs().filter((q) => q.cat === catId);
    const counts = { all: all.length, new: all.filter((q) => !isDone(q)).length, weak: all.filter(isWeak).length };
    const shown = listView.filter === "new" ? all.filter((q) => !isDone(q)) : listView.filter === "weak" ? all.filter(isWeak).sort(weakSort) : all;
    const tab = (k, label) => `<button class="ftab ${listView.filter === k ? "on" : ""}" data-act="filter" data-f="${k}">${label} <b>${counts[k]}</b></button>`;
    app.innerHTML = `
      <div class="top">
        <button class="iconbtn" data-act="home">${I("home")} もどる</button>
        <div class="title" style="font-size:20px">${catIcon(c, "sm")} ${esc(c.name)}</div>
      </div>
      <button class="big primary" data-act="start" data-mode="cat" data-cat="${c.id}">
        <span class="em">${I("arrow")}</span><span class="grow">このテーマで ${data.settings.perRound}もん<small>まだ やってない もんだいから</small></span>
      </button>
      <h2>もんだいを えらんで 1もん</h2>
      <div class="ftabs">${tab("all", "ぜんぶ")}${tab("new", "まだ")}${tab("weak", "にがて")}</div>
      ${shown.length ? `<ul class="qlist pick">${shown.map((q) => qItem(q)).join("")}</ul>` : `<p class="small">ここには もんだいが ないよ。</p>`}
    `;
  }
  // いちらんの 1ぎょう（おすと その もんだいを 1もん だけ とく）
  function qItem(q, meta) {
    const r = data.results[q.id];
    const st = !r ? `<span class="badge">まだ</span>` : r.lastOk ? `<span class="okc">${I("ok")}</span>` : `<span class="ngc2">${I("ng")}</span>`;
    const m = meta != null ? meta : r ? `<span class="okc">${I("ok")}${r.ok}</span> <span class="ngc2">${I("ng")}${ngOf(r)}</span>` : "";
    return `<li data-act="one" data-id="${q.id}" role="button" tabindex="0"><span class="st">${st}</span><span class="tx">${rich(q.q)}</span>
      <span class="meta">${m}</span><span class="go">${I("arrow")}</span></li>`;
  }

  // 1もんだけ とく。おわったら もとの がめんに もどる
  function startOne(id, back) {
    const q = QUIZZES.find((x) => x.id === id);
    if (!q) return;
    window.QUIZ_PLAYING = true;
    round = {
      mode: "one", single: true, back, backScroll: window.scrollY,
      backOpen: [...app.querySelectorAll("details")].map((d) => d.open),
      items: [{ q, choices: shuffle([q.a, ...q.w]), firstTime: !isDone(q), ng: ngOf(data.results[q.id]), weak: isWeak(q), answer: null }],
      idx: 0,
    };
    renderQuestion();
    window.scrollTo(0, 0);
  }
  function goBack() {
    stopSpeak();
    const b = round && round.back;
    const y = round ? round.backScroll : 0;
    if (b === "history") {
      renderHistory();
      // ひらいていた ところを ひらいた まま もどす
      const open = (round && round.backOpen) || [];
      app.querySelectorAll("details").forEach((d, i) => { if (open[i]) d.open = true; });
    }
    else if (b === "list") renderList(listView.cat, listView.filter);
    else renderHome();
    window.scrollTo(0, y || 0);
  }

  // ---------- 画面: きろく ----------
  function renderHistory() {
    window.QUIZ_PLAYING = false;
    const qsLv = levelQs();
    const done = qsLv.filter(isDone);
    const answered = qsLv.map((q) => data.results[q.id]).filter(Boolean);
    const totalN = answered.reduce((s, r) => s + r.n, 0);
    const totalOk = answered.reduce((s, r) => s + r.ok, 0);
    const totalNg = answered.reduce((s, r) => s + ngOf(r), 0);
    const weak = qsLv.filter(isWeak).sort(weakSort);
    const modeName = (s) => (s.lv ? levelOf(s.lv).name + "・" : "") + (s.mode === "new" ? "まだやってない" : s.mode === "wrong" ? "にがて ふくしゅう" : s.mode === "cat" ? catOf(s.cat).name : "ランダム");

    app.innerHTML = `
      <div class="top">
        <button class="iconbtn" data-act="home">${I("home")} もどる</button>
        <div class="title" style="font-size:24px">${I("book")} きろく</div>
      </div>
      ${levelTabs()}
      <div class="panel stats">
        <div><b>${done.length}<small style="font-size:16px">/${qsLv.length}</small></b><span>やった クイズ</span></div>
        <div><b>${totalN}</b><span>こたえた かいすう</span></div>
        <div><b>${totalN ? Math.round((totalOk / totalN) * 100) : 0}%</b><span>せいかいりつ</span></div>
        <div><b>${totalNg}</b><span>まちがえた かいすう</span></div>
      </div>

      <div class="panel">
        <div class="ph">${I("target")} にがてな もんだい <span class="small">${weak.length}もん</span></div>
        ${weak.length ? `<ul class="qlist pick" data-back="history">${weak.slice(0, 10).map((q) => `
          <li data-act="one" data-id="${q.id}" role="button" tabindex="0"><span class="st ngn">${I("ng")}${ngOf(data.results[q.id])}</span><span class="tx">${rich(q.q)}</span>
          <span class="meta">${esc(catOf(q.cat).name)}</span><span class="go">${I("arrow")}</span></li>`).join("")}</ul>
          <p class="small">まちがえた かいすうが おおい じゅん。2かい つづけて せいかいすると「にがて」から はずれます。</p>
          <button class="big primary" data-act="start" data-mode="wrong"><span class="em">${I("target")}</span><span class="grow">にがてを ふくしゅう する</span></button>`
        : `<p class="small">いまは ないよ。まちがえた もんだいは ここに たまります。</p>`}
      </div>

      <div class="panel">
        <details>
          <summary>${I("clock")} さいきん あそんだ きろく</summary>
          ${data.sessions.length ? `<ul class="qlist">${data.sessions.slice(0, 30).map((s) => `
            <li><span class="st">${s.correct === s.total ? I("star", "gold") : ""}</span>
            <span class="tx">${esc(modeName(s))}：${s.total}もん ちゅう ${s.correct}もん</span>
            <span class="meta">${fmtDate(s.at)}</span></li>`).join("")}</ul>` : `<p class="small">まだ ないよ</p>`}
        </details>
      </div>

      ${CATS.map((c) => {
        const qs = qsLv.filter((q) => q.cat === c.id);
        if (!qs.length) return "";
        const d = qs.filter(isDone).length;
        return `<div class="panel"><details>
          <summary>${catIcon(c, "sm")} ${esc(c.name)}　<span class="small">${d} / ${qs.length}</span></summary>
          <ul class="qlist pick" data-back="history">${qs.map((q) => {
            const r = data.results[q.id];
            return qItem(q, r ? `<span class="okc">${I("ok")}${r.ok}</span> <span class="ngc2">${I("ng")}${ngOf(r)}</span><br>${fmtDate(r.last)}` : "");
          }).join("")}</ul>
        </details></div>`;
      }).join("")}

      <h2>${I("sliders")} せってい（おうちの かたへ）</h2>
      <div class="panel">
        <label class="opt"><input type="checkbox" data-set="speak" ${data.settings.speak ? "checked" : ""}> もんだいを よみあげる</label>
        <label class="opt">こえ
          <select data-set="voice" data-type="str">${voiceOptions()}</select>
        </label>
        <label class="opt">よむ はやさ
          <select data-set="rate">${[[0.8, "ゆっくり"], [0.95, "ふつう"], [1.1, "はやい"]].map(([v, n]) => `<option value="${v}" ${v === data.settings.rate ? "selected" : ""}>${n}</option>`).join("")}</select>
          <button class="btn" data-act="testvoice">${I("speaker")} ためしに よむ</button>
        </label>
        <p class="small">しぜんな こえに するには：iPhone・iPad は「設定 › アクセシビリティ › 読み上げコンテンツ › 声 › 日本語」で「拡張」や「高品質」の 声を ダウンロード。Windows は Edge で ひらくと「Natural」の 声が つかえます。えらんだ こえは この たんまつに ほぞん されます。</p>
        <label class="opt">1かいの もんだいすう
          <select data-set="perRound">${[3, 5, 10].map((n) => `<option ${n === data.settings.perRound ? "selected" : ""}>${n}</option>`).join("")}</select>
        </label>
        <p class="small">きろくは この ブラウザに ほぞん されます。べつの たんまつに うつすときは「かきだし」→「よみこみ」を つかってください。</p>
        <div class="row">
          <button class="btn" data-act="export">${I("download")} きろくを かきだし</button>
          <button class="btn" data-act="import">${I("upload")} きろくを よみこみ</button>
          <button class="btn danger" data-act="reset">${I("trash")} きろくを けす</button>
        </div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
      </div>
    `;
    app.querySelector("#importFile").addEventListener("change", importFile);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `quiz-kiroku-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importFile(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || typeof d.results !== "object") throw new Error("format");
        if (!confirm("いまの きろくを、よみこんだ きろくで おきかえますか？")) return;
        data = { ...defaults(), ...d, settings: { ...defaults().settings, ...(d.settings || {}) } };
        save();
        alert("よみこみました！");
        renderHistory();
      } catch (e) {
        alert("ファイルを よみこめませんでした");
      }
    };
    reader.readAsText(file);
  }

  // ---------- イベント ----------
  app.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "home") { stopSpeak(); renderHome(); window.scrollTo(0, 0); }
    else if (act === "history") { renderHistory(); window.scrollTo(0, 0); }
    else if (act === "start") { startRound(el.dataset.mode, el.dataset.cat); window.scrollTo(0, 0); }
    else if (act === "answer") answer(Number(el.dataset.i));
    else if (act === "next") next();
    else if (act === "speak") speak(round.items[round.idx].q.say || round.items[round.idx].q.q);
    else if (act === "list") { renderList(el.dataset.cat, "all"); window.scrollTo(0, 0); }
    else if (act === "filter") renderList(listView.cat, el.dataset.f);
    else if (act === "one") startOne(el.dataset.id, el.closest("[data-back]") ? el.closest("[data-back]").dataset.back : "list");
    else if (act === "back") goBack();
    else if (act === "testvoice") speak("こんにちは。なにかな クイズ です。りんご は えいごで apple。", 0);
    else if (act === "level") {
      data.settings.level = el.dataset.lv;
      save();
      if (app.querySelector(".stats")) renderHistory(); else renderHome();
    }
    else if (act === "export") exportData();
    else if (act === "import") app.querySelector("#importFile").click();
    else if (act === "reset") {
      if (confirm("きろくを ぜんぶ けしますか？（もとに もどせません）")) {
        const settings = data.settings;
        data = defaults();
        data.settings = settings;
        data.seen = QUIZZES.map((q) => q.id);
        save();
        renderHistory();
      }
    }
  });

  app.addEventListener("change", (ev) => {
    const key = ev.target.dataset.set;
    if (!key) return;
    data.settings[key] = ev.target.type === "checkbox" ? ev.target.checked : ev.target.dataset.type === "str" ? ev.target.value : Number(ev.target.value);
    save();
  });

  // 一部ブラウザは声の一覧があとから届く
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};

  renderHome();
})();
