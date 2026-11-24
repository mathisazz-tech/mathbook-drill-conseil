global.DRILL=require('./catalog.js'); global.LESSONS=require('./lessons.js'); require('./reflexes.js'); global.EXPLAIN=require('./explain.js'); global.TIPS=require('./tips.js'); const E=require('./engine.js');
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)fails++;};
// T01
ok(['+70','-5','−5','+0,5'].map(E.parseNum).join()==='70,-5,-5,0.5','T01 signes acceptés');
ok(E.judge({ans:70,tol:DRILL.T.EX,lvl:'A'},'+70').res==='ok' && E.judge({ans:-5,tol:DRILL.T.EX,lvl:'A'},'−5').res==='ok','T01 judge signé');
// T02 C26 fixed values
const G=DRILL.G; // build C26 item manually through explain wrapper by finding a seed with I=12 flows 3/5/5/7
let found=null; for(let s=1;s<200000 && !found;s++){const it=DRILL.generate('C26',s); if(it.cums && it.p.I===12 && it.p.f.join()==='3,5,5,7') found=it;}
ok(found && found.cums.join()==='-9,-4,1,8' && Math.abs(found.ans-2.8)<1e-9, 'T02 C26 cumuls −9/−4/+1/+8 payback 2,8');
if(found) console.log('   ', EXPLAIN.stepsOf(found).join(' | '));
// T03/T04 mastery
const DAY=864e5, t0=Date.parse('2026-11-20T10:00:00Z');
const mk=(pid,day,res,mode,t)=>({id:pid+day+Math.random(),pid,ts:t0+day*DAY+Math.random()*1000,res,mode:mode||'metro',t:t||10,hint:false});
let ev=[mk('M02',0,'ok'),mk('M02',1,'ok'),mk('M02',2,'ok')];
ok(E.fold(ev,{})['M02'].status==='green','T03 M02 vert sans mode transfert');
ev=[mk('R10',0,'ok'),mk('R10',1,'ok'),mk('R10',2,'ok')]; ok(E.fold(ev,{})['R10'].status==='green','T03b réflexe R vert');
ev=[mk('D01',0,'ok',0,30),mk('D01',1,'ok',0,30),mk('D01',2,'ok',0,30)];
ok(E.fold(ev,{conceptOk:()=>false})['D01'].status!=='green','T04 D01 pas vert sans cours');
ok(E.fold(ev,{conceptOk:()=>true})['D01'].status==='green','T04 D01 vert avec cours validé');
ev=[mk('C07',0,'ok'),mk('C07',1,'ok'),mk('C07',2,'ok')]; ok(E.fold(ev,{})['C07'].status!=='green','C07 exige un transfert');
ev.push(mk('C07',3,'ok','hidden')); ok(E.fold(ev,{})['C07'].status==='green','C07 vert après transfert');
// T05 consolidation D01 -> C32
ev=[mk('D01',0,'ko'),mk('D01',1,'ko'),mk('C32',1,'ok')]; const sk=E.foldSkills(ev,{});
ok(sk.C32 && sk.C32.n===3 && sk.C32.members.length===2 && E.fold(ev,{}).D01.n===2,'T05 D01 nourrit C32 sans double comptage');
// T12 export/import x2
const all=[mk('M02',0,'ok'),mk('C07',1,'ko')]; const js=E.exportJSON(all,null);
let r=E.importJSON(js,[]); ok(r.added===2,'T12 import 1'); r=E.importJSON(js,r.events); ok(r.added===0&&r.dup===2,'T12 import 2 sans doublon');
// oracle: every generator answer accepted, x10 rejected
let bad=0; for(const id of Object.keys(DRILL.CAT)) for(let s=1;s<=200;s++){const it=DRILL.generate(id,s); if(it.type==='mcq') continue; const u=it.scale?it.unit:null;
 if(E.judge(it,String(it.ans).replace('.',','),u).res!=='ok') {bad++; if(bad<5) console.log('reject',id,s,it.ans);} 
 if(it.ans!==0 && E.judge(it,String(it.ans*10),u).res==='ok' && !(it.tol&&it.tol.abs>=Math.abs(it.ans*9))) {bad++; if(bad<5)console.log('x10 accepted',id,s,it.ans);} }
ok(bad===0,'Oracle : '+Object.keys(DRILL.CAT).length+' patterns × 200 seeds, bonne réponse acceptée, ×10 refusée');
// R oracle independent check
const ind={R01:p=>p.n*p.k,R03:p=>p.n*p.k,R04:p=>p.x*p.y,R05:p=>p.n*11,R06:p=>p.n*p.n,R07:p=>p.x*p.y,R08:p=>p.n*p.n,R10:p=>p.a*p.b,R13:p=>p.a*p.b,R15:p=>p.a-p.b,R17:p=>p.n/p.k,R18:p=>p.n/p.b,R19:p=>p.n/p.b,R21:p=>p.N*p.t/100,R24:p=>(1/(1-p.t/100)-1)*100,R25:p=>p.a*p.d/p.b,R29:p=>p.a*p.b*p.c/1e4,R32:p=>(1-Math.pow(1-p.p/100,p.n))*100};
let b2=0; for(const id in ind) for(let s=1;s<=300;s++){const it=DRILL.generate(id,s); if(Math.abs(ind[id](it.p)-it.ans)>1e-6*Math.max(1,Math.abs(it.ans))) {b2++; console.log('oracle',id,s,it.ans,ind[id](it.p));break;}}
ok(b2===0,'Oracle indépendant des réflexes R');
console.log(fails?fails+' FAIL':'ALL PASS');
