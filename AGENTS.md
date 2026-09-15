# Browser / StudyOS

Proje bağlamı ve koruma kuralları için `CLAUDE.md`, paket sözleşmesi için `PAKET.md` oku.
Uygulama tek `index.html` ile çalışır; bu değişikliği build bağımlılığına dönüştürme.

İçerik üretiminde `.claude/skills/paket-hazirla/SKILL.md` ortak başlangıçtır. Fable ve Astra
profilleri ayrıdır; kullanıcı Astra Pro/Derin Araştırma istediğinde yalnızca Astra profilini
uygula. Fable orkestrasyonundaki model seçimi kuralları diğer profillere taşınmaz.
Skill ve bağlı belgelerin başka ortamda otomatik yüklendiğini varsayma; gerektiğinde içeriklerini
araştırma oturumuna ekle. Depoyu okumak model/abonelik/araştırma aracı erişimi sağlamaz.

Değişiklikleri çalışma dalına kaydet ve PR ile sun. Kullanıcı istemeden `main`e birleştirme.
Test komutları: `node tests/unit.mjs`, `node tests/paket-konular.mjs`,
`node tests/smoke.mjs`, `node tests/kutuphane-smoke.mjs`.
