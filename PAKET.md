# StudyOS paket biçimi

Bir **paket**, dışarıda hazırlanmış kart destesi / test / sözlük terimi setidir.
StudyOS'ta **Ayarlar → Veri → 📦 Paket ekle** ile alınır ve **mevcut verinin üstüne eklenir** —
hiçbir şeyi silmez, değiştirmez. (Üstüne yazan yol "⬆ Yedek yükle"dir, onunla karıştırma.)

Bu dosya, paketi **başka bir yapay zekâ modeline hazırlatmak** için yazıldı:
aşağıdaki "Talimat" bölümünü olduğu gibi kopyalayıp modele ver, en altına konuyu yaz.
Aynı metin uygulamanın içinde de duruyor: **Ayarlar → Veri → 📋 Paket talimatı** düğmesi
panoya kopyalar (tablette tarayıcı sekmesi değiştirmeden işe yarar).

---

## Talimat (kopyalanacak bölüm)

```
StudyOS paketi hazırla.

Çıktı: SADECE tek bir JSON nesnesi. Açıklama, başlık, markdown kod bloğu ekleme.

Biçim:
{
  "studyosPaket": 2,
  "ad": "<paketin adı>",
  "ders": "<ders adı, ör. Biyoloji>",
  "anaKonu": "<ana konu, ör. Romatoloji>",
  "konular": ["<alt konu, ör. Romatoid artrit>"],
  "desteler": [
    { "ad": "<deste adı>", "konu": "<anaKonu ile aynı>",
      "kartlar": [ { "on": "<ön yüz: soru/kavram>", "arka": "<arka yüz: cevap>" } ] }
  ],
  "testler": [
    { "ad": "<test adı>", "konu": "<anaKonu ile aynı>",
      "sorular": [
        { "s": "<soru>", "secenekler": ["<a>","<b>","<c>","<d>","<e>"], "dogru": 1,
          "aciklama": "<doğru cevabın kısa gerekçesi>", "konu": "<anaKonu veya konular listesinden biri>" }
      ] }
  ],
  "terimler": [ { "terim": "<terim>", "tanim": "<1-2 cümle>", "esanlam": ["<eşanlam>"] } ],
  "notlar": [ { "baslik": "<not başlığı>", "icerik": "<markdown konu anlatımı>" } ]
}

Kurallar:
- "dogru" sıfırdan başlayan şık sırasıdır (ilk şık için 0).
- Şık sayısı 2-6 arası serbesttir; TUS/YKS gibi sınavlar için 5 şık yaz. Doğru şıkkın yerini sorular arasında dağıt.
- Ders, anaKonu ve konular zorunlu. Konular sadece alt konu adlarıdır; anaKonu bu dizide tekrarlanmaz.
- Her test/deste "konu" alanında anaKonu değerini harfi harfine taşır.
- Her soruda açıklama ve konu zorunlu; sorunun konusu anaKonu veya konular listesindeki bir alt konudur.
- Ders → ana konu → test/deste düzeni bu alanlardan kurulur; adlardan çıkarım yapılmaz.
- Her kartın ön yüzü TEK bir şey sorsun; arka yüz 1-3 cümle.
- Aynı ön yüz iki kez geçmesin.
- İstemediğin bölümü boş dizi bırak (ör. "testler": []). "notlar" isteğe bağlıdır: yalnızca konu anlatımı da istenmişse yaz.
- Not içeriği markdown'dır (#, ##, -, **kalın**, tablo). Başka bir notun başlığını [[Başlık]] ile bağlayabilirsin; sözlük terimleri notta kendiliğinden işaretlenir.
- Kart, soru ve terimlerde görsel, HTML, LaTeX, markdown yok — düz metin. Satır sonu gerekiyorsa \n kullan.
- Türkçe yaz.
- Emin olmadığın bilgiyi yazma; uydurma tanım ezberlenirse zararlı olur.

Konu: <BURAYA KONUYU YAZ>
İstediğim: <ör. 30 kart + 15 çoktan seçmeli soru>
```

---

## Alan alan biçim

| Alan | Zorunlu | Ne |
|---|---|---|
| `studyosPaket` | ✔ | Biçim sürümü. Yeni paketler `2`; eski `1` paketleri de alınır. |
| `ad` | – | Pakete verilen ad; yalnızca özet ekranında görünür. |
| `ders` | ✔ (v2) | Ders adı. **Aynı adlı ders varsa ona bağlanır**, yoksa yeni ders açılır. v1'de boşsa "Genel"; v2'de boş olamaz. |
| `anaKonu` | ✔ (v2) | Ders altındaki ana konu: Romatoloji. |
| `konular` | ✔ (v2) | Ana konunun alt konu adları; boş dizi olabilir. |
| `desteler[].konu` / `testler[].konu` | ✔ (v2) | `anaKonu` ile birebir aynı. |
| `desteler[].ad` | ✔ | Deste adı. **Aynı ders ve ana konuda aynı adlı deste varsa kartlar ona eklenir.** |
| `desteler[].kartlar[].on` / `.arka` | ✔ | Kartın iki yüzü. **İkisi de dolu olmalı**, v2'de biri boşsa paket reddedilir (v1'de kart atlanır). |
| `testler[].ad` | ✔ | Test adı. Aynı adlı test varsa numaralanır (`… (2)`). |
| `testler[].sorular[].s` | ✔ | Soru metni. |
| `testler[].sorular[].secenekler` | ✔ | 2-6 şık (TUS için 5). v2'de aralık dışıysa paket reddedilir (v1'de soru atlanır). |
| `testler[].sorular[].dogru` | ✔ | Doğru şıkkın sırası, 0'dan başlar. v2'de aralık dışıysa paket reddedilir (v1'de soru atlanır). |
| `testler[].sorular[].aciklama` | ✔ (v2) | Cevaptan sonra gösterilir. |
| `testler[].sorular[].konu` | ✔ (v2) | `anaKonu` veya `konular` içindeki bir ad. İstatistik → "zayıf konular" bunu kullanır. |
| `terimler[].terim` | ✔ | Sözlükte işaretlenecek kelime. |
| `terimler[].tanim` | ✔ | Balonda çıkan tanım. |
| `terimler[].esanlam` | – | Aynı tanıma götüren başka yazımlar (çekimli hâller vb.). |
| `notlar[].baslik` / `.icerik` | ✔ (bölüm isteğe bağlı) | Konu anlatımı notu; `icerik` markdown. **Aynı derste aynı başlıklı not varsa atlanır.** Notlar uygulamasında derse bağlı açılır. |

## Uygulamanın uyguladığı kurallar

- **Kimlikler yeniden üretilir** — iki farklı paket çakışmaz.
- **Ders adı eşleşirse o derse bağlanır**, yoksa yeni ders açılır.
- **Aynı destede aynı ön yüz varsa kart atlanır** — kartlar kopyalanmaz; testler aşağıdaki gibi numaralanır.
- **Aynı adlı test numaralanır.** Aynı başlıklı not ise atlanır (not değişmez).
- **v2 paketlerinde bozuk yapı içe aktarmadan önce reddedilir.** v1 eski esnek alma yolunu korur. Zaten var olan kart/not/terim yine atlanabilir; sayı raporlanır.
- **Eklemeden önce anlık görüntü alınır** (`paket`); Ayarlar → Veri → 🕘 Anlık görüntüler'den geri dönülebilir.
- Eklenen kartların hepsi **bugün vadeli yeni kart** olarak başlar; günlük yeni kart sınırına
  (Ayarlar → `newPerDay`, varsayılan 20) tabidir, yani 200 kartlık paket bir günde önüne yığılmaz.

## Eski v1 biçimine örnek (geriye uyumluluk)

```json
{ "studyosPaket": 1, "ders": "Biyoloji",
  "desteler": [{ "ad": "Organeller", "kartlar": [{ "on": "Mitokondri", "arka": "ATP üretir." }] }] }
```

## Eski v1 tam örneği

```json
{
  "studyosPaket": 1,
  "ad": "Biyoloji — Hücre",
  "ders": "Biyoloji",
  "konular": ["Hücre"],
  "desteler": [
    { "ad": "Hücre organelleri",
      "kartlar": [
        { "on": "Mitokondri", "arka": "Oksijenli solunumun gerçekleştiği, ATP üretiminin büyük kısmını yapan çift zarlı organel." },
        { "on": "Ribozom", "arka": "Protein sentezinin yapıldığı zarsız organel." }
      ] }
  ],
  "testler": [
    { "ad": "Hücre — hızlı test",
      "sorular": [
        { "s": "ATP üretiminin büyük kısmı hangi organelde gerçekleşir?",
          "secenekler": ["Ribozom", "Mitokondri", "Lizozom", "Golgi aygıtı"],
          "dogru": 1, "aciklama": "Oksijenli solunumun son basamakları mitokondride yürür.", "konu": "Hücre" }
      ] }
  ],
  "terimler": [
    { "terim": "Organel", "tanim": "Hücre içinde belirli bir görevi olan yapı.", "esanlam": ["organeller"] }
  ]
}
```

## Kullanmadan önce

Yapay zekâ ders içeriğinde **hata yapabilir**. Yanlış bir kart aralıklı tekrarla aylarca
pekiştirilir — paketi almadan önce kartları bir gözden geçir. En güvenlisi paketi
**kendi notlarından** ürettirmektir: notu modele verip "bundan kart çıkar" demek.

## Ders–konu düzeni ve geçiş

Yeni paket biçimi v2, uygulama sürümü 4.4 ile gelir. JSON önceki uygulamalarda açılmaz;
uygulamayı güncelleyin. Ders → ana konu → test/deste görünümü için test ve desteler açık
konu bağlantısı taşır. Soruların alt konu bağlantıları istatistikler için ayrı kalır.
Mevcut veri tabanında kimlikler ve çalışma geçmişi değişmez. Eski testin bütün soruları
aynı konu köküne bağlıysa o kökte gösterilir; diğerleri ve bağlantısız desteler
**Konusu belirlenmemiş** altında kalır. **Toplu konu ata** ile taşınabilir.
Eski bir paketi yeniden almak bir taşıma yöntemi değildir: testleri çoğaltabilir.

Konu adları v2 paketinde aynı ders ve ebeveyn içinde eşleştirilir. Örneğin farklı ana
konular altındaki aynı adlı alt konular birbirine karışmaz. Var olan düz v1 konuları
arka planda başka bir ebeveyne taşınmaz.

## Kaynak denetimi

Uygulama JSON'u ile aynı ada sahip `.denetim.json`, kaynak kayıtlarını, her öğenin
öğrenme hedefi/iddia/kaynak bölümü bağlantılarını ve paket/öğe SHA-256 özetlerini tutar.
Bu dosya uygulamaya alınmaz. Üretim sözleşmesi `.claude/skills/paket-hazirla/brief.md` içindedir.
Birleştirici kaynaklı v2 üretiminde denetim dosyasını da yazar; veri doğrulama hatasında final paket yazmaz.

```bash
node araclar/paket-birlestir.mjs --dogrula paketler/tus-romatoloji.json --yalniz-bicim
```

Bu komut var olan paketi **değiştirmeden yalnızca biçim ve içe aktarma** yönünden denetler.
Yeni araştırılmış paketlerin tesliminde `--yalniz-bicim` kullanılmaz; normal `--dogrula`
kanıt dosyasının final içerikle eşleşmesini de denetler. Kaynak bağlantılarının geçmesi,
tıbbi iddiaların bağımsız doğrulaması değildir.
