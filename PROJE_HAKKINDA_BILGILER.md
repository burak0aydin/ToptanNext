# ToptanNext - Proje Hakkinda Bilgiler

Bu dokuman, projeyi tek bakista anlamak ve yeni bir oturumda hizli adapte olmak icin hazirlandi.

Amac:
- [x] Monorepo yapisini net gostermek
- [x] Mimari katmanlari kutucuklu ve ok yonlu akislarla anlatmak
- [x] Hangi kod nereye yazilir sorusuna hizli cevap vermek
- [x] Gelistirme ve teknik notlari tek yerde toplamak

---

## 1) Proje Ozeti

ToptanNext, Turkiye odakli B2B toptan pazaryeri platformudur.

Monorepo 3 ana uygulamadan olusur:
- [x] `apps/web` -> Kullanici + satici arayuzu (Next.js 14)
- [x] `apps/admin` -> Admin arayuzu (Next.js 14)
- [x] `apps/api` -> Backend API (NestJS 10 + Prisma)

Ortak kodlar `packages/` altinda merkezi olarak yonetilir.

---

## 2) Ust Duzey Mimari (Kutucuk + Ok Akisi)

```text
+------------------------------------------------------------------+
|                           KULLANICILAR                           |
|                  Alici / Satici / Admin Tarayicisi               |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                        FRONTEND KATMANI                          |
|  [x] apps/web   (Next.js 14, port 3000)                          |
|  [x] apps/admin (Next.js 14, port 3002)                          |
+-------------------------------+----------------------------------+
                                |
                                | HTTP (JSON) /api/v1
                                v
+------------------------------------------------------------------+
|                        BACKEND KATMANI                           |
|  [x] apps/api (NestJS 10, port 3001)                             |
|  [x] Controller -> Service -> Repository                          |
+-------------------------------+----------------------------------+
                                |
                                | Prisma Client
                                v
+------------------------------------------------------------------+
|                      VERITABANI KATMANI                          |
|  [x] PostgreSQL                                                   |
|  [x] Prisma schema + migrations + seed                           |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                     ALTYAPI SERVISLERI                           |
|  [x] Redis   [x] Meilisearch   [x] Docker Compose                |
+------------------------------------------------------------------+
```

---

## 3) Monorepo Haritasi (Neresi Ne Ise Yarar?)

```text
toptannext/
|-- apps/
|   |-- web/        -> Ana frontend (alici + satici)
|   |-- admin/      -> Admin frontend
|   `-- api/        -> NestJS backend
|
|-- packages/
|   |-- types/      -> Ortak tipler + Zod semalari
|   |-- ui/         -> Ortak React UI bilesenleri
|   |-- utils/      -> Ortak yardimci fonksiyonlar
|   `-- config/     -> Ortak config paket girisi
|
|-- stitch_exports/ -> Referans HTML/JPG/WEBP ekranlar
|-- docker-compose.yml
|-- turbo.json
|-- pnpm-workspace.yaml
|-- package.json
`-- MEMORY_BANK.md
```

Kisa not:
- [x] Paket yoneticisi: `pnpm`
- [x] Orkestrasyon: `Turborepo`
- [x] Workspace kapsami: `apps/*` + `packages/*`

---

## 4) Mimari Katmanlar - Detayli Aciklama

### 4.1 Frontend Katmani

```text
+---------------------------------------------------------------+
| FRONTEND                                                      |
| [x] apps/web                                                  |
|     - Auth akislari (login/register/forgot-password)         |
|     - Ana sayfa + kategori/urun kesfet                       |
|     - Kullanici profil ekranlari                             |
|     - Satici basvuru 3 adim akisi                            |
|                                                               |
| [x] apps/admin                                                |
|     - Admin dashboard                                         |
|     - Admin panel ekranlari                                  |
+---------------------------------------------------------------+
```

Onemli frontend klasorleri:
- [x] `apps/web/src/app` -> Route ve sayfalar
- [x] `apps/web/src/features` -> Domain bazli feature katmani
- [x] `apps/web/src/lib` -> API istemcisi + auth token yardimcilari
- [x] `apps/admin/src/app` -> Admin sayfa cekirdegi

### 4.2 Backend Katmani

```text
+---------------------------------------------------------------+
| BACKEND (apps/api)                                            |
| [x] main.ts -> global prefix: /api/v1                         |
| [x] app.module.ts -> modul baglantilari                       |
| [x] modules/* -> is alani bazli moduller                      |
| [x] prisma/* -> Prisma modul + servis                         |
+---------------------------------------------------------------+
```

Mevcut backend modulleri:
- [x] `auth`
- [x] `users`
- [x] `categories`
- [x] `sectors`
- [x] `products`
- [x] `supplier-applications`

### 4.3 Veritabani Katmani

```text
+---------------------------------------------------------------+
| DATABASE (Prisma + PostgreSQL)                                |
| [x] schema.prisma   -> tum model tanimlari                    |
| [x] migrations/*    -> sema degisim gecmisi                   |
| [x] seed.ts         -> gelistirme verisi                      |
+---------------------------------------------------------------+
```

### 4.4 Ortak Paket Katmani

```text
+---------------------------------------------------------------+
| SHARED PACKAGES                                                |
| [x] @toptannext/types  -> tipler + schema                     |
| [x] @toptannext/ui     -> tekrar kullanilan bilesenler        |
| [x] @toptannext/utils  -> utility fonksiyonlari               |
| [x] @toptannext/config -> ortak config                         |
+---------------------------------------------------------------+
```

### 4.5 Altyapi / DevOps Katmani

```text
+---------------------------------------------------------------+
| INFRASTRUCTURE                                                 |
| [x] docker-compose.yml                                         |
|     - postgres     (5432)                                      |
|     - postgres-test (5433)                                     |
|     - redis        (6379)                                      |
|     - meilisearch  (7700)                                      |
| [x] turbo.json -> monorepo gorev bagimliliklari                |
+---------------------------------------------------------------+
```

---

## 5) Uygulama Icindeki Veri Akisi (Uctan Uca)

### 5.1 Genel Request Akisi

```text
[Web/Admin UI]
    -> [apps/web/src/lib/api.ts]
    -> [HTTP /api/v1/...]
    -> [apps/api Controller]
    -> [apps/api Service]
    -> [apps/api Repository]
    -> [PrismaService]
    -> [PostgreSQL]
    -> [Response]
    -> [UI update]
```

### 5.2 Auth Refresh Akisi

```text
[Protected API cagrisi]
    -> 401
    -> [apps/web/src/lib/api.ts refresh mekanizmasi]
    -> POST /auth/refresh
    -> yeni access token
    -> original request retry
```

---

## 6) apps/ Klasoru - Derin Dizin Aciklamasi

### 6.1 apps/web (Port 3000)

Durum:
- [x] Next.js 14 App Router
- [x] TanStack Query provider yapisi var
- [x] Auth route grubu var
- [x] Satici basvuru route grubu var

One cikan yollar:
- [x] `src/app/(auth)/login/page.tsx`
- [x] `src/app/(auth)/register/page.tsx`
- [x] `src/app/(auth)/forgot-password/page.tsx`
- [x] `src/app/kullanici-bilgilerim/page.tsx`
- [x] `src/app/satici-ol/page.tsx`
- [x] `src/app/satici-ol/iletisim-ve-finans/page.tsx`
- [x] `src/app/satici-ol/belge-yukleme-ve-onay/page.tsx`

### 6.2 apps/admin (Port 3002)

Durum:
- [x] Next.js 14 tabanli ayri admin uygulamasi
- [x] Kendi layout/providers yapisi var
- [x] Admin panelin frontend ayrimi net

### 6.3 apps/api (Port 3001)

Durum:
- [x] NestJS 10
- [x] Global prefix: `/api/v1`
- [x] ValidationPipe acik
- [x] Modul bazli domain ayrimi mevcut

Test dosyalari:
- [x] Unit testler -> `src/**/*.spec.ts`
- [x] E2E test girisi -> `test/app.e2e-spec.ts`

---

## 7) packages/ Klasoru - Ortak Kod Stratejisi

```text
Eger bir kod hem web hem admin tarafinda kullanilacaksa:
    -> packages/ui veya packages/types altina alinmali

Eger sadece tek uygulamaya ozelse:
    -> ilgili app altinda kalmali
```

Paket bazli durum:
- [x] `packages/types` -> Zod semalari ve tip export'lari
- [x] `packages/ui` -> Button, Input, Checkbox gibi temel UI parcalari
- [x] `packages/utils` -> ortak utility girisi
- [x] `packages/config` -> ortak config girisi

---

## 8) stitch_exports Rolu (Tasarim Kaynagi)

```text
stitch_exports/9569456776887919367/
|-- *.html  -> referans ekran yapilari
|-- *.jpg   -> ekran goruntusu referansi
`-- *.webp  -> ekran goruntusu referansi
```

Kural:
- [x] Frontend entegrasyonda bu klasor hedef gorunumu belirler
- [x] Tasarim aktariminda referans bozulmamali

---

## 9) Gelistirme ve Calistirma Rehberi

### 9.1 Temel komutlar

- [x] Tum uygulamalar: `pnpm dev`
- [x] Taze baslatma (web cache temiz): `pnpm dev:fresh`
- [x] Build: `pnpm build`
- [x] Test: `pnpm test`
- [x] Type check: `pnpm type-check`

### 9.2 Servis portlari

- [x] Web: `http://localhost:3000`
- [x] API: `http://localhost:3001`
- [x] Admin: `http://localhost:3002`

### 9.3 Altyapi servisleri

- [x] Baslat: `docker compose up -d`
- [x] Kaynaklar: Postgres, Postgres-test, Redis, Meilisearch

---

## 10) Bilinen Teknik Notlar (Repo Hafizasiyla Senkron)

- [x] Next.js stale chunk/MODULE_NOT_FOUND durumunda web `.next` temizligi gerekir.
- [x] Bunun icin `apps/web` icinde clean scripti ve kokte `pnpm dev:fresh` kullanimi mevcut.
- [x] PostgreSQL 5432 cakismasi olursa lokal postgres docker postgres'i golgeleyebilir.
- [x] Gecici cozum: 5433 (postgres-test) uzerinden DATABASE_URL override ile calismak.
- [x] Prisma schema degisince `apps/api` altinda `pnpm prisma generate` calistirilmali.
- [x] Kategori/Sektor reorder akisinda unique sort_order cakismasi, iki fazli yeniden sira yazimi ile ele alinmali.

---

## 11) Hizli Karar Agaci - Hangi Isi Nereye Yazacagim?

```text
[Yeni ekran mi ekleniyor?]
    -> Evet: apps/web veya apps/admin (duruma gore)

[Yeni endpoint mi gerekiyor?]
    -> Evet: apps/api/src/modules/{domain}

[Yeni DB alan/model mi gerekiyor?]
    -> Evet: apps/api/prisma/schema.prisma + migration + prisma generate

[Ortak tip mi gerekiyor?]
    -> Evet: packages/types

[Ortak UI bileseni mi gerekiyor?]
    -> Evet: packages/ui
```

---

## 12) Kisa Mimari Sonuc

```text
ToptanNext = Monorepo + Ayrik frontendler + Tek backend + Ortak paketler

[x] Frontend: apps/web + apps/admin
[x] Backend:  apps/api
[x] Database: Prisma + PostgreSQL
[x] Shared:   packages/types + packages/ui (+ utils/config)
[x] Infra:    docker-compose (postgres/redis/meilisearch)
```

Bu dosya, proje mimarisini gozle canlandirmak ve yeni bir gorevde hizli karar vermek icin referans olarak kullanilmalidir.