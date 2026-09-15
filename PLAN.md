# StudyOS — inceleme sonrası uygulama planı

Dış bir incelemeden çıkan maddeler kodda doğrulandı ve beş partiye bölündü.
Her parti kendi commit'i, kendi `VERSION` artışı ve kendi `sw.js` önbellek adı artışıyla gider.
Bir parti bitmeden sonrakine geçilmez.

Durum işaretleri: ☐ yapılmadı · ◐ sürüyor · ☑ bitti

---

## 1. parti — Veri güvenliği kusurları  (sürüm 2.3) ✅ BİTTİ

Bunlar öneri değil, gerçek kusur. Hepsi veri kaybına yol açabiliyor.

### 1.1 ☑ Tarih UTC yerine yerel hesaplansın

**Sorun.** `today()` (`index.html:399`) `toISOString()` kullanıyor. UTC+3'te yerel saat
00:00–02:59 arası her şey **bir önceki güne** yazılıyor: oturum kayıtları, seri (streak),
kart vadesi, günlük hedef, quiz denemesi tarihi. Gece çalışan bir öğrencide sık tetiklenir.

**Çözüm.** Tek bir yerel yardımcı ekle, üç fonksiyonu ona bağla:

```js
const ymd=d=>{const x=d?new Date(d):new Date();
  return x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate());};
const today=()=>ymd();
const dayKey=d=>ymd(d);
const addDays=(dstr,n)=>{const d=new Date(dstr+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d);};
```

`dayDiff` ve `mondayOf` zaten yerel öğleni ayrıştırıp yerel alan okuyor — dokunulmayacak.

**Dikkat.** Geçmişte yanlış yazılmış tarihler geri döndürülemez (kayıtlarda saat yok).
Geriye dönük düzeltme **denenmeyecek**; sürüm notunda belirtilecek.

### 1.2 ☑ Bozuk veri artık sessizce ezilmesin

**Sorun.** `load()` (`index.html:419-426`) `JSON.parse` hata verirse `catch(e){}` ile yutuyor,
`DB=seed(); save()` çalışıyor. 250 ms sonra kullanıcının verisinin üstüne **örnek veri** yazılıyor
ve geri dönüş yok.

**Çözüm.**

1. Ham metni `studyos.v1.bozuk` anahtarına kopyala (sabit anahtar, eskisini ez — kota şişmesin).
2. Kopyalama kota yüzünden başarısız olursa ham metni bellekte `CORRUPT_RAW` değişkeninde tut.
3. `seed()` **değil** `blank()` ile devam et — örnek veri, kaybın üstünü örtüp "her şey yolunda"
   hissi verir.
4. `save()` çağırma; açılışta tam ekran bir uyarı katmanı göster:
   - ne olduğu, verinin nereye kopyalandığı
   - `⬇ Bozuk veriyi indir` (ham metni dosya olarak verir — kurtarma şansı)
   - `Boş başla` (onayla, ancak o zaman `flush()`)

Uyarı **toast olmayacak**; toast kaçırılır, bu kaçırılmamalı.

### 1.3 ☑ Kota uyarısı susturulmasın  *(incelemede yok, kodda bulundu)*

**Sorun.** `flush()` (`index.html:414-416`) kota hatasında bir kez toast basıyor ve
`_quotaWarned` sonraki uyarıları da kapatıyor. Yani depo dolduktan sonra kullanıcı
**hiçbir uyarı almadan** çalışmaya devam ediyor; o oturumun tamamı kaydedilmiyor.

**Çözüm.**
- Global `SAVE_FAILED` bayrağı; başarılı `flush()`'ta temizlenir.
- Toast en fazla 60 sn'de bir tekrarlanır (tamamen susmaz).
- Bayrak açıkken widget alanının en üstünde kırmızı kalıcı kart:
  "⚠️ Kaydedilemiyor — depo dolu" + `⬇ Yedek al` düğmesi.
- Menü çubuğunda küçük bir işaret.

### 1.4 ☑ İki sekme birbirini ezmesin

**Sorun.** `storage` olayı hiç dinlenmiyor. Bilgisayarda iki sekme açıksa son yazan kazanır.

**Çözüm.** `window.addEventListener("storage", …)`; `e.key===KEY` ise oturumda bir kez
kalıcı uyarı: "Veri başka bir sekmede değişti. Buradaki değişiklikler onu ezebilir."
+ `↻ Yenile` (`location.reload()`) ve `Yoksay`.

Tablet birincil cihaz olduğu için düşük etkili, ama 10 satır.

### 1.5 ☑ İçe aktarmada onay ve geri dönüş

**Sorun.** `importJSON` (`index.html:2262`) mevcut veriyi sormadan değiştiriyor.

**Çözüm.**
1. Dosya ayrıştırılıp geçerliliği doğrulandıktan **sonra** özet göster:
   "Gelen: N not, M kart, K oturum · Silinecek: X not, Y kart" → onay iste.
2. Onaydan hemen önce `localStorage[KEY]` ham metnini `studyos.v1.oncesi` anahtarına kopyala
   (anlık, dosya indirmez). 2. partide anlık görüntü gelince bu ona bağlanır.
3. Ayarlar'da "Son içe aktarmadan önceki hale dön" düğmesi.

### 1.6 ☑ Saf fonksiyonlar için birim test — `tests/unit.mjs`

Duman testi arayüzü koruyor ama 1.1'deki gibi mantık hatalarını göremez.

**Yaklaşım.** `index.html`'den 1., 2. ve 3. script bloklarını çıkar (satır 386-793, 794-1136,
1137-1481), Node'da `vm.runInNewContext` ile aynı bağlamda sırayla çalıştır.
4. blok yüklenmez (sonunda açılış kodu var). Saplamalar: `document`/`window`
(`addEventListener` boş), `localStorage`, `navigator`, `setTimeout`.
Üst seviyede DOM'a dokunan kod bu üç blokta yok — kontrol edildi.

**Kapsam.** `ymd`, `today`, `addDays`, `dayDiff`, `mondayOf`, `sm2`, `streak`, `md`, `wlParse`,
`noteToCards`.

**Tarih testi kritik.** Zaman dilimi Node başlangıcında okunur, çalışma anında değiştirilemez;
test dosyası kendini `TZ=Pacific/Kiritimati` (UTC+14), `TZ=Pacific/Midway` (UTC-11) ve
`TZ=Europe/Istanbul` ile alt süreç olarak yeniden çağırır ve `today()`'in yerel takvimle
eşleştiğini doğrular. Mevcut hata bu testte kesin düşer.

### 1. parti sonucu ✅
`node tests/unit.mjs` (4 zaman dilimi × 41 kontrol) ve `node tests/smoke.mjs` (29 kontrol) geçiyor ·
`VERSION=2.3` · `sw.js` `C="studyos-v8"`

**Uygularken çıkan ek kusur:** `flush()` yalnızca `_dirty` işaretliyse yazıyor. İçe aktarma
(`importJSON`), sıfırlama ve `exportJSON`'ın `lastBackup` damgası bu yüzden **hiç
kaydedilmiyordu** — sekme kapanınca içe aktarılan yedek uçabilirdi. `saveNow()` eklendi.

**Kapsam dışı bırakılanlar:** `wlParse` ve `noteToCards` birim testine alınamadı — ilki 4.
blokta (açılış koduyla birlikte yükleniyor), ikincisi `toast`/`saveAnd` çağırıyor. 4. partide
ayrıştırma kısmı saf bir fonksiyona çıkarılınca test edilecek.

---

## 2. parti — Geri dönülebilirlik  (sürüm 2.4) ✅ BİTTİ

### 2.1 ☑ Günlük otomatik anlık görüntü

Kalıcı depolama izni olmayan bir cihazda en ucuz sigorta.

- IndexedDB'ye yeni depo: `snaps` (veritabanı sürümü 2 → 3, `onupgradeneeded`).
- Kayıt: `{key, date, ts, reason, size, json}` — `json` yalnızca **metin DB'si**.
- **Medya dahil edilmeyecek.** 7 kopya × blob'lar kotayı patlatır; zaten bozulan/kaybolan
  taraf metin. Geri yükleme ekranında bu açıkça yazılacak.
- Ne zaman: açılıştan ~3 sn sonra (açılışı yavaşlatmamak için), `DB.settings.lastSnap !== today()` ise.
  Ayrıca `reason:"import"` ve `reason:"reset"` ile etiketli anlık görüntüler.
- Saklama: son 7 günlük + en fazla 3 etiketli, toplam 10 kayıt; fazlası silinir.
- Geri yükleme: Ayarlar → Veri → `🕘 Geri al` → liste (tarih, boyut, "N not · M kart") →
  onay → **önce mevcut hali `reason:"restore-oncesi"` ile kaydet** → `DB=…; flush(); refreshAll()`.
- Ayarlar'daki depolama ölçerine ayrı bir "anlık görüntüler" satırı.

### 2.2 ☑ Çöp kutusu (30 gün)

- `blank()`'e `trash:[]` eklenir. `Object.assign(blank(), d)` eksik alanı doldurduğu için
  şema sürümü artırmaya gerek yok.
- Kayıt: `{id, type, at, label, data}` — `type`: `note|card|deck|task|quiz|topic|term|course`.
- Değiştirilecek silme noktaları: not `847` · kart `1025` · deste+kartları `1030` ·
  test `1171` · konu ağacı `1394` · terim `2111` · görev (Görevler uygulaması) · ders `2194`.
- **`dropMedia` ertelenecek.** Şu an kart silinirken görsel anında siliniyor (`1025`);
  çöpten geri alınca görsel kayıp olurdu. Medya ancak çöpten kalıcı silinince atılır.
- Temizlik: açılışta `at < addDays(today(),-30)` olanlar kalıcı silinir (+ medyaları).
- **Boyut koruması:** çöp `JSON.stringify` boyutu 300 KB'ı aşarsa en eskiden başlayarak atılır —
  yoksa 5 MB'lık localStorage silinen notlarla dolar.
- UI: Ayarlar → Veri → `🗑 Çöp kutusu (N)` → `↩ Geri al` · `Kalıcı sil` · `Tümünü boşalt`.

### 2. parti sonucu ✅
`node tests/unit.mjs` (4 zaman dilimi × 57 kontrol) ve `node tests/smoke.mjs` (46 kontrol) geçiyor ·
`VERSION=2.4` · `sw.js` `C="studyos-v9"` · IndexedDB sürümü 2 → 3 (`snaps` deposu)

Çöp kutusuna bağlanan silme noktaları: not, kart, deste(+kartları), test, konu ağacı(+alt konular),
terim, görev, ders, sınav. Her biri `toTrash` çağırıyor ve artık `dropMedia` **çağırmıyor**.

**Uygularken çıkan ek kusur:** not silme hiç `dropMedia` çağırmıyordu — nottaki görseller
IndexedDB'de öksüz kalıyordu. Çöp kutusu bunu da kapattı (kalıcı silmede gövdedeki `idb:`
referansları ve ekler taranıyor).

**Kapsam dışı:** Takvim'deki "bu haftanın bloklarını temizle" toplu silmesi çöpe bağlanmadı —
tek kayıt değil, yinelenen blok kümesi; ayrı bir çöp türü gerektiriyor.

---

## 3. parti — "Bugün ne çalışayım"  (sürüm 2.5) ✅ BİTTİ

Uygulamanın hissini en çok değiştirecek parça. Veriler zaten var, birleşmiyor.

**Girdiler:** vadesi gelen kartlar · açık ve vadeli görevler · `examList()` · konu durumları ·
son 7 günün oturumları · `DB.settings.goal`.

**Kural tabanlı, açıklanabilir olacak** — kara kutu puanlama yok, her satır "neden burada"
sorusunu yanıtlayabilmeli:

1. Vadesi gelen kart varsa ilk sıra her zaman **"Tekrar: N kart"** (≈ N × 0.25 dk, en fazla bir blok).
2. Bugün/geçmiş vadeli görevler ayrı bir satır.
3. Sınavlar: `gun = dayDiff(today, exam.date)`, ağırlık `1/max(1,gun)`; o dersin
   `new` ve `learning` konuları arasında dağıtılır — en yakın sınav en çok yer alır.
4. Sınavı olmayan derslerde, son 7 günde hiç çalışılmamış `learning` konu → "ihmal edilen" satırı.
5. Toplam `goal` dakikayı 25 dk'lık bloklara böler, 3–5 satır çıkarır.

**Yerleşim.** Ayrı uygulama açmıyoruz (dock şişer). Widget olarak, çalışma widget'ının hemen
altında. Her satırda `▶` düğmesi doğrudan `Study.begin(courseId, topicId)` çağırır veya kart
turunu başlatır.

**Saklama.** Plan türetilmiştir, veriye yazılmaz. Tek istisna `DB.settings.planDone={date, ids}` —
bugün tamamlananların üstü çizilir, tarih değişince kendiliğinden sıfırlanır.

### 3. parti sonucu ✅
`node tests/unit.mjs` (4 zaman dilimi × 82 kontrol) ve `node tests/smoke.mjs` (57 kontrol) geçiyor ·
`VERSION=2.5` · `sw.js` `C="studyos-v10"`

`dailyPlan()` 3. bloğun sonunda duruyor (blok 1-3 birim testte yükleniyor), çizim 4. blokta.
Motorun tamamı 22 birim testiyle sabitlendi; widget davranışı 11 duman testiyle.

**Ayarlanan sayı:** ihmal ağırlığı ilk yazımda `0.3` idi, yani "3 gün sonraki sınav" kadar ağır —
iki hafta sonraki bir sınavın konularını gömüyordu. `PLAN_IHMAL=0.1` yapıldı (≈ 10 gün sonraki
sınav) ve denge noktası teste bağlandı, kazara kaymasın.

**Yan düzeltme:** kart turu başlatma kodu widget'ta iki kez kopyalanmıştı;
`startCardReview()` olarak tek yere alındı.

---

## 4. parti — Öğrenme motoru  (sürüm 2.6) ✅ BİTTİ

- ☑ **Günlük yeni kart sınırı.** `DB.settings.newPerDay` (varsayılan 20). `reps===0` yeni sayılır;
  kuyruk kurulurken sınırlanır, sayaç `DB.settings.newSeen={date,n}`. 200 kart eklenince
  kuyruğun patlaması bununla biter.
- ☑ **Cram modu.** Deste ekranında "🔥 Hepsini çalış (vadesiz)". **SM-2 güncellemesi yapmaz** —
  yoksa tekrar programı bozulur. Yalnızca gösterir.
- ☑ **Boşluk doldurma `{{c1::…}}`.** `noteToCards` (`index.html:898`) genişletilir; mevcut
  `Soru :: Cevap` dönüştürücüsünün yanına. Her `c<n>` numarası için bir kart; `front` metinde
  hedef `[…]` ile gizlenir, `back` açık hali.
- ☑ **Quiz sorusuna `topicId`.** Soru düzenleyicide konu seçici;
  `quizRuns[].topics={<topicId>:[doğru,yanlış]}` — planda `wrongTopics:[]` denmişti, doğru/yanlış
  ikilisi tutmak yanlış *oranı* hesaplamayı mümkün kıldı; yalnız yanlış listesi yetmezdi.
  İstatistik'e "Zayıf konular" listesi eklendi; hiç konu işaretlenmemişse nasıl işaretleneceğini anlatıyor.

### 4. parti sonucu ✅
`node tests/unit.mjs` (4 zaman dilimi × 111 kontrol) ve `node tests/smoke.mjs` (73 kontrol) geçiyor ·
`VERSION=2.6` · `sw.js` `C="studyos-v11"`

**Tasarım kararı:** "yeni kart" ölçütü `reps===0` değil `!c.seen` oldu. `sm2()` bilinemeyen kartta
`reps`'i sıfırladığı için `reps===0` ölçütüyle o kart her gün yeniden "yeni" sayılır, kotayı
sonsuza kadar yerdi.

**Kota global harcanıyor:** `dueCards(deckId)` önce tüm kartları gezip kotayı düşüyor, sonra desteye
süzüyor. Deste deste çağrılsa da aynı kartlar seçiliyor, rozetlerin toplamı genel toplamı aşmıyor.

**Görsel kontrolde yakalanan metin kusuru:** plan satırı "Matematik deneme sınavı **sınavına** 14 gün"
yazıyordu. `${ad} · ${gun} gün kaldı` biçimine geçildi, iki test bunu sabitliyor.

**Kapsam dışı:** zayıf konuların günlük plana ağırlık olarak beslenmesi. Doğal bir sonraki adım ama
plan ağırlıkları teste bağlı; ayrı bir iş olarak konuşulmalı.


---

## 5. parti — Tablet ergonomisi  (sürüm 2.7) ✅ BİTTİ

- ☑ **Pencere yaslama.** `dragify` (`index.html:726`) bırakma anında: `clientX < 24` → sol yarı,
  `> W-24` → sağ yarı, `clientY < 24` → tam ekran; sürüklerken yarı saydam önizleme.
  Not + PDF'i yan yana koymayı iki dokunuşa indirir.
- ☑ **Kalem/çizim notu.** Pointer events (`pointerType==="pen"`, basınç) ile canvas; PNG olarak
  `putMedia` → nota `![](idb:…)`. Matematik ve biyoloji için klavyeden doğal.
- ✕ **Kartlarda sesli okuma — YAPILMADI (kullanıcı kararı).**
  Cihazda Play Servisleri yok; Android'de Türkçe ses Google TTS motorundan geliyor ve Huawei'nin
  kendi motorunun `speechSynthesis`'e kayıtlı olup olmadığı buradan sınanamıyor. Playwright'taki
  Chromium'un ses listesi tabletle ilgisiz — yani "çalışıyor" denemezdi, ancak "cihazında varsa
  çalışır" denebilirdi. Kullanıcı bu belirsizlikte özelliği istemedi.
  **Yerine:** Ayarlar → "Bu cihaz neyi destekliyor?" paneline ölçüm satırı eklendi
  (Türkçe ses var mı, cihazda kaç ses kayıtlı). O satır ✓ gösterirse özellik ~30 satırlık iş olarak
  sonra eklenebilir.

### 5. parti sonucu ✅
`node tests/unit.mjs` (4 zaman dilimi × 121 kontrol) ve `node tests/smoke.mjs` (74 kontrol) geçiyor ·
`VERSION=2.7` · `sw.js` `C="studyos-v12"`

**Ad çakışması:** yaslama sabitleri önce `SNAP_*` yazılmıştı ve 2. partideki anlık görüntü
etiketleriyle çakıştı (`node --check` yakaladı). Yaslama tarafı `YASLA_*` oldu.

**Yan düzeltme (kapsam dışı, testte görüldü):** Görüntüleyici dock'tan dosyasız açılınca
başlığı "undefined" oluyor, gövdesinde çalışmayan "Tarayıcıda aç / İndir" düğmeleri çıkıyordu.
Düzgün bir boş durum eklendi.
## Cihazda denendikten sonra (sürüm 2.8)

Kullanıcı 2.7'yi Huawei MatePad'de denedi. Sonuçlar:

- **Yaslama çalışıyor.** ✅
- **Ses motoru yok** — cihaz panelindeki ölçüm satırı ✕ verdi, yani sesli okuma konusu kapandı.
  İyi ki yazmamışız.
- **Çizim tahtasında üç kusur çıktı, üçü de düzeltildi:**

### ☑ Çizilenler kayboluyordu
Tuval yalnızca **artımlı** çiziliyordu (`paint()` sadece geri al/temizle'de). Android Chrome
arka plana atılan sekmenin tuval belleğini atabiliyor — cihazın kalem el yazısı katmanı sayfayı
arka plana aldığında da oluyor. Çizgiler `strokes` dizisinde durduğu için artık
`visibilitychange/pageshow/focus/resize/contextrestored` olaylarında hepsi yeniden çiziliyor.

### ☑ Kaydetmeden çıkılamıyordu
`Escape` dinleyicisi odaklanamayan bir `div`'e bağlıydı, **hiç çalışmıyordu**. Üstelik
uygulamanın genel Escape kısayolu en üstteki pencereyi kapatıyordu, yani Esc çalışsaydı bile
altındaki not penceresini de kapatacaktı. Şimdi: ✕ düğmesi, Vazgeç, Escape, **cihazın geri
tuşu** (`pushState`/`popstate`) ve karartıya dokunma — hepsi kapatıyor, çizim varsa onay
soruluyor. Tam ekran katmanlar `class="ovl"` alıyor ve genel klavye işleyicisi onlar varken
susuyor (bu, bozuk veri uyarısı gibi ekranları da koruyor).

### ☑ Düğmeler ekran dışında kalabiliyordu
Tuval yüksekliği `innerHeight-180` sabitiyle hesaplanıyordu; araç çubuğu iki satıra sarınca
alt düğme çubuğu aşağı taşıyordu. Düzen gerçek flex oldu (çubuklar `flex:0 0 auto`, tuval
`flex:1 1 auto; min-height:0`), tuval CSS ile kutuya sığdırılıyor. Üç ekran oranında
(dikey 800×1280, yatay 1280×800, alçak 1024×620) düğmelerin görünürlüğü teste bağlandı.

### ⚠ Kalem el yazısının tetiklenmesi — kısmen
Cihazın kalem-yazıya-çevirme katmanı web sayfasından kapatılamıyor. Web tarafında yapılabilecek
her şey yapıldı: açılışta odaktaki yazı alanı bırakılıyor, alttaki her şey `inert` oluyor,
katmanda `touch-action:none` ve seçim kapalı, `pointercancel` gelirse o ana kadarki çizgi
korunuyor, tuval kendini yeniden çiziyor. Kalanı cihaz ayarından kapatmak gerekiyor; tahtanın
alt satırında bu yazıyor.

### Yan düzelt(il)enler
- Tuval mantıksal boyu artık ekrana uyuyor (dikeyde 1200'e kadar), döndürmede içerik bozulmuyor.
- "Temizle" artık onay soruyor.

## İkinci cihaz turu (sürüm 2.9)

- **El yazısı artık devreye girmiyor** ✅ — 2.8'deki odak bırakma + `inert` işe yaradı.
- **Çizgi akıcılığı** yetersizdi: noktalar düz parçalarla bağlanıyordu ve yalnızca kare başına
  bir nokta örnekleniyordu. Orta noktalardan geçen eğri (`quadraticCurveTo`) ve
  `getCoalescedEvents()` eklendi.
- **Kapatma düğmesi görünmüyordu.** Kök neden: Android'de adres çubuğu görünürken
  `position:fixed; inset:0` bir katman **düzen görünümünü** kaplıyor, görünen alanı değil —
  alttaki "Vazgeç / ✓ Nota ekle" çubuğu ekran dışında kalıyordu. Kullanıcı yalnızca karartıya
  dokunarak çıkabildiği için "belirli bir yer yok" dedi, haklı.
  **Çözüm:** kritik düğmeler üst çubuğa taşındı — solda `✕ Kapat`, sağda `✓ Nota ekle`;
  katman `height:100dvh` alıyor; tuval boyu `visualViewport` yüksekliğinden hesaplanıyor.
  Duman testi üç ekran oranında (800×1280, 1280×800, 1024×620) ikisinin de görünür alanda
  kaldığını sınıyor.
- **Karartıya dokunmak artık kapatmıyor** — çizerken avuç değince kapanmasın ve kapanış yeri
  belirsiz kalmasın diye. Kapanış yolları: ✕ Kapat, Escape, cihazın geri tuşu.

## Üçüncü cihaz turu (sürüm 3.0)

Kullanıcı fotoğraf gönderdi: çizgiler eskisinden akıcı ✅, ama üst çubukta "✕ Kapat"
görünmüyor — **oraya dokununca çizimden çıkıyor**, yani düğme orada ve çalışıyor.

**Kök neden: tema renkleri karartının üstünde kayboluyor.** Çizim tahtası kendi
`rgba(0,0,0,.86)` karartısının doğrudan üstünde duruyor ama düğmeleri tema
belirteçlerini kullanıyordu. **Açık temada** `--text:#14130f` (neredeyse siyah) ve
`.btn` zemini `rgba(0,0,0,.075)` — ikisi de siyah üstünde görünmez.
Görünen üç şeyin hepsinin kendi rengi vardı: renk kareleri (satır içi `background`),
"Temizle" (`--bad`, kırmızı), "Nota ekle" (`.pri`, mavi zemin + beyaz).
Fotoğraftaki tabloyla bire bir uyuşuyor.

**Çözüm:** `.onDark` sınıfı — koyu karartının doğrudan üstündeki denetimler kendi
renklerini taşıyor (beyaza yakın metin, `rgba(255,255,255,.15)` zemin).
`drawPad` ve `#focusOverlay` (orada da düğme zeminleri kayboluyordu) bu sınıfı aldı.
`bigNotice` almadı: onun düğmeleri açık zeminli bir kutunun içinde, tema renkleri orada doğru.

Duman testi iki temada da `✕ Kapat`, `↶` ve `Temizle` düğmelerinin metin parlaklığını ve
zemin saydamlığını ölçüyor; bu kusur bir daha sessizce dönemez.

## Kullanım turu (sürüm 4.0)

Dört bildirim, dördü de gerçek:

**1. Takvimde blok girilen süreyle açılmıyordu.** Kök neden diyalogdaydı, takvimde değil:
`type="number"` kutusu "1" doluyken tablette üzerine dokunup 3 yazınca değer **13** oluyor,
`Math.min(6,13)` de 6 saatlik blok açıyordu. Tekrar tıklayıp düzeltince alan seçili
geldiğinden doğru çalışıyordu — kullanıcının anlattığı davranış tam olarak buydu.
Playwright'ta `click` + `type` ile birebir üretildi.
Çözüm iki katmanlı: `dialog()` alana odaklanınca içeriği seçiyor (sayı kutusunda her
dokunuşta), ve saat/süre alanları artık **açılır liste** (`hourOpts()`), yani yazılmıyor.

**2. Konu haritasında ders silinemiyor.** `+ Ders` vardı, karşılığı yoktu.
`deleteCourse()` derse bağlı ne varsa (konu, not, deste+kartlar, görev, test, takvim bloğu,
sınav, çalışma kaydı, sözlük terimi) **tek bir çöp kaydına** koyar; geri alınca ilişkiler
bozulmadan döner. Silmeden önce ne gideceği sayılarla yazılır. Birden çok dersi kapsayan
sınav silinmez, yalnızca o dersi bırakır (geri alınca yeniden kapsar).

**3. Sınav tek ders seçtiriyordu.** TUS/YKS gibi sınavlar bütün dersleri kapsıyor.
`dialog()`'a `type:"multi"` alanı eklendi; sınav artık `courseIds` taşıyor ve günlük plan
sınavın **her dersinin** konularını çağırıyor. Eski tek dersli kayıtlar `examCourses()`
sayesinde olduğu gibi çalışıyor, göç gerekmedi.
Konu haritasına da **"Tüm dersler"** görünümü eklendi — çok dersli bir sınava çalışırken
ağacın tamamı tek ekranda.

**4. Paket talimatı.** `PAKET.md` yazıldı: biçimin tamamı + başka bir yapay zekâya
olduğu gibi verilebilecek talimat. Aynı metin uygulamada da var
(Ayarlar → Veri → **📋 Paket talimatı** panoya kopyalar), böylece tablette sekme
değiştirmeden kullanılabiliyor. Birim test ikisinin ayrışmadığını sınıyor.

## Reddedilen / ertelenen

- **Kaynağı 4 dosyaya bölüp build betiğiyle birleştirmek.** "Klonla, `index.html`'i aç, çalışır"
  bu projenin en değerli özelliği; build adımı onu bozar. 2639 satır henüz eşiğin altında.
  **4000 satıra yaklaşınca yeniden değerlendirilecek.**
- **Geçmiş tarihlerin geriye dönük düzeltilmesi** (1.1) — kayıtlarda saat yok, tahmin veriye zarar verir.

## Her partide değişmeyen kontrol listesi

1. Script bloklarını çıkarıp `node --check`
2. `node tests/unit.mjs`
3. `node tests/smoke.mjs`
4. `VERSION` + `VERSION_DATE` artır
5. `sw.js` içindeki `C` sabitini artır
6. Commit + `git push -u origin claude/proje-incelemesi-cidino`

## Sürüm 4.4 — ders/konu düzeni ve çift araştırma profili

- [x] Quiz ve Kartlar'da ders → ana konu → test/deste, geri gezinme ve konu içi arama.
- [x] Eski bağlantısız kayıtların görünürlüğü, toplu konu atama ve taşıma öncesi anlık görüntü.
- [x] Günlük kart tekrarı kısayolu; öğrenme geçmişini değiştirmeyen sınıflama.
- [x] v2 paket ana/alt konu sözleşmesi, v1 uyumluluğu ve aynı ebeveynde konu eşleştirmesi.
- [x] Fable/Opus akışını koruyan profil ve Astra Pro/Derin Araştırma profili.
- [x] Öğrenme hedefi/iddia/kaynak bölümü kayıtları; final dosyayı değiştirmeyen doğrulama.
- [x] Bozuk veri kaybını engelleyen birleştirme, çelişen kopya ve eski kanıt dosyası kontrolü.
- [x] Romatoloji paketinin sadece sınıflama metaverisini güncelleme.

Gerçek Astra Pro Derin Araştırma ve Fable/Opus üretim oturumları bu kod ortamında
çalıştırılmadı. Teknik aktarım/kanıt sözleşmesi sentetik içerikle sınanır; mevcut Romatoloji
içeriğinin tıbbi doğrulaması bu revizyonun kapsamı değildir.
