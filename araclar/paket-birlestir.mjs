#!/usr/bin/env node
/* Paket parçalarını birleştirir, temizler ve uygulamanın KENDİ paketUygula() yoluyla doğrular.
   Kullanım:
     node araclar/paket-birlestir.mjs --ad "TUS Dahiliye — Onkoloji" --ders Dahiliye \
       --konular konular.json --cikti paketler/tus-onkoloji.json parca1.json parca2.json ...
   Parça biçimi = paket biçiminin alt kümesi: { desteler, testler, terimler, notlar, kaynaklar }.
   Seçenekler:
     --sik N        her soruda tam N şık beklenir (varsayılan 5; 0 = serbest, 2-6)
     --kaynaklar F  toplanan kaynak listesini F dosyasına yazar
   Çıkış kodu 1: geçersiz paket, atlanan kayıt ya da ölümcül sorun. Uyarılar (kopya vb.)
   temizlenerek geçilir ve raporlanır. */
import fs from "fs"; import path from "path"; import vm from "vm";
import { fileURLToPath } from "url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv.slice(2), opt = { sik: 5 }, parcalar = [];
for (let i = 0; i < arg.length; i++) {
  const a = arg[i];
  if (a === "--ad") opt.ad = arg[++i];
  else if (a === "--ders") opt.ders = arg[++i];
  else if (a === "--konular") opt.konular = JSON.parse(fs.readFileSync(arg[++i], "utf8"));
  else if (a === "--cikti") opt.cikti = arg[++i];
  else if (a === "--sik") opt.sik = +arg[++i];
  else if (a === "--kaynaklar") opt.kaynaklar = arg[++i];
  else parcalar.push(a);
}
if (!opt.cikti || !parcalar.length) { console.error("Kullanım için dosyanın başına bak."); process.exit(2); }
if (!Array.isArray(opt.konular)) { console.error("--konular <konular.json> zorunlu (dize dizisi)"); process.exit(2); }

const KONULAR = opt.konular.map(String);
const out = { studyosPaket: 1, ad: opt.ad || path.basename(opt.cikti, ".json"), ders: opt.ders || "Genel",
  konular: KONULAR, desteler: [], testler: [], terimler: [], notlar: [] };
const uyari = [], olumcul = [], kaynaklar = new Set();
const kucuk = x => String(x ?? "").trim().toLocaleLowerCase("tr");
const onler = new Set(), sorular = new Set(), terimler = new Set(), notlar = new Set();
const dagilim = {};

for (const f of parcalar) {
  if (!fs.existsSync(f)) { olumcul.push(`${f} yok`); continue; }
  let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { olumcul.push(`${f}: JSON okunamadı — ${e.message}`); continue; }
  (j.kaynaklar || []).forEach(k => kaynaklar.add(String(k)));

  for (const d of j.desteler || []) {
    const ad = String(d.ad || "").trim(); if (!ad) { uyari.push(`${f}: adsız deste atlandı`); continue; }
    let hedef = out.desteler.find(x => kucuk(x.ad) === kucuk(ad));
    if (!hedef) { hedef = { ad, kartlar: [] }; out.desteler.push(hedef); }
    for (const k of d.kartlar || []) {
      const on = String(k.on ?? "").trim(), arka = String(k.arka ?? "").trim();
      if (!on || !arka) { uyari.push(`${f}: boş yüzlü kart atlandı "${on.slice(0, 40)}"`); continue; }
      if (onler.has(kucuk(on))) { uyari.push(`${f}: kopya ön yüz atlandı "${on.slice(0, 60)}"`); continue; }
      onler.add(kucuk(on)); hedef.kartlar.push({ on, arka });
    }
  }

  for (const t of j.testler || []) {
    const ad = String(t.ad || "").trim(); if (!ad) { uyari.push(`${f}: adsız test atlandı`); continue; }
    let hedef = out.testler.find(x => kucuk(x.ad) === kucuk(ad));
    if (!hedef) { hedef = { ad, sorular: [] }; out.testler.push(hedef); }
    for (const s of t.sorular || []) {
      const metin = String(s.s ?? "").trim();
      const sec = (s.secenekler || []).map(x => String(x ?? "").trim());
      const dogru = Number(s.dogru);
      const kisa = metin.slice(0, 60);
      if (!metin) { uyari.push(`${f}: metinsiz soru atlandı`); continue; }
      if (opt.sik ? sec.length !== opt.sik : (sec.length < 2 || sec.length > 6)) { olumcul.push(`${f}: şık sayısı ${sec.length}: "${kisa}"`); continue; }
      if (sec.some(x => !x)) { olumcul.push(`${f}: boş şık: "${kisa}"`); continue; }
      if (new Set(sec.map(kucuk)).size !== sec.length) { olumcul.push(`${f}: aynı şık iki kez: "${kisa}"`); continue; }
      if (!(dogru >= 0 && dogru < sec.length)) { olumcul.push(`${f}: dogru aralık dışı (${s.dogru}): "${kisa}"`); continue; }
      if (sorular.has(kucuk(metin))) { uyari.push(`${f}: kopya soru atlandı "${kisa}"`); continue; }
      let konu = String(s.konu || "").trim();
      if (konu && !KONULAR.includes(konu)) { olumcul.push(`${f}: bilinmeyen konu "${konu}": "${kisa}"`); continue; }
      sorular.add(kucuk(metin));
      const soru = { s: metin, secenekler: sec, dogru, aciklama: String(s.aciklama || "").trim() };
      if (konu) soru.konu = konu; else uyari.push(`${f}: konusuz soru "${kisa}"`);
      if (!soru.aciklama) uyari.push(`${f}: açıklamasız soru "${kisa}"`);
      hedef.sorular.push(soru);
      (dagilim[hedef.ad] ||= [0, 0, 0, 0, 0, 0])[dogru]++;
    }
  }

  for (const tr of j.terimler || []) {
    const ad = String(tr.terim || "").trim(), tanim = String(tr.tanim || "").trim();
    if (!ad || !tanim) { uyari.push(`${f}: eksik terim atlandı "${ad}"`); continue; }
    if (terimler.has(kucuk(ad))) { uyari.push(`${f}: kopya terim atlandı "${ad}"`); continue; }
    terimler.add(kucuk(ad));
    out.terimler.push({ terim: ad, tanim, esanlam: (tr.esanlam || []).map(x => String(x || "").trim()).filter(Boolean) });
  }

  for (const no of j.notlar || []) {
    const baslik = String(no.baslik ?? "").trim(), icerik = String(no.icerik ?? "").trim();
    if (!baslik || !icerik) { uyari.push(`${f}: eksik not atlandı "${baslik}"`); continue; }
    if (notlar.has(kucuk(baslik))) { uyari.push(`${f}: kopya not atlandı "${baslik}"`); continue; }
    notlar.add(kucuk(baslik)); out.notlar.push({ baslik, icerik });
  }
}
out.desteler = out.desteler.filter(d => d.kartlar.length);
out.testler = out.testler.filter(t => t.sorular.length);
if (!out.notlar.length) delete out.notlar;

/* doğru şık dengesi: bir şık test içinde payının 2 katından fazlaysa uyar */
for (const [ad, d] of Object.entries(dagilim)) {
  const n = d.reduce((a, b) => a + b, 0), sik = opt.sik || 5;
  d.slice(0, sik).forEach((c, i) => { if (n >= 10 && c > 2 * n / sik) uyari.push(`"${ad}": doğru şık ${String.fromCharCode(65 + i)} çok sık (${c}/${n})`); });
}

/* uygulamanın kendi alma yolu */
const html = fs.readFileSync(path.join(KOK, "index.html"), "utf8");
const bloklar = [...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].map(m => m[1]).slice(0, 3).join("\n") +
  `\nglobalThis.__T={paketGecerli,paketOzet,paketUygula,setDB:v=>{DB=v;},getDB:()=>DB};`;
const bos = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
const ctx = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval,
  window: { addEventListener() {}, requestIdleCallback: null },
  document: { addEventListener() {}, createElement: bos, documentElement: bos(), body: bos(), querySelector: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, navigator: {} });
vm.runInContext(bloklar, ctx, { filename: "studyos-bloklar.js" });
const T = ctx.__T;
T.setDB({ settings: {}, trash: [], notes: [], decks: [], cards: [], tasks: [], sessions: [], topics: [], courses: [], exams: [], quizzes: [], quizRuns: [], terms: [] });
const gecerli = T.paketGecerli(out);
const ek = gecerli ? T.paketUygula(JSON.parse(JSON.stringify(out))) : null;
if (!gecerli) olumcul.push("paketGecerli() false döndü");
if (ek && ek.atlanan) olumcul.push(`uygulama ${ek.atlanan} kaydı atladı`);

fs.mkdirSync(path.dirname(opt.cikti), { recursive: true });
fs.writeFileSync(opt.cikti, JSON.stringify(out, null, 1) + "\n");
if (opt.kaynaklar) fs.writeFileSync(opt.kaynaklar, [...kaynaklar].sort().join("\n") + "\n");

const o = T.paketOzet(out);
console.log(`yazıldı: ${opt.cikti}`);
console.log(`ders: ${out.ders} · konu: ${o.konu} · deste: ${o.deste} · kart: ${o.kart} · test: ${o.test} · soru: ${o.soru} · terim: ${o.terim} · not: ${o.not}`);
console.log("desteler: " + out.desteler.map(d => `${d.ad} (${d.kartlar.length})`).join("; "));
console.log("testler: " + out.testler.map(t => `${t.ad} (${t.sorular.length}) A-E ${(dagilim[t.ad] || []).slice(0, opt.sik || 5).join("/")}`).join("; "));
if (ek) console.log("uygulama yolu: " + JSON.stringify(ek));
if (uyari.length) { console.log(`\nuyarı (${uyari.length}):`); uyari.forEach(u => console.log("  - " + u)); }
if (olumcul.length) { console.log(`\nÖLÜMCÜL (${olumcul.length}):`); olumcul.forEach(u => console.log("  ✗ " + u)); process.exit(1); }
console.log("\n✓ paket geçerli");
