/* MathDrill V3 — explications pas à pas.
   1) Les automatismes M01–M11 reçoivent une règle propre à la variante tirée + des étapes numérotées avec les nombres de l'item.
   2) Pour les autres patterns, les étapes sont dérivées du calcul détaillé (method) du générateur, découpé proprement. */
var EXPLAIN = (function () {
  "use strict";
  var D = (typeof DRILL !== "undefined") ? DRILL : require("./catalog.js");
  var G = D.G, fr = D.fr;
  function wrap(id, fn) { var orig = G[id]; G[id] = function (r) { var it = orig(r); try { fn(it); } catch (e) { /* garde la méthode d'origine */ } return it; }; }

  wrap("M01", function (it) { var a = it.p.a, b = it.p.b, R = Math.ceil(b / 100) * 100; if (R === b) R = b; var d = R - b, plus = it.p.plus;
    it.rule = b + " est presque " + R + " : on " + (plus ? "ajoute" : "retire") + " " + R + ", puis on corrige de " + d + ".";
    it.steps = plus ? [fr(a) + " + " + R + " = " + fr(a + R), "On a ajouté " + d + " de trop : " + fr(a + R) + " − " + d + " = " + fr(it.ans)]
                    : [fr(a) + " − " + R + " = " + fr(a - R), "On a retiré " + d + " de trop : " + fr(a - R) + " + " + d + " = " + fr(it.ans)]; });
  wrap("M02", function (it) { var a = it.p.a, b = it.p.b, t = Math.floor(b / 10) * 10, u = b % 10;
    if (u >= 7) { var n = t + 10, e = n - b;
      it.rule = b + " est proche de " + n + " : on multiplie par " + n + " puis on retire " + a + " × " + e + ".";
      it.steps = [a + " × " + n + " = " + fr(a * n), a + " × " + e + " = " + fr(a * e), fr(a * n) + " − " + fr(a * e) + " = " + fr(it.ans)]; }
    else { it.rule = "On ne coupe qu'UN facteur : " + b + " = " + t + " + " + u + ".";
      it.steps = [a + " × " + t + " = " + fr(a * t), a + " × " + u + " = " + fr(a * u), fr(a * t) + " + " + fr(a * u) + " = " + fr(it.ans)]; } });
  wrap("M03", function (it) { var p = it.p;
    if (p.k) { var div = p.k === 25 ? 4 : p.k === 50 ? 2 : 8, pw = p.k === 125 ? 1000 : 100;
      it.rule = p.k + " = " + pw + " ÷ " + div + " : multiplier par " + p.k + " revient à diviser par " + div + " puis multiplier par " + fr(pw) + ".";
      it.steps = [p.b + " ÷ " + div + " = " + fr(p.b / div), fr(p.b / div) + " × " + fr(pw) + " = " + fr(it.ans)]; }
    else if (p.m) { if (p.m === 11) { it.rule = "× 11 = × 10 + une fois le nombre."; it.steps = [p.a + " × 10 = " + p.a * 10, p.a * 10 + " + " + p.a + " = " + fr(it.ans)]; }
      else { it.rule = "× " + p.m + " = × " + (p.m + 1) + " − une fois le nombre."; it.steps = [p.a + " × " + (p.m + 1) + " = " + fr(p.a * (p.m + 1)), fr(p.a * (p.m + 1)) + " − " + p.a + " = " + fr(it.ans)]; } }
    else if (p.n) { var t = Math.floor(p.n / 10); it.rule = "Carré d'un nombre en 5 : dizaine × dizaine suivante, puis on colle 25.";
      it.steps = [t + " × " + (t + 1) + " = " + t * (t + 1), "On colle 25 : " + fr(it.ans)]; }
    else { var R = Math.ceil(p.a / 10) * 10, d = R - p.a; it.rule = p.a + " = " + R + " − " + d + " : on multiplie par " + R + " puis on retire " + d + " × " + p.b + ".";
      it.steps = [R + " × " + p.b + " = " + fr(R * p.b), d + " × " + p.b + " = " + fr(d * p.b), fr(R * p.b) + " − " + fr(d * p.b) + " = " + fr(it.ans)]; } });
  wrap("M04", function (it) { var n = it.p.n, d = it.p.d;
    if (d === 25) { it.rule = "25 = 100 ÷ 4, donc diviser par 25 = multiplier par 4 puis diviser par 100.";
      it.steps = [fr(n) + " × 4 = " + fr(n * 4), fr(n * 4) + " ÷ 100 = " + fr(it.ans)]; }
    else if (d === 12.5) { it.rule = "12,5 = 100 ÷ 8, donc diviser par 12,5 = multiplier par 8 puis diviser par 100.";
      it.steps = [fr(n) + " × 8 = " + fr(n * 8), fr(n * 8) + " ÷ 100 = " + fr(it.ans)]; }
    else { var k = [8, 6, 5, 4, 3, 2].filter(function (f) { return d % f === 0 && n % f === 0 && d / f >= 2; })[0] || [12, 8, 6, 5, 4, 3, 2].filter(function (f) { return d % f === 0 && n % f === 0; })[0];
      it.rule = "On simplifie les deux termes par " + k + " : le résultat ne change pas, mais le diviseur devient petit.";
      it.steps = [fr(n) + " ÷ " + k + " = " + fr(n / k) + " et " + d + " ÷ " + k + " = " + d / k, fr(n / k) + " ÷ " + d / k + " = " + fr(it.ans)]; } });
  wrap("M05", function (it) { var a = it.p.a, b = it.p.b;
    if (it.p.base === undefined) { it.rule = "Une fraction en % : numérateur ÷ dénominateur × 100" + (b === 8 || b === 16 ? " (repère : 1/8 = 12,5 %, 1/16 = 6,25 %)." : ".");
      it.steps = a === 1 ? ["1 ÷ " + b + " = " + fr(1 / b, 4), "× 100 = " + fr(it.ans, 2) + " %"] : ["1/" + b + " = " + fr(100 / b, 2) + " %", a + " × " + fr(100 / b, 2) + " = " + fr(it.ans, 2) + " %"]; }
    else { it.rule = fr(a / b * 100, 2) + " % = " + a + "/" + b + " : on divise par " + b + " puis on multiplie par " + a + ".";
      it.steps = [fr(a / b * 100, 2) + " % = " + a + "/" + b, fr(it.p.base) + " ÷ " + b + " = " + fr(it.p.base / b), fr(it.p.base / b) + " × " + a + " = " + fr(it.ans)]; } });
  wrap("M06", function (it) { var p = it.p;
    if (p.b !== undefined && p.a !== undefined && it.unit === "Md") { it.rule = "M × k = 10⁶ × 10³ = 10⁹ = Md : on multiplie les chiffres, l'unité devient Md.";
      it.steps = [fr(p.a) + " × " + fr(p.b) + " = " + fr(it.ans, 4), "M × k = Md, donc " + fr(it.ans, 4) + " Md"]; }
    else if (p.ca !== undefined) { it.rule = "M€ ÷ k = k€ (10⁶ ÷ 10³ = 10³) : on divise les chiffres, le résultat est en k€.";
      it.steps = [p.ca + " ÷ " + fr(p.k) + " = " + fr(p.ca / p.k, 2), "M€ ÷ k = k€, donc " + fr(it.ans, 2) + " k€ par client"]; }
    else { it.rule = "M d'unités × € = M€ : on multiplie les chiffres et on garde « M ».";
      it.steps = [fr(p.x) + " × " + p.p + " = " + fr(it.ans), "M × € = M€, donc " + fr(it.ans) + " M€"]; } });
  wrap("M07", function (it) { var p = it.p;
    if (p.bps) { it.rule = "100 bps = 1 point de %."; it.steps = [p.bps + " ÷ 100 = " + fr(it.ans) + " point" + (it.ans >= 2 ? "s" : "")]; }
    else if (it.unit === "points") { it.rule = "Écart en points = simple différence des deux taux.";
      it.steps = [p.b + " − " + p.a + " = " + (p.b - p.a) + " points", "(En relatif, ce serait " + fr((p.b - p.a) / p.a * 100, 1) + " %, à ne pas confondre.)"]; }
    else { it.rule = "Variation relative = écart en points ÷ taux de départ.";
      it.steps = [p.b + " − " + p.a + " = " + (p.b - p.a) + " points", (p.b - p.a) + " ÷ " + p.a + " = " + fr(it.ans, 1) + " %"]; } });
  wrap("M08", function (it) { var p = it.p;
    if (p.t === undefined) { var c1 = 1 + p.a / 100, c2 = 1 + p.b / 100;
      it.rule = "Deux variations successives se multiplient : on multiplie les coefficients.";
      it.steps = ["+" + p.a + " % → × " + fr(c1) + " ; " + p.b + " % → × " + fr(c2), fr(c1) + " × " + fr(c2) + " = " + fr(c1 * c2, 4), "Variation = " + fr(it.ans, 2) + " %"]; }
    else { it.rule = "Le prix final contient déjà la hausse : on divise par le coefficient, on ne retire pas " + p.t + " %.";
      it.steps = ["Coefficient = 1 + " + fr(p.t / 100) + " = " + fr(1 + p.t / 100), fr(p.fin) + " ÷ " + fr(1 + p.t / 100) + " = " + fr(it.ans) + " €"]; } });
  wrap("M09", function (it) { it.rule = "Pour isoler x, on divise des deux côtés par " + fr(it.p.a) + ".";
    it.steps = ["x = " + fr(it.p.b) + " ÷ " + fr(it.p.a), "Astuce : " + fr(it.p.b) + " ÷ " + fr(it.p.a) + " = " + fr(it.p.b * 100) + " ÷ " + fr(it.p.a * 100), "x = " + fr(it.ans)]; });
  wrap("M10", function (it) { var a = it.p.a, b = it.p.b, A = Math.round(a);
    it.rule = "On arrondit " + fr(a) + " à " + A + " pour calculer de tête, et on dit dans quel sens on s'est trompé.";
    it.steps = [fr(a) + " ≈ " + A, A + " × " + b + " = " + fr(A * b), "Exact : " + fr(it.ans, 2) + " (l'arrondi a gonflé le résultat)"]; });
  wrap("M11", function (it) { var p = it.p;
    if (p.n === undefined) { it.rule = "Règle de 72 : temps de doublement ≈ 72 ÷ taux de croissance (en %).";
      it.steps = ["72 ÷ " + p.g + " = " + fr(72 / p.g, 1) + " ans", "(Exact : " + fr(it.ans, 2) + " ans)"]; }
    else { var c = 1 + p.g / 100, st = ["Coefficient annuel = " + fr(c)], acc = 1;
      for (var i = 1; i <= p.n; i++) { acc *= c; if (i > 1) st.push(fr(c) + "^" + i + " = " + fr(acc, 4)); }
      st.push("Croissance totale = " + fr(it.ans, 2) + " %");
      it.rule = "La croissance se compose : (1 + g)ⁿ − 1, pas g × n."; it.steps = st; } });
  wrap("C26", function (it) { if (!it.cums) { it.rule = "Flux constant : payback = investissement ÷ flux annuel."; it.steps = [fr(it.p.I) + " ÷ " + fr(it.p.s) + " = " + fr(it.ans, 2) + " ans"]; return; }
    var st = ["Cash cumulé fin d'année : " + it.cums.map(function (c, i) { return "A" + (i + 1) + " " + (c > 0 ? "+" : "") + fr(c); }).join(", ")], k = 0;
    while (it.cums[k] < 0) k++;
    var rest = -(k ? it.cums[k - 1] : -it.p.I);
    st.push("On repasse au-dessus de zéro pendant l'année " + (k + 1));
    st.push("Il restait " + fr(rest) + " à rembourser, l'année " + (k + 1) + " apporte " + fr(it.p.f[k]) + " : " + fr(rest) + " ÷ " + fr(it.p.f[k]) + " = " + fr(rest / it.p.f[k], 2));
    st.push("Payback = " + k + " + " + fr(rest / it.p.f[k], 2) + " = " + fr(it.ans, 2) + " ans");
    it.rule = "On cumule le cash année par année jusqu'à ce qu'il redevienne positif, puis on interpole dans l'année."; it.steps = st; });

  // Découpage générique d'un calcul détaillé en étapes lisibles
  function splitMethod(m) {
    if (!m) return [];
    var str = String(m), parts = [], depth = 0, cur = "";
    for (var i = 0; i < str.length; i++) { var ch = str[i];
      if (ch === "(") depth++; else if (ch === ")") depth = Math.max(0, depth - 1);
      if (depth === 0 && (str.substr(i, 3) === " ; " || str.substr(i, 3) === " | ")) { parts.push(cur); cur = ""; i += 2; continue; }
      cur += ch; }
    parts.push(cur);
    var out = [], prevRes = null;
    parts.forEach(function (s) {
      s = s.trim(); if (!s) return;
      s = s.replace(/\s→\s/g, ", donc ");
      if (/^[×÷−+\-]/.test(s) && prevRes) s = prevRes + " " + s;
      var eqs = s.split(" = "); if (eqs.length > 1) { var last = eqs[eqs.length - 1].split(", donc ")[0]; prevRes = last.replace(/\s*\(.*$/, "").trim(); }
      out.push(s.charAt(0).toUpperCase() + s.slice(1));
    });
    return out;
  }
  function stepsOf(it) { return (it.steps && it.steps.length) ? it.steps : splitMethod(it.method); }
  return { stepsOf: stepsOf, splitMethod: splitMethod };
})();
if (typeof module !== "undefined") module.exports = EXPLAIN;
