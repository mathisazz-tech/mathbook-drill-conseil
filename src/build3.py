import pathlib, json, hashlib
d=pathlib.Path(__file__).parent; out=d/'dist'; out.mkdir(exist_ok=True)
h=(d/'app3.html').read_text()
for tag,f in [('CATALOG','catalog.js'),('LESSONS','lessons.js'),('REFLEXES','reflexes.js'),('EXPLAIN','explain.js'),('TIPS','tips.js'),('ENGINE','engine.js'),('APP','app.js')]:
    h=h.replace('/*%s*/'%tag,(d/f).read_text())
(out/'index.html').write_text(h)
ver=hashlib.sha1(h.encode()).hexdigest()[:10]
(out/'manifest.webmanifest').write_text(json.dumps({"name":"MathDrill","short_name":"MathDrill","description":"Calcul de case : réflexes MathBook, mécanismes, Deal","start_url":"./","scope":"./","display":"standalone","background_color":"#f6f5f2","theme_color":"#1f5eff","lang":"fr","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},ensure_ascii=False,indent=1))
sw="""// MathDrill service worker : hors ligne. Version %s
var CACHE='mathdrill-%s';
var FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
// réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau (métro)
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp);});return r;}).catch(function(){return caches.match(e.request,{ignoreSearch:true}).then(function(m){return m||caches.match('index.html');});}));});
""" % (ver,ver)
(out/'sw.js').write_text(sw)
(out/'.nojekyll').write_text('')
from PIL import Image, ImageDraw, ImageFont
def icon(sz,path,pad=0):
    im=Image.new('RGB',(sz,sz),'#1f5eff'); dr=ImageDraw.Draw(im)
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(sz*0.42))
    t='×÷'; w,hh=dr.textbbox((0,0),t,font=f)[2:]
    dr.text(((sz-w)/2,(sz-hh)/2-sz*0.05),t,font=f,fill='white')
    f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(sz*0.13))
    t2='DRILL'; w2,h2=dr.textbbox((0,0),t2,font=f2)[2:]
    dr.text(((sz-w2)/2,sz*0.7),t2,font=f2,fill='#cfdcff')
    im.save(out/path)
icon(192,'icon-192.png'); icon(512,'icon-512.png'); icon(180,'apple-touch-icon.png')
print(len(h), ver)
