/* Not kütüphanesi: gerçek gezinme, paket alımı, düzenleme ve veri koruma. */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.STUDYOS_CHROMIUM||undefined,args:process.env.STUDYOS_CHROMIUM?['--no-sandbox','--disable-dev-shm-usage','--no-zygote']:[]});
const p=await browser.newPage({viewport:{width:1024,height:768}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
let count=0;const check=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const state=()=>p.evaluate(()=>[...WINS.values()].find(w=>w.appId==='notes').state);
try{
 await p.goto(new URL('../index.html',import.meta.url).href);
 await p.waitForFunction(()=>typeof openApp==='function');
 await p.evaluate(async()=>{
  for(const w of WINS.values())closeWin(w);
  DB=blank();DB.courses=[{id:'d',name:'Dahiliye',color:'#5178db'},{id:'p',name:'Pediatri',color:'#42ad9a'}];
  DB.topics=[{id:'r',courseId:'d',parentId:null,name:'Romatoloji',status:'new'},{id:'o',courseId:'d',parentId:null,name:'Onkoloji',status:'new'}];
  const base={courseId:'d',created:today(),updated:today()};
  DB.notes=[{...base,id:'other',topicId:'o',title:'Özet',body:'Onkoloji özeti'},
   {...base,id:'note',topicId:'r',title:'Romatoloji — İlaçlar',body:'# İlaçlar\n\nSentetik içerik [[Özet]]\nSoru :: Cevap'},
   {...base,id:'target',topicId:'r',title:'Özet',body:'Romatoloji özeti'},
   {...base,id:'old',title:'Eski not',body:'Eski içerik'},
   {...base,id:'orphan',courseId:'silinmiş',title:'Derssiz not',body:'Görünür kalmalı'}];
  const ref=await putMedia(new Blob(['ek içeriği'],{type:'text/plain'}));DB.notes.find(n=>n.id==='old').att=[{ref,name:'ek.txt'}];
  saveNow();const w=openApp('notes');applySnap(w,'max');
 });
 check('Notlar ilk açılışta derslerle başlar',await p.locator('[data-lcourse]').count()===3&&await p.locator('[data-n]').count()===0);
 await p.click('[data-lcourse="d"]');check('Ders seçilince ana konular gelir',await p.locator('[data-ltopic="r"]').count()===1&&await p.locator('[data-ltopic="o"]').count()===1);
 await p.click('[data-ltopic="r"]');check('Konu yalnız kendi notlarını gösterir',await p.locator('[data-n]').count()===2&&await p.locator('[data-n="other"]').count()===0);
 await p.fill('[data-libsearch]','sentetik');check('Not gövdesinde arama çalışır',await p.locator('[data-n]').count()===1);await p.fill('[data-libsearch]','');
 await p.click('[data-n="note"]');check('Not önizlemesi ve konu yolu açılır',await p.locator('.md-prev').innerText().then(x=>x.includes('Sentetik içerik'))&&await p.locator('[data-nav="topic"]').innerText()==='Romatoloji');
 check('Editörün yan listesi aynı konuyla sınırlıdır',await p.locator('.sidebar [data-id]').count()===2);
 await p.click('[data-wl="Özet"]');check('Aynı adlı not bağlantısı kendi konusuna gider',(await state()).id==='target');
 check('Geri bağlantı doğru notta görünür',await p.locator('[data-bl="note"]').count()===1);
 await p.click('[data-bl="note"]');await p.click('[data-a="prev"]');
 await p.fill('[data-a="body"]','# Düzenlendi\n\nSoru :: Cevap\n[[Özet]]');await p.click('[data-nav="topic"]');
 check('Editörden geri dönünce aynı not listesi açılır',await p.locator('[data-n="note"]').count()===1&&(await state()).id===null);
 await p.click('[data-n="note"]');check('Düzenlenen metin korunur',await p.locator('.md-prev').innerText().then(x=>x.includes('Düzenlendi')));
 await p.click('[data-a="tocards"]');check('Nottan üretilen deste ders ve konuyu devralır',await p.evaluate(()=>DB.decks[0].courseId==='d'&&DB.decks[0].topicId==='r'&&DB.cards.length===1));
 await p.click('[data-nav="topic"]');p.once('dialog',d=>d.accept('Yeni konu notu'));await p.click('[data-newitem]');
 check('Yeni not seçili ders ve ana konuyu devralır',await p.evaluate(()=>DB.notes.at(-1).courseId==='d'&&DB.notes.at(-1).topicId==='r')&&await p.locator('[data-a="body"]').count()===1);
 await p.click('[data-a="new"]');check('Editörden yeni not aynı konuyu devralır',await p.evaluate(()=>DB.notes.at(-1).topicId==='r'));
 await p.selectOption('[data-a="course"]','p');check('Ders değişince eski konu bağı temizlenir',await p.evaluate(()=>DB.notes.at(-1).courseId==='p'&&DB.notes.at(-1).topicId===null));
 await p.click('[data-nav="home"]');await p.click('[data-lcourse="d"]');await p.click('[data-ltopic=""]');
 check('Bağlantısız eski not görünür kalır',await p.locator('[data-n="old"]').count()===1);
 const old=await p.evaluate(()=>JSON.stringify(DB.notes.find(n=>n.id==='old')));
 await p.click('[data-bulk]');await p.check('[data-f="ids"] input[value="old"]');await p.click('#modalok');
 await p.waitForSelector('[data-f="course"]');await p.click('#modalok');await p.waitForSelector('[data-f="topic"]');await p.selectOption('[data-f="topic"]','r');await p.click('#modalok');
 await p.waitForFunction(()=>DB.notes.find(n=>n.id==='old').topicId==='r');
 check('Toplu taşıma sonrası not doğru konu listesinde',await p.locator('[data-n="old"]').count()===1&&await p.locator('[data-n="note"]').count()===1);
 check('Taşıma içerik, kimlik, ek ve tarihleri korur',await p.evaluate(old=>{const expected=JSON.parse(old);expected.topicId='r';return JSON.stringify(DB.notes.find(n=>n.id==='old'))===JSON.stringify(expected);},old));
 check('Taşıma öncesi anlık görüntü alındı',await p.evaluate(async()=>(await snapAll()).some(s=>s.reason==='konu-atama')));
 p.once('dialog',d=>d.accept());await p.click('[data-x="old"]');check('Listeden silinen not çöpte konu ve ekiyle durur',await p.evaluate(()=>{const x=DB.trash.find(x=>x.type==='note'&&x.data.id==='old');return x?.data.topicId==='r'&&x.data.att.length===1&&!DB.notes.some(n=>n.id==='old');}));
 await p.evaluate(()=>{const entry=DB.trash.find(x=>x.data.id==='old');restoreTrash(entry.id);saveAnd('notes');});
 check('Çöpten geri alınan notun eki okunabilir',await p.evaluate(async()=>!!(await mediaBlob(DB.notes.find(n=>n.id==='old').att[0].ref))));
 await p.click('[data-nav="home"]');await p.click('[data-lcourse=""]');await p.click('[data-ltopic=""]');await p.click('[data-n="orphan"]');
 check('Dersi silinmiş not da açılır',await p.locator('.md-prev').innerText().then(x=>x.includes('Görünür kalmalı')));
 await p.evaluate(()=>{paketUygula({studyosPaket:2,ders:'Dahiliye',anaKonu:'Romatoloji',konular:[],notlar:[{baslik:'Paket notu',icerik:'# Paket içeriği'}]});saveAnd('notes');openNote(DB.notes.at(-1).id,true);});
 check('Paket notu doğrudan doğru ders ve konuyla açılır',(await state()).libTopic==='r');
 await p.click('[data-nav="topic"]');
 for(const theme of ['light','dark'])for(const [width,height] of [[768,1024],[1024,768]]){
  await p.setViewportSize({width,height});await p.evaluate(theme=>{DB.settings.theme=theme;applySettings();applySnap([...WINS.values()].find(w=>w.appId==='notes'),'max');},theme);
  check(`${theme} ${width}×${height}: not listesi ve gezinme sığar`,await p.evaluate(()=>[...document.querySelectorAll('.library-path button,[data-n],[data-bulk]')].every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})));
  await p.click('[data-n="note"]');
  check(`${theme} ${width}×${height}: editör ve eylemler sığar`,await p.evaluate(()=>[...document.querySelectorAll('.library-path button,[data-a="prev"],[data-a="move"],.md-prev')].every(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})));
  if(process.env.STUDYOS_SCREENSHOTS){fs.mkdirSync(process.env.STUDYOS_SCREENSHOTS,{recursive:true});await p.screenshot({path:`${process.env.STUDYOS_SCREENSHOTS}/notlar-${theme}-${width}.png`});}
  await p.click('[data-nav="topic"]');
 }
 await p.evaluate(()=>saveNow());await p.reload();await p.waitForFunction(()=>typeof openApp==='function');
 check('Yeniden açılışta notun konusu ve metni korunur',await p.evaluate(()=>DB.notes.find(n=>n.id==='old').topicId==='r'&&DB.notes.find(n=>n.id==='note').body.includes('Düzenlendi')));
 check('JavaScript hatası yok',errors.length===0);
 console.log(`\n${count} not arayüz testi geçti`);
}finally{await browser.close();}
