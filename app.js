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
  const defaults = () => ({ results: {}, sessions: [], seen: null, settings: { speak: true, perRound: 5, level: "k" } });

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
  const lvOf = (q) => q.lv || "k";
  const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
  // いま えらんでいる がくねんの クイズ
  const levelQs = () => QUIZZES.filter((q) => lvOf(q) === data.settings.level);
  const levelTabs = () => `<div class="levels">${LEVELS.map((l) => {
    const left = QUIZZES.filter((q) => lvOf(q) === l.id && !isDone(q)).length;
    return `<button class="lv ${l.id === data.settings.level ? "on" : ""}" data-act="level" data-lv="${l.id}">${l.icon} ${esc(l.name)}${left ? `<i>${left}</i>` : ""}</button>`;
  }).join("")}</div>`;
  const catOf = (id) => CATS.find((c) => c.id === id) || { name: id, icon: "❓", color: "#ccc" };

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
  // 絵文字を読み上げないようにする
  const plain = (s) => String(s).replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/□/g, "しかく").trim();

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain(text));
      u.lang = "ja-JP";
      u.rate = 0.9;
      u.pitch = 1.1;
      const v = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("ja"));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }

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
    const qs = levelQs();
    const total = qs.length;
    const notDone = qs.filter((q) => !isDone(q));
    const wrong = qs.filter((q) => data.results[q.id] && !data.results[q.id].lastOk);
    const known = data.seen ? new Set(data.seen) : null;
    const added = known ? QUIZZES.filter((q) => !known.has(q.id)) : [];
    const addedByLv = LEVELS.map((l) => [l, added.filter((q) => lvOf(q) === l.id).length]).filter(([, n]) => n);
    // 次回のために、いま存在するIDを記録
    data.seen = QUIZZES.map((q) => q.id);
    save();

    app.innerHTML = `
      <div class="top">
        <div class="title">なにかな？<span>クイズ</span></div>
        <button class="iconbtn" data-act="history">📒 きろく</button>
      </div>
      ${levelTabs()}
      ${added.length ? `<div class="panel">🎉 あたらしい クイズが <b>${added.length}もん</b> ふえたよ！<br><span class="small">${addedByLv.map(([l, n]) => `${esc(l.name)} ${n}もん`).join("・")}</span></div>` : ""}
      <button class="big primary" data-act="start" data-mode="new" ${notDone.length ? "" : "disabled"}>
        <span class="em">✨</span>
        <span class="grow">まだ やってない クイズ<small>${notDone.length ? `のこり ${notDone.length}もん` : "ぜんぶ やったよ！すごい！"}</small></span>
      </button>
      <button class="big" data-act="start" data-mode="random">
        <span class="em">🎲</span>
        <span class="grow">ぜんぶから ランダム<small>${total}もんの なかから</small></span>
      </button>
      <button class="big" data-act="start" data-mode="wrong" ${wrong.length ? "" : "disabled"}>
        <span class="em">💪</span>
        <span class="grow">まちがえた クイズに リベンジ<small>${wrong.length ? `${wrong.length}もん` : "いまは ないよ"}</small></span>
      </button>
      <h2>テーマで えらぶ</h2>
      <div class="grid">
        ${CATS.map((c) => {
          const cqs = qs.filter((q) => q.cat === c.id);
          if (!cqs.length) return "";
          const done = cqs.filter(isDone).length;
          const left = cqs.length - done;
          return `<button class="cat" style="--c:${c.color}" data-act="start" data-mode="cat" data-cat="${c.id}">
            ${left ? `<span class="badge">のこり${left}</span>` : `<span class="badge done">👑</span>`}
            <span class="em">${c.icon}</span>
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
    else if (mode === "wrong") pool = all.filter((q) => data.results[q.id] && !data.results[q.id].lastOk);
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
      items: qs.map((q) => ({ q, choices: shuffle([q.a, ...q.w]), firstTime: !isDone(q), answer: null })),
      idx: 0,
    };
    renderQuestion();
  }

  function renderQuestion() {
    const it = round.items[round.idx];
    const c = catOf(it.q.cat);
    app.innerHTML = `
      <div class="top">
        <button class="iconbtn" data-act="home">🏠 もどる</button>
        <span class="small">${round.idx + 1} / ${round.items.length}もんめ</span>
      </div>
      <div class="progress">${round.items.map((x, i) =>
        `<i class="${x.answer === null ? (i === round.idx ? "now" : "") : x.answer ? "ok" : "ng"}"></i>`).join("")}</div>
      <div class="qcard">
        <div class="catname">${c.icon} ${esc(c.name)}${it.firstTime ? `<span class="badge new">はじめて</span>` : ""}</div>
        <div class="qtext">${esc(it.q.q)}</div>
        <button class="speak" data-act="speak" aria-label="よみあげ">🔊</button>
      </div>
      <div class="choices">
        ${it.choices.map((ch, i) => `<button class="choice" data-act="answer" data-i="${i}">${esc(ch)}</button>`).join("")}
      </div>
      <div id="judge"></div>
    `;
    if (data.settings.speak) speak(it.q.say || it.q.q);
  }

  function answer(i) {
    const it = round.items[round.idx];
    if (it.answer !== null) return;
    const picked = it.choices[i];
    const ok = picked === it.q.a;
    it.answer = ok;

    const r = data.results[it.q.id] || { n: 0, ok: 0 };
    r.n += 1;
    if (ok) r.ok += 1;
    r.last = Date.now();
    r.lastOk = ok;
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
    document.getElementById("judge").innerHTML = `
      <div class="judge">
        <div class="mark">${ok ? "⭕" : "❌"}</div>
        <div class="msg" style="color:${ok ? "var(--ok)" : "var(--ng)"}">${msg}</div>
        ${ok ? "" : `<div class="exp">こたえは「${esc(it.q.a)}」</div>`}
        ${it.q.e ? `<div class="exp">💡 ${esc(it.q.e)}</div>` : ""}
      </div>
      <button class="big primary" data-act="next"><span class="em">${last ? "🏁" : "👉"}</span><span class="grow">${last ? "けっかを みる" : "つぎの もんだい"}</span></button>
    `;
    if (data.settings.speak) speak(ok ? msg + (it.q.e ? "。" + it.q.e : "") : `${msg}。こたえは、${it.q.a}。${it.q.e || ""}`);
    document.getElementById("judge").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function next() {
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
        <div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        <div class="score">${total}もん ちゅう ${correct}もん せいかい</div>
        <div class="qtext" style="font-size:24px">${msg}</div>
        <p class="small">${esc(levelOf(data.settings.level).name)}の まだ やってない クイズは あと ${left}もん</p>
      </div>
      <button class="big primary" data-act="start" data-mode="${round.mode}" ${round.cat ? `data-cat="${round.cat}"` : ""}><span class="em">🔁</span><span class="grow">もういっかい</span></button>
      <button class="big" data-act="home"><span class="em">🏠</span><span class="grow">はじめに もどる</span></button>
    `;
    if (data.settings.speak) speak(`${total}もんちゅう、${correct}もん せいかい。${msg}`);
  }

  // ---------- 画面: きろく ----------
  function renderHistory() {
    window.QUIZ_PLAYING = false;
    const qsLv = levelQs();
    const done = qsLv.filter(isDone);
    const answered = qsLv.map((q) => data.results[q.id]).filter(Boolean);
    const totalN = answered.reduce((s, r) => s + r.n, 0);
    const totalOk = answered.reduce((s, r) => s + r.ok, 0);
    const modeName = (s) => (s.lv ? levelOf(s.lv).name + "・" : "") + (s.mode === "new" ? "まだやってない" : s.mode === "wrong" ? "リベンジ" : s.mode === "cat" ? catOf(s.cat).name : "ランダム");

    app.innerHTML = `
      <div class="top">
        <button class="iconbtn" data-act="home">🏠 もどる</button>
        <div class="title" style="font-size:24px">📒 きろく</div>
      </div>
      ${levelTabs()}
      <div class="panel stats">
        <div><b>${done.length}<small style="font-size:16px">/${qsLv.length}</small></b><span>やった クイズ</span></div>
        <div><b>${totalN}</b><span>こたえた かいすう</span></div>
        <div><b>${totalN ? Math.round((totalOk / totalN) * 100) : 0}%</b><span>せいかいりつ</span></div>
      </div>

      <div class="panel">
        <details>
          <summary>🕒 さいきん あそんだ きろく</summary>
          ${data.sessions.length ? `<ul class="qlist">${data.sessions.slice(0, 30).map((s) => `
            <li><span class="st">${s.correct === s.total ? "⭐" : ""}</span>
            <span class="tx">${esc(modeName(s))}：${s.total}もん ちゅう ${s.correct}もん</span>
            <span class="meta">${fmtDate(s.at)}</span></li>`).join("")}</ul>` : `<p class="small">まだ ないよ</p>`}
        </details>
      </div>

      ${CATS.map((c) => {
        const qs = qsLv.filter((q) => q.cat === c.id);
        if (!qs.length) return "";
        const d = qs.filter(isDone).length;
        return `<div class="panel"><details>
          <summary>${c.icon} ${esc(c.name)}　<span class="small">${d} / ${qs.length}</span></summary>
          <ul class="qlist">${qs.map((q) => {
            const r = data.results[q.id];
            const st = !r ? `<span class="badge">まだ</span>` : r.lastOk ? `<span style="color:var(--ok)">⭕</span>` : `<span style="color:var(--ng)">❌</span>`;
            return `<li><span class="st">${st}</span><span class="tx">${esc(q.q)}</span>
              <span class="meta">${r ? `${r.ok}/${r.n}かい<br>${fmtDate(r.last)}` : ""}</span></li>`;
          }).join("")}</ul>
        </details></div>`;
      }).join("")}

      <h2>⚙️ せってい（おうちの かたへ）</h2>
      <div class="panel">
        <label class="opt"><input type="checkbox" data-set="speak" ${data.settings.speak ? "checked" : ""}> もんだいを よみあげる</label>
        <label class="opt">1かいの もんだいすう
          <select data-set="perRound">${[3, 5, 10].map((n) => `<option ${n === data.settings.perRound ? "selected" : ""}>${n}</option>`).join("")}</select>
        </label>
        <p class="small">きろくは この ブラウザに ほぞん されます。べつの たんまつに うつすときは「かきだし」→「よみこみ」を つかってください。</p>
        <div class="row">
          <button class="btn" data-act="export">⬇️ きろくを かきだし</button>
          <button class="btn" data-act="import">⬆️ きろくを よみこみ</button>
          <button class="btn danger" data-act="reset">🗑️ きろくを けす</button>
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
    if (act === "home") { if (window.speechSynthesis) speechSynthesis.cancel(); renderHome(); window.scrollTo(0, 0); }
    else if (act === "history") { renderHistory(); window.scrollTo(0, 0); }
    else if (act === "start") { startRound(el.dataset.mode, el.dataset.cat); window.scrollTo(0, 0); }
    else if (act === "answer") answer(Number(el.dataset.i));
    else if (act === "next") next();
    else if (act === "speak") speak(round.items[round.idx].q.say || round.items[round.idx].q.q);
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
    data.settings[key] = ev.target.type === "checkbox" ? ev.target.checked : Number(ev.target.value);
    save();
  });

  // 一部ブラウザは声の一覧があとから届く
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};

  renderHome();
})();
