const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const pg = await ctx.newPage();
 await pg.goto('http://localhost:8777/'); await pg.evaluate(() => navigator.serviceWorker.ready); await pg.reload(); await pg.waitForTimeout(800);
 await ctx.setOffline(true); await pg.reload(); const okk = !!(await pg.$('#goAdaptive'));
 await pg.click('#goAdaptive'); if (await pg.$('#introGo')) await pg.click('#introGo'); const pad = !!(await pg.$('#zone .pad, #zone .opt'));
 console.log((okk && pad ? 'PASS' : 'FAIL') + ' hors ligne : l\'app se recharge et lance une séance sans réseau'); await b.close(); })();
