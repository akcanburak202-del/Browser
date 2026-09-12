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

## Uygulamalar

| | Uygulama | Ne yapar |
|---|---|---|
| 📝 | **Notlar** | Markdown editör + canlı önizleme, ders bazlı, arama |
| ✅ | **Görevler** | Öncelik, teslim tarihi, "bugün" filtresi; görevden doğrudan pomodoro başlatma |
| 🗂 | **Kartlar** | SM-2 aralıklı tekrar algoritması, deste yönetimi, tekrar kuyruğu |
| ⏱ | **Pomodoro** | Sayaç + otomatik mola, oturumlar derse yazılır, günlük hedef çubuğu |
| ❓ | **Quiz** | Kendi soru bankan, test çözme, açıklamalar, **yanlışları tek tıkla karta çevirme** |
| 📅 | **Takvim** | Haftalık çalışma programı, saat bloklarını yerleştirme |
| 🧠 | **Konu Haritası** | Ders → konu → alt konu ağacı, "başlanmadı / öğreniyorum / biliyorum" durumları |
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

- `index.html` — uygulamanın tamamı (tek başına çalışır)
- `vendor/pdf.min.js`, `vendor/pdf.worker.min.js` — [pdf.js](https://mozilla.github.io/pdf.js/) (Mozilla, Apache-2.0). PDF'leri uygulama içinde göstermek için; yalnızca bir PDF açıldığında yüklenir. Tarayıcısında yerleşik PDF görüntüleyici olmayan cihazlar için gerekli

Görüntüleyicideki **📤 Cihazda aç**, dosyayı Android'in aç/paylaş sayfasına gönderir — dosya seçtiğin uygulamada açılır, indirme yapılmaz. Paylaşım desteklenmeyen tarayıcılarda yeni sekmede açmaya düşer.
- `manifest.json`, `sw.js`, `icon.svg` — sadece PWA olarak kurmak için; `file://` ile açıldığında yok sayılır

## Teknik

Bağımlılık yok: vanilla JS + CSS, SVG grafikler, Web Audio ile üretilen ses. Açık/koyu tema, pencere sürükleme/boyutlandırma/büyütme, dock ve menü çubuğu elle yazıldı.
