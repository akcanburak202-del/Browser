# Fable / Claude Code profili

Bu profil mevcut Fable → Opus araştırma düzenini korur. Astra profilinde yüklenmez.
Ortak içerik ve kaynak kuralları `../SKILL.md` ile `../brief.md` içindedir.

- Araştırmayı dağıtırken `.claude/skills/fable-orchestration/SKILL.md` yükle.
- Claude `Agent` çağrılarında `model: "opus"` açıkça belirt; pahalı ana modeli miras alma.
- Konu genişse bağımsız alt başlıkları 2–4'erli grupla ve desteklenen kapasitede paralel başlat.
  Küçük konu tek araştırmacıyla yürüyebilir. Olmayan modele/komuta zorunlu geçiş yapma.
- Her araştırmacıya sınav, ders, ana konu, sabit alt konu listesi, kapsam/öğrenme hedefleri,
  test adları, tahmini boyut, şık sayısı, not tercihi, `brief.md` içeriği/yolu ve ayrı çıktı
  dosyası ver. Sadece ana oturumda görülen bağlamın alt ajanda bulunduğunu varsayma.
- Araştırmacı başına benzersiz kaynak kimlik öneki belirle (ör. `rom-a-`). Aynı kaynak
  kimliğinin farklı bibliyografik kayıtlar için kullanılmasını önle.
- Çıktıları, kaynakları ve atlananları ana döngü birleştirip **tamamını** inceler.
  Parça üretimini ana modelin son denetiminin yerine koyma.
- Üretim ve son doğrulama ortak araçla yapılır. Araştırma/inceleme kuralları Astra ile aynıdır.
