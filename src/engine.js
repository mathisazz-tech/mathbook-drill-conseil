/* Mathbook Drill V2 — moteur : validation, diagnostic, mémoire adaptative, export/import. Pur JS, testable sous Node. */
var ENGINE = (function () {
  "use strict";
  var D = (typeof DRILL !== "undefined") ? DRILL : require("./catalog.js");
  var DAY = 86400000;
  var INTERVALS = [0, 1, 3, 7, 14, 30]; // J+0, J+1, J+3, J+7, J+14, J+30
  var TARGET_S = { A: 25, B: 60, C: 90, D: 120 };
  var GREEN = { okUnaided: 3, days: 2, transfer: true }; // configurable, non validé scientifiquement
  var CODES = {
    E01: "Connaissance : formule inconnue", E02: "Reconnaissance : mauvaise formule choisie", E03: "Base / dénominateur / périmètre",
    E04: "Arithmétique / décomposition", E05: "Unité / ordre de grandeur / signe", E06: "Interprétation économique",
    E07: "Lenteur malgré réponse juste", E08: "Énoncé ambigu ou erroné (non scoré)", NR: "Non répondu"
  };
  var SCALES = { eur: [["k€", 1e3], ["M€", 1e6], ["Md€", 1e9]], n: [["k", 1e3], ["M", 1e6], ["Md", 1e9]] };
  function mult(scale, label) { var s = SCALES[scale] || []; for (var i = 0; i < s.length; i++) if (s[i][0] === label) return s[i][1]; return null; }

  // FR / EN : "1 234,5", "1,234.5", "1234.5", "12,5 %"
  function parseNum(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim().replace(/[\s\u00a0\u202f]/g, "").replace(/[%€$×x]/gi, "").replace(/[\u2212\u2013\u2014]/g, "-").replace(/^\+/, "").replace(/^\(([^)]*)\)$/, "-$1");
    if (s === "" || s === "-" || s === "+") return null;
    var hasC = s.indexOf(",") >= 0, hasD = s.indexOf(".") >= 0;
    if (hasC && hasD) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (hasC) {
      var parts = s.split(",");
      if (parts.length > 2) s = parts.join(""); // 1,234,567
      else s = s.replace(",", ".");
    }
    if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.?$/.test(s)) return null;
    var v = Number(s); return isFinite(v) ? v : null;
  }
  function within(item, x) {
    var tol = item.tol || D.T.EX, d = Math.abs(x - item.ans);
    var lim = Math.max(tol.abs || 0, (tol.rel || 0) * Math.abs(item.ans));
    return d <= lim + 1e-9;
  }

  // judge : renvoie {res: ok|ko|na, code, msg, given, errSigned, errRel}
  function judge(item, raw, unitSel, opts) {
    opts = opts || {};
    if (item.type === "mcq") {
      if (raw === null || raw === undefined || raw === "") return { res: "ko", code: "NR", msg: "Pas de réponse.", given: null };
      var ok = Number(raw) === item.ans;
      return { res: ok ? "ok" : "ko", code: ok ? null : "E06", msg: ok ? "" : "Mauvaise lecture : vérifie bornes, sommes et unités.", given: Number(raw) };
    }
    var x = parseNum(raw);
    if (x === null) return { res: "ko", code: "NR", msg: "Pas de réponse lisible.", given: null };
    var xv = x;
    if (item.scale) {
      if (!unitSel) return { res: "ko", code: "E05", msg: "Unité non précisée : annonce toujours l'unité.", given: x };
      xv = x * mult(item.scale, unitSel) / mult(item.scale, item.unit);
    }
    var errSigned = xv - item.ans, errRel = item.ans !== 0 ? errSigned / Math.abs(item.ans) : null;
    var base = { given: x, gunit: item.scale ? (unitSel || null) : null, errSigned: errSigned, errRel: errRel };
    if (within(item, xv)) {
      var slow = opts.seconds && opts.seconds > (TARGET_S[item.lvl] || 45);
      return Object.assign(base, { res: "ok", code: slow ? "E07" : null, msg: slow ? "Juste mais lent : vise moins de " + TARGET_S[item.lvl] + " s." : "" });
    }
    if (item.scale && within(item, x)) return Object.assign(base, { res: "ko", code: "E05", msg: "Bon chiffre, mauvaise unité : " + D.fr(x) + " " + item.unit + ", pas " + unitSel + "." });
    if (item.ans !== 0 && xv !== 0) {
      var ratio = xv / item.ans;
      if (ratio > 0) {
        var k = Math.round(Math.log10(ratio));
        if (k !== 0 && Math.abs(k) <= 9 && Math.abs(Math.log10(ratio) - k) < 0.004) return Object.assign(base, { res: "ko", code: "E05", msg: "Ordre de grandeur : facteur 10^" + k + ". Recompte les zéros et la virgule." });
      } else if (within(item, -xv)) return Object.assign(base, { res: "ko", code: "E05", msg: "Bon montant, mauvais signe." });
    }
    var traps = item.traps || [];
    for (var i = 0; i < traps.length; i++) {
      var t = traps[i];
      if (isFinite(t.v) && Math.abs(xv - t.v) <= Math.max(1e-6, 0.005 * Math.abs(t.v)) && !within(item, t.v)) return Object.assign(base, { res: "ko", code: t.code, msg: t.msg });
    }
    var gap = item.unit === "%" ? "Tu es " + (errSigned > 0 ? "au-dessus" : "en dessous") + " de " + D.fr(Math.abs(errSigned), 1) + " point" + (Math.abs(errSigned) >= 2 ? "s" : "") + "."
      : "Tu es " + (errSigned > 0 ? "au-dessus" : "en dessous") + " de " + D.fr(Math.abs(errRel || 0) * 100, 0) + " %.";
    return Object.assign(base, { res: "ko", code: "E04", msg: gap + " Reprends la méthode ci-dessous étape par étape." });
  }

  // ---------- mémoire : l'état se déduit entièrement des événements (un seul historique) ----------
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var TRANSFER_MODES = { hidden: 1, exhibit: 1, chain: 1, table: 1 };
  function fold(events, ctx) {
    var st = {};
    var ev = events.slice().sort(function (a, b) { return a.ts - b.ts; });
    ev.forEach(function (e) {
      if (e.res === "na") return; // E08 : non scoré
      var s = st[e.pid] || (st[e.pid] = { n: 0, ok: 0, okUnaided: 0, nUnaided: 0, times: [], recent: [], days: {}, transfer: false, codes: {}, step: 0, due: 0, lastTs: 0, lastRes: null, recog: { n: 0, ok: 0 } });
      s.n++; s.lastTs = e.ts; s.lastRes = e.res;
      if (e.code) s.codes[e.code] = (s.codes[e.code] || 0) + 1;
      if (e.recog !== undefined && e.recog !== null) { s.recog.n++; if (e.recog) s.recog.ok++; }
      var unaided = !e.hint;
      if (unaided) { s.nUnaided++; s.recent.push(e.res === "ok"); if (s.recent.length > 10) s.recent.shift(); }
      if (e.res === "ok") {
        s.ok++; s.times.push(e.t); if (s.times.length > 20) s.times.shift();
        if (unaided) {
          s.okUnaided++; s.days[dayKey(e.ts)] = 1;
          if (TRANSFER_MODES[e.mode]) s.transfer = true;
          s.step = Math.min(s.step + 1, INTERVALS.length - 1);
          s.due = e.ts + INTERVALS[s.step] * DAY;
        } else s.due = e.ts + DAY;
      } else { s.step = 0; s.due = e.ts; } // échec : retest rapproché
    });
    Object.keys(st).forEach(function (k) { st[k].status = status(st[k], k, ctx); });
    return st;
  }
  // Vue consolidée par compétence : un exercice D ou S nourrit aussi sa compétence de rattachement (un événement compté une fois par vue)
  function foldSkills(events, ctx) {
    var bySkill = {}, members = {};
    events.forEach(function (e) { var c = D.CAT[e.pid]; if (!c) return; var k = c.skill || e.pid; (bySkill[k] || (bySkill[k] = [])).push(Object.assign({}, e, { pid: k })); (members[k] || (members[k] = {}))[e.pid] = 1; });
    var out = {};
    Object.keys(bySkill).forEach(function (k) { var st = fold(bySkill[k], ctx); if (st[k]) { st[k].members = Object.keys(members[k]); out[k] = st[k]; } });
    return out;
  }
  function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  // Règle « maîtrisé » adaptée au type de compétence (V3) :
  //  M / R (calcul) : 3 réussites non aidées sur 2 jours + 80 % sur les 5 dernières + vitesse (médiane des réussites sous la cible)
  //  C / S (mécanismes) : idem + au moins une réussite en transfert (mode Table : formule non annoncée, exhibit, chaîne)
  //  D (deal) : idem + le test de compréhension du module de cours correspondant réussi
  function needTransfer(pid) { var f = pid ? pid[0] : "C"; return f === "C" || f === "S"; }
  function status(s, pid, ctx) {
    if (!s || s.n === 0) return "new";
    var nd = Object.keys(s.days).length;
    var acc = s.recent.length ? s.recent.filter(Boolean).length / s.recent.length : 0;
    var last5 = s.recent.slice(-5), acc5 = last5.length ? last5.filter(Boolean).length / last5.length : 0;
    var f = pid ? pid[0] : "C", lvl = pid && D.CAT[pid] ? D.CAT[pid].lvl : "B", med = median(s.times);
    var fastOk = (f === "M" || f === "R") ? (med !== null && med <= (TARGET_S[lvl] || 45)) : true;
    var conceptOk = f === "D" ? !!(ctx && ctx.conceptOk && ctx.conceptOk(pid)) : true;
    s.why = [];
    if (s.okUnaided < GREEN.okUnaided) s.why.push((GREEN.okUnaided - s.okUnaided) + " réussite(s) sans indice à faire");
    if (nd < GREEN.days) s.why.push("réussir aussi un autre jour");
    if (needTransfer(pid) && !s.transfer) s.why.push("réussir une fois en mode Table (formule non annoncée)");
    if (!fastOk) s.why.push("aller plus vite (cible " + (TARGET_S[lvl] || 45) + " s)");
    if (!conceptOk) s.why.push("valider le test du cours Deal");
    if (acc5 < 0.8 && s.okUnaided >= GREEN.okUnaided) s.why.push("4 justes sur les 5 dernières");
    if (s.okUnaided >= GREEN.okUnaided && nd >= GREEN.days && (!needTransfer(pid) || s.transfer) && acc5 >= 0.8 && fastOk && conceptOk) return "green";
    if (last5.length >= 2 && acc5 < 0.6) return "red";
    if (s.lastRes === "ko") return "red";
    return acc >= 0.6 ? "orange" : "red";
  }

  // sélection 50 / 30 / 20 : lacunes & retards / maintien & retests / nouveaux contextes
  function select(pool, st, now, rnd, last, legacy) {
    legacy = legacy || {};
    function weak(p) { var s = st[p]; if (s && s.n) return s.status === "red"; var l = legacy[p]; return !!(l && l.n >= 3 && l.ko / l.n > 0.4); }
    var A = [], B = [], C = [];
    pool.forEach(function (p) {
      var s = st[p];
      if (weak(p) || (s && s.n && s.due <= now && s.lastRes === "ko")) A.push(p);
      else if (s && s.n) B.push(p);
      else C.push(p);
    });
    // B : retests dus d'abord
    var Bdue = B.filter(function (p) { return st[p].due <= now; });
    var x = rnd(), order = x < 0.5 ? [A, Bdue, B, C] : x < 0.8 ? [Bdue, B, A, C] : [C, A, Bdue, B];
    for (var i = 0; i < order.length; i++) {
      var cand = order[i].filter(function (p) { return p !== last; });
      if (cand.length) {
        if (order[i] === C) { // nouveaux : P0 d'abord, échantillonnage progressif
          var p0 = cand.filter(function (p) { return D.CAT[p].prio === "P0"; });
          if (p0.length && rnd() < 0.7) cand = p0;
        }
        return cand[Math.floor(rnd() * cand.length)];
      }
    }
    return pool[Math.floor(rnd() * pool.length)];
  }

  // ---------- export / import ----------
  function exportJSON(events, legacy) {
    return JSON.stringify({ format: "mathbook-drill-history", version: 3, catalog: D.CATALOG_VERSION, exported_at: new Date().toISOString(), events: events, legacy_v1: legacy || null });
  }
  function importJSON(text, events) {
    var obj; try { obj = JSON.parse(text); } catch (e) { return { error: "Fichier illisible (JSON invalide)." }; }
    if (!obj || obj.format !== "mathbook-drill-history" || !Array.isArray(obj.events)) return { error: "Format non reconnu : il faut un export MathDrill (V2 ou V3)." };
    var ids = {}; events.forEach(function (e) { ids[e.id] = 1; });
    var added = 0, dup = 0, bad = 0, out = events.slice();
    obj.events.forEach(function (e) {
      if (!e || !e.id || !e.pid || !D.CAT[e.pid] || typeof e.ts !== "number") { bad++; return; }
      if (ids[e.id]) { dup++; return; }
      ids[e.id] = 1; out.push(e); added++;
    });
    return { events: out, added: added, dup: dup, bad: bad, legacy: obj.legacy_v1 || null };
  }

  function famOf(pid) { return pid[0]; }
  var FAMNAME = { M: "Automatismes (M)", C: "Mécanismes case (C)", D: "Deal Valuation (D)", S: "Variantes sectorielles (S)" };
  function exportMarkdown(events, st, now, legacy) {
    var L = [], scored = events.filter(function (e) { return e.res !== "na"; });
    var sessions = {}; scored.forEach(function (e) { sessions[e.sid] = 1; });
    var first = scored.length ? new Date(Math.min.apply(null, scored.map(function (e) { return e.ts; }))) : null;
    L.push("# Bilan MathDrill V3 — " + new Date(now).toLocaleDateString("fr-FR"));
    L.push("");
    L.push("Catalogue " + D.CATALOG_VERSION + " · " + scored.length + " tentatives évaluables · " + Object.keys(sessions).length + " séance" + (Object.keys(sessions).length > 1 ? "s" : "") + (first ? " depuis le " + first.toLocaleDateString("fr-FR") : "") + ". Sans calculatrice. Aucune probabilité de réussite en entretien n'est déduite de ces chiffres.");
    L.push("");
    L.push("## Par pattern (seulement les patterns pratiqués)");
    L.push("| Pattern | n | % justes sans aide | Médiane temps (réussites) | Statut | Erreurs |");
    L.push("|---|---|---|---|---|---|");
    var pids = Object.keys(st).sort();
    pids.forEach(function (p) {
      var s = st[p], c = D.CAT[p];
      var pct = s.nUnaided ? Math.round(s.okUnaided / s.nUnaided * 100) + " %" : "—";
      var med = median(s.times); var codes = Object.keys(s.codes).filter(function (k) { return k !== "E07"; }).map(function (k) { return k + "×" + s.codes[k]; }).join(" ");
      L.push("| " + p + " " + c.name + (c.skill !== p ? " (→ " + c.skill + ")" : "") + " | " + s.n + " | " + pct + " | " + (med === null ? "—" : Math.round(med) + " s") + " | " + ({ green: "vert provisoire", orange: "en cours", red: "à retravailler", "new": "—" })[s.status] + " | " + (codes || "—") + " |");
    });
    var untouched = Object.keys(D.CAT).filter(function (p) { return !st[p]; });
    L.push("");
    L.push("Non pratiqués : " + untouched.length + " patterns (absence de données ≠ faiblesse).");
    var codeTot = {}; scored.forEach(function (e) { if (e.code) codeTot[e.code] = (codeTot[e.code] || 0) + 1; });
    L.push("");
    L.push("## Erreurs observées (codes)");
    var ck = Object.keys(codeTot).sort(function (a, b) { return codeTot[b] - codeTot[a]; });
    if (!ck.length) L.push("Aucune erreur enregistrée.");
    ck.forEach(function (k) { L.push("- " + k + " " + CODES[k] + " : " + codeTot[k]); });
    L.push("");
    L.push("## Exemples synthétiques récents (énoncés générés, aucun corpus privé)");
    scored.filter(function (e) { return e.res === "ko"; }).slice(-8).forEach(function (e) {
      L.push("- [" + e.pid + "] " + e.q + " → attendu " + D.fr(e.exp, 3) + " " + (e.unit || "") + " ; saisi " + (e.given === null || e.given === undefined ? "rien" : D.fr(e.given, 3) + " " + (e.gunit || "")) + " (" + (e.code || "?") + ", " + e.t + " s)");
    });
    L.push("");
    L.push("## Retests dus");
    var due = pids.filter(function (p) { return st[p].due <= now; });
    L.push(due.length ? due.map(function (p) { return p + " " + D.CAT[p].name; }).join(" ; ") : "Aucun pour l'instant.");
    L.push("");
    L.push("## Priorités (3 maximum)");
    var pr = pids.filter(function (p) { return st[p].status === "red"; }).sort(function (a, b) { return (st[a].okUnaided / Math.max(1, st[a].nUnaided)) - (st[b].okUnaided / Math.max(1, st[b].nUnaided)); }).slice(0, 3);
    L.push(pr.length ? pr.map(function (p, i) { return (i + 1) + ". " + p + " " + D.CAT[p].name; }).join("\n") : "Pas assez de données : continuer l'échantillonnage.");
    if (legacy && legacy.cats && Object.keys(legacy.cats).length) {
      L.push("");
      L.push("## Historique V1 (agrégé, conservé)");
      Object.keys(legacy.cats).forEach(function (k) { var l = legacy.cats[k]; L.push("- " + k + " → " + (D.V1DETAIL[k] || "?") + " : " + l.n + " q., " + l.ko + " erreurs"); });
    }
    L.push("");
    L.push("## Demande pour la séance suivante");
    L.push("Analyse ces erreurs par code, sans surinterpréter une erreur isolée. Propose au plus 3 patterns (IDs du catalogue, par ex. C06, M06, D03) à saisir dans « Plan de séance », puis 3 calculs inédits sur la priorité n°1, corrigés après chaque réponse selon le gabarit : réponse + unité, formule, calcul, signal, piège, contrôle, implication. Ne donne pas les réponses avant ma tentative.");
    return L.join("\n");
  }
  function parsePlan(text) { var m = String(text || "").toUpperCase().match(/\b[MCDS]\d{2}\b/g) || []; var out = []; m.forEach(function (x) { if (D.CAT[x] && out.indexOf(x) < 0) out.push(x); }); return out; }

  function migrateV1(v1) {
    if (!v1 || !v1.cats) return null;
    var cats = {}; Object.keys(v1.cats).forEach(function (k) { var c = v1.cats[k]; if (c && c.n) cats[k] = { n: c.n, ko: c.ko || 0, t: c.t || 0, pid: D.V1MAP[k] }; });
    return { cats: cats, errors: (v1.errors || []).slice(-40), sessions: v1.sessions || 0, since: v1.since || null, migrated_at: new Date().toISOString() };
  }
  function legacyByPid(legacy) { var o = {}; if (!legacy || !legacy.cats) return o; Object.keys(legacy.cats).forEach(function (k) { var l = legacy.cats[k]; if (l.pid) { var x = o[l.pid] || (o[l.pid] = { n: 0, ko: 0 }); x.n += l.n; x.ko += l.ko; } }); return o; }

  return { parseNum: parseNum, judge: judge, fold: fold, foldSkills: foldSkills, needTransfer: needTransfer, status: status, select: select, exportJSON: exportJSON, importJSON: importJSON, exportMarkdown: exportMarkdown, parsePlan: parsePlan, migrateV1: migrateV1, legacyByPid: legacyByPid, median: median, CODES: CODES, SCALES: SCALES, TARGET_S: TARGET_S, INTERVALS: INTERVALS, DAY: DAY, FAMNAME: FAMNAME, famOf: famOf, within: within };
})();
if (typeof module !== "undefined") module.exports = ENGINE;
