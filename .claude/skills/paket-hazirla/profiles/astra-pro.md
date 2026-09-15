# Astra Pro / Derin Araştırma profili

Kullanıcının GPT‑6 Astra Pro ile kaynaklı araştırmadan yararlanma tercihini uygular.
Fable orkestrasyonunu yüklemez; Opus/Claude Agent/codex exec çağrılarını zorunlu tutmaz.
Model adı, abonelik veya prompt, tek başına Derin Araştırma özelliğini etkinleştirmez.

## Ortama göre yürütme

- **Yerleşik Derin Araştırma erişilebiliyorsa:** çalışma kapsamını ve `../brief.md` kaynak
  kurallarını araştırma girdisine koy. Kaynak incelemesi, çelişkilerin çözümü ve öğretim
  içeriği sentezini önceliklendir. Ortamın araştırma adımlarını sabit alt ajan sayısı veya
  zorunlu paralel çağrı kalıbıyla kısıtlama. İçerik sentezini sırf ana model pahalı diye
  başka bir modele devretme.
- **Yalnızca web arama/okuma varsa:** aynı araştırma kalite ölçütleriyle çalış; kullanılan
  yöntemi web araştırması olarak adlandır. Yerleşik Derin Araştırma çalıştırdığını söyleme.
- **Araştırma ve paketleme ortamları ayrıysa:** taşınabilir aktarım hazırla: sınav/ders/ana konu,
  `konular.json`, öğrenme hedefleri ve kapsam, kaynak kayıtları, doğrulanmış iddialar,
  çözülemeyenler ve üretildiyse parça JSON'ları. Sonraki ortamın gizli sohbet geçmişine
  veya erişemediği repo yollarına bağımlı bırakma; gerekli sözleşme metnini de ekle.
  Depo ve terminal erişimi olan oturum kaynakları koruyarak paketleyip doğrular.

## Araştırma ve sentez

1. Öğrenme hedeflerini ve sorulacak araştırma sorularını belirle.
2. Kaynakları açıp incele; iddia → kaynak bölümü eşleştirmesi, istisnalar ve çelişkilerle
   bir kanıt tablosu hazırla. Araştırma raporunu baştan yalnızca final JSON'a sıkıştırma.
3. Doğrulanan içerikten kart/soru/terim ve istendiyse not üret. Kapsam hedeflerine dönerek
   boşlukları kontrol et. Geniş konuyu tutarlı parçalar halinde tamamla.
4. Bütün içeriği kanıtla karşılaştır, cevap anahtarı ve çeldiricileri denetle. Kendi son
   okumanı bağımsız hakem olarak sunma; erişilebilir bir bağımsız inceleme varsa gerçek
   kapsamını bildir. Alt ajan olmaması işin ön koşullarını bozmaz.
5. Terminal varsa ortak birleştirme/doğrulama aracı; yoksa aktarım dosyaları ve açık test durumu.

Kaynak adı erişim kanıtı değildir. UpToDate, ders kitapları veya kapalı veri tabanlarına
ulaşılamadıysa bunu kaydet; bibliyografik kaydı tam metin okuması gibi göstermeden erişilmiş
alternatifleri kullan. Modelin kendinden emin olması kanıtın yerine geçmez.
