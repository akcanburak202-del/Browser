/* StudyOS duman testi — değişiklikten sonra: node tests/smoke.mjs
   Playwright gerekir (npm i -D playwright ya da global kurulum). */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
for (const p of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.error("Playwright bulunamadı"); process.exit(2); }

const URL = "file://" + process.cwd() + "/index.html";
const out = [];
let fails = 0;
const check = (ad, kosul, detay = "") => {
  out.push(`${kosul ? "✓" : "✗"} ${ad}${detay ? " — " + detay : ""}`);
  if (!kosul) fails++;
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = [];
p.on("pageerror", e => errs.push("PAGEERROR " + e.message));
p.on("console", m => { if (m.type() === "error" && !/manifest|sw\.js|favicon/i.test(m.text())) errs.push("CONSOLE " + m.text()); });
p.on("dialog", d => d.accept());

await p.goto(URL);
await p.waitForTimeout(800);

check("açılışta pencere açılmıyor", (await p.evaluate(() => WINS.size)) === 0);
check("sürüm okunuyor", !!(await p.evaluate(() => VERSION)), await p.evaluate(() => VERSION));

/* tüm uygulamalar açılıyor */
const ids = await p.evaluate(() => Object.keys(APPS));
for (const id of ids) { await p.evaluate(i => openApp(i), id); await p.waitForTimeout(80); }
check("tüm uygulamalar açıldı", (await p.evaluate(() => WINS.size)) === ids.length, ids.length + " uygulama");
await p.evaluate(() => { for (const w of WINS.values()) closeWin(w); });

/* pencere sürükleme */
await p.evaluate(() => openApp("notes"));
await p.waitForTimeout(300);
const box = await p.locator(".win .titlebar").boundingBox();
await p.mouse.move(box.x + 150, box.y + 10);
await p.mouse.down();
for (let i = 1; i <= 15; i++) { await p.mouse.move(box.x + 150 + i * 10, box.y + 10 + i * 6); await p.waitForTimeout(8); }
await p.mouse.up();
const moved = await p.evaluate(() => { const n = document.querySelector(".win"); return [parseInt(n.style.left), parseInt(n.style.top)]; });
check("pencere sürükleniyor", moved[0] > 100 && moved[1] > 40, moved.join(","));

/* görev ekleme: düğme, Enter, form */
await p.evaluate(() => { for (const w of WINS.values()) closeWin(w); openApp("tasks"); });
await p.waitForTimeout(300);
const t0 = await p.evaluate(() => DB.tasks.length);
await p.fill('[data-a="new"]', "test A"); await p.click('[data-a="add"]'); await p.waitForTimeout(200);
await p.fill('[data-a="new"]', "test B"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
await p.fill('[data-a="new"]', "test C");
await p.evaluate(() => document.querySelector('[data-a="form"]').requestSubmit());
await p.waitForTimeout(200);
check("görev ekleme (düğme/Enter/form)", (await p.evaluate(() => DB.tasks.length)) === t0 + 3);

/* çalışma kronometresi */
await p.evaluate(() => { for (const w of WINS.values()) closeWin(w); });
await p.waitForTimeout(200);
await p.click('[data-st="start"]');
await p.waitForTimeout(1200);
check("kronometre çalışıyor", await p.evaluate(() => Study.on));
await p.reload(); await p.waitForTimeout(1000);
check("kronometre yenilemeden sonra sürüyor", await p.evaluate(() => Study.on));
await p.click('[data-st="stop"]'); await p.waitForTimeout(400);
check("oturum kaydedildi", await p.evaluate(() => DB.sessions.at(-1)?.kind === "study"));

/* iç bağlantı + backlink */
await p.evaluate(() => {
  const t = today();
  DB.notes.push({ id: "sm1", courseId: DB.courses[0]?.id, title: "Hedef", body: "hedef not", created: t, updated: t });
  DB.notes.push({ id: "sm2", courseId: DB.courses[0]?.id, title: "Kaynak", body: "bak: [[Hedef]]", created: t, updated: t });
  save(); openNote("sm2", true);
});
await p.waitForTimeout(400);
check("wikilink çiziliyor", (await p.evaluate(() => document.querySelectorAll(".md-prev .wl").length)) === 1);
await p.click(".md-prev .wl"); await p.waitForTimeout(400);
check("wikilink hedefi açıyor", (await p.evaluate(() => [...WINS.values()].find(w => w.appId === "notes")?.state.id)) === "sm1");
check("backlink görünüyor", (await p.evaluate(() => document.querySelectorAll("[data-bl]").length)) >= 1);

/* sözlük balonu */
await p.evaluate(() => {
  DB.terms.push({ id: "sg1", term: "Sitoplazma", alt: [], def: "Hücre içi sıvı.", courseId: DB.courses[0]?.id, noteId: "" });
  DB.notes.find(n => n.id === "sm1").body = "Hücrede Sitoplazma bulunur.";
  buildTerms(); save(); openNote("sm1", true);
});
await p.waitForTimeout(400);
check("terim işaretleniyor", (await p.evaluate(() => document.querySelectorAll(".md-prev .gterm").length)) === 1);
await p.click(".md-prev .gterm"); await p.waitForTimeout(300);
check("tanım balonu açılıyor", await p.evaluate(() => document.querySelector("#termpop")?.classList.contains("on")));

/* görüntüleyici */
await p.evaluate(() => openViewer(new File(["merhaba"], "a.txt", { type: "text/plain" })));
await p.waitForTimeout(500);
check("görüntüleyici metni gösteriyor", (await p.evaluate(() => document.querySelector(".vtext")?.textContent)) === "merhaba");

/* medya IndexedDB'ye gidiyor, localStorage şişmiyor */
const store = await p.evaluate(async () => {
  const ref = await putMedia("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
  DB.cards.push({ id: "smc", deckId: DB.decks[0]?.id, front: "x", back: "y", img: ref, ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() });
  flush();
  return { ref, ls: localStorage.getItem("studyos.v1").length, keys: (await idbKeys()).length };
});
check("medya IndexedDB'de", store.ref.startsWith("idb:") && store.keys > 0);
check("metin deposu küçük kalıyor", store.ls < 200000, store.ls + " karakter");

await p.waitForTimeout(300);
check("konsol hatası yok", errs.length === 0, errs.slice(0, 3).join(" | "));
await p.close();

/* ---------- veri güvenliği (sürüm 2.3) ---------- */
const p2 = await b.newPage({ viewport: { width: 1200, height: 800 } });
const errs2 = [];
p2.on("pageerror", e => errs2.push("PAGEERROR " + e.message));
p2.on("console", m => { if (m.type() === "error" && !/manifest|sw\.js|favicon/i.test(m.text())) errs2.push("CONSOLE " + m.text()); });
p2.on("dialog", d => d.accept());

/* bozuk localStorage: örnek veriyle ezilmemeli, uyarı ekranı açılmalı */
const BOZUK = "{bu-gecerli-json-degil";
await p2.goto(URL); await p2.waitForTimeout(400);
await p2.evaluate(b => { LOCK_SAVE = true; localStorage.setItem("studyos.v1", b); }, BOZUK);
await p2.reload(); await p2.waitForTimeout(900);
const ham = () => p2.evaluate(() => localStorage.getItem("studyos.v1"));
check("bozuk veri uyarı ekranı açılıyor",
  await p2.evaluate(() => document.body.textContent.includes("Kayıtlı veri okunamadı")));
check("bozuk veri örnek veriyle ezilmiyor", (await ham()) === BOZUK);
check("bozuk veri ayrı anahtara kopyalanıyor",
  (await p2.evaluate(() => localStorage.getItem("studyos.v1.bozuk"))) === BOZUK);
check("bozuk veride kaydetme kilitli", await p2.evaluate(() => LOCK_SAVE === true));
await p2.evaluate(() => { DB.tasks.push({ id: "z", title: "z", done: false, pri: 1 }); save(); });
await p2.waitForTimeout(700);
check("kilitliyken save() yazmıyor", (await ham()) === BOZUK);
await p2.evaluate(() => [...document.querySelectorAll("button")].find(x => x.textContent.includes("Boş başla")).click());
await p2.waitForTimeout(400);
check("'Boş başla' kilidi açıp yazıyor",
  await p2.evaluate(() => LOCK_SAVE === false && localStorage.getItem("studyos.v1").startsWith("{")
    && localStorage.getItem("studyos.v1.bozuk") === null));

/* depo dolduğunda uyarı susmuyor, veri "kirli" kalıyor */
await p2.goto(URL); await p2.waitForTimeout(500);
await p2.evaluate(() => {
  const orij = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (k, v) => { if (k === "studyos.v1") { const e = new Error("kota"); e.name = "QuotaExceededError"; throw e; } orij(k, v); };
  DB.tasks.push({ id: "q", title: "q", done: false, pri: 1 }); saveNow();
});
await p2.waitForTimeout(250);
check("kota hatasında menü çubuğu uyarıyor",
  await p2.evaluate(() => getComputedStyle(document.querySelector("#mbSave")).display !== "none"));
check("kota hatasında widget uyarıyor",
  await p2.evaluate(() => document.querySelector("#widgets").textContent.includes("KAYDEDİLEMİYOR")));
check("yazılamayan veri kirli kalıyor (tekrar denenecek)", await p2.evaluate(() => _dirty === true));
await p2.evaluate(() => { delete localStorage.setItem; saveNow(); });
await p2.waitForTimeout(250);
check("yazma düzelince uyarı kalkıyor",
  await p2.evaluate(() => SAVE_FAILED === false && getComputedStyle(document.querySelector("#mbSave")).display === "none"));

/* ikinci sekme uyarısı */
await p2.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "studyos.v1" })));
await p2.waitForTimeout(200);
check("başka sekme yazınca uyarılıyor",
  await p2.evaluate(() => document.body.textContent.includes("başka bir sekmede değişti")));

/* ---------- anlık görüntü + çöp kutusu (sürüm 2.4) ---------- */
await p2.goto(URL); await p2.waitForTimeout(700);

/* çöpteki görsel duruyor, ancak kalıcı silinince bırakılıyor */
const medya = await p2.evaluate(async () => {
  const ref = await putMedia("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
  const c = { id: "mc", deckId: "d", front: "ön", back: "arka", img: ref };
  DB.cards.push(c); DB.trash = [];
  toTrash("card", "ön", c); DB.cards = DB.cards.filter(x => x.id !== "mc"); saveNow();
  const copta = (await idbKeys()).includes(ref.slice(4));
  dropTrash(DB.trash[0].id); saveNow();
  await new Promise(r => setTimeout(r, 400));
  return { copta, sonra: (await idbKeys()).includes(ref.slice(4)) };
});
check("çöpteyken görsel duruyor", medya.copta === true);
check("kalıcı silinince görsel bırakılıyor", medya.sonra === false);

/* anlık görüntü o anki hali tutuyor, medya içermiyor */
const snap = await p2.evaluate(async () => {
  for (const k of await idbOp("readonly", st => st.getAllKeys(), "snaps")) await snapDel(k);
  DB.notes = [{ id: "sn1", title: "ANLIK-ONCE", body: "", created: today(), updated: today() }];
  saveNow();
  await takeSnapshot("elle");
  DB.notes[0].title = "SONRA"; saveNow();
  const l = await snapAll();
  return { sayi: l.length, icerikteki: JSON.parse(l[0].json).notes[0].title,
    simdiki: DB.notes[0].title, medyaYok: l[0].json.indexOf("_media") < 0 };
});
check("anlık görüntü alınıyor", snap.sayi === 1 && snap.medyaYok);
check("anlık görüntü o anki hali tutuyor", snap.icerikteki === "ANLIK-ONCE" && snap.simdiki === "SONRA");

/* geri dönüş: önce şu anki hal saklanıyor, sonra dönülüyor */
await p2.evaluate(async () => { const l = await snapAll(); await restoreSnapshot(l[0].key); });
await p2.waitForTimeout(600);
check("anlık görüntüden geri dönülüyor",
  (await p2.evaluate(() => DB.notes[0].title)) === "ANLIK-ONCE");
check("geri dönmeden önce şu anki hal saklanıyor",
  await p2.evaluate(async () => (await snapAll()).some(x => x.reason === "restore")));
check("geri dönüş localStorage'a da yazıldı",
  await p2.evaluate(() => JSON.parse(localStorage.getItem("studyos.v1")).notes[0].title === "ANLIK-ONCE"));

/* sayı sınırı: 7 günlük + 3 etiketli */
const budama = await p2.evaluate(async () => {
  for (const k of await idbOp("readonly", st => st.getAllKeys(), "snaps")) await snapDel(k);
  for (let i = 0; i < 10; i++) await takeSnapshot("gunluk");
  for (let i = 0; i < 5; i++) await takeSnapshot("elle");
  const l = await snapAll();
  return { gunluk: l.filter(x => x.reason === "gunluk").length,
           etiket: l.filter(x => x.reason !== "gunluk").length };
});
check("anlık görüntü sayısı sınırlanıyor", budama.gunluk === 7 && budama.etiket === 3,
  budama.gunluk + " günlük / " + budama.etiket + " etiketli");

/* günlük anlık görüntü günde bir kez */
const gunluk = await p2.evaluate(async () => {
  for (const k of await idbOp("readonly", st => st.getAllKeys(), "snaps")) await snapDel(k);
  DB.settings.lastSnap = null;
  await dailySnapshot(); await dailySnapshot();
  return { adet: (await snapAll()).length, damga: DB.settings.lastSnap };
});
check("günlük anlık görüntü günde bir kez alınıyor", gunluk.adet === 1 && gunluk.damga === await p2.evaluate(() => today()));

/* çöp kutusu ekranı gerçekten açılıyor ve geri alma düğmesi çalışıyor */
await p2.evaluate(() => { DB.trash = [];
  DB.notes = [{ id: "cp1", title: "Çöpe gidecek", body: "", created: today(), updated: today() }];
  const n = DB.notes[0];
  toTrash("note", n.title, n); DB.notes = DB.notes.filter(x => x.id !== n.id); saveNow(); trashScreen(); });
await p2.waitForTimeout(300);
check("çöp ekranı açılıyor", await p2.evaluate(() => document.body.textContent.includes("Çöp kutusu")));
await p2.evaluate(() => document.querySelector("[data-geri]").click());
await p2.waitForTimeout(400);
check("çöp ekranından geri alınıyor",
  await p2.evaluate(() => DB.notes.some(x => x.id === "cp1") && DB.trash.length === 0));

/* ---------- günlük plan widget'ı (sürüm 2.5) ---------- */
await p2.goto(URL); await p2.waitForTimeout(700);
await p2.evaluate(() => {
  DB.courses = [{ id: "k1", name: "Biyoloji", color: "#1baf7a" }];
  DB.topics = [{ id: "t1", courseId: "k1", parentId: null, name: "Hücre bölünmesi", status: "learning" }];
  DB.exams = [{ id: "s1", name: "Bio yazılı", date: addDays(today(), 3), courseId: "k1" }];
  DB.tasks = []; DB.cards = []; DB.decks = []; DB.sessions = [];
  DB.settings.planDone = null; DB.settings.widgets = true;
  saveNow(); paintWidgets();
});
await p2.waitForTimeout(300);
const wg = () => p2.evaluate(() => document.querySelector("#widgets").textContent);
check("plan widget'ı çiziliyor", (await wg()).includes("BUGÜN NE ÇALIŞAYIM"));
check("plan satırı konuyu ve gerekçesini gösteriyor",
  (await wg()).includes("Hücre bölünmesi") && (await wg()).includes("Bio yazılı · 3 gün kaldı"));

/* ▶ kronometreyi o konu için başlatıyor */
await p2.evaluate(() => document.querySelector("[data-plg]").click());
await p2.waitForTimeout(300);
check("plan satırı kronometreyi doğru konuyla başlatıyor",
  await p2.evaluate(() => Study.on === true && Study.courseId === "k1" && Study.topicId === "t1"));
await p2.evaluate(() => Study.cancel());
await p2.waitForTimeout(200);

/* çalışan kronometre varken ikinci satır onu ezmiyor */
await p2.evaluate(() => { Study.begin("k1", null); });
await p2.waitForTimeout(200);
const oncekiStart = await p2.evaluate(() => Study.start);
await p2.evaluate(() => document.querySelector("[data-plg]").click());
await p2.waitForTimeout(200);
check("çalışan kronometre plan satırıyla ezilmiyor",
  (await p2.evaluate(() => Study.start)) === oncekiStart);
await p2.evaluate(() => Study.cancel());
await p2.waitForTimeout(200);

/* onay kutusu işaretleniyor ve kalıcı */
await p2.evaluate(() => document.querySelector("[data-plc]").click());
await p2.waitForTimeout(300);
check("plan satırı yapıldı işaretleniyor",
  await p2.evaluate(() => DB.settings.planDone.ids.length === 1 && DB.settings.planDone.date === today()));
check("işaretli satırın başlat düğmesi kalkıyor",
  await p2.evaluate(() => !document.querySelector("[data-plg]")));
await p2.reload(); await p2.waitForTimeout(700);
check("işaret yenilemeden sonra duruyor",
  (await p2.evaluate(() => document.querySelectorAll("#widgets .checkbox.on").length)) >= 1);

/* vadesi gelen kart her zaman ilk sırada */
await p2.evaluate(() => {
  DB.decks = [{ id: "d1", name: "Deste", courseId: "k1" }];
  DB.cards = [{ id: "c1", deckId: "d1", front: "a", back: "b", ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() }];
  DB.settings.planDone = null; saveNow(); paintWidgets();
});
await p2.waitForTimeout(300);
check("kart tekrarı plan listesinin başında",
  await p2.evaluate(() => document.querySelector("[data-plc]").dataset.plc === "kart"));
await p2.evaluate(() => document.querySelector("[data-plg]").click());
await p2.waitForTimeout(400);
check("plandan kart turu başlıyor",
  await p2.evaluate(() => [...WINS.values()].some(w => w.appId === "cards" && w.state.mode === "study")));

/* ---------- kart ve quiz iyileştirmeleri (sürüm 2.6) ---------- */
await p2.goto(URL); await p2.waitForTimeout(700);

/* nottan boşluk doldurma kartı üretiliyor */
const cloze = await p2.evaluate(() => {
  DB.courses = [{ id: "k1", name: "Tarih", color: "#eb6834" }];
  DB.decks = []; DB.cards = []; DB.notes = [{ id: "nc", courseId: "k1", title: "Cloze",
    body: "Başkent {{c1::Ankara}} oldu\nKurtuluş :: 1923\n{{c1::Atatürk}} ve {{c2::İnönü}}",
    created: today(), updated: today() }];
  saveNow();
  noteToCards(DB.notes[0]);
  return DB.cards.map(c => c.front);
});
check("nottan hem :: hem {{c1::}} kartı çıkıyor", cloze.length === 4, cloze.join(" | "));
check("boşluk doldurma kartı gizleniyor", cloze.includes("Başkent […] oldu"));
check("iki numaralı satır iki kart veriyor",
  cloze.includes("[…] ve İnönü") && cloze.includes("Atatürk ve […]"));

/* günlük yeni kart sınırı kuyruğu kırpıyor */
const sinir = await p2.evaluate(() => {
  DB.decks = [{ id: "d1", name: "Deste", courseId: "k1" }];
  DB.cards = [...Array(30)].map((_, i) => ({ id: "s" + i, deckId: "d1", front: "ö" + i, back: "a" + i,
    ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() }));
  DB.settings.newPerDay = 4; DB.settings.newSeen = null; saveNow();
  const w = openApp("cards"); w.state.deck = "d1"; APPS.cards.render(w);
  return { kuyruk: dueCards("d1").length, bekleyen: newWaiting("d1"),
    uyari: w.body.textContent.includes("yeni bekliyor") };
});
check("yeni kart sınırı kuyruğu kırpıyor", sinir.kuyruk === 4 && sinir.bekleyen === 30);
check("sınıra takılan kartlar arayüzde söyleniyor", sinir.uyari === true);

/* değerlendirme kotayı harcıyor */
const kota = await p2.evaluate(() => {
  const w = [...WINS.values()].find(x => x.appId === "cards");
  w.state.mode = "study"; w.state.cram = false;
  w.state.queue = dueCards("d1").map(c => c.id); w.state.show = false; w.state.done = 0;
  APPS.cards.render(w);
  w.body.querySelector('[data-a="flip"]').click();
  w.body.querySelector('[data-g="4"]').click();
  return { gorulen: newSeenToday(), kalan: newQuota(), kart: DB.cards[0].seen === today() };
});
check("değerlendirilen yeni kart kotadan düşüyor",
  kota.gorulen === 1 && kota.kalan === 3 && kota.kart === true);

/* serbest tekrar (cram) SM-2'yi değiştirmiyor */
const cram = await p2.evaluate(() => {
  const c = DB.cards.find(x => x.id === "s9");
  c.seen = addDays(today(), -10); c.reps = 4; c.int = 30; c.ef = 2.5; c.due = addDays(today(), 20);
  const once = { due: c.due, int: c.int, reps: c.reps, ef: c.ef };
  const w = [...WINS.values()].find(x => x.appId === "cards");
  w.state.mode = "study"; w.state.cram = true; w.state.queue = ["s9"]; w.state.show = false; w.state.done = 0;
  APPS.cards.render(w);
  const bant = w.body.textContent.includes("serbest tekrar");
  w.body.querySelector('[data-a="flip"]').click();
  w.body.querySelector('[data-g="5"]').click();
  const c2 = DB.cards.find(x => x.id === "s9");
  return { bant, degismedi: c2.due === once.due && c2.int === once.int && c2.reps === once.reps && c2.ef === once.ef };
});
check("serbest tekrar bandı görünüyor", cram.bant === true);
check("serbest tekrar SM-2 programını değiştirmiyor", cram.degismedi === true);

/* quiz sorusuna konu seçici + zayıf konu istatistiği */
const zayif = await p2.evaluate(() => {
  DB.topics = [{ id: "t1", courseId: "k1", parentId: null, name: "Kurtuluş Savaşı", status: "learning" }];
  DB.quizzes = [{ id: "q1", name: "Test", courseId: "k1", questions: [
    { q: "s1", ch: ["a", "b", "c", "d"], a: 0, ex: "", topicId: "t1" },
    { q: "s2", ch: ["a", "b", "c", "d"], a: 1, ex: "", topicId: "t1" },
    { q: "s3", ch: ["a", "b", "c", "d"], a: 2, ex: "", topicId: "t1" }] }];
  DB.quizRuns = []; saveNow();
  const w = openApp("quiz");
  w.state.quiz = "q1"; w.state.mode = "edit"; APPS.quiz.render(w);
  const secici = w.body.querySelectorAll("[data-tp]").length;
  /* üçünü de yanlış cevapla */
  w.state.mode = "run"; w.state.i = 3; w.state.answers = [3, 3, 3]; w.state.logged = false;
  APPS.quiz.render(w);
  const r = DB.quizRuns[0];
  return { secici, dokum: r.topics, zayif: weakTopics().map(z => z.ad + " " + z.yanlis + "/" + z.toplam) };
});
check("her soruda konu seçici var", zayif.secici === 3);
check("deneme kaydı konu dökümü tutuyor", JSON.stringify(zayif.dokum) === JSON.stringify({ t1: [0, 3] }));
check("zayıf konular hesaplanıyor", zayif.zayif.join() === "Kurtuluş Savaşı 3/3", zayif.zayif.join());
await p2.evaluate(() => { const w = openApp("stats"); APPS.stats.render(w); });
await p2.waitForTimeout(300);
check("zayıf konular İstatistik'te görünüyor",
  await p2.evaluate(() => [...WINS.values()].find(w => w.appId === "stats").body.textContent.includes("Zayıf konular")));

check("veri güvenliği bölümünde konsol hatası yok", errs2.length === 0, errs2.slice(0, 3).join(" | "));

await b.close();
console.log(out.join("\n"));
console.log(fails ? `\n${fails} BAŞARISIZ` : "\nHEPSİ GEÇTİ");
process.exit(fails ? 1 : 0);
