# ToptanNext — MEMORY_BANK.md
## Proje Hafızası ve Canlı Durum Dosyası

> **AJAN: BU DOSYAYI HER OTURUMUN BAŞINDA OKU.**
> Bu dosya sana "neredeyiz, ne yaptık, ne kaldı" sorusunu yanıtlar.
> Her oturumun SONUNDA bu dosyayı güncelle. Güncelleme yapmadan oturumu kapatma.

---

## 🗓️ SON GÜNCELLEME

```
Tarih     : 2026-04-09
Oturum    : Sprint 1 — Altyapi ve Monorepo Kurulumu
Güncelleyen: Ajan
```

---

## 📍 PROJE GENEL DURUMU

```
Sprint    : [ ] Sprint 1 - Altyapı  [ ] Sprint 2 - Auth  [ ] Sprint 3 - Ürün Kataloğu
           [ ] Sprint 4 - Tedarikçi [ ] Sprint 5 - Alıcı [ ] Sprint 6 - Mesajlaşma
           [ ] Sprint 7 - Admin     [ ] Sprint 8 - Polish

Aktif Sprint : Sprint 1
Son Tamamlanan Görev : Sprint 1 / 06 Next.js boilerplate (layout, fonts, TanStack Query provider)
Sıradaki Görev : Sprint 1 / 04 Prisma schema v1 (User, Supplier, Product modelleme)
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
[ ] 07. Kayıt ol (backend + frontend + test)
[ ] 08. Giriş yap (backend + frontend + test)
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
apps/api/src/main.ts             — NestJS bootstrap ve API port konfigurasyonu
apps/api/src/app.module.ts       — Temel application module
apps/api/src/app.controller.ts   — Baslangic GET endpoint
apps/api/src/app.service.ts      — Baslangic servis sinifi
apps/api/prisma/schema.prisma    — Prisma datasource + generator baslangici
apps/api/.env.example            — API ortam degiskenleri sablonu
```

### Frontend — apps/web/src/

```
apps/web/src/app/layout.tsx       — Root layout + QueryProvider entegrasyonu
apps/web/src/app/providers.tsx    — TanStack Query client provider
apps/web/src/app/page.tsx         — Altyapi hazir placeholder sayfasi
apps/web/.env.example             — Web ortam degiskenleri sablonu
```

### Frontend — apps/admin/src/

```
apps/admin/src/app/layout.tsx     — Admin root layout + QueryProvider entegrasyonu
apps/admin/src/app/providers.tsx  — Admin TanStack Query client provider
apps/admin/src/app/page.tsx       — Admin altyapi hazir placeholder sayfasi
apps/admin/.env.example           — Admin ortam degiskenleri sablonu
```

### Ortak Paketler — packages/

```
packages/types/package.json       — @toptannext/types workspace paketi
packages/types/src/index.ts       — Tip giris noktasi
packages/ui/package.json          — @toptannext/ui workspace paketi
packages/ui/src/index.ts          — UI paket giris noktasi
packages/config/package.json      — @toptannext/config workspace paketi
packages/config/src/index.ts      — Config paket giris noktasi
packages/utils/package.json       — @toptannext/utils workspace paketi
packages/utils/src/index.ts       — Utils paket giris noktasi
```

### Veritabanı

```
Prisma Schema Versiyonu : v0.1 (datasource + generator)
Son Migration           : —
Modeller                : Henüz eklenmedi (bir sonraki adim: User, Supplier, Product)
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
@prisma/client@5.22.x
prisma@5.22.x
```

### apps/web
```
next@14.x
@tanstack/react-query@5.x
react@18.x
tailwindcss@3.x
```

---

## 🔄 SON OTURUM ÖZETİ

```
Oturum Tarihi  : 2026-04-09
Yapılan İşler  :
  - Kök monorepo dosyalari olusturuldu (package.json, pnpm-workspace.yaml, turbo.json)
  - apps/web, apps/admin, apps/api ve packages/* klasor/paket iskeleti kuruldu
  - apps/api icin NestJS 10+ scaffold olusturuldu
  - apps/web ve apps/admin icin Next.js 14 App Router + Tailwind scaffold olusturuldu
  - Prisma baslangic semasi eklendi (datasource + generator)
  - docker-compose.yml ile Postgres/Redis/Meilisearch altyapisi tanimlandi
  - API portu 3001'e sabitlendi, web/admin portlari 3000/3002 olarak pinlendi
  - Type-check, lint, build ve Prisma validate dogrulamalari calistirildi

Oluşturulan Dosyalar:
  - package.json
  - pnpm-workspace.yaml
  - turbo.json
  - docker-compose.yml
  - .nvmrc
  - apps/api/prisma/schema.prisma
  - apps/api/.env.example
  - apps/web/.env.example
  - apps/admin/.env.example
  - apps/web/src/app/providers.tsx
  - apps/admin/src/app/providers.tsx
  - packages/types/*
  - packages/ui/*
  - packages/config/*
  - packages/utils/*

Değiştirilen Dosyalar:
  - .gitignore
  - MEMORY_BANK.md
  - apps/api/package.json
  - apps/api/src/main.ts
  - apps/web/package.json
  - apps/web/src/app/layout.tsx
  - apps/web/src/app/page.tsx
  - apps/admin/package.json
  - apps/admin/src/app/layout.tsx
  - apps/admin/src/app/page.tsx

Çalışan Testler:
  - pnpm type-check
  - pnpm lint
  - pnpm build
  - pnpm --filter api exec prisma validate
  - pnpm dev smoke testi (web:3000, api:3001, admin:3002)

Bekleyen / Yarım Kalan:
  - Sprint 1 / 04 Prisma schema v1 modelleme (User, Supplier, Product)
  - Docker runtime dogrulamasi (bu ortamda Docker CLI yok)

Bir Sonraki Oturuma Not:
  - Ilk HTML tasarimi geldiginde RULES_CORE HTML -> Kod Donusum Protokolu ile vertical slice baslat.
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
