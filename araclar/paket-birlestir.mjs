#!/usr/bin/env node
/* Üretim: --ad AD --ders DERS --ana-konu KONU --konular konular.json
   --cikti paket.json part1.json ...
   İnceleme sonrası, dosyayı yeniden üretmeden: --dogrula paket.json
   Kanıtsız eski paket kontrolü: --dogrula paket.json --yalniz-bicim
   v1 üretim komutları çalışır; v2 üretimi öğe düzeyinde kanıt ister.
   Kaynak doğrulaması bağlantı/izlenebilirlik denetimidir; tıbbi doğruluk ispatı değildir. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const KOK=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const norm=x=>String(x??'').trim().toLocaleLowerCase('tr');
const str=x=>typeof x==='string'&&!!x.trim();
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const auditPath=f=>f.replace(/\.json$/i,'')+'.denetim.json';
const errors=[],warnings=[],duplicates=[];
const fail=msg=>errors.push(msg);
function stop(){if(errors.length)throw new Error(errors.join('\n'));}
function write(f,data){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(data,null,1)+'\n');}
const opt={sik:5},parts=[];
const flags={'--ad':'ad','--ders':'ders','--ana-konu':'anaKonu','--konular':'konular','--cikti':'cikti','--sik':'sik','--kaynaklar':'kaynaklar','--denetim':'denetim','--dogrula':'dogrula'};
try{
  const args=process.argv.slice(2);
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(a==='--yalniz-bicim'){opt.bicim=true;continue;}
    if(flags[a]){if(!args[i+1]||args[i+1].startsWith('--'))throw new Error(`${a} değeri eksik`);opt[flags[a]]=args[++i];}
    else if(a.startsWith('--'))throw new Error(`Bilinmeyen seçenek: ${a}`);else parts.push(a);
  }
  opt.sik=Number(opt.sik);
  if(![0,2,3,4,5,6].includes(opt.sik))throw new Error('--sik 0 veya 2–6 olmalı');
  if(opt.bicim&&!opt.dogrula)throw new Error('--yalniz-bicim yalnızca --dogrula ile kullanılır');
  if(opt.dogrula&&(parts.length||opt.cikti))throw new Error('--dogrula üretimle birleştirilemez');

  const html=fs.readFileSync(path.join(KOK,'index.html'),'utf8');
  const source=[...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].slice(0,3).map(m=>m[1]).join('\n')+
    '\nglobalThis.T={paketSorunlari,paketUygula,paketOzet,blank,setDB:v=>DB=v};';
  const empty=()=>({style:{},dataset:{},classList:{add(){},remove(){}},appendChild(){},remove(){},setAttribute(){},querySelector:()=>null,querySelectorAll:()=>[]});
  const ctx=vm.createContext({console,setTimeout,clearTimeout,setInterval,clearInterval,window:{addEventListener(){},requestIdleCallback:null},document:{addEventListener(){},createElement:empty,documentElement:empty(),body:empty(),querySelector:()=>null,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{}});
  vm.runInContext(source,ctx);const T=ctx.T;
  const sources=new Map(),evidence=[],omitted=[];
  let out;
  if(opt.dogrula)out=read(opt.dogrula);
  else{
    if(!opt.cikti||!parts.length||!opt.konular)throw new Error('--cikti, --konular ve parça dosyaları gerekli');
    if(parts.some(f=>path.resolve(f)===path.resolve(opt.cikti)))throw new Error('Çıktı dosyası girdi parçası olamaz; --dogrula kullan');
    const topics=read(opt.konular);
    if(!Array.isArray(topics)||topics.some(t=>!str(t)))throw new Error('konular.json dize dizisi olmalı');
    out={studyosPaket:opt.anaKonu?2:1,ad:opt.ad||path.basename(opt.cikti,'.json'),ders:opt.ders||'Genel',...(opt.anaKonu?{anaKonu:opt.anaKonu}:{}),konular:topics,desteler:[],testler:[],terimler:[],notlar:[]};
    const seen={kart:new Map(),soru:new Map(),terim:new Map(),not:new Map()};
    const unique=(type,text,item)=>{
      const key=norm(text),old=seen[type].get(key);
      if(old){if(hash(old)!==hash(item))fail(`Aynı ${type} metninin çelişen sürümleri: ${text}`);else duplicates.push({tur:type,metin:text});return false;}
      seen[type].set(key,item);return true;
    };
    for(const file of parts){
      const j=read(file);
      for(const key of ['desteler','testler','terimler','notlar','kaynaklar','kanitlar','atlananlar'])if(j[key]!==undefined&&!Array.isArray(j[key]))fail(`${file}: ${key} dizi olmalı`);
      stop();
      for(const k of j.kaynaklar||[]){
        if(out.studyosPaket===1&&typeof k==='string'){sources.set(k,k);continue;}
        if(!k||!str(k.id)){fail(`${file}: kaynak kimliği eksik`);continue;}
        if(sources.has(k.id)&&hash(sources.get(k.id))!==hash(k))fail(`Çelişen kaynak kimliği: ${k.id}`);
        sources.set(k.id,k);
      }
      evidence.push(...(j.kanitlar||[]));omitted.push(...(j.atlananlar||[]));
      for(const [key,child,type,textKey] of [['desteler','kartlar','kart','on'],['testler','sorular','soru','s']]){
        for(const group of j[key]||[]){
          if(!group||!str(group.ad)||!Array.isArray(group[child])||!group[child].length){fail(`${file}: boş/bozuk ${key}`);continue;}
          if(out.studyosPaket===2&&group.konu!==out.anaKonu)fail(`${file}: ${group.ad} ana konu bağlantısı yanlış`);
          let target=out[key].find(x=>norm(x.ad)===norm(group.ad));
          if(!target){target={ad:group.ad,...(out.studyosPaket===2?{konu:group.konu}:{}),[child]:[]};out[key].push(target);}
          for(const item of group[child]){
            if(!item||!str(item[textKey])){fail(`${file}: ${type} metni eksik`);continue;}
            if(unique(type,item[textKey],item))target[child].push(item);
          }
        }
      }
      for(const [key,type,textKey] of [['terimler','terim','terim'],['notlar','not','baslik']])for(const item of j[key]||[]){
        if(!item||!str(item[textKey])){fail(`${file}: ${type} adı eksik`);continue;}
        if(unique(type,item[textKey],item))out[key].push(item);
      }
    }
    out.desteler=out.desteler.filter(d=>d.kartlar.length);out.testler=out.testler.filter(t=>t.sorular.length);
    if(!out.notlar.length)delete out.notlar;
  }
  errors.push(...T.paketSorunlari(out));stop();
  const entries=[];
  const add=(tur,metin,pointer,item)=>entries.push({tur,metin,pointer,item});
  out.desteler?.forEach((d,i)=>d.kartlar.forEach((k,j)=>{if(!str(k.on)||!str(k.arka))fail('Boş kart yüzü');add('kart',k.on,`/desteler/${i}/kartlar/${j}`,k);}));
  out.testler?.forEach((t,i)=>{
    const balance=Array(6).fill(0);
    t.sorular.forEach((q,j)=>{
      if(!str(q.s)||!str(q.aciklama)||![out.anaKonu,...(out.konular||[])].filter(Boolean).includes(q.konu))fail(`${t.ad}: soru metni/açıklama/konu eksik veya geçersiz`);
      if(!Array.isArray(q.secenekler)||(opt.sik&&q.secenekler.length!==opt.sik)||q.secenekler.some(x=>!str(x))||new Set(q.secenekler.map(norm)).size!==q.secenekler.length||!Number.isInteger(q.dogru)||q.dogru<0||q.dogru>=q.secenekler.length)fail(`${t.ad}: geçersiz şık veya doğru cevap`);
      balance[q.dogru]++;add('soru',q.s,`/testler/${i}/sorular/${j}`,q);
    });
    if(t.sorular.length>=10&&balance.some(n=>n>2*t.sorular.length/(opt.sik||5)))warnings.push(`${t.ad}: doğru şık dağılımını incele (${balance.join('/')})`);
  });
  out.terimler?.forEach((t,i)=>{if(!str(t.terim)||!str(t.tanim))fail('Eksik terim');add('terim',t.terim,`/terimler/${i}`,t);});
  const noteNames=new Set((out.notlar||[]).map(n=>n.baslik));
  out.notlar?.forEach((n,i)=>{if(!str(n.baslik)||!str(n.icerik))fail('Eksik not');
    for(const m of n.icerik.matchAll(/\[\[([^\]]+)\]\]/g))if(!noteNames.has(m[1]))fail(`Kırık not bağlantısı: ${m[1]}`);
    add('not',n.baslik,`/notlar/${i}`,n);});
  if(!entries.length)fail('Paket boş');
  // Doğrulama dosyayı değiştirmez; kopyaların varlığı raporlanır, gizlice ayıklanmaz.
  if(opt.dogrula){const seen=new Set();for(const e of entries){const k=e.tur+':'+norm(e.metin);if(seen.has(k))fail(`Kopya ${e.tur}: ${e.metin}`);seen.add(k);}}
  stop();T.setDB(T.blank());const ek=T.paketUygula(JSON.parse(JSON.stringify(out)));
  if(ek.atlanan)fail(`Uygulama ${ek.atlanan} kayıt atladı`);
  let audit;
  if(!opt.bicim&&(out.studyosPaket===2||opt.dogrula)){
    if(opt.dogrula){audit=read(opt.denetim||auditPath(opt.dogrula));
      if(audit.paketSha256!==hash(out))fail('Denetim dosyası bu paket sürümüne ait değil');
      if(!Array.isArray(audit.kaynaklar)||!Array.isArray(audit.kanitlar))fail('Denetim dosyası eksik');
      stop();audit.kaynaklar.forEach(k=>sources.set(k.id,k));
    }
    for(const k of sources.values()){
      if(!k||!str(k.id)||!str(k.ad)||!str(k.yil)||!str(k.erisimTarihi)||!['tam-metin','ozet','kullanici-dosyasi'].includes(k.erisim)||!str(k.konum))fail('Kaynakta id/ad/yil/erisimTarihi/erisim/konum zorunlu');
      if(k?.erisim!=='kullanici-dosyasi'&&!/^https?:\/\//.test(k?.url||''))fail(`Kaynak URL eksik: ${k?.id}`);
    }
    const checked=[];
    for(const e of entries){
      const matches=opt.dogrula?audit.kanitlar.filter(k=>k.pointer===e.pointer):evidence.filter(k=>k.tur===e.tur&&k.metin===e.metin);
      if(!matches.length){fail(`Kanıtsız ${e.tur}: ${e.metin}`);continue;}
      for(const k of matches){
        if(k.durum!=='dogrulandi'||!str(k.hedef)||!str(k.iddia)||!Array.isArray(k.kaynaklar)||!k.kaynaklar.length)fail(`Kanıt kaydı eksik: ${e.metin}`);
        else for(const link of k.kaynaklar)if(!sources.has(link.id)||!str(link.bolum))fail(`Kaynak/bölüm bağlantısı eksik: ${e.metin}`);
        if(opt.dogrula&&(k.ogeSha256!==hash(e.item)||k.tur!==e.tur||k.metin!==e.metin))fail(`Kanıt–öğe eşleşmesi bozuk: ${e.pointer}`);
        checked.push({...k,pointer:e.pointer,ogeSha256:hash(e.item)});
      }
    }
    if(opt.dogrula&&audit.kanitlar.some(k=>!entries.some(e=>e.pointer===k.pointer)))fail('Denetimde pakette bulunmayan öğe var');
    audit={surum:1,paketSha256:hash(out),kaynaklar:[...sources.values()],kanitlar:checked,atlananlar:opt.dogrula?audit.atlananlar:omitted,kopyalar:opt.dogrula?audit.kopyalar:duplicates};
  }
  stop();
  if(!opt.dogrula){
    const outputs=[opt.cikti,...(audit?[opt.denetim||auditPath(opt.cikti)]:[]),...(opt.kaynaklar?[opt.kaynaklar]:[])].map(f=>path.resolve(f));
    if(new Set(outputs).size!==outputs.length||outputs.some(f=>[...parts,opt.konular].some(p=>path.resolve(p)===f)))throw new Error('Girdi ve çıktı dosyaları çakışıyor');
    write(opt.cikti,out);if(audit)write(opt.denetim||auditPath(opt.cikti),audit);
    if(opt.kaynaklar){fs.mkdirSync(path.dirname(opt.kaynaklar),{recursive:true});fs.writeFileSync(opt.kaynaklar,[...sources.values()].map(k=>typeof k==='string'?k:`${k.ad} — ${k.url||k.konum}`).join('\n')+'\n');}
    console.log(`Yazıldı: ${opt.cikti}`);
  }
  console.log(JSON.stringify(T.paketOzet(out)));console.log('Uygulama yolu: '+JSON.stringify(ek));
  if(duplicates.length)console.log(`Birebir kopya temizliği: ${duplicates.length} (denetim kaydında)`);
  warnings.forEach(x=>console.log('UYARI: '+x));
  console.log(audit?'✓ Biçim, içe aktarma ve kaynak bağlantıları doğrulandı. Bilimsel inceleme ayrıca gerekir.':'✓ Yalnızca biçim ve içe aktarma doğrulandı; kaynak incelemesi yapılmadı.');
}catch(e){console.error('ÖLÜMCÜL: '+e.message);process.exitCode=1;}
