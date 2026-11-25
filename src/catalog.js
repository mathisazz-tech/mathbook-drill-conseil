/* Mathbook Drill V2 — catalogue + générateurs déterministes. Aucun LLM dans le calcul des réponses. */
var DRILL = (function () {
  "use strict";
  var CATALOG_VERSION = "2.0";

  // ---------- RNG seedé (reproductible : seed stocké dans chaque événement) ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mkR(seed) {
    var f = mulberry32(seed);
    return {
      f: f,
      i: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      p: function (arr) { return arr[Math.floor(f() * arr.length)]; }
    };
  }

  // ---------- format FR ----------
  function fr(x, d) {
    if (d === undefined) d = 2;
    if (!isFinite(x)) return String(x);
    var s = Number(x).toLocaleString("fr-FR", { maximumFractionDigits: d });
    return s.replace(/ /g, " ");
  }
  function rd(x, d) { var k = Math.pow(10, d); return Math.round(x * k) / k; }

  // ---------- tolérances annoncées ----------
  var T = {
    EX: { rel: 1e-9, abs: 1e-9, label: "exact" },
    R05: { rel: 0.005, label: "±0,5 %" },
    R1: { rel: 0.01, label: "±1 %" },
    R2: { rel: 0.02, label: "±2 %" },
    R3: { rel: 0.03, label: "±3 %" },
    P01: { abs: 0.1, label: "±0,1 point" },
    P02: { abs: 0.2, label: "±0,2 point" },
    P05: { abs: 0.5, label: "±0,5 point" },
    P1: { abs: 1, label: "±1 point" },
    Y01: { abs: 0.1, label: "±0,1 an" },
    D01: { abs: 0.01, label: "±0,01" }
  };


  // ---------- calcul de tête des taux composés (CAGR, TRI) ----------
  var MENTAL = (function () {
    var SUP = { 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷" };
    function pw(n) { return SUP[n] || "^" + n; }
    function c2(x) { return fr(Math.round(x * 100) / 100, 2); }
    // (1 + g)^n par +g % successifs, arrondis à 2 décimales comme on le fait de tête
    function powSteps(g, n) {
      var c = 1 + g / 100, acc = c, st = [];
      st.final = c;
      for (var i = 2; i <= n; i++) { var prev = Math.round(acc * 100) / 100; acc = prev * c;
        st.push(fr(c) + pw(i) + " ≈ " + c2(prev) + " + " + g + " % de " + c2(prev) + " = " + c2(prev) + " + " + c2(prev * g / 100) + " ≈ " + c2(acc)); }
      st.final = Math.round(acc * 100) / 100;
      return st;
    }
    function table(n) { var out = []; for (var g = 5; g <= 35; g += 5) out.push({ g: g, v: Math.pow(1 + g / 100, n) }); return out; }
    // retrouver g tel que (1 + g)^n = ratio, sans racine n-ième
    function root(ratio, n, ratioLine, word) {
      word = word || "le taux";
      var R = Math.round(ratio * 100) / 100, first = (R - 1) / n * 100, T = table(n), st = [];
      st.push(ratioLine || ("Ratio fin ÷ début ≈ " + c2(R)));
      var exact = (Math.pow(ratio, 1 / n) - 1) * 100;
      st.push("Premier jet : (" + c2(R) + " − 1) ÷ " + n + " = " + fr(Math.round(first * 10) / 10, 1) + " %. " + (first - exact < 0.5 ? "Sur un petit taux, la composition joue peu : " + word + " est juste en dessous." : "C'est trop haut : la croissance se compose, donc " + word + " est plus bas."));
      var hit = null, lo = null, hi = null;
      for (var i = 0; i < T.length; i++) { if (Math.abs(T[i].v - R) <= 0.02 * R) { hit = T[i]; break; } if (T[i].v < R) lo = T[i]; else if (!hi) hi = T[i]; }
      st.push("Repères sur " + n + " ans : " + T.filter(function (t) { return t.g <= 30; }).map(function (t) { return fr(1 + t.g / 100) + pw(n) + " ≈ " + c2(t.v); }).join(" · "));
      var est;
      if (hit) { est = hit.g; st.push(fr(1 + hit.g / 100) + pw(n) + " ≈ " + c2(hit.v) + ", soit le ratio : " + word + " ≈ " + hit.g + " %"); }
      else if (lo && hi) { est = lo.g + 5 * (R - lo.v) / (hi.v - lo.v);
        st.push(c2(R) + " est entre " + c2(lo.v) + " (" + lo.g + " %) et " + c2(hi.v) + " (" + hi.g + " %), à peu près aux " + Math.round((R - lo.v) / (hi.v - lo.v) * 10) + "/10 : " + word + " ≈ " + fr(Math.round(est), 0) + " %"); }
      if (Math.abs(R - 2) <= 0.06) st.push("Raccourci pour un doublement : règle de 72, 72 ÷ " + n + " ≈ " + fr(Math.round(72 / n * 10) / 10, 1) + " %");
      return { rule: "On ne calcule pas une racine " + ({ 2: "carrée", 3: "cubique", 4: "quatrième", 5: "cinquième" }[n] || n + "-ième") + " de tête : on cherche quel taux, composé " + n + " fois, donne le ratio, avec les repères (1 + g)" + pw(n) + ".", steps: st };
    }
    function df(r, n) { return Math.round(100 / Math.pow(1 + r / 100, n)) / 100; }
    function dfLine(r, n) { var o = []; for (var i = 1; i <= n; i++) o.push("année " + i + " ≈ " + c2(df(r, i))); return "Facteurs d'actualisation à " + r + " % (repères) : " + o.join(" · "); }
    function invRate(k) { var m = Math.round(10000 / k) / 100; return "÷ " + fr(k) + " % = × 100/" + fr(k) + " ≈ × " + fr(m); }
    return { powSteps: powSteps, root: root, c2: c2, df: df, dfLine: dfLine, invRate: invRate, pw: pw };
  })();

  // ---------- bibliothèque financière (oracle unique, testée sur les exemples du référentiel) ----------
  var FIN = {
    npv: function (r, flows) { // flows[0] à t=0
      var s = 0; for (var t = 0; t < flows.length; t++) s += flows[t] / Math.pow(1 + r, t); return s;
    },
    gordon: function (cf1, r, g) { if (!(r > g)) throw new Error("Gordon : WACC doit être > g"); return cf1 / (r - g); },
    irr: function (flows) { // bissection, flux datés annuels
      var lo = -0.99, hi = 10, flo = FIN.npv(lo, flows), fhi = FIN.npv(hi, flows);
      if (flo * fhi > 0) return NaN;
      for (var k = 0; k < 200; k++) {
        var mid = (lo + hi) / 2, fm = FIN.npv(mid, flows);
        if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
      }
      return (lo + hi) / 2;
    },
    irrFromMoic: function (m, n) { return Math.pow(m, 1 / n) - 1; },
    ev: function (equity, netDebt, minor, prefs, nonOp) { return equity + netDebt + (minor || 0) + (prefs || 0) - (nonOp || 0); },
    equity: function (ev, netDebt, minor, prefs, nonOp) { return ev - netDebt - (minor || 0) - (prefs || 0) + (nonOp || 0); },
    fcff: function (ebit, t, da, capex, dbfr) { return ebit * (1 - t) + da - capex - dbfr; },
    wacc: function (E, D, ke, kd, t) { return E / (D + E) * ke + D / (D + E) * kd * (1 - t); },
    cagr: function (v0, vn, n) { if (!(v0 > 0) || !(vn > 0)) throw new Error("CAGR non défini"); return Math.pow(vn / v0, 1 / n) - 1; },
    breakeven: function (F, P, v) { if (!(P > v)) throw new Error("P doit être > v"); return F / (P - v); }
  };

  // ---------- catalogue ----------
  // fam: M / C / D / S ; skill = compétence où l'historique se consolide (S et D héritent, pas de double historique)
  var CAT = {};
  function def(id, o) { o.id = id; o.fam = id[0]; if (!o.skill) o.skill = id; CAT[id] = o; }

  // --- M : automatismes (niveau A) ---
  def("M01", { prio: "P0", lvl: "A", name: "Additions, compléments, compensation", formula: "a + b = a + (rond) − écart", signal: "Quand je vois 198, 299, 497 → j'arrondis puis je compense.", trap: "Oublier de compenser dans le bon sens.", check: "Signe et borne : 387 + 198 < 387 + 200." });
  def("M02", { prio: "P0", lvl: "A", name: "Multiplications 2×2, 3×2", formula: "a × b = a × (b₁ + b₂) ou a × (rond − écart)", signal: "Quand je vois deux nombres à 2 chiffres → je décompose UN seul facteur.", trap: "Décomposer les deux facteurs et oublier le terme croisé.", check: "Ordre de grandeur : 23 × 47 ≈ 25 × 45 ≈ 1 100." });
  def("M03", { prio: "P0", lvl: "A", name: "×5, 9, 11, 25, 50, 125, carrés", formula: "×25 = ×100 ÷ 4 · ×125 = ×1000 ÷ 8 · (10a+5)² = a(a+1)·100 + 25", signal: "Quand je vois 25 / 50 / 125 / 9 / 11 ou un carré en 5 → raccourci.", trap: "Appliquer un trick moins efficace qu'une décomposition simple.", check: "Contrôle inverse : 6 000 ÷ 125 = 48." });
  def("M04", { prio: "P0", lvl: "A", name: "Divisions, simplification", formula: "a ÷ b = (a ÷ k) ÷ (b ÷ k) · ÷25 = ×4 ÷100 · ÷12,5 = ×8 ÷100", signal: "Quand le diviseur est 25, 12,5, 125 ou a un facteur commun → simplifier d'abord.", trap: "Diviser à la main sans simplifier : lent et source d'erreur.", check: "Inverse : quotient × diviseur = dividende." });
  def("M05", { prio: "P0", lvl: "A", name: "Fractions ↔ %", formula: "1/8 = 12,5 % · 3/8 = 37,5 % · 1/16 = 6,25 % · 1/6 ≈ 16,7 % · 1/12 ≈ 8,3 %", signal: "Quand je vois 37,5 %, 62,5 %, 16,7 % → je remplace par la fraction.", trap: "Multiplier par le % au lieu de diviser par le dénominateur.", check: "Borne : 37,5 % est entre 1/3 et 1/2." });
  def("M06", { prio: "P0", lvl: "A", name: "Puissances de 10, k / M / Md", formula: "k = 10³ · M = 10⁶ · Md = 10⁹ ; chiffres × chiffres, exposants + exposants", signal: "Quand l'énoncé mélange M, k, Md → séparer chiffres et zéros.", trap: "Perdre la virgule ou un facteur 1 000.", check: "Annoncer l'unité avant le chiffre." });
  def("M07", { prio: "P0", lvl: "A", name: "Parts, points de %, bps", formula: "Variation relative = (fin − début) / début · points = fin − début · 100 bps = 1 point", signal: "Quand on passe d'un taux à un autre → préciser points ou relatif.", trap: "Confondre +5 points et +5 %.", check: "20 % → 25 % : +5 points = +25 % relatif." });
  def("M08", { prio: "P0", lvl: "A", name: "Variations successives, base d'origine", formula: "(1 + a)(1 + b) − 1 · base = final ÷ (1 + t)", signal: "Quand je vois « après une hausse de t » → diviser par (1 + t).", trap: "Retirer t % du final, ou additionner des variations successives.", check: "+20 % puis −20 % = −4 %, jamais 0." });
  def("M09", { prio: "P0", lvl: "A", name: "Équations simples, produit en croix", formula: "a·x = b → x = b ÷ a · règle de trois si proportionnel", signal: "Quand on connaît le résultat et le taux → isoler l'inconnue.", trap: "Règle de trois sur une relation non proportionnelle.", check: "Réinjecter x dans l'équation." });
  def("M10", { prio: "P0", lvl: "A", name: "Arrondis, estimation, bornes", formula: "Arrondir chaque facteur, puis corriger le sens de l'erreur", signal: "Quand les nombres sont « presque ronds » → estimer puis affiner.", trap: "Arrondir deux facteurs dans le même sens sans le dire.", check: "19,8 × 51 ≈ 1 000 (exact 1 009,8)." });
  def("M11", { prio: "P1", lvl: "A", name: "Puissances, doublement, CAGR approché", formula: "(1 + g)ⁿ · doublement ≈ 72 ÷ g% (exact ln 2 / ln(1 + g))", signal: "Quand on demande « en combien d'années double… » → règle de 72.", trap: "Prendre 72 pour une identité ; c'est une approximation.", check: "1,1² = 1,21 ; 1,1⁵ ≈ 1,61 ; 1,15⁵ ≈ 2." });

  // --- C : mécanismes case ---
  def("C01", { prio: "P0", lvl: "B", name: "Sizing par la demande", formula: "Marché = population × éligibilité × pénétration × fréquence × prix", signal: "Quand on demande la taille d'un marché grand public → arbre de demande.", trap: "Multiplier deux taux qui ont le même dénominateur.", check: "Comparer au PIB ou à un marché connu." });
  def("C02", { prio: "P0", lvl: "B", name: "Sizing par l'offre / capacité", formula: "CA = sites × capacité × utilisation × périodes × prix", signal: "Quand l'énoncé donne des sites et une capacité → sizing offre.", trap: "Oublier le taux d'utilisation ou mélanger jour/an.", check: "Recouper avec la demande." });
  def("C03", { prio: "P0", lvl: "B", name: "Parc et renouvellement", formula: "Ventes annuelles = parc ÷ durée de vie + installations nettes", signal: "Quand je vois un parc installé et une durée de vie → stock ÷ durée = flux.", trap: "Confondre stock et flux.", check: "Ventes < parc." });
  def("C04", { prio: "P0", lvl: "B", name: "CA = Σ volume × prix ; services", formula: "CA = Σ QᵢPᵢ · services : ETP × jours × staffing × TJM", signal: "Quand je vois consultants, TJM, staffing → volume facturable × prix.", trap: "Utiliser les jours disponibles au lieu des jours facturés.", check: "CA par consultant plausible (150–300 k€)." });
  def("C05", { prio: "P0", lvl: "B", name: "Parts de marché valeur / relative", formula: "PdM = entreprise ÷ marché (même périmètre) · relative = notre part ÷ part du concurrent de référence", signal: "Quand on compare à un concurrent → part relative (peut dépasser 100 %).", trap: "Marché en Md€ et CA en M€ sans conversion.", check: "PdM ≤ 100 % ; relative > 1 = leader." });
  def("C06", { prio: "P0", lvl: "B", name: "Moyenne pondérée, ASP, marge consolidée", formula: "Σ wᵢxᵢ ÷ Σ wᵢ · ASP = CA ÷ unités · marge consolidée = Σ profit ÷ Σ CA", signal: "Quand plusieurs segments ont des marges différentes → pondérer par le CA.", trap: "Moyenne simple des marges, ou pondérer une marge par les unités.", check: "La moyenne est entre les deux extrêmes." });
  def("C07", { prio: "P0", lvl: "B", name: "Funnel de conversion", formula: "Taux d'étape = suivants ÷ précédents · total = produit des taux conditionnels", signal: "Quand je vois une suite visiteurs → leads → clients → taux conditionnels.", trap: "Multiplier des taux déjà cumulés.", check: "Total ≤ chaque taux d'étape." });
  def("C08", { prio: "P0", lvl: "B", name: "Croissance composée, CAGR", formula: "Vₙ = V₀(1 + g)ⁿ · CAGR = (Vₙ ÷ V₀)^(1/n) − 1", signal: "Quand je vois deux dates et deux valeurs → n = nombre d'intervalles.", trap: "Compter les années au lieu des intervalles ; diviser la croissance totale par n.", check: "CAGR < croissance totale ÷ n." });
  def("C09", { prio: "P0", lvl: "B", name: "Effet prix × volume", formula: "ΔCA = (1 + gP)(1 + gV) − 1 = gP + gV + gP·gV", signal: "Quand prix et volume bougent ensemble → isoler l'effet croisé.", trap: "Additionner les % sans terme croisé.", check: "+10 % / −10 % = −1 %." });
  def("C10", { prio: "P0", lvl: "B", name: "Churn et parc clients", formula: "N fin = N début − sorties + entrées · rétention sur n périodes = (1 − c)ⁿ", signal: "Quand je vois départs et arrivées → stock et flux.", trap: "Appliquer le churn au parc final ; brut ≠ net.", check: "Parc final cohérent avec les flux." });
  def("C11", { prio: "P1", lvl: "B", name: "Économie client, GMV, take rate", formula: "CA plateforme = GMV × take rate · ARPU = revenu ÷ utilisateurs", signal: "Quand je vois une marketplace → GMV ≠ CA.", trap: "Prendre le GMV pour le CA.", check: "Take rate typique 5–30 %." });
  def("C12", { prio: "P1", lvl: "B", name: "CAC et LTV", formula: "CAC = dépenses d'acquisition ÷ nouveaux clients · LTV = contribution annuelle ÷ churn annuel", signal: "Quand on demande si l'acquisition est rentable → LTV vs CAC.", trap: "LTV calculée sur le CA, pas sur la contribution.", check: "LTV/CAC > 3 est souvent visé." });
  def("C13", { prio: "P0", lvl: "B", name: "P&L : marge brute, EBITDA, EBIT", formula: "Marge brute = CA − COGS · EBITDA = MB − opex · EBIT = EBITDA − D&A · marge = indicateur ÷ CA", signal: "Quand on donne des lignes de coûts → reconstruire le P&L dans l'ordre.", trap: "Retirer les D&A avant l'EBITDA.", check: "EBIT ≤ EBITDA ≤ marge brute." });
  def("C14", { prio: "P0", lvl: "B", name: "Contribution et résultat", formula: "Contribution = Q(P − v) · résultat = Q(P − v) − F", signal: "Quand je vois coût unitaire variable et coûts fixes → contribution d'abord.", trap: "Traiter la dilution des fixes par unité comme une baisse de F.", check: "Résultat < contribution." });
  def("C15", { prio: "P0", lvl: "B", name: "Markup vs marge, prix cible", formula: "Markup = (P − c) ÷ c · marge = (P − c) ÷ P · prix cible = c ÷ (1 − m)", signal: "Quand on parle de « marge de 25 % » → vérifier la base (prix ou coût).", trap: "Markup 25 % ≠ marge 25 % (c'est 20 %).", check: "Marge < markup." });
  def("C16", { prio: "P0", lvl: "B", name: "Point mort", formula: "Q* = F ÷ (P − v) · CA* = F ÷ taux de contribution · cible de profit : (F + π) ÷ (P − v)", signal: "Quand on demande « à partir de combien d'unités » → point mort.", trap: "Diviser par le prix au lieu de la marge unitaire.", check: "Exiger P > v." });
  def("C17", { prio: "P0", lvl: "B", name: "Volume pour maintenir la contribution", formula: "Q₁ = Q₀(P₀ − v) ÷ (P₁ − v)", signal: "Quand on baisse le prix → combien de volume pour garder le même profit.", trap: "Maintenir le CA au lieu de la contribution.", check: "Q₁ > Q₀ si P₁ < P₀." });
  def("C18", { prio: "P0", lvl: "B", name: "Élasticité prix", formula: "ε = (ΔQ ÷ Q₀) ÷ (ΔP ÷ P₀)", signal: "Quand on donne une sensibilité des volumes au prix → élasticité, puis profit.", trap: "Oublier le signe ; extrapoler loin.", check: "|ε| > 1 : demande élastique." });
  def("C19", { prio: "P0", lvl: "C", name: "Profit bridge et mix", formula: "Profit = Σ Qᵢ(Pᵢ − vᵢ) − F ; comparer avant / après", signal: "Quand le mix change entre produits → recalculer la contribution par produit.", trap: "Raisonner sur le CA total sans les marges unitaires.", check: "Somme des effets = écart total." });
  def("C20", { prio: "P0", lvl: "B", name: "Capacité et utilisation", formula: "Capacité = ressources × temps × cadence × taux effectif", signal: "Quand je vois machines, équipes, heures → chaîne de conversion.", trap: "Compter deux fois utilisation et rendement.", check: "Convertir toutes les périodes." });
  def("C21", { prio: "P0", lvl: "C", name: "Goulot et rendements en chaîne", formula: "Débit = min des capacités × rendements en aval", signal: "Quand un flux traverse plusieurs étapes → le goulot fixe le débit.", trap: "Prendre la moyenne des capacités ; appliquer la perte au mauvais stade.", check: "Débit ≤ chaque capacité." });
  def("C22", { prio: "P0", lvl: "B", name: "ETP et productivité", formula: "ETP = charge ÷ temps productif par ETP (arrondi au supérieur)", signal: "Quand on demande combien de personnes → charge ÷ capacité individuelle.", trap: "Multiplier par le taux de staffing au lieu de diviser.", check: "Personnes entières." });
  def("C23", { prio: "P1", lvl: "B", name: "Make or buy, seuil d'égalité", formula: "F_A + v_A·Q = F_B + v_B·Q → Q = (F_A − F_B) ÷ (v_B − v_A)", signal: "Quand deux options ont fixe et variable différents → seuil.", trap: "Comparer des coûts moyens.", check: "Au-delà du seuil, l'option à faible variable gagne." });
  def("C24", { prio: "P1", lvl: "B", name: "Loi de Little", formula: "Encours (WIP) = débit × délai", signal: "Quand on relie stock, flux et temps → Little.", trap: "Unités de temps incohérentes.", check: "Flux stable supposé." });
  def("C25", { prio: "P1", lvl: "B", name: "Rendement, rebuts, coût par unité bonne", formula: "Coût par unité bonne = coût engagé ÷ output bon", signal: "Quand il y a des rebuts → diviser par les unités bonnes.", trap: "10 % de pertes sur l'input ≠ sur l'output.", check: "Coût unitaire bon > coût unitaire engagé." });
  def("C26", { prio: "P1", lvl: "B", name: "Payback", formula: "Premier t où le cash cumulé ≥ 0 · flux constant : I ÷ flux", signal: "Quand on demande en combien de temps l'investissement est remboursé.", trap: "Utiliser l'EBITDA au lieu du cash.", check: "Payback < horizon." });
  def("C27", { prio: "P1", lvl: "B", name: "ROI simple", formula: "ROI = (gains − coûts) ÷ coûts, sur un horizon défini", signal: "Quand on compare un gain cumulé à un coût → ROI.", trap: "Horizons différents ; inclure un coût échoué.", check: "ROI > 0 si gains > coûts." });
  def("C28", { prio: "P1", lvl: "B", name: "BFR en jours", formula: "Créances = CA × DSO ÷ 365 · stocks = COGS × DIO ÷ 365 · dettes = achats × DPO ÷ 365", signal: "Quand je vois des délais de paiement en jours → jours de CA.", trap: "Prendre une hausse de BFR pour une perte.", check: "30 jours ≈ un mois de CA." });
  def("C29", { prio: "P1", lvl: "B", name: "Cash flow incrémental", formula: "CF = EBIT(1 − t) + D&A − capex − ΔBFR", signal: "Quand on passe du profit au cash → réintégrer D&A, retirer capex et ΔBFR.", trap: "Une hausse de BFR consomme du cash (signe −).", check: "CF ≠ résultat." });
  def("C30", { prio: "P1", lvl: "C", name: "Besoin de financement", formula: "Besoin = max(0, −min du cash cumulé)", signal: "Quand les flux sont négatifs au début → creux de trésorerie.", trap: "Additionner pertes et dépenses déjà comptées.", check: "Le besoin est le point bas, pas la somme des négatifs." });
  def("C31", { prio: "P1", lvl: "B", name: "VAN, perpétuité", formula: "VAN = −I₀ + Σ CFₜ ÷ (1 + r)ᵗ · perpétuité = CF₁ ÷ (r − g), r > g", signal: "Quand les flux s'étalent dans le temps → actualiser.", trap: "Actualiser le CA ; ajouter une valeur terminale non demandée.", check: "VAN < somme non actualisée." });
  def("C32", { prio: "P1", lvl: "B", name: "EV/EBITDA, equity", formula: "EV = multiple × EBITDA · equity ≈ EV − dette nette", signal: "Quand on donne un multiple → EV, puis equity.", trap: "Oublier la dette nette.", check: "Equity < EV si dette nette > 0." });
  def("C33", { prio: "P1", lvl: "B", name: "Synergies nettes, MOIC", formula: "Bénéfice = synergies − coûts associés · MOIC = produits ÷ equity investie", signal: "Quand on parle d'acquisition → séparer récurrent et ponctuel.", trap: "Compter deux fois les coûts d'intégration.", check: "Synergies nettes < brutes." });
  def("C34", { prio: "P1", lvl: "B", name: "Espérance de valeur", formula: "E = Σ pᵢ·Vᵢ, Σ pᵢ = 1", signal: "Quand on a des scénarios avec probabilités → espérance.", trap: "Probabilités qui ne somment pas à 1.", check: "E entre le pire et le meilleur scénario." });
  def("C35", { prio: "P2", lvl: "C", name: "Sensibilité, seuil de bascule", formula: "Résoudre la variable pour laquelle la décision change", signal: "Quand on demande « à partir de quel prix / volume » → seuil.", trap: "Inventer une probabilité.", check: "Au seuil, les deux options sont égales." });
  def("C36", { prio: "P0", lvl: "C", name: "Lecture d'exhibit", formula: "ORIENT → PATTERN → HYPOTHÈSE → QUANTIFIER → SO WHAT", signal: "Quand on reçoit un tableau → base, période, unité avant de calculer.", trap: "Lire la mauvaise base (unités vs valeur).", check: "Les totaux réconcilient." });
  def("C37", { prio: "P1", lvl: "C", name: "Cohérence des données", formula: "Repérer l'information impossible : part > 100 %, somme > total, unité incohérente", signal: "Quand un chiffre surprend → vérifier unité, base et bornes.", trap: "Calculer sans questionner la donnée.", check: "Toujours faire un sanity check." });

  // --- D : Deal Valuation (spécialisations ; skill = brique C/M) ---
  def("D01", { prio: "P0", lvl: "B", skill: "C32", name: "EV depuis l'equity", formula: "EV = equity + dette nette + minoritaires + préférentielles − actifs non opérationnels", signal: "Quand on passe du prix des titres à la valeur de l'activité.", trap: "Déduire le cash deux fois.", check: "Dette nette = dette − cash." });
  def("D02", { prio: "P0", lvl: "B", skill: "C32", name: "Equity depuis l'EV", formula: "Equity = EV − dette nette − minoritaires − préférentielles + actifs non opérationnels", signal: "Quand on passe de la valeur d'entreprise au prix des titres.", trap: "Dette nette négative : elle AUGMENTE l'equity.", check: "EV → equity → EV donne l'identité." });
  def("D03", { prio: "P0", lvl: "B", skill: "C32", name: "Multiples EV/EBITDA, P/E", formula: "EV = EBITDA × multiple · EBITDA requis = EV ÷ multiple · P/E = equity ÷ résultat net", signal: "Quand on donne un multiple → numérateur et dénominateur cohérents.", trap: "Appliquer un multiple d'EV à un résultat net.", check: "Historique vs forward, même périmètre." });
  def("D04", { prio: "P1", lvl: "B", skill: "C32", name: "Comparables", formula: "EV = médiane des multiples comparables × agrégat cible", signal: "Quand on a une liste de multiples → médiane (robuste aux extrêmes).", trap: "Mélanger trading comps et transactions.", check: "Fourchette basse / haute." });
  def("D05", { prio: "P0", lvl: "A", skill: "M07", name: "Prime d'acquisition", formula: "Prime = (prix offert − cours préannonce) ÷ cours préannonce", signal: "Quand on compare un prix offert au cours → prime, equity contre equity.", trap: "Calculer une prime sur l'EV.", check: "Primes usuelles 20–40 %." });
  def("D06", { prio: "P0", lvl: "B", skill: "C06", name: "EBITDA et marge combinés", formula: "Marge combinée = (EBITDA A + EBITDA B) ÷ (CA A + CA B)", signal: "Quand on fusionne deux sociétés → pondérer par le CA.", trap: "Moyenne simple des marges.", check: "Marge entre les deux marges." });
  def("D07", { prio: "P0", lvl: "B", skill: "C33", name: "Prix maximum stratégique", formula: "EV max = EV standalone + VAN synergies nettes − marge de sécurité", signal: "Quand on demande combien l'acheteur peut payer au maximum.", trap: "Payer deux fois des synergies déjà dans le standalone.", check: "Comparer EV avec EV." });
  def("D08", { prio: "P1", lvl: "B", skill: "C33", name: "Valeur créée pour l'acheteur", formula: "Valeur créée = EV standalone + VAN synergies − EV payée − coûts non inclus", signal: "Quand on demande si le deal crée de la valeur.", trap: "Retrancher deux fois des coûts déjà nets.", check: "Valeur économique, pas comptable." });
  def("D09", { prio: "P1", lvl: "B", skill: "C29", name: "FCFF", formula: "FCFF = EBIT(1 − t) + D&A − capex − ΔBFR", signal: "Quand on construit un DCF → flux disponibles avant dette.", trap: "Inclure les intérêts dans le FCFF.", check: "EBITDA ≠ cash." });
  def("D10", { prio: "P1", lvl: "C", skill: "C31", name: "DCF et valeur terminale", formula: "EV = Σ FCFFₜ ÷ (1 + WACC)ᵗ + TV ÷ (1 + WACC)ⁿ · TV = FCFFₙ₊₁ ÷ (WACC − g)", signal: "Quand on a quelques flux + une valeur terminale → tout actualiser.", trap: "Ne pas actualiser la TV ; WACC ≤ g.", check: "La TV pèse souvent > 50 % de l'EV." });
  def("D11", { prio: "P0", lvl: "B", skill: "C33", name: "Synergies coûts et revenus", formula: "Coûts : base × taux · revenus : CA additionnel × contribution · − désynergies", signal: "Quand on chiffre des synergies → les revenus comptent par leur contribution.", trap: "Additionner le CA additionnel comme du profit.", check: "Synergies EBITDA < synergies « brutes » annoncées." });
  def("D12", { prio: "P1", lvl: "B", skill: "C31", name: "VAN des synergies", formula: "VAN = Σ FCF synergies ÷ (1 + r)ᵗ − coûts d'intégration", signal: "Quand les synergies sont récurrentes → perpétuité puis coûts ponctuels.", trap: "Soustraire deux fois les coûts d'intégration.", check: "Timing et montée en charge." });
  def("D13", { prio: "P1", lvl: "B", skill: "C06", name: "WACC", formula: "WACC = E/(D + E)·Ke + D/(D + E)·Kd·(1 − t)", signal: "Quand on donne structure, Ke et Kd → moyenne pondérée.", trap: "Oublier le bouclier fiscal sur Kd.", check: "Kd(1 − t) < WACC < Ke." });
  def("D14", { prio: "P2", lvl: "C", skill: "C33", name: "Accrétion / dilution", formula: "Accrétion = BPA pro forma ÷ BPA standalone − 1", signal: "Quand on finance par dette ou actions → effet sur le BPA.", trap: "Accrétion ≠ création de valeur.", check: "Intérêts après impôt, nouvelles actions." });
  def("D15", { prio: "P0", lvl: "B", skill: "M11", name: "MOIC et TRI", formula: "MOIC = (distributions + equity de sortie) ÷ equity investie · TRI = MOIC^(1/n) − 1", signal: "Quand on donne entrée et sortie d'un fonds → MOIC puis TRI.", trap: "Diviser MOIC − 1 par n (TRI simple).", check: "2× en 5 ans ≈ 14,9 % ; 3× en 5 ans ≈ 24,6 %." });
  def("D16", { prio: "P1", lvl: "B", skill: "C30", name: "LBO : sources = emplois", formula: "Equity sponsor = emplois (prix + frais + refinancement) − dette", signal: "Quand on monte un LBO → les sources égalent les emplois.", trap: "Oublier les frais.", check: "Sources = emplois." });
  def("D17", { prio: "P0", lvl: "B", skill: "C32", name: "Valeur de sortie", formula: "EV sortie = EBITDA sortie × multiple · equity sortie = EV − dette nette", signal: "Quand on sort d'un LBO → EV, puis dette nette restante.", trap: "Compter deux fois la dette remboursée.", check: "Bridge : croissance + multiple + désendettement." });
  def("D18", { prio: "P1", lvl: "B", skill: "M11", name: "Equity max pour un TRI cible", formula: "Equity max = produits ÷ (1 + TRI cible)ⁿ", signal: "Quand on demande combien investir pour atteindre un TRI.", trap: "Confondre TRI projet et TRI sponsor.", check: "Plus le TRI cible est haut, plus l'equity max baisse." });
  def("D19", { prio: "P2", lvl: "B", skill: "C30", name: "Capacité d'endettement", formula: "Levier = dette ÷ EBITDA · couverture = EBITDA ÷ intérêts", signal: "Quand on parle de dette maximale → multiples d'EBITDA.", trap: "Dette brute vs nette.", check: "Levier LBO typique 4–6×." });
  def("D20", { prio: "P1", lvl: "A", skill: "C32", name: "Prix par action, participation", formula: "Prix par action = equity ÷ actions diluées · chèque = % acquis × equity", signal: "Quand on achète une participation → pro rata si aucune prime.", trap: "Confondre valeur à 100 % et chèque payé.", check: "Actions diluées." });
  def("D21", { prio: "P1", lvl: "B", skill: "C28", name: "Prix de clôture cash-free / debt-free", formula: "Prix = EV − dette nette + (BFR réel − BFR cible) ± ajustements", signal: "Quand on a un BFR cible dans un SPA → ajustement de prix.", trap: "Signe de l'ajustement de BFR.", check: "BFR réel > cible → le prix augmente." });
  def("D22", { prio: "P2", lvl: "B", skill: "C33", name: "Paiement en actions, dilution", formula: "Titres émis = contrepartie ÷ cours · dilution = nouveaux ÷ total pro forma", signal: "Quand l'acheteur paie en actions → dilution de propriété.", trap: "Dilution sur l'ancien total au lieu du pro forma.", check: "Dilution < 100 %." });
  def("D23", { prio: "P2", lvl: "B", skill: "C34", name: "Earn-out", formula: "Valeur = fixe + Σ pᵢ × montantᵢ (actualisé si demandé)", signal: "Quand une partie du prix dépend de la performance → espérance.", trap: "Prendre le montant maximum.", check: "Valeur ≤ prix plafond." });

  // --- S : variantes sectorielles (spécialisations) ---
  def("S01", { prio: "P0", lvl: "C", skill: "C20", name: "Saisonnalité et occupation", formula: "CA = Σ capacité × occupation × jours × prix", signal: "Quand l'activité varie par saison → calculer par saison, puis additionner.", trap: "Moyenner deux saisons de durées inégales.", check: "Occupation moyenne pondérée par les jours." });
  def("S02", { prio: "P0", lvl: "B", skill: "C02", name: "Énergie : MW, MWh, facteur de charge", formula: "MWh = MW × heures × facteur de charge · CA = MWh × €/MWh", signal: "Quand je vois des MW → puissance, multiplier par le temps pour l'énergie.", trap: "MW ≠ MWh.", check: "8 760 heures par an." });
  def("S03", { prio: "P1", lvl: "B", skill: "C25", name: "Supply chain : tonne-km, coût rendu", formula: "Coût transport = tonnes × km × €/t·km", signal: "Quand on parle de transport → tonnes × distance.", trap: "Oublier un aller-retour ou une unité kg/t.", check: "Coût rendu = prix + transport." });
  def("S04", { prio: "P1", lvl: "B", skill: "C13", name: "Banque / assurance", formula: "Intérêts = encours × taux × durée · ratio combiné = (sinistres + frais) ÷ primes acquises", signal: "Quand on parle d'encours → flux = encours × taux.", trap: "Confondre bps et points.", check: "Ratio combiné < 100 % = rentable techniquement." });
  def("S05", { prio: "P0", lvl: "B", skill: "C11", name: "Asset management / abonnements", formula: "AuM fin = début + flux nets + performance · revenus = AuM moyen × frais", signal: "Quand je vois des encours et des bps → revenus = encours × frais.", trap: "Prendre les encours pour le CA.", check: "1 bp = 0,01 %." });
  def("S06", { prio: "P1", lvl: "B", skill: "C07", name: "Santé : prévalence, funnel patients", formula: "Patients traités = population × prévalence × diagnostic × traitement", signal: "Quand je vois prévalence / incidence → stock vs nouveaux cas.", trap: "Confondre prévalence et incidence.", check: "Patients traités < diagnostiqués." });
  def("S07", { prio: "P1", lvl: "B", skill: "C22", name: "RH : attrition et coût de remplacement", formula: "Économie = effectif × baisse d'attrition (points) × coût de remplacement − coût du programme", signal: "Quand on réduit l'attrition → départs évités × coût unitaire.", trap: "Baisse relative vs en points.", check: "Net du coût du programme." });
  def("S08", { prio: "P1", lvl: "B", skill: "C03", name: "Parc / leasing", formula: "Loyers = parc loué × loyer mensuel × 12", signal: "Quand on loue des actifs → parc × loyer × période.", trap: "Loyer mensuel vs annuel.", check: "Loyer annuel < valeur de l'actif." });
  def("S09", { prio: "P1", lvl: "B", skill: "C15", name: "Taxes, remises, change", formula: "Prix net = prix × (1 − remise) · TTC = HT × (1 + TVA) · conversion = montant × taux", signal: "Quand plusieurs % s'enchaînent → multiplier, jamais additionner.", trap: "Additionner remise et TVA.", check: "Base exacte de chaque taux." });

  // ---------- générateurs ----------
  // chaque générateur renvoie {q, ans, unit, tol, method, p (paramètres), traps?, scale?, so?}
  // scale : "eur" ou "n" → l'appli demande l'unité (k / M / Md) ; ans est exprimée dans `unit`.
  var G = {};

  G.M01 = function (r) {
    var a = r.i(120, 980), d = r.p([2, 3, 1, 4]), R = r.p([200, 300, 500, 1000]), b = R - d, plus = r.f() < 0.6;
    if (!plus && a < b) a += b;
    var ans = plus ? a + b : a - b;
    return { p: { a: a, b: b, plus: plus }, q: a + (plus ? " + " : " − ") + b, ans: ans, unit: "", tol: T.EX,
      method: a + (plus ? " + " : " − ") + R + " = " + fr(plus ? a + R : a - R) + ", puis " + (plus ? "− " : "+ ") + d + " → " + fr(ans) };
  };
  G.M02 = function (r) {
    var a = r.f() < 0.3 ? r.i(102, 480) : r.i(12, 89), b = r.i(12, 89);
    var t = Math.floor(b / 10) * 10, u = b % 10, ans = a * b;
    var near = (b % 10 >= 7) ? (t + 10) : null;
    var m = near ? (a + " × " + near + " = " + fr(a * near) + ", − " + a + " × " + (near - b) + " = " + fr(a * (near - b)) + " → " + fr(ans))
                 : (a + " × " + t + " = " + fr(a * t) + " ; " + a + " × " + u + " = " + fr(a * u) + " ; total " + fr(ans));
    return { p: { a: a, b: b }, q: a + " × " + b, ans: ans, unit: "", tol: T.EX, method: m,
      traps: [{ v: Math.floor(a / 10) * 10 * t + (a % 10) * u, code: "E04", msg: "Tu as décomposé les deux facteurs et oublié les termes croisés." }] };
  };
  G.M03 = function (r) {
    var v = r.i(0, 3);
    if (v === 0) { var k = r.p([25, 50, 125]), div = k === 25 ? 4 : k === 50 ? 2 : 8, pw = k === 125 ? 1000 : 100, b = div * r.i(3, 40);
      return { p: { k: k, b: b }, q: b + " × " + k, ans: b * k, unit: "", tol: T.EX, method: b + " ÷ " + div + " = " + fr(b / div) + ", × " + pw + " = " + fr(b * k) }; }
    if (v === 1) { var a = r.i(11, 89), m = r.p([9, 11, 99]);
      var mm = m === 11 ? (a + " × 10 + " + a + " = " + fr(a * 11)) : (a + " × " + (m + 1) + " − " + a + " = " + fr(a * m));
      return { p: { a: a, m: m }, q: a + " × " + m, ans: a * m, unit: "", tol: T.EX, method: mm }; }
    if (v === 2) { var t = r.i(1, 12), n = 10 * t + 5;
      return { p: { n: n }, q: n + "²", ans: n * n, unit: "", tol: T.EX, method: t + " × " + (t + 1) + " = " + t * (t + 1) + ", on colle 25 → " + fr(n * n) }; }
    var R = r.p([20, 30, 40, 50, 60, 100]), d = r.p([1, 2]), a2 = R - d, b2 = r.i(12, 69);
    return { p: { a: a2, b: b2 }, q: a2 + " × " + b2, ans: a2 * b2, unit: "", tol: T.EX, method: R + " × " + b2 + " = " + fr(R * b2) + ", − " + d + " × " + b2 + " = " + fr(d * b2) + " → " + fr(a2 * b2) };
  };
  G.M04 = function (r) {
    var v = r.i(0, 2);
    if (v === 0) { var d = r.p([12, 15, 16, 24, 35, 45, 48, 60, 75]), q = r.i(4, 80), n = d * q;
      var k = [12, 8, 6, 5, 4, 3, 2].filter(function (f) { return d % f === 0 && n % f === 0; })[0];
      return { p: { n: n, d: d }, q: fr(n) + " ÷ " + d, ans: q, unit: "", tol: T.EX, method: "Simplifie par " + k + " : " + fr(n / k) + " ÷ " + (d / k) + " = " + q }; }
    if (v === 1) { var q1 = r.i(12, 400), n1 = q1 * 25;
      return { p: { n: n1, d: 25 }, q: fr(n1) + " ÷ 25", ans: q1, unit: "", tol: T.EX, method: "÷25 = ×4 ÷100 : " + fr(n1) + " × 4 = " + fr(n1 * 4) + " → " + fr(q1) }; }
    var q2 = r.i(3, 90), n2 = q2 * 12.5;
    return { p: { n: n2, d: 12.5 }, q: fr(n2) + " ÷ 12,5", ans: q2, unit: "", tol: T.EX, method: "÷12,5 = ×8 ÷100 : " + fr(n2) + " × 8 = " + fr(n2 * 8) + " → " + fr(q2) };
  };
  G.M05 = function (r) {
    var F = [[1, 8], [3, 8], [5, 8], [7, 8], [1, 16], [3, 16], [7, 16], [1, 6], [5, 6], [1, 12], [1, 3], [2, 3], [1, 9], [3, 4], [2, 5]];
    var f = r.p(F), pct = f[0] / f[1] * 100;
    if (r.f() < 0.5) {
      var exact = Math.abs(rd(pct, 2) - pct) < 1e-9;
      return { p: { a: f[0], b: f[1] }, q: f[0] + "/" + f[1] + " en %", ans: pct, unit: "%", tol: exact ? T.EX : { abs: 0.05, label: "±0,05 point (arrondi)" },
        method: f[0] + " ÷ " + f[1] + " = " + fr(pct, 2) + " %" + (f[1] === 16 ? " (1/16 = 6,25 %)" : "") };
    }
    var base = f[1] * r.i(3, 40), ans = base * f[0] / f[1];
    return { p: { a: f[0], b: f[1], base: base }, q: fr(pct, 2) + " % de " + fr(base), ans: ans, unit: "", tol: T.EX,
      method: fr(pct, 2) + " % = " + f[0] + "/" + f[1] + " → " + fr(base) + " ÷ " + f[1] + " × " + f[0] + " = " + fr(ans) };
  };
  G.M06 = function (r) {
    var v = r.i(0, 2);
    if (v === 0) { var a = r.p([1.2, 2.4, 3.5, 4.2, 6, 8.4]), b = r.p([0.25, 0.35, 0.5, 1.5, 2.5]), ans = rd(a * b, 6); // M × k = Md
      return { p: { a: a, b: b }, q: fr(a) + " M × " + fr(b) + " k", ans: ans, unit: "Md", scale: "n", tol: T.EX,
        method: fr(a) + " × " + fr(b) + " = " + fr(ans, 4) + " ; 10⁶ × 10³ = 10⁹ → " + fr(ans, 4) + " Md" }; }
    if (v === 1) { var ca = r.p([12, 18, 24, 36, 45, 60, 90]), k = r.p([1.5, 2, 3, 4, 6]), ans1 = ca * 1000 / k; // € par client
      return { p: { ca: ca, k: k }, q: "CA de " + ca + " M€ pour " + fr(k * 1000) + " clients. CA par client ?", ans: ans1 / 1000, unit: "k€", scale: "eur", tol: T.EX,
        method: ca + " × 10⁶ ÷ (" + fr(k) + " × 10³) = (" + ca + " ÷ " + fr(k) + ") × 10³ = " + fr(ans1) + " €" }; }
    var x = r.p([3.6, 2.4, 1.8, 4.5]), p = r.p([25, 40, 15, 12]), ans2 = rd(x * p, 6); // M unités × € = M€
    return { p: { x: x, p: p }, q: fr(x) + " M unités × " + p + " € l'unité", ans: ans2, unit: "M€", scale: "eur", tol: T.EX,
      method: fr(x) + " × " + p + " = " + fr(ans2) + " ; M × € = M€ → " + fr(ans2) + " M€",
      traps: [{ v: ans2 * 10, code: "E05", msg: "Virgule déplacée : décalage d'un facteur 10." }] };
  };
  G.M07 = function (r) {
    var v = r.i(0, 2);
    if (v === 0) { var a = r.p([10, 12, 15, 20, 25, 40]), b = a + r.p([2, 3, 5, -2, -5]);
      return { p: { a: a, b: b }, q: "Un taux passe de " + a + " % à " + b + " %. Variation en points ?", ans: b - a, unit: "points", tol: T.EX,
        method: b + " − " + a + " = " + (b - a) + " points (relatif : " + fr((b - a) / a * 100, 1) + " %)",
        traps: [{ v: (b - a) / a * 100, code: "E03", msg: "Tu as donné la variation relative, pas les points." }] }; }
    if (v === 1) { var a1 = r.p([10, 20, 25, 40, 50]), b1 = a1 + r.p([5, 10, -5, 2]), rel = (b1 - a1) / a1 * 100;
      return { p: { a: a1, b: b1 }, q: "Un taux passe de " + a1 + " % à " + b1 + " %. Variation relative ?", ans: rel, unit: "%", tol: T.P01,
        method: "(" + b1 + " − " + a1 + ") ÷ " + a1 + " = " + fr(rel, 1) + " % (soit " + (b1 - a1) + " points)",
        traps: [{ v: b1 - a1, code: "E03", msg: "Tu as donné les points, pas la variation relative." }] }; }
    var bps = r.p([25, 50, 75, 150, 250]);
    return { p: { bps: bps }, q: bps + " bps en points de %", ans: bps / 100, unit: "points", tol: T.EX, method: "100 bps = 1 point → " + bps + " ÷ 100 = " + fr(bps / 100) };
  };
  G.M08 = function (r) {
    var v = r.i(0, 1);
    if (v === 0) { var a = r.p([10, 20, 25, 30, 50]), b = -r.p([10, 20, 25, 30]), tot = ((1 + a / 100) * (1 + b / 100) - 1) * 100;
      return { p: { a: a, b: b }, q: "+" + a + " % puis " + b + " %. Variation totale ?", ans: tot, unit: "%", tol: T.P01,
        method: fr(1 + a / 100) + " × " + fr(1 + b / 100) + " = " + fr((1 + a / 100) * (1 + b / 100), 4) + " → " + fr(tot, 2) + " %",
        traps: [{ v: a + b, code: "E04", msg: "Les variations successives se multiplient, elles ne s'additionnent pas." }] }; }
    var t = r.p([20, 25, 50, 10, 60]), base = r.p([40, 80, 120, 200, 160]) , fin = base * (1 + t / 100);
    return { p: { t: t, fin: fin }, q: "Après une hausse de " + t + " %, un prix vaut " + fr(fin) + " €. Prix avant ?", ans: base, unit: "€", tol: T.EX,
      method: fr(fin) + " ÷ " + fr(1 + t / 100) + " = " + fr(base) + " €",
      traps: [{ v: fin * (1 - t / 100), code: "E03", msg: "Retirer " + t + " % du prix final applique le taux à la mauvaise base." }] };
  };
  G.M09 = function (r) {
    var a = r.p([0.12, 0.15, 0.18, 0.24, 0.35, 0.45]), x = r.p([200, 300, 400, 600, 800, 1200]), b = rd(a * x, 6);
    return { p: { a: a, b: b }, q: fr(a) + " × x = " + fr(b) + ". x ?", ans: x, unit: "", tol: T.EX, method: "x = " + fr(b) + " ÷ " + fr(a) + " = " + fr(x) };
  };
  G.M10 = function (r) {
    var a = r.p([19.8, 29.7, 49.5, 9.9, 39.6]), b = r.p([51, 49, 31, 101, 21]), ans = a * b;
    return { p: { a: a, b: b }, q: "Estime " + fr(a) + " × " + fr(b) + " (ordre de grandeur)", ans: ans, unit: "", tol: T.R3,
      method: fr(Math.round(a)) + " × " + b + " = " + fr(Math.round(a) * b) + " ; exact " + fr(ans, 2) + " (arrondi vers le haut de " + fr(Math.round(a) - a, 1) + ")" };
  };
  G.M11 = function (r) {
    var v = r.i(0, 1);
    if (v === 0) { var g = r.p([5, 7, 10, 14]), ex = Math.log(2) / Math.log(1 + g / 100);
      return { p: { g: g }, q: "Croissance de " + g + " % par an. En combien d'années la valeur double-t-elle ?", ans: ex, unit: "années", tol: { rel: 0.06, label: "±6 % (règle de 72)" },
        method: "72 ÷ " + g + " = " + fr(72 / g, 1) + " ans (exact ln 2 / ln(1 + g) = " + fr(ex, 2) + ")" }; }
    var g2 = r.p([5, 10, 20, 15]), n = r.p([2, 3]), ans = (Math.pow(1 + g2 / 100, n) - 1) * 100;
    return { p: { g: g2, n: n }, q: "+" + g2 + " % par an pendant " + n + " ans. Croissance totale ?", ans: ans, unit: "%", tol: T.P01,
      method: "(1 + " + fr(g2 / 100) + ")^" + n + " = " + fr(Math.pow(1 + g2 / 100, n), 4) + " → " + fr(ans, 2) + " %",
      traps: [{ v: g2 * n, code: "E04", msg: "La croissance se compose : il manque les intérêts sur intérêts." }] };
  };

  // --- C ---
  G.C01 = function (r) {
    var pop = r.p([30, 28, 12, 68]), what = pop === 68 ? "Français" : pop === 12 ? "actifs urbains" : "foyers";
    var el = r.p([50, 60, 80]), pen = r.p([10, 20, 25, 40]), fq = r.p([1, 2, 4, 12]), pr = r.p([5, 10, 25, 40, 80]);
    var ans = pop * el / 100 * pen / 100 * fq * pr; // M€
    return { p: { pop: pop, el: el, pen: pen, fq: fq, pr: pr }, q: pop + " M de " + what + ", " + el + " % éligibles, " + pen + " % de pénétration chez les éligibles, " + fq + " achat(s) par an, " + pr + " € par achat. Taille du marché ?",
      ans: ans, unit: "M€", scale: "eur", tol: T.R1, method: pop + " × " + el + " % × " + pen + " % = " + fr(pop * el * pen / 1e4, 2) + " M acheteurs ; × " + fq + " × " + pr + " € = " + fr(ans, 1) + " M€",
      traps: [{ v: pop * pen / 100 * fq * pr, code: "E03", msg: "La pénétration s'applique aux éligibles, pas à toute la population." }] };
  };
  G.C02 = function (r) {
    var s = r.p([20, 40, 120, 250]), cap = r.p([80, 120, 200]), u = r.p([60, 70, 75, 80]), d = r.p([300, 360]), pr = r.p([10, 15, 25]);
    var ans = s * cap * u / 100 * d * pr / 1e6;
    return { p: { s: s, cap: cap, u: u, d: d, pr: pr }, q: s + " sites, " + cap + " couverts par jour chacun, utilisation " + u + " %, " + d + " jours par an, ticket " + pr + " €. CA annuel ?",
      ans: ans, unit: "M€", scale: "eur", tol: T.R1, method: s + " × " + cap + " × " + u + " % = " + fr(s * cap * u / 100) + " couverts/jour ; × " + d + " × " + pr + " € = " + fr(ans, 2) + " M€" };
  };
  G.C03 = function (r) {
    var parc = r.p([6, 8, 12, 20, 30]), life = r.p([4, 5, 8, 10, 12]), net = r.p([0, 0.2, 0.5, 1]);
    var ans = parc / life + net;
    return { p: { parc: parc, life: life, net: net }, q: "Parc installé de " + parc + " M d'appareils, durée de vie " + life + " ans, " + fr(net) + " M d'installations nettes par an. Ventes annuelles ?",
      ans: ans, unit: "M d'unités", tol: T.R05, method: parc + " ÷ " + life + " = " + fr(parc / life, 2) + " M de remplacements + " + fr(net) + " M = " + fr(ans, 2) + " M",
      traps: [{ v: parc + net, code: "E03", msg: "Stock ≠ flux : le parc doit être divisé par la durée de vie." }] };
  };
  G.C04 = function (r) {
    var etp = r.p([40, 80, 120, 200]), j = r.p([200, 210, 220]), st = r.p([60, 70, 75, 80]), tjm = r.p([800, 1000, 1200, 1500]);
    var ans = etp * j * st / 100 * tjm / 1e6;
    return { p: { etp: etp, j: j, st: st, tjm: tjm }, q: etp + " consultants, " + j + " jours disponibles par an, staffing " + st + " %, TJM réalisé " + fr(tjm) + " €. CA annuel ?",
      ans: ans, unit: "M€", scale: "eur", tol: T.R05, method: etp + " × " + j + " × " + st + " % = " + fr(etp * j * st / 100) + " jours facturés ; × " + fr(tjm) + " € = " + fr(ans, 2) + " M€",
      traps: [{ v: etp * j * tjm / 1e6, code: "E03", msg: "Les jours disponibles ne sont pas tous facturés : applique le staffing." }] };
  };
  G.C05 = function (r) {
    if (r.f() < 0.5) { var M = r.p([1.2, 2.5, 4, 6, 8]), s = r.p([4, 6, 8, 12, 15, 20]), X = rd(M * 1000 * s / 100, 6);
      return { p: { M: M, X: X }, q: "Marché de " + fr(M) + " Md€, notre CA : " + fr(X) + " M€. Part de marché ?", ans: s, unit: "%", tol: T.P01,
        method: fr(M) + " Md€ = " + fr(M * 1000) + " M€ ; " + fr(X) + " ÷ " + fr(M * 1000) + " = " + s + " %",
        traps: [{ v: s / 1000, code: "E05", msg: "Md€ et M€ non convertis : facteur 1 000." }, { v: s * 1000, code: "E05", msg: "Md€ et M€ non convertis : facteur 1 000." }] }; }
    var us = r.p([12, 18, 24, 30, 35]), comp = r.p([8, 12, 15, 20, 30]), rel = us / comp;
    return { p: { us: us, comp: comp }, q: "Nous avons " + us + " % du marché, notre premier concurrent " + comp + " %. Part de marché relative ?", ans: rel, unit: "ratio", tol: T.D01,
      method: us + " ÷ " + comp + " = " + fr(rel, 2) + (rel > 1 ? " (> 1 : nous sommes leader)" : " (< 1 : nous ne sommes pas leader)") };
  };
  G.C06 = function (r) {
    var w = r.p([50, 60, 70, 75]), p1 = r.p([10, 20, 30]), p2 = p1 + r.p([20, 30, 40]), m1 = r.p([10, 15, 20]), m2 = m1 + r.p([10, 15, 20]);
    var ca1 = w / 100 * p1, ca2 = (1 - w / 100) * p2, asp = ca1 + ca2, mg = (ca1 * m1 + ca2 * m2) / asp;
    if (r.f() < 0.3) return { p: { w: w, p1: p1, p2: p2 }, q: w + " % des unités vendues à " + p1 + " €, le reste à " + p2 + " €. Prix moyen (ASP) ?", ans: asp, unit: "€", tol: T.EX,
      method: w + " % × " + p1 + " + " + (100 - w) + " % × " + p2 + " = " + fr(ca1) + " + " + fr(ca2) + " = " + fr(asp) + " €",
      traps: [{ v: (p1 + p2) / 2, code: "E03", msg: "Moyenne simple : il faut pondérer par les unités." }] };
    return { p: { w: w, p1: p1, p2: p2, m1: m1, m2: m2 }, q: w + " % des unités vendues à " + p1 + " € (marge " + m1 + " %), le reste à " + p2 + " € (marge " + m2 + " %). Marge globale ?",
      ans: mg, unit: "%", tol: T.P01, method: "CA par unité moyenne : " + fr(ca1) + " + " + fr(ca2) + " = " + fr(asp) + " € ; profit : " + fr(ca1 * m1 / 100) + " + " + fr(ca2 * m2 / 100) + " = " + fr((ca1 * m1 + ca2 * m2) / 100) + " € ; marge = " + fr(mg, 2) + " %",
      traps: [{ v: (m1 + m2) / 2, code: "E03", msg: "Moyenne simple des marges : il faut pondérer par le CA." }, { v: (w * m1 + (100 - w) * m2) / 100, code: "E03", msg: "Pondération par les unités : la marge % se pondère par le CA." }] };
  };
  G.C07 = function (r) {
    var a = r.p([40, 80, 120, 200]), r1 = r.p([25, 37.5, 50]), r2 = r.p([10, 20, 25]);
    var b = a * r1 / 100, c = b * r2 / 100, tot = c / a * 100;
    if (r.f() < 0.5) return { p: { a: a, b: b, c: c }, q: fr(a) + " k visiteurs → " + fr(b) + " k leads → " + fr(c) + " k clients. Taux de conversion leads → clients ?", ans: r2, unit: "%", tol: T.P01,
      method: fr(c) + " ÷ " + fr(b) + " = " + fr(r2, 2) + " %", traps: [{ v: tot, code: "E03", msg: "Tu as donné le taux total, pas le taux d'étape (dénominateur = leads)." }] };
    return { p: { a: a, r1: r1, r2: r2 }, q: fr(a) + " k visiteurs, " + fr(r1) + " % deviennent leads, puis " + fr(r2) + " % des leads deviennent clients. Taux de conversion total ?", ans: tot, unit: "%", tol: T.P01,
      method: fr(r1) + " % × " + fr(r2) + " % = " + fr(tot, 2) + " %" };
  };
  G.C08 = function (r) {
    var g = r.p([5, 10, 15, 20]), n = r.p([2, 3, 5]), S = r.p([100, 200, 400]), E = S * Math.pow(1 + g / 100, n);
    if (r.f() < 0.5) { var E1 = rd(E, 1), base = Math.round(E1 / (S / 10)) * (S / 10), rest = rd(E1 - base, 1);
      var rl = fr(E1, 1) + " ÷ " + S + " ≈ " + MENTAL.c2(E1 / S) + " : " + fr(base) + " ÷ " + S + " = " + fr(base / S) + (Math.abs(rest) > 0 ? ", et " + fr(Math.abs(rest), 1) + " ÷ " + S + " ≈ " + MENTAL.c2(Math.abs(rest) / S) + " de " + (rest > 0 ? "plus" : "moins") + " (inutile d'aller plus loin)" : "");
      var mc = MENTAL.root(E1 / S, n, rl, "le CAGR");
      return { p: { S: S, E: E1, n: n }, q: "Un marché passe de " + S + " à " + fr(E1, 1) + " M€ en " + n + " ans. CAGR ?", ans: FIN.cagr(S, E1, n) * 100, unit: "%", tol: T.P05, rule: mc.rule, steps: mc.steps,
      method: fr(E1, 1) + " ÷ " + S + " = " + fr(E / S, 3) + " ; CAGR = " + fr(E / S, 3) + "^(1/" + n + ") − 1 ≈ " + g + " %",
      traps: [{ v: (E / S - 1) / n * 100, code: "E01", msg: "Croissance totale ÷ n surestime le CAGR : il faut la racine n-ième." }] }; }
    return { p: { S: S, g: g, n: n }, q: "CA de " + S + " M€, croissance de " + g + " % par an pendant " + n + " ans. CA final ?", ans: E, unit: "M€", tol: T.R1,
      rule: "On compose : chaque année on ajoute " + g + " % du montant précédent. On arrondit à 2 décimales en route, c'est assez précis pour un case.",
      steps: (function () { var ps = MENTAL.powSteps(g, n), f = ps.final; return ps.concat([S + " × " + MENTAL.c2(f) + " ≈ " + fr(Math.round(S * f)) + " M€ (exact : " + fr(E, 1) + ")"]); })(),
      method: S + " × " + fr(1 + g / 100) + "^" + n + " = " + S + " × " + fr(Math.pow(1 + g / 100, n), 4) + " = " + fr(E, 1) + " M€",
      traps: [{ v: S * (1 + g * n / 100), code: "E04", msg: "Croissance simple au lieu de composée." }] };
  };
  G.C09 = function (r) {
    var p = r.p([5, 8, 10, 15, 20]), v = r.p([-5, -10, -15, -20, 10]), ans = ((1 + p / 100) * (1 + v / 100) - 1) * 100;
    return { p: { p: p, v: v }, q: "Prix +" + p + " %, volumes " + (v > 0 ? "+" : "") + v + " %. Variation du CA ?", ans: ans, unit: "%", tol: T.P01,
      method: p + " + (" + v + ") + " + p + " × " + v + " ÷ 100 = " + fr(p + v) + " " + (p * v < 0 ? "− " : "+ ") + fr(Math.abs(p * v / 100)) + " = " + fr(ans, 2) + " %",
      traps: [{ v: p + v, code: "E04", msg: "Il manque le terme croisé prix × volume." }] };
  };
  G.C10 = function (r) {
    if (r.f() < 0.6) { var n0 = r.p([100, 200, 50, 400]), c = r.p([2, 5, 8, 10]), nw = r.p([5, 10, 12, 20]); var fin = n0 - n0 * c / 100 + nw;
      return { p: { n0: n0, c: c, nw: nw }, q: fr(n0) + " k clients en début de mois ; " + c + " % partent ; " + nw + " k nouveaux arrivent. Parc final ?", ans: fin, unit: "k clients", tol: T.EX,
        method: fr(n0) + " − " + fr(n0 * c / 100) + " + " + nw + " = " + fr(fin) + " k (churn appliqué au stock de départ)" }; }
    var c2 = r.p([2, 5, 10]), n = r.p([3, 6, 12]), ret = Math.pow(1 - c2 / 100, n) * 100;
    return { p: { c: c2, n: n }, q: "Churn de " + c2 + " % par mois. Part d'une cohorte encore cliente après " + n + " mois ?", ans: ret, unit: "%", tol: T.P05,
      method: "(1 − " + fr(c2 / 100) + ")^" + n + " = " + fr(ret, 1) + " %", traps: [{ v: 100 - c2 * n, code: "E04", msg: "Le churn s'applique au parc restant : rétention composée." }] };
  };
  G.C11 = function (r) {
    var gmv = r.p([200, 500, 800, 1200]), tr = r.p([8, 12, 15, 20]), ans = gmv * tr / 100;
    return { p: { gmv: gmv, tr: tr }, q: "Une marketplace traite " + fr(gmv) + " M€ de volume d'affaires (GMV) avec un take rate de " + tr + " %. CA de la plateforme ?", ans: ans, unit: "M€", tol: T.EX,
      method: fr(gmv) + " × " + tr + " % = " + fr(ans) + " M€ (le GMV n'est pas le CA)", traps: [{ v: gmv, code: "E03", msg: "Le GMV n'est pas le CA de la plateforme." }] };
  };
  G.C12 = function (r) {
    if (r.f() < 0.5) { var sp = r.p([2, 3, 4.5, 6]), nc = r.p([10, 15, 20, 30]), cac = sp * 1e6 / (nc * 1000);
      return { p: { sp: sp, nc: nc }, q: "Budget d'acquisition " + fr(sp) + " M€ pour " + nc + " k nouveaux clients. CAC ?", ans: cac, unit: "€", tol: T.R05, method: fr(sp) + " M€ ÷ " + nc + " k = " + fr(cac) + " €" }; }
    var arpu = r.p([120, 240, 360]), m = r.p([40, 50, 60]), ch = r.p([10, 20, 25]), ltv = arpu * m / 100 / (ch / 100);
    return { p: { arpu: arpu, m: m, ch: ch }, q: "Revenu annuel par client " + arpu + " €, marge de contribution " + m + " %, churn annuel " + ch + " %. LTV (sans actualisation) ?", ans: ltv, unit: "€", tol: T.R05,
      method: arpu + " × " + m + " % = " + fr(arpu * m / 100) + " € de contribution ; ÷ " + ch + " % = " + fr(ltv) + " €", traps: [{ v: arpu / (ch / 100), code: "E03", msg: "La LTV se calcule sur la contribution, pas sur le CA." }] };
  };
  G.C13 = function (r) {
    var ca = r.p([50, 80, 120, 200]), cogs = r.p([40, 50, 55, 60]), opex = r.p([15, 20, 25]), da = r.p([3, 5, 8]);
    var mb = ca * (1 - cogs / 100), ebitda = mb - ca * opex / 100, ebit = ebitda - ca * da / 100;
    if (r.f() < 0.5) return { p: { ca: ca, cogs: cogs, opex: opex, da: da }, q: "CA " + ca + " M€, COGS " + cogs + " % du CA, opex " + opex + " % du CA, D&A " + da + " % du CA. EBIT ?", ans: ebit, unit: "M€", tol: T.R05,
      method: "MB = " + fr(mb) + " ; EBITDA = " + fr(mb) + " − " + fr(ca * opex / 100) + " = " + fr(ebitda) + " ; EBIT = " + fr(ebitda) + " − " + fr(ca * da / 100) + " = " + fr(ebit) + " M€", traps: [{ v: ebitda, code: "E01", msg: "Tu t'es arrêté à l'EBITDA : l'EBIT retire les D&A." }] };
    return { p: { ca: ca, cogs: cogs, opex: opex }, q: "CA " + ca + " M€, COGS " + cogs + " % du CA, opex " + opex + " % du CA. Marge d'EBITDA ?", ans: ebitda / ca * 100, unit: "%", tol: T.P01,
      method: "100 − " + cogs + " − " + opex + " = " + fr(ebitda / ca * 100) + " %" };
  };
  G.C14 = function (r) {
    var Q = r.p([10, 20, 50, 80]), P = r.p([20, 40, 60, 100]), v = rd(P * r.p([0.4, 0.5, 0.6, 0.7]), 2), F = r.p([100, 200, 300, 500]);
    var res = Q * (P - v) - F; // k unités × € = k€
    return { p: { Q: Q, P: P, v: v, F: F }, q: Q + " k unités vendues à " + P + " €, coût variable " + fr(v) + " € par unité, coûts fixes " + F + " k€. Résultat ?", ans: res, unit: "k€", tol: T.EX,
      method: "Contribution = " + Q + " × (" + P + " − " + fr(v) + ") = " + fr(Q * (P - v)) + " k€ ; − " + F + " = " + fr(res) + " k€" };
  };
  G.C15 = function (r) {
    var v = r.i(0, 2);
    if (v === 0) { var mu = r.p([20, 25, 50, 100]), mg = mu / (100 + mu) * 100;
      return { p: { mu: mu }, q: "Markup de " + mu + " % sur le coût. Marge sur le prix ?", ans: mg, unit: "%", tol: T.P01, method: mu + " ÷ (100 + " + mu + ") = " + fr(mg, 2) + " %",
        traps: [{ v: mu, code: "E03", msg: "Markup ≠ marge : la base change (coût vs prix)." }] }; }
    if (v === 1) { var c = r.p([30, 40, 60, 72, 90]), m = r.p([20, 25, 40, 50]), P = c / (1 - m / 100);
      return { p: { c: c, m: m }, q: "Coût " + c + " €, marge cible " + m + " % du prix. Prix de vente ?", ans: P, unit: "€", tol: T.R05, method: c + " ÷ (1 − " + fr(m / 100) + ") = " + fr(P, 2) + " €",
        traps: [{ v: c * (1 + m / 100), code: "E03", msg: "Tu as appliqué un markup : la marge se calcule sur le prix." }] }; }
    var mg2 = r.p([20, 25, 40, 50]), mu2 = mg2 / (100 - mg2) * 100;
    return { p: { mg: mg2 }, q: "Marge de " + mg2 + " % du prix. Markup équivalent sur le coût ?", ans: mu2, unit: "%", tol: T.P01, method: mg2 + " ÷ (100 − " + mg2 + ") = " + fr(mu2, 2) + " %" };
  };
  G.C16 = function (r) {
    var P = r.p([20, 40, 50, 80, 120]), v = rd(P * r.p([0.4, 0.5, 0.6, 0.75]), 2), q = r.p([2000, 5000, 8000, 12000]), F = (P - v) * q, tgt = r.f() < 0.3 ? r.p([20, 50, 100]) * 1000 : 0;
    var Q = FIN.breakeven(F + tgt, P, v);
    return { p: { F: F, P: P, v: v, tgt: tgt }, q: "Coûts fixes " + fr(F / 1000) + " k€, prix " + P + " €, coût variable " + fr(v) + " € par unité." + (tgt ? " Objectif de profit " + fr(tgt / 1000) + " k€. Volume nécessaire ?" : " Point mort ?"),
      ans: Q, unit: "unités", tol: T.R05, method: "Marge unitaire " + P + " − " + fr(v) + " = " + fr(P - v) + " € ; (" + fr(F) + (tgt ? " + " + fr(tgt) : "") + ") ÷ " + fr(P - v) + " = " + fr(Q, 0) + " unités",
      traps: [{ v: (F + tgt) / P, code: "E01", msg: "Il faut diviser par la marge unitaire, pas par le prix." }] };
  };
  G.C17 = function (r) {
    var P0 = r.p([50, 40, 100, 20]), v = rd(P0 * r.p([0.5, 0.6]), 2), P1 = rd(P0 * r.p([0.9, 0.95]), 2), Q0 = r.p([100, 200, 50]);
    var Q1 = Q0 * (P0 - v) / (P1 - v);
    return { p: { P0: P0, v: v, P1: P1, Q0: Q0 }, q: "Prix " + fr(P0) + " €, coût variable " + fr(v) + " €, volume " + Q0 + " k. Le prix baisse à " + fr(P1) + " €. Volume nécessaire pour garder la même contribution ?",
      ans: Q1, unit: "k unités", tol: T.R05, method: "Contribution = " + Q0 + " × " + fr(P0 - v) + " = " + fr(Q0 * (P0 - v)) + " k€ ; ÷ " + fr(P1 - v) + " = " + fr(Q1, 1) + " k (+" + fr((Q1 / Q0 - 1) * 100, 1) + " %)",
      traps: [{ v: Q0 * P0 / P1, code: "E03", msg: "Tu as maintenu le CA, pas la contribution." }] };
  };
  G.C18 = function (r) {
    if (r.f() < 0.5) { var dp = r.p([5, 10, 20]), dq = -r.p([5, 10, 15, 20, 30]), e = (dq) / dp;
      return { p: { dp: dp, dq: dq }, q: "Le prix augmente de " + dp + " % et les volumes baissent de " + (-dq) + " %. Élasticité prix ?", ans: e, unit: "", tol: T.D01, method: fr(dq) + " % ÷ " + dp + " % = " + fr(e, 2),
        traps: [{ v: -e, code: "E05", msg: "Signe : l'élasticité prix est négative quand les volumes baissent." }] }; }
    var eps = -r.p([0.5, 1, 1.5, 2]), dp2 = r.p([-10, -5, 5, 10]), Q0 = 100, Q1 = Q0 * (1 + eps * dp2 / 100);
    return { p: { eps: eps, dp: dp2 }, q: "Élasticité " + fr(eps) + ", prix " + (dp2 > 0 ? "+" : "") + dp2 + " %, volume initial 100 k. Nouveau volume ?", ans: Q1, unit: "k unités", tol: T.R05,
      method: "ΔQ = " + fr(eps) + " × " + dp2 + " % = " + fr(eps * dp2) + " % → " + fr(Q1) + " k" };
  };
  G.C19 = function (r) {
    var qa = r.p([60, 80]), qb = 100 - qa, pa = r.p([20, 30]), va = rd(pa * 0.6, 2), pb = r.p([50, 60]), vb = rd(pb * 0.5, 2), shift = r.p([10, 20]);
    var before = qa * (pa - va) + qb * (pb - vb), after = (qa - shift) * (pa - va) + (qb + shift) * (pb - vb);
    return { p: { qa: qa, qb: qb, pa: pa, va: va, pb: pb, vb: vb, shift: shift }, q: "Produit A : " + qa + " k unités, prix " + pa + " €, coût variable " + fr(va) + " €. Produit B : " + qb + " k unités, prix " + pb + " €, coût variable " + fr(vb) + " €. " + shift + " k unités passent de A à B (volume total inchangé). Variation de la contribution ?",
      ans: after - before, unit: "k€", tol: T.EX, method: "Marge unitaire A = " + fr(pa - va) + " €, B = " + fr(pb - vb) + " € ; " + shift + " k × (" + fr(pb - vb) + " − " + fr(pa - va) + ") = " + fr(after - before) + " k€",
      traps: [{ v: shift * (pb - pa), code: "E03", msg: "Effet mix sur le CA, pas sur la contribution." }] };
  };
  G.C20 = function (r) {
    var m = r.p([4, 6, 10]), h = r.p([8, 16, 24]), c = r.p([30, 40, 60]), d = r.p([250, 300]), u = r.p([75, 80, 85, 90]);
    var ans = m * h * c * d * u / 100 / 1e6;
    return { p: { m: m, h: h, c: c, d: d, u: u }, q: m + " machines, " + h + " h par jour, " + c + " pièces par heure, " + d + " jours par an, taux effectif " + u + " %. Capacité annuelle ?",
      ans: ans, unit: "M de pièces", tol: T.R05, method: m + " × " + h + " × " + c + " = " + fr(m * h * c) + " pièces/jour ; × " + d + " × " + u + " % = " + fr(ans, 3) + " M" };
  };
  G.C21 = function (r) {
    var a = r.p([100, 120, 150]), b = r.p([80, 90, 110, 130]), y = r.p([80, 90, 95]), dem = r.p([90, 100, 110]);
    var out = Math.min(a, b) * y / 100;
    return { p: { a: a, b: b, y: y }, q: "Étape 1 : " + a + " pièces/h ; étape 2 : " + b + " pièces/h ; rendement final " + y + " % après l'étape 2. Demande " + dem + " pièces bonnes/h. Combien de pièces bonnes livrables par heure ?",
      ans: out, unit: "pièces/h", tol: T.EX, method: "Goulot = min(" + a + ", " + b + ") = " + Math.min(a, b) + " ; × " + y + " % = " + fr(out) + " pièces bonnes/h" + (out < dem ? " (écart " + fr(dem - out) + "/h)" : ""),
      traps: [{ v: (a + b) / 2 * y / 100, code: "E03", msg: "Le goulot fixe le débit, pas la moyenne des capacités." }] };
  };
  G.C22 = function (r) {
    var ch = r.p([12000, 18000, 25000, 40000]), hj = r.p([7, 7.5, 8]), j = r.p([200, 210, 220]), prod = r.p([80, 85, 90]);
    var per = hj * j * prod / 100, ans = Math.ceil(ch / per);
    return { p: { ch: ch, hj: hj, j: j, prod: prod }, q: "Charge annuelle de " + fr(ch) + " heures. Un ETP travaille " + fr(hj) + " h/jour, " + j + " jours/an, dont " + prod + " % productifs. Combien d'ETP (personnes entières) ?",
      ans: ans, unit: "ETP", tol: T.EX, method: fr(hj) + " × " + j + " × " + prod + " % = " + fr(per) + " h productives ; " + fr(ch) + " ÷ " + fr(per) + " = " + fr(ch / per, 2) + " → " + ans + " (arrondi au supérieur)" };
  };
  G.C23 = function (r) {
    var Fa = r.p([200, 300, 500]), va = r.p([5, 8, 10]), Fb = r.p([0, 50]), vb = va + r.p([5, 10, 15]);
    var Q = (Fa - Fb) / (vb - va);
    return { p: { Fa: Fa, va: va, Fb: Fb, vb: vb }, q: "Fabriquer : " + Fa + " k€ de fixes + " + va + " € par unité. Acheter : " + Fb + " k€ de fixes + " + vb + " € par unité. Seuil de volume où les deux coûtent pareil ?",
      ans: Q, unit: "k unités", tol: T.R05, method: "(" + Fa + " − " + Fb + ") ÷ (" + vb + " − " + va + ") = " + fr(Q, 2) + " k unités" };
  };
  G.C24 = function (r) {
    var th = r.p([20, 40, 50, 120]), lt = r.p([2, 3, 5, 0.5]);
    return { p: { th: th, lt: lt }, q: "Un entrepôt expédie " + th + " commandes par heure ; une commande y reste " + fr(lt) + " h. Encours moyen ?", ans: th * lt, unit: "commandes", tol: T.EX, method: "WIP = " + th + " × " + fr(lt) + " = " + fr(th * lt) };
  };
  G.C25 = function (r) {
    var cost = r.p([100, 200, 500]), q = r.p([10, 20, 50]), sc = r.p([5, 10, 20]);
    var good = q * (1 - sc / 100), cpu = cost / good;
    return { p: { cost: cost, q: q, sc: sc }, q: "Coût engagé " + cost + " k€ pour " + q + " k unités lancées ; " + sc + " % de rebuts (sur les unités lancées). Coût par unité bonne ?", ans: cpu, unit: "€", tol: T.R05,
      method: q + " × (1 − " + sc + " %) = " + fr(good) + " k bonnes ; " + cost + " ÷ " + fr(good) + " = " + fr(cpu, 2) + " €", traps: [{ v: cost / q, code: "E03", msg: "Diviser par les unités bonnes, pas par les unités lancées." }] };
  };
  G.C26 = function (r) {
    if (r.f() < 0.4) { var I = r.p([2, 3, 4.5, 6]), s = r.p([0.5, 0.75, 1.2, 1.5]);
      return { p: { I: I, s: s }, q: "Investissement " + fr(I) + " M€, cash net constant " + fr(s) + " M€ par an. Payback ?", ans: I / s, unit: "années", tol: T.Y01, method: fr(I) + " ÷ " + fr(s) + " = " + fr(I / s, 2) + " ans" }; }
    var I2 = r.p([10, 12, 15]), f = [r.p([2, 3]), r.p([4, 5]), r.p([5, 6]), r.p([6, 7])], cum = -I2, t = 0, pb = NaN;
    for (var k = 0; k < f.length; k++) { var prev = cum; cum += f[k]; if (cum >= 0) { pb = k + (-prev) / f[k]; break; } }
    if (!isFinite(pb)) return G.C26(r);
    return { p: { I: I2, f: f }, q: "Investissement " + I2 + " M€ ; cash nets années 1 à 4 : " + f.join(" ; ") + " M€. Payback (interpolation linéaire dans l'année) ?", ans: pb, unit: "années", tol: T.Y01,
      cums: (function () { var c = -I2, o = []; f.forEach(function (x) { c += x; o.push(c); }); return o; })(),
      method: "Cumulés : " + (function () { var c = -I2, o = []; f.forEach(function (x) { c += x; o.push((c > 0 ? "+" : "") + fr(c)); }); return o.join(" ; "); })() + " → " + fr(pb, 2) + " ans" };
  };
  G.C27 = function (r) {
    var I = r.p([2, 4, 5, 8]), g = r.p([0.8, 1, 1.5, 2]), n = r.p([3, 5]), roi = (g * n - I) / I * 100;
    return { p: { I: I, g: g, n: n }, q: "Coût " + I + " M€, gains " + fr(g) + " M€ par an pendant " + n + " ans. ROI sur la période ?", ans: roi, unit: "%", tol: T.P05,
      method: "(" + fr(g * n) + " − " + I + ") ÷ " + I + " = " + fr(roi, 1) + " %", traps: [{ v: (g - I) / I * 100, code: "E03", msg: "Le ROI se calcule sur les gains cumulés de l'horizon." }] };
  };
  G.C28 = function (r) {
    var ca = r.p([36.5, 73, 109.5, 182.5]), d0 = r.p([30, 45, 60]), d1 = d0 + r.p([15, 30, -15]);
    var dd = ca * (d1 - d0) / 365;
    return { p: { ca: ca, d0: d0, d1: d1 }, q: "CA annuel " + fr(ca) + " M€ ; le DSO passe de " + d0 + " à " + d1 + " jours. Variation des créances clients ?", ans: dd, unit: "M€", tol: T.R05,
      method: fr(ca) + " × " + (d1 - d0) + " ÷ 365 = " + fr(dd, 2) + " M€ (" + (dd > 0 ? "le BFR augmente : le cash baisse d'autant, ce n'est pas une perte" : "le BFR baisse : cash libéré") + ")",
      so: "Une hausse de BFR consomme du cash une fois, sans toucher l'EBIT." };
  };
  G.C29 = function (r) {
    var ebit = r.p([10, 20, 30]), t = r.p([25, 30]), da = r.p([2, 4, 5]), cx = r.p([3, 5, 8]), db = r.p([1, 2, -1]);
    var cf = FIN.fcff(ebit, t / 100, da, cx, db);
    return { p: { ebit: ebit, t: t, da: da, cx: cx, db: db }, q: "EBIT " + ebit + " M€, impôt " + t + " %, D&A " + da + " M€, capex " + cx + " M€, variation de BFR " + (db > 0 ? "+" : "") + db + " M€. Cash flow ?", ans: cf, unit: "M€", tol: T.EX,
      method: ebit + " × (1 − " + t + " %) + " + da + " − " + cx + " − (" + db + ") = " + fr(cf, 2) + " M€", traps: [{ v: FIN.fcff(ebit, t / 100, da, cx, -db), code: "E05", msg: "Signe du BFR : une hausse consomme du cash." }] };
  };
  G.C30 = function (r) {
    var f = [-r.p([3, 4, 5]), r.p([1, 2]), -r.p([2, 3, 4]), r.p([3, 4]), r.p([4, 5, 6])], cum = 0, mn = 0;
    f.forEach(function (x) { cum += x; if (cum < mn) mn = cum; });
    return { p: { f: f }, q: "Cash flows annuels avant financement : " + f.join(" ; ") + " M€ (trésorerie initiale nulle). Besoin de financement ?", ans: -mn, unit: "M€", tol: T.EX,
      method: "Cash cumulé année par année : " + f.reduce(function (a, x) { a.push((a.length ? a[a.length - 1] : 0) + x); return a; }, []).map(fr).join(" / ") + " ; point le plus bas = " + fr(mn) + " M€ ; besoin de financement = " + fr(-mn) + " M€" };
  };
  G.C31 = function (r) {
    if (r.f() < 0.5) { var cf = r.p([2, 3, 4, 5]), rr = r.p([8, 10, 12]), g = r.p([0, 2, 3]);
      var kk = rr - g, gv = FIN.gordon(cf, rr / 100, g / 100);
      return { p: { cf: cf, r: rr, g: g }, q: "Flux de " + cf + " M€ dans un an, croissant de " + g + " % par an à perpétuité ; taux d'actualisation " + rr + " %. Valeur ?", ans: gv, unit: "M€", tol: T.R1,
        rule: "Perpétuité croissante : flux ÷ (taux − croissance). Diviser par un petit % revient à multiplier par son inverse.",
        steps: [rr + " % − " + g + " % = " + kk + " %", MENTAL.invRate(kk), cf + " × " + fr(Math.round(10000 / kk) / 100) + " ≈ " + fr(Math.round(cf * 10000 / kk) / 100) + " M€"],
        method: cf + " ÷ (" + rr + " % − " + g + " %) = " + fr(FIN.gordon(cf, rr / 100, g / 100), 2) + " M€" }; }
    var I = r.p([10, 20]), c1 = r.p([5, 6, 8]), c2 = r.p([8, 10]), c3 = r.p([8, 10, 12]), rr2 = r.p([10, 12]);
    var v = FIN.npv(rr2 / 100, [-I, c1, c2, c3]);
    var f1 = MENTAL.df(rr2, 1), f2 = MENTAL.df(rr2, 2), f3 = MENTAL.df(rr2, 3), vm = -I + c1 * f1 + c2 * f2 + c3 * f3;
    return { p: { I: I, c: [c1, c2, c3], r: rr2 }, q: "Investissement " + I + " M€ ; flux " + c1 + ", " + c2 + ", " + c3 + " M€ sur 3 ans ; taux " + rr2 + " %. VAN ?", ans: v, unit: "M€", tol: { abs: 0.3, label: "±0,3 M€" },
      rule: "On n'élève rien au carré : chaque flux est multiplié par un facteur d'actualisation à connaître.",
      steps: [MENTAL.dfLine(rr2, 3), c1 + " × " + MENTAL.c2(f1) + " ≈ " + MENTAL.c2(c1 * f1) + " ; " + c2 + " × " + MENTAL.c2(f2) + " ≈ " + MENTAL.c2(c2 * f2) + " ; " + c3 + " × " + MENTAL.c2(f3) + " ≈ " + MENTAL.c2(c3 * f3), "Somme des flux actualisés ≈ " + MENTAL.c2(vm + I) + " ; VAN ≈ " + MENTAL.c2(vm + I) + " − " + I + " ≈ " + MENTAL.c2(vm) + " M€ (exact " + fr(v, 2) + ")"],
      method: "−" + I + " + " + c1 + "/" + fr(1 + rr2 / 100) + " + " + c2 + "/" + fr(Math.pow(1 + rr2 / 100, 2), 4) + " + " + c3 + "/" + fr(Math.pow(1 + rr2 / 100, 3), 4) + " = " + fr(v, 2) + " M€" };
  };
  G.C32 = function (r) {
    var e = r.p([10, 15, 20, 25]), m = r.p([6, 7, 8, 10]), nd = r.p([20, 30, 50, -10]), ev = e * m;
    return { p: { e: e, m: m, nd: nd }, q: "EBITDA " + e + " M€, multiple " + m + "×, dette nette " + nd + " M€. Valeur des fonds propres ?", ans: FIN.equity(ev, nd), unit: "M€", tol: T.EX,
      method: "EV = " + e + " × " + m + " = " + ev + " ; equity = " + ev + " − (" + nd + ") = " + fr(ev - nd) + " M€", traps: [{ v: ev, code: "E01", msg: "C'est l'EV : il faut retirer la dette nette." }] };
  };
  G.C33 = function (r) {
    if (r.f() < 0.5) { var inv = r.p([40, 50, 80]), pro = inv * r.p([1.5, 2, 2.5, 3]);
      return { p: { inv: inv, pro: pro }, q: "Equity investie " + inv + " M€, produits de sortie " + fr(pro) + " M€. MOIC ?", ans: pro / inv, unit: "×", tol: T.D01, method: fr(pro) + " ÷ " + inv + " = " + fr(pro / inv, 2) + "×" }; }
    var s = r.p([5, 8, 10]), c = r.p([1, 2, 3]);
    return { p: { s: s, c: c }, q: "Synergies récurrentes " + s + " M€ par an ; coûts récurrents associés " + c + " M€ par an. Bénéfice récurrent net ?", ans: s - c, unit: "M€/an", tol: T.EX, method: s + " − " + c + " = " + (s - c) + " M€/an" };
  };
  G.C34 = function (r) {
    var p1 = r.p([20, 30, 40]), p2 = r.p([30, 40]), p3 = 100 - p1 - p2, v1 = r.p([-10, -5, 0]), v2 = r.p([10, 20]), v3 = r.p([40, 50, 60]);
    var e = (p1 * v1 + p2 * v2 + p3 * v3) / 100;
    return { p: { p: [p1, p2, p3], v: [v1, v2, v3] }, q: "Scénarios : " + p1 + " % → " + v1 + " M€ ; " + p2 + " % → " + v2 + " M€ ; " + p3 + " % → " + v3 + " M€. Valeur espérée ?", ans: e, unit: "M€", tol: T.EX,
      method: fr(p1 / 100) + " × " + v1 + " + " + fr(p2 / 100) + " × " + v2 + " + " + fr(p3 / 100) + " × " + v3 + " = " + fr(e) + " M€" };
  };
  G.C35 = function (r) {
    var Q = r.p([10, 20, 50]), v = r.p([12, 20, 30]), F = r.p([100, 200, 300]), tgt = r.p([0, 50, 100]);
    var P = v + (F + tgt) / Q;
    return { p: { Q: Q, v: v, F: F, tgt: tgt }, q: "Volume " + Q + " k unités, coût variable " + v + " €, fixes " + F + " k€. Prix minimum pour " + (tgt ? "un profit de " + tgt + " k€" : "ne pas perdre d'argent") + " ?", ans: P, unit: "€", tol: T.R05,
      method: v + " + (" + F + (tgt ? " + " + tgt : "") + ") ÷ " + Q + " = " + fr(P, 2) + " €" };
  };
  G.C36 = function (r) {
    var seg = ["Retail", "PME", "Grands comptes"], u0 = [r.p([100, 120, 150]), r.p([40, 50, 60]), r.p([5, 8, 10])], p = [r.p([20, 25]), r.p([200, 250]), r.p([2000, 2500])];
    var g = [r.p([-5, 0, 5]), r.p([10, 15, 20]), r.p([20, 30])], u1 = u0.map(function (u, i) { return u * (1 + g[i] / 100); });
    var ca0 = u0.reduce(function (a, u, i) { return a + u * p[i]; }, 0), ca1 = u1.reduce(function (a, u, i) { return a + u * p[i]; }, 0);
    var growth = (ca1 / ca0 - 1) * 100;
    var rows = seg.map(function (s, i) { return [s, fr(u0[i]), fr(u1[i], 1), fr(p[i])]; });
    return { p: { u0: u0, u1: u1, p: p }, table: { head: ["Segment", "Clients N (k)", "Clients N+1 (k)", "Prix annuel (€)"], rows: rows },
      q: "Lis le tableau. Croissance du CA total entre N et N+1 (prix constants) ?", ans: growth, unit: "%", tol: T.P02,
      method: "CA N = " + u0.map(function (u, i) { return fr(u) + " × " + fr(p[i]); }).join(" + ") + " = " + fr(ca0) + " k€ ; CA N+1 = " + fr(ca1, 1) + " k€ ; croissance " + fr(growth, 2) + " %",
      traps: [{ v: (u1.reduce(function (a, b) { return a + b; }, 0) / u0.reduce(function (a, b) { return a + b; }, 0) - 1) * 100, code: "E03", msg: "Croissance en nombre de clients, pas en valeur : la base est le CA." }],
      so: "Le mix vers les grands comptes tire la croissance en valeur." };
  };
  G.C37 = function (r) {
    var M = r.p([500, 800, 1200]), a = rd(M * r.p([0.2, 0.25, 0.3]), 0), b = rd(M * r.p([0.15, 0.1]), 0), c = rd(M * 0.4, 0);
    var opts = [
      "Le marché vaut " + M + " M€ ; A pèse " + a + " M€, soit " + fr(a / M * 100, 0) + " %.",
      "B réalise " + b + " M€, soit " + fr(b / M * 100, 0) + " % du marché.",
      "Les autres acteurs pèsent " + fr(M - a - b) + " M€."
    ];
    var bad = "C réalise " + fr(c + M - a - b, 0) + " M€ en plus de A et B sur ce même marché.";
    var pos = r.i(0, 3); opts.splice(pos, 0, bad);
    return { p: { M: M, a: a, b: b, pos: pos }, type: "mcq", options: opts, ans: pos, unit: "", tol: T.EX, q: "Laquelle de ces affirmations est impossible ?",
      method: "A + B + C dépasserait " + M + " M€ : la somme des parts excède le marché (" + fr(a + b + c + M - a - b) + " > " + M + ")." };
  };

  // --- D ---
  G.D01 = function (r) {
    var eq = r.p([100, 120, 200, 300]), debt = r.p([40, 60, 80]), cash = r.p([10, 20, 30, 100]), mi = r.p([0, 5, 10]), nonop = r.p([0, 5]);
    var nd = debt - cash, ev = FIN.ev(eq, nd, mi, 0, nonop);
    return { p: { eq: eq, debt: debt, cash: cash, mi: mi, nonop: nonop }, q: "Equity " + eq + " M€, dette financière " + debt + " M€, cash " + cash + " M€, minoritaires " + mi + " M€, actifs non opérationnels " + nonop + " M€. EV ?",
      ans: ev, unit: "M€", tol: T.EX, method: "Dette nette = " + debt + " − " + cash + " = " + nd + " ; EV = " + eq + " + " + nd + " + " + mi + " − " + nonop + " = " + fr(ev) + " M€",
      traps: [{ v: ev - cash, code: "E03", msg: "Cash déduit deux fois." }] };
  };
  G.D02 = function (r) {
    var ev = r.p([150, 160, 200, 250]), debt = r.p([30, 50, 70]), cash = r.p([10, 20, 90]), mi = r.p([0, 10]), pf = r.p([0, 5]);
    var nd = debt - cash, eq = FIN.equity(ev, nd, mi, pf, 0);
    return { p: { ev: ev, debt: debt, cash: cash, mi: mi, pf: pf }, q: "EV " + ev + " M€, dette " + debt + " M€, cash " + cash + " M€, minoritaires " + mi + " M€, préférentielles " + pf + " M€. Equity ordinaire ?",
      ans: eq, unit: "M€", tol: T.EX, method: "Dette nette = " + nd + " ; equity = " + ev + " − (" + nd + ") − " + mi + " − " + pf + " = " + fr(eq) + " M€" + (nd < 0 ? " (dette nette négative : l'equity dépasse l'EV)" : ""),
      traps: [{ v: ev - debt - mi - pf, code: "E03", msg: "Le cash vient en réduction de la dette." }] };
  };
  G.D03 = function (r) {
    if (r.f() < 0.5) { var e = r.p([12, 20, 25, 35]), m = r.p([6, 7.5, 8, 9]);
      return { p: { e: e, m: m }, q: "EBITDA normalisé " + e + " M€, multiple EV/EBITDA " + fr(m) + "×. EV ?", ans: e * m, unit: "M€", scale: "eur", tol: T.EX, method: e + " × " + fr(m) + " = " + fr(e * m) + " M€" }; }
    var ev = r.p([200, 240, 300, 360]), m2 = r.p([8, 10, 12]);
    return { p: { ev: ev, m: m2 }, q: "Pour justifier une EV de " + ev + " M€ à " + m2 + "× l'EBITDA, quel EBITDA faut-il ?", ans: ev / m2, unit: "M€", tol: T.R05, method: ev + " ÷ " + m2 + " = " + fr(ev / m2, 2) + " M€" };
  };
  G.D04 = function (r) {
    var ms = [r.p([6, 6.5]), r.p([7, 7.5]), r.p([8, 8.5]), r.p([9, 9.5]), r.p([14, 15])], e = r.p([10, 15, 20]);
    var s = ms.slice().sort(function (a, b) { return a - b; }), med = s[2];
    return { p: { ms: ms, e: e }, q: "Multiples EV/EBITDA de 5 comparables : " + ms.map(function (x) { return fr(x); }).join(" ; ") + ". EBITDA cible " + e + " M€. EV par la médiane ?", ans: med * e, unit: "M€", tol: T.EX,
      method: "Médiane = " + fr(med) + "× (la moyenne, " + fr(ms.reduce(function (a, b) { return a + b; }, 0) / 5, 2) + "×, est tirée par l'extrême) ; " + fr(med) + " × " + e + " = " + fr(med * e) + " M€",
      traps: [{ v: ms.reduce(function (a, b) { return a + b; }, 0) / 5 * e, code: "E03", msg: "Moyenne au lieu de la médiane demandée." }] };
  };
  G.D05 = function (r) {
    var c = r.p([20, 25, 40, 50]), pr = r.p([20, 25, 30, 40]), off = c * (1 + pr / 100);
    return { p: { c: c, off: off }, q: "Cours préannonce " + c + " €, prix offert " + fr(off) + " € par action. Prime ?", ans: pr, unit: "%", tol: T.P01, method: "(" + fr(off) + " − " + c + ") ÷ " + c + " = " + pr + " %",
      traps: [{ v: (off - c) / off * 100, code: "E03", msg: "La prime se calcule sur le cours préannonce, pas sur le prix offert." }] };
  };
  G.D06 = function (r) {
    var ca1 = r.p([80, 100, 120]), m1 = r.p([10, 15]), ca2 = r.p([40, 60, 80]), m2 = r.p([20, 25, 5]);
    var e = ca1 * m1 / 100 + ca2 * m2 / 100, mg = e / (ca1 + ca2) * 100;
    return { p: { ca1: ca1, m1: m1, ca2: ca2, m2: m2 }, q: "Société A : CA " + ca1 + " M€, marge EBITDA " + m1 + " %. Société B : CA " + ca2 + " M€, marge " + m2 + " %. Marge EBITDA combinée (avant synergies) ?", ans: mg, unit: "%", tol: T.P01,
      method: "EBITDA = " + fr(ca1 * m1 / 100) + " + " + fr(ca2 * m2 / 100) + " = " + fr(e) + " M€ ; ÷ " + (ca1 + ca2) + " = " + fr(mg, 2) + " %",
      traps: [{ v: (m1 + m2) / 2, code: "E03", msg: "Moyenne simple : pondérer par le CA." }] };
  };
  G.D07 = function (r) {
    var sa = r.p([100, 150, 200]), syn = r.p([20, 32, 40]), saf = r.p([0, 5, 10]);
    return { p: { sa: sa, syn: syn, saf: saf }, q: "EV standalone de la cible " + sa + " M€, VAN des synergies nettes " + syn + " M€, marge de sécurité exigée " + saf + " M€. EV maximum payable ?", ans: sa + syn - saf, unit: "M€", tol: T.EX,
      method: sa + " + " + syn + " − " + saf + " = " + (sa + syn - saf) + " M€ (comparer EV avec EV ; retirer la dette nette pour le prix des titres)" };
  };
  G.D08 = function (r) {
    var sa = r.p([100, 150]), syn = r.p([20, 30, 40]), paid = sa + r.p([5, 15, 25, 45]), fees = r.p([2, 3, 5]);
    var v = sa + syn - paid - fees;
    return { p: { sa: sa, syn: syn, paid: paid, fees: fees }, q: "EV standalone " + sa + " M€, VAN synergies nettes " + syn + " M€, EV payée " + paid + " M€, frais non inclus " + fees + " M€. Valeur créée pour l'acheteur ?", ans: v, unit: "M€", tol: T.EX,
      method: sa + " + " + syn + " − " + paid + " − " + fees + " = " + fr(v) + " M€" + (v < 0 ? " (destruction de valeur)" : "") };
  };
  G.D09 = function (r) { var o = G.C29(r); o.q = o.q.replace("Cash flow ?", "FCFF ?"); return o; };
  G.D10 = function (r) {
    var c1 = r.p([10, 12, 15]), c2 = r.p([12, 15, 18]), tv = r.p([120, 150, 200]), w = r.p([8, 10, 12]), nd = r.p([20, 30, 40]);
    var ev = c1 / (1 + w / 100) + (c2 + tv) / Math.pow(1 + w / 100, 2);
    var askEq = r.f() < 0.5;
    return { p: { c1: c1, c2: c2, tv: tv, w: w, nd: nd }, q: "FCFF année 1 : " + c1 + " M€ ; année 2 : " + c2 + " M€ ; valeur terminale fin d'année 2 : " + tv + " M€ ; WACC " + w + " %." + (askEq ? " Dette nette " + nd + " M€. Equity ?" : " EV ?"),
      ans: askEq ? ev - nd : ev, unit: "M€", tol: T.R1,
      rule: "On n'élève rien au carré : on multiplie chaque flux par son facteur d'actualisation, et la valeur terminale est actualisée avec le flux de la même année.",
      steps: (function () { var a1 = MENTAL.df(w, 1), a2 = MENTAL.df(w, 2), v1 = c1 * a1, v2 = (c2 + tv) * a2, st = [MENTAL.dfLine(w, 2), "Année 1 : " + c1 + " × " + MENTAL.c2(a1) + " ≈ " + fr(Math.round(v1 * 10) / 10), "Année 2 : (" + c2 + " + " + tv + ") × " + MENTAL.c2(a2) + " = " + (c2 + tv) + " × " + MENTAL.c2(a2) + " ≈ " + fr(Math.round(v2 * 10) / 10), "EV ≈ " + fr(Math.round((v1 + v2) * 10) / 10) + " M€ (exact " + fr(ev, 1) + ")"]; if (askEq) st.push("Equity ≈ EV − dette nette ≈ " + fr(Math.round((v1 + v2 - nd) * 10) / 10) + " M€"); return st; })(),
      method: c1 + "/" + fr(1 + w / 100) + " + (" + c2 + " + " + tv + ")/" + fr(Math.pow(1 + w / 100, 2), 4) + " = " + fr(ev, 2) + " M€" + (askEq ? " ; − " + nd + " = " + fr(ev - nd, 2) + " M€" : ""),
      traps: [{ v: c1 / (1 + w / 100) + c2 / Math.pow(1 + w / 100, 2) + tv, code: "E01", msg: "La valeur terminale doit être actualisée." }] };
  };
  G.D11 = function (r) {
    var cs = r.p([2, 3, 4]), rv = r.p([8, 10, 12]), ct = r.p([20, 25, 30]), ds = r.p([0, 1]);
    var e = cs + rv * ct / 100 - ds;
    return { p: { cs: cs, rv: rv, ct: ct, ds: ds }, q: "Économies de coûts " + cs + " M€ ; revenus additionnels " + rv + " M€ à " + ct + " % de contribution ; désynergies " + ds + " M€. Synergies d'EBITDA récurrentes ?", ans: e, unit: "M€", tol: T.EX,
      method: cs + " + " + rv + " × " + ct + " % − " + ds + " = " + fr(e) + " M€", traps: [{ v: cs + rv - ds, code: "E03", msg: "Les revenus additionnels comptent par leur contribution, pas en CA." }] };
  };
  G.D12 = function (r) {
    var f = r.p([3.6, 2.7, 4.5]), rr = r.p([9, 10, 12]), ic = r.p([5, 8, 10]);
    var v = f / (rr / 100) - ic;
    return { p: { f: f, r: rr, ic: ic }, q: "FCF incrémental des synergies après impôt " + fr(f) + " M€/an à perpétuité, sans croissance ; taux " + rr + " % ; coût d'intégration cash " + ic + " M€ aujourd'hui. VAN nette des synergies ?", ans: v, unit: "M€", tol: T.R05,
      method: fr(f) + " ÷ " + rr + " % = " + fr(f / (rr / 100), 2) + " ; − " + ic + " = " + fr(v, 2) + " M€" };
  };
  G.D13 = function (r) {
    var E = r.p([60, 70, 80]), D = 100 - E, ke = r.p([10, 12]), kd = r.p([4, 5, 6]), t = r.p([25, 30]);
    var w = FIN.wacc(E, D, ke / 100, kd / 100, t / 100) * 100;
    return { p: { E: E, D: D, ke: ke, kd: kd, t: t }, q: "Fonds propres " + E + " %, dette " + D + " % ; Ke " + ke + " %, Kd " + kd + " %, impôt " + t + " %. WACC ?", ans: w, unit: "%", tol: T.P01,
      method: fr(E / 100) + " × " + ke + " + " + fr(D / 100) + " × " + kd + " × (1 − " + fr(t / 100) + ") = " + fr(w, 2) + " %", traps: [{ v: (E * ke + D * kd) / 100, code: "E01", msg: "Le coût de la dette se prend après impôt." }] };
  };
  G.D14 = function (r) {
    var ni = r.p([100, 120]), sh = r.p([50, 60]), tni = r.p([10, 20]), debt = r.p([100, 200]), kd = r.p([4, 5]), t = 25;
    var eps0 = ni / sh, nipf = ni + tni - debt * kd / 100 * (1 - t / 100), acc = (nipf / sh / eps0 - 1) * 100;
    return { p: { ni: ni, sh: sh, tni: tni, debt: debt, kd: kd }, q: "Acheteur : résultat net " + ni + " M€, " + sh + " M d'actions. Cible : résultat net " + tni + " M€, achetée " + debt + " M€ entièrement financés par dette à " + kd + " % (impôt 25 %). Accrétion du BPA ?", ans: acc, unit: "%", tol: T.P02,
      method: "Intérêts après impôt = " + debt + " × " + kd + " % × 0,75 = " + fr(debt * kd / 100 * 0.75, 2) + " ; RN pro forma = " + fr(nipf, 2) + " ; BPA " + fr(eps0, 3) + " → " + fr(nipf / sh, 3) + " (" + fr(acc, 2) + " %)" };
  };
  G.D15 = function (r) {
    if (r.f() < 0.5) { var m = r.p([2, 2.5, 3]), n = r.p([4, 5]), irr = FIN.irrFromMoic(m, n) * 100;
      var md = MENTAL.root(m, n, "MOIC = " + fr(m) + " : il faut le taux g tel que (1 + g)^" + n + " = " + fr(m), "le TRI");
      return { p: { m: m, n: n }, q: "MOIC de " + fr(m) + "× en " + n + " ans, sans flux intermédiaires. TRI ?", ans: irr, unit: "%", tol: T.P1, rule: md.rule, steps: md.steps,
        method: fr(m) + "^(1/" + n + ") − 1 = " + fr(irr, 1) + " % (repères : 2× en 5 ans ≈ 14,9 % ; 3× en 5 ans ≈ 24,6 %)", traps: [{ v: (m - 1) / n * 100, code: "E01", msg: "TRI simple (MOIC − 1) ÷ n : il faut la racine n-ième." }] }; }
    var inv = r.p([40, 44, 50]), ex = r.p([90, 115, 120]), div = r.p([0, 10]);
    return { p: { inv: inv, ex: ex, div: div }, q: "Equity investie " + inv + " M€ ; dividendes reçus " + div + " M€ ; equity de sortie " + ex + " M€. MOIC ?", ans: (ex + div) / inv, unit: "×", tol: T.D01,
      method: "(" + ex + " + " + div + ") ÷ " + inv + " = " + fr((ex + div) / inv, 2) + "×" };
  };
  G.D16 = function (r) {
    var e = r.p([10, 12, 15]), m = r.p([7, 8, 9]), fees = r.p([3, 4, 5]), dm = r.p([4, 5]);
    var uses = e * m + fees, debt = e * dm, eq = uses - debt;
    return { p: { e: e, m: m, fees: fees, dm: dm }, q: "Cible : EBITDA " + e + " M€, achetée " + m + "× (sans dette ni cash préalable), frais " + fees + " M€. Dette d'acquisition " + dm + "× l'EBITDA. Equity du sponsor ?", ans: eq, unit: "M€", tol: T.EX,
      method: "Emplois = " + e * m + " + " + fees + " = " + uses + " ; dette = " + debt + " ; equity = " + uses + " − " + debt + " = " + eq + " M€", traps: [{ v: e * m - debt, code: "E03", msg: "Les frais font partie des emplois." }] };
  };
  G.D17 = function (r) {
    var e = r.p([12, 15, 18]), m = r.p([7, 8, 9]), nd = r.p([10, 20, 30]);
    return { p: { e: e, m: m, nd: nd }, q: "À la sortie : EBITDA " + e + " M€, multiple " + m + "×, dette nette restante " + nd + " M€. Equity de sortie ?", ans: e * m - nd, unit: "M€", tol: T.EX, method: e + " × " + m + " = " + e * m + " ; − " + nd + " = " + (e * m - nd) + " M€" };
  };
  G.D18 = function (r) {
    var pro = r.p([100, 115, 150]), irr = r.p([15, 20, 25]), n = r.p([4, 5]);
    var eq = pro / Math.pow(1 + irr / 100, n);
    var cm = Math.round(Math.pow(1 + irr / 100, n) * 100) / 100;
    return { p: { pro: pro, irr: irr, n: n }, q: "Produits de sortie attendus " + pro + " M€ dans " + n + " ans, TRI cible " + irr + " %, sans flux intermédiaires. Equity maximum à investir ?", ans: eq, unit: "M€", tol: T.R2,
      rule: "L'equity investie doit être multipliée par (1 + TRI)ⁿ pour atteindre la sortie : on divise la sortie par ce multiple, pris dans les repères.",
      steps: [fr(1 + irr / 100) + MENTAL.pw(n) + " ≈ " + MENTAL.c2(cm) + " (repère : c'est le MOIC exigé)", pro + " ÷ " + MENTAL.c2(cm) + " ≈ " + fr(Math.round(pro / cm)) + " M€"],
      method: pro + " ÷ " + fr(1 + irr / 100) + "^" + n + " = " + pro + " ÷ " + fr(Math.pow(1 + irr / 100, n), 3) + " = " + fr(eq, 2) + " M€" };
  };
  G.D19 = function (r) {
    if (r.f() < 0.5) { var e = r.p([10, 20, 25]), lev = r.p([4, 5, 5.5]);
      return { p: { e: e, lev: lev }, q: "EBITDA " + e + " M€, levier maximum accepté par les banques " + fr(lev) + "×. Dette maximum ?", ans: e * lev, unit: "M€", tol: T.EX, method: e + " × " + fr(lev) + " = " + fr(e * lev) + " M€" }; }
    var d = r.p([40, 60, 80]), i = r.p([5, 6, 8]), e2 = r.p([12, 15, 20]), int = d * i / 100;
    return { p: { d: d, i: i, e: e2 }, q: "Dette " + d + " M€ au taux de " + i + " %, EBITDA " + e2 + " M€. Couverture des intérêts (EBITDA ÷ intérêts) ?", ans: e2 / int, unit: "×", tol: T.D01, method: "Intérêts = " + fr(int, 2) + " ; " + e2 + " ÷ " + fr(int, 2) + " = " + fr(e2 / int, 2) + "×" };
  };
  G.D20 = function (r) {
    var eq = r.p([120, 200, 300]), sh = r.p([10, 20, 25]), pct = r.p([30, 51, 60]);
    if (r.f() < 0.5) return { p: { eq: eq, sh: sh }, q: "Equity value " + eq + " M€, " + sh + " M d'actions diluées. Prix par action ?", ans: eq / sh, unit: "€", tol: T.EX, method: eq + " ÷ " + sh + " = " + fr(eq / sh, 2) + " €" };
    return { p: { eq: eq, pct: pct }, q: "Equity value à 100 % : " + eq + " M€. Chèque pour " + pct + " % au pro rata (sans prime) ?", ans: eq * pct / 100, unit: "M€", tol: T.EX, method: eq + " × " + pct + " % = " + fr(eq * pct / 100) + " M€" };
  };
  G.D21 = function (r) {
    var ev = r.p([100, 150, 200]), nd = r.p([20, 30]), bfr = r.p([12, 15, 18]), tgt = 15;
    var p = ev - nd + (bfr - tgt);
    return { p: { ev: ev, nd: nd, bfr: bfr, tgt: tgt }, q: "Prix cash-free / debt-free : EV " + ev + " M€, dette nette " + nd + " M€, BFR réel à la clôture " + bfr + " M€ pour un BFR cible de " + tgt + " M€. Prix des titres ?", ans: p, unit: "M€", tol: T.EX,
      method: ev + " − " + nd + " + (" + bfr + " − " + tgt + ") = " + p + " M€", traps: [{ v: ev - nd - (bfr - tgt), code: "E05", msg: "Signe : un BFR au-dessus de la cible augmente le prix." }] };
  };
  G.D22 = function (r) {
    var val = r.p([100, 150, 200]), px = r.p([20, 25, 40]), old = r.p([40, 50, 80]);
    var nw = val / px, dil = nw / (old + nw) * 100;
    return { p: { val: val, px: px, old: old }, q: "Contrepartie de " + val + " M€ payée en actions au cours de " + px + " € ; l'acheteur a " + old + " M d'actions. Dilution des anciens actionnaires (part des nouveaux titres) ?", ans: dil, unit: "%", tol: T.P01,
      method: "Titres émis = " + val + " ÷ " + px + " = " + fr(nw, 2) + " M ; " + fr(nw, 2) + " ÷ (" + old + " + " + fr(nw, 2) + ") = " + fr(dil, 2) + " %", traps: [{ v: nw / old * 100, code: "E03", msg: "La dilution se calcule sur le total pro forma." }] };
  };
  G.D23 = function (r) {
    var fix = r.p([80, 100]), p1 = r.p([30, 50, 60]), a1 = r.p([20, 30]), a2 = r.p([5, 10]), p2 = r.p([20, 30]);
    if (p1 + p2 > 100) p2 = 100 - p1;
    var e = fix + (p1 * a1 + p2 * a2) / 100;
    return { p: { fix: fix, p1: p1, a1: a1, p2: p2, a2: a2 }, q: "Prix fixe " + fix + " M€ + earn-out : " + a1 + " M€ avec " + p1 + " % de probabilité, " + a2 + " M€ avec " + p2 + " %, rien sinon (sans actualisation). Valeur attendue du prix ?", ans: e, unit: "M€", tol: T.EX,
      method: fix + " + " + fr(p1 / 100) + " × " + a1 + " + " + fr(p2 / 100) + " × " + a2 + " = " + fr(e) + " M€", traps: [{ v: fix + a1, code: "E03", msg: "Le maximum n'est pas la valeur attendue." }] };
  };

  // --- S ---
  G.S01 = function (r) {
    var rooms = r.p([100, 150, 200]), dh = r.p([120, 150]), oh = r.p([85, 90]), dl = 365 - dh, ol = r.p([40, 50, 55]), pr = r.p([100, 120, 150]);
    var rev = rooms * (dh * oh / 100 + dl * ol / 100) * pr / 1e6;
    return { p: { rooms: rooms, dh: dh, oh: oh, ol: ol, pr: pr }, q: "Hôtel de " + rooms + " chambres. Haute saison : " + dh + " jours à " + oh + " % d'occupation ; basse saison : le reste de l'année (365 jours) à " + ol + " %. Prix moyen " + pr + " €. CA annuel ?",
      ans: rev, unit: "M€", tol: T.R1, method: rooms + " × (" + dh + " × " + oh + " % + " + dl + " × " + ol + " %) = " + fr(rooms * (dh * oh / 100 + dl * ol / 100)) + " nuitées ; × " + pr + " € = " + fr(rev, 2) + " M€",
      traps: [{ v: rooms * 365 * (oh + ol) / 200 * pr / 1e6, code: "E03", msg: "Moyenne simple de deux saisons de durées inégales." }] };
  };
  G.S02 = function (r) {
    var mw = r.p([10, 20, 50]), lf = r.p([20, 25, 35]), pr = r.p([50, 60, 80]);
    var mwh = mw * 8760 * lf / 100, rev = mwh * pr / 1e6;
    return { p: { mw: mw, lf: lf, pr: pr }, q: "Parc solaire de " + mw + " MW, facteur de charge " + lf + " %, prix " + pr + " €/MWh. CA annuel ?", ans: rev, unit: "M€", tol: T.R1,
      method: mw + " × 8 760 h × " + lf + " % = " + fr(mwh) + " MWh ; × " + pr + " € = " + fr(rev, 2) + " M€", traps: [{ v: mw * 8760 * pr / 1e6, code: "E01", msg: "Facteur de charge oublié : la puissance n'est pas produite en permanence." }] };
  };
  G.S03 = function (r) {
    var t = r.p([200, 500, 1000]), km = r.p([300, 500, 800]), c = r.p([0.05, 0.08, 0.1]);
    var cost = t * km * c / 1000;
    return { p: { t: t, km: km, c: c }, q: t + " tonnes transportées sur " + km + " km, à " + fr(c) + " € par tonne-km. Coût du transport ?", ans: cost, unit: "k€", tol: T.EX, method: t + " × " + km + " × " + fr(c) + " = " + fr(t * km * c) + " € = " + fr(cost, 2) + " k€" };
  };
  G.S04 = function (r) {
    if (r.f() < 0.5) { var out = r.p([2, 5, 10]), nim = r.p([150, 180, 220]);
      return { p: { out: out, nim: nim }, q: "Encours de crédits " + out + " Md€, marge nette d'intérêt " + nim + " bps. Revenus d'intérêts nets annuels ?", ans: out * 1000 * nim / 10000, unit: "M€", tol: T.EX,
        method: fr(out * 1000) + " M€ × " + fr(nim / 100) + " % = " + fr(out * 1000 * nim / 10000) + " M€", traps: [{ v: out * 1000 * nim / 100, code: "E05", msg: "bps : 100 bps = 1 %, donc " + nim + " bps = " + fr(nim / 100) + " %." }] }; }
    var pr = r.p([100, 200]), cl = r.p([60, 65, 70]), fe = r.p([25, 30, 35]);
    return { p: { pr: pr, cl: cl, fe: fe }, q: "Primes acquises " + pr + " M€, sinistres " + fr(pr * cl / 100) + " M€, frais " + fr(pr * fe / 100) + " M€. Ratio combiné ?", ans: cl + fe, unit: "%", tol: T.P01,
      method: "(" + fr(pr * cl / 100) + " + " + fr(pr * fe / 100) + ") ÷ " + pr + " = " + (cl + fe) + " %" + (cl + fe > 100 ? " (perte technique)" : "") };
  };
  G.S05 = function (r) {
    var a0 = r.p([10, 20, 40]), fl = r.p([1, 2, -1]), pf = r.p([5, 8, -5]), fee = r.p([50, 75, 100]);
    var a1 = a0 + fl + a0 * pf / 100, avg = (a0 + a1) / 2, rev = avg * 1000 * fee / 10000;
    return { p: { a0: a0, fl: fl, pf: pf, fee: fee }, q: "Encours début d'année " + a0 + " Md€, collecte nette " + fl + " Md€, performance " + pf + " %. Frais de gestion " + fee + " bps sur l'encours moyen (moyenne début/fin). Revenus ?", ans: rev, unit: "M€", tol: T.R05,
      method: "Fin = " + a0 + " + " + fl + " + " + fr(a0 * pf / 100) + " = " + fr(a1) + " Md€ ; encours moyen = (" + a0 + " + " + fr(a1) + ") ÷ 2 = " + fr(avg, 2) + " Md€ ; " + fr(avg * 1000) + " M€ × " + fr(fee / 100) + " % = " + fr(rev, 2) + " M€", traps: [{ v: avg * 1000, code: "E03", msg: "L'encours géré n'est pas le CA." }] };
  };
  G.S06 = function (r) {
    var pop = r.p([60, 68]), prev = r.p([0.5, 1, 2]), dg = r.p([50, 60, 70]), tr = r.p([40, 50]), cost = r.p([2000, 5000, 10000]);
    var pts = pop * 1e6 * prev / 100 * dg / 100 * tr / 100, mk = pts * cost / 1e6;
    return { p: { pop: pop, prev: prev, dg: dg, tr: tr, cost: cost }, q: "Population " + pop + " M, prévalence " + fr(prev) + " %, " + dg + " % diagnostiqués, " + tr + " % des diagnostiqués traités, traitement " + fr(cost) + " € par patient et par an. Marché annuel ?", ans: mk, unit: "M€", tol: T.R1,
      method: pop + " M × " + fr(prev) + " % × " + dg + " % × " + tr + " % = " + fr(pts) + " patients ; × " + fr(cost) + " € = " + fr(mk, 1) + " M€" };
  };
  G.S07 = function (r) {
    var hc = r.p([1000, 2000, 5000]), a0 = r.p([15, 20]), a1 = a0 - r.p([3, 5]), rc = r.p([20, 30, 40]), prog = r.p([0.5, 1, 2]);
    var sav = hc * (a0 - a1) / 100 * rc / 1000 - prog;
    return { p: { hc: hc, a0: a0, a1: a1, rc: rc, prog: prog }, q: fr(hc) + " salariés ; l'attrition passe de " + a0 + " % à " + a1 + " %. Coût d'un remplacement " + rc + " k€ ; programme " + fr(prog) + " M€ par an. Économie nette annuelle ?", ans: sav, unit: "M€", tol: T.EX,
      method: fr(hc) + " × " + (a0 - a1) + " points = " + fr(hc * (a0 - a1) / 100) + " départs évités ; × " + rc + " k€ = " + fr(hc * (a0 - a1) / 100 * rc / 1000, 2) + " M€ ; − " + fr(prog) + " = " + fr(sav, 2) + " M€",
      traps: [{ v: hc * (a0 - a1) / 100 * rc / 1000, code: "E03", msg: "Économie brute : retire le coût du programme." }] };
  };
  G.S08 = function (r) {
    var fleet = r.p([2000, 5000, 8000]), occ = r.p([80, 90]), rent = r.p([300, 450, 600]);
    var rev = fleet * occ / 100 * rent * 12 / 1e6;
    return { p: { fleet: fleet, occ: occ, rent: rent }, q: "Flotte de " + fr(fleet) + " véhicules, " + occ + " % loués en moyenne, loyer " + rent + " € par mois. CA annuel ?", ans: rev, unit: "M€", tol: T.EX,
      method: fr(fleet) + " × " + occ + " % × " + rent + " € × 12 = " + fr(rev, 2) + " M€", traps: [{ v: fleet * occ / 100 * rent / 1e6, code: "E05", msg: "Loyer mensuel : multiplier par 12." }] };
  };
  G.S09 = function (r) {
    if (r.f() < 0.5) { var ttc = r.p([120, 240, 360]), tva = 20, rem = r.p([10, 15, 25]);
      var ht = ttc / 1.2, net = ht * (1 - rem / 100);
      return { p: { ttc: ttc, rem: rem }, q: "Prix catalogue " + ttc + " € TTC (TVA 20 %). Remise distributeur de " + rem + " % sur le HT. Prix net HT ?", ans: net, unit: "€", tol: T.R05,
        method: ttc + " ÷ 1,2 = " + fr(ht) + " € HT ; × (1 − " + rem + " %) = " + fr(net, 2) + " €", traps: [{ v: ttc * (1 - (rem + tva) / 100), code: "E04", msg: "Remise et TVA ne s'additionnent pas : diviser par 1,2 puis appliquer la remise." }] }; }
    var usd = r.p([10, 25, 40]), fx = r.p([0.9, 0.92, 1.1]);
    return { p: { usd: usd, fx: fx }, q: "CA de " + usd + " M$ ; 1 $ = " + fr(fx) + " €. CA en euros ?", ans: usd * fx, unit: "M€", tol: T.EX, method: usd + " × " + fr(fx) + " = " + fr(usd * fx, 2) + " M€" };
  };

  // ---------- chaînes (mode « Chaîne / mock quant ») ----------
  var CHAINS = [
    function (r) { // sizing → CA → contribution → payback
      var foyers = r.p([30]), pen = r.p([2, 4, 5]), sh = r.p([10, 20]), pr = r.p([100, 150, 200]), m = r.p([30, 40]), I = r.p([2, 3, 5]);
      var clients = foyers * 1e6 * pen / 100 * sh / 100, ca = clients * pr / 1e6, contrib = ca * m / 100, pb = I / contrib;
      return { title: "Lancement d'un abonnement", ctx: foyers + " M de foyers ; " + pen + " % sont intéressés ; tu vises " + sh + " % de ces foyers ; abonnement " + pr + " € par an ; marge de contribution " + m + " % ; investissement initial " + I + " M€.",
        steps: [
          { pid: "C01", q: "Nombre de clients visés ?", ans: clients / 1000, unit: "k clients", tol: T.EX, method: "30 M × " + pen + " % × " + sh + " % = " + fr(clients / 1000) + " k" },
          { pid: "C04", q: "CA annuel ?", ans: ca, unit: "M€", tol: T.R05, method: fr(clients / 1000) + " k × " + pr + " € = " + fr(ca, 2) + " M€" },
          { pid: "C14", q: "Contribution annuelle ?", ans: contrib, unit: "M€", tol: T.R05, method: fr(ca, 2) + " × " + m + " % = " + fr(contrib, 2) + " M€" },
          { pid: "C26", q: "Payback de l'investissement (années) ?", ans: pb, unit: "années", tol: T.Y01, method: I + " ÷ " + fr(contrib, 2) + " = " + fr(pb, 2) + " ans" }
        ], so: "Payback " + (pb <= 3 ? "court : le lancement se défend." : "long : il faut revoir prix, pénétration ou investissement.") };
    },
    function (r) { // LBO : entrée → sortie → MOIC → TRI (exemple du référentiel en variante)
      var e0 = r.p([10, 12]), m0 = r.p([8]), fees = r.p([4, 3]), debt = r.p([40, 48]), e1 = r.p([15, 18]), m1 = r.p([7, 9]), nd1 = r.p([20, 25]), n = 5;
      var eq0 = e0 * m0 + fees - debt, ev1 = e1 * m1, eq1 = ev1 - nd1, moic = eq1 / eq0, irr = FIN.irrFromMoic(moic, n) * 100;
      return { title: "LBO simplifié", ctx: "EBITDA " + e0 + " M€ acheté " + m0 + "× (sans dette ni cash préalable), frais " + fees + " M€, dette d'acquisition " + debt + " M€. Dans 5 ans : EBITDA " + e1 + " M€, multiple de sortie " + m1 + "×, dette nette " + nd1 + " M€. Pas de dividende.",
        steps: [
          { pid: "D16", q: "Equity investie par le sponsor ?", ans: eq0, unit: "M€", tol: T.EX, method: e0 * m0 + " + " + fees + " − " + debt + " = " + eq0 + " M€" },
          { pid: "D17", q: "Equity de sortie ?", ans: eq1, unit: "M€", tol: T.EX, method: e1 + " × " + m1 + " − " + nd1 + " = " + eq1 + " M€" },
          { pid: "D15", q: "MOIC ?", ans: moic, unit: "×", tol: T.D01, method: eq1 + " ÷ " + eq0 + " = " + fr(moic, 2) + "×" },
          (function () { var ml = MENTAL.root(moic, 5, "MOIC ≈ " + MENTAL.c2(moic) + " : il faut le taux g tel que (1 + g)⁵ = " + MENTAL.c2(moic), "le TRI");
            return { pid: "D15", q: "TRI ?", ans: irr, unit: "%", tol: T.P1, rule: ml.rule, steps: ml.steps, method: fr(moic, 2) + "^(1/5) − 1 = " + fr(irr, 1) + " %" }; })()
        ], so: "TRI " + fr(irr, 1) + " % : " + (irr >= 20 ? "au-dessus d'un seuil PE usuel de 20 %." : "sous un seuil PE usuel de 20 % ; le multiple de sortie est le levier critique.") };
    },
    function (r) { // funnel → clients → CA → CAC
      var vis = r.p([200, 400]), r1 = r.p([5, 10]), r2 = r.p([20, 25]), arpu = r.p([300, 600]), sp = r.p([0.5, 1, 1.5]);
      var cl = vis * r1 / 100 * r2 / 100, ca = cl * arpu / 1000, cac = sp * 1e6 / (cl * 1000);
      return { title: "Acquisition B2C", ctx: vis + " k visiteurs par an ; " + r1 + " % s'inscrivent ; " + r2 + " % des inscrits paient ; revenu annuel par client payant " + arpu + " € ; budget marketing " + fr(sp) + " M€.",
        steps: [
          { pid: "C07", q: "Clients payants ?", ans: cl, unit: "k clients", tol: T.EX, method: vis + " × " + r1 + " % × " + r2 + " % = " + fr(cl, 2) + " k" },
          { pid: "C04", q: "CA annuel ?", ans: ca, unit: "M€", tol: T.R05, method: fr(cl, 2) + " k × " + arpu + " € = " + fr(ca, 2) + " M€" },
          { pid: "C12", q: "CAC par client payant ?", ans: cac, unit: "€", tol: T.R05, method: fr(sp) + " M€ ÷ " + fr(cl, 2) + " k = " + fr(cac) + " €" }
        ], so: "CAC " + (cac < arpu ? "inférieur" : "supérieur") + " au revenu annuel : " + (cac < arpu ? "remboursé en moins d'un an de revenu." : "à confronter à la durée de vie client.") };
    },
    function (r) { // capacité → goulot → CA → marge
      var a = r.p([120, 150]), b = r.p([90, 100]), y = r.p([90, 95]), h = r.p([16]), d = r.p([250]), p = r.p([20, 30]), v = r.p([12, 15]), F = r.p([2, 3]);
      var gph = Math.min(a, b) * y / 100, vol = gph * h * d / 1e6, ca = vol * p, res = vol * (p - v) - F;
      return { title: "Usine à deux étapes", ctx: "Étape 1 : " + a + " pièces/h ; étape 2 : " + b + " pièces/h ; rendement " + y + " % après l'étape 2 ; " + h + " h par jour ; " + d + " jours ; prix " + p + " € ; coût variable " + v + " € ; fixes " + F + " M€.",
        steps: [
          { pid: "C21", q: "Pièces bonnes par heure ?", ans: gph, unit: "pièces/h", tol: T.EX, method: "min(" + a + ", " + b + ") × " + y + " % = " + fr(gph) },
          { pid: "C20", q: "Volume annuel ?", ans: vol, unit: "M de pièces", tol: T.R05, method: fr(gph) + " × " + h + " × " + d + " = " + fr(vol, 3) + " M" },
          { pid: "C14", q: "Résultat annuel ?", ans: res, unit: "M€", tol: { abs: 0.05, rel: 0.01, label: "±1 % ou ±0,05 M€" }, method: fr(vol, 3) + " × (" + p + " − " + v + ") − " + F + " = " + fr(res, 2) + " M€" }
        ], so: "Le goulot (étape 2) limite le résultat : débloquer sa capacité vaut " + fr((p - v) * h * d * y / 100 / 1e6, 3) + " M€ par pièce/h gagnée." };
    }
  ];

  // ---------- correspondance V1 → V2 ----------
  var V1MAP = { mult: "M02", div: "M04", zeros: "M06", pct: "M07", frac: "M05", cagr: "C08", sizing: "C01", rev: "C04", margin: "C13", breakeven: "C16", payback: "C26", mix: "C09", share: "C05", conv: "C20" };
  var V1DETAIL = { mult: "M02 + M03", div: "M04", zeros: "M06", pct: "M07 + M08", frac: "M05", cagr: "C08 + M11", sizing: "C01 + C03", rev: "C04", margin: "C13", breakeven: "C16", payback: "C26 + C27", mix: "C09", share: "C05", conv: "C20 + M06" };

  function generate(pid, seed) {
    var r = mkR(seed), it = G[pid](r);
    it.pid = pid; it.seed = seed; it.lvl = CAT[pid].lvl;
    return it;
  }
  function generateChain(idx, seed) { var c = CHAINS[idx](mkR(seed)); c.idx = idx; c.seed = seed; return c; }

  return { CATALOG_VERSION: CATALOG_VERSION, CAT: CAT, G: G, CHAINS: CHAINS, FIN: FIN, T: T, fr: fr, generate: generate, generateChain: generateChain, V1MAP: V1MAP, V1DETAIL: V1DETAIL, mkR: mkR };
})();
if (typeof module !== "undefined") module.exports = DRILL;
