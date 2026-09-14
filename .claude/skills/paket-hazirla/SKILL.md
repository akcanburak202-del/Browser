---
name: paket-hazirla
description: "StudyOS için bir konunun çalışma paketini (kart desteleri + çoktan seçmeli testler + sözlük terimleri, istenirse konu anlatımı notları) araştırıp üretir, doğrular ve paketler/ altına koyar. Kullanıcı 'paket hazırla', 'kart destesi / quiz / test hazırla', 'X konusunu çalışmalık yap' dediğinde ya da bir sınav+ders+konu üçlüsü verip içerik istediğinde yükle."
---

# paket-hazirla — konuya özel çalışma paketi

Kullanıcı yalnızca **sınav, ders, konu** söyler; gerisi bu akıştır. Çıktı `paketler/<sinav>-<konu>.json`
dosyasıdır ve uygulamada **Ayarlar → Veri → 📦 Paket ekle** ile alınır. Biçim `PAKET.md`'de.

## Girdi

| Alan | Zorunlu | Örnek | Not |
|---|---|---|---|
| Sınav | ✔ | TUS, YKS, DUS, vize | Şık sayısını belirler: TUS/YKS/DUS **5**, aksi söylenmedikçe 5. |
| Ders | ✔ | Dahiliye | Paketteki `ders`; uygulamada aynı adlı ders varsa ona bağlanır. |
| Konu | ✔ | Onkoloji | Paket adı ve dosya adı bundan çıkar. |
| Alt konu | – | Antineoplastik ilaçlar | Verilirse kapsam yalnızca o alt konudur, daha derine iner. |
| Konu anlatımı | – | "notlar da olsun" | **Yalnızca istenirse** `notlar` bölümü üretilir. İstenmediyse üretme, sorma. |

Eksik zorunlu alan varsa sor; başka soru sorma, varsayılanlarla ilerle.

## Boyut: konu ne kadar gerektiriyorsa

Sabit kota yok. Kapsamı çıkarınca her alt başlık için tahmini genişliğe göre karar ver:

| Alt başlık genişliği | Kart | Soru | Terim |
|---|---|---|---|
| Dar (tek hastalık / tek ilaç grubu) | 12-20 | 5-8 | 3-6 |
| Orta (bir hastalık ailesi) | 20-35 | 8-14 | 6-10 |
| Geniş (sınıflama + tedavi + laboratuvar) | 35-55 | 12-20 | 8-12 |

Küçük bir konu (ör. tek bir alt konu) tek parça, tek ajan olabilir. Testleri 2-4 alt başlığı
kapsayan 25-70 soruluk gruplar hâlinde topla; alt başlık başına test açma.

## Akış

### 1. Kapsam (ana döngü)
- Konuyu sınavın gerçekten sorduğu alt başlıklara böl. Sınava özgü ağırlığı gözet
  (TUS: "en sık / en özgül / ilk tercih / patognomonik", antikor-hastalık ve HLA eşlemeleri,
  ilaç yan etkileri, kriter eşikleri, ayırıcı tanı tuzakları).
- `konular` listesini **sabitle** ve `<çalışma>/konular.json` olarak yaz (dize dizisi). Ajanlar ve
  birleştirme aracı bu listeyi harfi harfine kullanır.
- Çalışma dizini: scratchpad altında `<konu>/`. Parça dosyaları `part1.json`, `part2.json`…

### 2. Araştırma (Opus alt ajanları)
- Önce `fable-orchestration` skill'ini yükle. Her `Agent` çağrısında **`model: "opus"`** açıkça yaz.
- Alt başlıkları 2-4'erli gruplayıp ajan başına bir grup ver; hepsini **tek mesajda, paralel** başlat.
- Her ajana: `brief.md`'nin yolu (bu dizinde), kendi alt başlık listesi ve her biri için
  vurgulanacak noktalar, `konular.json` içeriği, test adları, hedef sayılar, çıktı dosyası yolu,
  şık sayısı, notlar istenip istenmediği. Brief'teki "emin değilsen yazma" kuralını tekrar et.
- Ajanlar dönene kadar ilgisiz iş yapma; dönüşte rapor ettikleri "atladıklarım" notlarını sakla,
  son raporda kullanıcıya aktarılacak.

### 3. Birleştirme ve doğrulama (araç)
```
node araclar/paket-birlestir.mjs --ad "<Sınav> <Ders> — <Konu>" --ders "<Ders>" \
  --konular <çalışma>/konular.json --sik 5 --kaynaklar <çalışma>/kaynaklar.txt \
  --cikti paketler/<sinav>-<konu>.json <çalışma>/part*.json
```
Araç kopya ön yüz / soru / terim / notu atar, şık sayısı ve `dogru` aralığını, konu adlarını,
doğru şık dengesini denetler ve paketi **uygulamanın kendi `paketUygula()` yoluyla** alır.
"ÖLÜMCÜL" satırı varsa parçayı düzeltip yeniden çalıştır; sıfır atlanan kayıt şart.

### 4. İnceleme (ana döngü, ATLANMAZ)
Ajan çıktısı ham maddedir. Ana döngü **bütün soruları ve bütün kartları** okur:
- Tıbbi/olgusal doğruluk: emin olmadığın satırı sil ya da yumuşat, sonra rapora yaz.
- Test-içi ve desteler-arası **anlam kopyaları** (araç yalnızca birebir aynı metni yakalar):
  aynı bilgiyi soran ikinci soru/kart gider, özellikle "laboratuvar/özet" türü destelerde.
- Belirsiz kısaltmalar (ör. çalışma adı ile hastalık adı çakışması), açılımı ilk geçtiği yerde.
- Şıklar aynı kategoriden ve benzer uzunlukta mı; "hepsi/hiçbiri" şıkları azınlıkta mı.
- Kart ön yüzü tek şey soruyor mu; arka yüz 1-3 cümle mi.
- Notlar istendiyse: başlık hiyerarşisi (#, ##), tablolar düz markdown, `[[Not başlığı]]`
  bağlantıları pakette gerçekten var olan başlıklara gidiyor mu.
Düzeltmeleri bir betikle **final dosya üzerinde** uygula (ön yüz / soru metni ile eşleyerek, bulunamayan
desende hata fırlat), aracı yeniden çalıştırıp sonucu doğrula.

### 5. Teslim
- `paketler/README.md` tablosuna satır ekle; paket başlığı altında kaynakları ve **bilerek
  yazılmayanları** kısaca listele.
- `node tests/unit.mjs` geçmeli. Commit mesajı: `"<Sınav> <Ders> — <Konu> paketi: N kart, M soru, K terim"`.
- Bulunduğun dala push et. `main`'e birleştirmeyi kullanıcı istemediyse yapma, teklif et.

### 6. Rapor (kullanıcıya)
Kısa: sayı tablosu (deste/kart, test/soru, terim, not), doğru şık dağılımı, hangi kaynak türleri,
inceleme sırasında kaç şey düzeltildi/silindi, bilerek yazılmayanlar, yükleme yolu
(`.../Browser/paketler/<dosya>` adresi main'deyse Pages üzerinden indirilebilir).

## Kurallar (kısa)
- Kod ve çıktı Türkçe; ilaç adları jenerik; kısaltma ilk geçtiği yerde açılır.
- Kart/soru/terim düz metin; markdown yalnızca notlarda.
- Her soru `konu` taşır (İstatistik → zayıf konular buna dayanır).
- Doğru şık test içinde dengeli dağılır; araç uyarırsa yeniden dağıt.
- Çıkmış soru metinlerini kopyalama; kalıpları kullan, soruyu yeniden yaz.
- Paket dosyasını elle yazma; her zaman araçtan geçir.
