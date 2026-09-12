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
  toTrash, trimTrash, restoreTrash, dropTrash, trashRefs, COP_GUN, COP_BAYT,
  dailyPlan, planDone, planToggle, PLAN_BLOK, PLAN_SATIR, PLAN_IHMAL,
  setDB: v => { DB = v; }, getDB: () => DB };`;

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

/* ---------- çöp kutusu ---------- */
const bosDB = () => ({ settings: {}, trash: [], notes: [], cards: [], decks: [], tasks: [],
  quizzes: [], terms: [], courses: [], exams: [], topics: [], sessions: [] });

let db = bosDB();
db.notes.push({ id: "n1", title: "Silinecek", body: "metin" });
T.setDB(db);
T.toTrash("note", "Silinecek", db.notes[0]);
db.notes = db.notes.filter(x => x.id !== "n1"); T.setDB(db);
es("çöp: kayıt eklendi", db.trash.length, 1);
es("çöp: bugünün tarihiyle", db.trash[0].at, bugun);
const geri = T.restoreTrash(db.trash[0].id);
es("çöp: geri alınan tip", geri.type, "note");
es("çöp: not diziye döndü", T.getDB().notes.map(x => x.id), ["n1"]);
es("çöp: kayıt çöpten çıktı", T.getDB().trash.length, 0);

/* deste + kartları tek parça */
db = bosDB(); T.setDB(db);
T.toTrash("deck", "Deste (2 kart)", { deck: { id: "d1", name: "Deste" },
  cards: [{ id: "c1", deckId: "d1" }, { id: "c2", deckId: "d1" }] });
T.restoreTrash(T.getDB().trash[0].id);
es("çöp: deste geri geldi", T.getDB().decks.map(x => x.id), ["d1"]);
es("çöp: destenin kartları da geri geldi", T.getDB().cards.map(x => x.id), ["c1", "c2"]);

/* konu ağacı tek parça */
db = bosDB(); T.setDB(db);
T.toTrash("topic", "Kök (+2 alt konu)", { topics: [
  { id: "t1", parentId: null, name: "Kök" }, { id: "t2", parentId: "t1" }, { id: "t3", parentId: "t2" }] });
T.restoreTrash(T.getDB().trash[0].id);
es("çöp: konu ağacı bütün geri geldi", T.getDB().topics.map(x => x.id), ["t1", "t2", "t3"]);

/* 30 gün kuralı */
db = bosDB();
db.trash = [
  { id: "a", type: "task", at: T.addDays(bugun, -(T.COP_GUN + 1)), ts: 1, label: "eski", data: { id: "x" } },
  { id: "b", type: "task", at: T.addDays(bugun, -(T.COP_GUN - 1)), ts: 2, label: "yeni", data: { id: "y" } }];
T.setDB(db);
es("çöp: 30 günü geçen atıldı", T.trimTrash(), 1);
es("çöp: süresi dolmayan kaldı", T.getDB().trash.map(e => e.id), ["b"]);

/* boyut tavanı: en eskiden başlayarak atılır */
db = bosDB();
const sisman = "x".repeat(20000);
for (let i = 0; i < 40; i++) db.trash.push({ id: "e" + i, type: "note", at: bugun, ts: i, label: "n" + i, data: { body: sisman } });
T.setDB(db);
T.trimTrash();
dogru("çöp: 300 KB tavanına indiriliyor", JSON.stringify(T.getDB().trash).length <= T.COP_BAYT);
dogru("çöp: tavana rağmen en yeniler tutuluyor",
  T.getDB().trash.length > 0 && T.getDB().trash[T.getDB().trash.length - 1].id === "e39");

/* medya referansları — çöpten kalıcı silinince bırakılacak olanlar */
es("çöp: not gövdesindeki ve ekindeki görseller bulunuyor",
  T.trashRefs({ type: "note", data: { body: "a ![](idb:abc123) b", att: [{ ref: "idb:def456" }] } }),
  ["idb:abc123", "idb:def456"]);
es("çöp: kart görseli bulunuyor", T.trashRefs({ type: "card", data: { img: "idb:kart1" } }), ["idb:kart1"]);
es("çöp: destedeki kartların görselleri bulunuyor",
  T.trashRefs({ type: "deck", data: { cards: [{ img: "idb:k1" }, {}, { img: "idb:k2" }] } }), ["idb:k1", "idb:k2"]);
es("çöp: görevde görsel yok", T.trashRefs({ type: "task", data: { title: "x" } }), []);

/* ---------- günlük plan ---------- */
const planDB = (x = {}) => ({ settings: { goal: 120 }, trash: [], notes: [], decks: [],
  cards: [], tasks: [], sessions: [], topics: [], courses: [], exams: [], quizzes: [], terms: [], ...x });

/* boş veri → boş plan (widget kurulum çağrısı gösterir) */
T.setDB(planDB());
es("plan: veri yokken boş", T.dailyPlan().length, 0);

/* vadesi gelen kart her zaman ilk sıra */
T.setDB(planDB({ cards: [{ id: "c1", due: bugun }, { id: "c2", due: T.addDays(bugun, -3) },
  { id: "c3", due: T.addDays(bugun, 5) }] }));
let pl = T.dailyPlan();
es("plan: kart satırı ilk sırada", pl[0].tip, "kart");
es("plan: yalnızca vadesi gelenler sayılır", pl[0].baslik, "2 kart tekrarı");
es("plan: kart satırı bir bloğu aşmaz", pl[0].dk <= T.PLAN_BLOK, true);

/* geciken görev — en fazla 2, en eski önce */
T.setDB(planDB({ courses: [{ id: "k1", name: "Fizik" }], tasks: [
  { id: "g1", title: "Eski", done: false, due: T.addDays(bugun, -5), pri: 0, courseId: "k1" },
  { id: "g2", title: "Bugün", done: false, due: bugun, pri: 2, courseId: "k1" },
  { id: "g3", title: "Yarın", done: false, due: T.addDays(bugun, 1), pri: 2, courseId: "k1" },
  { id: "g4", title: "Bitmiş", done: true, due: T.addDays(bugun, -9), pri: 2, courseId: "k1" },
  { id: "g5", title: "Daha eski", done: false, due: T.addDays(bugun, -7), pri: 0, courseId: "k1" }] }));
pl = T.dailyPlan();
es("plan: gelecek ve bitmiş görev alınmaz", pl.length, 2);
es("plan: en eski geciken önce", pl.map(r => r.baslik), ["Daha eski", "Eski"]);
es("plan: gecikme gün sayısı yazılıyor", pl[0].neden, "7 gün gecikti");
es("plan: dersi yazılıyor", pl[0].alt, "Fizik");

/* sınav yakınlığı konuları sıralar */
T.setDB(planDB({
  courses: [{ id: "k1", name: "Biyoloji" }, { id: "k2", name: "Tarih" }],
  exams: [{ id: "s1", name: "Bio", date: T.addDays(bugun, 20), courseId: "k1" },
          { id: "s2", name: "Tarih", date: T.addDays(bugun, 2), courseId: "k2" }],
  topics: [{ id: "t1", courseId: "k1", name: "Hücre", status: "learning" },
           { id: "t2", courseId: "k2", name: "Osmanlı", status: "learning" }] }));
pl = T.dailyPlan();
es("plan: yakın sınavın konusu önce", pl.map(r => r.baslik), ["Osmanlı", "Hücre"]);
es("plan: gerekçe sınavı ve kalan günü söylüyor", pl[0].neden, "Tarih sınavına 2 gün");
es("plan: satır başlatılabilir bilgiyi taşıyor", [pl[0].tip, pl[0].courseId, pl[0].topicId], ["konu", "k2", "t2"]);

/* "biliyorum" konular plana girmez */
T.setDB(planDB({ courses: [{ id: "k1", name: "X" }],
  exams: [{ id: "s1", name: "S", date: T.addDays(bugun, 3), courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Biliniyor", status: "known" },
           { id: "t2", courseId: "k1", name: "Öğreniliyor", status: "learning" }] }));
es("plan: bilinen konu atlanır", T.dailyPlan().map(r => r.baslik), ["Öğreniliyor"]);

/* aynı yakınlıkta başlanmamış konu, öğrenilene göre önde */
T.setDB(planDB({ courses: [{ id: "k1", name: "X" }],
  exams: [{ id: "s1", name: "S", date: T.addDays(bugun, 4), courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Devam eden", status: "learning" },
           { id: "t2", courseId: "k1", name: "Başlanmamış", status: "new" }] }));
es("plan: başlanmamış konu biraz önde", T.dailyPlan().map(r => r.baslik), ["Başlanmamış", "Devam eden"]);

/* sınavı olmayan derste 7 gündür dokunulmamış konu */
T.setDB(planDB({ courses: [{ id: "k1", name: "X" }],
  topics: [{ id: "t1", courseId: "k1", name: "İhmal", status: "learning" },
           { id: "t2", courseId: "k1", name: "Taze", status: "learning" }],
  sessions: [{ date: T.addDays(bugun, -2), min: 30, topicId: "t2" }] }));
pl = T.dailyPlan();
es("plan: son 7 günde çalışılan konu önerilmez", pl.map(r => r.baslik), ["İhmal"]);
es("plan: ihmal gerekçesi", pl[0].neden, "7 gündür dokunulmadı");

/* bugün çalışılan konu arkaya düşer ama yok olmaz */
T.setDB(planDB({ courses: [{ id: "k1", name: "X" }],
  exams: [{ id: "s1", name: "S", date: T.addDays(bugun, 3), courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Bugün çalışıldı", status: "learning" },
           { id: "t2", courseId: "k1", name: "Çalışılmadı", status: "learning" }],
  sessions: [{ date: bugun, min: 40, topicId: "t1" }] }));
es("plan: bugün çalışılan konu arkaya düşer",
  T.dailyPlan().map(r => r.baslik), ["Çalışılmadı", "Bugün çalışıldı"]);

/* ihmal ile sınav yakınlığı arasındaki denge — PLAN_IHMAL bunu belirler */
const dengeDB = gun => planDB({
  courses: [{ id: "k1", name: "Sınavlı" }, { id: "k2", name: "Sınavsız" }],
  exams: [{ id: "s1", name: "Yazılı", date: T.addDays(bugun, gun), courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Sınav konusu", status: "learning" },
           { id: "t2", courseId: "k2", name: "İhmal edilen", status: "learning" }] });
T.setDB(dengeDB(5));
es("plan: yakın sınav ihmali geçer", T.dailyPlan().map(r => r.baslik), ["Sınav konusu", "İhmal edilen"]);
T.setDB(dengeDB(30));
es("plan: uzak sınav ihmalin gerisinde kalır", T.dailyPlan().map(r => r.baslik), ["İhmal edilen", "Sınav konusu"]);
dogru("plan: denge noktası PLAN_IHMAL ile tutarlı", Math.abs(1 / T.PLAN_IHMAL - 10) < 1e-9);

/* bütçe ve satır sınırı */
const cokKonu = [...Array(20)].map((_, i) => ({ id: "t" + i, courseId: "k1", name: "K" + i, status: "learning" }));
T.setDB(planDB({ courses: [{ id: "k1", name: "X" }], topics: cokKonu,
  exams: [{ id: "s1", name: "S", date: T.addDays(bugun, 3), courseId: "k1" }] }));
es("plan: en fazla PLAN_SATIR satır", T.dailyPlan().length, T.PLAN_SATIR);
T.setDB(planDB({ settings: { goal: 50 }, courses: [{ id: "k1", name: "X" }], topics: cokKonu,
  exams: [{ id: "s1", name: "S", date: T.addDays(bugun, 3), courseId: "k1" }] }));
pl = T.dailyPlan();
es("plan: günlük hedef bütçesi aşılmaz", pl.length, 2);
dogru("plan: toplam süre hedefi aşmıyor", pl.reduce((a, r) => a + r.dk, 0) <= 50);

/* "bugün yapıldı" işaretleri tarih değişince sıfırlanır */
T.setDB(planDB());
T.planToggle("konu:t1");
es("plan: işaret eklendi", T.planDone(), ["konu:t1"]);
T.planToggle("konu:t1");
es("plan: işaret kaldırıldı", T.planDone(), []);
T.setDB(planDB({ settings: { goal: 120, planDone: { date: T.addDays(bugun, -1), ids: ["konu:t1"] } } }));
es("plan: dünkü işaretler bugüne taşınmaz", T.planDone(), []);

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
