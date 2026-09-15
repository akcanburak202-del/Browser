# StudyOS 🎓

Ders çalışmayı daha akılda kalıcı hale getirmek için tasarlanmış, **tek bir HTML dosyasından** ibaret masaüstü arayüzü. Kurulum yok, sunucu yok, internet yok — `index.html` dosyasını tarayıcıda aç, yeter.

## Kullanım

**Bilgisayarda:** `index.html` dosyasına çift tıkla — tek başına, internetsiz çalışır.

**Tablet/telefonda (önerilen):** repoyu GitHub Pages'te yayınla, tarayıcıdan aç ve *"Ana ekrana ekle"* de. `manifest.json` + `sw.js` sayesinde adres çubuğu olmadan, tam ekran ve çevrimdışı çalışır — yani ayrı bir uygulama yazmaya gerek yok.

### Veri nerede durur

| Ne | Nerede | Sınır |
|---|---|---|
| Metin (not, kart, görev, kayıtlar) | `localStorage` | 5 MB — ölçüldü; ~25.000 karta veya ~1.700 uzun nota denk gelir |
| Görsel ve dosyalar | `IndexedDB` | Boş diskin ~%60'ı, yani GB'larca |

Kaydetme, yazmayı bıraktıktan 250 ms sonra ve tarayıcı boştayken yapılır; bu yüzden veri büyüdükçe yazarken takılma olmaz. Uzun listeler 150 satırda kırpılır (gerisi arama ile bulunur), böylece DOM şişip arayüzü yavaşlatmaz.

**Ayarlar → Veri**'den alınan JSON yedek görselleri de içerir — tek dosyayla başka cihaza taşınır. Her cihazın verisi kendine aittir.

Aynı yerdeki **📦 Paket ekle**, dışarıda hazırlanmış kart destesi / test / terim setini **mevcut verinin üstüne** ekler (hiçbir şeyi silmez). **📋 Paket talimatı** düğmesi, başka bir yapay zekâya verilecek hazır metni panoya kopyalar — biçimin tamamı [`PAKET.md`](PAKET.md)'de.

## Uygulamalar

| | Uygulama | Ne yapar |
|---|---|---|
| 📝 | **Notlar** | Markdown editör + canlı önizleme, ders bazlı, arama |
| ✅ | **Görevler** | Öncelik, teslim tarihi, "bugün" filtresi; görevden doğrudan pomodoro başlatma |
| 🗂 | **Kartlar** | Ders → konu → deste; SM-2 aralıklı tekrar, toplu konu atama, bugünkü tekrarlar |
| ⏱ | **Pomodoro** | Sayaç + otomatik mola, oturumlar derse yazılır, günlük hedef çubuğu |
| ❓ | **Quiz** | Ders → konu → test; kendi soru bankan, kaldığın yerden devam, açıklamalar, **yanlışları tek tıkla karta çevirme** |
| 📅 | **Takvim** | Haftalık çalışma programı, saat bloklarını yerleştirme; sınav geri sayımı — bir sınav birden çok dersi kapsayabilir (TUS, YKS…) |
| 🧠 | **Konu Haritası** | Ders → konu → alt konu ağacı, "başlanmadı / öğreniyorum / biliyorum" durumları; **Tüm dersler** görünümü, ders ekleme/silme |
| 📊 | **İstatistik** | 14 günlük bar grafik, 12 haftalık ısı haritası, ders dağılımı, seri (streak) |
| 🗒 | **Günlük** | Günün özeti + ruh hali kaydı |
| 📖 | **Sözlük** | Terim tanımları; terimler tüm metinlerde otomatik işaretlenir, üstüne gelince görselli tanım balonu açılır |
| 🕸 | **Bağlantı Haritası** | Notlar arası bağlantıların ağ görünümü |
| >_ | **Terminal** | `gorev`, `kart`, `calis`, `durum`, `yedek`… komutlarıyla hızlı giriş |
| 🌙 | **Odak modu** | Tam ekran sayaç, ekran karartma, üretilen pembe gürültü |

### İç bağlantılar

Not içinde `[[Başlık]]` yazınca otomatik tamamlama açılır ve bağlantı oluşur:

| Yazım | Nereye gider |
|---|---|
| `[[Türev kuralları]]` | Nota |
| `[[#Limit]]` | Konu haritasındaki konuya |
| `[[?Hücre testi]]` | Teste (doğrudan çözmeye başlar) |
| `[[!Mitokondri nedir]]` | Karta |
| `[[@Final sınavı]]` | Takvimdeki sınava |

Olmayan bir başlığa bağlantı verirsen gri görünür; tıklayınca notu oluşturur. Her notun altında **"buraya bağlananlar"** listesi vardır. Metne yapıştırılan bağlantılar (Drive, YouTube, PDF) otomatik rozetlenir.

Ayrıca: **masaüstü widget'ları** (bugünkü hedef, tekrar kuyruğu, sınav geri sayımı, görevler), **Ctrl+K ile her şeyde arama**, notlara görsel/dosya gömme, kartlara görsel ekleme, notlardaki `Soru :: Cevap` satırlarını tek tuşla desteye çevirme.

## Kısayollar

- `Ctrl` + `K` — her şeyde ara (not, görev, kart, konu, test, sınav) ve hızlı görev/not oluştur
- `Alt` + `Q` — açık pencereler arasında geçiş
- `Ctrl` + `1..9` — dock'taki uygulamayı aç
- `Boşluk` — kart çevir · `1-4` — kartı değerlendir
- `Esc` — odak modundan çık / en üstteki pencereyi kapat

## Dosyalar

- `CLAUDE.md` — proje durumu, mimari ve devam notları (yeni bir sohbete başlarken önce bunu oku)
- `PAKET.md` — dışarıda hazırlanan kart/test paketlerinin biçimi ve başka bir yapay zekâya verilecek talimat
- `tests/unit.mjs` — `node tests/unit.mjs` ile çalışan mantık testi (dört zaman diliminde)
- `tests/smoke.mjs` — `node tests/smoke.mjs` ile çalışan duman testi

- `index.html` — uygulamanın tamamı (tek başına çalışır)
- `vendor/pdf.min.js`, `vendor/pdf.worker.min.js` — [pdf.js](https://mozilla.github.io/pdf.js/) (Mozilla, Apache-2.0). PDF'leri uygulama içinde göstermek için; yalnızca bir PDF açıldığında yüklenir. Tarayıcısında yerleşik PDF görüntüleyici olmayan cihazlar için gerekli

🔗 ile bağlanan dosya, bir oturumda ilk açılışta diskten okunur ve bellekte tutulur; böylece her dokunuşta izin sorulmaz. Dosyayı dışarıda güncellediysen görüntüleyicideki **↻ Tazele** ile yeniden okutursun.

Görüntüleyicideki **📤 Cihazda aç**, dosyayı Android'in aç/paylaş sayfasına gönderir — dosya seçtiğin uygulamada açılır, indirme yapılmaz. Paylaşım desteklenmeyen tarayıcılarda yeni sekmede açmaya düşer.
- `manifest.json`, `sw.js`, `icon.svg` — sadece PWA olarak kurmak için; `file://` ile açıldığında yok sayılır

## Teknik

Bağımlılık yok: vanilla JS + CSS, SVG grafikler, Web Audio ile üretilen ses. Açık/koyu tema, pencere sürükleme/boyutlandırma/büyütme, dock ve menü çubuğu elle yazıldı.

## Sürüm 4.4: konu düzeni ve araştırma profilleri

Quiz ve Kartlar derslerle açılır. Bir dersten ana konuya, oradan test/desteye geçilir.
Bağlantısı olmayan eski içerikler **Konusu belirlenmemiş** altında bulunur; **Toplu konu ata**
ile düzenlenir. Aynı ders içinde sınıflama değişikliği soru alt konularını, kart tekrar
tarihlerini ve çözüm geçmişini korur. Yeni test/deste açık ders ve konuyu otomatik alır.

`paket-hazirla` ortak kalite kuralları ve ayrı **Fable/Opus** / **Astra Pro** profilleri
içerir. Kullanım örneği: “Astra Pro profiliyle TUS Dahiliye Romatoloji paketi hazırla.”
Araştırma özelliği ve repo/terminal erişimi ortamda bulunmalıdır; skill bunları kendisi açmaz.
Yeni v2 paketler öğe düzeyinde kaynak denetim dosyasıyla üretilir. Ayrıntılar `PAKET.md` ve
`.claude/skills/paket-hazirla/SKILL.md` içindedir.

Doğrulama: `node tests/unit.mjs`, `node tests/paket-konular.mjs`,
`node tests/smoke.mjs`, `node tests/kutuphane-smoke.mjs`. Tarayıcı testleri Playwright gerektirir;
özel Chromium kurulumu için `STUDYOS_CHROMIUM=/tam/yol/chromium` kullanılabilir.
