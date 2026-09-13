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
- **Cihazın kalem el yazısı (yazıya çevirme) katmanı web sayfasından kapatılamaz.** Çizim
  tahtasında kalemi kapıp sayfayı arka plana alabiliyor. Web tarafında yapılabilecekler yapıldı
  (açılışta odak bırakma, alttaki içeriği `inert`, katmanda `touch-action:none`, tuvalin
  kendini yeniden çizmesi); kalanı cihaz ayarından kapatmak gerekiyor, tahtada da öyle yazıyor.

## Dosyalar

| Dosya | Ne |
|---|---|
| `index.html` | Uygulamanın tamamı (~2900 satır): CSS, HTML iskeleti, 4 script bloğu |
| `vendor/pdf*.js` | pdf.js (Apache-2.0), yalnızca PDF açılınca yüklenir |
| `sw.js` | Çevrimdışı önbellek + paylaşım hedefi. **Değişiklikte `C` sabitini artır** |
| `manifest.json`, `icon*.png` | PWA kurulumu |
| `tests/smoke.mjs` | `node tests/smoke.mjs` — Playwright duman testi (arayüz + açılış yolları) |
| `tests/unit.mjs` | `node tests/unit.mjs` — tarayıcısız mantık testi; kendini 4 zaman diliminde çalıştırır |
| `PLAN.md` | İnceleme sonrası parti parti yol haritası, hangi partinin bittiği işaretli |

## index.html mimarisi

Script blokları sırayla:
1. **Çekirdek** — `DB` şeması (`blank()`, `seed()`), `save()/flush()` (250 ms geciktirmeli),
   IndexedDB medya katmanı (`putMedia/mediaURL/dropMedia`, `idb:<id>` referansları),
   `dialog()`, mini markdown (`md()`), pencere yöneticisi (`openApp/WINS/dragify`).
2. **Uygulamalar 1** — Notlar, Görevler, Kartlar (SM-2), Pomodoro.
3. **Uygulamalar 2** — Quiz, Takvim+Sınavlar, Konu Haritası, İstatistik,
   günlük plan motoru (`dailyPlan()`).
4. **Uygulamalar 3 + kabuk** — Günlük, Terminal, iç bağlantılar (`[[...]]`), Bağlantı Haritası,
   Sözlük, Görüntüleyici, Ayarlar, çalışma kronometresi (`Study`), widget'lar, spotlight, açılış.

Önemli desenler:
- Her uygulama `APPS.<id> = { name, icon, w, h, desk?, single?, render(w), onClose?, onResize? }`.
- Açılışta her `render` sarmalanır: çizimden sonra `hydrateMedia()` + `decorate()` çalışır
  (medya `<img data-media>` bağlama, wikilink tıklama, sözlük terimlerini işaretleme).
- Veri değişince `saveAnd("app1","app2")` çağır: kaydeder, o uygulamaları yeniden çizer,
  menü çubuğunu ve widget'ları tazeler.
- Uzun listeleri `capped()` ile kırp (DOM şişerse tüm arayüz yavaşlar — ölçüldü).
- **Tarih üretirken asla `toISOString()` kullanma.** Tek kaynak `ymd()`; `today()`,
  `dayKey()`, `addDays()` ona bağlı. UTC'ye kaçan bir hesap, gece çalışan kullanıcıda
  kayıtları bir önceki güne yazar. `tests/unit.mjs` bunu UTC+14/−11'de sınar.
- **DB'yi toptan değiştirdiysen `flush()` değil `saveNow()` çağır.** `flush()` yalnızca
  `_dirty` işaretliyse yazar; içe aktarma/sıfırlama gibi yerlerde sessizce hiçbir şey yapmaz.
- Kaydetme kilidi: `LOCK_SAVE` açıkken `flush()` yazmaz (bozuk veri veya sekme çakışması).
  Kullanıcı karar verene kadar `localStorage` olduğu gibi kalır.
- **Bir şey silen her yerde `toTrash(type,label,data)` çağır, `dropMedia` çağırma.**
  Medya ancak çöpten kalıcı silinince (`dropTrash` / `trimTrash`) bırakılır; erken bırakırsan
  geri alınan kayıttan görsel eksik çıkar. Çok parçalı silmelerde (deste+kartları, konu ağacı)
  tek bir çöp kaydı yaz — geri alınca ilişki bozulmasın.
- Anlık görüntüler IndexedDB `snaps` deposunda ve **yalnızca metin DB'si** tutar; medya bilerek
  dışarıda. Yeni bir toplu silme/değiştirme eklersen öncesinde `takeSnapshot("<sebep>")` çağır.
- **Pencere yaslama** `dragify` içinde: `snapZone()` bölgeyi bulur, `snapGhost()` önizler,
  `applySnap()` uygular. Köşede yan yaslama kazanır (tam ekran değil) — amaç yan yana çalışmak.
  Sabitler `YASLA_*`; **`SNAP_*` anlık görüntülere ait**, karıştırma.
- **Tam ekran katmanlara `class="ovl"` ver** (`bigNotice`, `drawPad`). Genel klavye işleyicisi
  `.ovl` varken susar; yoksa Escape hem katmanı hem altındaki pencereyi kapatır (yaşandı).
- **Çizim tahtası** `drawPad()` bir `Promise<Blob|null>` döndürür; çağıran `putMedia()` ile
  gömer. Tuval kağıt gibidir (beyaz zemin, koyu mürekkep) — iki temada da okunur, dışarı
  çıkınca da doğru görünür. Basınç yalnızca `pointerType==="pen"` iken kullanılır.
  **Tuval içeriği tek gerçek kaynak değildir:** çizgiler `strokes` dizisinde durur ve
  `visibilitychange/pageshow/focus/resize/contextrestored` olaylarında `paint()` ile yeniden
  çizilir — Android Chrome arka plana atılan sekmenin tuval belleğini atabiliyor.
  Mantıksal tuval boyu açılışta sabitlenir, ekran döndüğünde CSS ölçekler; `pos()` görünen
  boyla mantıksal boy arasındaki oranı uygular. Çizgiler orta noktalardan geçen eğrilerle
  bağlanır ve `getCoalescedEvents()` ara noktaları da alınır — akıcılık bu ikisinden geliyor.
- **Tam ekran bir katmanda kritik düğmeleri ALT çubuğa koyma.** Android'de adres çubuğu
  görünürken `position:fixed; inset:0` düzen görünümünü kaplar, görünen alanı değil; alt
  çubuk ekran dışında kalır. `drawPad` bu yüzden "✕ Kapat" ve "✓ Nota ekle"yi üst çubukta
  tutuyor, katman `height:100dvh` alıyor ve duman testi üç ekran oranında düğmelerin
  görünür alanda kaldığını sınıyor.
- **Karartıya dokunmak kapatmaz.** Çizerken avuç değince kapanmasın ve kapanış yeri belirsiz
  kalmasın diye kaldırıldı; kapanış yolları yalnızca ✕ Kapat, Escape ve cihazın geri tuşu.
- **Koyu karartının doğrudan üstündeki denetimlere `class="onDark"` ver** (`drawPad`,
  `#focusOverlay`). Tema renkleri orada işe yaramaz: **açık temada** `--text` neredeyse siyah
  ve `.btn` zemini `rgba(0,0,0,.075)`, ikisi de karartıda kaybolur — çizim tahtasının
  "✕ Kapat" düğmesi cihazda görünmüyordu (basılabiliyordu ama görünmüyordu).
  Bir kutunun **içindeki** denetimlere verme; orada tema renkleri doğru (`bigNotice`).
  Duman testi iki temada da okunurluğu ölçüyor.
- **Kartlarda "yeni" demek `!c.seen` demek.** `sm2()` her değerlendirmede `seen` yazar, bu yüzden
  bilinemeyen bir kart ikinci kez yeni sayılmaz. `dueCards()` günlük yeni kart kotasını **global**
  harcar ve `DB.cards` sırası sabit olduğu için deste deste çağrılsa da aynı kartları seçer —
  bu yüzden rozetlerin toplamı genel toplamı aşmaz. Ham sayı gerekiyorsa `newWaiting()`.
- **Tur kuyruğu `shuffled()` ile karışır** (Çalış, 🔥 Hepsi ve widget'taki tur). Hep aynı sırayla
  görülünce cevap içerikten değil sıradan hatırlanıyor. Yeni bir tur başlatma yolu eklersen karıştır.
- **Tur bitince "Çalış" pasifleşir ve bu doğrudur** — kartların vadesi ileri atılmıştır. Deste
  başlığının altındaki çubuk sebebini, en yakın tekrar tarihini ve günlük sınırda bekleyen kart
  sayısını yazar; o çubuk olmadan düğme bozuk görünüyor (kullanıcı hata sandı).
- **Serbest tekrar (cram) SM-2'ye dokunmaz.** `w.state.cram` açıkken `grade()` ne `sm2()` çağırır
  ne kota harcar; yeni bir tekrar kipi eklersen aynı ayrımı koru.
- **Günlük plan türetilmiştir, veriye yazılmaz.** `dailyPlan()` (3. bloğun sonunda, blok 1-3'te
  durduğu için birim testten erişilebilir) her çağrıda yeniden hesaplar; saklanan tek şey
  `settings.planDone={date,ids}` ve tarih değişince kendiliğinden sıfırlanır.
  Her satır `neden` alanını doldurur — gerekçesiz satır eklemeyin, plan açıklanabilir kalsın.
  Sıralama ağırlıkları: sınav `1/kalan_gün`, başlanmamış konu ×1.2, bugün çalışılan ×0.25,
  ihmal edilen sabit `PLAN_IHMAL=0.1` (≈ 10 gün sonraki sınav). Bunları değiştirmek planın
  karakterini değiştirir; `tests/unit.mjs` denge noktasını sabitliyor.

## Veri modeli (localStorage `studyos.v1`, `DB.v = 2`)

`courses, notes, decks, cards, tasks, sessions, topics, quizzes, quizRuns, events, exams,
journal, terms, trash, settings`. Görseller/dosyalar **IndexedDB**'de (`media`), dosya tutamaçları `handles`,
günlük anlık görüntüler `snaps` deposunda (IndexedDB sürümü 3). Yedek JSON'u medyayı base64 olarak içerir (`_media`).

`sessions` kayıtları: `{courseId, topicId?, date, min, kind:"focus"|"study", label?}`.
Kartlarda `seen` (son değerlendirme günü) yeni kart sayımının tek kaynağı.
Kart görselleri yüz başına ayrı: `img` **ön yüz**, `imgB` **arka yüz** (eski kartlarda yalnızca
`img` var, o da ön yüz sayılır — göç gerekmedi). Kartın medyasını tararken **ikisini de** al
(`trashRefs`), yoksa çöpten kalıcı silmede görsel öksüz kalır.
Quiz soruları `topicId` taşıyabilir; `quizRuns[].topics = {<topicId>:[doğru,yanlış]}` dökümünden
İstatistik'teki "zayıf konular" hesaplanır (`weakTopics()`).
Ayarlar: `newPerDay` (varsayılan 20), `newSeen={date,n}`, `planDone={date,ids}`, `lastSnap`.

Yan localStorage anahtarları (yalnızca kurtarma için, uygulama bunlardan okumaz):
`studyos.v1.bozuk` — ayrıştırılamayan son veri · `studyos.v1.oncesi` — son içe aktarmadan
önceki hal (Ayarlar → Veri'den geri dönülebilir).

## Geliştirme akışı

1. `index.html` üzerinde küçük, hedefli değişiklikler (uzun blokları `node` ile
   dize değiştirerek yamalamak güvenli oldu — bulunamayan desende hata fırlat).
2. Sözdizimi: script bloklarını çıkarıp `node --check`.
3. `node tests/unit.mjs` — mantık; saniyeler sürer, önce bunu çalıştır.
4. `node tests/smoke.mjs` — arayüz; hepsi geçmeli.
5. `VERSION` sabitini artır; `sw.js` içindeki önbellek adını (`studyos-vN`) da artır.
6. Commit + `git push origin main` → Pages 1-2 dakikada yayınlar.

## Yapılabilecekler (konuşuldu, yapılmadı)

- Cihazlar arası senkron (Drive/Gist'e elle yedek gönderme düğmesi) — sunucu istemeyen sürümü.
- Not içinden PDF sayfasına bağlantı (`[[ders.pdf#42]]` gibi) — görüntüleyicide `pdfGo(w,n)` hazır.
- Kart destelerinde alt deste / etiket.
- Kronometre ile pomodoro'yu tek akışta birleştirmek (şu an ayrı çalışıyorlar).
- TWA ile gerçek uygulama ikonu (ikinci repo + assetlinks.json gerekiyor; kullanıcı şimdilik istemedi).

## Bilinen sınırlar

- **Sesli okuma (TTS) eklenmedi.** Play Servisleri olmadan Google TTS motoru gelmiyor, Türkçe ses
  olup olmadığı cihazdan cihaza değişiyor ve buradan sınanamıyor. Bunun yerine Ayarlar →
  "Bu cihaz neyi destekliyor?" panelinde **ölçüm satırı** var. O satır ✓ gösteriyorsa özellik
  eklenebilir; ✕ ise konu kapalı. Kod yazmadan önce kullanıcıya o satırı sor.
- Paylaşım hedefi bu cihazda çalışmaz (yukarı bak).
- `file://` ile açıldığında service worker, manifest ve paylaşım devre dışı (uyarı basmaz).
- localStorage 5 MB (ölçüldü) — metin için fazlasıyla yeter; medya IndexedDB'de.
