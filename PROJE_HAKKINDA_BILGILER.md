# ToptanNext - Proje Hakkında Bilgiler

Bu dokuman proje hafiza dosyasi olarak hazirlandi.
Amac: proje klasorlerini, dosyalari, mimari katmanlari ve calisma akisini tek yerde toplamak.

## 1) Proje Ozeti

ToptanNext, Turkiye odakli B2B toptan pazaryeri platformudur.
Monorepo yapisinda calisir ve 3 ana uygulamadan olusur:

- `apps/web`: Kullanici ve satici odakli ana frontend (Next.js 14)
- `apps/admin`: Ayri admin frontend uygulamasi (Next.js 14)
- `apps/api`: Backend API (NestJS 10 + Prisma)

Ortak kodlar `packages/` altinda toplanir.

## 2) Mimari Katmanlar (Neresi Ne?)

### Frontend Katmani

- `apps/web`: Son kullanici, kimlik dogrulama, profil ve satici basvuru akislari
- `apps/admin`: Admin panel frontend uygulamasi

### Backend Katmani

- `apps/api/src`: Controller, Service, Repository katmanlari ile REST API
- Auth, user profili, kategori, sektor, urun ve satici basvuru modulleri burada

### Veritabani Katmani

- `apps/api/prisma/schema.prisma`: Tum veri modeli tanimlari
- `apps/api/prisma/migrations/*`: Prisma migration gecmisi
- `apps/api/prisma/seed.ts`: Gelistirme seed verileri

### Ortak Paketler

- `packages/types`: Zod semalari ve ortak tipler
- `packages/ui`: Tekrar kullanilan React UI bilesenleri
- `packages/utils`: Ortak utility girisi
- `packages/config`: Ortak config paketi girisi

### Altyapi / DevOps Katmani

- `docker-compose.yml`: Postgres, Redis, Meilisearch altyapi servisleri
- `turbo.json`: Turborepo pipeline
- `pnpm-workspace.yaml`: Workspace kapsami

## 3) Kok Dizin Dosyalari

- `README.md`: Kisa proje tanimi ve temel komutlar
- `MEMORY_BANK.md`: Oturumlar arasi proje durum hafizasi
- `RULES_CORE.md`: Tum gorevler icin ana kurallar
- `RULES_FRONTEND.md`: Frontend gelistirme kurallari
- `RULES_BACKEND.md`: Backend gelistirme kurallari
- `RULES_DATABASE.md`: Prisma/veritabani kurallari
- `RULES_DEVOPS.md`: Ortam, Docker, CI/CD ve git kurallari
- `package.json`: Monorepo scriptleri (`dev`, `dev:fresh`, `build`, `test`, `lint`, `type-check`)
- `pnpm-lock.yaml`: Bagimlilik kilit dosyasi
- `pnpm-workspace.yaml`: `apps/*` ve `packages/*` workspace tanimi
- `turbo.json`: Turborepo gorev bagimliliklari
- `docker-compose.yml`: Altyapi servisleri

## 4) apps/ Klasoru

### 4.1 apps/admin (Next.js - Admin Frontend)

- `apps/admin/package.json`: 3002 portunda admin dev/build/start scriptleri
- `apps/admin/next.config.mjs`: Next config
- `apps/admin/tailwind.config.ts`: Tailwind kaynak tarama ayari
- `apps/admin/src/app/layout.tsx`: Root layout + QueryProvider
- `apps/admin/src/app/providers.tsx`: TanStack Query provider
- `apps/admin/src/app/globals.css`: Admin global stilleri
- `apps/admin/src/app/page.tsx`: Admin anasayfa girisi
- `apps/admin/public/`: Statik varliklar

### 4.2 apps/web (Next.js - Ana Frontend)

#### Uygulama cekirdegi

- `apps/web/package.json`: 3000 portunda web scriptleri; `dev` oncesi `.next` temizligi var
- `apps/web/src/app/layout.tsx`: Root layout (`lang="tr"`) + QueryProvider
- `apps/web/src/app/providers.tsx`: TanStack Query provider
- `apps/web/src/app/globals.css`: Global tema ve Material Symbols importu
- `apps/web/src/app/page.tsx`: Ana sayfa (header, slider, sektorler, urun kesfet)

#### Auth route'lari

- `apps/web/src/app/(auth)/layout.tsx`: Auth segment layout
- `apps/web/src/app/(auth)/login/page.tsx`: Giris ekrani
- `apps/web/src/app/(auth)/register/page.tsx`: Kayit ekrani
- `apps/web/src/app/(auth)/forgot-password/page.tsx`: Sifre sifirlama ekrani

#### Admin route (web icinde)

- `apps/web/src/app/admin/page.tsx`: Web uygulamasi icindeki admin panel route'u

#### Profil route

- `apps/web/src/app/kullanici-bilgilerim/page.tsx`: Kullanici profil goruntuleme/guncelleme ekrani

#### Satici basvuru adimlari

- `apps/web/src/app/satici-ol/page.tsx`: Adim 1 - Sirket bilgileri
- `apps/web/src/app/satici-ol/iletisim-ve-finans/page.tsx`: Adim 2 - Iletisim ve finans
- `apps/web/src/app/satici-ol/belge-yukleme-ve-onay/page.tsx`: Adim 3 - Belge yukleme ve onay

#### Ortak app bilesenleri

- `apps/web/src/app/components/MainHeader.tsx`: Ust gezinme
- `apps/web/src/app/components/MainFooter.tsx`: Alt bilgi
- `apps/web/src/app/components/HomeHeroSlider.tsx`: Ana slider
- `apps/web/src/app/components/FeaturedSectorsCarousel.tsx`: Sektor karuseli
- `apps/web/src/app/components/CategoryMegaMenu.tsx`: Kategori menusu
- `apps/web/src/app/components/AccountNavLink.tsx`: Hesap link bileseni

#### Feature katmani

- `apps/web/src/features/auth/api/auth.api.ts`: `/auth/login` ve `/auth/register` istemcisi
- `apps/web/src/features/auth/hooks/useAuthMutations.ts`: Auth mutation hook'lari
- `apps/web/src/features/auth/components/*`: Auth UI bilesenleri
- `apps/web/src/features/profile/api/profile.api.ts`: `/users/profile` API istemcisi
- `apps/web/src/features/supplier-application/api/supplier-application.api.ts`: Satici basvuru API istemcileri
- `apps/web/src/features/supplier-application/components/SupplierApplicationStepOne.tsx`: Basvuru adimi UI

#### Lib katmani

- `apps/web/src/lib/api.ts`: Merkezi fetch helper, hata cozumleme, refresh token retry
- `apps/web/src/lib/auth-token.ts`: Access token saklama/okuma/silme helper'i

### 4.3 apps/api (NestJS - Backend)

#### Cekirdek

- `apps/api/src/main.ts`: Global prefix (`/api/v1`), CORS, ValidationPipe
- `apps/api/src/app.module.ts`: Modul baglantilari
- `apps/api/src/prisma/prisma.module.ts`: Prisma modul exportu
- `apps/api/src/prisma/prisma.service.ts`: Prisma lifecycle servisi

#### Modul yapisi

- `apps/api/src/modules/auth/*`: Register/login/refresh/logout, JWT ve auth servis mantigi
- `apps/api/src/modules/users/*`: Profil goruntuleme/guncelleme ve user servis/repository
- `apps/api/src/modules/categories/*`: Kategori agaci + admin CRUD
- `apps/api/src/modules/sectors/*`: Sektor listesi + admin CRUD
- `apps/api/src/modules/products/*`: Urun listeleme + olusturma endpointleri
- `apps/api/src/modules/supplier-applications/*`: 3 adimli satici basvuru, belge yukleme, admin review akisleri

#### Testler

- `apps/api/src/**/*.spec.ts`: Unit testler
- `apps/api/test/app.e2e-spec.ts`: E2E test girisi
- `apps/api/test/jest-e2e.json`: E2E jest konfigu

#### Prisma

- `apps/api/prisma/schema.prisma`: User, SupplierApplication, SupplierApplicationDocument, Category, Sector, Product modelleri
- `apps/api/prisma/migrations/*`: Model degisiklik migration gecmisi
- `apps/api/prisma/seed.ts`: Seed verileri

## 5) packages/ Klasoru

### 5.1 packages/types

- `packages/types/src/index.ts`: Tip export girisi
- `packages/types/src/schemas/index.ts`: Schema export girisi
- `packages/types/src/schemas/auth.ts`: Login/register Zod semalari
- `packages/types/src/schemas/supplier-application.ts`: Satici basvuru adim semalari ve enum degerleri

### 5.2 packages/ui

- `packages/ui/src/index.ts`: UI export girisi
- `packages/ui/src/components/index.ts`: Component export merkezi
- `packages/ui/src/components/Button.tsx`: Ortak button
- `packages/ui/src/components/Input.tsx`: Ortak input
- `packages/ui/src/components/Checkbox.tsx`: Ortak checkbox

### 5.3 packages/utils

- `packages/utils/src/index.ts`: Utility paketi girisi (su an placeholder)

### 5.4 packages/config

- `packages/config/src/index.ts`: Config paketi girisi (su an placeholder)

## 6) stitch_exports/

- `stitch_exports/9569456776887919367/*.html`: Stitch tarafindan uretilmis referans ekran HTML'leri
- `stitch_exports/9569456776887919367/*.jpg|*.webp`: Ekran goruntu referanslari

Bu klasor, frontend entegrasyonunda hedef gorunumu birebir tasimak icin kaynak olarak kullaniliyor.

## 7) Uygulamayi Calistirma Rehberi

1. Klasik gelistirme baslatma:

   - Kok dizinde: `pnpm dev`

2. Next cache sorunu yasandiginda:

   - Kok dizinde: `pnpm dev:fresh`

3. Servis portlari:

   - Web: `http://localhost:3000`
   - API: `http://localhost:3001`
   - Admin: `http://localhost:3002`

4. Altyapi servisleri (opsiyonel ama API icin gerekli):

   - `docker compose up -d`

## 8) Bilinen Teknik Notlar (Proje Hafizasi)

- Next.js stale chunk/MODULE_NOT_FOUND hatalarinda web `.next` temizligi gerekir; bu nedenle `dev:fresh` komutu var.
- PostgreSQL 5432 cakismasi olursa Docker DB ile lokal PostgreSQL cakisabilir; 5433 test veritabani gecici cozum olabilir.
- Prisma schema degisikliklerinden sonra `apps/api` altinda `pnpm prisma generate` calistirilmalidir.

## 9) Kisa Mimari Sonuc

- Frontend: `apps/web` + `apps/admin`
- Backend: `apps/api`
- Veritabani modeli: `apps/api/prisma/schema.prisma`
- Ortak tip/UI: `packages/types` + `packages/ui`
- Altyapi: `docker-compose.yml`

Bu dosya proje mimarisine hizli adaptasyon ve yeni gelistirme oturumlarinda referans amacli tutulur.
