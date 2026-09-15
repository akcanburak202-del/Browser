/* Gerçek tıklamalarla ders/konu gezinmesi ve eski kayıt taşıma. */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.STUDYOS_CHROMIUM||undefined,args:process.env.STUDYOS_CHROMIUM?['--no-sandbox','--disable-dev-shm-usage','--no-zygote']:[]});
const p=await browser.newPage({viewport:{width:1024,height:768}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const url=new URL('../index.html',import.meta.url).href;
await p.goto(url);await p.waitForFunction(()=>typeof openApp==='function');
let count=0;const check=(name,condition)=>{assert.ok(condition,name);console.log('✓ '+name);count++;};
try{
 await p.evaluate(()=>{
  for(const w of WINS.values())closeWin(w);
  DB=blank();DB.courses=[{id:'d',name:'Dahiliye',color:'#5178db'},{id:'p',name:'Pediatri',color:'#42ad9a'}];
  DB.topics=[{id:'r',courseId:'d',parentId:null,name:'Romatoloji',status:'new'},{id:'o',courseId:'d',parentId:null,name:'Onkoloji',status:'new'},{id:'a',courseId:'d',parentId:'r',name:'İlaçlar',status:'new'}];
  DB.quizzes=[{id:'q',name:'TUS Romatoloji — Antiromatizmal ilaçlar',courseId:'d',topicId:'r',questions:[{q:'Sentetik soru?',ch:['a','b','c','d','e'],a:0,ex:'Test',topicId:'a'}]},
   {id:'old',name:'Eski karma test',courseId:'d',questions:[{q:'Eski soru',ch:['a','b'],a:0}]}];
  DB.decks=[{id:'deck',name:'Romatoloji — İlaçlar',courseId:'d',topicId:'r'},{id:'olddeck',name:'Eski deste',courseId:'d'}];
  DB.cards=[{id:'c',deckId:'deck',front:'Kart önü',back:'Kart arkası',due:today(),ef:2.7,int:9,reps:3,seen:addDays(today(),-1)},
   {id:'oldc',deckId:'olddeck',front:'Eski kart',back:'Eski cevap',due:addDays(today(),4),ef:2.6,int:12,reps:4,seen:addDays(today(),-2)}];
  saveNow();const w=openApp('quiz');applySnap(w,'max');
 });
 check('Quiz ilk ekranda dersleri gösterir',await p.locator('[data-lcourse]').count()===2&&await p.locator('[data-r]').count()===0);
 await p.click('[data-lcourse="d"]');check('Dahiliye seçilince ana konular gelir',await p.locator('[data-ltopic="r"]').count()===1&&await p.locator('[data-ltopic="o"]').count()===1);
 await p.click('[data-ltopic="r"]');check('Romatoloji yalnız ilgili testi gösterir',await p.locator('[data-r="q"]').count()===1&&await p.locator('[data-r="old"]').count()===0);
 await p.click('[data-r="q"]');await p.click('[data-a="back"]');check('Çözümden çıkınca aynı konuya dönülür',await p.locator('[data-r="q"]').count()===1);
 await p.click('[data-nav="course"]');await p.click('[data-ltopic=""]');
 check('Eski bağlantısız test kaybolmaz',await p.locator('[data-r="old"]').count()===1);
 await p.click('[data-bulk]');await p.check('[data-f="ids"] input[value="old"]');await p.click('#modalok');
 await p.waitForSelector('[data-f="course"]');await p.selectOption('[data-f="course"]','d');await p.click('#modalok');
 await p.waitForSelector('[data-f="topic"]');await p.selectOption('[data-f="topic"]','r');await p.click('#modalok');
 await p.waitForFunction(()=>DB.quizzes.find(x=>x.id==='old').topicId==='r');
 check('Toplu konu atama testi doğru listeye taşır',await p.locator('[data-r="old"]').count()===1&&await p.locator('[data-r="q"]').count()===1);
 check('Toplu atamadan önce anlık görüntü alınır',await p.evaluate(async()=>(await snapAll()).some(s=>s.reason==='konu-atama')));
 p.once('dialog',d=>d.accept('Yeni test'));
 await p.click('[data-newitem]');
 check('Yeni test seçili ders ve ana konuyu alır',await p.evaluate(()=>{const q=DB.quizzes.at(-1);return q.name==='Yeni test'&&q.courseId==='d'&&q.topicId==='r';}));
 await p.click('[data-a="back"]');
 await p.evaluate(()=>{for(const w of WINS.values())closeWin(w);const w=openApp('cards');applySnap(w,'max');});
 check('Kartlar da derslerle başlar',await p.locator('[data-lcourse]').count()===2);
 await p.click('[data-lcourse="d"]');await p.click('[data-ltopic="r"]');await p.click('[data-d="deck"]');
 check('Deste içeriği ve gezinme yolu birlikte görünür',await p.locator('[data-a="list"]').innerText().then(t=>t.includes('Kart önü'))&&await p.locator('[data-nav="topic"]').innerText()==='Romatoloji');
 await p.click('[data-nav="topic"]');p.once('dialog',d=>d.accept('Yeni deste'));await p.click('[data-newitem]');
 check('Yeni deste seçili ders ve ana konuyu alır',await p.evaluate(()=>{const d=DB.decks.at(-1);return d.name==='Yeni deste'&&d.courseId==='d'&&d.topicId==='r';}));
 await p.click('[data-nav="course"]');await p.click('[data-ltopic=""]');await p.click('[data-bulk]');
 await p.check('[data-f="ids"] input[value="olddeck"]');await p.click('#modalok');await p.waitForSelector('[data-f="course"]');await p.click('#modalok');
 await p.waitForSelector('[data-f="topic"]');await p.selectOption('[data-f="topic"]','r');await p.click('#modalok');
 await p.waitForFunction(()=>DB.decks.find(d=>d.id==='olddeck').topicId==='r');
 check('Eski deste taşınırken kart takvimi korunur',await p.evaluate(()=>{const c=DB.cards.find(c=>c.id==='oldc');return c.int===12&&c.reps===4&&c.ef===2.6&&c.due===addDays(today(),4);}));
 await p.click('[data-nav="home"]');await p.click('[data-due]');
 check('Bugünkü tekrarlar yalnız vadesi gelen kartlarla açılır',await p.evaluate(()=>{const w=[...WINS.values()].find(w=>w.appId==='cards');return w.state.mode==='study'&&w.state.queue.length===1&&w.state.queue[0]==='c';}));
 await p.click('[data-a="back"]');await p.click('[data-lcourse="d"]');await p.click('[data-ltopic="r"]');
 await p.fill('[data-libsearch]','Eski');check('Konu içinde arama çalışır',await p.locator('[data-d]').count()===1);await p.fill('[data-libsearch]','');
 for(const theme of ['light','dark']){
  await p.evaluate(theme=>{DB.settings.theme=theme;applySettings();},theme);
  for(const [width,height] of [[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>{const w=[...WINS.values()].find(w=>w.appId==='cards');applySnap(w,'max');});
   check(`${theme} ${width}×${height}: gezinme ve eylemler pencereye sığar`,await p.evaluate(()=>{const body=document.querySelector('.win .body')||document.querySelector('.library');return [...document.querySelectorAll('.library-path button,[data-d],[data-due]')].every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;});}));
  }
 }
 if(process.env.STUDYOS_SCREENSHOTS){fs.mkdirSync(process.env.STUDYOS_SCREENSHOTS,{recursive:true});await p.screenshot({path:process.env.STUDYOS_SCREENSHOTS+'/kartlar.png'});}
 await p.evaluate(()=>saveNow());await p.reload();await p.waitForFunction(()=>typeof DB!=='undefined');
 check('Yeniden açılışta konu bağlantısı ve tekrar tarihi korunur',await p.evaluate(()=>DB.decks.find(d=>d.id==='olddeck').topicId==='r'&&DB.cards.find(c=>c.id==='oldc').int===12));
 check('Tarayıcıda JavaScript hatası yok',errors.length===0);
 console.log(`\n${count} kütüphane arayüz testi geçti`);
}finally{await browser.close();}
