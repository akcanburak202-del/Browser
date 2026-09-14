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
  "studyosPaket": 1,
  "ad": "<paketin adı>",
  "ders": "<ders adı, ör. Biyoloji>",
  "konular": ["<konu adı>"],
  "desteler": [
    { "ad": "<deste adı>",
      "kartlar": [ { "on": "<ön yüz: soru/kavram>", "arka": "<arka yüz: cevap>" } ] }
  ],
  "testler": [
    { "ad": "<test adı>",
      "sorular": [
        { "s": "<soru>", "secenekler": ["<a>","<b>","<c>","<d>","<e>"], "dogru": 1,
          "aciklama": "<doğru cevabın kısa gerekçesi>", "konu": "<konular listesinden biri>" }
      ] }
  ],
  "terimler": [ { "terim": "<terim>", "tanim": "<1-2 cümle>", "esanlam": ["<eşanlam>"] } ]
}

Kurallar:
- "dogru" sıfırdan başlayan şık sırasıdır (ilk şık için 0).
- Şık sayısı 2-6 arası serbesttir; TUS/YKS gibi sınavlar için 5 şık yaz. Doğru şıkkın yerini sorular arasında dağıt.
- "konu" yazacaksan "konular" listesinde harfi harfine aynı geçmeli.
- Her kartın ön yüzü TEK bir şey sorsun; arka yüz 1-3 cümle.
- Aynı ön yüz iki kez geçmesin.
- İstemediğin bölümü boş dizi bırak (ör. "testler": []).
- Görsel, HTML, LaTeX yok — düz metin. Satır sonu gerekiyorsa \n kullan.
- Türkçe yaz.
- Emin olmadığın bilgiyi yazma; uydurma tanım ezberlenirse zararlı olur.

Konu: <BURAYA KONUYU YAZ>
İstediğim: <ör. 30 kart + 15 çoktan seçmeli soru>
```

---

## Alan alan biçim

| Alan | Zorunlu | Ne |
|---|---|---|
| `studyosPaket` | ✔ | Biçim sürümü. Şu an `1`. |
| `ad` | – | Pakete verilen ad; yalnızca özet ekranında görünür. |
| `ders` | – | Ders adı. **Aynı adlı ders varsa ona bağlanır**, yoksa yeni ders açılır. Boşsa "Genel". |
| `konular` | – | Konu adları. Var olan konu tekrar açılmaz. |
| `desteler[].ad` | ✔ | Deste adı. **Aynı derste aynı adlı deste varsa kartlar ona eklenir.** |
| `desteler[].kartlar[].on` / `.arka` | ✔ | Kartın iki yüzü. **İkisi de dolu olmalı**, biri boşsa kart atlanır. |
| `testler[].ad` | ✔ | Test adı. Aynı adlı test varsa numaralanır (`… (2)`). |
| `testler[].sorular[].s` | ✔ | Soru metni. |
| `testler[].sorular[].secenekler` | ✔ | 2-6 şık (TUS için 5). Aralık dışıysa soru atlanır. |
| `testler[].sorular[].dogru` | ✔ | Doğru şıkkın sırası, 0'dan başlar. Aralık dışıysa soru atlanır. |
| `testler[].sorular[].aciklama` | – | Cevaptan sonra gösterilir. |
| `testler[].sorular[].konu` | – | `konular` içindeki bir ad. İstatistik → "zayıf konular" bunu kullanır. |
| `terimler[].terim` | ✔ | Sözlükte işaretlenecek kelime. |
| `terimler[].tanim` | ✔ | Balonda çıkan tanım. |
| `terimler[].esanlam` | – | Aynı tanıma götüren başka yazımlar (çekimli hâller vb.). |

## Uygulamanın uyguladığı kurallar

- **Kimlikler yeniden üretilir** — iki farklı paket çakışmaz.
- **Ders adı eşleşirse o derse bağlanır**, yoksa yeni ders açılır.
- **Aynı destede aynı ön yüz varsa kart atlanır** — aynı paketi iki kez almak kopya üretmez.
- **Aynı adlı test numaralanır.**
- **Eksik/bozuk kayıtlar atlanır** ve kaç tanesinin atlandığı özet ekranında yazar.
- **Eklemeden önce anlık görüntü alınır** (`paket`); Ayarlar → Veri → 🕘 Anlık görüntüler'den geri dönülebilir.
- Eklenen kartların hepsi **bugün vadeli yeni kart** olarak başlar; günlük yeni kart sınırına
  (Ayarlar → `newPerDay`, varsayılan 20) tabidir, yani 200 kartlık paket bir günde önüne yığılmaz.

## En küçük geçerli paket

```json
{ "studyosPaket": 1, "ders": "Biyoloji",
  "desteler": [{ "ad": "Organeller", "kartlar": [{ "on": "Mitokondri", "arka": "ATP üretir." }] }] }
```

## Tam örnek

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
