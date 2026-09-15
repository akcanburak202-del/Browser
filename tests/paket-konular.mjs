/* Konu bağlantısı, eski veri ve paket/kanıt bütünlüğü. Test içerikleri sentetiktir. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx=vm.createContext({console,setTimeout,clearTimeout,setInterval,clearInterval,window:{addEventListener(){}},document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}}});
vm.runInContext([...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].slice(0,3).map(m=>m[1]).join('\n')+'\nglobalThis.T={blank,paketUygula,paketGecerli,konuKoku,icerikKonusu,konuAta,setDB:d=>DB=d};',ctx);
const T=ctx.T;let count=0;
const test=(name,fn)=>{fn();count++;console.log('✓ '+name);};
const pkg=()=>({studyosPaket:2,ad:'Test paketi',ders:'Test dersi',anaKonu:'Ana',konular:['Alt'],desteler:[{ad:'Deste',konu:'Ana',kartlar:[{on:'Sentetik kart?',arka:'Kart cevabı'}]}],testler:[{ad:'Test',konu:'Ana',sorular:[{s:'Sentetik soru?',secenekler:['a','b','c','d','e'],dogru:0,aciklama:'Test gerekçesi',konu:'Alt'}]}],terimler:[]});
let db=T.blank();T.setDB(db);const p=pkg();T.paketUygula(p);
const root=db.topics.find(t=>t.name==='Ana'),sub=db.topics.find(t=>t.name==='Alt');
test('Paket ders–ana konu–alt konu oluşturur',()=>assert.equal(sub.parentId,root.id));
test('Test ve deste ana konuya, soru alt konuya bağlanır',()=>{assert.equal(db.decks[0].topicId,root.id);assert.equal(db.quizzes[0].topicId,root.id);assert.equal(db.quizzes[0].questions[0].topicId,sub.id);});
test('Aynı dersteki farklı köklerin aynı adlı alt konuları ayrıdır',()=>{const p2=pkg();p2.anaKonu='Başka';p2.desteler[0].konu='Başka';p2.testler[0].konu='Başka';T.paketUygula(p2);assert.equal(db.topics.filter(t=>t.name==='Alt').length,2);assert.equal(db.decks.length,2);});
test('Bozuk v2 hiçbir kayıt yazmadan reddedilir',()=>{const before=JSON.stringify(db);const p2=pkg();p2.testler[0].sorular[0].dogru=0.5;assert.throws(()=>T.paketUygula(p2));assert.equal(JSON.stringify(db),before);});
test('Yanlış ders/konu ve eksik açıklama v2 reddedilir',()=>{for(const mutate of [p=>p.desteler[0].konu='Bilinmeyen',p=>p.testler[0].sorular[0].konu='Yok',p=>p.testler[0].sorular[0].aciklama='',p=>p.konular=['Ana'],p=>p.testler[0].sorular[0].dogru=null]){const p2=pkg();mutate(p2);assert.equal(T.paketGecerli(p2),false);}});
test('Legacy test yalnızca bütün soruları aynı kökteyse sınıflanır',()=>{const q={courseId:root.courseId,questions:[{topicId:sub.id},{topicId:root.id}]};assert.equal(T.icerikKonusu(q),root.id);q.questions.push({});assert.equal(T.icerikKonusu(q),null);});
test('İsim tahmini yapılmaz; explicit null seçim korunur',()=>{assert.equal(T.icerikKonusu({name:'Ana — Deste',courseId:root.courseId}),null);assert.equal(T.icerikKonusu({topicId:null,courseId:root.courseId,questions:[{topicId:sub.id}]}),null);});
test('Toplu atama kart tekrarlarını, soru alt konusunu ve sonuç geçmişini korur',()=>{const history=JSON.stringify(db.cards);db.quizRuns.push({quizId:db.quizzes[0].id,correct:1,total:1});const runs=JSON.stringify(db.quizRuns);assert.equal(T.konuAta([db.quizzes[0],db.decks[0]],root.courseId,root.id),true);assert.equal(JSON.stringify(db.cards),history);assert.equal(JSON.stringify(db.quizRuns),runs);assert.equal(db.quizzes[0].questions[0].topicId,sub.id);});
test('Başka derse taşıma geçersiz alt konu ilişkisini temizler',()=>{db.courses.push({id:'c2',name:'İkinci'});assert.equal(T.konuAta([db.quizzes[0]],'c2',root.id),false);assert.equal(T.konuAta([db.quizzes[0]],'c2',null),true);assert.equal(db.quizzes[0].questions[0].topicId,null);});
test('Silinmiş konu bağı görünmez içerik üretmez; geri yükleme bağı geri getirir',()=>{const deck=db.decks[0];const old=db.topics;db.topics=[];assert.equal(T.icerikKonusu(deck),null);db.topics=old;assert.equal(T.icerikKonusu(deck),root.id);});
test('Dersi silinmiş içerik sınıflandırılmamış olarak erişilebilir kalır',()=>assert.equal(T.icerikKonusu({courseId:'silinmis',topicId:root.id}),null));
test('Döngülü konu ağacı kilitlenmez',()=>{db.topics.push({id:'loop',courseId:'c2',parentId:'loop'});assert.equal(T.konuKoku('loop','c2'),null);});

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'studyos-paket-test-'));
const put=(name,data)=>{const f=path.join(dir,name);fs.writeFileSync(f,JSON.stringify(data));return f;};
const output=path.join(dir,'out.json'),part=path.join(dir,'part.json'),topics=put('topics.json',['Alt']);
const run=args=>spawnSync(process.execPath,[new URL('../araclar/paket-birlestir.mjs',import.meta.url).pathname,...args],{encoding:'utf8'});
const produce=()=>run(['--ders','Test dersi','--ana-konu','Ana','--konular',topics,'--cikti',output,part]);
const input=()=>{const p=pkg();p.kaynaklar=[{id:'test-1',ad:'Sentetik test kaynağı',yil:'2026',erisimTarihi:'2026-09-15',erisim:'kullanici-dosyasi',konum:'fixture, s.1'}];p.kanitlar=[['kart','Sentetik kart?'],['soru','Sentetik soru?']].map(([tur,metin])=>({tur,metin,hedef:'H01',iddia:'Yalnızca test için sentetik iddia',durum:'dogrulandi',kaynaklar:[{id:'test-1',bolum:'s.1'}]}));return p;};
try{
 test('V2 üretimi paket ve öğe kaynak eşleştirmelerini yazar',()=>{put('part.json',input());const r=produce();assert.equal(r.status,0,r.stderr);const a=JSON.parse(fs.readFileSync(path.join(dir,'out.denetim.json')));assert.equal(a.kanitlar.length,2);assert.ok(a.kanitlar[0].pointer&&a.kanitlar[0].ogeSha256);});
 test('Final doğrulama dosya baytlarını değiştirmez',()=>{const before=fs.readFileSync(output,'utf8');const r=run(['--dogrula',output]);assert.equal(r.status,0,r.stderr);assert.equal(fs.readFileSync(output,'utf8'),before);});
 test('Final içerik değişirse eski kanıt dosyası reddedilir',()=>{const p=JSON.parse(fs.readFileSync(output));p.desteler[0].kartlar[0].arka='Değişmiş cevap';fs.writeFileSync(output,JSON.stringify(p));assert.notEqual(run(['--dogrula',output]).status,0);});
 test('Bozuk kayıtta final dosya ezilmez',()=>{const before=fs.readFileSync(output,'utf8');const p=input();p.desteler[0].kartlar[0].arka='';put('part.json',p);assert.notEqual(produce().status,0);assert.equal(fs.readFileSync(output,'utf8'),before);});
 test('Kanıtsız veya bilinmeyen kaynaklı öğe teslim edilemez',()=>{for(const change of [p=>p.kanitlar.pop(),p=>p.kanitlar[0].kaynaklar[0].id='yok']){const p=input();change(p);put('part.json',p);assert.notEqual(produce().status,0);}});
 test('Aynı ön yüz farklı cevap sessizce silinmez',()=>{const p=input();p.desteler[0].kartlar.push({on:'Sentetik kart?',arka:'Çelişen cevap'});put('part.json',p);assert.notEqual(produce().status,0);});
 test('Birebir kopya raporlanarak temizlenir',()=>{const p=input();p.desteler[0].kartlar.push({...p.desteler[0].kartlar[0]});put('part.json',p);const r=produce();assert.equal(r.status,0,r.stderr);const a=JSON.parse(fs.readFileSync(path.join(dir,'out.denetim.json')));assert.equal(a.kopyalar.length,1);});
 test('Final dosya kaynak parça olarak kullanılamaz',()=>assert.notEqual(run(['--konular',topics,'--cikti',output,output]).status,0));
 test('Üretimde yalnız biçim seçeneği kanıt denetimini atlatamaz',()=>assert.notEqual(run(['--yalniz-bicim','--konular',topics,'--cikti',output,part]).status,0));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log(`\n${count} konu/paket testi geçti`);
