# Kitap kapsamı ve paket kanıtı

Bu dosya kitap akışının bağımsız sözleşmesidir. İnternet araştırma sözleşmesini yükleme.
Kapsam kaydı uygulamaya alınmaz; uygulama JSON'unun v2 şeması değişmez.

## Kaynak envanteri → bilgi birimi → çıktı

`beklenenSayfalar` listesini üretimden önce erişilmesi beklenen tüm kaynak sayfalarından
oluştur. Her fotoğraf/PDF sayfasına benzersiz kimlik ver; aynı basılı sayfanın farklı
fotoğrafları ayrı kimlik taşıyabilir. Erişilemeyeni listeden çıkarma. Kullanıcı seçimini
`secimTalimatı` alanına aynen veya anlamını koruyarak yaz; kendi elemeni kullanıcıya atfetme.

Her bilgi birimi anlamlı bir kayıt olsun: bir tablo satırının tüm hücreleri, bir tanımın
koşulları, bir listenin tüm üyeleri veya bir şemanın açıklanmış dalı. Her kelimeye ayrı
kimlik verme; bir bölüme yalnız "KOAH işlendi" yazıp yüzlerce ayrıntıyı görünmez bırakma.

Örnek (yer tutucuları gerçek bilgiyle değiştir):

```json
{
  "surum": 1,
  "notlarIstendi": true,
  "secimTalimatı": "",
  "beklenenSayfalar": ["s001"],
  "sayfalar": [{
    "id": "s001",
    "dosya": "01.jpg",
    "sayfa": "basılı 232",
    "durum": "okundu",
    "birimler": [{
      "id": "s001-b01",
      "konum": "Tablo 1, satır 2 ve dipnot a",
      "bilgi": "Kaynakta gerçekten okunan bilgi; sayı, koşul, istisna ve dipnotuyla.",
      "durum": "aktarildi",
      "hedefler": [{"tur": "not", "metin": "KAYNAK | Konu", "bolum": "Tablo 1, ikinci satır"}]
    }]
  }]
}
```

- Sayfa durumları: `okundu`, `kismi`, `erisilemedi`, `tekrar`, `icerik-yok`.
  `kismi`/`erisilemedi` için `gerekce` yaz. `tekrar` için `tekrari` alanıyla aynı
  içeriği temsil eden **okunmuş** sayfaya bağla. `icerik-yok` yalnız boş sayfa/kapak
  gibi öğrenme bilgisi taşımayan sayfa içindir; gerekçesini yaz.
- Birim durumları: `aktarildi`, `okunamadi`, `kapsam-disi`.
  `okunamadi` için görülebilen kısmı ve çözülemeyen konumu, `gerekce` ile kaydet.
  `kapsam-disi` yalnız kullanıcının açık kapsam/ürün seçimine dayanabilir; gerekçe
  ve `secimTalimatı` zorunludur. Zor veya düşük öncelikli ayrıntıyı bu yolla eleme.
- `aktarildi` her zaman mevcut çıktıya giden en az bir hedef taşısın. Notlar istenmişse
  her aktarılan birimin en az bir **not** hedefi olsun. Kart/quiz ek hedef olabilir.
  Kaynak tekrarı aynı not bölümüne bağlanabilir; farklı niteleyiciler korunmalıdır.
- Hedef `tur` değerleri: `not`, `kart`, `soru`, `terim`. `metin`, sırasıyla not başlığı,
  kart ön yüzü, soru kökü veya terimle birebir eşleşsin. `bolum` çıktıda bulunacak yeri
  tarif etsin. Denetleyici metnin gerçekten o bilgiyi içerdiğini anlayamaz; bunu görsel
  ve not karşılaştırmasında sen kontrol et.
- `notlarIstendi:false` yalnız açık ürün seçimiyle kullanılabilir; `secimTalimatı` yaz.
  Yalnız quiz isteyen kullanıcının kaynağını eksiksiz not paketine dönüştürdüğünü iddia etme.
- Kaynakta okunup tartışmalı olarak notta korunan bilgi **aktarildi** sayılır; bilimsel
  onay iddiası taşımaz. Kart yapılmamasını `okunamadi` veya `kapsam-disi` olarak etiketleme.

`kapsam_dogrula.py` sayfa/kimlik bütünlüğünü, hedeflerin mevcut olmasını, not eşlemesini
ve açık eksikleri kontrol eder. Başarısı, envantere hiç girilmemiş bir ayrıntının
atlanmadığını ispatlamaz. Bu nedenle görsellerden yapılan ikinci kapsam geçişi zorunludur.
Okunamayan kayıtlar başarısız sonuç verir; mevcut okunabilir çıktının teslimini yasaklamaz.

## Kaynak parçası ve denetim dosyası

Her parçada `desteler`, `testler`, `terimler`, `notlar`, `kaynaklar`, `kanitlar`,
`atlananlar` dizilerini kullan. İstenmeyen/üretilmeyen bölümler boş dizi olabilir.
Uygulama alanları `PAKET.md` ile aynıdır. Kaynak/kanıt alanlarını şöyle kur:

```json
{
  "kaynaklar": [{
    "id": "kitap-s001",
    "ad": "Kullanıcının verdiği kitap adı veya kitap sayfası",
    "yil": "belirtilmemis",
    "erisimTarihi": "YYYY-AA-GG",
    "erisim": "kullanici-dosyasi",
    "konum": "01.jpg; basılı s.232"
  }],
  "kanitlar": [{
    "tur": "not",
    "metin": "KAYNAK | Konu",
    "hedef": "s001-b01",
    "iddia": "Kaynağa sadık aktarılan somut bilgi ve varsa kapsam/istisna.",
    "durum": "dogrulandi",
    "kaynaklar": [{"id": "kitap-s001", "bolum": "Tablo 1 satır 2 ve dipnot a"}]
  }],
  "atlananlar": []
}
```

- `dogrulandi`, birleştiriciyle uyumlu teknik değerdir: kaynağın gerçekten incelendiği
  ve çıktının belirtilen kaynak bölümüne dayandığı anlamına gelir. **Güncel kılavuzla
  doğrulandı** anlamına gelmez. Bunu teslimde gerekirse tek cümleyle açıkla.
- Her not, kart, soru ve terim için birebir eşleşen kanıt yaz; geniş bir notta ana iddia
  gruplarına ayrı kanıtlar ekle. "Sayfadaki her şey doğrulandı" gibi boş iddia kullanma.
- Kaynakta olmayan özgün vaka ayrıntılarını kitabın alıntısı gibi gösterme; kanıtta
  öğrenme hedefini ve cevabı belirleyen kitap bilgisini belirt.
- `atlananlar` içine kesin karta çevrilmeyen somut sorunları gerekçeleriyle yaz;
  bilginin hangi notta korunduğunu belirt. Bu kayıt kapsam kaydının yerine geçmez.
- İnternet kaynağı/baskı yılı/sayfa numarası uydurma. Kullanıcı ayrıca dış doğrulama
  istediyse yalnız gerçekten erişilen kaynağı ekle; kitap ve ek kaynak kayıtlarını ayır.
- Notların girişinde/kaynak sonunda kitap adı ve ilgili sayfaları belirt. Paket
  girişinde bir kez şu anlamı ver: "Bu paket verilen kitabın sınava yönelik anlatımına
  dayanır; ayrıca belirtilmedikçe güncel klinik kılavuz incelemesi yapılmamıştır."
- Birleştirici `.denetim.json` içindeki öğe/paket özetlerini kendisi üretir.
  Final dosyayı tek başına yamama; düzeltmeyi kaynak parça + eşleşen kanıta uygula,
  final paket ve denetimi yeniden üret. `--yalniz-bicim` ile kaynak denetimini atlama.
