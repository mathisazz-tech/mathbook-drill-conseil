const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const errs = [];
  function watch(pg) { pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); }
  const U = 'http://localhost:8777/';
  const SH = 'shots/';
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const pg = await ctx.newPage(); watch(pg);
  await pg.goto(U); await pg.waitForSelector('#goAdaptive');
  const w = await pg.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
  ok(w[0] === 390 && w[1] <= 390, 'T09 viewport 390 px sans scroll horizontal (' + w + ')');
  ok((await pg.textContent('#saveBadge')).includes('Sauvegardé'), 'Badge sauvegarde visible');
  await pg.screenshot({ path: SH + '01_accueil.png', fullPage: true });

  async function typeAns(p, it) {
    const s = (Math.round(Math.abs(it.v) * 1e4) / 1e4).toString().replace('.', ',');
    for (const ch of s) await p.click('#zone .pad button[data-k="' + ch + '"]');
    if (it.v < 0) await p.click('#zone .pad button[data-k="±"]');
    if (it.scale) await p.click('#zone .units button[data-u="' + it.unit + '"]');
  }
  async function answer(p, right) {
    if (await p.$('#introGo')) await p.click('#introGo');
    const it = await p.evaluate(() => { const c = __MD.cur(); return { ans: c.ans, type: c.type, scale: c.scale, unit: c.unit, pid: __MD.slot() && __MD.slot().pid }; });
    if (await p.$('#zone .opt[data-p]')) { await p.click('#zone .opt[data-p="' + it.pid + '"]'); await p.waitForSelector('#zone .pad, #zone .opt[data-i]'); }
    if (it.type === 'mcq') { await p.click('#zone .opt[data-i="' + (right ? it.ans : (it.ans + 1) % 4) + '"]'); return it; }
    it.v = right ? it.ans : it.ans * 1.37 + 3;
    await typeAns(p, it);
    await p.click('#zone .pad button[data-k="OK"]');
    return it;
  }
  await pg.click('#goAdaptive');
  let shotDone = false;
  for (let i = 0; i < 5; i++) {
    const it = await answer(pg, i !== 2);
    await pg.waitForSelector('#nextBtn');
    const t = await pg.textContent('#runBody .res');
    ok(i === 2 ? t.includes('✗') : t.includes('✓'), 'Q' + (i + 1) + ' (' + it.pid + ') jugée ' + (i === 2 ? 'fausse' : 'juste'));
    const body = await pg.textContent('#runBody');
    ok(['Méthode pas à pas', 'À quoi ça sert en case', "Cas d'usage", 'Formule'].every(x => body.includes(x)), '   correction complète (méthode, usage en case, cas d\'usage, formule)');
    ok(!/\b[MCDSR]\d\d\b/.test(body), '   aucun code de pattern affiché');
    if (!shotDone) { await pg.screenshot({ path: SH + '03_correction.png', fullPage: true }); shotDone = true; }
    if (i === 1) {
      await pg.click('#nextBtn'); await pg.waitForTimeout(200);
      await pg.screenshot({ path: SH + '02_question.png' });
      await pg.reload(); await pg.waitForSelector('#goAdaptive');
      ok(!!(await pg.$('#resume')), 'T06 séance interrompue proposée à la reprise');
      await pg.click('#resume'); continue;
    }
    await pg.click('#nextBtn');
  }
  await pg.waitForSelector('#again');
  await pg.screenshot({ path: SH + '04_bilan.png', fullPage: true });
  const n1 = await pg.evaluate(() => __MD.S().events.length);
  ok(n1 === 5, 'Séance : 5 réponses enregistrées (' + n1 + ')');

  const state = await ctx.storageState(); await ctx.close();
  const ctx2 = await b.newContext({ ...devices['iPhone 13'], storageState: state }); const pg2 = await ctx2.newPage(); watch(pg2);
  await pg2.goto(U); await pg2.waitForSelector('#goAdaptive');
  ok(await pg2.evaluate(() => __MD.S().events.length) === 5, 'T07 progression intacte après fermeture et réouverture');

  await pg2.click('nav button[data-v="deal"]'); await pg2.click('#modList button[data-m="k2"]');
  ok(await pg2.isDisabled('#modGo'), 'T11 exercices Deal bloqués avant le cours');
  await pg2.click('#modBody [data-q="0"] button[data-o="2"]'); await pg2.click('#modBody [data-q="1"] button[data-o="0"]');
  ok(!(await pg2.isDisabled('#modGo')), 'T11 cours validé, exercices débloqués');
  await pg2.screenshot({ path: SH + '05_cours_deal.png', fullPage: true });

  await pg2.click('nav button[data-v="home"]'); await pg2.click('#ctxSeg button[data-c="table"]'); await pg2.click('#goChain');
  await pg2.waitForSelector('#zone .pad'); await pg2.screenshot({ path: SH + '06_chaine.png', fullPage: true });
  for (let i = 0; i < 4; i++) {
    const it = await pg2.evaluate(() => { const c = __MD.cur(); return c && { ans: c.ans, scale: c.scale, unit: c.unit }; }); if (!it) break;
    it.v = it.ans; await typeAns(pg2, it); await pg2.click('#zone .pad button[data-k="OK"]');
    await pg2.waitForSelector('#nextBtn'); ok((await pg2.textContent('#runBody .res')).includes('✓'), 'Mini-case enchaîné, étape ' + (i + 1) + ' juste');
    await pg2.click('#nextBtn'); if (await pg2.$('#again')) break;
  }
  await pg2.waitForSelector('#toHome'); await pg2.click('#toHome');
  await pg2.evaluate(() => { __MD.S().seen.C18 = 1; });
  await pg2.click('#famList button[data-f="C"]'); await pg2.click('#patList button[data-p="C18"]'); await pg2.click('#lessonGo');
  let negSeen = false;
  for (let k = 0; k < 5; k++) {
    if (await pg2.$('#zone .opt[data-p]')) { await pg2.click('#zone .opt[data-p="C18"]'); await pg2.waitForSelector('#zone .pad'); }
    const it = await pg2.evaluate(() => { const c = __MD.cur(); return { ans: c.ans, scale: c.scale, unit: c.unit }; }); it.v = it.ans;
    await typeAns(pg2, it); if (it.ans < 0 && !negSeen) { negSeen = true; await pg2.screenshot({ path: SH + '07_saisie_negative.png' }); }
    await pg2.click('#zone .pad button[data-k="OK"]'); await pg2.waitForSelector('#nextBtn');
    ok((await pg2.textContent('#runBody .res')).includes('✓'), 'Saisie ' + (it.ans < 0 ? 'NÉGATIVE ' : '') + (Math.round(it.ans * 100) / 100) + ' acceptée');
    await pg2.click('#nextBtn');
  }
  ok(negSeen, 'Au moins une réponse négative saisie avec la touche ±');

  await pg2.waitForSelector('#again');
  await pg2.click('nav button[data-v="save"]');
  const bk = await pg2.evaluate(() => JSON.stringify({ format: 'mathbook-drill-history', version: 3, events: __MD.S().events }));
  await pg2.fill('#impTxt', bk); await pg2.click('#impGo');
  ok((await pg2.textContent('#impMsg')).startsWith('0 réponse'), 'T12 réimport : 0 ajout, doublons ignorés');
  const [dl] = await Promise.all([pg2.waitForEvent('download', { timeout: 5000 }).catch(() => null), pg2.click('#bkFile')]);
  ok(!!dl, 'Fichier de sauvegarde téléchargé' + (dl ? ' (' + dl.suggestedFilename() + ')' : ''));
  if (dl) { const pth = await dl.path(); const txt = require('fs').readFileSync(pth, 'utf8'); const o = JSON.parse(txt); ok(o.events.length === await pg2.evaluate(() => __MD.S().events.length) && o.concepts && o.concepts.k2, '   le fichier contient toutes les réponses et le cours validé'); }
  await pg2.screenshot({ path: SH + '08_sauvegarde.png', fullPage: true });
  await pg2.click('nav button[data-v="prog"]'); await pg2.screenshot({ path: SH + '09_suivi.png', fullPage: true });

  const ctx3 = await b.newContext({ ...devices['iPhone 13'] });
  await ctx3.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; });
  const pg3 = await ctx3.newPage(); await pg3.goto(U); await pg3.waitForSelector('#goAdaptive');
  ok((await pg3.textContent('#saveBadge')).includes('Non sauvegardé') && (await pg3.textContent('#storeBanner')).length > 10, 'T08 stockage bloqué : alerte visible');
  await pg3.screenshot({ path: SH + '10_alerte_stockage.png' });

  const ctx4 = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }); const pg4 = await ctx4.newPage(); watch(pg4);
  await pg4.goto(U); await pg4.waitForSelector('#goAdaptive'); await pg4.click('#goAdaptive'); if (await pg4.$('#introGo')) await pg4.click('#introGo');
  const sw = await pg4.evaluate(() => document.documentElement.scrollWidth); ok(sw <= 320, '320 px sans scroll horizontal (' + sw + ')'); await pg4.screenshot({ path: SH + '11_320px.png' });
  ok(errs.length === 0, 'Aucune erreur console ' + (errs.length ? JSON.stringify(errs.slice(0, 3)) : ''));
  console.log(fails ? fails + ' FAIL' : 'ALL PASS'); await b.close();
})();
