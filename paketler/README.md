# Hazır paketler

Bu klasördeki JSON dosyaları **Ayarlar → Veri → 📦 Paket ekle** ile alınır. Paket mevcut verinin
üstüne eklenir, hiçbir şeyi silmez; aynı paketi ikinci kez almak kopya üretmez. Biçim `PAKET.md`'de.

| Dosya | Ders | İçerik |
|---|---|---|
| `tus-romatoloji.json` | Dahiliye | 15 deste / 509 kart · 5 test / 206 soru (5 şıklı, TUS biçimi) · 132 sözlük terimi |

Yeni paket üretmek için `paket-hazirla` skill'i (sınav + ders + konu söylemek yeter). Parçaları
birleştirip doğrulayan araç: `node araclar/paket-birlestir.mjs` (kullanım dosyanın başında).

## tus-romatoloji.json

TUS Dahiliye — Romatoloji. Konular: Romatoid artrit, SLE, antifosfolipid sendromu, Sjögren,
sistemik skleroz, inflamatuvar miyopatiler, spondiloartritler, kristal artropatiler, osteoartrit ve
yumuşak doku romatizması, septik artrit, vaskülitler, Behçet, FMF ve otoinflamatuvar hastalıklar,
antiromatizmal ilaçlar, otoantikorlar ve laboratuvar. Her soru `konu` taşır; İstatistik'teki
"zayıf konular" bu sayede çalışır.

Kaynaklar: güncel sınıflama kriterleri (2010 ACR/EULAR RA, 2019 EULAR/ACR SLE, 2006 Sydney ve
2023 ACR/EULAR APS, 2016 ACR/EULAR Sjögren, 2013 ACR/EULAR SSc, 2017 EULAR/ACR miyozit, ASAS,
CASPAR, 2016 fibromiyalji, Chapel Hill 2012, 2022 ACR/EULAR ANCA vaskülit, ISG 1990 ve ICBD Behçet,
Tel-Hashomer ve Eurofever/PRINTO FMF, Yamaguchi), tedavi kılavuzları (EULAR SLE 2023, ACR gut 2020,
EULAR ANCA vasküliti 2022, EULAR Behçet 2018, EULAR FMF 2016, FDA JAK uyarısı / ORAL Surveillance),
ADVOCATE ve PEXIVAS çalışmaları, Harrison ve UpToDate/StatPearls/Medscape derlemeleri.

Sorular çıkmış TUS sorularının kopyası değildir; TUS'un sevdiği kalıplarla (en sık, en özgül, ilk
tercih, antikor–hastalık ve HLA eşlemeleri, ilaç yan etkileri, kriter eşikleri) yeniden yazılmıştır.
Bilerek yazılmayanlar: 2022 ANCA ve 2023 APS kriterlerinin madde madde puan tabloları, Türkiye'ye özgü
geri ödeme/ruhsat koşulları, kılavuzlar arasında değişen eşikler (PEXIVAS sonrası plazmaferez sınırı,
APS arteryel trombozda INR 3-4 hedefi). Yapay zekâ ürünüdür; bir kartı yanlış bulursan düzelt,
aralıklı tekrar yanlışı da pekiştirir.
