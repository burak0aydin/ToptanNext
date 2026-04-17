# ToptanNext — MEMORY_BANK.md
## Proje Hafızası ve Canlı Durum Dosyası

> **AJAN: BU DOSYAYI HER OTURUMUN BAŞINDA OKU.**
> Bu dosya sana "neredeyiz, ne yaptık, ne kaldı" sorusunu yanıtlar.
> Her oturumun SONUNDA bu dosyayı güncelle. Güncelleme yapmadan oturumu kapatma.

---

## 🗓️ SON GÜNCELLEME

```
Tarih     : 2026-04-17
Oturum    : Sprint 7 — Admin Dashboard Stitch Birebir Entegrasyonu
Güncelleyen: Ajan
```

---

## 📍 PROJE GENEL DURUMU

```
Sprint    : [ ] Sprint 1 - Altyapı  [ ] Sprint 2 - Auth  [ ] Sprint 3 - Ürün Kataloğu
           [ ] Sprint 4 - Tedarikçi [ ] Sprint 5 - Alıcı [ ] Sprint 6 - Mesajlaşma
           [ ] Sprint 7 - Admin     [ ] Sprint 8 - Polish

Aktif Sprint : Sprint 7
Son Tamamlanan Görev : Sprint 7 / 34 Admin dashboard (frontend - Stitch birebir)
Sıradaki Görev : Sprint 7 / 35 Kullanici yonetimi ekranlari (frontend)
```

---

## ✅ TAMAMLANAN GÖREVLER (Sprint Bazlı)

### Sprint 1 — Temel Altyapı
```
[x] 01. Monorepo kurulumu (Turborepo, pnpm workspaces)
[x] 02. Docker infrastructure (Postgres, Redis, Meilisearch)
[x] 03. NestJS boilerplate (GlobalExceptionFilter, ValidationPipe, Swagger)
[ ] 04. Prisma schema v1 (User, Supplier, Product temel modeller)
[x] 05. packages/types boilerplate
[x] 06. Next.js boilerplate (layout, fonts, TanStack Query provider)
```

### Sprint 2 — Auth
```
[x] 07. Kayıt ol (backend + frontend + test)
[x] 08. Giriş yap (backend + frontend + test)
[ ] 09. Email doğrulama (backend + frontend + test)
[ ] 10. JWT refresh token (backend + test)
[ ] 11. Şifre sıfırlama (backend + frontend + test)
[ ] 12. middleware.ts — role-based redirect
```

### Sprint 3 — Ürün Kataloğu (Public)
```
[ ] 13. Kategori CRUD (backend)
[ ] 14. Ürün listeleme sayfası — SSR (frontend)
[ ] 15. Ürün detay sayfası — ISR (frontend)
[ ] 16. Ürün arama + filtre (Meilisearch entegrasyon)
[ ] 17. Kategori sayfası — ISR (frontend)
```

---

## 🗂️ DOSYA HARİTASI

> Her yeni dosya oluşturulduğunda buraya ekle.
> Format: `yol/dosya.ts` — ne işe yarar (hangi görevi karşılar)

### Backend — apps/api/src/

```
apps/api/src/main.ts                                      — Global prefix (/api/v1), CORS ve ValidationPipe kurulumu
apps/api/src/app.module.ts                                — ConfigModule + PrismaModule + UsersModule + AuthModule baglantisi
apps/api/src/prisma/prisma.module.ts                      — Global Prisma provider
apps/api/src/prisma/prisma.service.ts                     — Prisma client lifecycle yonetimi
apps/api/src/modules/users/users.module.ts                — Users domain module
apps/api/src/modules/users/users.repository.ts            — User sorgulari (Prisma select guvenli alanlar)
apps/api/src/modules/users/users.service.ts               — Users domain service
apps/api/src/modules/users/entities/user.entity.ts        — passwordHash icermeyen guvenli user entity
apps/api/src/modules/auth/auth.module.ts                  — JWT + Passport + Auth wiring
apps/api/src/modules/auth/auth.controller.ts              — POST /api/v1/auth/register ve POST /api/v1/auth/login
apps/api/src/modules/auth/auth.service.ts                 — bcrypt hash/compare + JWT token uretimi
apps/api/src/modules/auth/dto/login.dto.ts                — Login request validasyonu
apps/api/src/modules/auth/dto/register.dto.ts             — Register request validasyonu
apps/api/src/modules/auth/strategies/jwt.strategy.ts      — Bearer JWT strategy
apps/api/src/modules/auth/auth.controller.spec.ts         — Auth controller unit testleri
apps/api/src/modules/auth/auth.service.spec.ts            — Auth service unit testleri
apps/api/src/modules/users/users.service.spec.ts          — Users service unit testleri
apps/api/src/modules/users/users.repository.spec.ts       — Users repository unit testleri
apps/api/prisma/schema.prisma                             — Role + User modeli (fullName dahil)
apps/api/prisma/migrations/*                              — add_user_model migration dosyalari
apps/api/.env.example                                     — API ortam degiskenleri sablonu
```

### Frontend — apps/web/src/

```
apps/web/src/app/layout.tsx                               — Root layout (TR locale) + QueryProvider
apps/web/src/app/page.tsx                                 — Login/Register giris landing sayfasi
apps/web/src/app/(auth)/layout.tsx                        — Auth segment layout + footer
apps/web/src/app/(auth)/login/page.tsx                    — Stitch tabanli login sayfasi
apps/web/src/app/(auth)/register/page.tsx                 — Stitch tabanli register sayfasi
apps/web/src/features/auth/components/AuthScreen.tsx      — Ortak auth ekran kabugu (split panel)
apps/web/src/features/auth/components/LoginForm.tsx       — React Hook Form + Zod login formu
apps/web/src/features/auth/components/RegisterForm.tsx    — React Hook Form + Zod register formu
apps/web/src/features/auth/components/SocialAuthButtons.tsx — Sosyal buton gorunumu
apps/web/src/features/auth/hooks/useAuthMutations.ts      — TanStack Query login/register mutationlari
apps/web/src/features/auth/api/auth.api.ts                — Auth API istemcisi
apps/web/src/lib/api.ts                                   — Generic POST JSON helper (error parse dahil)
apps/web/src/app/admin/page.tsx                           — Admin dashboard route'u (Stitch tasarimina birebir yakin)
apps/web/src/app/providers.tsx                            — TanStack Query client provider
apps/web/src/app/globals.css                              — Frontend global stil token temeli
apps/web/tailwind.config.ts                               — Brand/accent tokenlari + packages/ui content scan
apps/web/next.config.mjs                                  — transpilePackages ayari (@toptannext/ui, @toptannext/types)
apps/web/.env.example                                     — Web ortam degiskenleri sablonu
```

### Frontend — apps/admin/src/

```
apps/admin/src/app/layout.tsx     — Admin root layout + QueryProvider entegrasyonu
apps/admin/src/app/providers.tsx  — Admin TanStack Query client provider
apps/admin/src/app/page.tsx       — Admin dashboard (Stitch referansli birebir arayuz)
apps/admin/src/app/globals.css    — Material Symbols + admin global stil tokenlari
apps/admin/tailwind.config.ts     — Stitch renk tokenlarina uyarlanmis admin tema ayari
apps/admin/.env.example           — Admin ortam degiskenleri sablonu
```

### Kök Dizin

```
PROJE_HAKKINDA_BILGILER.md        — Proje klasor/dosya amaclari ve mimari sinirlar dokumani
```

### Ortak Paketler — packages/

```
packages/types/package.json                             — @toptannext/types + zod bagimliligi
packages/types/src/index.ts                             — Types export girisi
packages/types/src/schemas/auth.ts                      — login/register Zod semalari + TS infer tipleri
packages/types/src/schemas/index.ts                     — Schema export girisi
packages/ui/package.json                                — @toptannext/ui + react bagimliliklari
packages/ui/src/index.ts                                — UI export girisi
packages/ui/src/components/Button.tsx                   — Ortak button bileseni
packages/ui/src/components/Input.tsx                    — Ortak input bileseni
packages/ui/src/components/Checkbox.tsx                 — Ortak checkbox bileseni
packages/ui/src/components/index.ts                     — UI component exportlari
packages/config/package.json      — @toptannext/config workspace paketi
packages/config/src/index.ts      — Config paket giris noktasi
packages/utils/package.json       — @toptannext/utils workspace paketi
packages/utils/src/index.ts       — Utils paket giris noktasi
```

### Veritabanı

```
Prisma Schema Versiyonu : v0.3 (Role + User + fullName)
Son Migration           : add_user_model
Modeller                : User eklendi (Supplier ve Product bir sonraki sprint kalemi)
```

---

## 🧠 KRİTİK KARARLAR VE GEREKÇELERİ

> Mimari kararlar, pattern seçimleri, "neden böyle yaptık" notları

```
2026-04-09 | Monorepo omurgasi pnpm workspaces + Turborepo ile kuruldu.
           Gerekce: apps/* ve packages/* arasinda standart, olceklenebilir orkestrasyon.

2026-04-09 | Uygulama portlari sabitlendi: web=3000, api=3001, admin=3002.
           Gerekce: Next otomatik port kaymasi API ile cakisma olusturuyordu.

2026-04-09 | Next.js layout seviyesinde TanStack Query provider eklendi.
           Gerekce: sonraki vertical slice'larda hook entegrasyonunun hazir olmasi.

2026-04-10 | Auth akisi icin UsersRepository + UsersService + AuthService katman ayrimi uygulandi.
           Gerekce: Prisma erisimi sadece repository'de kalarak RULES_BACKEND katman prensibi korundu.

2026-04-10 | Login/Register formlarinda ortak dogrulama sozlesmesi @toptannext/types Zod semalari ile saglandi.
           Gerekce: frontend ve backend auth payload formatlarinin tek kaynaktan yonetilmesi.

2026-04-10 | UI tekrarini azaltmak icin Button/Input/Checkbox bilesenleri packages/ui icine tasindi.
           Gerekce: auth disindaki sonraki ekranlarda da ortak component tekrar kullanimi.

2026-04-17 | Admin dashboard ekrani Stitch HTML referansina birebir yakin olacak sekilde apps/admin ve apps/web admin route'una tasindi.
           Gerekce: frontend hizli entegrasyon asamasinda tasarim sapmasini sifira yakin tutmak.

2026-04-17 | TR karakter guvencesi icin layout font subset'leri latin-ext'e cekildi ve html lang tr standardize edildi.
           Gerekce: i/ı, g/ğ, s/ş gibi karakterlerde render bozulmasini onlemek.
```

---

## ⚠️ BİLİNEN SORUNLAR / BORÇLAR

```
AÇIK | Docker CLI bu makinede bulunmuyor (docker: command not found).
  docker-compose runtime dogrulamasi bir sonraki ortamda teyit edilecek.
```

---

## 📦 KURULU BAĞIMLILIKLAR

> package.json'a eklenen önemli paketler (versiyon ile)

### apps/api
```
@nestjs/common@10.x
@nestjs/core@10.x
@nestjs/platform-express@10.x
@nestjs/config@4.x
@nestjs/jwt@11.x
@nestjs/passport@11.x
@prisma/client@5.22.x
bcrypt@6.x
passport@0.7.x
passport-jwt@4.x
class-validator@0.15.x
class-transformer@0.5.x
prisma@5.22.x
```

### apps/web
```
next@14.x
@tanstack/react-query@5.x
react-hook-form@7.x
@hookform/resolvers@5.x
@toptannext/types@workspace
@toptannext/ui@workspace
react@18.x
tailwindcss@3.x
```

### packages/types
```
zod@4.x
```

---

## 🔄 SON OTURUM ÖZETİ

```
Oturum Tarihi  : 2026-04-17
Yapılan İşler  :
  - Proje yapisi analiz edilerek klasor/dosya sorumluluklari cikarildi
  - Kök dizinde PROJE_HAKKINDA_BILGILER.md dokumani olusturuldu
  - stitch_exports'taki admin-overview HTML referansi admin arayuze tasindi
  - apps/web/src/app/admin/page.tsx sayfasi birebir yakin dashboard ile guncellendi
  - apps/admin/src/app/page.tsx placeholder kaldirilip birebir yakin dashboard ile degistirildi
  - Admin tailwind tema tokenlari Stitch renk setiyle uyumlu hale getirildi
  - TR karakter goruntuleme guvencesi icin web/admin layout Inter latin-ext + lang=tr ayari yapildi
  - Proje gelistirme ortami pnpm dev:fresh ile calistirilip web/api/admin ayaga kalkisi dogrulandi

Oluşturulan Dosyalar:
  - PROJE_HAKKINDA_BILGILER.md

Değiştirilen Dosyalar:
  - apps/web/src/app/admin/page.tsx
  - apps/admin/src/app/page.tsx
  - apps/admin/src/app/layout.tsx
  - apps/admin/src/app/globals.css
  - apps/admin/tailwind.config.ts
  - apps/web/src/app/layout.tsx
  - MEMORY_BANK.md

Çalışan Testler:
  - pnpm dev:fresh (web/api/admin startup dogrulandi)

Bekleyen / Yarım Kalan:
  - Admin dashboard verileri su an statik; API baglantisi sonraki adim
  - Web admin route'unda no-img-element lint uyarisi var (tasarim birebirligi korunarak birakildi)

Bir Sonraki Oturuma Not:
  - Admin menu modulleri (Kullanici, Basvuru, Urun) icin ayri sayfa/component parcalama yap.
  - Admin dashboard kart ve tablolarini API endpointlerine bagla.
```

---

## 🔁 AJAN GÜNCELLEME PROTOKOLÜ

> Her oturum sonu ajanın yapması gerekenler:

```
1. SON OTURUM ÖZETİ bölümünü doldur (tarih, yapılanlar, dosyalar)
2. DOSYA HARİTASI bölümüne yeni/değişen dosyaları ekle
3. TAMAMLANAN GÖREVLER'de tamamlananları [x] ile işaretle
4. KRİTİK KARARLAR'a mimari karar varsa ekle
5. BİLİNEN SORUNLAR'a yeni sorun/borç varsa ekle
6. KURULU BAĞIMLILIKLAR'a yeni paket varsa ekle
7. SON GÜNCELLEME tarihini güncelle
```

---

*Bu dosya RULES_CORE.md tarafından her oturumda okunması için referans edilir.*
*Projenin "kısa süreli hafızasıdır" — küçük tut, öz tut, güncel tut.*
