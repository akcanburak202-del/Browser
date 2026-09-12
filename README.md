# StudyOS 🎓

Ders çalışmayı daha akılda kalıcı hale getirmek için tasarlanmış, **tek bir HTML dosyasından** ibaret masaüstü arayüzü. Kurulum yok, sunucu yok, internet yok — `index.html` dosyasını tarayıcıda aç, yeter.

## Kullanım

`index.html` dosyasına çift tıkla. Veriler tarayıcının `localStorage` alanında saklanır; **Ayarlar → Veri** bölümünden JSON yedek alıp başka cihaza taşıyabilirsin.

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

## Kısayollar

- `Ctrl` + `1..9` — dock'taki uygulamayı aç
- `Boşluk` — kart çevir · `1-4` — kartı değerlendir
- `Esc` — odak modundan çık / en üstteki pencereyi kapat

## Teknik

Bağımlılık yok: vanilla JS + CSS, SVG grafikler, Web Audio ile üretilen ses. Açık/koyu tema, pencere sürükleme/boyutlandırma/büyütme, dock ve menü çubuğu elle yazıldı.
