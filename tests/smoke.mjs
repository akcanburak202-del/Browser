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

/* ---------- pencere yaslama ve çizim (sürüm 2.7) ---------- */
await p2.goto(URL); await p2.waitForTimeout(700);
const tut = await p2.evaluate(() => {
  for (const w of [...WINS.values()]) closeWin(w);
  const w = openApp("notes");
  Object.assign(w.node.style, { left: "300px", top: "180px", width: "520px", height: "380px" });
  const r = w.node.querySelector(".titlebar").getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});
await p2.mouse.move(tut.x, tut.y);
await p2.mouse.down();
await p2.mouse.move(tut.x - 80, tut.y + 40, { steps: 5 });
await p2.mouse.move(6, 420, { steps: 12 });
await p2.waitForTimeout(120);
check("yaslama önizlemesi çıkıyor",
  await p2.evaluate(() => { const g = document.querySelector("#snapghost");
    return !!g && g.textContent.includes("Sol yarı"); }));
await p2.mouse.up();
await p2.waitForTimeout(200);
check("sol yarıya yaslanıyor", await p2.evaluate(() => {
  const w = [...WINS.values()].find(x => x.appId === "notes");
  const r = w.node.getBoundingClientRect(), d = document.querySelector("#desktop").getBoundingClientRect();
  return w.node.classList.contains("snapped") && Math.abs(r.width - d.width / 2) < 2 && Math.abs(r.left - d.left) < 2;
}));
check("önizleme kalkıyor", await p2.evaluate(() => !document.querySelector("#snapghost")));
check("yaslanmış pencere eski boyutuna dönebiliyor", await p2.evaluate(() => {
  const w = [...WINS.values()].find(x => x.appId === "notes");
  toggleMax(w);
  return w.node.style.width === "520px" && !w.node.classList.contains("snapped") && !w.node._snapped;
}));

/* çizim tahtası */
await p2.evaluate(() => {
  DB.notes = [{ id: "dn", courseId: DB.courses[0]?.id, title: "Çizim notu", body: "başlangıç",
    created: today(), updated: today() }];
  saveNow();
  const w = [...WINS.values()].find(x => x.appId === "notes");
  w.state.id = "dn"; w.state.prev = false; APPS.notes.render(w);
  w.body.querySelector('[data-a="draw"]').click();
});
await p2.waitForTimeout(300);
check("çizim tahtası açılıyor", await p2.evaluate(() => !!document.querySelector("canvas")));
const tuval = await p2.evaluate(() => {
  const r = document.querySelector("canvas").getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top) };
});
await p2.mouse.move(tuval.x + 40, tuval.y + 40);
await p2.mouse.down();
await p2.mouse.move(tuval.x + 220, tuval.y + 170, { steps: 14 });
await p2.mouse.up();
await p2.waitForTimeout(150);
const bosDegil = () => p2.evaluate(() => {
  const cv = document.querySelector("canvas"), c = cv.getContext("2d");
  const d = c.getImageData(0, 0, cv.width, cv.height).data;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) return true;
  return false;
});
check("tuvale çizgi düşüyor", await bosDegil());
await p2.evaluate(() => document.querySelector('[data-a="geri"]').click());
await p2.waitForTimeout(100);
check("geri al çizgiyi siliyor", (await bosDegil()) === false);
await p2.mouse.move(tuval.x + 60, tuval.y + 60);
await p2.mouse.down();
await p2.mouse.move(tuval.x + 240, tuval.y + 190, { steps: 14 });
await p2.mouse.up();
await p2.waitForTimeout(120);
await p2.evaluate(() => document.querySelector('[data-a="ekle"]').click());
await p2.waitForTimeout(700);
check("çizim tahtası kapanıyor", await p2.evaluate(() => !document.querySelector("canvas")));
check("çizim nota gömülüyor",
  await p2.evaluate(() => /!\[çizim\]\(idb:[a-z0-9]+\)/.test(DB.notes.find(n => n.id === "dn").body)));
check("çizim IndexedDB'ye yazılıyor", await p2.evaluate(async () => {
  const m = DB.notes.find(n => n.id === "dn").body.match(/idb:([a-z0-9]+)/);
  return !!m && (await idbKeys()).includes(m[1]);
}));
const oncekiGovde = await p2.evaluate(() => DB.notes.find(n => n.id === "dn").body);

/* --- kapanış yolları (sürüm 2.8): Vazgeç, ✕, Esc, geri tuşu --- */
const acVeKapat = async (nasil) => {
  await p2.evaluate(() => {
    const w = [...WINS.values()].find(x => x.appId === "notes");
    w.body.querySelector('[data-a="draw"]').click();
  });
  await p2.waitForTimeout(250);
  const acildi = await p2.evaluate(() => !!document.querySelector("canvas"));
  await nasil();
  await p2.waitForTimeout(350);
  return acildi && (await p2.evaluate(() => !document.querySelector("canvas")));
};
check("✕ Kapat düğmesi kapatıyor",
  await acVeKapat(() => p2.evaluate(() => document.querySelector('[data-a="kapat"]').click())));
check("karartıya dokunmak kapatMIYOR (avuç değince kapanmasın)", await (async () => {
  await p2.evaluate(() => {
    const w = [...WINS.values()].find(x => x.appId === "notes");
    w.body.querySelector('[data-a="draw"]').click();
  });
  await p2.waitForTimeout(250);
  await p2.mouse.click(4, 4);
  await p2.waitForTimeout(250);
  const duruyor = await p2.evaluate(() => !!document.querySelector("canvas"));
  await p2.evaluate(() => document.querySelector('[data-a="kapat"]').click());
  await p2.waitForTimeout(250);
  return duruyor;
})());
check("Esc kapatıyor", await acVeKapat(() => p2.keyboard.press("Escape")));
check("cihazın geri tuşu kapatıyor", await acVeKapat(() => p2.goBack()));
check("kapanış yolları nota bir şey eklemiyor",
  (await p2.evaluate(() => DB.notes.find(n => n.id === "dn").body)) === oncekiGovde);

/* --- tuval içeriği kaybolursa geri geliyor (arka plana atılma benzetimi) --- */
await p2.evaluate(() => {
  const w = [...WINS.values()].find(x => x.appId === "notes");
  w.body.querySelector('[data-a="draw"]').click();
});
await p2.waitForTimeout(250);
const tv = await p2.evaluate(() => {
  const r = document.querySelector("canvas").getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top) };
});
await p2.mouse.move(tv.x + 50, tv.y + 50);
await p2.mouse.down();
await p2.mouse.move(tv.x + 230, tv.y + 180, { steps: 12 });
await p2.mouse.up();
await p2.waitForTimeout(120);
const doluMu = () => p2.evaluate(() => {
  const cv = document.querySelector("canvas"), c = cv.getContext("2d");
  const d = c.getImageData(0, 0, cv.width, cv.height).data;
  /* saydam piksel "boş" sayılır: clearRect sonrası alfa 0 olur */
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 10 && (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200)) return true;
  return false;
});
check("çizim tuvalde", await doluMu());
/* tarayıcı tuval belleğini attığında olan şey: içerik gider, çizgiler bellekte kalır */
await p2.evaluate(() => { const cv = document.querySelector("canvas");
  const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height); });
check("benzetim: tuval boşaldı", (await doluMu()) === false);
await p2.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await p2.waitForTimeout(200);
check("geri dönünce çizim kendini yeniden çiziyor", await doluMu());
await p2.evaluate(() => document.querySelector('[data-a="kapat"]').click());
await p2.waitForTimeout(300);

/* sesli okuma henüz eklenmedi — yalnızca cihaz yeteneği ölçülüyor */
await p2.evaluate(() => openApp("settings"));
await p2.waitForTimeout(1900);
/* ---------- görselin üzerine çizim ve yazı (sürüm 3.6) ---------- */
const uzRef = await p2.evaluate(async () => {
  const c = document.createElement("canvas"); c.width = 600; c.height = 380;
  const x = c.getContext("2d"); x.fillStyle = "#1baf7a"; x.fillRect(0, 0, 600, 380);
  const r = await putMedia(c.toDataURL("image/png"));
  DB.notes = [{ id: "nu", courseId: DB.courses[0]?.id, title: "Şema",
    body: "![ş](" + r + ")\n", created: today(), updated: today() }];
  saveNow();
  const w = openApp("notes"); w.state.id = "nu"; w.state.prev = true; APPS.notes.render(w);
  return r;
});
await p2.waitForTimeout(500);
await p2.evaluate(() => document.querySelector(".md-prev img[data-media]").click());
await p2.waitForTimeout(400);
await p2.evaluate(() => document.querySelector('[data-a="ciz"]').click());
await p2.waitForTimeout(700);
const tuvalBilgi = await p2.evaluate(() => {
  const cv = document.querySelector("canvas"); if (!cv) return null;
  const d = cv.getContext("2d").getImageData(300, 200, 1, 1).data;
  return { en: cv.width, boy: cv.height, yesil: Math.abs(d[0] - 27) < 30 && Math.abs(d[1] - 175) < 30 };
});
check("üzerine çizimde tuval görselin kendi ölçüsünde açılıyor",
  tuvalBilgi && tuvalBilgi.en === 600 && tuvalBilgi.boy === 380);
check("görsel tuvalin arka planı olarak çiziliyor", tuvalBilgi && tuvalBilgi.yesil === true);

const kutu = await p2.evaluate(() => {
  const r = document.querySelector("canvas").getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
});
await p2.evaluate(() => document.querySelectorAll("[data-c]")[1].click());   /* kırmızı */
await p2.mouse.move(kutu.x + kutu.w * 0.2, kutu.y + kutu.h * 0.6);
await p2.mouse.down();
for (let i = 0; i <= 24; i++) await p2.mouse.move(kutu.x + kutu.w * (0.2 + i / 45), kutu.y + kutu.h * 0.6);
await p2.mouse.up();
await p2.waitForTimeout(250);
const sayRenk = () => p2.evaluate(() => {
  const cv = document.querySelector("canvas");
  const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
  let kirmizi = 0, beyaz = 0, yesil = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i] - 227) < 40 && Math.abs(d[i + 1] - 73) < 40 && Math.abs(d[i + 2] - 72) < 40) kirmizi++;
    else if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) beyaz++;
    else if (Math.abs(d[i] - 27) < 30 && Math.abs(d[i + 1] - 175) < 30) yesil++;
  }
  return { kirmizi, beyaz, yesil };
});
const ciziliyken = await sayRenk();
check("görselin üzerine çizilebiliyor", ciziliyken.kirmizi > 300, "kırmızı " + ciziliyken.kirmizi);

/* silgi arka plandaki görseli ORTAYA ÇIKARMALI, beyaza boyamamalı */
await p2.evaluate(() => document.querySelector('[data-a="silgi"]').click());
await p2.mouse.move(kutu.x + kutu.w * 0.2, kutu.y + kutu.h * 0.6);
await p2.mouse.down();
for (let i = 0; i <= 24; i++) await p2.mouse.move(kutu.x + kutu.w * (0.2 + i / 45), kutu.y + kutu.h * 0.6);
await p2.mouse.up();
await p2.waitForTimeout(300);
const silindi = await sayRenk();
check("silgi çizimi siliyor", silindi.kirmizi < ciziliyken.kirmizi / 2,
  ciziliyken.kirmizi + " → " + silindi.kirmizi);
check("silgi beyaza boyamıyor, görseli ortaya çıkarıyor",
  silindi.beyaz < 200 && silindi.yesil > ciziliyken.yesil, "beyaz " + silindi.beyaz);

/* kaydedince aynı id'ye yazılıyor, ölçü korunuyor */
await p2.evaluate(() => { document.querySelectorAll("[data-c]")[1].click();   /* kalem geri */ });
await p2.mouse.move(kutu.x + kutu.w * 0.3, kutu.y + kutu.h * 0.3);
await p2.mouse.down(); await p2.mouse.move(kutu.x + kutu.w * 0.7, kutu.y + kutu.h * 0.35); await p2.mouse.up();
await p2.waitForTimeout(200);
await p2.evaluate(() => document.querySelector('[data-a="ekle"]').click());
await p2.waitForTimeout(900);
const uzKayit = await p2.evaluate(async ref => {
  const blob = await idbGet(ref.slice(4));
  const u = URL.createObjectURL(blob), im = new Image(); im.src = u;
  await new Promise(r => { im.onload = r; });
  URL.revokeObjectURL(u);
  return { en: im.naturalWidth, boy: im.naturalHeight,
    refAyni: DB.notes[0].body.includes(ref), kapandi: !document.querySelector("canvas") };
}, uzRef);
check("üzerine çizim aynı görsele kaydediliyor, ölçü korunuyor",
  uzKayit.en === 600 && uzKayit.boy === 380 && uzKayit.refAyni === true);
check("kaydedince çizim tahtası kapanıyor", uzKayit.kapandi === true);
/* Notlar tekil bir uygulama DEĞİL: pencere açık kalırsa sonraki bölüm
   document.querySelector ile ESKİ pencerenin görselini bulur.
   Yalnızca not pencereleri kapatılır — başka bölümler kendi pencerelerine güveniyor. */
await p2.evaluate(() => [...WINS.values()].filter(w => w.appId === "notes").forEach(closeWin));
await p2.waitForTimeout(300);

/* ---------- nottaki görsel büyütülüp döndürülebiliyor (sürüm 3.5) ---------- */
const gorselRef = await p2.evaluate(async () => {
  const c = document.createElement("canvas"); c.width = 400; c.height = 200;
  const x = c.getContext("2d"); x.fillStyle = "#2a78d6"; x.fillRect(0, 0, 400, 200);
  x.fillStyle = "#eb6834"; x.fillRect(0, 0, 60, 200);          // sol kenar turuncu
  const ref = await putMedia(c.toDataURL("image/png"));
  DB.notes = [{ id: "nr", courseId: DB.courses[0]?.id, title: "Şema",
    body: "Şema:\n\n![şema](" + ref + ")\n", created: today(), updated: today() }];
  saveNow();
  const w = openApp("notes"); w.state.id = "nr"; w.state.prev = true; APPS.notes.render(w);
  return ref;
});
await p2.waitForTimeout(500);
const imlec = await p2.evaluate(() => {
  const im = document.querySelector(".md-prev img[data-media]");
  if (!im) return null;
  const c = getComputedStyle(im).cursor;
  im.click();                                    /* imageViewer async: DOM'a bir sonraki tick'te girer */
  return c;
});
await p2.waitForTimeout(400);
const acilis = await p2.evaluate(() => ({
  acik: !!document.querySelector(".rotimg"),
  kaydetPasif: document.querySelector('[data-a="kaydet"]')?.disabled }));
check("not önizlemesindeki görsel tıklanabilir görünüyor", imlec === "zoom-in");
check("görsele dokununca büyüteç açılıyor", acilis.acik === true);
check("döndürülmeden Kaydet pasif", acilis.kaydetPasif === true);
const donus = await p2.evaluate(() => {
  document.querySelector('[data-a="sag"]').click();
  return { donusum: document.querySelector(".rotimg").style.transform,
    kaydetAktif: !document.querySelector('[data-a="kaydet"]').disabled };
});
check("döndürme önce ekranda önizleniyor", donus.donusum === "rotate(90deg)" && donus.kaydetAktif);
const kayit = await p2.evaluate(async ref => {
  document.querySelector('[data-a="kaydet"]').click();
  await new Promise(r => setTimeout(r, 900));
  const blob = await idbGet(ref.slice(4));
  const u = URL.createObjectURL(blob), im = new Image(); im.src = u;
  await new Promise(r => { im.onload = r; });
  const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
  c.getContext("2d").drawImage(im, 0, 0);
  const ust = c.getContext("2d").getImageData(Math.round(c.width / 2), 5, 1, 1).data;
  URL.revokeObjectURL(u);
  return { en: im.naturalWidth, boy: im.naturalHeight, tur: blob.type,
    ustTuruncu: ust[0] > 200 && ust[1] > 80 && ust[1] < 140,
    kapandi: !document.querySelector(".rotimg"),
    refAyni: DB.notes[0].body.includes(ref) };
}, gorselRef);
check("kaydedince görselin boyu dönüyor (400×200 → 200×400)",
  kayit.en === 200 && kayit.boy === 400);
check("sol kenar yukarı geliyor (yön doğru)", kayit.ustTuruncu === true);
check("PNG PNG olarak kalıyor", kayit.tur === "image/png");
check("not metnindeki referans değişmiyor", kayit.refAyni === true);
check("kaydedince büyüteç kapanıyor", kayit.kapandi === true);

/* ---------- odak modunda ders/konu seçilebiliyor (sürüm 3.4) ---------- */
const odak = await p2.evaluate(() => {
  DB.courses = [{ id: "mat", name: "Matematik", color: "#2a78d6" },
                { id: "bio", name: "Biyoloji", color: "#1baf7a" }];
  DB.topics = [{ id: "t1", courseId: "mat", parentId: null, name: "Türev", status: "learning" },
               { id: "t3", courseId: "bio", parentId: null, name: "Hücre", status: "learning" }];
  DB.sessions = []; Pomo.courseId = null; Pomo.topicId = null; Pomo.label = ""; saveNow();
  enterFocus();
  const say = sel => document.querySelectorAll(sel).length;
  const ilk = { ders: say("#foCourse option"), konu: say("#foTopic option"),
    etiket: document.querySelector("#foTask").textContent };
  const cs = document.querySelector("#foCourse");
  cs.value = "bio"; cs.dispatchEvent(new Event("change"));
  const sonra = { konu: say("#foTopic option"), etiket: document.querySelector("#foTask").textContent,
    topicId: Pomo.topicId };
  const ts = document.querySelector("#foTopic");
  ts.value = "t3"; ts.dispatchEvent(new Event("change"));
  const secili = document.querySelector("#foTask").textContent;
  /* oturumu bitir: konu kaydediliyor mu */
  Pomo.start(Pomo.courseId, "", Pomo.topicId); Pomo.total = 60; Pomo.left = 1; Pomo.finish();
  const o = DB.sessions[DB.sessions.length - 1];
  const molada = document.querySelector("#foPick").style.display;
  exitFocus();
  return { ilk, sonra, secili, oturum: { c: o.courseId, t: o.topicId, k: o.kind }, molada };
});
check("odak modunda ders seçici dolu", odak.ilk.ders === 2);
check("odak modunda konu seçici dolu (+ 'konu seçme' satırı)", odak.ilk.konu === 2);
check("ders seçilmemişse etiket dersi gösteriyor", odak.ilk.etiket === "Matematik");
check("ders değişince konular yenileniyor ve konu sıfırlanıyor",
  odak.sonra.konu === 2 && odak.sonra.etiket === "Biyoloji" && odak.sonra.topicId === null);
check("konu seçilince etiket konuyu gösteriyor", odak.secili === "Hücre");
check("pomodoro oturumu konuyu kaydediyor",
  odak.oturum.c === "bio" && odak.oturum.t === "t3" && odak.oturum.k === "focus");
check("molada seçiciler gizleniyor", odak.molada === "none");

/* ---------- yalnız görselli yüz kartı şişirmiyor (sürüm 3.3) ---------- */
const olcu = await p2.evaluate(async () => {
  const cv = document.createElement("canvas"); cv.width = 400; cv.height = 240;
  const cx = cv.getContext("2d"); cx.fillStyle = "#1baf7a"; cx.fillRect(0, 0, 400, 240);
  const ref = await putMedia(cv.toDataURL("image/png"));
  DB.decks = [{ id: "dg2", name: "Ölçü", courseId: DB.courses[0]?.id }];
  DB.cards = [{ id: "kg", deckId: "dg2", front: "soru metni", back: "", img: null, imgB: ref,
    ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() }];
  saveNow();
  const w = openApp("cards"); w.state.deck = "dg2";
  w.state.mode = "study"; w.state.cram = true; w.state.queue = ["kg"]; w.state.done = 0;
  const oku = async show => {
    w.state.show = show; APPS.cards.render(w);
    await new Promise(r => setTimeout(r, 400));
    const kart = w.body.querySelector(".flash-card");
    const img = w.body.querySelector(".cardimg");
    return { kart: kart.getBoundingClientRect().height,
      gorsel: img ? img.getBoundingClientRect().height : 0,
      imgOnly: kart.classList.contains("img-only"),
      bosMetin: !!w.body.querySelector(".ftext") };
  };
  return { arka: await oku(true), on: await oku(false) };
});
check("yalnız görselli yüz img-only sınıfını alıyor",
  olcu.arka.imgOnly === true && olcu.arka.bosMetin === false);
check("yalnız görselli yüzde kart görselden çok büyük değil",
  olcu.arka.gorsel > 0 && olcu.arka.kart / olcu.arka.gorsel < 1.45,
  `kart ${Math.round(olcu.arka.kart)} / görsel ${Math.round(olcu.arka.gorsel)}`);
check("metinli yüz img-only sayılmıyor ve metin kutusu var",
  olcu.on.imgOnly === false && olcu.on.bosMetin === true);

/* ---------- tur bitince sebebi yazılıyor (sürüm 3.2) ---------- */
const bitti = await p2.evaluate(() => {
  DB.decks = [{ id: "db", name: "Bitti", courseId: DB.courses[0]?.id }];
  DB.cards = [...Array(5)].map((_, i) => ({ id: "b" + i, deckId: "db", front: "ö" + i, back: "a" + i,
    ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() }));
  DB.settings.newPerDay = 3; DB.settings.newSeen = null; saveNow();
  const w = openApp("cards"); w.state.deck = "db"; w.state.mode = null; APPS.cards.render(w);
  const once = { vadeli: dueCards("db").length, pasif: w.body.querySelector('[data-a="study"]').disabled };
  w.body.querySelector('[data-a="study"]').click();
  for (let i = 0; i < 3; i++) { w.body.querySelector('[data-a="flip"]').click();
    w.body.querySelector('[data-g="4"]').click(); }
  w.body.querySelector('[data-a="back"]').click();
  const metin = w.body.textContent;
  return { once, sonra: { vadeli: dueCards("db").length,
    pasif: w.body.querySelector('[data-a="study"]').disabled,
    aciklama: metin.includes("bugünlük tekrar bitti"),
    enYakin: metin.includes(addDays(today(), 1)),
    sinir: metin.includes("günlük sınır dolduğu için bekliyor"),
    cram: !w.body.querySelector('[data-a="cram"]').disabled } };
});
check("başta çalışılabiliyor", bitti.once.vadeli === 3 && bitti.once.pasif === false);
check("tur bitince vadesi gelen kart kalmıyor", bitti.sonra.vadeli === 0 && bitti.sonra.pasif === true);
check("düğme neden pasif olduğunu söylüyor", bitti.sonra.aciklama === true);
check("en yakın tekrar tarihi yazıyor", bitti.sonra.enYakin === true);
check("günlük sınırda bekleyen kartlar söyleniyor", bitti.sonra.sinir === true);
check("serbest tekrar hâlâ açık", bitti.sonra.cram === true);

/* ---------- kart görselleri ön/arka ayrı (sürüm 3.1) ---------- */
const kartG = await p2.evaluate(async () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  DB.decks = [{ id: "dg", name: "Görsel", courseId: DB.courses[0]?.id }];
  DB.cards = []; saveNow();
  const w = openApp("cards"); w.state.deck = "dg"; w.state.mode = null; APPS.cards.render(w);
  const A = a => w.body.querySelector(`[data-a="${a}"]`);
  /* yalnızca ön yüze görsel */
  w.state.pendF = await putMedia(PNG); APPS.cards.render(w);
  w.body.querySelector('[data-a="f"]').value = "ön metin";
  w.body.querySelector('[data-a="b"]').value = "arka metin";
  w.body.querySelector('[data-a="add"]').click();
  /* yalnızca arka yüze görsel */
  w.state.pendB = await putMedia(PNG); APPS.cards.render(w);
  w.body.querySelector('[data-a="f"]').value = "ön2";
  w.body.querySelector('[data-a="b"]').value = "arka2";
  w.body.querySelector('[data-a="add"]').click();
  const [k1, k2] = DB.cards;
  return { k1: { on: !!k1.img, arka: !!k1.imgB }, k2: { on: !!k2.img, arka: !!k2.imgB },
    farkli: k1.img !== k2.imgB };
});
check("ön yüze eklenen görsel arka yüze bulaşmıyor", kartG.k1.on === true && kartG.k1.arka === false);
check("arka yüze eklenen görsel ön yüze bulaşmıyor", kartG.k2.on === false && kartG.k2.arka === true);

/* çalışma ekranında o anki yüzün görseli çiziliyor */
const yuz = await p2.evaluate(() => {
  const w = [...WINS.values()].find(x => x.appId === "cards");
  const k = DB.cards[0];
  w.state.mode = "study"; w.state.cram = true; w.state.queue = [k.id];
  w.state.show = false; w.state.done = 0; APPS.cards.render(w);
  const onYuz = w.body.querySelector("[data-media]")?.dataset.media || null;
  w.state.show = true; APPS.cards.render(w);
  const arkaYuz = w.body.querySelector("[data-media]")?.dataset.media || null;
  return { onYuz, arkaYuz, beklenen: k.img };
});
check("soru yüzünde ön görsel var", yuz.onYuz === yuz.beklenen && !!yuz.beklenen);
check("cevap yüzünde ön görsel YOK (arka boşsa görsel çizilmiyor)", yuz.arkaYuz === null);

/* iki yüzü de görselli kart: her yüzde kendi görseli */
const ikiYuz = await p2.evaluate(async () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const on = await putMedia(PNG), arka = await putMedia(PNG);
  const k = { id: "ki", deckId: "dg", front: "s", back: "c", img: on, imgB: arka,
    ef: 2.5, int: 0, reps: 0, lapses: 0, due: today() };
  DB.cards.push(k); saveNow();
  const w = [...WINS.values()].find(x => x.appId === "cards");
  w.state.mode = "study"; w.state.cram = true; w.state.queue = ["ki"]; w.state.show = false;
  APPS.cards.render(w);
  const a = w.body.querySelector("[data-media]").dataset.media;
  w.state.show = true; APPS.cards.render(w);
  const b = w.body.querySelector("[data-media]").dataset.media;
  return { a, b, on, arka };
});
check("iki görselli kartta soru yüzü ön görseli gösteriyor", ikiYuz.a === ikiYuz.on);
check("iki görselli kartta cevap yüzü arka görseli gösteriyor",
  ikiYuz.b === ikiYuz.arka && ikiYuz.a !== ikiYuz.b);

/* eklenmeden bırakılan görsel pencere kapanınca IndexedDB'de öksüz kalmıyor */
const oksuz = await p2.evaluate(async () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const w = [...WINS.values()].find(x => x.appId === "cards");
  w.state.mode = null; APPS.cards.render(w);
  const ref = await putMedia(PNG); w.state.pendF = ref;
  const oncesi = (await idbKeys()).includes(ref.slice(4));
  closeWin(w);
  await new Promise(r => setTimeout(r, 400));
  return { oncesi, sonrasi: (await idbKeys()).includes(ref.slice(4)) };
});
check("eklenmeyen görsel pencere kapanınca bırakılıyor",
  oksuz.oncesi === true && oksuz.sonrasi === false);

/* Çizim tahtası kendi karartısının üstünde: tema renkleri (açık temada koyu metin)
   burada kaybolur. Her iki temada da denetimler okunur kalmalı. */
for (const tema of ["light", "dark"]) {
  await p2.evaluate(t => { DB.settings.theme = t; applySettings(); }, tema);
  await p2.evaluate(() => {
    const w = [...WINS.values()].find(x => x.appId === "notes");
    w.body.querySelector('[data-a="draw"]').click();
  });
  await p2.waitForTimeout(250);
  const okunur = await p2.evaluate(() => {
    const parla = c => { const [r, g, b] = c.match(/[\d.]+/g).map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
    const alfa = c => { const m = c.match(/[\d.]+/g); return m && m.length > 3 ? +m[3] : 1; };
    const out = {};
    for (const a of ["kapat", "geri", "temizle"]) {
      const cs = getComputedStyle(document.querySelector(`[data-a="${a}"]`));
      out[a] = { metin: parla(cs.color), zeminAlfa: alfa(cs.backgroundColor) };
    }
    return out;
  });
  const hepsi = Object.values(okunur);
  check(`çizim tahtası denetimleri ${tema} temada okunur`,
    hepsi.every(x => x.metin > 0.55 && x.zeminAlfa >= 0.1),
    JSON.stringify(okunur));
  await p2.evaluate(() => document.querySelector('[data-a="kapat"]').click());
  await p2.waitForTimeout(200);
}
await p2.evaluate(() => { DB.settings.theme = "dark"; applySettings(); });

/* kritik düğmeler her ekran oranında görünür alanda kalmalı */
for (const [ad, gw, gh] of [["dikey", 800, 1280], ["yatay", 1280, 800], ["alçak", 1024, 620]]) {
  await p2.setViewportSize({ width: gw, height: gh });
  await p2.evaluate(() => {
    const w = [...WINS.values()].find(x => x.appId === "notes");
    w.body.querySelector('[data-a="draw"]').click();
  });
  await p2.waitForTimeout(250);
  const gorunur = await p2.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const icinde = x => x.top >= 0 && x.bottom <= innerHeight && x.left >= 0 && x.right <= innerWidth && x.width > 0;
    return icinde(r('[data-a="kapat"]')) && icinde(r('[data-a="ekle"]')) && icinde(r("canvas"));
  });
  check(`çizim düğmeleri görünür alanda (${ad} ${gw}×${gh})`, gorunur);
  await p2.evaluate(() => document.querySelector('[data-a="kapat"]').click());
  await p2.waitForTimeout(200);
}
await p2.setViewportSize({ width: 1200, height: 800 });

check("görüntüleyici dosyasız açılınca düzgün boş durum gösteriyor", await p2.evaluate(() => {
  const w = openApp("viewer");
  return w.node.querySelector(".wtitle").textContent.includes("Görüntüleyici")
    && w.body.textContent.includes("Görüntülenecek dosya yok");
}));

check("cihaz panelinde sesli okuma satırı var", await p2.evaluate(() =>
  [...WINS.values()].find(w => w.appId === "settings").body.textContent.includes("Türkçe sesli okuma")));

check("veri güvenliği bölümünde konsol hatası yok", errs2.length === 0, errs2.slice(0, 3).join(" | "));

await b.close();
console.log(out.join("\n"));
console.log(fails ? `\n${fails} BAŞARISIZ` : "\nHEPSİ GEÇTİ");
process.exit(fails ? 1 : 0);
