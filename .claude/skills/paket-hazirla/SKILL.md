---
name: paket-hazirla
description: "StudyOS için sınav, ders ve konuya özel kaynaklı kart/test/terim paketi üretir ve doğrular. 'Paket hazırla', 'quiz/kart destesi hazırla' veya sınav+ders+konu ile içerik istendiğinde kullan. Fable/Opus ve Astra Pro araştırma profillerini destekler. Skill değerlendirmesi veya uygulama kodu değişikliği, içerik üretimini başlatmaz."
---

# Konuya özel çalışma paketi

Çıktı: `paketler/<sinav>-<ders>-<konu>.json` ve eşlik eden `.denetim.json`.
Uygulamada **Ayarlar → Veri → Paket ekle** ile JSON alınır; Quiz ve Kartlar'da
**ders → ana konu → test/deste** altında görünür. Biçim sözleşmesi `PAKET.md`.

## Girdi ve profil

Zorunlu girdiler sınav, ders, ana konu; bağlamda açıkça verilmişse tekrar sorma.
Alt konu belirtilmişse kapsamı daralt, ana konuyu kaybetme (Dahiliye → Romatoloji → ilaçlar).
Notları yalnızca istendiğinde üret. TUS/YKS/DUS için beş şık; diğerinde belirtilmediyse beş.
İçerik sayısını kapsam ve öğrenme hedefleri belirler; sayıyı doldurmak için tekrar üretme.

Kullanıcının açık profil tercihini uygula. Yoksa gerçekten erişilen ortama göre seç:
- Fable/Claude Code + Opus alt ajanları: [profiles/fable.md](profiles/fable.md).
- Astra Pro veya ChatGPT Derin Araştırma: [profiles/astra-pro.md](profiles/astra-pro.md).
- Ortam belirsizse mevcut modelle tek araştırmacı olarak ilerle, kullandığın yolu belirt.

Yalnızca seçilen profili oku. Alt ajan araçlarının, ücretli kaynak erişiminin, terminalin
veya yerleşik Derin Araştırma'nın varlığını model adından varsayma. Profil seçimi model
ve abonelik ayarlarını değiştirmez; olmayan araçları kullanmış gibi davranma.

## Ortak akış

1. **Kapsam:** `brief.md` ve `PAKET.md` oku. Ana konuyu ve alt konu adlarını sabitle;
   `konular.json` yalnızca alt konu dizisidir. Her öğrenme hedefinin sınavla ilişkisini,
   ölçülecek becerisini (hatırlama, ayırıcı tanı, uygulama) ve planlanan içeriğini belirle.
   Kullanıcının kapsamını tamamla; belirsiz sınav sıklıklarını gerçek istatistik gibi sunma.
2. **Araştırma:** seçilen profille kaynakları incele. Önce doğrulanmış iddiaları, bağlamı,
   istisnaları ve çelişkileri kaydet; sonra kart/soru üret. `brief.md` kaynak/kanıt sözleşmesini
   kullan. Her kart, soru, terim ve not için kaynak bağlantısı gerekir.
3. **Üretim:** bölünebilir işte alt konulara göre parça dosyaları yaz. Testler birkaç alt
   konuyu birleştirebilir. Bütün test ve desteler `konu: <ana konu>` taşır; sorunun `konu`
   alanı ana konu veya sabitlenmiş alt konu olabilir. Tek parçada da aynı sözleşme geçerli.
4. **İçerik incelemesi:** bütün kartları, soruları, terimleri ve varsa notları incele.
   Tek doğru şık, yeterli vaka bilgisi, makul çeldiriciler, açıklama–anahtar tutarlılığı,
   kaynağın gerçekten iddiayı desteklemesi ve kapsam boşluklarını kontrol et.
   Gereksiz kopyaları kaldır; farklı bağlamda aynı hedefi ölçen anlamlı uygulamaları koru.
   Emin olunmayan bilgiye hedefli araştırma yap; çözülmezse çıkar ve nedenini kaydet.
   Düzeltmeleri **kaynak parçalara** uygula. Aynı modelin tekrar okumasını bağımsız inceleme
   olarak adlandırma. Soru kalitesi için `brief.md` ölçütlerini uygula.
5. **Paketleme:** terminal varsa depodaki araçla üret:

```bash
node araclar/paket-birlestir.mjs --ad "TUS Dahiliye — Romatoloji" --ders Dahiliye \
  --ana-konu Romatoloji --konular <calisma>/konular.json --sik 5 \
  --cikti paketler/tus-dahiliye-romatoloji.json <calisma>/part*.json
node araclar/paket-birlestir.mjs --dogrula paketler/tus-dahiliye-romatoloji.json
```

Araç `.denetim.json` dosyasını da üretir. Bozuk kayıtları sessizce silmez; ölümcül hatada
çıktıyı yazmaz. Birebir kopyaları raporlar, çelişen kopyaları reddeder. Son dosya üzerinde
inceleme gerekiyorsa **`--dogrula`** kullan; eski parçalardan yeniden üretip düzeltmeyi ezme.
Final JSON değiştiyse kanıt ilişkilerini gözden geçir ve kaynak parçalardan ikisini yeniden üret.

6. **Teslim:** kapsam/sayılar, kaynak erişim sınırları, bilerek atlananlar ve gerçekten
   yapılan doğrulamaları kısaca bildir. Üretimde `--yalniz-bicim` ile kaynak denetimini atlama.
   Kaynak bağlantı kontrolü tıbbi doğruluğun garantisi değildir. Terminal yoksa araştırma ve
   parça dosyalarını teslim et; paketin uygulama testinden geçtiğini söyleme.
   Depoya kayıt istenmiş/yetkilendirilmişse `paketler/README.md` satırını ve kaynak özetini
   güncelle, `node tests/unit.mjs` çalıştır, çalışma dalına commit/push yap. `main`'e
   birleştirme ayrı talebe bağlıdır. Yalnızca dosya isteyen kullanıcıya git adımlarını dayatma.

## Korunacak özellikler

Türkçe, jenerik ilaç adları, bağımsız okunabilen kartlarda anlaşılır kısaltmalar.
Kart/soru/terim düz metindir; markdown sadece notlarda. Not bağlantıları paketteki gerçek
başlıklara gider. Çıkmış soruları kopyalama; özgün vaka ve çeldirici üret. Tek kart tek hedef
sorsun; açıklama kısa olsun ancak gerekli ayrımı sırf cümle kotası için kaybetmesin.
