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
  isNewCard, newLimit, newQuota, newSeenToday, newWaiting, NEW_PER_DAY, shuffled,
  clozeCards, noteCardPairs, weakTopics, snapZone, YASLA_KENAR, YASLA_KUTU,
  paketGecerli, paketOzet, paketUygula, PAKET_SURUM,
  examCourses, examList, courseContents, deleteCourse, hourOpts, COP_DERS_DIZI, PAKET_TALIMAT,
  SIK_MIN, SIK_MAX, SIK_VARSAYILAN,
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
es("çöp: kartın iki yüzünün görseli de bulunuyor",
  T.trashRefs({ type: "card", data: { img: "idb:on1", imgB: "idb:arka1" } }), ["idb:on1", "idb:arka1"]);
es("çöp: yalnızca arka yüz görseli olan kart",
  T.trashRefs({ type: "card", data: { imgB: "idb:arka2" } }), ["idb:arka2"]);
es("çöp: destedeki kartların görselleri bulunuyor",
  T.trashRefs({ type: "deck", data: { cards: [{ img: "idb:k1" }, {}, { img: "idb:k2" }] } }), ["idb:k1", "idb:k2"]);
es("çöp: destedeki kartların her iki yüzü de taranıyor",
  T.trashRefs({ type: "deck", data: { cards: [{ img: "idb:a", imgB: "idb:b" }, { imgB: "idb:c" }] } }),
  ["idb:a", "idb:b", "idb:c"]);
es("çöp: görevde görsel yok", T.trashRefs({ type: "task", data: { title: "x" } }), []);

/* ---------- günlük yeni kart sınırı ---------- */
const kartDB = (kartlar, ayar = {}) => ({ settings: { goal: 120, ...ayar }, trash: [], notes: [],
  decks: [], cards: kartlar, tasks: [], sessions: [], topics: [], courses: [], exams: [],
  quizzes: [], quizRuns: [], terms: [] });
const tazeKart = (id, deckId = "d1") => ({ id, deckId, front: id, back: id, ef: 2.5, int: 0, reps: 0, lapses: 0, due: bugun });

es("yeni kart: hiç değerlendirilmemiş kart yenidir", T.isNewCard({ id: "a" }), true);
es("yeni kart: değerlendirilmiş kart yeni değildir", T.isNewCard({ id: "a", seen: bugun }), false);
es("yeni kart: bilinemeyip reps sıfırlanan kart yine yeni değildir",
  T.isNewCard({ id: "a", reps: 0, seen: bugun }), false);

T.setDB(kartDB([...Array(30)].map((_, i) => tazeKart("y" + i))));
es("sınır: varsayılan günlük yeni kart sayısı", T.newLimit(), T.NEW_PER_DAY);
es("sınır: kuyruk günlük sınıra kırpılır", T.dueCards().length, T.NEW_PER_DAY);
es("sınır: bekleyen yeni kart sayısı tam sayılır", T.newWaiting(), 30);

T.setDB(kartDB([...Array(30)].map((_, i) => tazeKart("y" + i)), { newPerDay: 5 }));
es("sınır: ayardan okunur", T.dueCards().length, 5);
T.setDB(kartDB([...Array(30)].map((_, i) => tazeKart("y" + i)),
  { newPerDay: 5, newSeen: { date: bugun, n: 3 } }));
es("sınır: bugün görülenler kotadan düşer", T.dueCards().length, 2);
T.setDB(kartDB([...Array(30)].map((_, i) => tazeKart("y" + i)),
  { newPerDay: 5, newSeen: { date: T.addDays(bugun, -1), n: 5 } }));
es("sınır: dünkü sayaç bugünü etkilemez", T.dueCards().length, 5);

/* sınır 0 olsa da vadesi gelen eski kartlar gelmeli */
T.setDB(kartDB([
  ...[...Array(5)].map((_, i) => tazeKart("y" + i)),
  { id: "e1", deckId: "d1", due: bugun, seen: T.addDays(bugun, -3), reps: 2 },
  { id: "e2", deckId: "d1", due: T.addDays(bugun, -1), seen: T.addDays(bugun, -5), reps: 3 },
  { id: "e3", deckId: "d1", due: T.addDays(bugun, 4), seen: bugun, reps: 4 },
], { newPerDay: 0 }));
es("sınır: 0'da yeni kart verilmez, tekrar kartları gelir",
  T.dueCards().map(c => c.id), ["e1", "e2"]);

/* kota global harcanır: deste deste toplam, genel toplamla aynı olmalı */
T.setDB(kartDB([
  ...[...Array(8)].map((_, i) => tazeKart("a" + i, "dA")),
  ...[...Array(8)].map((_, i) => tazeKart("b" + i, "dB")),
], { newPerDay: 6 }));
es("sınır: kota global, deste toplamı genel toplamı aşmaz",
  T.dueCards("dA").length + T.dueCards("dB").length, T.dueCards().length);
es("sınır: kota ilk gelen desteye harcanır", T.dueCards("dA").length, 6);

/* ---------- kuyruk karıştırma ---------- */
const dizi = [...Array(12)].map((_, i) => "k" + i);
const kar = T.shuffled(dizi);
es("karıştırma: kaynağı değiştirmiyor", dizi, [...Array(12)].map((_, i) => "k" + i));
es("karıştırma: aynı elemanlar, aynı sayıda", kar.slice().sort(), dizi.slice().sort());
es("karıştırma: boş dizi", T.shuffled([]), []);
es("karıştırma: tek eleman", T.shuffled(["a"]), ["a"]);
/* 40 denemede hiç farklı sıra çıkmazsa karıştırma çalışmıyordur (12! olasılık) */
dogru("karıştırma gerçekten sırayı değiştiriyor",
  [...Array(40)].some(() => T.shuffled(dizi).join() !== dizi.join()));

/* ---------- boşluk doldurma ---------- */
es("cloze: tek boşluk",
  T.clozeCards("Hücrenin enerji merkezi {{c1::mitokondri}}dir."),
  [{ front: "Hücrenin enerji merkezi […]dir.", back: "Hücrenin enerji merkezi mitokondridir." }]);
es("cloze: iki numara iki kart, diğeri açık kalır",
  T.clozeCards("{{c1::Ankara}} {{c2::1923}}'te başkent oldu.").map(c => c.front),
  ["[…] 1923'te başkent oldu.", "Ankara […]'te başkent oldu."]);
es("cloze: aynı numara birden çok yerde tek kart",
  T.clozeCards("{{c1::a}} ve {{c1::b}}").map(c => c.front), ["[…] ve […]"]);
es("cloze: boşluk yoksa kart yok", T.clozeCards("düz metin"), []);

es("kart çıkarma: Soru :: Cevap",
  T.noteCardPairs("Türev nedir :: Anlık değişim oranı"),
  [{ front: "Türev nedir", back: "Anlık değişim oranı" }]);
es("kart çıkarma: liste imi kırpılır",
  T.noteCardPairs("- Türev :: Değişim").map(c => c.front), ["Türev"]);
es("kart çıkarma: cloze satırı Soru::Cevap sanılmaz",
  T.noteCardPairs("Başkent {{c1::Ankara}}"),
  [{ front: "Başkent […]", back: "Başkent Ankara" }]);
es("kart çıkarma: ikisi bir arada",
  T.noteCardPairs("Türev :: Değişim\nboş satır yok\nBaşkent {{c1::Ankara}}\n\n- Hız :: Yol/zaman").map(c => c.front),
  ["Türev", "Başkent […]", "Hız"]);

/* ---------- zayıf konular ---------- */
T.setDB({ ...kartDB([]), topics: [
    { id: "t1", courseId: "k1", name: "Türev" },
    { id: "t2", courseId: "k1", name: "İntegral" },
    { id: "t3", courseId: "k1", name: "Limit" }],
  courses: [{ id: "k1", name: "Matematik" }],
  quizRuns: [
    { id: "r1", topics: { t1: [1, 3], t2: [4, 0], t3: [1, 1] } },
    { id: "r2", topics: { t1: [0, 2], t2: [2, 1] } }] });
let zy = T.weakTopics();
es("zayıf konu: en yüksek yanlış oranı başta", zy.map(z => z.ad), ["Türev", "İntegral"]);
es("zayıf konu: denemeler toplanıyor", [zy[0].dogru, zy[0].yanlis], [1, 5]);
es("zayıf konu: az denenen konu elenir (t3 yalnızca 2 soru)", zy.some(z => z.ad === "Limit"), false);
es("zayıf konu: eşik düşürülünce görünür", T.weakTopics(2).map(z => z.ad), ["Türev", "Limit", "İntegral"]);
es("zayıf konu: hiç yanlışı olmayan listeye girmez",
  T.weakTopics(1).some(z => z.yanlis === 0), false);
es("zayıf konu: sınır uygulanıyor", T.weakTopics(1, 1).length, 1);
T.setDB({ ...kartDB([]), quizRuns: [{ id: "r1", correct: 3, total: 4 }] });
es("zayıf konu: konu işaretlenmemişse boş", T.weakTopics(), []);

/* ---------- paket içe aktarma ---------- */
const bosVeri = () => ({ settings: {}, trash: [], notes: [], decks: [], cards: [], tasks: [],
  sessions: [], topics: [], courses: [], exams: [], quizzes: [], quizRuns: [], terms: [] });
const paket = (x = {}) => ({ studyosPaket: 1, ad: "Test paketi", ders: "Biyoloji",
  konular: ["Hücre"],
  desteler: [{ ad: "Organeller", kartlar: [
    { on: "Mitokondri", arka: "Enerji merkezi" }, { on: "Ribozom", arka: "Protein sentezi" }] }],
  testler: [{ ad: "Hücre testi", sorular: [
    { s: "Enerji merkezi?", secenekler: ["Mitokondri", "Ribozom", "Lizozom", "Koful"], dogru: 0,
      aciklama: "ATP burada üretilir", konu: "Hücre" }] }],
  terimler: [{ terim: "Mitokondri", tanim: "Enerji üreten organel", esanlam: ["mitokondriler"] }],
  ...x });

es("paket: geçerlilik", [T.paketGecerli(paket()), T.paketGecerli({}), T.paketGecerli(null),
  T.paketGecerli({ studyosPaket: 99, desteler: [] })], [true, false, false, false]);
es("paket: özet sayıları", (({ deste, kart, test, soru, terim, konu, ders }) =>
  ({ deste, kart, test, soru, terim, konu, ders }))(T.paketOzet(paket())),
  { deste: 1, kart: 2, test: 1, soru: 1, terim: 1, konu: 1, ders: "Biyoloji" });

/* boş veriye uygulama */
let pdb = bosVeri(); T.setDB(pdb);
let ek = T.paketUygula(paket());
es("paket: eklenenler", [ek.deste, ek.kart, ek.test, ek.soru, ek.terim, ek.konu],
  [1, 2, 1, 1, 1, 1]);
es("paket: ders açıldı", T.getDB().courses.map(c => c.name), ["Biyoloji"]);
es("paket: kartlar destede", T.getDB().cards.map(c => c.front), ["Mitokondri", "Ribozom"]);
es("paket: kart bugün vadeli ve taze", [T.getDB().cards[0].due, T.getDB().cards[0].reps,
  T.getDB().cards[0].ef], [bugun, 0, 2.5]);
es("paket: soru konuya bağlandı",
  T.getDB().quizzes[0].questions[0].topicId, T.getDB().topics[0].id);
es("paket: terim eklendi", [T.getDB().terms[0].term, T.getDB().terms[0].alt],
  ["Mitokondri", ["mitokondriler"]]);

/* MEVCUT VERİ KORUNMALI */
pdb = bosVeri();
pdb.courses = [{ id: "k0", name: "Matematik", color: "#000" }];
pdb.notes = [{ id: "n0", title: "Eski not" }];
pdb.cards = [{ id: "c0", deckId: "d0", front: "eski kart" }];
pdb.decks = [{ id: "d0", name: "Eski deste", courseId: "k0" }];
T.setDB(pdb);
T.paketUygula(paket());
es("paket: eski not duruyor", T.getDB().notes.map(n => n.id), ["n0"]);
es("paket: eski kart duruyor", T.getDB().cards[0].id, "c0");
es("paket: eski deste duruyor", T.getDB().decks[0].id, "d0");
es("paket: yeni ders eklendi, eski silinmedi",
  T.getDB().courses.map(c => c.name), ["Matematik", "Biyoloji"]);

/* aynı adlı ders varsa ona bağlanır, ikinci kez açılmaz */
pdb = bosVeri(); pdb.courses = [{ id: "kb", name: "biyoloji", color: "#000" }];
T.setDB(pdb); T.paketUygula(paket());
es("paket: aynı adlı ders tekrar açılmıyor (büyük/küçük harf)",
  T.getDB().courses.length, 1);
es("paket: deste mevcut derse bağlandı", T.getDB().decks[0].courseId, "kb");

/* iki kez almak kopya üretmemeli */
pdb = bosVeri(); T.setDB(pdb);
T.paketUygula(paket());
const ek2 = T.paketUygula(paket());
es("paket: ikinci alımda kart kopyalanmıyor", T.getDB().cards.length, 2);
es("paket: ikinci alımda deste ve terim kopyalanmıyor",
  [T.getDB().decks.length, T.getDB().terms.length], [1, 1]);
dogru("paket: ikinci alımda atlananlar sayılıyor", ek2.atlanan >= 3);
es("paket: aynı adlı test çakışmasın diye numaralanıyor",
  T.getDB().quizzes.map(q => q.name), ["Hücre testi", "Hücre testi (2)"]);

/* 5 şıklı (TUS) soru alınır; şık sayısı sınır dışıysa atlanır */
pdb = bosVeri(); T.setDB(pdb);
ek = T.paketUygula(paket({ desteler: [], terimler: [], testler: [{ ad: "Şık testi", sorular: [
  { s: "Beş şık?", secenekler: ["a", "b", "c", "d", "e"], dogru: 4 },
  { s: "Altı şık?", secenekler: ["a", "b", "c", "d", "e", "f"], dogru: 5 },
  { s: "Yedi şık?", secenekler: ["a", "b", "c", "d", "e", "f", "g"], dogru: 0 },
  { s: "Tek şık?", secenekler: ["a"], dogru: 0 }] }] }));
es("paket: 5 ve 6 şıklı sorular alınıyor, 1 ve 7 şıklı atlanıyor",
  [ek.soru, ek.atlanan, T.getDB().quizzes[0].questions.map(q => q.ch.length)], [2, 2, [5, 6]]);
es("paket: 5 şıklı sorunun doğru şıkkı E", T.getDB().quizzes[0].questions[0].a, 4);
es("şık sınırları: yeni soru TUS gibi 5 şıkla açılır, sınır 2-6",
  [T.SIK_VARSAYILAN, T.SIK_MIN, T.SIK_MAX], [5, 2, 6]);
dogru("paket talimatı 5 şıklı örnek veriyor", T.PAKET_TALIMAT.includes('"<e>"'));

/* notlar bölümü (4.2): konu anlatımı Notlar'a düşer, aynı başlık ikinci kez alınmaz */
pdb = bosVeri(); T.setDB(pdb);
const notluPaket = paket({ desteler: [], testler: [], terimler: [],
  notlar: [{ baslik: "Hücre — özet", icerik: "# Hücre\n\n- Mitokondri ATP üretir." }, { baslik: "", icerik: "boş" }] });
es("paket: yalnızca notlu paket geçerli", T.paketGecerli({ studyosPaket: 1, notlar: [] }), true);
es("paket: özet not sayısını veriyor", T.paketOzet(notluPaket).not, 2);
ek = T.paketUygula(notluPaket);
es("paket: not eklendi, başlıksız atlandı", [ek.not, ek.atlanan], [1, 1]);
es("paket: not derse bağlı ve gövdesi markdown", [T.getDB().notes[0].title, T.getDB().notes[0].courseId,
  T.getDB().notes[0].body.startsWith("# Hücre")], ["Hücre — özet", T.getDB().courses[0].id, true]);
ek = T.paketUygula(notluPaket);
es("paket: aynı başlıklı not ikinci alımda kopyalanmıyor", [ek.not, T.getDB().notes.length], [0, 1]);
dogru("paket talimatı notlar bölümünü anlatıyor", T.PAKET_TALIMAT.includes('"notlar"'));

/* bozuk kayıtlar atlanır, sağlamlar alınır */
pdb = bosVeri(); T.setDB(pdb);
ek = T.paketUygula(paket({
  desteler: [{ ad: "Karışık", kartlar: [
    { on: "Sağlam", arka: "Tanım" }, { on: "", arka: "arka yok ön" }, { on: "Ön var", arka: "" }] }],
  testler: [{ ad: "Bozuk test", sorular: [
    { s: "Geçerli?", secenekler: ["a", "b"], dogru: 1 },
    { s: "Şık yok", secenekler: [], dogru: 0 },
    { s: "Doğru şık aralık dışı", secenekler: ["a", "b"], dogru: 5 },
    { s: "Boş şık", secenekler: ["a", ""], dogru: 0 }] }],
  terimler: [{ terim: "Tanımsız", tanim: "" }] }));
es("paket: eksik kartlar atlanıyor", T.getDB().cards.map(c => c.front), ["Sağlam"]);
es("paket: bozuk sorular atlanıyor", T.getDB().quizzes[0].questions.length, 1);
es("paket: tanımsız terim atlanıyor", T.getDB().terms.length, 0);
dogru("paket: atlananlar raporlanıyor", ek.atlanan === 6);

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
es("plan: gerekçe sınavı ve kalan günü söylüyor", pl[0].neden, "Tarih · 2 gün kaldı");
/* sınav adı "sınav" içerdiğinde metin tekrarlanmamalı */
T.setDB(planDB({ courses: [{ id: "k1", name: "Mat" }],
  exams: [{ id: "s1", name: "Matematik deneme sınavı", date: T.addDays(bugun, 5), courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Türev", status: "learning" }] }));
es("plan: sınav adı tekrarlanmıyor", T.dailyPlan()[0].neden, "Matematik deneme sınavı · 5 gün kaldı");
T.setDB(planDB({ courses: [{ id: "k1", name: "Mat" }],
  exams: [{ id: "s1", name: "Yazılı", date: bugun, courseId: "k1" }],
  topics: [{ id: "t1", courseId: "k1", name: "Türev", status: "learning" }] }));
es("plan: bugünkü sınav ayrı yazılıyor", T.dailyPlan()[0].neden, "Yazılı · bugün!");
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

/* ---------- pencere yaslama bölgeleri ---------- */
const masa = { left: 0, top: 30, right: 1000, width: 1000, height: 770 };
const nokta = (x, y) => ({ clientX: x, clientY: y });
es("yaslama: ortada bölge yok", T.snapZone(nokta(500, 400), masa), null);
es("yaslama: sol kenar", T.snapZone(nokta(5, 400), masa), "sol");
es("yaslama: sağ kenar", T.snapZone(nokta(995, 400), masa), "sag");
es("yaslama: üst kenar", T.snapZone(nokta(500, 35), masa), "max");
/* köşede yarım ekran kazanmalı — asıl istenen yan yana çalışmak */
es("yaslama: sol üst köşe sol yarıyı verir", T.snapZone(nokta(4, 32), masa), "sol");
es("yaslama: sağ üst köşe sağ yarıyı verir", T.snapZone(nokta(998, 32), masa), "sag");
es("yaslama: eşiğin hemen dışı boş", T.snapZone(nokta(T.YASLA_KENAR + 1, 400), masa), null);
/* masaüstü 30px menü çubuğunun altında başlar: bölgeler onun üstüne göre ölçülür */
es("yaslama: üst eşiğin altı boş", T.snapZone(nokta(500, 30 + T.YASLA_KENAR + 1), masa), null);
es("yaslama: masaüstünün üstü de üst bölge sayılır", T.snapZone(nokta(500, 25), masa), "max");
es("yaslama: kutular yarım genişlik", [T.YASLA_KUTU.sol.width, T.YASLA_KUTU.sag.left], ["50%", "50%"]);

/* ---------- çok dersli sınav ---------- */
T.setDB(planDB({ courses: [{ id: "k1", name: "Anatomi" }, { id: "k2", name: "Fizyoloji" }] }));
es("sınav: eski tek dersli kayıt", T.examCourses({ courseId: "k1" }), ["k1"]);
es("sınav: çok dersli kayıt", T.examCourses({ courseIds: ["k1", "k2"] }), ["k1", "k2"]);
es("sınav: tekrarlar ayıklanır", T.examCourses({ courseIds: ["k1", "k1", "k2"] }), ["k1", "k2"]);
es("sınav: silinmiş ders düşer", T.examCourses({ courseIds: ["k1", "yok"] }), ["k1"]);
es("sınav: boş kayıt", T.examCourses({}), []);
es("sınav: courseIds courseId'yi ezer", T.examCourses({ courseId: "k1", courseIds: ["k2"] }), ["k2"]);

/* TUS gibi bir sınav bütün derslerin konularını plana sokmalı */
T.setDB(planDB({
  courses: [{ id: "k1", name: "Anatomi" }, { id: "k2", name: "Fizyoloji" }],
  topics: [{ id: "t1", courseId: "k1", name: "Kemikler", status: "new" },
           { id: "t2", courseId: "k2", name: "Kalp", status: "learning" }],
  exams: [{ id: "s1", name: "TUS", date: T.addDays(bugun, 10), courseIds: ["k1", "k2"] }] }));
pl = T.dailyPlan().filter(r => r.tip === "konu");
es("plan: çok dersli sınav iki dersi de kapsar",
  pl.map(r => r.baslik).sort(), ["Kalp", "Kemikler"]);
dogru("plan: gerekçede sınav adı geçer", pl.every(r => r.neden.includes("TUS")));

/* ---------- takvim blok süresi ---------- */
es("blok: süre seçenekleri gün sonunu aşmaz", T.hourOpts(3).map(o => o.v), ["1", "2", "3"]);
es("blok: en çok 8 saat", T.hourOpts(99).length, 8);
es("blok: en az 1 saat", T.hourOpts(0).map(o => o.v), ["1"]);

/* ---------- ders silme ---------- */
const dersDB = () => planDB({
  courses: [{ id: "k1", name: "Anatomi", color: "#f00" }, { id: "k2", name: "Fizyoloji", color: "#0f0" }],
  topics: [{ id: "t1", courseId: "k1", name: "Kemikler", status: "new" },
           { id: "t2", courseId: "k2", name: "Kalp", status: "new" }],
  notes: [{ id: "n1", courseId: "k1", title: "Not", body: "x" }],
  decks: [{ id: "d1", courseId: "k1", name: "Deste" }],
  cards: [{ id: "c1", deckId: "d1", front: "a", back: "b", due: bugun },
          { id: "c2", deckId: "d9", front: "a", back: "b", due: bugun }],
  tasks: [{ id: "g1", courseId: "k1", title: "Görev", done: false }],
  quizzes: [{ id: "q1", courseId: "k1", name: "Test", questions: [] }],
  events: [{ id: "e1", courseId: "k1", day: 0, start: 9, end: 10, title: "Blok" }],
  sessions: [{ id: "o1", courseId: "k1", date: bugun, min: 25, kind: "focus" }],
  terms: [{ id: "m1", courseId: "k1", term: "Femur", def: "kemik" }],
  exams: [{ id: "s1", name: "Anatomi finali", date: T.addDays(bugun, 5), courseIds: ["k1"] },
          { id: "s2", name: "TUS", date: T.addDays(bugun, 30), courseIds: ["k1", "k2"] }],
  quizRuns: [] });

T.setDB(dersDB());
let ic = T.courseContents("k1");
es("ders: içerik sayımı", [ic.topics.length, ic.notes.length, ic.decks.length, ic.cards.length,
  ic.tasks.length, ic.quizzes.length, ic.events.length, ic.sessions.length, ic.terms.length],
  [1, 1, 1, 1, 1, 1, 1, 1, 1]);
es("ders: yalnız bu dersin sınavı silinir", ic.exams.map(e => e.id), ["s1"]);
es("ders: çok dersli sınav kırpılır", ic.examEk, ["s2"]);
es("ders: başka desteye ait kart alınmaz", ic.cards.map(c => c.id), ["c1"]);

T.deleteCourse("k1");
let d2 = T.getDB();
es("ders: ders silindi", d2.courses.map(c => c.id), ["k2"]);
es("ders: konular silindi", d2.topics.map(t => t.id), ["t2"]);
es("ders: notlar silindi", d2.notes.length, 0);
es("ders: deste ve kartı silindi", [d2.decks.length, d2.cards.map(c => c.id)], [0, ["c2"]]);
es("ders: görev/test/blok/oturum/terim silindi",
  [d2.tasks.length, d2.quizzes.length, d2.events.length, d2.sessions.length, d2.terms.length],
  [0, 0, 0, 0, 0]);
es("ders: tek dersli sınav gitti, çok dersli kaldı", d2.exams.map(e => e.id), ["s2"]);
es("ders: çok dersli sınavdan yalnız bu ders düştü",
  d2.exams.find(e => e.id === "s2").courseIds, ["k2"]);
es("ders: tek çöp kaydı yazıldı", [d2.trash.length, d2.trash[0].type], [1, "course"]);
dogru("ders: çöp etiketi ders adı", d2.trash[0].label === "Anatomi");

T.restoreTrash(d2.trash[0].id);
d2 = T.getDB();
es("ders: geri alınca ders döndü", d2.courses.map(c => c.id).sort(), ["k1", "k2"]);
es("ders: geri alınca konular döndü", d2.topics.map(t => t.id).sort(), ["t1", "t2"]);
es("ders: geri alınca deste+kart döndü", [d2.decks.length, d2.cards.length], [1, 2]);
es("ders: geri alınca sınav döndü", d2.exams.map(e => e.id).sort(), ["s1", "s2"]);
es("ders: çok dersli sınav yeniden kapsıyor",
  T.examCourses(d2.exams.find(e => e.id === "s2")).sort(), ["k1", "k2"]);
es("ders: çöp boşaldı", d2.trash.length, 0);
es("ders: geri alınca not/görev/terim döndü",
  [d2.notes.length, d2.tasks.length, d2.terms.length, d2.quizzes.length,
   d2.events.length, d2.sessions.length], [1, 1, 1, 1, 1, 1]);

/* dizi listesi ile gerçek şema uyuşmalı — yeni koleksiyon eklenirse burada patlar */
dogru("ders: silme listesindeki diziler DB'de var",
  T.COP_DERS_DIZI.every(k => Array.isArray(T.getDB()[k])));

T.setDB(dersDB());
es("ders: olmayan ders silinmez", T.deleteCourse("yok"), null);

/* ---------- paket talimatı ---------- */
/* Uygulamadaki metin ile PAKET.md'deki talimat ayrışmasın */
{
  const md = fs.readFileSync(path.join(KOK, "PAKET.md"), "utf8");
  const blok = (md.split("## Talimat (kopyalanacak bölüm)")[1] || "").split("```")[1] || "";
  es("paket talimatı PAKET.md ile aynı", blok.trim(), T.PAKET_TALIMAT.trim());
  dogru("paket talimatı biçim anahtarlarını içerir",
    ["studyosPaket", "desteler", "testler", "terimler", "secenekler", "dogru"]
      .every(k => T.PAKET_TALIMAT.includes(k)));
}

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
