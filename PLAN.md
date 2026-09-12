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

## 5. parti — Tablet ergonomisi  (hedef sürüm 2.7)

- ☐ **Pencere yaslama.** `dragify` (`index.html:726`) bırakma anında: `clientX < 24` → sol yarı,
  `> W-24` → sağ yarı, `clientY < 24` → tam ekran; sürüklerken yarı saydam önizleme.
  Not + PDF'i yan yana koymayı iki dokunuşa indirir.
- ☐ **Kalem/çizim notu.** Pointer events (`pointerType==="pen"`, basınç) ile canvas; PNG olarak
  `putMedia` → nota `![](idb:…)`. Matematik ve biyoloji için klavyeden doğal.
- ☐ **Kartlarda sesli okuma — koşullu.** `speechSynthesis` çevrimdışı çalışır, ama Play Servisleri
  olmayan cihazda Google TTS gelmez; Türkçe ses olmayabilir.
  `getVoices().some(v=>v.lang.startsWith("tr"))` **false ise düğme hiç gösterilmez.**
  Garanti özellik değil, öyle sunulmayacak.

---

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
