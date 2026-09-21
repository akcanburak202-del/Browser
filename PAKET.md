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

Uygulamaya alınacak çıktı dosyası yalnız tek bir JSON nesnesi içersin; içine açıklama veya markdown kod bloğu ekleme. Kaynak/kanıt ve kapsam raporlarını ayrı tut.

Kaynak türü:
- Kitap fotoğrafı/PDF/metni verdiysem veya "kitaptan" dediysem kitap akışını kullan. Repo erişimin varsa .claude/skills/kitap-paket-hazirla/SKILL.md oku; eski araştırma brief/profillerini yükleme. Kaynaksız araştırmada paket-hazirla kullan.
- Kitap akışında rutin internet doğrulaması yapma. Ayrıca istediğim güncellik/ek araştırmayı ayrı tut; bağlayıcı üst talimatın gerektirdiği kontrolü yalnız ilgili bilgiyle sınırla.
- Önce verilen her sayfanın tüm anlamlı bilgilerini çıkar; sonra notlara aktar. Tablo hücreleri, dipnotlar, listelerin tüm üyeleri, koşullar, istisnalar, eşikler, birimler, olumsuzluklar, şema dalları ve mnemonikler kaybolmasın. Görseli arşivlemek notlara aktarımın yerine geçmez.
- Kitap kaynaklı tam pakette ayrıntılı notlar + seçilmiş kart/quiz + yararlı terimler varsayılandır. Açıkça yalnız quiz/kart veya dar kapsam istemişsem buna uy ve tam kaynak aktarımı yaptığını söyleme.
- Kitabın sınava yönelik genellemelerini, klasik eşleşmelerini ve "en sık/ilk tercih" ifadelerini sırf istisnası olabilir diye eleme. Kaynak bağlamını koru; sıradan sınav kuralını sürekli uyarılarla ağırlaştırma.
- Okunamayanı tahmin etme. Somut baskı hatasını veya gerçek kaynak içi çelişkiyi notta konumuyla işaretle; sessizce silme/düzeltme veya doğru cevap diye ezberletme. Kaynak dışı ek bilgiyi açıkça ayır.
- Kart/quiz için ayırt ettirici ve hatırlanmaya değer hedefleri seç; her ayrıntıyı soruya dönüştürme. Tek savunulabilir cevap, makul çeldirici ve kaynak destekli açıklama kullan; zorla vaka veya sayıyı dolduran tekrar üretme.
- Üretim sonunda kaynak → bilgi → not eşleşmesini kontrol et. Başlık/sayfa/kart sayısını eksiksizlik kanıtı sayma. Yapılmış kontrolü gereksiz tekrarlama; okunamayan veya seçime göre dışarıda kalan yerleri açıkça bildir. Biçim doğrulaması kaynak kapsamını veya önizleme görünümünü kanıtlamaz.

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
- Ders → ana konu → test/deste/not/terim düzeni bu alanlardan kurulur; adlardan çıkarım yapılmaz.
- Notlar ve terimler paketin ders ve anaKonu alanlarını devralır; her öğeye ayrıca konu alanı ekleme.
- Her kartın ön yüzü tek bir hatırlama hedefi sorsun; arka yüz kısa ama yeterli olsun. Cümle kotası yüzünden koşul veya istisna kaybetme.
- Aynı ön yüz iki kez geçmesin.
- Kullanıcının istemediği bölümü boş dizi bırak (ör. "testler": []). Notlar şemada isteğe bağlıdır; kitap kaynaklı tam pakette varsayılan olarak kapsamlı not üret. Kaynaksız araştırmada notları istenmişse yaz.
- Not içeriği markdown'dır (#, ##, -, **kalın**, tablo). Başka bir notun başlığını [[Başlık]] ile bağlayabilirsin; sözlük terimleri notta kendiliğinden işaretlenir.
- Kart, soru ve terimlerde görsel, HTML, LaTeX, markdown yok — düz metin. Satır sonu gerekiyorsa \n kullan.
- Türkçe yaz.
- Bilgi uydurma. Kitap akışında okuma belirsizliğini normal sınav genellemesinden ayır; somut sorunlu ifadeyi etiketli notta koru ve kesin kart/soruya dönüştürme. Kaynaksız araştırmada desteklenmeyen iddiayı çıkarıp nedenini bildir.

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
| `terimler[].terim` | ✔ | Sözlükte işaretlenecek kelime. v2'de paketin ders/ana konusunu devralır; aynı yerde aynı terim varsa atlanır. v1'de eski genel eşleştirme korunur. |
| `terimler[].tanim` | ✔ | Balonda çıkan tanım. |
| `terimler[].esanlam` | – | Aynı tanıma götüren başka yazımlar (çekimli hâller vb.). |
| `notlar[].baslik` / `.icerik` | ✔ (bölüm isteğe bağlı) | Konu anlatımı notu; `icerik` markdown. **v2: aynı ders ve ana konuda aynı başlıklı not varsa atlanır.** v1: aynı derste başlık eşleşmesi korunur. Notlar paketin `anaKonu` değerini devralır; ek alan gerekmez. |

## Uygulamanın uyguladığı kurallar

- **Kimlikler yeniden üretilir** — iki farklı paket çakışmaz.
- **Ders adı eşleşirse o derse bağlanır**, yoksa yeni ders açılır.
- **Aynı destede aynı ön yüz varsa kart atlanır** — kartlar kopyalanmaz; testler aşağıdaki gibi numaralanır.
- **Aynı adlı test numaralanır.** Aynı başlıklı not v2'de aynı ders ve ana konuda, v1'de aynı derste atlanır (not değişmez).
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
Bu dosya uygulamaya alınmaz. Araştırma sözleşmesi `.claude/skills/paket-hazirla/brief.md`,
kitap sözleşmesi `.claude/skills/kitap-paket-hazirla/references/kapsam-ve-kanit.md` içindedir.
Kitap akışında kanıt, bilginin okunan kaynağa dayanmasını gösterir; güncel kılavuz
doğrulaması iddiası değildir. Ayrı `kapsam.json` sayfa/bilgi/not bağlantılarını tutar.
Birleştirici kaynaklı v2 üretiminde denetim dosyasını da yazar; veri doğrulama hatasında final paket yazmaz.

```bash
node araclar/paket-birlestir.mjs --dogrula paketler/tus-romatoloji.json --yalniz-bicim
```

Bu komut var olan paketi **değiştirmeden yalnızca biçim ve içe aktarma** yönünden denetler.
Yeni araştırılmış paketlerin tesliminde `--yalniz-bicim` kullanılmaz; normal `--dogrula`
kanıt dosyasının final içerikle eşleşmesini de denetler. Kaynak bağlantılarının geçmesi,
tıbbi iddiaların bağımsız doğrulaması değildir.

## Notların konu düzeni (4.5)

Notlar da **ders → ana konu → not** sırasıyla açılır. v2 paketindeki notlar ek bir alan
olmadan paketin ana konusuna bağlanır. v1 notları ve önceden içe alınmış bağlantısız
notlar **Konusu belirlenmemiş** altında kalır; **Toplu konu ata** ile düzenlenir. Eski
notları sınıflamak için paketi yeniden yüklemeyin: yeni konu altında kopyası oluşabilir.
Notun içeriği, kimliği, görselleri ve ekleri taşıma sırasında korunur.

## Sözlüğün konu düzeni (4.5)

Sözlük **ders → ana konu → terim** sırasıyla açılır. Notlar gibi terimler de v2 paketin
`ders` ve `anaKonu` alanlarını devralır; terim başına yeni bir alan gerekmez. Aynı kelime
farklı ders/ana konularda farklı tanımlarla saklanabilir. v1 paketlerinin genel terim
adı eşleştirmesi değişmez. Mevcut bağlantısız terimler **Konusu belirlenmemiş** altında
kalır; **Toplu konu ata** ile metin, eş anlamlılar, görsel ve detay notu korunarak taşınır.

Tanım balonu önce okunan içeriğin ana konusundaki kaydı, yoksa aynı dersteki bağlantısız
kaydı, sonra aynı dersteki kayıtları tercih eder. Bu kapsamda kayıt yoksa genel sözlüğe
bakar. Birden fazla aday varsa ders/konu bilgisiyle seçim gösterir. Terimden oluşturulan
kartın destesi de terimin ders ve ana konusunu devralır.
