---
name: kitap-paket-hazirla
description: "Kullanıcının verdiği sınav kitabı fotoğraflarını, taranmış sayfaları, PDF veya kitap metnini StudyOS konu notu, quiz, kart ve terim paketine dönüştür. Kullanıcı 'kitaptan', 'kaynak kitap', 'bu sayfalardan', 'TUSDATA/TUS kitabımdan' dediğinde veya verdiği kitap sayfalarından paket istediğinde kullan. Kaynak kapsamını ve sınav anlatımını koru; rutin internet araştırması yapma. Kaynaksız konu araştırması için paket-hazirla kullan. Skill düzenleme/değerlendirme isteği içerik üretimini başlatmaz."
---

# Kitaptan sınav çalışma paketi

Kitabı yeni bir araştırmanın taslağı olarak değil, çalışılacak içeriğin ana kaynağı
olarak işle. Amaç: kaynakta bulunan anlamlı bilgileri kaybetmeden anlaşılır notlara
aktarmak; puan kazandıran ayrımları ve hatırlama hedeflerini iyi kart/sorularla çalıştırmak.
Kitabın kısa anlatımını ve sınav sezgilerini gereksiz açıklamalarla ağırlaştırma.
Öncelik sırası: kapsam kaybını önlemek → bilimsel doğruluk → kaliteli kart/quiz
seçimi → gereksiz tekrarları azaltmak. Bu sıra, bilinen yanlışı doğru diye öğretmek
anlamına gelmez; sorunlu ifade de etiketiyle notta korunur.

Bu bağımsız bir kaynak dönüştürme akışıdır. Araştırma skill'inin `brief.md` dosyasını,
Fable/Astra araştırma profillerini ve belirsiz bilgiyi çıkarmaya yönelik iş akışını
miras alma. Model adı çalışma yolunu değiştirmez. Ortak olanlar yalnız StudyOS v2
biçimi ve depodaki paket birleştirme aracıdır. Kullanıcının özel talimatını öncele.

## Kapsam ve ağ kullanımı

- Sınav, ders, ana konu ve istenen ürünleri mevcut bağlamdan çıkar; açık olanı tekrar sorma.
  Kullanıcı sadece kaynak gönderiyor ve son talimatını beklemeni istiyorsa üretime başlama.
- Kitap kaynaklı tam paket isteğinde varsayılan ürün **ayrıntılı notlar + seçilmiş kartlar
  ve quizler + yararlı terimler** olsun. Kullanıcı açıkça yalnız kart/quiz veya sınırlı
  kapsam isterse buna uy; seçimin dışında kalanları tam aktarılmış sayma.
- **Rutin internet doğrulaması yapma.** Kitaptaki eşikleri, tedavi sıralamalarını,
  genellemeleri, "en sık/en özgül/ilk tercih" ifadelerini tek tek güncel kılavuzlarla
  karşılaştırmaya çalışma. İnternete erişimi kitap paketini bitirmenin koşulu yapma.
- Kullanıcı ayrıca güncellik kontrolü veya ek araştırma isterse bunu ayrı, sınırlı
  bir görev olarak yürüt. Kaynak aktarımını durdurma, dış bilgiyi kitap metnine karıştırma.
  Bağlayıcı üst talimatın gerektirdiği kontrol varsa yalnız ilgili iddiayı ele al ve
  sonucu ayrı göster. Repo dosyalarını okumayı tıbbi web araştırmasıyla karıştırma.
- Kapsamı verilen sayfalar belirlesin. Bölümün devamı verilmediyse görünmeyen devamı
  hafızadan veya internetten doldurma. Mevcut bilgiden desteklenen çıkarımı açıkça ayır.

## 1. Kaynağı teslim al ve gerçekten oku

1. Dosya envanteri çıkar: dosya adı, PDF sayfa indeksi/basılı sayfa, sıralama,
   tekrarlar ve erişim durumu. Numarayı çıkarımla belirlediysen bunu işaretle.
   Sohbetteki yükleme hatasını başarı sayma; gerçekten erişebildiğin sayfaları bildir.
2. Gerektiğinde döndür, büyüt veya kırp. OCR'ı yardımcı olarak kullan; özellikle
   tablo hücreleri, oklar, dipnot işaretleri, ≥/>, ≤/<, ±, ondalıklar, birimler,
   dozlar, yüzdeler ve olumsuzlukları görüntüyle karşılaştır.
3. Okuma belirsizliğiyle bilimsel belirsizliği ayır. Puslu bir rakamı klinik olarak
   makul bulduğun rakamla değiştirme. Önce görseli tekrar incele; çözülemezse konumuyla
   okunamadığını kaydet ve yalnız o bilgiyi kesin kart/soruya dönüştürme.
4. Her sayfanın anlamlı bilgi birimlerini kaynak sırasıyla çıkar. Bu aşamada sınav
   önemi seçimi yaparak ayrıntı eleme. Kaynak sırası ve başlık ilişkilerini koru;
   okunmuş görsel ile çıkarılan bilgi listesini ikinci geçişte karşılaştır.

## 2. Bilgi envanterini konu notlarına aktar

Üretim öncesinde [kapsam-ve-kanit.md](references/kapsam-ve-kanit.md) dosyasını oku.
Sayfa → bilgi birimi → not bölümü bağlantısını `kapsam.json` içinde sürdür.

- Tanım, mekanizma, neden–sonuç, sınıflama, tüm liste üyeleri, ilaç ve etken adları,
  karşılaştırmalar, ayırıcı özellikler, eşikler, istisnalar, doz/birim/süre, parantezler,
  dipnotlar, kısaltmalar, eşanlamlar, mnemonikler ve resim açıklamalarını kapsa.
- Her tablo satırının tüm anlamlı hücrelerini ve başlıkla ilişkisini koru. Satırı
  tek anahtar kelimeye indirgeme; boş hücreyi tahminle doldurma. Alt tabloyu, dipnotu
  veya sayfa sonunda devam eden cümleyi atlama.
- Şema/algoritmanın dallarını, ok yönlerini ve koşullarını metne aktar. Görseldeki
  eğitimsel ayrıntı metinle karşılanmıyorsa bunu açıkça kaydet; görseli yalnız arşive
  koymak notlara aktarım yerine geçmez. Etiketsiz bir grafiye tanı uydurma.
- Notları konu bütünlüğüne göre düzenle; bir sayfa bir not olmak zorunda değildir.
  Tek cümle/kelime sayısı veya not sayısı kotası koyma. Ayrıntıyı koruyan sadeleştirme
  yap; her sayfayı kısacık bir özete dönüştürme.
- Aynı bilgi birkaç yerde geçiyorsa tek yerde tam verip diğer kaynak konumlarını
  ona bağla. Farklı bağlam, istisna veya ayrım taşıyan bilgileri benzer diye silme.
- Kitabın yazımını satır satır kopyalamak zorunda değilsin; anlamı, sayıları,
  kapsamı ve niteleyicileri koru. Kitabın tamamını kelimesi kelimesine çoğaltma.

## 3. Sınav dili ve sorunlu ifadeleri ayır

**Normal sınav anlatımı:** Kısa genelleme, klasik eşleşme, "ilk/en sık" kuralı ve
mnemonik, sırf gerçek hayatta istisnası olabilir diye hatalı veya kartlaştırılamaz
sayılmaz. Kaynakta verilen sınav bağlamında kullan. Genel bir kaynağa sadakat notunu
paketin girişinde bir kez ver; her satıra "güncel kılavuzla doğrulanmalı" ekleme.

**Bağlama bağlı ayrım:** Kaynak iki farklı grup, evre, tarih veya koşul için farklı
yanıt veriyorsa ikisini de koru. Kart/soruda doğru cevabı belirleyen koşulu açık yaz.
Gerektiğinde "kitabın sınıflamasına göre" de; her basit soruya mekanik olarak ekleme.

**Somut sorun:** Okunamayan ifade, kaynak içi gerçek çelişki, bariz birim/aritmetik
hatası veya yanlış olduğu bilinen bir öneri varsa yalnız ilgili bilgiyi işaretle.
Orijinal kaynak ifadesini notta açık etiketiyle koru; hatayı sessizce düzeltme veya
tüm konuyu eleme. Düzeltme güvenle belirlenemiyorsa tahmin etme. Doğru olduğu
bilinmeyen doz/değeri doğru cevap diye ezberletme. Sorun dışındaki bilgilerden üretime
devam et; kartlaştırılmayan bilgi notta duruyorsa bunu kapsam kaybı sayma.

Kitabı güncel hasta yönetim protokolü olarak sunma. Kullanıcının gerçek bir hasta için
klinik karar istemesi, bu kaynak dönüştürme görevinin dışında ayrı bir değerlendirmedir.

## 4. Kaynaktan iyi kart ve soru seç

- **Kart:** tek hatırlama hedefi; kendi başına anlaşılır ön yüz; kısa fakat yeterli
  yanıt. Ayırt ettirici bulgu, kritik eşik/istisna, mekanizma, karıştırılan çift ve
  yararlı mnemonikleri önceliklendir. Uzun ve ilişkisiz bir listeyi tek karta yığma;
  doğal bir küme tek hedef olabilir. Tam listeyi notta koru, gerektiğinde böl.
- Kaynak yalnız "ne" bilgisini veriyorsa kaynaksız bir "neden" sorusu üretme.
  Soru cümlesini tekrarlayan cevap, ipucunu ön yüzde veren kart ve yalnız kelime
  değiştirerek çoğaltılmış hedeflerden kaçın. Kart cevabını 1–3 cümleye sığdırmak
  istisnayı kaybettiriyorsa cümle kotasına değil yeterliliğe öncelik ver.
- **Quiz:** TUS/YKS/DUS için beş seçenek; yeterli ama gereksiz ayrıntısız kök;
  kitabın bağlamında tek savunulabilir cevap. Salt metin kopyalamak yerine uygun
  yerlerde ayırıcı tanı, karşılaştırma veya kısa uygulama sorusu oluştur. Her soruyu
  zorla klinik vakaya dönüştürme; kitaptaki test/tedavi kuralını bağlamından koparma.
- Çeldiricileri aynı kategoride, makul ve ayrımı öğreten seçeneklerden kur.
  Mümkün olduğunda kaynağın yakın kavramlarını kullan. Cevabı doğru göstermek için
  kaynak dışı istisna veya keyfi eşik uydurma. Vakanın örnek yaş/ölçüm değerleri
  üretilebilir; çözümü kaynakta olmayan bir tıbbi varsayıma dayandırma.
- Açıklama doğru cevabın nedenini ve önemli alternatiflerin neden uymadığını anlatsın.
  "Kitap böyle söylüyor" tek başına açıklama olmasın. Cevap yerlerini çeşitlendir;
  tam eşitlik için kaliteli soruyu değiştirme. Hepsi/hiçbiri seçeneği kullanma.
- Sabit sayıya ulaşmak için üretme; sayıları kaynak kapsamı ve öğrenme hedefleri
  belirlesin. Notların kapsamlı olması her ayrıntıdan kart ve quiz yapılmasını gerektirmez.
  Not–kart–quiz arasında farklı öğrenme işlevi olan tekrarları koru.
- Kitaptaki hazır/çıkmış soruları aynen kopyalamak yerine öğrenme hedefinden özgün
  soru kur; kaynakta olmayan sınav sıklığı veya çıkmış soru istatistiği iddia etme.

## 5. Kaynak üzerinden son kontrol ve paketleme

1. **Kapsam:** Her görseli bilgi envanteriyle, ardından envanteri notlarla karşılaştır.
   Özellikle tablo, küçük yazı, eşik, istisna ve son satırlara dön. Eksikleri tamamla.
   Başlıkların listelenmesini, sayfa sayısını veya kart sayısını tamlık kanıtı sayma.
2. **Öğretim kalitesi:** Kartların tek hedefini; sorunun tek cevabını, çeldiricilerini,
   açıklamasını ve kaynak desteğini kontrol et. Bu kontrol, tüm içeriği internetten
   tekrar doğrulama görevi değildir. Aynı değişmemiş içeriği gerekçesiz tekrar tekrar
   denetleme; düzeltme sonrası etkilenen kayıtları ve zorunlu teknik kontrolleri çalıştır.
3. **Biçim:** Repo kökündeki `PAKET.md` dosyasının v2 alan sözleşmesini uygula.
   Kanıt/parça yapısı için bu skill'in `references/kapsam-ve-kanit.md` dosyasını kullan.
   Ders → ana konu → alt konu düzenini koru. Kart/soru/terim düz metin, notlar desteklenen
   Markdown olsun. Kaynak adı biliniyorsa deste/test/not başlığını `TUSDATA | ...`
   gibi adlandır; bunu uygulamada ayrı bir etiket alanı varmış gibi anlatma.
4. **Teknik:** Önce aşağıdaki kapsam kontrolünü, sonra mevcut birleştiriciyi çalıştır.
   Kapsam kontrolü başarısızsa eksikliği düzelt; okunamayan kaynak nedeniyle tamamlanamıyorsa
   okunabilen kısmı teslim et ve eksik konumu bildir. Başarısız kontrole rağmen "tam" deme.

```bash
python3 .claude/skills/kitap-paket-hazirla/scripts/kapsam_dogrula.py calisma/kapsam.json calisma/part*.json
node araclar/paket-birlestir.mjs --ad "<sınav — kaynak — konu>" --ders "<ders>" \
  --ana-konu "<ana konu>" --konular calisma/konular.json --sik 5 \
  --cikti paketler/paket.json calisma/part*.json
node araclar/paket-birlestir.mjs --dogrula paketler/paket.json
```

5. **Görünüm:** Yeni/karmaşık biçim kullanıldıysa temsilî uzun notu ve geniş tabloyu
   uygulamanın önizlemesinde kontrol et. Biçim+aktarımı geçmek görsel kontrol değildir.
   Yeni kitap geldi diye değişmeyen uygulamanın tüm regresyon testlerini çalıştırma.
   Araç yoksa yapılmayan kontrolleri belirt, yapılmış gibi gösterme.
6. **Teslim:** Uygulamaya alınacak `.json`, eşleşen `.denetim.json` ve kapsam kaydını
   ver. Okunan sayfa/kayıt sayıları ile varsa okunamayan veya açıkça kapsam dışı kalan
   bilgileri kısa bildir. "Hiçbir ayrıntı kaçamaz" garantisi verme; yapılan kontrolü
   somut anlat. Repo kaydı açıkça istenmediyse üretilen kitap paketini commit/push/PR
   yapma; dosya olarak sun. Skill geliştirme isteğini yeni bir kitap paketi isteği sayma.

## Büyük kaynaklarda devamlılık

Sayfaları tutarlı gruplara ayır; her grubun kaynak çıkarımını, parçasını ve kapsam kaydını
tamamlandıkça kaydet. Sonraki gruba geçerken sınırda devam eden cümle/tabloyu kontrol et.
Bağlam kısalınca tamamlanan kayıtlardan devam et; hatırlayamadığın ayrıntıyı yeniden
özetleyerek silme. Alt ajan varsa aynı kaynak/kanıt sözleşmesini ver; işi birleştirmek
tek başına inceleme değildir. Kullanıcı veya ortam izin vermedikçe ajan zorunlu tutma.
