# Ortak araştırma ve içerik sözleşmesi

Fable/Opus araştırmacıları ve Astra Pro aynı kalite ölçütlerini kullanır. Girdiler: sınav,
ders, ana konu, sabit alt konu listesi, öğrenme hedefleri, test adları, şık sayısı, not tercihi.

## Araştırma

Konuya uygun güncel kılavuzlar, temel bilgi için güvenilir ders kaynakları ve ilgili birincil
araştırmalar kullan. Kaynak türünü soruya göre seç: temel mekanizma için kılavuz zorunlu değildir.
Gerçekten açılan içeriği temel al; URL, arama özeti veya kaynak adını okumayla karıştırma.
Tam metin/özet/kullanıcı dosyası erişimini ayır; özetten desteklenmeyen ayrıntı üretme.

Çelişkide nüfus, tarih, ülke, tanı–sınıflama farkı ve klinik bağlamı karşılaştır. Güncel klinik
öneri ile geçmiş bir sınav cevabı farklıysa farkı açıkça belirt; bağlamı belirsiz bir soruda
tek doğru dayatma. Eşik, doz, ilk tercih, en sık/en özgül ve mutlak ifadeleri özellikle doğrula.
Sınav sıklığını gerçek soru analizi olmadan ölçülmüş veri gibi sunma. Çıkmış soruları kopyalama.
Hedefli araştırmaya rağmen belirsiz kalanları gerekçesiyle `atlananlar` içine yaz.

## İçerik kalitesi

- Kart: tek öğrenme hedefi, kendi başına anlaşılır soru; kısa ama yeterli cevap.
- Soru: çözüm için yeterli klinik bilgi, tek savunulabilir doğru şık; aynı kategoriden makul
  çeldiriciler. Sadece kelime değiştirerek soru çoğaltma. Doğru şık kadar önemli çeldiricilerin
  neden yanlış olduğunu açıkla; açıklamayı 1–3 cümleye sığdırmak ayrımı kaybettiriyorsa uzat.
- Zorluk, belirsiz ifadelerden değil bilgi uygulama ve ayrım gereksiniminden gelsin.
- Doğru şık konumlarını dağıt; dağılım için şıkları değiştirirken `dogru` ve açıklamayı birlikte
  koru. "Hepsi/hiçbiri" seçeneklerinden kaçın. Anlamlı vaka çeşitliliğini kopya diye silme.
- Türkçe, jenerik ilaç adları. Bağımsız kartta bilinmeyen kısaltmaya güvenme.
- Kart/soru/terim düz metin. Not varsa markdown, yalnızca paketteki not başlıklarına `[[...]]`.
- Öğrenme hedeflerinin kapsandığını izle; sabit sayıya ulaşmak için içerik uydurma.

## Parça JSON'u

`desteler`, `testler`, `terimler` dizileri; `notlar` yalnızca istenirse.
Her test/deste `konu` alanında ana konuyu taşır. Sorunun `konu` alanı ana veya alt konudur.
`dogru` sıfırdan başlayan **tam sayıdır**. Biçimin tamamı repo kökündeki `PAKET.md`.
Araştırma sırasında kanıt kayıtlarını da aynı parçada taşı:

```json
{
  "desteler": [{"ad":"Romatoloji — Temel kavramlar","konu":"Romatoloji",
    "kartlar":[{"on":"Özgün soru metni","arka":"Doğrulanmış cevap"}]}],
  "testler": [],
  "terimler": [],
  "kaynaklar": [{
    "id":"rom-a-1", "ad":"Erişilmiş belgenin gerçek başlığı",
    "url":"https://example.org/belge", "yil":"2026",
    "erisimTarihi":"2026-09-15", "erisim":"tam-metin", "konum":"Bölüm 2 / sayfa 8"
  }],
  "kanitlar": [{
    "tur":"kart", "metin":"Özgün soru metni", "hedef":"H01",
    "iddia":"Cevabı destekleyen, bağlamı ve istisnaları belirtilmiş bilgi",
    "durum":"dogrulandi", "kaynaklar":[{"id":"rom-a-1","bolum":"Bölüm 2 / sayfa 8"}]
  }],
  "atlananlar": [{"hedef":"H02","neden":"Erişilen kaynaklarla doğrulanamadı"}]
}
```

Bu şema örneğidir; örnek kaynak gerçek kanıt değildir. Gerçek kayıtlara dönüştürmeden teslim etme.
`erisim`: `tam-metin`, `ozet`, `kullanici-dosyasi`. Dosyada URL zorunlu değil; `konum`
dosya adı/sürümü ve sayfayı belirtir. `yil` bilinemiyorsa `belirtilmemis` yaz; tarih uydurma.
Her içerik için en az bir kanıt kaydı: `tur` kart/soru/terim/not; `metin` sırasıyla kart ön
yüzü/soru metni/terim/not başlığı ile **birebir** eşleşir. Her önemli iddiayı destekle;
birden çok kanıt kaydı veya kaynak kullanılabilir. Kaynak kimlikleri parça önekiyle benzersizdir.
`durum: dogrulandi` yalnızca belirtilen kaynak gerçekten incelendiyse kullanılır.

Birleştirici final dosyadaki konumu ve öğe/paket özetini denetim dosyasına yazar; bu dosya
uygulamaya alınmaz, içeriğin hangi kanıta dayandığını ve sonradan değişip değişmediğini izler.
Kanıt bağlantılarının mekanik olarak geçmesi kaynağın iddiayı desteklediğini tek başına kanıtlamaz.
Parça sonunda kapsamı, sayıları ve atlananları bildir. Terminal varsa yazdıktan sonra JSON'u parse et.
