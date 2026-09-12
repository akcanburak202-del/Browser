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

await b.close();
console.log(out.join("\n"));
console.log(fails ? `\n${fails} BAŞARISIZ` : "\nHEPSİ GEÇTİ");
process.exit(fails ? 1 : 0);
