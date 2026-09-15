/* Sözlük gezinmesi, bağlama göre tanım ve eski kayıt koruması. Sentetik içerik. */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.STUDYOS_CHROMIUM||undefined,args:process.env.STUDYOS_CHROMIUM?['--no-sandbox','--disable-dev-shm-usage','--no-zygote']:[]});
const p=await browser.newPage({viewport:{width:1024,height:768}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
let count=0;const check=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const open=app=>p.evaluate(app=>{for(const w of [...WINS.values()])closeWin(w);const w=openApp(app);applySnap(w,'max');},app);
try{
 await p.goto(new URL('../index.html',import.meta.url).href);await p.waitForFunction(()=>typeof openApp==='function');
 await p.evaluate(()=>{
  DB=blank();DB.courses=[{id:'d',name:'Dahiliye',color:'#5178db'},{id:'p',name:'Pediatri',color:'#42ad9a'}];
  DB.topics=[{id:'r',courseId:'d',parentId:null,name:'Romatoloji',status:'new'},{id:'o',courseId:'d',parentId:null,name:'Onkoloji',status:'new'},{id:'a',courseId:'d',parentId:'r',name:'Alt konu',status:'new'}];
  DB.terms=[{id:'tr',term:'Deney',alt:['Deneme'],def:'Romatoloji tanımı',courseId:'d',topicId:'r',noteId:'nr',img:null},
   {id:'to',term:'Deney',alt:['Deneme'],def:'Onkoloji tanımı',courseId:'d',topicId:'o',noteId:'',img:null},
   {id:'old',term:'Eski terim',alt:['Eski eş anlam'],def:'Eski tanım',courseId:'d',noteId:'nr',img:null},
   {id:'orphan',term:'Derssiz',def:'Derssiz tanım',alt:[],courseId:'yok',noteId:'',img:null}];
  DB.notes=[{id:'nr',title:'Romatoloji notu',body:'Deney ve Deneme',courseId:'d',topicId:'r',created:today(),updated:today()},
   {id:'no',title:'Onkoloji notu',body:'Deney',courseId:'d',topicId:'o',created:today(),updated:today()}];
  DB.decks=[{id:'dk',name:'Deney destesi',courseId:'d',topicId:'r'}];DB.cards=[{id:'c',deckId:'dk',front:'Deney',back:'Sentetik',due:today(),ef:2.5,int:0,reps:0}];
  DB.quizzes=[{id:'q',name:'Deney testi',courseId:'d',topicId:'r',questions:[{q:'Deney?',ch:['Deney','Diğer'],a:0,ex:'Sentetik',topicId:'a'}]}];
  buildTerms();saveNow();
 });
 await open('glossary');check('Sözlük derslerle açılır',await p.locator('[data-lcourse]').count()===3);
 await p.click('[data-lcourse="d"]');check('Ders altında ana konular görünür',await p.locator('[data-ltopic="r"]').count()===1&&await p.locator('[data-ltopic="o"]').count()===1);
 await p.click('[data-ltopic="r"]');check('Terim listesi konuya göre ayrılır',await p.locator('[data-term-edit="tr"]').count()===1&&await p.locator('[data-term-edit="to"]').count()===0);
 await p.fill('[data-libsearch]','Deneme');check('Eş anlamla arama çalışır',await p.locator('[data-term-edit]').count()===1);await p.fill('[data-libsearch]','');
 await p.click('[data-term-edit="tr"]');check('Terim düzenleyicisi doğru konuyu gösterir',await p.inputValue('[data-f="topic"]')==='r'&&await p.inputValue('[data-f="note"]')==='nr');
 await p.fill('[data-f="def"]','Güncel Romatoloji tanımı');await p.click('[data-a="save"]');
 check('Kaydet aynı konu listesine döner',await p.locator('[data-term-edit="tr"]').count()===1&&await p.evaluate(()=>DB.terms[0].def==='Güncel Romatoloji tanımı'));
 p.once('dialog',d=>d.accept('Yeni terim'));await p.click('[data-newitem]');await p.fill('[data-f="def"]','Yeni tanım');await p.click('[data-a="save"]');
 check('Yeni terim seçili ders ve konuyu devralır',await p.evaluate(()=>DB.terms.at(-1).courseId==='d'&&DB.terms.at(-1).topicId==='r'));
 await p.click('[data-nav="course"]');await p.click('[data-ltopic=""]');check('Eski bağlantısız terim erişilebilir',await p.locator('[data-term-edit="old"]').count()===1);
 const before=await p.evaluate(()=>JSON.stringify(DB.terms.find(t=>t.id==='old')));
 await p.click('[data-bulk]');await p.check('[data-f="ids"] input[value="old"]');await p.click('#modalok');await p.waitForSelector('[data-f="course"]');await p.click('#modalok');
 await p.waitForSelector('[data-f="topic"]');await p.selectOption('[data-f="topic"]','r');await p.click('#modalok');await p.waitForFunction(()=>DB.terms.find(t=>t.id==='old').topicId==='r');
 check('Toplu taşıma tanım, eş anlam ve not bağlantısını korur',await p.evaluate(before=>{const x=JSON.parse(before);x.topicId='r';return JSON.stringify(DB.terms.find(t=>t.id==='old'))===JSON.stringify(x);},before));
 check('Taşıma öncesinde anlık görüntü alınır',await p.evaluate(async()=>(await snapAll()).some(s=>s.reason==='konu-atama')));
 await p.click('[data-term-edit="old"]');await p.selectOption('[data-f="course"]','p');check('Ders değişimi eski konu seçimini temizler',await p.inputValue('[data-f="topic"]')==='');await p.click('[data-a="save"]');
 check('Taşınan terim yeni derste görünür',await p.locator('[data-nav="course"]').innerText()==='Pediatri');
 p.once('dialog',d=>d.accept());await p.click('[data-x="old"]');
 check('Terim silme geri alınabilir',await p.evaluate(()=>DB.trash.some(e=>e.type==='term'&&e.data.id==='old'&&e.data.noteId==='nr')));
 await p.evaluate(()=>{restoreTrash(DB.trash.find(e=>e.data.id==='old').id);buildTerms();save();refreshAll();});
 check('Çöpten dönen terim tekrar görünür',await p.locator('[data-term-edit="old"]').count()===1);
 await p.click('[data-nav="home"]');await p.click('[data-lcourse=""]');await p.click('[data-ltopic=""]');await p.click('[data-term-edit="orphan"]');
 check('Dersi silinmiş terim açılır ve yanlış ders seçilmez',await p.inputValue('[data-f="course"]')==='');
 await open('notes');await p.evaluate(()=>openNote('nr',true));
 check('Notun terim ve eş anlamı kendi konusunun kaydını seçer',await p.evaluate(()=>[...document.querySelectorAll('.gterm')].length===2&&[...document.querySelectorAll('.gterm')].every(x=>x.dataset.term==='tr')));
 await p.locator('.gterm').first().click();check('Balon doğru tanımı gösterir',await p.locator('#termpop').innerText().then(x=>x.includes('Güncel Romatoloji tanımı')));
 await p.click('[data-p="card"]');check('Terimden kart aynı ders ve konuda üretilir',await p.evaluate(()=>{const d=DB.decks.find(d=>d.name==='Sözlük');return d.courseId==='d'&&d.topicId==='r';}));
 await p.evaluate(()=>openNote('no',true));check('Diğer konunun notunda diğer tanım seçilir',await p.locator('.gterm').getAttribute('data-term')==='to');
 await p.locator('.gterm').click();await p.click('[data-p="card"]');check('Farklı konuların Sözlük desteleri karışmaz',await p.evaluate(()=>DB.decks.filter(d=>d.name==='Sözlük').length===2));
 await open('cards');await p.evaluate(()=>{const w=[...WINS.values()].find(w=>w.appId==='cards');Object.assign(w.state,{mode:'study',queue:['c'],show:false,done:0});APPS.cards.render(w);});
 check('Kart yüzündeki terim deste konusunu kullanır',await p.locator('.gterm').getAttribute('data-term')==='tr');
 await open('quiz');await p.click('[data-lcourse="d"]');await p.click('[data-ltopic="r"]');await p.click('[data-r="q"]');
 check('Quiz sorusu ve şıkları soru alt konusunun kökünü kullanır',await p.evaluate(()=>[...document.querySelectorAll('.gterm')].length===2&&[...document.querySelectorAll('.gterm')].every(x=>x.dataset.term==='tr')));
 await open('notes');await p.evaluate(()=>{DB.notes.push({id:'nx',title:'Bağlamsız',body:'Deney',courseId:null,created:today(),updated:today()});openNote('nx',true);});
 check('Bağlam yoksa aynı kelimenin kayıtları birbirini ezmez',await p.locator('.gterm').getAttribute('data-term')==='');
 await p.locator('.gterm').click();check('Belirsizlikte ders ve konu ile tanım seçimi sunulur',await p.locator('[data-term-pick]').count()===2&&await p.locator('#termpop').innerText().then(x=>x.includes('Romatoloji')&&x.includes('Onkoloji')));
 await p.click('[data-term-pick="to"]');check('Seçilen tanım açılır',await p.locator('#termpop').innerText().then(x=>x.includes('Onkoloji tanımı')));await p.click('[data-p="x"]');
 await open('glossary');await p.click('[data-lcourse="d"]');await p.click('[data-ltopic="r"]');
 for(const theme of ['light','dark'])for(const [width,height] of [[768,1024],[1024,768]]){
  await p.setViewportSize({width,height});await p.evaluate(theme=>{DB.settings.theme=theme;applySettings();applySnap([...WINS.values()].find(w=>w.appId==='glossary'),'max');},theme);
  check(`${theme} ${width}×${height}: sözlük listesi sığar`,await p.evaluate(()=>[...document.querySelectorAll('.library-path button,[data-term-edit]')].every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})));
  await p.click('[data-term-edit="tr"]');check(`${theme} ${width}×${height}: kaydet ve gezinme sığar`,await p.evaluate(()=>[...document.querySelectorAll('.library-path button,[data-a="save"],[data-a="cancel"]')].every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})));
  if(process.env.STUDYOS_SCREENSHOTS){fs.mkdirSync(process.env.STUDYOS_SCREENSHOTS,{recursive:true});await p.screenshot({path:`${process.env.STUDYOS_SCREENSHOTS}/sozluk-${theme}-${width}.png`});}
  await p.click('[data-a="cancel"]');
 }
 await p.evaluate(()=>saveNow());await p.reload();await p.waitForFunction(()=>typeof openApp==='function');
 check('Yeniden açılınca konu, tanım ve taşınan kayıt korunur',await p.evaluate(()=>DB.terms.find(t=>t.id==='tr').topicId==='r'&&DB.terms.find(t=>t.id==='tr').def==='Güncel Romatoloji tanımı'&&DB.terms.find(t=>t.id==='old').courseId==='p'));
 check('JavaScript hatası yok',errors.length===0);
 console.log(`\n${count} sözlük arayüz testi geçti`);
}finally{await browser.close();}
