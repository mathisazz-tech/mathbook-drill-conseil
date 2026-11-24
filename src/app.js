/* MathDrill V3 — interface. Pas de LLM : toutes les réponses viennent des générateurs déterministes. */
(function () {
  "use strict";
  var D = DRILL, E = ENGINE, LS = LESSONS, X = EXPLAIN, C = D.CAT;
  var KEY = "mathdrill.v3", VERSION = "3.0";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s === undefined || s === null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function seed() { return (Math.random() * 2147483647) | 0; }

  // ======================= STOCKAGE (vérifié) =======================
  var S, storeOk = true, storeMsg = "", persisted = null;
  function blank() { return { v: 3, created: Date.now(), events: [], prefs: { ctx: "metro", len: 5 }, concepts: {}, seen: {}, session: null, lastBackup: 0, lastSaveOk: 0 }; }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storeOk = false; storeMsg = "Le navigateur bloque le stockage (navigation privée ?). Rien ne sera gardé : exporte ta progression avant de fermer."; }
    if (raw) { try { S = JSON.parse(raw); } catch (e) { S = null; storeMsg = "Sauvegarde illisible : restaure ton dernier fichier depuis l'onglet Sauvegarde."; storeOk = false; } }
    if (!S || !S.events) S = blank();
    S.prefs = S.prefs || { ctx: "metro", len: 5 }; S.concepts = S.concepts || {}; S.seen = S.seen || {};
  }
  function save() {
    var txt = JSON.stringify(S);
    try {
      localStorage.setItem(KEY, txt);
      var back = localStorage.getItem(KEY);
      if (back !== txt) throw new Error("relecture différente");
      storeOk = true; storeMsg = ""; S.lastSaveOk = Date.now();
    } catch (e) {
      storeOk = false;
      storeMsg = (e && e.name === "QuotaExceededError") ? "Stockage plein : exporte ta progression (onglet Sauvegarde)." : "Sauvegarde impossible sur cet appareil : exporte ta progression avant de fermer.";
    }
    renderSaveBadge();
  }
  function renderSaveBadge() {
    var b = $("saveBadge");
    b.className = "save " + (storeOk ? "ok" : "ko");
    b.textContent = storeOk ? "✓ Sauvegardé" : "⚠ Non sauvegardé";
    $("storeBanner").innerHTML = storeOk ? "" : '<div class="banner ko">' + esc(storeMsg) + "</div>";
  }
  function askPersist() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (g) { persisted = g; }); } catch (e) {}
  }
  load(); save(); askPersist();

  // ======================= MÉMOIRE =======================
  var modOf = {}; LS.COURSE.forEach(function (m) { m.pids.forEach(function (p) { if (p[0] === "D") modOf[p] = m.id; }); });
  var CTX = { conceptOk: function (pid) { var m = modOf[pid]; return !m || !!S.concepts[m]; } };
  var ST = {};
  function refold() { ST = E.fold(S.events, CTX); }
  refold();
  function unlocked(pid) { return pid[0] !== "D" || CTX.conceptOk(pid); }

  // ======================= THÈMES =======================
  var FAMS = [
    { id: "R", title: "Réflexes du MathBook", sub: "Les gestes de calcul mental des chapitres 0 à 5, 7 et 14 à 19 : gauche à droite, moitié/double, compléments, virgules, divisions, %.", test: function (p) { return p[0] === "R"; } },
    { id: "M", title: "Automatismes", sub: "Les briques de tout calcul de case : multiplications, divisions, fractions, zéros, points de %.", test: function (p) { return p[0] === "M"; } },
    { id: "C", title: "Mécanismes de case", sub: "Sizing, CA, marges, point mort, opérations, cash : ce que l'interviewer demande vraiment.", test: function (p) { return p[0] === "C"; } },
    { id: "S", title: "Variantes sectorielles", sub: "Les mêmes mécanismes en énergie, santé, banque, hôtellerie, RH.", test: function (p) { return p[0] === "S"; } },
    { id: "D", title: "Deal Valuation", sub: "EV, multiples, synergies, MOIC/TRI, DCF, LBO. Passe d'abord par l'onglet Deal pour le cours.", test: function (p) { return p[0] === "D"; } }
  ];
  var ORDER = Object.keys(C).sort(function (a, b) { var o = "RMCSD"; return o.indexOf(a[0]) - o.indexOf(b[0]) || a.localeCompare(b); });
  var LONG = { C36: 1, C37: 1, S01: 1, C19: 1, D10: 1, D14: 1, S05: 1 };
  function metroOk(p) { var c = C[p]; return !LONG[p] && c.lvl !== "C" && c.prio !== "P2"; }
  function poolFor(ctx, famId) {
    return ORDER.filter(function (p) {
      if (famId && p[0] !== famId) return false;
      if (!unlocked(p)) return false;
      if (ctx === "metro" && !metroOk(p)) return false;
      if (!famId && C[p].prio === "P2") return false;
      return true;
    });
  }

  // ======================= NAVIGATION =======================
  var VIEWS = ["home", "fam", "lesson", "deal", "mod", "run", "end", "prog", "save"];
  var TAB = { home: "home", fam: "home", lesson: "home", deal: "deal", mod: "deal", run: "home", end: "home", prog: "prog", save: "save" };
  var cur = "home";
  function show(v) {
    cur = v;
    VIEWS.forEach(function (k) { $("v-" + k).classList.toggle("hide", k !== v); });
    each("#nav button", function (b) { b.classList.toggle("on", b.dataset.v === TAB[v]); });
    $("nav").classList.toggle("hide", v === "run");
    window.scrollTo(0, 0);
    if (v === "home") renderHome(); if (v === "deal") renderDeal(); if (v === "prog") renderProg(); if (v === "save") renderSave();
  }
  each("#nav button", function (b) { b.onclick = function () { if (run) pauseRun(); show(b.dataset.v); }; });
  each("[data-back]", function (b) { b.onclick = function () { show(b.dataset.back); }; });

  // ======================= ACCUEIL =======================
  function statusOf(p) { return ST[p] ? ST[p].status : "new"; }
  function famStats(f) { var ps = ORDER.filter(f.test), g = 0, o = 0, r = 0; ps.forEach(function (p) { var s = statusOf(p); if (s === "green") g++; else if (s === "orange") o++; else if (s === "red") r++; }); return { n: ps.length, g: g, o: o, r: r }; }
  function renderHome() {
    var ctx = S.prefs.ctx;
    each("#ctxSeg button", function (b) { b.classList.toggle("on", b.dataset.c === ctx); });
    $("ctxHelp").textContent = ctx === "metro" ? "Séances courtes, calcul de tête, une question à la fois. Pas de tableau ni de calcul long." : "Tout le catalogue : tableaux, mini-cases enchaînés, Deal. Une fois sur deux, tu choisis d'abord la formule sans qu'on te la nomme.";
    $("tableExtras").classList.toggle("hide", ctx !== "table");
    each("#lenRow button", function (b) { b.classList.toggle("on", +b.dataset.n === S.prefs.len); });
    var now = Date.now(), due = Object.keys(ST).filter(function (p) { return ST[p].due <= now && unlocked(p); }).length;
    $("dueLine").textContent = S.events.length ? (due ? due + " notion(s) à revoir aujourd'hui : la séance du jour commence par elles." : "Aucune révision due : la séance mélange tes points faibles et des notions nouvelles.") : "Première séance : l'app découvre ton niveau thème par thème. Chaque notion nouvelle est d'abord expliquée.";
    var ss = S.session;
    $("resumeBox").innerHTML = (ss && ss.items && ss.i < ss.items.length) ? '<div class="banner tip">Séance interrompue (' + ss.i + "/" + ss.items.length + ' faites). <button class="link" id="resume">Reprendre</button> · <button class="link" id="dropS">Abandonner</button></div>' : "";
    if ($("resume")) { $("resume").onclick = function () { resumeRun(); }; $("dropS").onclick = function () { S.session = null; save(); renderHome(); }; }
    $("famList").innerHTML = FAMS.map(function (f) { var s = famStats(f); return '<button data-f="' + f.id + '"><span class="nm"><b>' + esc(f.title) + '</b><div class="meta">' + s.n + " notions · " + s.g + " maîtrisées · " + s.o + " en cours · " + s.r + " à retravailler</div></span>›</button>"; }).join("");
    each("#famList button", function (b) { b.onclick = function () { openFam(b.dataset.f); }; });
    var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone;
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    $("installTip").innerHTML = standalone ? "" : '<div class="banner tip"><b>Ajoute MathDrill à ton écran d\'accueil</b> pour l\'ouvrir comme une app, hors ligne, avec ta progression gardée. ' + (ios ? "Safari : bouton Partager, puis « Sur l'écran d'accueil »." : "Chrome : menu ⋮, puis « Ajouter à l'écran d'accueil ».") + " Ouvre-la ensuite toujours depuis l'icône.</div>";
  }
  each("#ctxSeg button", function (b) { b.onclick = function () { S.prefs.ctx = b.dataset.c; S.prefs.len = b.dataset.c === "metro" ? 5 : 10; save(); renderHome(); }; });
  each("#lenRow button", function (b) { b.onclick = function () { S.prefs.len = +b.dataset.n; save(); renderHome(); }; });
  $("goAdaptive").onclick = function () { startRun({ kind: "adaptive", ctx: S.prefs.ctx, n: S.prefs.len }); };
  $("goChain").onclick = function () { startRun({ kind: "chain", ctx: "table" }); };
  $("goExhibit").onclick = function () { startRun({ kind: "list", ctx: "table", pids: ["C36", "C37"], n: Math.min(S.prefs.len, 6) }); };

  var famCur = null;
  function openFam(fid) {
    famCur = FAMS.filter(function (f) { return f.id === fid; })[0];
    $("famTitle").textContent = famCur.title; $("famSub").textContent = famCur.sub;
    var ps = ORDER.filter(famCur.test);
    $("patList").innerHTML = ps.map(function (p) {
      var s = ST[p], st = statusOf(p), lock = !unlocked(p);
      var meta = lock ? "Cours Deal à valider d'abord" : s ? (s.okUnaided + "/" + s.nUnaided + " justes sans aide" + (st === "green" ? " · maîtrisé" : s.why && s.why.length ? " · pour le vert : " + s.why[0] : "")) : "Jamais fait";
      return '<button data-p="' + p + '"><span class="dot ' + st + '"></span><span class="nm">' + esc(C[p].name) + (C[p].book ? ' <span class="tag">MathBook ' + esc(C[p].book) + "</span>" : "") + '<div class="meta">' + esc(meta) + "</div></span>›</button>";
    }).join("");
    each("#patList button", function (b) { b.onclick = function () { openLesson(b.dataset.p, "fam"); }; });
    $("famGo").onclick = function () { startRun({ kind: "adaptive", ctx: S.prefs.ctx, n: S.prefs.len, fam: fid }); };
    show("fam");
  }

  // ======================= FICHE D'UN PATTERN =======================
  function lessonHTML(p, it) {
    var L = LS.L[p] || {}, c = C[p];
    var h = '<h2 style="margin-top:4px">' + esc(c.name) + "</h2>";
    if (c.book) h += '<span class="tag">MathBook ' + esc(c.book) + "</span>";
    h += blk("À quoi ça sert en case", esc(L.use || ""));
    h += blk("Cas d'usage", esc(L.ex || ""));
    h += blk("Formule", (L.eq || [c.formula]).map(function (e) { return '<div class="eq">' + esc(e) + "</div>"; }).join(""));
    if (it) h += blk("Exemple pas à pas", (it.rule ? '<p>' + esc(it.rule) + "</p>" : "") + '<p class="small">' + esc(it.q) + "</p>" + stepsHTML(it));
    h += blk("Quand y penser", esc(c.signal || ""));
    h += blk("Piège", '<div class="tip">' + esc(c.trap || "") + "</div>");
    h += blk("Contrôle", esc(c.check || ""));
    return h;
  }
  function blk(lbl, inner) { return inner ? '<div class="blk"><div class="lbl">' + esc(lbl) + "</div>" + inner + "</div>" : ""; }
  function stepsHTML(it) { var st = X.stepsOf(it); return '<ol class="steps">' + st.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>"; }
  var lessonFrom = "fam";
  function openLesson(p, from) {
    lessonFrom = from || "fam";
    var ex = D.generate(p, seed());
    $("lessonBody").innerHTML = lessonHTML(p, ex.type === "mcq" ? null : ex);
    $("lessonGo").textContent = unlocked(p) ? "M'entraîner sur cette notion (5 questions)" : "Valider d'abord le cours Deal";
    $("lessonGo").onclick = function () { if (!unlocked(p)) { show("deal"); return; } S.seen[p] = 1; save(); startRun({ kind: "list", ctx: S.prefs.ctx, pids: [p], n: 5 }); };
    $("lessonBack").onclick = function () { if (lessonFrom === "fam" && famCur) openFam(famCur.id); else show(lessonFrom); };
    show("lesson");
  }

  // ======================= PARCOURS DEAL =======================
  function renderDeal() {
    $("modList").innerHTML = LS.COURSE.map(function (m, i) {
      var done = !!S.concepts[m.id], prevDone = i === 0 || !!S.concepts[LS.COURSE[i - 1].id];
      var g = m.pids.filter(function (p) { return statusOf(p) === "green"; }).length;
      return '<button data-m="' + m.id + '"><span class="dot ' + (done ? (g === m.pids.length ? "green" : "orange") : "") + '"></span><span class="nm"><b>' + esc(m.title) + '</b><div class="meta">' + (done ? "Cours validé · " + g + "/" + m.pids.length + " exercices maîtrisés" : prevDone ? "À faire maintenant" : "Conseillé après le module précédent") + "</div></span>›</button>";
    }).join("");
    each("#modList button", function (b) { b.onclick = function () { openMod(b.dataset.m); }; });
  }
  function openMod(id) {
    var m = LS.COURSE.filter(function (x) { return x.id === id; })[0];
    var h = '<h2 style="margin-top:4px">' + esc(m.title) + "</h2>";
    h += blk("Pourquoi c'est important", esc(m.why));
    h += blk("Vocabulaire", m.words.map(function (w) { return "<p><b>" + esc(w[0]) + "</b> : " + esc(w[1]) + "</p>"; }).join(""));
    h += blk("Exemple déroulé", '<ol class="steps">' + m.example.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>");
    h += '<div class="blk"><div class="lbl">Vérifie que tu as compris</div>' + m.check.map(function (q, qi) { return '<div class="card"><p><b>' + esc(q.q) + '</b></p><div data-q="' + qi + '">' + q.options.map(function (o, oi) { return '<button class="opt" data-o="' + oi + '">' + esc(o) + "</button>"; }).join("") + '</div><p class="small hide" id="why' + qi + '"></p></div>'; }).join("") + "</div>";
    h += '<p id="modState" class="small"></p><button class="pri big" id="modGo">Exercices du module</button>';
    h += blk("Notions du module", m.pids.map(function (p) { return '<button class="link" data-l="' + p + '">' + esc(C[p].name) + "</button>"; }).join("<br>"));
    $("modBody").innerHTML = h;
    var right = {};
    function upd() {
      var all = m.check.every(function (_, i) { return right[i]; });
      if (all && !S.concepts[m.id]) { S.concepts[m.id] = Date.now(); save(); refold(); }
      var ok = !!S.concepts[m.id];
      $("modState").innerHTML = ok ? '<span class="check">✓ Cours validé.</span> Les exercices de ce module entrent maintenant dans tes séances.' : "Réponds juste aux questions ci-dessus pour débloquer les exercices.";
      $("modGo").disabled = !ok;
    }
    m.check.forEach(function (q, qi) {
      each('[data-q="' + qi + '"] button', function (b) { b.onclick = function () {
        var good = +b.dataset.o === q.a; right[qi] = right[qi] || good;
        each('[data-q="' + qi + '"] button', function (x) { x.classList.remove("good", "bad"); if (+x.dataset.o === q.a && good) x.classList.add("good"); });
        if (!good) b.classList.add("bad");
        var w = $("why" + qi); w.classList.remove("hide"); w.textContent = (good ? "Oui. " : "Non. ") + (good ? q.why : "Relis l'exemple et réessaie.");
        upd(); }; });
    });
    if (S.concepts[m.id]) m.check.forEach(function (_, i) { right[i] = true; });
    upd();
    $("modGo").onclick = function () { startRun({ kind: "list", ctx: S.prefs.ctx === "metro" ? "metro" : "table", pids: m.pids, n: S.prefs.len, label: m.title }); };
    each("#modBody [data-l]", function (b) { b.onclick = function () { openLesson(b.dataset.l, "deal"); }; });
    show("mod");
  }

  // ======================= SÉANCE =======================
  var run = null, timer = null, t0 = 0, acc = 0;
  var CONFUSE = { C01: ["C02", "C03"], C02: ["C01", "C20"], C03: ["C10", "C01"], C04: ["C02", "C22"], C05: ["C06", "C07"], C06: ["C05", "C13"], C07: ["C10", "C06"], C08: ["C09", "C10"], C09: ["C08", "C18"], C10: ["C07", "C03"], C11: ["C04", "C12"], C12: ["C11", "C26"], C13: ["C14", "C15"], C14: ["C16", "C17"], C15: ["C13", "C16"], C16: ["C14", "C17"], C17: ["C16", "C18"], C18: ["C09", "C17"], C19: ["C14", "C06"], C20: ["C21", "C22"], C21: ["C20", "C25"], C22: ["C20", "C24"], C23: ["C16", "C35"], C24: ["C20", "C22"], C25: ["C21", "C06"], C26: ["C27", "C31"], C27: ["C26", "C33"], C28: ["C29", "C30"], C29: ["C28", "C13"], C30: ["C26", "C29"], C31: ["C26", "C27"], C32: ["C33", "C31"], C33: ["C32", "C27"], C34: ["C06", "C35"], C35: ["C16", "C23"], S01: ["C20", "C06"], S02: ["C20", "C02"], S03: ["C25", "C20"], S04: ["C13", "C31"], S05: ["C11", "C08"], S06: ["C07", "C01"], S07: ["C22", "C27"], S08: ["C03", "C04"], S09: ["C15", "C09"],
    D01: ["D02", "D03"], D02: ["D01", "D21"], D03: ["D04", "D01"], D04: ["D03", "D06"], D05: ["D20", "C05"], D06: ["C06", "D11"], D07: ["D08", "D12"], D08: ["D07", "D12"], D09: ["C13", "D10"], D11: ["D06", "D12"], D12: ["D11", "D07"], D13: ["C06", "D10"], D15: ["D18", "C33"], D16: ["D17", "D19"], D17: ["D16", "D02"], D18: ["D15", "C31"], D19: ["D16", "C29"], D20: ["D05", "D22"], D21: ["D02", "C28"], D22: ["D20", "D05"], D23: ["C34", "D07"] };

  function buildQueue(o) {
    var items = [];
    if (o.kind === "chain") {
      var ci = Math.floor(Math.random() * D.CHAINS.length), ch = D.generateChain(ci, seed());
      ch.steps.forEach(function (s, k) { items.push({ chain: { idx: ci, seed: ch.seed, k: k, title: ch.title, ctx: ch.ctx, so: ch.so, n: ch.steps.length } }); });
      return items;
    }
    for (var i = 0; i < (o.n || 5); i++) items.push({ pick: true });
    return items;
  }
  function startRun(o) {
    run = { o: o, sid: uid(), items: buildQueue(o), i: 0, last: null };
    persistSession(); show("run"); nextItem();
  }
  function persistSession() { if (!run) return; S.session = { o: run.o, sid: run.sid, i: run.i, items: run.items.map(function (x) { return { pick: x.pick, chain: x.chain, pid: x.pid, seed: x.seed, done: x.done, res: x.res, recogAsked: x.recogAsked }; }) }; save(); }
  function resumeRun() {
    var ss = S.session; if (!ss) return;
    run = { o: ss.o, sid: ss.sid, items: ss.items, i: ss.i, last: null };
    show("run"); nextItem(true);
  }
  function pauseRun() { stopTimer(); persistSession(); run = null; }
  $("quit").onclick = function () { stopTimer(); var any = run && run.items.some(function (x) { return x.done; }); if (any) endRun(); else { S.session = null; save(); run = null; show("home"); } };

  function pickPid() {
    var o = run.o, pool;
    if (o.kind === "list") pool = o.pids.filter(unlocked);
    else pool = poolFor(o.ctx, o.fam);
    if (!pool.length) pool = poolFor("table");
    // une notion jamais vue passe d'abord par sa fiche : on limite à 2 nouveautés par séance
    var newCount = run.items.filter(function (x) { return x.wasNew; }).length;
    if (newCount >= Math.ceil(run.items.length / 2) && o.kind !== "list") { var known = pool.filter(function (p) { return S.seen[p] || ST[p]; }); if (known.length >= 3) pool = known; }
    return E.select(pool, ST, Date.now(), Math.random, run.last, {});
  }
  function genItem(slot) {
    if (slot.chain) { var ch = D.generateChain(slot.chain.idx, slot.chain.seed), st = ch.steps[slot.chain.k]; var it = Object.assign({}, st); it.pid = st.pid; it.seed = ch.seed; it.lvl = C[st.pid].lvl; it.chainCtx = ch.ctx; it.chainTitle = ch.title; it.so = slot.chain.k === ch.steps.length - 1 ? ch.so : null; return it; }
    return D.generate(slot.pid, slot.seed);
  }
  function nextItem(resuming) {
    if (!run) return;
    if (run.i >= run.items.length) { endRun(); return; }
    var slot = run.items[run.i];
    if (slot.pick && !slot.pid) { slot.pid = pickPid(); slot.seed = seed(); slot.wasNew = !S.seen[slot.pid] && !ST[slot.pid]; }
    if (slot.chain && !slot.pid) { var ch = D.generateChain(slot.chain.idx, slot.chain.seed); slot.pid = ch.steps[slot.chain.k].pid; slot.seed = slot.chain.seed; }
    run.last = slot.pid;
    var it = genItem(slot); run.cur = it; it.hint = false; it.recog = null;
    persistSession();
    $("runPos").textContent = (run.o.label ? run.o.label + " · " : "") + "Question " + (run.i + 1) + "/" + run.items.length;
    if (slot.wasNew && !S.seen[slot.pid] && !slot.chain) { renderIntro(slot, it); return; }
    renderQuestion(slot, it);
  }
  function renderIntro(slot, it) {
    stopTimer(); $("clock").textContent = "";
    var p = slot.pid, ex = D.generate(p, seed() ^ 77);
    $("runBody").innerHTML = '<div class="banner tip">Nouvelle notion : lis la fiche, puis à toi. Pas de chrono pendant la lecture.</div>' + lessonHTML(p, ex.type === "mcq" ? null : ex) + '<button class="pri big" id="introGo">J\'ai compris, à moi</button>';
    $("introGo").onclick = function () { S.seen[p] = 1; save(); window.scrollTo(0, 0); renderQuestion(slot, it); };
  }
  function tableHTML(t) { return '<div class="tblwrap"><table class="ex"><tr>' + t.head.map(function (h, j) { return "<th" + (j ? ' class="n"' : "") + ">" + esc(h) + "</th>"; }).join("") + "</tr>" + t.rows.map(function (r) { return "<tr>" + r.map(function (x, j) { return "<td" + (j ? ' class="n"' : "") + ">" + esc(x) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>"; }

  function renderQuestion(slot, it) {
    var h = "";
    if (it.chainCtx) h += '<div class="ctx"><b>' + esc(it.chainTitle) + "</b><br>" + esc(it.chainCtx) + "</div>";
    if (it.table) h += tableHTML(it.table);
    h += '<div class="q">' + esc(it.q) + "</div>";
    if (it.unit && !it.scale) h += '<div class="small">Réponse en ' + esc(it.unit) + (it.tol && it.tol.label && it.tol.label !== "exact" ? " · tolérance " + esc(it.tol.label) : "") + "</div>";
    else if (it.scale) h += '<div class="small">Choisis aussi l\'unité' + (it.tol && it.tol.label && it.tol.label !== "exact" ? " · tolérance " + esc(it.tol.label) : "") + "</div>";
    h += '<div id="hintBox"></div><div id="zone"></div>';
    $("runBody").innerHTML = h;
    var askRecog = run.o.ctx === "table" && !slot.chain && it.type !== "mcq" && !it.table && /^[CSD]/.test(slot.pid) && CONFUSE[slot.pid] && (slot.recogAsked === undefined ? (slot.recogAsked = Math.random() < 0.5) : slot.recogAsked);
    startTimer();
    if (askRecog) renderRecog(slot, it); else renderAnswer(slot, it);
  }
  function renderRecog(slot, it) {
    var p = slot.pid, opts = [p].concat(CONFUSE[p].filter(function (q) { return C[q] && LS.L[q]; }).slice(0, 2));
    opts.sort(function () { return Math.random() - 0.5; });
    $("zone").innerHTML = '<p class="small"><b>D\'abord :</b> quelle formule utilises-tu ?</p>' + opts.map(function (q) { return '<button class="opt" data-p="' + q + '">' + esc((LS.L[q].eq || [C[q].formula]).join("  ·  ")) + "</button>"; }).join("");
    each("#zone .opt", function (b) { b.onclick = function () {
      it.recog = b.dataset.p === p;
      each("#zone .opt", function (x) { x.disabled = true; if (x.dataset.p === p) x.classList.add("good"); else if (x === b) x.classList.add("bad"); });
      setTimeout(function () { renderAnswer(slot, it); }, it.recog ? 350 : 1100);
    }; });
  }
  function renderAnswer(slot, it) {
    if (it.type === "mcq") {
      $("zone").innerHTML = it.options.map(function (o, i) { return '<button class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + '<div class="row"><button class="ghost" id="dunno">Je ne sais pas</button></div>';
      each("#zone .opt", function (b) { b.onclick = function () { submit(slot, it, b.dataset.i, null, b); }; });
      $("dunno").onclick = function () { submit(slot, it, null, null, null, true); };
      return;
    }
    var units = it.scale ? E.SCALES[it.scale].map(function (u) { return u[0]; }) : null;
    var val = "", unit = null;
    var z = '<div class="disp"><span class="val empty" id="val">ta réponse</span><span class="u" id="uShow">' + esc(it.scale ? "" : (it.unit || "")) + "</span></div>";
    if (units) z += '<div class="units">' + units.map(function (u) { return '<button data-u="' + u + '">' + esc(u) + "</button>"; }).join("") + "</div>";
    z += '<div class="pad">' + ["7", "8", "9", "⌫", "4", "5", "6", "±", "1", "2", "3", "OK", ",", "0", "00"].map(function (k) {
      var cls = k === "OK" ? "ok" : (k === "⌫" || k === "±") ? "op" : "";
      return '<button class="' + cls + '" data-k="' + k + '">' + (k === "OK" ? "Valider" : k) + "</button>"; }).join("") + "</div>";
    z += '<div class="row" style="margin-top:8px;justify-content:space-between"><button class="ghost" id="hintBtn">Indice</button><button class="ghost" id="dunno">Je ne sais pas</button></div>';
    $("zone").innerHTML = z;
    function paint() { var v = $("val"); v.textContent = val ? val.replace(/^-/, "−") : "ta réponse"; v.classList.toggle("empty", !val); $("uShow").textContent = it.scale ? (unit || "") : (it.unit || ""); }
    function press(k) {
      if (k === "OK") { if (!val) return; if (units && !unit) { $("uShow").textContent = "unité ?"; flash(); return; } submit(slot, it, val, unit); return; }
      if (k === "⌫") val = val.slice(0, -1);
      else if (k === "±") val = val.charAt(0) === "-" ? val.slice(1) : "-" + val;
      else if (k === ",") { if (val.indexOf(",") < 0) val = (val === "" || val === "-" ? val + "0" : val) + ","; }
      else if (val.replace(/[-,]/g, "").length < 12) val += k;
      paint();
    }
    function flash() { var u = $("zone").querySelector(".units"); if (u) { u.style.outline = "2px solid var(--ko)"; setTimeout(function () { u.style.outline = ""; }, 700); } }
    each("#zone .pad button", function (b) { b.onclick = function () { press(b.dataset.k); }; });
    each("#zone .units button", function (b) { b.onclick = function () { unit = b.dataset.u; each("#zone .units button", function (x) { x.classList.toggle("on", x === b); }); paint(); }; });
    $("hintBtn").onclick = function () { it.hint = true; this.disabled = true; $("hintBox").innerHTML = '<div class="tip"><b>Indice :</b> ' + esc(it.rule || (LS.L[slot.pid].eq || [C[slot.pid].formula]).join(" · ")) + '<br><span class="small">Une réussite avec indice compte, mais pas pour le statut « maîtrisé ».</span></div>'; };
    $("dunno").onclick = function () { submit(slot, it, null, null, null, true); };
    keyHandler = function (e) {
      if (cur !== "run") return;
      var k = e.key;
      if (/^[0-9]$/.test(k)) press(k); else if (k === "," || k === ".") press(","); else if (k === "Backspace") press("⌫"); else if (k === "-" || k === "+") { if (k === "-" || val.charAt(0) === "-") press("±"); } else if (k === "Enter") press("OK"); else return;
      e.preventDefault();
    };
  }
  var keyHandler = null;
  document.addEventListener("keydown", function (e) { if (keyHandler) keyHandler(e); });

  function startTimer() { stopTimer(); acc = 0; t0 = Date.now(); $("clock").textContent = "0 s"; timer = setInterval(function () { $("clock").textContent = Math.round(elapsed()) + " s"; }, 500); }
  function elapsed() { return acc + (t0 ? (Date.now() - t0) / 1000 : 0); }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { if (timer) { acc += (Date.now() - t0) / 1000; t0 = 0; } if (run) persistSession(); } else if (timer) t0 = Date.now(); });

  function submit(slot, it, raw, unitSel, btn, dunno) {
    keyHandler = null;
    var secs = Math.round(elapsed()); stopTimer(); $("clock").textContent = secs + " s";
    var j = dunno ? { res: "ko", code: "E01", msg: "Pas de souci : lis la méthode, la notion reviendra vite.", given: null } : E.judge(it, raw, unitSel, { seconds: secs });
    if (dunno) j.code = "E01";
    var ev = { id: uid(), sid: run.sid, ts: Date.now(), cat: VERSION, pid: slot.pid, seed: it.seed, mode: slot.chain ? "chain" : run.o.ctx === "table" ? (it.recog !== null ? "hidden" : it.table ? "exhibit" : "table") : "metro", ctx: run.o.ctx, lang: "fr",
      q: it.q, exp: it.ans, unit: it.unit, given: j.given === undefined ? null : j.given, gunit: j.gunit || null, res: j.res, code: j.code || null, t: secs, hint: !!it.hint, recog: it.recog, errSigned: j.errSigned, errRel: j.errRel };
    if (it.recog === false && ev.res === "ok") ev.code = "E02";
    S.events.push(ev); slot.done = true; slot.res = ev.res; slot.evId = ev.id; S.seen[slot.pid] = 1;
    run.i++; persistSession(); refold();
    if (it.type === "mcq" && btn !== undefined) each("#zone .opt", function (x) { x.disabled = true; if (+x.dataset.i === it.ans) x.classList.add("good"); else if (x === btn) x.classList.add("bad"); });
    renderCorrection(slot, it, ev, j);
  }
  function ansTxt(it) { if (it.type === "mcq") return "réponse " + String.fromCharCode(65 + it.ans) + " : " + it.options[it.ans]; return D.fr(it.ans, 2) + (it.unit ? " " + it.unit : ""); }
  function correctionHTML(pid, it, ev, j) {
    var L = LS.L[pid] || {}, c = C[pid], ok = ev.res === "ok";
    var h = '<div class="res ' + (ok ? "ok" : "ko") + '">' + (ok ? "✓ Juste" : ev.res === "na" ? "Non noté" : "✗ " + (ev.given === null ? "Réponse attendue" : "Pas tout à fait")) + " · " + esc(ansTxt(it));
    if (!ok && ev.given !== null && it.type !== "mcq") h += '<div class="sub">Ta réponse : ' + esc(D.fr(ev.given, 3) + (ev.gunit ? " " + ev.gunit : it.unit && !it.scale ? " " + it.unit : "")) + "</div>";
    if (j && j.msg) h += '<div class="sub">' + esc(j.msg) + "</div>";
    if (it.recog === false) h += '<div class="sub">Formule mal choisie au départ : relis « Quand y penser ».</div>';
    h += "</div>";
    if (it.rule) h += blk("La règle utilisée ici", "<p>" + esc(it.rule) + "</p>");
    h += blk("Méthode pas à pas", stepsHTML(it));
    h += blk("Formule", (L.eq || [c.formula]).map(function (e) { return '<div class="eq">' + esc(e) + "</div>"; }).join(""));
    h += blk("À quoi ça sert en case", esc(L.use || ""));
    h += blk("Cas d'usage", esc(L.ex || ""));
    if (it.so) h += blk("Ce que ça veut dire pour la décision", '<div class="tip">' + esc(it.so) + "</div>");
    h += blk("Piège à éviter", '<div class="tip">' + esc(c.trap || "") + "</div>");
    h += blk("Contrôle rapide", esc(c.check || ""));
    return h;
  }
  function renderCorrection(slot, it, ev, j) {
    var h = (it.chainCtx ? '<div class="ctx"><b>' + esc(it.chainTitle) + "</b><br>" + esc(it.chainCtx) + "</div>" : "") + '<div class="q" style="font-size:16px">' + esc(it.q) + "</div>";
    h += correctionHTML(slot.pid, it, ev, j);
    h += '<button class="pri big" id="nextBtn">' + (run.i >= run.items.length ? "Voir le bilan" : "Question suivante") + "</button>";
    h += '<div class="row" style="margin-top:6px"><button class="link" id="flagBtn">Énoncé faux ou ambigu ? Ne pas compter</button></div>';
    $("runBody").innerHTML = h; window.scrollTo(0, 0);
    $("nextBtn").onclick = function () { window.scrollTo(0, 0); nextItem(); };
    $("flagBtn").onclick = function () { ev.res = "na"; ev.code = "E08"; slot.res = "na"; save(); refold(); this.textContent = "Noté : cette question ne compte pas."; this.disabled = true; };
  }
  function endRun() {
    stopTimer();
    var o = run.o, evs = S.events.filter(function (e) { return e.sid === run.sid; }), scored = evs.filter(function (e) { return e.res !== "na"; }), ok = scored.filter(function (e) { return e.res === "ok"; }).length;
    S.session = null; save(); refold();
    var h = '<h2 style="margin-top:4px">Bilan de la séance</h2><div class="kpi"><div><b>' + ok + "/" + scored.length + '</b><span>justes</span></div><div><b>' + (scored.length ? Math.round(scored.reduce(function (a, e) { return a + e.t; }, 0) / scored.length) : 0) + ' s</b><span>par question</span></div><div><b>' + scored.filter(function (e) { return !e.hint && e.res === "ok"; }).length + '</b><span>sans indice</span></div></div>';
    var by = {}; scored.forEach(function (e) { (by[e.pid] || (by[e.pid] = [])).push(e); });
    h += "<h3>Notions travaillées</h3>" + Object.keys(by).map(function (p) { var s = ST[p], d = s ? Math.round((s.due - Date.now()) / E.DAY) : 0; return '<div class="row" style="margin:6px 0"><span class="dot ' + statusOf(p) + '"></span><span style="flex:1">' + esc(C[p].name) + '</span><span class="small">' + by[p].filter(function (e) { return e.res === "ok"; }).length + "/" + by[p].length + " · revoir " + (d <= 0 ? "bientôt" : "dans " + d + " j") + "</span></div>"; }).join("");
    var ko = evs.filter(function (e) { return e.res === "ko"; });
    if (ko.length) h += "<h3>À revoir</h3>" + ko.map(function (e) { var it = D.generate(e.pid, e.seed); if (it.q !== e.q) { var slot = run.items.filter(function (x) { return x.evId === e.id; })[0]; if (slot && slot.chain) it = genItem(slot); } return "<details><summary>✗ " + esc(e.q.length > 80 ? e.q.slice(0, 78) + "…" : e.q) + "</summary>" + correctionHTML(e.pid, it, e, null) + "</details>"; }).join("");
    h += '<button class="pri big" id="again">Nouvelle séance</button><button class="big" id="toHome" style="margin-top:8px">Accueil</button>';
    $("endBody").innerHTML = h; run = null; show("end");
    $("again").onclick = function () { startRun(o.kind === "chain" ? o : { kind: o.kind, ctx: o.ctx, n: o.n || S.prefs.len, fam: o.fam, pids: o.pids, label: o.label }); };
    $("toHome").onclick = function () { show("home"); };
  }

  // ======================= SUIVI =======================
  function renderProg() {
    var sc = S.events.filter(function (e) { return e.res !== "na"; }), un = sc.filter(function (e) { return !e.hint; }), okU = un.filter(function (e) { return e.res === "ok"; }).length;
    var days = {}; sc.forEach(function (e) { days[new Date(e.ts).toDateString()] = 1; });
    var h = '<h2 style="margin-top:4px">Suivi</h2><div class="kpi"><div><b>' + sc.length + '</b><span>questions</span></div><div><b>' + (un.length ? Math.round(okU / un.length * 100) : 0) + ' %</b><span>justes sans aide</span></div><div><b>' + Object.keys(days).length + "</b><span>jours d'entraînement</span></div></div>";
    h += '<p class="small">Vert = maîtrisé : 3 réussites sans indice sur au moins 2 jours, 4 justes sur les 5 dernières, et selon le type : vitesse (calcul), une réussite en mode Table (mécanismes), cours validé (Deal). Ces seuils sont des choix pédagogiques, pas une norme de recrutement.</p>';
    FAMS.forEach(function (f) {
      var ps = ORDER.filter(f.test).filter(function (p) { return ST[p]; });
      h += "<h3>" + esc(f.title) + "</h3>";
      if (!ps.length) { h += '<p class="small">Pas encore pratiqué (ce n\'est pas une faiblesse, juste pas de données).</p>'; return; }
      h += ps.map(function (p) { var s = ST[p], med = E.median(s.times); return '<details><summary><span class="dot ' + s.status + '"></span> ' + esc(C[p].name) + '</summary><p class="small">' + s.okUnaided + "/" + s.nUnaided + " justes sans aide · médiane " + (med === null ? "—" : Math.round(med) + " s") + " · prochaine révision " + (s.due <= Date.now() ? "maintenant" : "dans " + Math.ceil((s.due - Date.now()) / E.DAY) + " j") + "</p>" + (s.status !== "green" && s.why && s.why.length ? '<p class="small">Pour passer au vert : ' + esc(s.why.join(" ; ")) + "</p>" : "") + '<button class="link" data-l="' + p + '">Revoir la fiche</button></details>'; }).join("");
    });
    var sk = E.foldSkills(S.events, CTX), multi = Object.keys(sk).filter(function (k) { return sk[k].members.length > 1; });
    if (multi.length) h += "<h3>Compétences consolidées</h3><p class=\"small\">Une compétence regroupe ses variantes (Deal, secteurs) : une erreur sur l'une compte aussi pour la compétence.</p>" + multi.map(function (k) { var s = sk[k]; return '<div class="row" style="margin:6px 0"><span class="dot ' + s.status + '"></span><span style="flex:1">' + esc(C[k].name) + '</span><span class="small">' + s.okUnaided + "/" + s.nUnaided + " · " + s.members.length + " variantes</span></div>"; }).join("");
    h += '<h3>Bilan pour ChatGPT ou Claude</h3><p class="small">Copie ce bilan dans ta conversation pour faire analyser tes erreurs.</p><button class="big" id="mdCopy">Copier le bilan</button><p class="small" id="mdMsg"></p>';
    $("progBody").innerHTML = h;
    each("#progBody [data-l]", function (b) { b.onclick = function () { openLesson(b.dataset.l, "prog"); }; });
    $("mdCopy").onclick = function () { copyText(E.exportMarkdown(S.events, ST, Date.now(), null), $("mdMsg")); };
  }

  // ======================= SAUVEGARDE =======================
  function copyText(t, msgEl) {
    function ok() { msgEl.textContent = "Copié."; }
    function ko() { msgEl.innerHTML = 'Copie automatique impossible : sélectionne le texte ci-dessous.<textarea readonly>' + esc(t) + "</textarea>"; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ko); else ko(); } catch (e) { ko(); }
  }
  function fname() { var d = new Date(); return "MathDrill_sauvegarde_" + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + ".json"; }
  function backupJSON() { var o = JSON.parse(E.exportJSON(S.events, null)); o.concepts = S.concepts; o.seen = S.seen; o.prefs = S.prefs; return JSON.stringify(o); }
  function renderSave() {
    var last = S.lastBackup ? Math.floor((Date.now() - S.lastBackup) / E.DAY) : null;
    var h = '<h2 style="margin-top:4px">Sauvegarde</h2>';
    h += '<div class="card"><p><b>' + (storeOk ? "✓ Progression enregistrée sur ce téléphone" : "⚠ Progression NON enregistrée") + "</b></p>";
    h += '<p class="small">' + S.events.length + " réponses enregistrées · dernière écriture vérifiée " + (S.lastSaveOk ? new Date(S.lastSaveOk).toLocaleString("fr-FR") : "—") + "<br>Protection contre l'effacement automatique : " + (persisted === true ? "accordée par le navigateur" : persisted === false ? "non accordée (normal hors écran d'accueil sur certains navigateurs)" : "en attente") + "</p>";
    h += '<p class="small">Chaque réponse est écrite sur le téléphone puis relue pour vérifier. La progression vit dans cette app sur cet appareil : si tu changes de téléphone ou effaces les données du navigateur, il faut un fichier de sauvegarde.</p></div>';
    h += "<h3>Fichier de secours</h3>" + (last === null ? '<p class="small">Aucune sauvegarde fichier pour l\'instant.</p>' : '<p class="small">Dernier fichier : il y a ' + last + " jour" + (last > 1 ? "s" : "") + ".</p>");
    h += '<button class="pri big" id="bkFile">Enregistrer un fichier de sauvegarde</button><p class="small" id="bkMsg"></p>';
    h += '<button class="big" id="bkCopy">Copier la sauvegarde (texte)</button><p class="small" id="cpMsg"></p>';
    h += '<h3>Restaurer</h3><p class="small">Fichier exporté par MathDrill (V2 ou V3). Les réponses déjà présentes ne sont pas dupliquées.</p><input type="file" id="impFile" accept=".json,application/json"><p class="small">ou colle le texte :</p><textarea id="impTxt"></textarea><button class="big" id="impGo">Importer le texte collé</button><p class="small" id="impMsg"></p>';
    h += '<h3>Tout effacer</h3><button class="ghost" id="wipe">Effacer la progression de cet appareil</button><p class="small" id="wipeMsg"></p>';
    $("saveBody").innerHTML = h;
    $("bkFile").onclick = function () {
      var txt = backupJSON(), f = fname(), blob = new Blob([txt], { type: "application/json" });
      function done(m) { S.lastBackup = Date.now(); save(); $("bkMsg").textContent = m; }
      try {
        var file = typeof File !== "undefined" ? new File([blob], f, { type: "application/json" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: f }).then(function () { done("Fichier partagé : range-le dans Fichiers ou iCloud Drive."); }, function () { $("bkMsg").textContent = "Partage annulé."; }); return; }
      } catch (e) {}
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      done("Fichier « " + f + " » téléchargé.");
    };
    $("bkCopy").onclick = function () { copyText(backupJSON(), $("cpMsg")); S.lastBackup = Date.now(); save(); };
    function doImport(txt) {
      var r = E.importJSON(txt, S.events);
      if (r.error) { $("impMsg").textContent = r.error; return; }
      S.events = r.events;
      try { var o = JSON.parse(txt); if (o.concepts) Object.keys(o.concepts).forEach(function (k) { S.concepts[k] = S.concepts[k] || o.concepts[k]; }); if (o.seen) Object.keys(o.seen).forEach(function (k) { S.seen[k] = 1; }); } catch (e) {}
      save(); refold(); $("impMsg").textContent = r.added + " réponse(s) ajoutée(s), " + r.dup + " déjà présente(s)" + (r.bad ? ", " + r.bad + " ignorée(s)" : "") + ".";
    }
    $("impFile").onchange = function () { var f = this.files && this.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { doImport(String(rd.result)); }; rd.readAsText(f); };
    $("impGo").onclick = function () { doImport($("impTxt").value); };
    var armed = false;
    $("wipe").onclick = function () { if (!armed) { armed = true; this.textContent = "Confirmer : tout effacer"; $("wipeMsg").textContent = "Pense à enregistrer un fichier avant."; return; } S = blank(); save(); refold(); $("wipeMsg").textContent = "Progression effacée."; this.textContent = "Effacer la progression de cet appareil"; armed = false; };
  }

  // ======================= DÉMARRAGE =======================
  renderSaveBadge();
  show("home");
  window.addEventListener("pagehide", function () { if (run) persistSession(); });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) { try { navigator.serviceWorker.register("sw.js"); } catch (e) {} }
  window.__MD = { S: function () { return S; }, refold: refold, ST: function () { return ST; }, cur: function () { return run && run.cur; }, slot: function () { return run && run.items[run.i]; } };
})();
