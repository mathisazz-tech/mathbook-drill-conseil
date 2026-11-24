/* MathDrill V3 — famille R : réflexes et astuces du MathBook utiles en case (ch. 0–5, 7, 14–20).
   Chaque générateur renvoie : q, ans, unit, tol, rule (la règle utilisée pour CET item, avec son pourquoi), steps (étapes numérotées), p. */
(function () {
  "use strict";
  var D = (typeof DRILL !== "undefined") ? DRILL : require("./catalog.js");
  var LS = (typeof LESSONS !== "undefined") ? LESSONS : require("./lessons.js");
  var CAT = D.CAT, G = D.G, T = D.T, fr = D.fr;
  function rd(x, d) { var k = Math.pow(10, d); return Math.round(x * k) / k; }
  function def(id, o, lesson, gen) { o.id = id; o.fam = "R"; o.skill = id; if (!o.prio) o.prio = "P0"; if (!o.lvl) o.lvl = "A"; CAT[id] = o; G[id] = gen; LS.L[id] = lesson; }
  function out(o) { o.method = o.steps.join(" | "); if (!o.unit) o.unit = ""; if (!o.tol) o.tol = T.EX; return o; }

  // ---------- Ch. 1 et 3 : multiplier ----------
  def("R01", { name: "2 chiffres × 1 chiffre, de gauche à droite", book: "§1.1, §3.1", formula: "", signal: "Un nombre à 2 chiffres fois un chiffre : dizaines d'abord, unités ensuite.", trap: "Partir des unités avec des retenues (méthode posée).", check: "Le résultat est entre (dizaine) × k et (dizaine + 10) × k." },
    { use: "Le calcul le plus fréquent en case : 47 magasins × 6, 8 € × 36 k clients. Partir de la gauche donne tout de suite l'ordre de grandeur.", ex: "6 × 47 k€ = 240 + 42 = 282 k€.", eq: ["ab × k = (a0 × k) + (b × k)"] },
    function (r) { var a = r.i(2, 9), b = r.i(1, 9), k = r.i(3, 9), n = a * 10 + b;
      return out({ p: { n: n, k: k }, q: n + " × " + k, ans: n * k, rule: "On coupe " + n + " en " + a * 10 + " + " + b + " et on commence par la grosse partie.",
        steps: [a * 10 + " × " + k + " = " + a * 10 * k, b + " × " + k + " = " + b * k, a * 10 * k + " + " + b * k + " = " + fr(n * k)] }); });
  def("R02", { name: "3 chiffres × 1 chiffre", book: "§3.5", signal: "Centaines, puis dizaines, puis unités : on « dit » la partie sûre.", trap: "Perdre le premier partiel en cours de route.", check: "Ordre de grandeur avec les centaines seules." },
    { use: "Volumes à 3 chiffres × prix unitaire simple : 316 magasins × 7 k€.", ex: "316 × 7 = 2 100 + 70 + 42 = 2 212.", eq: ["abc × k = (a00 × k) + (b0 × k) + (c × k)"] },
    function (r) { var n = r.i(102, 989), k = r.i(3, 9), h = Math.floor(n / 100) * 100, t = Math.floor(n % 100 / 10) * 10, u = n % 10;
      var st = [h + " × " + k + " = " + fr(h * k)];
      if (t) st.push(t + " × " + k + " = " + t * k + ", total " + fr(h * k + t * k));
      if (u) st.push(u + " × " + k + " = " + u * k + ", total " + fr(n * k));
      if (!u && !t) st.push("Résultat " + fr(n * k));
      return out({ p: { n: n, k: k }, q: fr(n) + " × " + k, ans: n * k, rule: "On découpe " + fr(n) + " en centaines, dizaines, unités, et on cumule au fur et à mesure.", steps: st }); });
  def("R03", { name: "Nombre entre 10 et 20 × un chiffre", book: "§1.9", signal: "Un « ado » (11 à 19) fois un chiffre.", trap: "Coller au lieu d'ajouter : 17 × 8 = 136, pas 8 056.", check: "Entre 10 × k et 20 × k." },
    { use: "Prix ou volumes de 11 à 19 : 16 € × 9, 13 sites × 7.", ex: "17 × 8 = 80 + 56 = 136.", eq: ["(10 + u) × k = 10 × k + u × k"] },
    function (r) { var u = r.i(1, 9), k = r.i(3, 9), n = 10 + u;
      return out({ p: { n: n, k: k }, q: n + " × " + k, ans: n * k, rule: n + " = 10 + " + u + " : on fait 10 × " + k + " puis on ajoute " + u + " × " + k + ".",
        steps: ["10 × " + k + " = " + 10 * k, u + " × " + k + " = " + u * k, 10 * k + " + " + u * k + " = " + n * k] }); });
  def("R04", { name: "Deux nombres entre 10 et 20", book: "§1.10", signal: "Deux « ados » : 13 × 14, 16 × 18.", trap: "Coller le produit des unités au lieu de l'ajouter.", check: "Entre le carré du plus petit et celui du plus grand." },
    { use: "Petites multiplications qui reviennent dans les tableaux : 12 mois × 15 k€, 16 × 18.", ex: "16 × 18 : 16 + 8 = 24, donc 240 ; 6 × 8 = 48 ; total 288.", eq: ["(10 + a) × (10 + b) = 10 × (10 + a + b) + a × b"] },
    function (r) { var a = r.i(1, 9), b = r.i(1, 9), x = 10 + a, y = 10 + b;
      return out({ p: { x: x, y: y }, q: x + " × " + y, ans: x * y, rule: "On ajoute au premier l'unité du second, on multiplie par 10, puis on ajoute le produit des unités.",
        steps: [x + " + " + b + " = " + (x + b), (x + b) + " × 10 = " + (x + b) * 10, a + " × " + b + " = " + a * b, (x + b) * 10 + " + " + a * b + " = " + x * y],
        traps: [{ v: Number(String((x + b) * 10) + String(a * b)), code: "E04", msg: "Le produit des unités s'ajoute, il ne se colle pas." }] }); });
  def("R05", { name: "Multiplier par 11", book: "§1.5", signal: "× 11 d'un nombre à 2 chiffres : on écarte les chiffres et on met leur somme au milieu.", trap: "Oublier la retenue quand la somme dépasse 9 (78 × 11 = 858).", check: "a × 11 = a × 10 + a." },
    { use: "Taux ou croissances de 10 % : × 1,1 = × 11 ÷ 10 (prix +10 %, marché +10 %).", ex: "Un marché de 54 M€ croît de 10 % : 54 × 1,1 = 59,4 M€.", eq: ["ab × 11 = a | (a + b) | b  (avec retenue si a + b ≥ 10)", "× 1,1 = × 11 puis ÷ 10"] },
    function (r) { var a = r.i(1, 9), b = r.i(0, 9), n = 10 * a + b, s = a + b;
      return out({ p: { n: n }, q: n + " × 11", ans: n * 11, rule: "× 11 = × 10 + × 1 : on écarte " + a + " et " + b + " et on place leur somme au milieu.",
        steps: [a + " + " + b + " = " + s + (s >= 10 ? " (on retient 1 sur le premier chiffre)" : ""), s >= 10 ? (a + 1) + " | " + (s - 10) + " | " + b + " → " + fr(n * 11) : a + " | " + s + " | " + b + " → " + fr(n * 11)] }); });
  def("R06", { name: "Carré d'un nombre qui finit par 5", book: "§1.7", signal: "35², 65², 7,5² : dizaine × suivant, puis on colle 25.", trap: "Mal placer la virgule (7,5² = 56,25).", check: "Entre les deux carrés ronds voisins." },
    { use: "Carrés utiles : 2,5 × 2,5, 15², taux à 1,05², 25 × 25.", ex: "65² = 6 × 7 = 42, on colle 25 : 4 225.", eq: ["(10a + 5)² = a × (a + 1) × 100 + 25"] },
    function (r) { var t = r.i(1, 12), n = 10 * t + 5;
      return out({ p: { n: n }, q: n + "²", ans: n * n, rule: "Pour un nombre en 5 : dizaine × dizaine suivante, puis on colle 25.",
        steps: [t + " × " + (t + 1) + " = " + t * (t + 1), "On colle 25 : " + fr(n * n)] }); });
  def("R07", { name: "Même dizaine, unités qui font 10", book: "§1.8", signal: "84 × 86, 21 × 29 : même début, fins qui somment à 10.", trap: "Écrire le produit des unités sur 1 chiffre (21 × 29 = 609, pas 69).", check: "Proche du carré du milieu (85² = 7 225)." },
    { use: "Raccourci rapide quand deux chiffres d'un tableau sont symétriques autour d'un 5.", ex: "63 × 67 = 6 × 7 = 42, puis 3 × 7 = 21 : 4 221.", eq: ["(10a + b) × (10a + c) = a × (a + 1) × 100 + b × c, si b + c = 10"] },
    function (r) { var a = r.i(1, 9), b = r.i(1, 9), c = 10 - b, x = 10 * a + b, y = 10 * a + c;
      var bc = b * c, bcs = bc < 10 ? "0" + bc : String(bc);
      return out({ p: { x: x, y: y }, q: x + " × " + y, ans: x * y, rule: "Même dizaine (" + a + ") et " + b + " + " + c + " = 10 : dizaine × suivante, puis on colle le produit des unités sur 2 chiffres.",
        steps: [a + " × " + (a + 1) + " = " + a * (a + 1), b + " × " + c + " = " + bcs, "On colle : " + fr(x * y)] }); });
  def("R08", { name: "Carré d'un nombre à 2 chiffres", book: "§7.4", lvl: "A", prio: "P1", signal: "n² : on monte et on descend jusqu'à la dizaine la plus proche.", trap: "Oublier d'ajouter l'écart au carré.", check: "Entre les deux carrés ronds voisins." },
    { use: "Carrés pour la croissance composée sur 2 ans et les surfaces : 1,08² ≈ 1,17.", ex: "38² = 40 × 36 + 2² = 1 440 + 4 = 1 444.", eq: ["n² = (n + d) × (n − d) + d²  (d = écart à la dizaine la plus proche)"] },
    function (r) { var n = r.i(13, 97); if (n % 10 === 0 || n % 10 === 5) n += 1; var u = n % 10, d = u <= 5 ? u : 10 - u, hi = n + d, lo = n - d;
      return out({ p: { n: n }, q: n + "²", ans: n * n, rule: n + " est à " + d + " de " + (u <= 5 ? lo : hi) + " : on fait " + hi + " × " + lo + " (un nombre rond) puis on ajoute " + d + "².",
        steps: [n + " + " + d + " = " + hi + " et " + n + " − " + d + " = " + lo, hi + " × " + lo + " = " + fr(hi * lo), d + "² = " + d * d, fr(hi * lo) + " + " + d * d + " = " + fr(n * n)] }); });
  def("R09", { name: "Nombre proche d'un rond × 1 chiffre (méthode soustractive)", book: "§3.2", signal: "58, 69, 98, 199 : on arrondit au-dessus et on retire.", trap: "Retirer l'écart au lieu de l'écart × k.", check: "Un peu moins que le nombre rond × k." },
    { use: "Prix psychologiques (49 €, 99 €, 199 €) et volumes juste sous un rond.", ex: "7 × 98 € = 700 − 14 = 686 €.", eq: ["(rond − écart) × k = rond × k − écart × k"] },
    function (r) { var R = r.p([60, 70, 80, 90, 100, 200, 300]), e = r.p([1, 2, 3]), n = R - e, k = r.i(3, 9);
      return out({ p: { n: n, k: k }, q: k + " × " + n, ans: n * k, rule: n + " = " + R + " − " + e + " : on multiplie le rond, puis on retire " + e + " × " + k + ".",
        steps: [k + " × " + R + " = " + fr(k * R), k + " × " + e + " = " + k * e, fr(k * R) + " − " + k * e + " = " + fr(n * k)],
        traps: [{ v: k * R - e, code: "E04", msg: "Il faut retirer l'écart multiplié par " + k + ", pas l'écart seul." }] }); });
  def("R10", { name: "Moitié / double (× 5, 15, 25, 35, 45)", book: "§3.3, §7.6", signal: "Un nombre pair × un nombre en 5 : moitié de l'un, double de l'autre.", trap: "Diviser les deux par 2.", check: "Le produit ne change pas : a × b = (a ÷ 2) × (b × 2)." },
    { use: "Ultra fréquent : 36 k clients × 15 €, 24 mois × 35 k€. On tombe sur un nombre rond.", ex: "16 × 45 = 8 × 90 = 720.", eq: ["a × b = (a ÷ 2) × (b × 2)"] },
    function (r) { var b = r.p([5, 15, 25, 35, 45, 55, 65]), a = 2 * r.i(6, 49);
      return out({ p: { a: a, b: b }, q: a + " × " + b, ans: a * b, rule: a + " est pair et " + b + " finit par 5 : en prenant la moitié de " + a + " et le double de " + b + ", on obtient un nombre rond.",
        steps: [a + " ÷ 2 = " + a / 2 + " et " + b + " × 2 = " + b * 2, a / 2 + " × " + b * 2 + " = " + fr(a * b)] }); });
  def("R11", { name: "Multiplier avec des zéros et des virgules", book: "§1.4, §3.6", signal: "Des zéros ou une virgule : on les retire, on calcule, on les remet. La virgule « mange » un zéro.", trap: "Retirer la virgule sans retirer le zéro d'en face (3,5 × 60 = 210, pas 21).", check: "Ordre de grandeur : 3,5 × 60 ≈ 4 × 60 = 240." },
    { use: "Les chiffres de case ont des zéros et des virgules : 4,5 M × 80 €, 70 sites × 640 k€. C'est là que tombent les erreurs de facteur 10.", ex: "3,5 × 60 : la virgule mange le zéro → 35 × 6 = 210.", eq: ["a,b × c0 = ab × c  (la virgule de l'un mange le zéro de l'autre)", "a0 × b0 = a × b × 100"] },
    function (r) { if (r.f() < 0.5) { var x = r.p([1.5, 2.5, 3.5, 4.5, 4.8, 6.5, 7.5, 1.2, 2.4]), y = r.p([20, 40, 60, 80, 30, 50]), xi = Math.round(x * 10), yi = y / 10;
        return out({ p: { x: x, y: y }, q: fr(x) + " × " + y, ans: rd(x * y, 6), rule: "La virgule de " + fr(x) + " mange le zéro de " + y + " : on calcule " + xi + " × " + yi + ".",
          steps: [fr(x) + " × " + y + " = " + xi + " × " + yi, xi + " × " + yi + " = " + fr(xi * yi)],
          traps: [{ v: x * yi, code: "E05", msg: "Tu as retiré le zéro mais gardé la virgule : facteur 10." }, { v: xi * y, code: "E05", msg: "Tu as retiré la virgule mais gardé le zéro : facteur 10." }] }); }
      var a = r.i(2, 9) * 10, b = r.i(12, 98) * r.p([1, 10]), az = a / 10, bz = b % 10 === 0 ? b / 10 : b, nz = 1 + (b % 10 === 0 ? 1 : 0);
      return out({ p: { a: a, b: b }, q: a + " × " + fr(b), ans: a * b, rule: "On retire les zéros (" + nz + "), on fait le petit calcul, on remet les " + nz + " zéro" + (nz > 1 ? "s" : "") + ".",
        steps: ["Sans les zéros : " + az + " × " + bz + " = " + fr(az * bz), "On remet " + nz + " zéro" + (nz > 1 ? "s" : "") + " : " + fr(a * b)] }); });
  def("R12", { name: "Nombre à virgule × entier (deux morceaux)", book: "§3.4", signal: "26,25 × 4 : partie entière × n, partie décimale × n, puis on ajoute.", trap: "Injecter la retenue des décimales dans la partie entière avant de multiplier.", check: "Arrondir : 26 × 4 = 104, donc un peu plus." },
    { use: "Prix unitaires à virgule × volumes : 7,55 € × 4 M d'unités, 26,25 € × 4.", ex: "7,55 × 4 = 28 + 2,2 = 30,2.", eq: ["(entier + décimales) × n = entier × n + décimales × n"] },
    function (r) { var e = r.i(2, 49), dcm = r.p([0.25, 0.5, 0.75, 0.2, 0.4, 0.55, 0.15]), n = r.i(3, 9), x = rd(e + dcm, 2);
      return out({ p: { x: x, n: n }, q: fr(x) + " × " + n, ans: rd(x * n, 6), rule: "On coupe " + fr(x) + " en " + e + " + " + fr(dcm) + " et on multiplie chaque morceau par " + n + ".",
        steps: [e + " × " + n + " = " + e * n, fr(dcm) + " × " + n + " = " + fr(rd(dcm * n, 4)), e * n + " + " + fr(rd(dcm * n, 4)) + " = " + fr(rd(x * n, 4))] }); });
  def("R13", { name: "Factoriser pour multiplier 2 chiffres × 2 chiffres", book: "§3.7, §7.3", signal: "Un facteur se casse en petits chiffres : 27 = 3 × 9, 24 = 4 × 6.", trap: "Choisir une factorisation qui crée des calculs plus durs.", check: "Ordre de grandeur des deux facteurs arrondis." },
    { use: "Multiplications de tableau sans nombre rond : 36 × 27, 48 × 24.", ex: "36 × 27 = 36 × 3 × 9 = 108 × 9 = 972.", eq: ["a × (p × q) = (a × p) × q"] },
    function (r) { var f = r.p([[24, 4, 6], [27, 3, 9], [28, 4, 7], [32, 4, 8], [42, 6, 7], [36, 4, 9], [48, 6, 8], [56, 7, 8]]), a = r.i(12, 49);
      return out({ p: { a: a, b: f[0] }, q: a + " × " + f[0], ans: a * f[0], rule: f[0] + " = " + f[1] + " × " + f[2] + " : on multiplie " + a + " par " + f[1] + ", puis le résultat par " + f[2] + ".",
        steps: [f[0] + " = " + f[1] + " × " + f[2], a + " × " + f[1] + " = " + a * f[1], a * f[1] + " × " + f[2] + " = " + fr(a * f[0])] }); });

  // ---------- Ch. 2 : additionner, soustraire ----------
  def("R14", { name: "Compléments à 100 et à 1 000", book: "§2.6, §2.7", signal: "1 000 − x : chaque chiffre va à 9, le dernier va à 10.", trap: "Mettre aussi le dernier chiffre à 9.", check: "x + complément = 1 000." },
    { use: "Parts restantes (100 % − 37 % = 63 %), écart à un objectif, reste d'un budget.", ex: "1 000 − 683 : 6→3, 8→1, 3→7 = 317.", eq: ["Complément à 1 000 = (9 − 1er chiffre)(9 − 2e)(10 − dernier)"] },
    function (r) { var big = r.f() < 0.6, B = big ? 1000 : 100, x = big ? r.i(101, 989) : r.i(11, 89); if (x % 10 === 0) x += 3;
      var s = String(x), parts = s.split("").map(function (c, i) { return i < s.length - 1 ? (9 - +c) : (10 - +c); });
      return out({ p: { x: x, B: B }, q: fr(B) + " − " + x, ans: B - x, rule: "Complément à " + fr(B) + " : chaque chiffre va à 9, sauf le dernier qui va à 10.",
        steps: s.split("").map(function (c, i) { return c + " → " + parts[i] + (i < s.length - 1 ? " (pour faire 9)" : " (pour faire 10)"); }).concat(["Résultat : " + (B - x)]) }); });
  def("R15", { name: "Soustraire avec un complément", book: "§2.8", signal: "1 203 − 847 : on retire 1 000, puis on rajoute le complément de 847.", trap: "Ajouter le complément dans le mauvais sens.", check: "Résultat + 847 = 1 203." },
    { use: "Écarts entre deux années ou deux scénarios : 1 203 − 847 M€.", ex: "1 203 − 847 = 203 + 153 = 356.", eq: ["a − b = (a − 1 000) + (1 000 − b)"] },
    function (r) { var b = r.i(512, 978), a = 1000 + r.i(15, 480), c = 1000 - b;
      return out({ p: { a: a, b: b }, q: fr(a) + " − " + b, ans: a - b, rule: "Retirer " + b + " revient à retirer 1 000 puis rajouter " + c + " (le complément de " + b + ").",
        steps: [fr(a) + " − 1 000 = " + (a - 1000), "Complément de " + b + " à 1 000 = " + c, (a - 1000) + " + " + c + " = " + (a - b)] }); });
  def("R16", { name: "Rendre la monnaie", book: "§2.9", lvl: "A", prio: "P1", signal: "Billet − prix : centimes vers 10, euros vers 9 (ou n − 1).", trap: "Compléter les centimes à 9 au lieu de 10.", check: "Prix + monnaie = billet." },
    { use: "Compléments en euros-centimes : écart entre un prix et un seuil (50 € − 12,86 €).", ex: "50 − 12,86 = 37,14.", eq: ["Monnaie = billet − prix, chiffre par chiffre (9 partout, 10 au dernier)"] },
    function (r) { var bill = r.p([20, 50, 100]), pr = rd(r.i(101, bill * 100 - 50) / 100, 2); if (Math.round(pr * 100) % 100 === 0) pr = rd(pr + 0.37, 2); var m = rd(bill - pr, 2);
      return out({ p: { bill: bill, pr: pr }, q: bill + " € − " + fr(pr) + " €", ans: m, unit: "€", rule: "On complète chiffre par chiffre : centimes vers 10 pour le dernier, 9 pour les autres.",
        steps: ["Partie euros : complément de " + Math.floor(pr) + " à " + (bill - 1) + " = " + (bill - 1 - Math.floor(pr)), "Partie centimes : complément de " + Math.round((pr % 1) * 100) + " à 100 = " + (100 - Math.round((pr % 1) * 100)), "Monnaie = " + fr(m) + " €"] }); });

  // ---------- Ch. 4 : diviser ----------
  def("R17", { name: "Diviser par un chiffre, par morceaux", book: "§4.5", signal: "Couper le dividende en morceaux faciles : 1 380 ÷ 3 = 1 200 ÷ 3 + 180 ÷ 3.", trap: "Perdre un zéro en recollant (53 au lieu de 530).", check: "Remultiplier : quotient × diviseur = dividende." },
    { use: "CA par magasin, coût par trimestre (÷ 4), par mois (÷ 12 = ÷ 3 ÷ 4).", ex: "1 380 ÷ 3 = 400 + 60 = 460.", eq: ["(A + B) ÷ k = A ÷ k + B ÷ k  (A multiple facile de k)"] },
    function (r) { var k = r.i(3, 9), q = r.i(105, 980), n = q * k, A = Math.floor(n / (k * 100)) * k * 100, B = n - A;
      return out({ p: { n: n, k: k }, q: fr(n) + " ÷ " + k, ans: q, rule: "On coupe " + fr(n) + " en " + fr(A) + " (divisible par " + k + ") + " + B + ".",
        steps: [fr(A) + " ÷ " + k + " = " + A / k, B + " ÷ " + k + " = " + B / k, A / k + " + " + B / k + " = " + q] }); });
  def("R18", { name: "Doubler les deux termes (÷ 5, ÷ 15, ÷ 35, ÷ 45)", book: "§4.6", signal: "Le diviseur finit par 5 : doubler les deux termes donne un diviseur rond.", trap: "Ne doubler qu'un seul des deux termes.", check: "Quotient × diviseur de départ = dividende." },
    { use: "Diviser par 5, 15, 25, 35 : prix moyen, nombre de clients, années de payback.", ex: "2 940 ÷ 35 = 5 880 ÷ 70 = 84.", eq: ["a ÷ b = (2a) ÷ (2b)", "÷ 5 = × 2 puis ÷ 10"] },
    function (r) { var b = r.p([5, 15, 35, 45, 25]), q = r.i(12, 96), n = b * q;
      return out({ p: { n: n, b: b }, q: fr(n) + " ÷ " + b, ans: q, rule: "On double les deux termes : " + b + " devient " + 2 * b + ", un diviseur rond.",
        steps: [fr(n) + " × 2 = " + fr(2 * n) + " et " + b + " × 2 = " + 2 * b, fr(2 * n) + " ÷ " + 2 * b + " = " + q] }); });
  def("R19", { name: "Diviser par 2 chiffres en simplifiant", book: "§4.7, §4.8", signal: "Diviser les deux termes par 2 tant que c'est pair (÷ 48 → ÷ 24 → ÷ 12).", trap: "Simplifier un seul des deux termes.", check: "Remultiplier pour vérifier." },
    { use: "Ratios de case : 1 536 k€ ÷ 48 mois, 768 ÷ 24.", ex: "1 536 ÷ 48 = 768 ÷ 24 = 384 ÷ 12 = 32.", eq: ["a ÷ b = (a ÷ 2) ÷ (b ÷ 2), autant de fois que nécessaire"] },
    function (r) { var b = r.p([16, 24, 32, 48, 64, 36, 56]), q = r.i(11, 69), n = b * q, st = [], x = n, y = b;
      while (y % 2 === 0 && x % 2 === 0 && y > 8) { st.push(fr(x) + " ÷ " + y + " = " + fr(x / 2) + " ÷ " + y / 2); x /= 2; y /= 2; }
      st.push(fr(x) + " ÷ " + y + " = " + q);
      return out({ p: { n: n, b: b }, q: fr(n) + " ÷ " + b, ans: q, rule: "On divise les deux termes par 2 jusqu'à un diviseur facile.", steps: st }); });
  def("R20", { name: "Fractions en % (dont septièmes)", book: "§0.1, §4.11", signal: "1/7 = 14,3 %, 1/8 = 12,5 %, 1/6 = 16,7 %, 1/12 = 8,3 %.", trap: "Confondre 1/6 et 1/7, ou 1/8 et 1/9.", check: "n/7 est entre n × 14 % et n × 15 %." },
    { use: "Lire une part à la volée : 3 clients sur 7, 5 mois sur 12.", ex: "3/7 = 3 × 14,3 % ≈ 42,9 %.", eq: ["1/7 ≈ 14,3 %  ·  1/8 = 12,5 %  ·  1/6 ≈ 16,7 %  ·  1/9 ≈ 11,1 %  ·  1/12 ≈ 8,3 %", "n/d = n × (1/d)"] },
    function (r) { var dd = r.p([7, 7, 8, 6, 9, 12, 16, 3]), n = r.i(1, dd - 1); while (n > 1 && dd % n === 0 && dd !== 7) n = r.i(1, dd - 1);
      var base = { 3: 33.33, 6: 16.67, 7: 14.29, 8: 12.5, 9: 11.11, 12: 8.33, 16: 6.25 }[dd], v = n / dd * 100;
      return out({ p: { n: n, d: dd }, q: n + "/" + dd + " en %", ans: v, unit: "%", tol: { abs: 0.1, label: "±0,1 point" }, rule: "On part du repère 1/" + dd + " = " + fr(base) + " % et on multiplie par " + n + ".",
        steps: ["1/" + dd + " ≈ " + fr(base) + " %", n + " × " + fr(base) + " ≈ " + fr(v, 1) + " %"] }); });

  // ---------- Ch. 5 : estimer ----------
  def("R21", { name: "Taux non entiers (4,5 %, 6,25 %, 8,25 %)", book: "§5.5", signal: "On calcule le taux entier, puis on ajoute une fraction de ce résultat.", trap: "Recalculer tout le taux d'un coup et se perdre dans les virgules.", check: "Le résultat est entre le taux entier inférieur et supérieur." },
    { use: "Commissions, taux d'intérêt, TVA, royalties : 8,25 % de 1 600 €.", ex: "8,25 % de 1 600 = 8 % (128) + 0,25 % (4) = 132 €.", eq: ["x,y % de N = x % de N + 0,y % de N"] },
    function (r) { var t = r.p([4.5, 6.25, 8.25, 2.5, 12.5, 7.5, 5.25]), N = r.p([400, 800, 1200, 1600, 2400, 4000, 3200]), e = Math.floor(t), f = rd(t - e, 2);
      var a = N * e / 100, b = N * f / 100;
      return out({ p: { t: t, N: N }, q: fr(t) + " % de " + fr(N), ans: rd(N * t / 100, 6), rule: "On coupe " + fr(t) + " % en " + e + " % + " + fr(f) + " % : le petit morceau est une fraction simple du gros.",
        steps: [e + " % de " + fr(N) + " = " + fr(a), fr(f) + " % de " + fr(N) + " = " + fr(b), fr(a) + " + " + fr(b) + " = " + fr(a + b)] }); });
  def("R22", { name: "Très grands nombres : Md ÷ M, par habitant", book: "§5.9", signal: "Md ÷ M = milliers ; M ÷ k = milliers. Écrire les puissances de 10.", trap: "Perdre trois zéros (6,4 Md€ ÷ 1 600 = 4 M€, pas 4 k€).", check: "Comparer à un repère connu (PIB/hab, CA moyen d'un magasin)." },
    { use: "Ramener un total national à une unité : par habitant, par agence, par client.", ex: "1 Md€ ÷ 68 M habitants ≈ 15 € par habitant.", eq: ["Md ÷ M = 10⁹ ÷ 10⁶ = 10³", "Md ÷ k = 10⁶ (des millions)"] },
    function (r) { var tot = r.p([1.2, 2.4, 3.6, 6.4, 4.8, 9]), per = r.p([40, 60, 80, 120, 1.6, 2.4, 3]); var isK = per < 10;
      // isK : per en milliers (agences) ; sinon per en millions (habitants)
      var ans = isK ? tot * 1e9 / (per * 1e3) / 1e6 : tot * 1e9 / (per * 1e6);
      return out({ p: { tot: tot, per: per }, q: fr(tot) + " Md€ répartis sur " + (isK ? fr(per * 1000) + " agences" : per + " M d'habitants") + ". Montant par " + (isK ? "agence" : "habitant") + " ?",
        ans: rd(ans, 6), unit: isK ? "M€" : "€", tol: T.R1, rule: isK ? "Md ÷ k = millions : on divise les chiffres et on lit le résultat en M€." : "Md ÷ M = milliers : on divise les chiffres puis on multiplie par 1 000.",
        steps: isK ? [fr(tot) + " Md€ ÷ " + fr(per) + " k = (" + fr(tot) + " ÷ " + fr(per) + ") × 10⁶", fr(tot) + " ÷ " + fr(per) + " = " + fr(ans, 2), "Soit " + fr(ans, 2) + " M€ par agence"] :
          [fr(tot) + " Md€ ÷ " + per + " M = (" + fr(tot) + " ÷ " + per + ") × 1 000", fr(tot * 1000) + " ÷ " + per + " = " + fr(ans, 1), "Soit " + fr(ans, 1) + " € par habitant"],
        traps: [{ v: ans / 1000, code: "E05", msg: "Trois zéros perdus : Md ÷ M donne des milliers." }, { v: ans * 1000, code: "E05", msg: "Trois zéros de trop." }] }); });

  // ---------- Ch. 14 : pourcentages en case ----------
  def("R23", { name: "Points de marge × CA = montant perdu", book: "§14.3", lvl: "B", signal: "Perdre x points de marge = perdre x % du CA.", trap: "Prendre x % de la marge au lieu de x % du CA.", check: "Le montant est petit devant le CA." },
    { use: "« La marge a perdu 2 points, combien ça coûte ? » Un seul calcul suffit.", ex: "Marge de 12 % à 10 % sur 40 M€ de CA : 2 % × 40 = 0,8 M€ perdus.", eq: ["Montant perdu = points perdus × CA"] },
    function (r) { var ca = r.p([40, 60, 80, 120, 200, 250]), m0 = r.p([12, 15, 18, 20, 25]), dp = r.p([1, 2, 3, 4]), m1 = m0 - dp;
      return out({ p: { ca: ca, m0: m0, m1: m1 }, q: "La marge passe de " + m0 + " % à " + m1 + " % sur un CA de " + ca + " M€. Profit perdu ?", ans: ca * dp / 100, unit: "M€", rule: "Perdre " + dp + " points de marge, c'est perdre " + dp + " % du CA.",
        steps: [m0 + " − " + m1 + " = " + dp + " points", dp + " % × " + ca + " = " + fr(ca * dp / 100) + " M€"],
        traps: [{ v: ca * m0 / 100 * dp / 100, code: "E03", msg: "Tu as pris " + dp + " % de la marge : les points s'appliquent au CA." }] }); });
  def("R24", { name: "Revenir à la base : le % inverse", book: "§14.5", lvl: "B", signal: "Après −20 %, il faut +25 % pour revenir.", trap: "Penser qu'il faut +20 %.", check: "(1 − a) × (1 + b) = 1." },
    { use: "Retrouver un prix ou un CA d'origine, mesurer l'effort pour revenir au niveau d'avant crise.", ex: "Le CA a baissé de 20 % : il doit remonter de 1 ÷ 0,8 − 1 = 25 %.", eq: ["Hausse nécessaire = 1 ÷ (1 − baisse) − 1", "Base = valeur finale ÷ (1 + variation)"] },
    function (r) { var t = r.p([20, 25, 50, 10, 40, 60]), up = (1 / (1 - t / 100) - 1) * 100;
      return out({ p: { t: t }, q: "Après une baisse de " + t + " %, quelle hausse faut-il pour revenir au niveau de départ ?", ans: up, unit: "%", tol: T.P1, rule: "La hausse se calcule sur une base plus petite : il faut diviser 1 par ce qui reste.",
        steps: ["Il reste 1 − " + fr(t / 100) + " = " + fr(1 - t / 100), "1 ÷ " + fr(1 - t / 100) + " = " + fr(1 / (1 - t / 100), 3), "Hausse = " + fr(up, 1) + " %"],
        traps: [{ v: t, code: "E03", msg: "La hausse se calcule sur la base réduite : elle est plus grande que la baisse." }] }); });
  def("R25", { name: "Proportion inverse (règle de trois inverse)", book: "§14.7", lvl: "B", signal: "Plus de machines → moins de jours : on passe par le total (machine-jours).", trap: "Faire une règle de trois directe.", check: "Plus de ressources = moins de temps." },
    { use: "Dimensionner : combien de jours avec plus d'équipes, combien de personnes pour finir plus vite.", ex: "12 personnes en 10 jours → 120 jours-homme ; en 8 jours il faut 15 personnes.", eq: ["Total = ressources × durée", "Nouvelle durée = total ÷ nouvelles ressources"] },
    function (r) { var a = r.p([6, 8, 10, 12, 4]), d = r.p([20, 15, 12, 30, 24]), tot = a * d, b = r.p([8, 10, 12, 15, 5, 6]); if (b === a) b = a + 2;
      return out({ p: { a: a, d: d, b: b }, q: a + " machines font une commande en " + d + " jours. Combien de jours avec " + b + " machines ?", ans: tot / b, unit: "jours", tol: T.Y01, rule: "Plus de machines, moins de jours : on calcule d'abord le travail total en machine-jours.",
        steps: [a + " × " + d + " = " + tot + " machine-jours", tot + " ÷ " + b + " = " + fr(tot / b, 2) + " jours"],
        traps: [{ v: d * b / a, code: "E01", msg: "Règle de trois directe : ici c'est inversement proportionnel." }] }); });
  def("R26", { name: "Enchaîner trois variations", book: "§14.4", lvl: "B", signal: "+10 %, +20 %, −10 % : on multiplie les coefficients (ou on part de 100).", trap: "Additionner les % (+20 %).", check: "La somme simple donne l'ordre de grandeur." },
    { use: "Prix sur plusieurs années, ou prix × volume × mix.", ex: "+10 %, +20 %, −10 % : 100 → 110 → 132 → 118,8, soit +18,8 %.", eq: ["Variation totale = (1 + a) × (1 + b) × (1 + c) − 1"] },
    function (r) { var a = r.p([10, 20, 5]), b = r.p([20, 10, 25]), c = r.p([-10, -20, 10, -5]), v1 = 100 * (1 + a / 100), v2 = v1 * (1 + b / 100), v3 = v2 * (1 + c / 100);
      return out({ p: { a: a, b: b, c: c }, q: (a > 0 ? "+" : "") + a + " %, puis " + (b > 0 ? "+" : "") + b + " %, puis " + (c > 0 ? "+" : "") + c + " %. Variation totale ?", ans: rd(v3 - 100, 6), unit: "%", tol: T.P01, rule: "Les variations se multiplient : on part de 100 et on applique chaque taux au résultat précédent.",
        steps: ["100 × " + fr(1 + a / 100) + " = " + fr(v1), fr(v1) + " × " + fr(1 + b / 100) + " = " + fr(v2), fr(v2) + " × " + fr(1 + c / 100) + " = " + fr(v3, 2), "Variation = " + fr(v3 - 100, 2) + " %"],
        traps: [{ v: a + b + c, code: "E04", msg: "Les variations successives se multiplient, elles ne s'additionnent pas." }] }); });

  // ---------- Ch. 16 : croissance ----------
  def("R27", { name: "Contribution d'un segment à la croissance", book: "§16.1", lvl: "B", signal: "« D'où vient la croissance ? » : poids de départ × croissance du segment.", trap: "Faire la moyenne simple des croissances.", check: "La croissance totale est entre la plus faible et la plus forte." },
    { use: "Expliquer quel segment tire la croissance d'un marché ou d'un client.", ex: "A (75 %) +2 %, B (25 %) +18 % : 1,5 + 4,5 = 6 % de croissance, dont 3/4 viennent de B.", eq: ["Contribution d'un segment = poids de départ × croissance du segment", "Croissance totale = somme des contributions"] },
    function (r) { var w = r.p([60, 70, 75, 80]), ga = r.p([1, 2, 3, 4]), gb = r.p([10, 12, 15, 18, 20]), ca = w * ga / 100, cb = (100 - w) * gb / 100;
      return out({ p: { w: w, ga: ga, gb: gb }, q: "Segment A : " + w + " % du CA, +" + ga + " %. Segment B : " + (100 - w) + " % du CA, +" + gb + " %. Croissance totale ?", ans: rd(ca + cb, 6), unit: "%", tol: T.P01, rule: "Chaque segment contribue selon son poids de départ.",
        steps: ["A : " + w + " % × " + ga + " % = " + fr(ca, 2) + " point", "B : " + (100 - w) + " % × " + gb + " % = " + fr(cb, 2) + " points", fr(ca, 2) + " + " + fr(cb, 2) + " = " + fr(ca + cb, 2) + " %"],
        traps: [{ v: (ga + gb) / 2, code: "E03", msg: "Moyenne simple : il faut pondérer par le poids de chaque segment." }] }); });
  def("R28", { name: "Annualiser : flux × 12, taux composé", book: "§16.7", lvl: "B", signal: "Un flux s'additionne (× 12) ; un taux se compose ((1 + r)¹² − 1).", trap: "Multiplier un taux mensuel par 12.", check: "Un taux composé annuel est un peu au-dessus de 12 × le mensuel." },
    { use: "Données mensuelles d'un client à comparer à un objectif annuel ; run rate.", ex: "1 % par mois = 1,01¹² − 1 ≈ 12,7 % par an, pas 12 %.", eq: ["Flux annuel = flux mensuel × 12", "Taux annuel = (1 + taux mensuel)¹² − 1"] },
    function (r) { if (r.f() < 0.5) { var m = r.p([1, 2, 0.5]), a = (Math.pow(1 + m / 100, 12) - 1) * 100;
        return out({ p: { m: m }, q: "Croissance de " + fr(m) + " % par mois. Croissance sur un an ?", ans: a, unit: "%", tol: T.P05, rule: "Un taux se compose : chaque mois s'applique au total du mois précédent.",
          steps: ["Coefficient mensuel = " + fr(1 + m / 100, 3), fr(1 + m / 100, 3) + "¹² ≈ " + fr(Math.pow(1 + m / 100, 12), 3), "Croissance ≈ " + fr(a, 1) + " % (un peu plus que 12 × " + fr(m) + " = " + fr(12 * m) + " %)"],
          traps: [{ v: 12 * m, code: "E04", msg: "Un taux mensuel se compose, il ne se multiplie pas par 12." }] }); }
      var mo = r.p([1.5, 2.5, 3, 4.2, 0.8]);
      return out({ p: { mo: mo }, q: "CA de décembre : " + fr(mo) + " M€. Run rate annuel ?", ans: rd(mo * 12, 6), unit: "M€", rule: "Un flux mensuel s'annualise en multipliant par 12 (attention si le mois est saisonnier).",
        steps: [fr(mo) + " × 12 = " + fr(mo * 12) + " M€"] }); });

  // ---------- Ch. 17–19 : opérations, sizing, probabilités ----------
  def("R29", { name: "TRS : disponibilité × performance × qualité", book: "§17.2", lvl: "B", signal: "Trois taux de perte se multiplient.", trap: "Les additionner ou en faire la moyenne.", check: "Le TRS est plus bas que chacun des trois taux." },
    { use: "« Où perd-on de la capacité ? » dans une usine : on chiffre chaque perte.", ex: "90 % × 80 % × 95 % = 68,4 %.", eq: ["TRS = disponibilité × performance × qualité"] },
    function (r) { var a = r.p([80, 85, 90, 95]), b = r.p([75, 80, 85, 90]), c = r.p([90, 95, 98]), t = a * b * c / 1e4;
      return out({ p: { a: a, b: b, c: c }, q: "Disponibilité " + a + " %, performance " + b + " %, qualité " + c + " %. TRS ?", ans: t, unit: "%", tol: T.P02, rule: "Les trois pertes s'enchaînent, donc les taux se multiplient.",
        steps: [fr(a / 100) + " × " + fr(b / 100) + " = " + fr(a * b / 1e4, 3), fr(a * b / 1e4, 3) + " × " + fr(c / 100) + " = " + fr(t / 100, 3), "TRS = " + fr(t, 1) + " %"],
        traps: [{ v: (a + b + c) / 3, code: "E04", msg: "Moyenne des taux : les pertes s'enchaînent, il faut multiplier." }] }); });
  def("R30", { name: "TAM, SAM, SOM", book: "§18.5", lvl: "B", signal: "Marché total → partie adressable par l'offre → part atteignable.", trap: "Appliquer la part visée au TAM au lieu du SAM.", check: "SOM < SAM < TAM." },
    { use: "Après le sizing : « Quelle part peut viser le client ? »", ex: "TAM 2 Md€, 30 % adressable, 10 % de part visée : SOM = 60 M€.", eq: ["SAM = TAM × % adressable", "SOM = SAM × part visée"] },
    function (r) { var tam = r.p([1, 2, 3, 5, 1.5]), s = r.p([20, 30, 40, 25]), p = r.p([5, 10, 15, 20]), som = tam * 1000 * s / 100 * p / 100;
      return out({ p: { tam: tam, s: s, p: p }, q: "Marché total " + fr(tam) + " Md€ ; " + s + " % adressable par l'offre ; part visée " + p + " %. Marché atteignable (SOM) ?", ans: som, unit: "M€", tol: T.R1, rule: "On réduit le marché étape par étape : d'abord ce que l'offre adresse, puis la part atteignable.",
        steps: [fr(tam) + " Md€ = " + fr(tam * 1000) + " M€", fr(tam * 1000) + " × " + s + " % = " + fr(tam * 10 * s) + " M€ (SAM)", fr(tam * 10 * s) + " × " + p + " % = " + fr(som) + " M€ (SOM)"],
        traps: [{ v: tam * 1000 * p / 100, code: "E03", msg: "La part visée s'applique au marché adressable, pas au marché total." }] }); });
  def("R31", { name: "Base d'équilibre et durée de vie client", book: "§19.2", lvl: "B", signal: "Nouveaux par mois ÷ churn mensuel = base vers laquelle on converge. Durée de vie = 1 ÷ churn.", trap: "Multiplier au lieu de diviser.", check: "À l'équilibre, départs = arrivées." },
    { use: "Abonnements, télécoms, SaaS : « Jusqu'où peut monter la base ? »", ex: "5 000 nouveaux clients/mois, churn 2 % : base d'équilibre 250 000.", eq: ["Base d'équilibre = nouveaux clients par période ÷ churn par période", "Durée de vie moyenne = 1 ÷ churn"] },
    function (r) { if (r.f() < 0.6) { var n = r.p([2, 4, 5, 6, 10]), c = r.p([2, 4, 5, 2.5]), b = n / (c / 100);
        return out({ p: { n: n, c: c }, q: n + " k nouveaux clients par mois, churn " + fr(c) + " % par mois. Base d'équilibre ?", ans: b, unit: "k clients", rule: "À l'équilibre, les départs (base × churn) égalent les arrivées.",
          steps: ["Base × " + fr(c) + " % = " + n + " k", "Base = " + n + " ÷ " + fr(c / 100) + " = " + fr(b) + " k"] }); }
      var c2 = r.p([2, 4, 5, 10, 20, 25]);
      return out({ p: { c: c2 }, q: "Churn de " + c2 + " % par an. Durée de vie moyenne d'un client ?", ans: 100 / c2, unit: "années", tol: T.Y01, rule: "Si on perd " + c2 + " % des clients chaque année, un client reste en moyenne 1 ÷ " + fr(c2 / 100) + " ans.",
        steps: ["1 ÷ " + fr(c2 / 100) + " = " + fr(100 / c2, 1) + " ans"] }); });
  def("R32", { name: "Probabilités : « au moins un »", book: "§19.4", lvl: "B", prio: "P1", signal: "« Au moins un » = 1 − (aucun). « Et » = produit.", trap: "Additionner les probabilités (5 % × 3 ≠ 15 %).", check: "Une probabilité reste entre 0 et 100 %." },
    { use: "Risque fournisseur, pannes, réussite de plusieurs étapes d'un projet.", ex: "3 fournisseurs à 5 % de défaillance : 1 − 0,95³ ≈ 14,3 % qu'au moins un défaille.", eq: ["P(au moins un) = 1 − (1 − p)ⁿ", "P(A et B) = P(A) × P(B) si indépendants"] },
    function (r) { var p = r.p([5, 10, 20]), n = r.p([2, 3]), v = (1 - Math.pow(1 - p / 100, n)) * 100;
      return out({ p: { p: p, n: n }, q: n + " fournisseurs indépendants ont chacun " + p + " % de risque de défaillance. Risque qu'au moins un défaille ?", ans: v, unit: "%", tol: T.P02, rule: "« Au moins un » se calcule par le contraire : 1 − (aucun ne défaille).",
        steps: ["Aucun ne défaille : " + fr(1 - p / 100) + "^" + n + " = " + fr(Math.pow(1 - p / 100, n), 4), "1 − " + fr(Math.pow(1 - p / 100, n), 4) + " = " + fr(v, 1) + " %"],
        traps: [{ v: p * n, code: "E04", msg: "On n'additionne pas des probabilités qui peuvent arriver ensemble." }] }); });

  // ---------- Ch. 0 : Memory Core (rappel actif) ----------
  def("R33", { name: "Repères à connaître par cœur", book: "§0.1–0.8", signal: "Fractions ↔ %, carrés jusqu'à 25, bps, tables de 11 à 19.", trap: "Recalculer ce qui devrait sortir tout seul.", check: "Réponse en moins de 3 secondes." },
    { use: "Les briques de tous les calculs : plus elles sont instantanées, plus il reste d'attention pour le case.", ex: "1/8 = 12,5 % ; 17² = 289 ; 50 bps = 0,5 point.", eq: ["1/3 ≈ 33,3 %  1/6 ≈ 16,7 %  1/7 ≈ 14,3 %  1/8 = 12,5 %  1/9 ≈ 11,1 %  1/12 ≈ 8,3 %  1/16 = 6,25 %", "Carrés : 11² = 121 … 25² = 625"] },
    function (r) { var v = r.i(0, 2);
      if (v === 0) { var f = r.p([[1, 8], [3, 8], [5, 8], [1, 6], [5, 6], [1, 3], [2, 3], [1, 12], [1, 16], [3, 16], [1, 9], [1, 7], [3, 4], [2, 5], [3, 5]]), x = f[0] / f[1] * 100;
        return out({ p: { a: f[0], b: f[1] }, q: f[0] + "/" + f[1] + " en %", ans: x, unit: "%", tol: { abs: 0.1, label: "±0,1 point" }, rule: "Repère à connaître par cœur.", steps: [f[0] + "/" + f[1] + " = " + fr(x, 2) + " %"] }); }
      if (v === 1) { var n = r.i(11, 25);
        return out({ p: { n: n }, q: n + "²", ans: n * n, rule: "Carré à connaître par cœur (de 11 à 25).", steps: [n + "² = " + n * n] }); }
      var b = r.p([25, 50, 75, 125, 150, 200, 350]);
      return out({ p: { b: b }, q: b + " bps en points de %", ans: b / 100, unit: "points", rule: "100 bps = 1 point de %.", steps: [b + " ÷ 100 = " + fr(b / 100) + " point" + (b >= 200 ? "s" : "")] }); });
  def("R34", { name: "Règle de 72 et repères de croissance", book: "§16", signal: "Doublement, CAGR ou TRI sur plusieurs années : jamais de racine ni de puissance de tête.", trap: "Diviser la croissance totale par le nombre d'années : c'est trop haut.", check: "Taux × années ≈ 72 pour un doublement." },
    { use: "Lire vite une croissance ou un rendement : « le marché a doublé en 6 ans » = environ 12 % par an ; « 2× en 5 ans » = environ 15 % de TRI.", ex: "72 ÷ 5 ≈ 14,4 %, donc 2× en 5 ans ≈ 15 % par an.", eq: ["Années pour doubler ≈ 72 ÷ taux (%)", "Taux pour doubler ≈ 72 ÷ années", "1,1⁵ ≈ 1,61   1,15⁵ ≈ 2   1,2⁵ ≈ 2,5   1,25⁵ ≈ 3"] },
    function (r) { var v = r.i(0, 2);
      if (v === 0) { var n = r.p([4, 5, 6, 8, 9, 10, 12]), ex = (Math.pow(2, 1 / n) - 1) * 100;
        return out({ p: { n: n }, q: "Une valeur double en " + n + " ans. Croissance annuelle ?", ans: ex, unit: "%", tol: { abs: 1, label: "±1 point" }, rule: "Règle de 72 : taux pour doubler ≈ 72 ÷ nombre d'années.",
          steps: ["72 ÷ " + n + " = " + fr(rd(72 / n, 1), 1) + " %", "Exact : " + fr(rd(ex, 1), 1) + " %, la règle suffit en case"] }); }
      if (v === 1) { var g = r.p([6, 8, 9, 12, 18, 24]), y = Math.log(2) / Math.log(1 + g / 100);
        return out({ p: { g: g }, q: "Croissance de " + g + " % par an. En combien d'années la valeur double-t-elle ?", ans: y, unit: "ans", tol: { rel: 0.08, label: "±8 %" }, rule: "Règle de 72 : années pour doubler ≈ 72 ÷ taux.",
          steps: ["72 ÷ " + g + " = " + fr(rd(72 / g, 1), 1) + " ans", "Exact : " + fr(rd(y, 1), 1) + " ans"] }); }
      var k = r.p([[1.1, 2, 1.21], [1.1, 3, 1.331], [1.1, 5, 1.6105], [1.15, 5, 2.0114], [1.2, 5, 2.4883], [1.25, 5, 3.0518], [1.2, 2, 1.44], [1.15, 2, 1.3225]]);
      return out({ p: { b: k[0], n: k[1] }, q: fr(k[0]) + "^" + k[1] + " ≈ ? (2 décimales)", ans: k[2], unit: "", tol: { abs: 0.03, label: "±0,03" }, rule: "Repère à connaître par cœur. Pour le retrouver, ajoute " + fr(rd((k[0] - 1) * 100, 0)) + " % à chaque étape en arrondissant.",
        steps: (function () { var st = [], a = k[0]; for (var i = 2; i <= k[1]; i++) { var prev = rd(a, 2); a = prev * k[0]; st.push(fr(k[0]) + "^" + i + " ≈ " + fr(prev, 2) + " + " + fr(rd(prev * (k[0] - 1), 2), 2) + " ≈ " + fr(rd(a, 2), 2)); } return st; })() }); });
})();
