# StudyOS 🎓

Ders çalışmayı daha akılda kalıcı hale getirmek için tasarlanmış, **tek bir HTML dosyasından** ibaret masaüstü arayüzü. Kurulum yok, sunucu yok, internet yok — `index.html` dosyasını tarayıcıda aç, yeter.

## Kullanım

**Bilgisayarda:** `index.html` dosyasına çift tıkla — tek başına, internetsiz çalışır.

**Tablet/telefonda (önerilen):** repoyu GitHub Pages'te yayınla, tarayıcıdan aç ve *"Ana ekrana ekle"* de. `manifest.json` + `sw.js` sayesinde adres çubuğu olmadan, tam ekran ve çevrimdışı çalışır — yani ayrı bir uygulama yazmaya gerek yok.

Veriler tarayıcının `localStorage` alanında saklanır; **Ayarlar → Veri** bölümünden JSON yedek alıp başka cihaza taşıyabilirsin. Her cihazın verisi kendine aittir.

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
| >_ | **Terminal** | `gorev`, `kart`, `calis`, `durum`, `yedek`… komutlarıyla hızlı giriş |
| 🌙 | **Odak modu** | Tam ekran sayaç, ekran karartma, üretilen pembe gürültü |

Ayrıca: **masaüstü widget'ları** (bugünkü hedef, tekrar kuyruğu, sınav geri sayımı, görevler), **Ctrl+K ile her şeyde arama**, notlara görsel/dosya gömme, kartlara görsel ekleme, notlardaki `Soru :: Cevap` satırlarını tek tuşla desteye çevirme.

## Kısayollar

- `Ctrl` + `K` — her şeyde ara (not, görev, kart, konu, test, sınav) ve hızlı görev/not oluştur
- `Alt` + `Q` — açık pencereler arasında geçiş
- `Ctrl` + `1..9` — dock'taki uygulamayı aç
- `Boşluk` — kart çevir · `1-4` — kartı değerlendir
- `Esc` — odak modundan çık / en üstteki pencereyi kapat

## Dosyalar

- `index.html` — uygulamanın tamamı (tek başına çalışır)
- `manifest.json`, `sw.js`, `icon.svg` — sadece PWA olarak kurmak için; `file://` ile açıldığında yok sayılır

## Teknik

Bağımlılık yok: vanilla JS + CSS, SVG grafikler, Web Audio ile üretilen ses. Açık/koyu tema, pencere sürükleme/boyutlandırma/büyütme, dock ve menü çubuğu elle yazıldı.
