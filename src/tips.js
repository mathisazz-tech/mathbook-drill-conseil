/* MathDrill V3 — astuces de calcul (tips du MathBook) affichées avec chaque question.
   TIPS.T : la bibliothèque. TIPS.MAP : pour chaque notion, les astuces utiles, la plus utile d'abord. */
var TIPS = (function () {
  "use strict";
  var T = {
    R72: { t: "Règle de 72", d: "Doublement : années ≈ 72 ÷ taux, et taux ≈ 72 ÷ années.", ex: "2× en 5 ans : 72 ÷ 5 ≈ 14,4 %, donc environ 15 %. À 8 % par an, ça double en 72 ÷ 8 = 9 ans.", book: "§16" },
    REP: { t: "Repères de croissance composée", d: "À savoir par cœur pour ne jamais calculer de puissance.", ex: "1,1² = 1,21 · 1,1³ ≈ 1,33 · 1,1⁵ ≈ 1,61 · 1,15⁵ ≈ 2 · 1,2⁵ ≈ 2,5 · 1,25⁵ ≈ 3." },
    JET: { t: "CAGR : premier jet, puis on descend", d: "Croissance totale ÷ n donne un taux trop haut (la croissance se compose). Le vrai CAGR est un peu en dessous.", ex: "+100 % en 5 ans : 100 ÷ 5 = 20 %, trop haut. Vrai CAGR ≈ 15 %." },
    RATIO: { t: "Arrondir le ratio", d: "Deux chiffres significatifs suffisent en case. Le reste se néglige.", ex: "804,5 ÷ 400 ≈ 800 ÷ 400 = 2." },
    ZERO: { t: "Les zéros à part", d: "Calcule avec les chiffres utiles, compte les zéros séparément, puis annonce l'unité (k, M, Md).", ex: "3,6 M × 25 € = 3,6 × 25 = 90, donc 90 M€.", book: "§1.4, §3.6" },
    MDM: { t: "Md ÷ M = × 1 000", d: "Un montant en milliards divisé par des millions donne des milliers.", ex: "2,4 Md€ ÷ 60 M habitants = 2 400 ÷ 60 = 40 € par habitant.", book: "§5.9" },
    MORC: { t: "Diviser par morceaux", d: "Coupe le dividende en parts faciles à diviser, puis additionne.", ex: "924 ÷ 7 = 700 ÷ 7 + 224 ÷ 7 = 100 + 32 = 132.", book: "§4.5" },
    DBL: { t: "Doubler les deux termes", d: "Pour ÷ 5, ÷ 15, ÷ 25, ÷ 35 : double le haut et le bas, le résultat ne change pas.", ex: "340 ÷ 5 = 680 ÷ 10 = 68 ; 210 ÷ 15 = 420 ÷ 30 = 14.", book: "§4.6" },
    FRAC: { t: "Fractions ↔ %", d: "Remplace un % par une fraction simple, ou l'inverse.", ex: "1/8 = 12,5 % · 1/7 ≈ 14,3 % · 1/6 ≈ 16,7 % · 1/3 ≈ 33,3 % · 3/8 = 37,5 %.", book: "§0.1, §4.11" },
    PCT: { t: "Un % = une division simple", d: "Choisis la forme la plus facile : 25 % = ÷ 4, 20 % = ÷ 5, 12,5 % = ÷ 8, 15 % = 10 % + 5 %.", ex: "15 % de 480 = 48 + 24 = 72." },
    X25: { t: "× 5, × 25, × 125", d: "× 5 = ÷ 2 puis × 10 · × 25 = ÷ 4 puis × 100 · × 125 = ÷ 8 puis × 1 000.", ex: "36 × 25 = 36 ÷ 4 × 100 = 900.", book: "§3.3, §7.6" },
    COMP: { t: "Compenser avec un rond", d: "Passe par le nombre rond le plus proche, puis corrige l'écart.", ex: "1 203 − 847 : 847 → 1 000 = 153, puis + 203 = 356.", book: "§2.6–2.8" },
    CROSS: { t: "Le terme croisé", d: "Deux variations : (1 + a)(1 + b) − 1 = a + b + a × b. Ne pas oublier a × b.", ex: "Prix +10 %, volume −10 % : 10 − 10 − 1 = −1 %.", book: "§14.4" },
    INV: { t: "Revenir à la base", d: "Un montant qui contient déjà une hausse se divise par (1 + t), il ne se réduit pas de t %.", ex: "120 après +20 % : base = 120 ÷ 1,2 = 100 (pas 96).", book: "§14.5" },
    PTS: { t: "Points × base", d: "Un écart en points de % se convertit en montant en le multipliant par la base.", ex: "2 points de marge sur 50 M€ de CA = 0,02 × 50 = 1 M€. 1 bp = 0,01 %.", book: "§14.3" },
    MID: { t: "Moyenne pondérée par l'écart", d: "Pars de la plus petite valeur et ajoute l'écart × le poids de l'autre.", ex: "30 % à 20 % et 70 % à 40 % : 20 + 0,7 × 20 = 34 %." },
    CHAIN: { t: "Taux enchaînés = on multiplie", d: "Funnel, rendements, TRS : multiplie les taux, ne les additionne pas. Le total est plus bas que chaque taux.", ex: "50 % × 20 % = 10 % ; 90 % × 95 % × 98 % ≈ 84 %.", book: "§17.2" },
    ANN: { t: "Annualiser", d: "× 12 (mois), × 52 (semaines), × 365 ≈ 360 (jours), 8 760 heures par an.", ex: "30 jours de CA ≈ 1/12 du CA annuel.", book: "§16.7" },
    DIVT: { t: "Diviser par un taux", d: "÷ 10 % = × 10 · ÷ 8 % = × 12,5 · ÷ 5 % = × 20 · ÷ 4 % = × 25.", ex: "Perpétuité 6 M€ à 8 % : 6 × 12,5 = 75 M€." },
    ACT: { t: "Facteurs d'actualisation à 10 %", d: "Pour actualiser sans calculer de puissance.", ex: "1/1,1 ≈ 0,91 · 1/1,1² ≈ 0,83 · 1/1,1³ ≈ 0,75 · 1/1,1⁵ ≈ 0,62." },
    ROUND: { t: "Arrondir, puis dire dans quel sens", d: "Arrondis pour calculer vite, puis précise si le vrai résultat est au-dessus ou en dessous.", ex: "19,8 × 51 ≈ 20 × 50 = 1 000 (exact 1 009,8).", book: "§5" },
    RULE3: { t: "Règle de trois inverse", d: "Plus de ressources, moins de temps : le produit ressources × temps reste constant.", ex: "6 équipes en 10 jours = 60 équipes-jours ; avec 4 équipes : 15 jours.", book: "§14.7" },
    UNIT: { t: "Marge unitaire d'abord", d: "Pour un point mort ou un seuil, calcule d'abord ce que rapporte une unité, puis divise.", ex: "Fixes 600 k€, prix 50 €, variable 30 € : 600 k ÷ 20 = 30 k unités." }
  };
  var M = {
    M01: ["COMP", "ROUND"], M02: ["X25", "ROUND"], M03: ["X25", "FRAC"], M04: ["MORC", "DBL", "FRAC"], M05: ["FRAC", "PCT"], M06: ["ZERO", "MDM"],
    M07: ["PTS"], M08: ["CROSS", "INV"], M09: ["DBL", "MORC"], M10: ["ROUND"], M11: ["R72", "REP", "JET"],
    C01: ["ZERO", "PCT", "ROUND"], C02: ["ZERO", "ANN"], C03: ["ZERO", "MORC"], C04: ["ZERO", "X25"], C05: ["FRAC", "PCT"], C06: ["MID", "PTS"],
    C07: ["CHAIN", "PCT"], C08: ["R72", "REP", "JET", "RATIO"], C09: ["CROSS"], C10: ["CHAIN", "ANN"], C11: ["PCT", "ZERO"], C12: ["DIVT", "PCT"],
    C13: ["PTS", "PCT"], C14: ["PTS", "UNIT"], C15: ["INV", "FRAC"], C16: ["UNIT", "MORC", "DBL"], C17: ["UNIT", "FRAC"], C18: ["CROSS", "PCT"],
    C19: ["PTS", "CROSS"], C20: ["ANN", "CHAIN"], C21: ["CHAIN"], C22: ["RULE3", "ANN"], C23: ["UNIT", "MORC"], C24: ["RULE3", "ANN"],
    C25: ["CHAIN", "INV"], C26: ["MORC"], C27: ["PCT"], C28: ["ANN", "FRAC"], C29: ["PTS"], C30: ["COMP"], C31: ["DIVT", "ACT"],
    C32: ["ZERO", "X25"], C33: ["DIVT", "R72"], C34: ["PCT", "MID"], C35: ["UNIT", "MORC"], C36: ["PCT", "ZERO"], C37: ["ROUND", "ZERO"],
    D01: ["ZERO"], D02: ["ZERO"], D03: ["DIVT", "ZERO"], D04: ["MID"], D05: ["PCT", "INV"], D06: ["MID"], D07: ["DIVT"], D08: ["DIVT"],
    D09: ["PTS"], D10: ["DIVT", "ACT"], D11: ["PTS"], D12: ["DIVT", "ACT"], D13: ["MID"], D14: ["PCT", "PTS"], D15: ["R72", "REP", "JET"],
    D16: ["ZERO"], D17: ["ZERO", "X25"], D18: ["R72", "REP", "ACT"], D19: ["MORC"], D20: ["MORC", "ZERO"], D21: ["COMP"], D22: ["FRAC"], D23: ["PCT"],
    S01: ["MID", "ANN"], S02: ["ANN"], S03: ["ZERO"], S04: ["PTS", "PCT"], S05: ["PTS", "ANN"], S06: ["CHAIN"], S07: ["PTS"], S08: ["DIVT", "ANN"], S09: ["CROSS", "INV"],
    R11: ["ZERO"], R17: ["DBL"], R18: ["MORC"], R20: ["FRAC"], R21: ["PCT"], R22: ["MDM", "ZERO"], R23: ["PTS"], R24: ["INV"], R25: ["RULE3"],
    R26: ["CROSS"], R28: ["ANN", "R72"], R29: ["CHAIN"], R31: ["DIVT"], R33: ["FRAC", "REP"], R34: ["R72", "REP", "JET"]
  };
  function of(pid) { return (M[pid] || []).map(function (k) { return T[k]; }).filter(Boolean); }
  return { T: T, MAP: M, of: of };
})();
if (typeof module !== "undefined") module.exports = TIPS;
