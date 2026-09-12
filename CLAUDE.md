# StudyOS — proje durumu ve devam notları

Bu dosya **yeni bir sohbette kaldığın yerden devam edebilmek** için yazıldı.
Yeni oturumda önce bunu oku, sonra `README.md`'ye ve `git log`'a bak.

- **Canlı:** https://akcanburak202-del.github.io/Browser/ (GitHub Pages, `main` → `/root`)
- **Güncel sürüm:** `index.html` içindeki `VERSION` sabiti (Ayarlar'ın en üstünde ve terminalde `surum` ile görünür)
- **Dil:** kullanıcı ve arayüz Türkçe; kod yorumları da Türkçe.

## Kullanıcı ve cihaz gerçekleri (tekrar keşfetme)

- Kullanıcı ders çalışmak için kullanıyor; tablet birincil cihaz.
- Cihaz: **Huawei MatePad Pro**, **Google Play Servisleri yok**.
  - ⇒ **WebAPK üretilemez** → PWA paylaşım hedefi (`share_target`) hiçbir zaman çalışmaz. Kovalama.
  - ⇒ `chrome://webapks` açılmaz, bu normaldir.
- **Chrome**'da File System Access API **var** (🔗 canlı dosya bağlantısı çalışıyor).
  **Huawei Browser'da yok.** WebView tabanlı APK (Capacitor vb.) da bu API'yi kaybettirir → önerilmedi.
- Android Chrome dosya izinlerini oturumlar arası saklamıyor → bağlı dosyalar oturum içi
  bellekte tutuluyor, "↻ Tazele" ile yeniden okunuyor.
- Tarayıcının yerleşik PDF görüntüleyicisi yok → PDF'ler `vendor/pdf.js` ile çiziliyor.
- Kalıcı depolama izni ✕ → **düzenli JSON yedek** önemli.

## Dosyalar

| Dosya | Ne |
|---|---|
| `index.html` | Uygulamanın tamamı (~2500 satır): CSS, HTML iskeleti, 4 script bloğu |
| `vendor/pdf*.js` | pdf.js (Apache-2.0), yalnızca PDF açılınca yüklenir |
| `sw.js` | Çevrimdışı önbellek + paylaşım hedefi. **Değişiklikte `C` sabitini artır** |
| `manifest.json`, `icon*.png` | PWA kurulumu |
| `tests/smoke.mjs` | `node tests/smoke.mjs` — Playwright duman testi |

## index.html mimarisi

Script blokları sırayla:
1. **Çekirdek** — `DB` şeması (`blank()`, `seed()`), `save()/flush()` (250 ms geciktirmeli),
   IndexedDB medya katmanı (`putMedia/mediaURL/dropMedia`, `idb:<id>` referansları),
   `dialog()`, mini markdown (`md()`), pencere yöneticisi (`openApp/WINS/dragify`).
2. **Uygulamalar 1** — Notlar, Görevler, Kartlar (SM-2), Pomodoro.
3. **Uygulamalar 2** — Quiz, Takvim+Sınavlar, Konu Haritası, İstatistik.
4. **Uygulamalar 3 + kabuk** — Günlük, Terminal, iç bağlantılar (`[[...]]`), Bağlantı Haritası,
   Sözlük, Görüntüleyici, Ayarlar, çalışma kronometresi (`Study`), widget'lar, spotlight, açılış.

Önemli desenler:
- Her uygulama `APPS.<id> = { name, icon, w, h, desk?, single?, render(w), onClose?, onResize? }`.
- Açılışta her `render` sarmalanır: çizimden sonra `hydrateMedia()` + `decorate()` çalışır
  (medya `<img data-media>` bağlama, wikilink tıklama, sözlük terimlerini işaretleme).
- Veri değişince `saveAnd("app1","app2")` çağır: kaydeder, o uygulamaları yeniden çizer,
  menü çubuğunu ve widget'ları tazeler.
- Uzun listeleri `capped()` ile kırp (DOM şişerse tüm arayüz yavaşlar — ölçüldü).

## Veri modeli (localStorage `studyos.v1`, `DB.v = 2`)

`courses, notes, decks, cards, tasks, sessions, topics, quizzes, quizRuns, events, exams,
journal, terms, settings`. Görseller/dosyalar **IndexedDB**'de (`media`), dosya tutamaçları
`handles` deposunda. Yedek JSON'u medyayı base64 olarak içerir (`_media`).

`sessions` kayıtları: `{courseId, topicId?, date, min, kind:"focus"|"study", label?}`.

## Geliştirme akışı

1. `index.html` üzerinde küçük, hedefli değişiklikler (uzun blokları `node` ile
   dize değiştirerek yamalamak güvenli oldu — bulunamayan desende hata fırlat).
2. Sözdizimi: script bloklarını çıkarıp `node --check`.
3. `node tests/smoke.mjs` — hepsi geçmeli.
4. `VERSION` sabitini artır; `sw.js` içindeki önbellek adını (`studyos-vN`) da artır.
5. Commit + `git push origin main` → Pages 1-2 dakikada yayınlar.

## Yapılabilecekler (konuşuldu, yapılmadı)

- Cihazlar arası senkron (Drive/Gist'e elle yedek gönderme düğmesi) — sunucu istemeyen sürümü.
- PDF'de "kaldığın sayfadan devam" ve 80 sayfa sınırının kaldırılması.
- Not içinden PDF sayfasına bağlantı (`[[ders.pdf#42]]` gibi).
- Kart destelerinde alt deste / etiket.
- TWA ile gerçek uygulama ikonu (ikinci repo + assetlinks.json gerekiyor; kullanıcı şimdilik istemedi).

## Bilinen sınırlar

- Paylaşım hedefi bu cihazda çalışmaz (yukarı bak).
- `file://` ile açıldığında service worker, manifest ve paylaşım devre dışı (uyarı basmaz).
- localStorage 5 MB (ölçüldü) — metin için fazlasıyla yeter; medya IndexedDB'de.
