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
| `PAKET.md` | Paket biçimi + başka bir yapay zekâya verilecek talimat. **`PAKET_TALIMAT` ile birebir aynı kalmalı** (birim test sınıyor) |
| `paketler/` | Hazır çalışma paketleri (JSON) + README. `araclar/paket-birlestir.mjs` parçaları birleştirip doğrular |

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
- **`white-space:pre-wrap` yalnızca metin kutusunda olmalı** (`.flash-card .ftext`), kartın
  tamamında değil: şablondaki satır sonları ve girintiler de boşluk olarak çizilip yüzü
  gereksiz uzatıyordu. Yüzde metin yoksa metin kutusunu hiç çizme; yalnız görselli yüz
  `img-only` sınıfı alıp asgari yüksekliği bırakır ve görsel büyür.
- **Sözlük balonu `konumlaTerm(sp)` ile yerleşir.** Aşağı sığıyorsa aşağı, sığmıyorsa yukarı;
  ikisine de sığmazsa geniş tarafa yaslanıp `max-height` ile kendi içinde kaydırılır.
  İki tuzak: (1) `hydrateMedia` `src`'yi **asenkron** atar, yani ölçüyü görsel yüklenince
  **yeniden** almak gerekir — yoksa balon konumlandıktan sonra büyüyüp aşağı taşar;
  (2) çapa kaydırılan bir panelin içindeyse ekran dışına taşmış olabilir, bu yüzden hem
  boşluklar görünür alana kırpılır hem de sonuç ekran içine sabitlenir.
  Görsel varsa balon ölçüsü kesinleşene kadar `visibility:hidden` tutulur (400 ms emniyet
  zaman aşımıyla), yoksa yanlış konum bir an görünüp zıplıyor. Geciken "göster" çağrıları
  `_termTok` ile geçersizleşir — eski balonu açmasınlar.
- **`drawPad({bgBlob})` var olan bir görselin üzerine çizer.** Tuval o görselin **kendi**
  ölçüsünde açılır (çözünürlük kaybolmasın), ekrana sığdırmayı CSS yapar.
  Çizgiler ayrı bir **saydam katmanda** (`lay`) durur ve her karede arka planla birleştirilir;
  bu sayede silgi `destination-out` ile arka plandaki görseli **ortaya çıkarır**, beyaza boyamaz.
  Yazı aracı da bir "çizgi" kaydıdır (`{tip:"yazi"}`), böylece geri al ve yeniden çizim çalışır.
  Kaydedince blob **aynı id'ye** yazılır — eski çizimi düzenlemek ve görselin üzerine çizmek
  aynı yoldan yürür. `MEDIA_URL` önbelleğini temizlemeyi unutma.
- **Görsel döndürme blob'u yerinde değiştirir** (`rotateMedia`): IndexedDB'de **aynı id** altına
  yazılır, böylece not metnindeki `idb:` referansına, karta ya da sözlüğe dokunmak gerekmez.
  Yazdıktan sonra `MEDIA_URL` önbelleğindeki eski objectURL **mutlaka** bırakılıp silinmeli,
  yoksa döndürülmemiş hali çizilmeye devam eder. Döndürme ekranda `transform` ile önizlenir ve
  yalnızca "Kaydet"te tek seferde kodlanır — her dokunuşta yeniden kodlamak JPEG'i bozar.
  Büyüteç not önizlemesindeki **ve sözlük balonundaki/düzenleyicisindeki** görsellere bağlanır
  (`.md-prev img[data-media], .popimg img[data-media]`); kart yüzündeki görsele dokunmak
  kartı çevirmeli. `idb:` olmayan eski referanslarda düzenleme düğmeleri gizlenir.
- **Odak katmanındaki seçenekler `fillFocusPickers()` ile kurulur, `paintFocus()` ile DEĞİL.**
  `paintFocus` saniyede bir çalışıyor; seçenekleri orada yeniden kurarsan açılır liste kapanır ve
  seçim kaçar. Odak katmanı artık ders ve konu seçtirir — eskiden yalnızca gösteriyordu ve
  açılışta atanan ilk derste takılı kalıyordu.
- **`.onDark` form denetimlerini de kapsar** (`.onDark .inp`); açılır listenin şıkları tema
  renklerini korur, yoksa odak katmanındaki seçiciler açık temada okunmuyordu.
- **Tur kuyruğu `shuffled()` ile karışır** (Çalış, 🔥 Hepsi ve widget'taki tur). Hep aynı sırayla
  görülünce cevap içerikten değil sıradan hatırlanıyor. Yeni bir tur başlatma yolu eklersen karıştır.
- **Tur bitince "Çalış" pasifleşir ve bu doğrudur** — kartların vadesi ileri atılmıştır. Deste
  başlığının altındaki çubuk sebebini, en yakın tekrar tarihini ve günlük sınırda bekleyen kart
  sayısını yazar; o çubuk olmadan düğme bozuk görünüyor (kullanıcı hata sandı).
- **Serbest tekrar (cram) SM-2'ye dokunmaz.** `w.state.cram` açıkken `grade()` ne `sm2()` çağırır
  ne kota harcar; yeni bir tekrar kipi eklersen aynı ayrımı koru.
- **Diyalogda kısa sayı isteme — açılır liste kullan.** Tablette dolu bir sayı kutusuna
  dokunup yazınca rakam eskisinin **yanına** ekleniyor: süre 1 iken 3 yazılınca 13 oluyordu
  ve takvim bloğu yanlış süreyle açılıyordu. `dialog()` artık alana odaklanınca içeriği
  seçiyor (sayı kutusunda her dokunuşta), ama asıl çözüm saat/süre gibi alanları
  `type:"select"` yapmak — takvimde `hourOpts()` bunu üretir.
- **`dialog()` çoklu seçim alanı: `type:"multi"`.** Değer olarak **dizi** alır ve dizi döner
  (diğer alanlar dize döner — karıştırma). Onay kutuları `#modalbox .multi` altında, tema
  renklerini kendi kuralları taşır (genel `#modalbox label` kuralı onları ezerdi).
- **Bir sınav birden çok dersi kapsayabilir** (TUS, YKS). Tek okuma kapısı `examCourses(e)`:
  yeni `courseIds` varsa onu, yoksa eski `courseId`'yi verir ve silinmiş dersleri ayıklar.
  Yazarken **ikisini birden** doldur (`courseIds` + `courseId=courseIds[0]`), eski kayıtlara
  göç gerekmesin. Sınav okuyan yeni kod yazarken `e.courseId` deme, `examCourses(e)` de.
- **Ders silme `deleteCourse(id)` ile ve TEK çöp kaydına.** `courseContents(id)` derse bağlı
  ne varsa toplar (`COP_DERS_DIZI` dizileri + kartlar deste üzerinden); geri alınca ilişkiler
  bozulmadan döner. Çok dersli sınav **silinmez**, yalnızca o dersi bırakır — geri alma için
  `examEk` içinde sınav kimlikleri tutulur. Yeni bir koleksiyona `courseId` eklersen
  `COP_DERS_DIZI`'ye de ekle; birim test dizilerin DB'de var olduğunu sınıyor.
- **Konu haritasında `s.course === "*"` "Tüm dersler" görünümüdür.** Ders ayırt etmeden
  hepsini gösterir; o kipte `+ Ana konu` üst çubuktan kalkar, her ders grubunun kendi
  düğmesi olur (`data-root`). Alt konu eklerken ders **üst konudan** alınır, `s.course`'tan değil.
- **Quiz şık sayısı serbesttir: `SIK_MIN=2`..`SIK_MAX=6`, yeni soru `SIK_VARSAYILAN=5` şıkla açılır**
  (TUS/YKS 5 şıklı). Çözüm ekranı `x.ch` uzunluğuna göre A-F harfleriyle çizer; düzenleyicide
  `+ Şık` / ✕ ile eklenip silinir, silince doğru şık (`a`) kayar, doğru şık silinirse 0 olur.
  Paket alma (`paketUygula`) aralık dışı şık sayısını atlar. Yeni bir yol eklerken `4` yazma,
  sabitleri kullan. Hazır paketler `paketler/` klasöründe (ör. `tus-romatoloji.json`).
- **Paket üretimi `paket-hazirla` skill'i ile** (`.claude/skills/paket-hazirla/`).
  Ortak kurallar + Fable/Opus ve Astra Pro profilleri ayrıdır. Astra profilinde Fable
  orkestrasyonu ve Opus çağrıları zorunlu değildir; gerçekten erişilen araştırma araçları kullanılır.
  Her yeni içerik öğesi `brief.md` sözleşmesiyle kaynak/bölüm bağlantısı taşır. Birleştirici
  v2 paketin yanında `.denetim.json` üretir. Son dosyayı yeniden yazmadan `--dogrula` ile denetle.
  Düzeltmeler kaynak parçalara uygulanır; eski parçalardan üretip final düzeltmeleri ezilmez.
- **Quiz ve Kartlar ders → ana konu → test/deste ile açılır (4.4).** Ortak arayüz
  `kutuphaneRender`, kök çözümü `konuKoku`, yerleşim `icerikKonusu` üzerinden yürür.
  Test/deste `topicId` taşır; sorunun kendi `topicId` alanı alt konu istatistiği içindir.
  Eski kayıtta explicit alan yoksa bütün sorular aynı kökü gösterdiğinde yerleşim türetilir.
  Explicit `null`, silinmiş/uyumsuz konu ve belirsiz içerik “Konusu belirlenmemiş”e gider.
  Başlık ayrıştırarak veri göçü yapılmaz; kimlikler ve geçmiş aynen kalır. `konuAta` aynı ders
  içinde soru alt konusunu korur, başka derse taşıma sırasında uyumsuz soru bağını temizler.
  Toplu taşıma öncesi anlık görüntü alınır. Kartlar ana ekranında günlük tekrar kısayolu vardır.
- **Paket v2:** `ders`, `anaKonu`, alt konu dizisi `konular`; her test/destede `konu: anaKonu`.
  `paketSorunlari` v2 yapıyı hiçbir kayıt eklemeden doğrular. v1 alımı geriye uyumlu devam eder.
  Konular v2'de ders+ebeveyn+ad ile eşleşir; farklı köklerin aynı adlı alt konuları karışmaz.
  Yeni konular oluşturulur, kullanıcının eski konu ağacı otomatik yeniden ebeveynlenmez.
  `paketler/tus-romatoloji.json` sadece sınıflama yönünden v2'ye taşındı; bilimsel içerik ve
  kaynaklar bu revizyonda yeniden doğrulanmadı. Eski içeriği düzenlemek için yeniden alma
  yerine Toplu konu ata kullanılır; yeniden alım testleri çoğaltabilir.
- **Quiz çözümü `s.order` ile yürür** (4.3): her başlangıç `quizBaslat()` ile soru dizinlerini
  `shuffled()` karıştırır; cevaplar **soru dizinine** göre tutulur (`s.answers[qi]`), sıraya göre değil.
  Yarım kalan çözüm `settings.quizDevam[quizId]={order,i,answers,locked,n}` olarak her adımda yazılır
  (`quizDevamYaz`), listede düğme "▶ Devam i/N" olur, bitince ya da test silinince silinir; soru sayısı
  değişmişse (`n`) kayıt yok sayılır. Sonuç ekranı "Yanlışları tekrar çöz" ile yalnızca yanlış
  dizinlerden yeni tur açar; `quizRuns.total` o turun soru sayısıdır, testin değil.
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
**Pomodoro oturumları da `topicId` yazar** (3.4'ten beri); yoksa o süre "Konulara göre"
istatistiğine ve günlük plandaki "bu konuya dokunuldu mu" hesabına hiç girmiyordu.
Kartlarda `seen` (son değerlendirme günü) yeni kart sayımının tek kaynağı.
Kart görselleri yüz başına ayrı: `img` **ön yüz**, `imgB` **arka yüz** (eski kartlarda yalnızca
`img` var, o da ön yüz sayılır — göç gerekmedi). Kartın medyasını tararken **ikisini de** al
(`trashRefs`), yoksa çöpten kalıcı silmede görsel öksüz kalır.
Quizler ve desteler ana konu `topicId` alanı taşıyabilir. Quiz soruları ayrıca alt konu `topicId` taşıyabilir; `quizRuns[].topics = {<topicId>:[doğru,yanlış]}` dökümünden
İstatistik'teki "zayıf konular" hesaplanır (`weakTopics()`).
Sınavlar: `{id,name,date,courseIds:[...],courseId}` — `courseId` eski kayıtlarla uyum için
ilk dersi tekrarlar; okuma `examCourses()` üzerinden.
Ayarlar: `newPerDay` (varsayılan 20), `newSeen={date,n}`, `planDone={date,ids}`, `lastSnap`,
`quizDevam={<quizId>:{order,i,answers,locked,n}}` (yarım kalan quiz çözümleri).

**Paket biçimi** (`📦 Paket ekle` — `paketUygula()`): dışarıda hazırlanmış deste/test/terim
setini mevcut verinin **üstüne ekler**, hiçbir şeyi silmez. Anahtarlar Türkçe, dosya elle
düzenlenebilsin diye:

```json
{ "studyosPaket": 1, "ad": "Biyoloji — Hücre", "ders": "Biyoloji",
  "konular": ["Hücre"],
  "desteler": [{ "ad": "Organeller", "kartlar": [{ "on": "Mitokondri", "arka": "Enerji merkezi" }] }],
  "testler":  [{ "ad": "Hücre testi", "sorular": [
      { "s": "Soru?", "secenekler": ["a","b","c","d"], "dogru": 1,
        "aciklama": "isteğe bağlı", "konu": "Hücre" }] }],
  "terimler": [{ "terim": "Organel", "tanim": "…", "esanlam": ["…"] }] }
```

Kurallar: kimlikler yeniden üretilir (çakışma olmaz) · ders adı eşleşirse ona bağlanır, yoksa
yeni ders açılır · aynı destede aynı ön yüz varsa kart atlanır (paketi iki kez almak kopya
üretmez) · aynı adlı test numaralanır · eksik/bozuk kayıtlar atlanıp sayısı raporlanır ·
öncesinde `takeSnapshot("paket")` alınır. **Bu akışta asla `DB=` ile toptan atama yapma** —
"Yedek yükle" (`importJSON`) ile karıştırma, o her şeyi değiştirir.

Biçimin tam anlatımı ve başka bir modele verilecek hazır talimat `PAKET.md`'de; aynı metin
uygulamada `PAKET_TALIMAT` sabitinde durur (Ayarlar → Veri → **📋 Paket talimatı** panoya
kopyalar). **İkisi ayrışmamalı** — `tests/unit.mjs` PAKET.md'deki kod bloğuyla sabiti
karşılaştırıyor, birini değiştirirken diğerini de değiştir.

Yan localStorage anahtarları (yalnızca kurtarma için, uygulama bunlardan okumaz):
`studyos.v1.bozuk` — ayrıştırılamayan son veri · `studyos.v1.oncesi` — son içe aktarmadan
önceki hal (Ayarlar → Veri'den geri dönülebilir).

## Geliştirme akışı

1. `index.html` üzerinde küçük, hedefli değişiklikler (uzun blokları `node` ile
   dize değiştirerek yamalamak güvenli oldu — bulunamayan desende hata fırlat).
2. Sözdizimi: script bloklarını çıkarıp `node --check`.
3. `node tests/unit.mjs` ve `node tests/paket-konular.mjs` — mantık, eski veri ve kaynak bütünlüğü.
4. `node tests/smoke.mjs` ve `node tests/kutuphane-smoke.mjs` — arayüz; hepsi geçmeli.
   Playwright özel tarayıcı yolunda ise `STUDYOS_CHROMIUM=/tam/yol/chromium` kullanılabilir.
5. `VERSION` sabitini artır; `sw.js` içindeki önbellek adını (`studyos-vN`) da artır.
6. Çalışma dalına commit/push; PR aç. Kullanıcı isterse `main`e birleştir; Pages `main`den yayınlanır.

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
