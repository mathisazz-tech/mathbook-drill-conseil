/* QA Mathbook Drill V2 : oracles indépendants, propriétés, exemples de référence, cas limites, moteur. */
const D = require("./catalog.js"), E = require("./engine.js");
let pass = 0, fail = 0; const fails = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; if (fails.length < 60) fails.push(msg); } }
function near(a, b, eps = 1e-6) { return Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)); }
const sum = a => a.reduce((x, y) => x + y, 0);

// ---------- 1. Oracles indépendants (recalcul depuis les paramètres, écrits séparément des générateurs) ----------
const O = {
  M01: p => p.plus ? p.a + p.b : p.a - p.b,
  M02: p => p.a * p.b,
  M03: p => p.n !== undefined ? p.n ** 2 : p.k !== undefined ? p.k * p.b : p.m !== undefined ? p.a * p.m : p.a * p.b,
  M04: p => p.n / p.d,
  M05: p => p.base !== undefined ? p.base * p.a / p.b : 100 * p.a / p.b,
  M06: p => p.ca !== undefined ? (p.ca * 1e6 / (p.k * 1e3)) / 1e3 : p.x !== undefined ? p.x * p.p : (p.a * 1e6 * p.b * 1e3) / 1e9,
  M07: p => p.bps !== undefined ? p.bps / 100 : null, // M07 a 2 variantes ambiguës sur p → contrôle via la question
  M08: p => p.fin !== undefined ? p.fin / (1 + p.t / 100) : 100 * ((1 + p.a / 100) * (1 + p.b / 100) - 1),
  M09: p => p.b / p.a,
  M10: p => p.a * p.b,
  M11: p => p.n !== undefined ? 100 * ((1 + p.g / 100) ** p.n - 1) : Math.log(2) / Math.log(1 + p.g / 100),
  C01: p => p.pop * 1e6 * (p.el / 100) * (p.pen / 100) * p.fq * p.pr / 1e6,
  C02: p => p.s * p.cap * (p.u / 100) * p.d * p.pr / 1e6,
  C03: p => p.parc / p.life + p.net,
  C04: p => p.etp * p.j * (p.st / 100) * p.tjm / 1e6,
  C05: p => p.M !== undefined ? 100 * p.X / (p.M * 1000) : p.us / p.comp,
  C06: p => { const u1 = p.w / 100, u2 = 1 - u1; const r1 = u1 * p.p1, r2 = u2 * p.p2; return p.m1 === undefined ? r1 + r2 : 100 * (r1 * p.m1 / 100 + r2 * p.m2 / 100) / (r1 + r2); },
  C07: p => p.c !== undefined ? 100 * p.c / p.b : p.r1 * p.r2 / 100,
  C08: p => p.E !== undefined ? 100 * ((p.E / p.S) ** (1 / p.n) - 1) : p.S * (1 + p.g / 100) ** p.n,
  C09: p => 100 * ((1 + p.p / 100) * (1 + p.v / 100) - 1),
  C10: p => p.n0 !== undefined ? p.n0 * (1 - p.c / 100) + p.nw : 100 * (1 - p.c / 100) ** p.n,
  C11: p => p.gmv * p.tr / 100,
  C12: p => p.sp !== undefined ? p.sp * 1e6 / (p.nc * 1e3) : (p.arpu * p.m / 100) / (p.ch / 100),
  C13: p => p.da !== undefined ? p.ca * (1 - p.cogs / 100 - p.opex / 100 - p.da / 100) : 100 * (1 - p.cogs / 100 - p.opex / 100),
  C14: p => p.Q * (p.P - p.v) - p.F,
  C15: p => p.mu !== undefined ? 100 * p.mu / (100 + p.mu) : p.c !== undefined ? p.c / (1 - p.m / 100) : 100 * p.mg / (100 - p.mg),
  C16: p => (p.F + p.tgt) / (p.P - p.v),
  C17: p => p.Q0 * (p.P0 - p.v) / (p.P1 - p.v),
  C18: p => p.eps !== undefined ? 100 * (1 + p.eps * p.dp / 100) : p.dq / p.dp,
  C19: p => ((p.qa - p.shift) * (p.pa - p.va) + (p.qb + p.shift) * (p.pb - p.vb)) - (p.qa * (p.pa - p.va) + p.qb * (p.pb - p.vb)),
  C20: p => p.m * p.h * p.c * p.d * p.u / 100 / 1e6,
  C21: p => Math.min(p.a, p.b) * p.y / 100,
  C22: p => Math.ceil(p.ch / (p.hj * p.j * p.prod / 100)),
  C23: p => (p.Fa - p.Fb) / (p.vb - p.va),
  C24: p => p.th * p.lt,
  C25: p => p.cost / (p.q * (1 - p.sc / 100)),
  C26: p => { if (!p.f) return p.I / p.s; let c = -p.I; for (let k = 0; k < p.f.length; k++) { if (c + p.f[k] >= 0) return k + (-c) / p.f[k]; c += p.f[k]; } return NaN; },
  C27: p => 100 * (p.g * p.n - p.I) / p.I,
  C28: p => p.ca * (p.d1 - p.d0) / 365,
  C29: p => p.ebit - p.ebit * p.t / 100 + p.da - p.cx - p.db,
  C30: p => { let c = 0, m = 0; p.f.forEach(x => { c += x; m = Math.min(m, c); }); return -m; },
  C31: p => p.cf !== undefined ? p.cf / ((p.r - p.g) / 100) : -p.I + p.c.reduce((s, x, i) => s + x / (1 + p.r / 100) ** (i + 1), 0),
  C32: p => p.e * p.m - p.nd,
  C33: p => p.inv !== undefined ? p.pro / p.inv : p.s - p.c,
  C34: p => p.p.reduce((s, x, i) => s + x / 100 * p.v[i], 0),
  C35: p => p.v + (p.F + p.tgt) / p.Q,
  C36: p => { const a = sum(p.u0.map((u, i) => u * p.p[i])), b = sum(p.u1.map((u, i) => u * p.p[i])); return 100 * (b / a - 1); },
  C37: p => p.pos,
  D01: p => p.eq + (p.debt - p.cash) + p.mi - p.nonop,
  D02: p => p.ev - (p.debt - p.cash) - p.mi - p.pf,
  D03: p => p.ev !== undefined ? p.ev / p.m : p.e * p.m,
  D04: p => [...p.ms].sort((a, b) => a - b)[2] * p.e,
  D05: p => 100 * (p.off / p.c - 1),
  D06: p => 100 * (p.ca1 * p.m1 + p.ca2 * p.m2) / 100 / (p.ca1 + p.ca2),
  D07: p => p.sa + p.syn - p.saf,
  D08: p => p.sa + p.syn - p.paid - p.fees,
  D09: p => p.ebit * (1 - p.t / 100) + p.da - p.cx - p.db,
  D10: null, // variante EV/equity : contrôlée par l'exemple de référence
  D11: p => p.cs + p.rv * p.ct / 100 - p.ds,
  D12: p => p.f * 100 / p.r - p.ic,
  D13: p => (p.E * p.ke + p.D * p.kd * (1 - p.t / 100)) / 100,
  D14: p => { const pf = p.ni + p.tni - p.debt * p.kd / 100 * 0.75; return 100 * (pf / p.ni - 1); },
  D15: p => p.m !== undefined ? 100 * (p.m ** (1 / p.n) - 1) : (p.ex + p.div) / p.inv,
  D16: p => p.e * p.m + p.fees - p.e * p.dm,
  D17: p => p.e * p.m - p.nd,
  D18: p => p.pro / (1 + p.irr / 100) ** p.n,
  D19: p => p.lev !== undefined ? p.e * p.lev : p.e / (p.d * p.i / 100),
  D20: p => p.sh !== undefined ? p.eq / p.sh : p.eq * p.pct / 100,
  D21: p => p.ev - p.nd + p.bfr - p.tgt,
  D22: p => { const n = p.val / p.px; return 100 * n / (p.old + n); },
  D23: p => p.fix + (p.p1 * p.a1 + p.p2 * p.a2) / 100,
  S01: p => p.rooms * (p.dh * p.oh + (365 - p.dh) * p.ol) / 100 * p.pr / 1e6,
  S02: p => p.mw * 8760 * p.lf / 100 * p.pr / 1e6,
  S03: p => p.t * p.km * p.c / 1000,
  S04: p => p.out !== undefined ? p.out * 1e3 * p.nim / 1e4 : p.cl + p.fe,
  S05: p => { const a1 = p.a0 * (1 + p.pf / 100) + p.fl; return (p.a0 + a1) / 2 * 1e3 * p.fee / 1e4; },
  S06: p => p.pop * 1e6 * p.prev / 100 * p.dg / 100 * p.tr / 100 * p.cost / 1e6,
  S07: p => p.hc * (p.a0 - p.a1) / 100 * p.rc / 1e3 - p.prog,
  S08: p => p.fleet * p.occ / 100 * p.rent * 12 / 1e6,
  S09: p => p.ttc !== undefined ? p.ttc / 1.2 * (1 - p.rem / 100) : p.usd * p.fx
};

const SEEDS = 400;
const pids = Object.keys(D.CAT);
ok(pids.length === 80, "80 patterns attendus, trouvés " + pids.length);
const counts = { M: 0, C: 0, D: 0, S: 0 }; pids.forEach(p => counts[p[0]]++);
ok(counts.M === 11 && counts.C === 37 && counts.D === 23 && counts.S === 9, "Répartition 11/37/23/9 : " + JSON.stringify(counts));
const report = {};
pids.forEach(pid => {
  const c = D.CAT[pid]; let nOr = 0, nBad = 0;
  ok(typeof D.G[pid] === "function", pid + " : pas de générateur");
  ok(c.formula && c.signal && c.trap && c.check && c.name && /^P[012]$/.test(c.prio) && /^[ABCD]$/.test(c.lvl), pid + " : méta incomplète");
  ok(D.CAT[c.skill], pid + " : skill inconnue " + c.skill);
  if (pid[0] === "D" || pid[0] === "S") ok(c.skill !== pid, pid + " : une spécialisation doit hériter d'une compétence C/M");
  for (let s = 1; s <= SEEDS; s++) {
    const it = D.generate(pid, s * 7919 + 13);
    const txt = it.q + " " + it.method + " " + (it.options || []).join(" ");
    const good = isFinite(it.ans) && typeof it.unit === "string" && it.tol && it.tol.label && it.q && it.method && !/NaN|undefined|Infinity|\bnull\b/.test(txt);
    if (!good) { nBad++; if (nBad < 3) ok(false, pid + " seed " + s + " : item invalide → " + JSON.stringify({ q: it.q, ans: it.ans, m: it.method })); continue; }
    if (it.scale) ok(E.SCALES[it.scale].some(u => u[0] === it.unit), pid + " : unité " + it.unit + " absente de l'échelle " + it.scale);
    if (it.type === "mcq") ok(Number.isInteger(it.ans) && it.ans >= 0 && it.ans < it.options.length, pid + " : index QCM invalide");
    // déterminisme : même seed → même item
    const it2 = D.generate(pid, s * 7919 + 13); ok(it2.q === it.q && it2.ans === it.ans, pid + " : non déterministe");
    // auto-cohérence : la bonne réponse est jugée juste, l'opposé/×10 non
    const jr = E.judge(it, it.type === "mcq" ? it.ans : String(it.ans).replace(".", ","), it.scale ? it.unit : null);
    ok(jr.res === "ok", pid + " : bonne réponse rejetée " + JSON.stringify({ q: it.q, ans: it.ans, jr }));
    if (it.type !== "mcq" && Math.abs(it.ans) > 1e-6) {
      const jw = E.judge(it, String(it.ans * 10), it.scale ? it.unit : null);
      ok(jw.res === "ko", pid + " : réponse ×10 acceptée (" + it.q + ")");
    }
    // pièges : aucun piège ne doit coïncider avec la bonne réponse
    (it.traps || []).forEach(t => { if (isFinite(t.v) && E.within(it, t.v)) report[pid + "-trapCollision"] = (report[pid + "-trapCollision"] || 0) + 1; });
    // oracle indépendant
    const f = O[pid];
    if (f) { const v = f(it.p); if (v !== null && v !== undefined) { nOr++; ok(near(v, it.ans, 1e-6) || E.within(it, v) && Math.abs(v - it.ans) < 1e-6 * Math.max(1, Math.abs(v)) * 10, pid + " : oracle " + v + " ≠ générateur " + it.ans + " (" + it.q + ")"); } }
  }
  report[pid] = { oracle: nOr, invalid: nBad };
});

// M07 : contrôle par la question (points vs relatif)
for (let s = 1; s <= 200; s++) { const it = D.generate("M07", s); if (it.p.bps !== undefined) continue; const rel = /relative/.test(it.q); const v = rel ? 100 * (it.p.b - it.p.a) / it.p.a : it.p.b - it.p.a; ok(near(v, it.ans), "M07 oracle " + it.q); }
// D10 : oracle explicite
for (let s = 1; s <= 200; s++) { const it = D.generate("D10", s); const p = it.p; const ev = p.c1 / (1 + p.w / 100) + (p.c2 + p.tv) / (1 + p.w / 100) ** 2; const v = /Equity/.test(it.q) ? ev - p.nd : ev; ok(near(v, it.ans), "D10 oracle " + it.q); }

// ---------- 2. Propriétés ----------
const F = D.FIN;
for (let s = 0; s < 300; s++) {
  const r = D.mkR(s + 1);
  const eq = r.i(10, 500), nd = r.i(-100, 200), mi = r.i(0, 20), pf = r.i(0, 10), no = r.i(0, 15);
  ok(near(F.equity(F.ev(eq, nd, mi, pf, no), nd, mi, pf, no), eq), "EV→equity→EV identité (dette nette " + nd + ")");
  const m = 1 + r.f() * 3, n = r.i(2, 8), irr = F.irrFromMoic(m, n);
  ok(near((1 + irr) ** n, m, 1e-9), "TRI inverse du MOIC");
  ok(near(F.irr([-1, ...Array(n - 1).fill(0), m]), irr, 1e-6), "TRI bissection = TRI MOIC");
  const flows = [-r.i(50, 100), r.i(10, 40), r.i(10, 40), r.i(10, 60)], rr = 0.05 + r.f() * 0.1;
  ok(near(F.npv(F.irr(flows), flows), 0, 1e-6) || !isFinite(F.irr(flows)), "VAN(TRI) = 0");
  ok(F.npv(rr + 0.02, flows) < F.npv(rr, flows), "VAN décroît quand le taux monte");
  const P = r.i(20, 100), v = r.i(1, P - 1), Fx = r.i(100, 1000);
  ok(near(F.breakeven(Fx, P, v) * (P - v), Fx), "Point mort réconcilie F");
  const v0 = r.i(50, 200), g = r.f() * 0.3, k = r.i(1, 6);
  ok(near(F.cagr(v0, v0 * (1 + g) ** k, k), g, 1e-9), "CAGR inverse de la composition");
}
// invariance d'unités : le même montant saisi en k€ / M€ / Md€ est jugé pareil
{ const it = { ans: 1.47, unit: "Md", scale: "n", tol: D.T.EX, lvl: "A" };
  ok(E.judge(it, "1,47", "Md").res === "ok" && E.judge(it, "1470", "M").res === "ok" && E.judge(it, "1 470 000", "k").res === "ok", "Invariance d'unités k/M/Md");
  const w = E.judge(it, "1,47", "M"); ok(w.res === "ko" && w.code === "E05", "Bon chiffre mauvaise unité = E05 distinct");
  ok(E.judge(it, "1,47", null).code === "E05", "Unité manquante = E05"); }
// sources = emplois (D16) et bridge PE
for (let s = 1; s <= 100; s++) { const it = D.generate("D16", s), p = it.p; ok(near(it.ans + p.e * p.dm, p.e * p.m + p.fees), "D16 sources = emplois"); }

// ---------- 3. Exemples de référence du référentiel (§§2, 5, 6, 10–12) ----------
const ref = [
  ["§2 387+198", 387 + 198, 585], ["§2 23×47", 23 * 47, 1081], ["§2 48×125", 48 * 125, 6000], ["§2 3750÷25", 3750 / 25, 150],
  ["§2 7/16", 7 / 16 * 100, 43.75], ["§2 4,2M×0,35k en Md", 4.2e6 * 0.35e3 / 1e9, 1.47], ["§2 +20 puis −20", (1.2 * 0.8 - 1) * 100, -4],
  ["§2 base après +25 %", 125 / 1.25, 100], ["§2 0,18x=54", 54 / 0.18, 300], ["§2 19,8×51", 19.8 * 51, 1009.8], ["§2 1,1²", 1.1 ** 2, 1.21],
  ["§3 funnel 40→15→3 total", 3 / 40 * 100, 7.5], ["§3 funnel étape 1", 15 / 40 * 100, 37.5], ["§3 funnel étape 2", 3 / 15 * 100, 20],
  ["§4 markup 25 → marge", 25 / 125 * 100, 20],
  ["§5 BFR DSO 60→90", 36.5 * 30 / 365, 3],
  ["§6 churn", 100 - 8 + 12, 104], ["§6 ASP", 0.6 * 20 + 0.4 * 50, 32], ["§6 marge globale", (12 * 0.1 + 20 * 0.3) / 32 * 100, 22.5],
  ["§6 volume contribution", 100 * 20 / 15, 133.333333], ["§6 goulot", Math.min(120, 90) * 0.8, 72],
  ["§10 EV", 20 * 8, 160], ["§10 equity", F.equity(160, 50 - 10), 120], ["§10 prime", (144 / 120 - 1) * 100, 20], ["§10 EV payé", F.ev(144, 40), 184],
  ["§10 EBITDA requis", 200 / 8, 25], ["§10 marge combinée", 24 / 200 * 100, 12],
  ["§11 DCF EV", F.npv(0.1, [0, 12, 15 + 150]), 147.27], ["§11 equity", F.npv(0.1, [0, 12, 165]) - 30, 117.27],
  ["§11 synergies EBITDA", 3 + 10 * 0.25 - 1, 4.5], ["§11 perpétuité", F.gordon(3.6, 0.09, 0), 40], ["§11 VAN nette", F.gordon(3.6, 0.09, 0) - 8, 32], ["§11 EV max", 150 + 32, 182],
  ["§12 equity investie", 10 * 8 + 4 - 40, 44], ["§12 EV sortie", 15 * 9, 135], ["§12 equity sortie", 135 - 20, 115], ["§12 MOIC", 115 / 44, 2.61],
  ["§12 TRI", F.irrFromMoic(115 / 44, 5) * 100, 21.2], ["§12 equity sortie 7×", 15 * 7 - 20, 85], ["§12 MOIC 7×", 85 / 44, 1.93], ["§12 TRI 7×", F.irrFromMoic(85 / 44, 5) * 100, 14.1],
  ["§12 ΔEV bridge", 8 * (15 - 10) + 15 * (9 - 8), 55], ["§12 bridge equity", 55 + 20 - 4, 71], ["§12 bridge = 115 − 44", 115 - 44, 71], ["§12 equity max TRI 20 %", 115 / 1.2 ** 5, 46.22],
  ["§12 2× en 5 ans", F.irrFromMoic(2, 5) * 100, 14.9], ["§12 3× en 5 ans", F.irrFromMoic(3, 5) * 100, 24.6]
];
const refRes = ref.map(([name, got, exp]) => { const d = Math.abs(got - exp); const tol = Math.max(0.005 * Math.abs(exp), Number.isInteger(exp) ? 1e-9 : 0.006); const g = d <= tol; ok(g, "Référence " + name + " : " + got + " ≠ " + exp); return { name, got: Math.round(got * 1000) / 1000, exp, ok: g }; });

// générateurs qui retombent sur les exemples de référence (recherche de seed)
function findSeed(pid, pred, max = 400000) { for (let s = 1; s < max; s++) { const it = D.generate(pid, s); if (pred(it.p, it)) return it; } return null; }
const genRef = [
  ["C06 marge 22,5 %", "C06", p => p.w === 60 && p.p1 === 20 && p.p2 === 50 && p.m1 === 10 && p.m2 === 30, 22.5],
  ["C10 parc 104 k", "C10", p => p.n0 === 100 && p.c === 8 && p.nw === 12, 104],
  ["C17 volume 133,3 k", "C17", p => p.P0 === 50 && p.v === 30 && p.P1 === 45 && p.Q0 === 100, 133.333],
  ["C21 goulot 72", "C21", p => p.a === 120 && p.b === 90 && p.y === 80, 72],
  ["C28 BFR 3 M€", "C28", p => p.ca === 36.5 && p.d0 === 60 && p.d1 === 90, 3],
  ["D10 EV 147,27", "D10", (p, it) => p.c1 === 12 && p.c2 === 15 && p.tv === 150 && p.w === 10 && !/Equity/.test(it.q), 147.27],
  ["D10 equity 117,27", "D10", (p, it) => p.c1 === 12 && p.c2 === 15 && p.tv === 150 && p.w === 10 && p.nd === 30 && /Equity/.test(it.q), 117.27],
  ["D12 VAN 32", "D12", p => p.f === 3.6 && p.r === 9 && p.ic === 8, 32],
  ["D16 equity 44", "D16", p => p.e === 10 && p.m === 8 && p.fees === 4 && p.dm === 4, 44],
  ["D15 TRI 2× 5 ans", "D15", p => p.m === 2 && p.n === 5, 14.87],
  ["D11 synergies 4,5", "D11", p => p.cs === 3 && p.rv === 10 && p.ct === 25 && p.ds === 1, 4.5],
  ["D06 marge pondérée", "D06", p => true, null]
];
const genRefRes = genRef.filter(g => g[3] !== null).map(([name, pid, pred, exp]) => { const it = findSeed(pid, pred); const g = it && Math.abs(it.ans - exp) <= 0.006 * Math.abs(exp); ok(!!g, "Générateur " + name + " : " + (it ? it.ans : "seed introuvable")); return { name, seed: it && it.seed, ans: it && Math.round(it.ans * 1000) / 1000, ok: !!g }; });

// chaînes
for (let k = 0; k < D.CHAINS.length; k++) for (let s = 1; s <= 200; s++) {
  const c = D.generateChain(k, s); ok(c.steps.length >= 2 && c.steps.length <= 4, "Chaîne " + k + " : 2–4 étapes");
  c.steps.forEach(st => { ok(isFinite(st.ans) && D.CAT[st.pid] && st.tol && !/NaN|undefined/.test(st.q + st.method), "Chaîne " + k + " étape invalide " + st.q); ok(E.judge(Object.assign({ lvl: "D" }, st), String(st.ans)).res === "ok", "Chaîne " + k + " bonne réponse rejetée"); });
}
{ const c = D.CHAINS[1](D.mkR(1)); } // smoke
// chaîne LBO avec les paramètres du référentiel
{ let found = null; for (let s = 1; s < 200000 && !found; s++) { const c = D.generateChain(1, s); if (/EBITDA 10 M€ acheté 8×.*frais 4 M€, dette d'acquisition 40 M€.*EBITDA 15 M€, multiple de sortie 9×, dette nette 20 M€/.test(c.ctx)) found = c; }
  ok(found && found.steps[0].ans === 44 && found.steps[1].ans === 115 && Math.abs(found.steps[2].ans - 2.61) < 0.006 && Math.abs(found.steps[3].ans - 21.2) < 0.06, "Chaîne LBO = exemple §12");
  refRes.push({ name: "Chaîne LBO (générateur) = §12", got: found ? found.steps.map(s => Math.round(s.ans * 100) / 100).join(" / ") : "introuvable", exp: "44 / 115 / 2,61 / 21,2", ok: !!found }); }

// ---------- 4. Cas limites ----------
function throws(f) { try { f(); return false; } catch (e) { return true; } }
ok(throws(() => F.gordon(1, 0.03, 0.03)) && throws(() => F.gordon(1, 0.02, 0.03)), "Gordon refuse WACC ≤ g");
ok(throws(() => F.cagr(0, 10, 3)) && throws(() => F.cagr(-5, 10, 3)), "CAGR refuse base nulle ou négative");
ok(throws(() => F.breakeven(100, 10, 10)) && throws(() => F.breakeven(100, 8, 10)), "Point mort refuse P ≤ v");
ok(isNaN(F.irr([10, 10, 10])), "TRI indéfini sans changement de signe");
ok(F.equity(100, -20) === 120, "Dette nette négative augmente l'equity");
ok(E.judge({ ans: 0, tol: D.T.EX, lvl: "B", unit: "k€" }, "0").res === "ok" && E.judge({ ans: 0, tol: { abs: 0.1, label: "" }, lvl: "B", unit: "" }, "0,05").res === "ok", "Réponse nulle : tolérance absolue");
// générateurs : aucun P ≤ v, aucun WACC ≤ g, aucun taux > 100 % interdit
for (let s = 1; s <= 300; s++) {
  const a = D.generate("C16", s).p; ok(a.P > a.v, "C16 P > v");
  const b = D.generate("C17", s).p; ok(b.P1 > b.v, "C17 P1 > v");
  const c = D.generate("C31", s).p; if (c.cf !== undefined) ok(c.r > c.g, "C31 r > g");
  const d = D.generate("C34", s).p; ok(sum(d.p) === 100 && d.p.every(x => x >= 0), "C34 probabilités = 100 %");
  const e = D.generate("D23", s).p; ok(e.p1 + e.p2 <= 100, "D23 probabilités ≤ 100 %");
  const f = D.generate("C15", s).p; if (f.m !== undefined) ok(f.m < 100, "C15 marge < 100 %");
  const g = D.generate("C22", s); ok(Number.isInteger(g.ans), "C22 ETP entiers");
}

// ---------- 5. Parsing FR/EN ----------
[["1 234,5", 1234.5], ["1,234.5", 1234.5], ["1234.5", 1234.5], ["12,5 %", 12.5], ["-4", -4], ["−4", -4], ["1 470 000", 1470000], ["0,35", 0.35], ["1,234,567", 1234567], ["2,61×", 2.61], ["abc", null], ["", null]]
  .forEach(([s, v]) => ok(E.parseNum(s) === v, "parseNum(" + s + ") = " + E.parseNum(s) + " ≠ " + v));

// ---------- 6. Diagnostic ----------
{ const it = D.generate("C06", findSeed("C06", p => p.m1 !== undefined).seed); const p = it.p;
  ok(E.judge(it, String((p.m1 + p.m2) / 2)).code === "E03", "Moyenne simple des marges → E03"); }
{ const it = { ans: 480, unit: "M€", tol: D.T.EX, lvl: "A" }; ok(E.judge(it, "48").code === "E05" && E.judge(it, "480000").code === "E05", "Facteur 10ⁿ → E05"); ok(E.judge(it, "-480").code === "E05", "Signe → E05"); ok(E.judge(it, "470").code === "E04", "Écart quelconque → E04"); ok(E.judge(it, "480", null, { seconds: 90 }).code === "E07", "Lent mais juste → E07"); }

// ---------- 7. Mémoire : fold, statuts, retests, sélection ----------
{ const t0 = Date.UTC(2026, 10, 1, 9);
  const ev = (i, pid, res, dayOff, mode, hint) => ({ id: "s-" + i, sid: "s", ts: t0 + dayOff * E.DAY + i * 1000, pid, res, t: 20, mode: mode || "flash", hint: !!hint, code: res === "ko" ? "E04" : null });
  let evs = [ev(1, "C06", "ok", 0), ev(2, "C06", "ok", 0), ev(3, "C06", "ok", 1, "hidden")];
  let st = E.fold(evs);
  ok(st.C06.status === "green", "Vert : 3 réussites, 2 jours, 1 transfert masqué → " + st.C06.status);
  ok(st.C06.due === evs[2].ts + 7 * E.DAY, "Retests J+1 → J+3 → J+7");
  st = E.fold([ev(1, "C06", "ok", 0), ev(2, "C06", "ok", 0), ev(3, "C06", "ok", 0)]);
  ok(st.C06.status !== "green", "Pas de vert sur un seul jour");
  st = E.fold([ev(1, "M06", "ok", 0), ev(2, "M06", "ko", 1)]);
  ok(st.M06.status === "red" && st.M06.due === t0 + E.DAY + 2000, "Échec : retest rapproché, statut rouge");
  st = E.fold([ev(1, "M06", "ok", 0, "flash", true)]); ok(st.M06.okUnaided === 0 && st.M06.status !== "green", "Réussite avec indice non comptée comme non aidée");
  st = E.fold([Object.assign(ev(1, "M06", "ko", 0), { res: "na", code: "E08" })]); ok(!st.M06, "E08 non scoré");
  // une erreur isolée ne crée pas d'étiquette durable
  st = E.fold([ev(1, "C09", "ko", 0), ev(2, "C09", "ok", 1), ev(3, "C09", "ok", 2), ev(4, "C09", "ok", 3)]); ok(st.C09.status !== "red", "Erreur isolée puis réussites : plus rouge");
  // sélection : proportions sur un état mixte
  const pool = ["C06", "M06", "C09", "C01", "C02", "C03"];
  st = E.fold([ev(1, "M06", "ko", 0), ev(2, "C06", "ok", 0), ev(3, "C09", "ok", 0)]);
  const now = t0 + 2 * E.DAY, cnt = {}; const r = D.mkR(42);
  for (let i = 0; i < 6000; i++) { const p = E.select(pool, st, now, r.f, null); cnt[p] = (cnt[p] || 0) + 1; }
  const fresh = (cnt.C01 || 0) + (cnt.C02 || 0) + (cnt.C03 || 0);
  ok(cnt.M06 / 6000 > 0.4 && cnt.M06 / 6000 < 0.6, "≈50 % sur la lacune M06 : " + (cnt.M06 / 6000).toFixed(2));
  ok(fresh / 6000 > 0.15 && fresh / 6000 < 0.25, "≈20 % de nouveaux : " + (fresh / 6000).toFixed(2));
  ok(E.select(["C06", "M06"], st, now, () => 0.1, "M06") === "C06", "Pas deux fois le même pattern de suite");
  // export / import / doublons
  evs = [ev(1, "C06", "ok", 0), ev(2, "M06", "ko", 0)].map(e => Object.assign(e, { q: "x", exp: 1, unit: "" }));
  const js = E.exportJSON(evs, null);
  let im = E.importJSON(js, []); ok(im.added === 2 && im.dup === 0, "Import initial");
  im = E.importJSON(js, im.events); ok(im.added === 0 && im.dup === 2 && im.events.length === 2, "Réimport dédupliqué par ID");
  ok(E.importJSON("{pas du json", []).error && E.importJSON('{"format":"autre","events":[]}', []).error, "Import refuse un fichier invalide");
  const md = E.exportMarkdown(evs, E.fold(evs), now, null); ok(/## Priorités/.test(md) && /M06/.test(md) && /absence de données ≠ faiblesse/.test(md), "Synthèse Markdown complète");
  ok(JSON.stringify(E.parsePlan("Travaille C06, m06 et D03 ; X99")) === '["C06","M06","D03"]', "Plan de séance lu depuis un texte IA");
  // migration V1
  const v1 = { cats: { mult: { n: 10, ko: 4, t: 300, recent: [] }, sizing: { n: 5, ko: 1, t: 200 } }, errors: [{ cat: "mult" }], sessions: 3, since: "2026-11-19" };
  const lg = E.migrateV1(v1); ok(lg.cats.mult.pid === "M02" && lg.cats.sizing.pid === "C01" && lg.sessions === 3, "Migration V1 → V2 sans perte");
  ok(E.legacyByPid(lg).M02.n === 10, "Historique V1 relié aux patterns V2");
  Object.keys(D.V1MAP).forEach(k => ok(D.CAT[D.V1MAP[k]], "V1 " + k + " mappé"));
}

// ---------- rapport ----------
const fs = require("fs");
fs.writeFileSync(__dirname + "/qa_report.json", JSON.stringify({ pass, fail, fails, perPattern: report, reference: refRes, generatorReference: genRefRes }, null, 1));
console.log("PASS", pass, "FAIL", fail);
fails.forEach(f => console.log(" ✗", f));
const coll = Object.keys(report).filter(k => k.endsWith("trapCollision")); if (coll.length) console.log("Collisions piège/réponse (pièges ignorés car égaux à la bonne réponse) :", coll.map(k => k + "=" + report[k]).join(", "));
const noOracle = pids.filter(p => !report[p].oracle && !["M07", "D10"].includes(p)); console.log("Patterns sans oracle direct :", noOracle.join(", ") || "aucun");
