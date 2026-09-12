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

check("veri güvenliği bölümünde konsol hatası yok", errs2.length === 0, errs2.slice(0, 3).join(" | "));

await b.close();
console.log(out.join("\n"));
console.log(fails ? `\n${fails} BAŞARISIZ` : "\nHEPSİ GEÇTİ");
process.exit(fails ? 1 : 0);
