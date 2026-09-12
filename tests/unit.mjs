/* StudyOS birim testi — tarayıcısız: node tests/unit.mjs
   index.html'in ilk üç script bloğunu vm ile yükleyip saf fonksiyonları sınar.
   Duman testi arayüzü korur; bu dosya mantığı korur (örn. tarihlerin yerel olması).

   Zaman dilimi Node başlangıcında okunur, çalışırken değiştirilemez.
   Bu yüzden dosya kendini birkaç TZ ile alt süreç olarak yeniden çağırır. */
import fs from "node:fs";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BURASI = fileURLToPath(import.meta.url);
const KOK = path.resolve(path.dirname(BURASI), "..");

/* ---------- üst süreç: her zaman dilimi için bir alt süreç ---------- */
if (!process.env.STUDYOS_TZ) {
  /* UTC+14 ve UTC-11 uçları: hangi saatte çalışılırsa çalışılsın en az biri
     UTC tarihinden farklı olur, yani UTC'ye kaçan bir hesap kesin yakalanır. */
  const zones = ["Europe/Istanbul", "Pacific/Kiritimati", "Pacific/Midway", "UTC"];
  let kalan = 0;
  for (const tz of zones) {
    const r = spawnSync(process.execPath, [BURASI],
      { env: { ...process.env, TZ: tz, STUDYOS_TZ: tz }, stdio: "inherit" });
    if (r.status !== 0) kalan++;
  }
  console.log(kalan ? `\n✗ ${kalan} zaman diliminde test düştü` : "\n✓ tüm zaman dilimleri geçti");
  process.exit(kalan ? 1 : 0);
}

/* ---------- index.html'den script bloklarını çıkar ---------- */
const html = fs.readFileSync(path.join(KOK, "index.html"), "utf8");
const bloklar = [...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].map(m => m[1]);
if (bloklar.length !== 4) { console.error("Beklenen 4 script bloğu, bulunan " + bloklar.length); process.exit(2); }

/* 4. blok yüklenmez: sonunda açılış kodu var (load, buildDock, service worker…).
   İlk üç blok tek parça çalıştırılır — tarayıcıda da aynı üst kapsamı paylaşırlar. */
const kaynak = bloklar.slice(0, 3).join("\n") + `
globalThis.__T = { ymd, today, addDays, dayDiff, mondayOf, sm2, streak, md, dueCards, minutesByDay,
  setDB: v => { DB = v; } };`;

const bosDugum = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {} },
  appendChild() {}, remove() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
const ctx = vm.createContext({
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  window: { addEventListener() {}, requestIdleCallback: null },
  document: { addEventListener() {}, createElement: bosDugum,
    documentElement: bosDugum(), body: bosDugum(),
    querySelector: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: {},
});
try { vm.runInContext(kaynak, ctx, { filename: "studyos-bloklar.js" }); }
catch (e) { console.error("Bloklar çalıştırılamadı: " + e.message); process.exit(2); }
const T = ctx.__T;

/* ---------- küçük test koşucusu ---------- */
const TZ = process.env.STUDYOS_TZ;
let dusen = 0, gecen = 0;
const es = (ad, bulunan, beklenen) => {
  const ok = JSON.stringify(bulunan) === JSON.stringify(beklenen);
  if (ok) gecen++; else { dusen++; console.log(`  ✗ ${ad}\n      beklenen: ${JSON.stringify(beklenen)}\n      bulunan : ${JSON.stringify(bulunan)}`); }
};
const dogru = (ad, k) => { if (k) gecen++; else { dusen++; console.log(`  ✗ ${ad}`); } };

console.log(`\n── TZ=${TZ} ──`);

/* ---------- tarih ---------- */
/* Sabit bir yerel an: saat 23:30 olduğu için UTC'ye çeviren her hesap
   doğu yarıkürede ertesi güne kayar. */
es("ymd yerel takvimi verir (31 Ocak 23:30)", T.ymd(new Date(2026, 0, 31, 23, 30)), "2026-01-31");
es("ymd yerel takvimi verir (1 Ocak 00:30)", T.ymd(new Date(2026, 0, 1, 0, 30)), "2026-01-01");
/* toLocaleDateString("sv-SE") bağımsız bir uygulama: YYYY-MM-DD, yerel saatle */
es("today() bugünün yerel tarihi", T.today(), new Date().toLocaleDateString("sv-SE"));

es("addDays ileri", T.addDays("2026-09-12", 1), "2026-09-13");
es("addDays geri", T.addDays("2026-09-12", -1), "2026-09-11");
es("addDays yıl sınırı", T.addDays("2026-12-31", 1), "2027-01-01");
es("addDays ay sınırı (28 Şubat, artık yıl değil)", T.addDays("2026-02-28", 1), "2026-03-01");
es("addDays sıfır", T.addDays("2026-09-12", 0), "2026-09-12");

es("dayDiff aynı gün", T.dayDiff("2026-09-12", "2026-09-12"), 0);
es("dayDiff iki ay", T.dayDiff("2026-01-01", "2026-03-01"), 59);
es("dayDiff negatif", T.dayDiff("2026-09-12", "2026-09-10"), -2);
es("mondayOf cumartesi", T.mondayOf("2026-09-12"), "2026-09-07");
es("mondayOf pazartesi kendisi", T.mondayOf("2026-09-07"), "2026-09-07");

/* addDays ile dayDiff birbirini tutmalı — 400 günlük tur */
let tutmayan = null;
for (let i = -200; i <= 200; i++) {
  const d = T.addDays("2026-06-15", i);
  if (T.dayDiff("2026-06-15", d) !== i) { tutmayan = `${i} → ${d}`; break; }
}
dogru("addDays/dayDiff 400 gün boyunca tutarlı" + (tutmayan ? " — " + tutmayan : ""), !tutmayan);

/* ---------- SM-2 ---------- */
const yeniKart = () => ({ ef: 2.5, int: 0, reps: 0, lapses: 0 });
let k = yeniKart();
T.sm2(k, 4);
es("sm2 ilk doğru tekrar: aralık 1 gün", k.int, 1);
es("sm2 ilk doğru tekrar: reps 1", k.reps, 1);
es("sm2 vade bugünden 1 gün sonra", k.due, T.addDays(T.today(), 1));
es("sm2 ef q=4'te değişmez", Math.round(k.ef * 1000) / 1000, 2.5);
T.sm2(k, 4);
es("sm2 ikinci tekrar: aralık 6 gün", k.int, 6);
T.sm2(k, 4);
es("sm2 üçüncü tekrar: 6 × ef", k.int, Math.round(6 * 2.5));

k = yeniKart(); k.reps = 5; k.int = 40;
T.sm2(k, 1);
es("sm2 bilinemedi: reps sıfırlanır", k.reps, 0);
es("sm2 bilinemedi: aralık 1 güne düşer", k.int, 1);
es("sm2 bilinemedi: lapses artar", k.lapses, 1);

k = yeniKart();
for (let i = 0; i < 40; i++) T.sm2(k, 3);
dogru("sm2 ef tabanı 1.3'ün altına inmez", k.ef >= 1.3 - 1e-9);

/* ---------- seri ---------- */
const bugun = T.today();
T.setDB({ sessions: [], cards: [], settings: {} });
es("seri: kayıt yokken 0", T.streak(), 0);
T.setDB({ sessions: [{ date: bugun, min: 30 }], cards: [], settings: {} });
es("seri: yalnızca bugün → 1", T.streak(), 1);
T.setDB({ sessions: [{ date: T.addDays(bugun, -1), min: 30 }], cards: [], settings: {} });
es("seri: yalnızca dün → 1 (bugün henüz çalışılmadı)", T.streak(), 1);
T.setDB({ sessions: [bugun, T.addDays(bugun, -1), T.addDays(bugun, -2)].map(d => ({ date: d, min: 10 })), cards: [], settings: {} });
es("seri: üç ardışık gün → 3", T.streak(), 3);
T.setDB({ sessions: [bugun, T.addDays(bugun, -2)].map(d => ({ date: d, min: 10 })), cards: [], settings: {} });
es("seri: araya boş gün girince kesilir", T.streak(), 1);
T.setDB({ sessions: [{ date: T.addDays(bugun, -3), min: 10 }], cards: [], settings: {} });
es("seri: eski kayıt seriyi başlatmaz", T.streak(), 0);

/* ---------- vadesi gelen kartlar ---------- */
T.setDB({ sessions: [], settings: {}, cards: [
  { id: "a", deckId: "d1", due: T.addDays(bugun, -1) },
  { id: "b", deckId: "d1", due: bugun },
  { id: "c", deckId: "d1", due: T.addDays(bugun, 1) },
  { id: "d", deckId: "d2" },
] });
es("dueCards: bugün ve öncesi + vadesiz", T.dueCards().map(c => c.id), ["a", "b", "d"]);
es("dueCards: desteye göre süzülür", T.dueCards("d1").map(c => c.id), ["a", "b"]);

/* ---------- minutesByDay ---------- */
T.setDB({ settings: {}, cards: [], sessions: [
  { date: bugun, min: 20 }, { date: bugun, min: 25 },
  { date: T.addDays(bugun, -2), min: 15 },
] });
es("minutesByDay 3 gün", T.minutesByDay(3).map(x => x.m), [15, 0, 45]);
es("minutesByDay son gün bugündür", T.minutesByDay(3)[2].d, bugun);

/* ---------- markdown ---------- */
dogru("md kalın", T.md("**kalın**").includes("<b>kalın</b>"));
dogru("md başlık", T.md("# Başlık").includes("<h1>Başlık</h1>"));
dogru("md işaretleme", T.md("==vurgu==").includes("<mark>vurgu</mark>"));
dogru("md satır içi kod", T.md("`kod`").includes("<code>kod</code>"));
dogru("md liste", T.md("- bir\n- iki").includes("<li>bir</li>"));
dogru("md HTML kaçışı", T.md("<script>x</script>").includes("&lt;script&gt;"));
dogru("md alıntı", T.md("> söz").includes("<blockquote>söz</blockquote>"));

console.log(`  ${gecen} geçti${dusen ? `, ${dusen} DÜŞTÜ` : ""}`);
process.exit(dusen ? 1 : 0);
