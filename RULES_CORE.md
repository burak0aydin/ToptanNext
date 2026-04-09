# ToptanNext — RULES_CORE.md
## Her Görevde Okunacak Temel Kurallar

> **AJAN: BU DOSYAYI TAMAMEN OKU. İLK SATIRAN SON SATIRA KADAR.**
> Her görevde bu dosya senin anayasandır. Çelişki olduğunda bu dosya kazanır.
> "Sanırım şöyle yapabilirim" diye tahmin yürütme. Emin değilsen bu dosyaya dön.

---

## BÖLÜM 0 — AJAN DAVRANIŞ PROTOKOLÜ (ÖNCE BU)

### 0.1 Temel Varoluş Kuralları

Sen bir **Staff Software Engineer** gibi davranıyorsun.
Bir junior gibi "belki şöyle bir şey dene" diyemezsin.
Her kararın gerekçeli, her satırın bilinçli olmalı.

**SEN BİR ZAMAN MAKİNESİ DEĞİLSİN.**
Bilmediğin bir kütüphanenin API'sini hayal edemezsin.
Bilmediğin bir fonksiyonun var olduğunu varsayamazsın.
Gerçek olmayan bir metodun body'sini yazamazsın.

```
❌ YASAK: Var olmayan bir import yazmak
❌ YASAK: "Bu metod muhtemelen şöyle çalışır" diye kod yazmak
❌ YASAK: Testleri geçmesi için mock oluşturmak ama gerçek implementasyonu atlamak
❌ YASAK: TODO yorum bırakıp ilerlemek (TODO = tamamlanmamış iş = geçersiz)
❌ YASAK: Bir dosyayı yarım bırakmak
❌ YASAK: "Şimdilik bu yeter" mantığı
```

### 0.2 Halüsinasyon Önleme Protokolü

Her kod yazma oturumunda şu kontrolleri yap:

**Adım 1 — Import Kontrolü**
Yazdığın her import için şunu sor: "Bu paket `package.json`'da var mı?"
Eğer yoksa ve eklemen gerekiyorsa, önce paketin adını ve versiyonunu belirt, sonra kodu yaz.

**Adım 2 — API Kontrol**
Bir kütüphanenin metodunu kullanmadan önce: "Bu metod bu versiyonda var mı?"
Bilmiyorsan şunu yaz: "Bu kütüphanenin dokümantasyonunu kontrol etmen gerekebilir: [URL]"

**Adım 3 — Tip Kontrol**
TypeScript tipleri uydurma. Tip bilmiyorsan `unknown` kullan ve type guard yaz.

**Adım 4 — Veritabanı Şema Kontrolü**
Prisma sorgusu yazarken: "Bu model şemada tanımlı mı? Bu field var mı?"
Şemada olmayan bir field'a erişme.

### 0.3 Vertical Slicing Protokolü (Vibe Coding Yasak)

**Vibe Coding nedir (YAPMA):**
- Bütün sayfaları UI olarak yaz, sonra backend yaz
- "Önce güzel görünsün, sonra çalışır hale getiririm"
- Birden fazla özelliği aynı anda yaz
- Bir özelliği tamamlamadan diğerine geç

**Vertical Slicing nedir (YAP):**
Her özellik için şu dikey dilimi tamamla, sonra bir sonraki özelliğe geç:

```
[HTML/Tasarım Verildi]
        ↓
[Prisma Schema + Migration]
        ↓
[DTO Tanımları (packages/types)]
        ↓
[Repository Katmanı + Unit Test]
        ↓
[Service Katmanı + Unit Test]
        ↓
[Controller + Integration Test]
        ↓
[Frontend API Hook + Test]
        ↓
[UI Bileşeni (HTML → TSX dönüşümü) + Test]
        ↓
[E2E Test (kritik flow'lar)]
        ↓
[TAMAMLANDI — bir sonraki özelliğe geç]
```

**Kural:** Bir dilimi tamamlamadan bir sonraki dilime ASLA geçme.

### 0.4 HTML → Kod Dönüşüm Protokolü

Kullanıcı sana bir HTML dosyası veya kod bloğu verdiğinde:

**Adım 1 — Analiz Et**
```
- Kaç bileşen var? Listele.
- Hangi data gerekiyor? API endpoint'leri ne olacak?
- Hangi state yönetimi gerekiyor?
- Form var mı? Validasyon kuralları neler?
- Hangi kullanıcı rolü bu sayfayı görecek?
```

**Adım 2 — Onay Al**
Analizi kullanıcıya sun ve devam etmeden önce onay iste.

**Adım 3 — Bileşen Ağacını Çiz**
```
Page (Server Component)
├── Layout (Client Component)
│   ├── Navbar
│   └── Sidebar
├── ProductGrid (Client Component)
│   ├── ProductCard (×n)
│   └── ProductFilter
└── Pagination
```

**Adım 4 — Tek Tek Dönüştür**
Her bileşeni sırayla yaz. Birini bitirmeden diğerine geçme.

**Adım 5 — Tailwind Dönüşümü**
HTML'deki inline style veya class'ları Tailwind class'larına dönüştür.
Özel renkler için `tailwind.config.ts`'e ekle, HTML'de inline bırakma.

---

## BÖLÜM 0.5 — KURAL DOSYASI YÜKLEME PROTOKOLÜ (OTOMATİK YÖNLENDİRME)

> **AJAN: Göreve başlamadan önce bu tabloyu oku ve ilgili dosyaları yükle.**
> RULES_CORE.md her zaman okunur. Aşağıdaki tablo hangi EK dosyaların okunacağını belirler.

### Görev Tipi → Dosya Eşleştirme Tablosu

| Görev İçeriyorsa... | Ek Okunacak Dosyalar |
|---|---|
| Sadece frontend (component, hook, page, UI) | `RULES_FRONTEND.md` |
| Sadece backend (service, controller, repository, API) | `RULES_BACKEND.md` |
| Sadece database (schema, migration, Prisma sorgusu) | `RULES_DATABASE.md` |
| Sadece DevOps (Docker, CI/CD, git, env) | `RULES_DEVOPS.md` |
| **Full-stack sayfa geliştirme** | `RULES_BACKEND.md` + `RULES_DATABASE.md` + `RULES_FRONTEND.md` |
| Auth, JWT, güvenlik içeren her görev | `RULES_BACKEND.md` (Bölüm 6) |
| Ödeme, sipariş, stok (finansal işlem) | `RULES_BACKEND.md` + `RULES_DATABASE.md` |
| Arama, filtre (Meilisearch) | `RULES_BACKEND.md` (Bölüm 3.5) |
| Test yazımı (herhangi) | Görev tipine göre ilgili dosya |
| Yeni sprint başlangıcı | Tüm dosyalar + `MEMORY_BANK.md` |

### Full-Stack Sayfa Tanıma Kriterleri

Kullanıcı şunlardan birini söylüyorsa görev **full-stack**'tir:
```
"sayfa yap"
"özellik ekle"
"ekran geliştir"
"akış yaz" (checkout, onboarding, vb.)
"modül yap"
"[herhangi bir sayfa adı] yap" → ürün sayfası, sipariş sayfası, dashboard vb.
```

Full-stack görevde yükleme sırası:
```
1. RULES_CORE.md        ← Her zaman önce
2. MEMORY_BANK.md       ← Projenin mevcut durumunu anlamak için
3. RULES_DATABASE.md    ← Schema'yı anla, model var mı kontrol et
4. RULES_BACKEND.md     ← Endpoint yapısını belirle
5. RULES_FRONTEND.md    ← Component mimarisini belirle
```

### Dosya Yükleme Onay Satırı

Her oturumun başında şunu yaz (içten, kullanıcıya gösterme):
```
Görev tipi: [frontend / backend / database / devops / full-stack]
Yüklenecek dosyalar: [liste]
Memory bank okundu: [evet / hayır]
```

---

## BÖLÜM 0.6 — MEMORY BANK PROTOKOLÜ

> MEMORY_BANK.md projede nerede olduğunu, ne yaptığını hatırlayan "canlı dosya"dır.
> Uzun oturumlar ve bağlam kayıpları için tek güvencendir.

### Oturum Başında (OKU)

```
1. MEMORY_BANK.md'yi oku
2. "Aktif Sprint" ve "Son Tamamlanan Görev" bilgisini al
3. "Dosya Haritası"nı tara — mevcut mimariye hakim ol
4. "Bilinen Sorunlar"ı oku — devam eden şeyler var mı?
5. "Son Oturum Özeti"ni oku — önceki oturumda ne vardı?
```

### Oturum Sonunda (GÜNCELLE)

```
1. Son Oturum Özeti'ni doldur:
   - Tarih
   - Yapılan işler (madde madde)
   - Oluşturulan yeni dosyalar (tam yol + kısa açıklama)
   - Değiştirilen dosyalar
   - Çalışan testler
   - Yarım kalan / bekleyen işler
   - Bir sonraki oturuma not

2. Dosya Haritası'nı güncelle:
   - Yeni dosya oluşturduysan → ilgili bölüme ekle
   - Dosyanın ne yaptığını 1 satırda açıkla

3. Sprint durumunu güncelle:
   - Tamamlanan görevi [x] işaretle

4. Gerekirse:
   - Kritik karar aldıysan → Kritik Kararlar bölümüne ekle
   - Yeni sorun fark ettiysen → Bilinen Sorunlar bölümüne ekle
   - Yeni paket yüklediysen → Kurulu Bağımlılıklar bölümüne ekle
```

### MEMORY_BANK Güncelleme Komutu

Kullanıcı şunları söylediğinde MEMORY_BANK.md'yi güncelle:
```
"memory güncelle"
"hafızayı güncelle"
"oturumu kapat"
"memory bank'i yaz"
"özet çıkar"
```

Ayrıca: Her vertical slice tamamlandığında (test dahil geçince) otomatik güncelle.

---

## BÖLÜM 1 — PROJE KİMLİĞİ

| Alan | Değer |
|---|---|
| **Proje Adı** | ToptanNext |
| **Tip** | B2B Toptan Satış Pazaryeri |
| **Referans** | Alibaba, Trendyol Go, Çiçeksepeti Toptan |
| **Hedef Pazar** | Türkiye (TR) |
| **Para Birimi** | TRY (Türk Lirası) |
| **Dil** | TR arayüz — EN kod/değişken |
| **Ödeme** | iyzico (Sandbox → Production) |
| **Ölçek Hedefi** | 1000+ tedarikçi, 50.000+ alıcı, 500.000+ ürün |
| **Paket Yöneticisi** | **pnpm** (npm veya yarn kullanma) |
| **Node Versiyonu** | 20 LTS |

### Kullanıcı Rolleri ve İzinleri

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN                                                  │
│  - Tüm kullanıcıları yönetir                           │
│  - Tedarikçi başvurularını onaylar/reddeder            │
│  - Platform istatistiklerini görür                     │
│  - Tüm siparişlere erişebilir                         │
│  - Komisyon oranlarını belirler                        │
│  - Kategori/etiket yönetimi                           │
│  - İçerik moderasyonu                                 │
├─────────────────────────────────────────────────────────┤
│  SUPPLIER (Tedarikçi)                                  │
│  - Kendi mağazasını yönetir                           │
│  - Ürün ekler/günceller/siler (sadece kendi)          │
│  - Gelen siparişleri görür/işler                      │
│  - Stok günceller                                     │
│  - Kazanç raporlarını görür                           │
│  - Alıcılarla mesajlaşır                             │
├─────────────────────────────────────────────────────────┤
│  BUYER (Alıcı)                                         │
│  - Ürünlere göz atar                                  │
│  - Sipariş verir                                      │
│  - Tedarikçilerle mesajlaşır                         │
│  - Faturalarını indirir                               │
│  - Sipariş geçmişini görür                           │
│  - Adres yönetimi                                     │
└─────────────────────────────────────────────────────────┘
```

---

## BÖLÜM 2 — MONOREPO YAPISI

**Paket yöneticisi: pnpm workspaces + Turborepo**

```
toptannext/
├── apps/
│   ├── web/                → Next.js 14 App Router (alıcı + tedarikçi)
│   ├── admin/              → Next.js 14 App Router (sadece admin paneli)
│   └── api/                → NestJS 10 (tek backend)
│
├── packages/
│   ├── types/              → @toptannext/types (TÜM tipler buradan)
│   ├── ui/                 → @toptannext/ui (web + admin ortak bileşenler)
│   ├── utils/              → @toptannext/utils (platform-agnostic)
│   └── config/             → @toptannext/config (ESLint, TS, Prettier)
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml      → sadece infrastructure
├── MEMORY_BANK.md          → proje hafızası (her oturumda oku + güncelle)
└── PROJECT_RULES.md        → bu dosya
```

### Klasör Oluşturma Kuralları

```
❌ apps/ veya packages/ dışına kod yazma
❌ packages/types dışında tip tanımlama (sadece yerel, geçici tipler hariç)
❌ apps/ içindeki bir paketten başka bir apps/ paketini import etme
   (apps/web → apps/api import yasak — sadece HTTP üzerinden iletişim)
✅ packages/ içindeki paketler her yerden import edilebilir
✅ Yeni domain eklerken önce packages/types güncelle
```

### turbo.json Pipeline

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "test:e2e": { "dependsOn": ["build"] },
    "lint": {},
    "type-check": {}
  }
}
```

---

## BÖLÜM 5 — KOD KONVANSİYONLARI

### 5.1 Genel Kurallar

```
Değişken/Fonksiyon/Class isimleri → İngilizce
Yorum satırları → Türkçe veya İngilizce
Hata mesajları (kullanıcıya gösterilen) → Türkçe
Log mesajları → İngilizce

Dosya adı:
  NestJS → kebab-case.ts (products.service.ts)
  React Bileşeni → PascalCase.tsx (ProductCard.tsx)
  Hook → camelCase.ts (use-products.ts veya useProducts.ts)
  Util → camelCase.ts (formatCurrency.ts)
  Test → [dosyaadı].spec.ts veya [dosyaadı].test.tsx

Export:
  React Bileşeni → named export (default export yasak)
  NestJS class'ları → zaten injectable, sorun yok
  Utility fonksiyonlar → named export
  Types/Interfaces → named export
```

### 5.2 Yasaklı Kodlar

```typescript
// ❌ YASAK: any tipi
function process(data: any) {}
// ✅ YAP
function process(data: unknown) {
  if (!isProductData(data)) throw new Error('Geçersiz veri');
}

// ❌ YASAK: console.log (production'da)
console.log('user:', user);
// ✅ YAP
this.logger.log(`User ${user.id} created`);

// ❌ YASAK: @ts-ignore
// @ts-ignore
someFunction();
// ✅ YAP: Tipi düzelt veya type guard yaz

// ❌ YASAK: TODO yorum
// TODO: bunu sonra düzelt
// ✅ YAP: Ya şimdi düzelt, ya issue aç
```

### 5.3 İsimlendirme Kuralları

```typescript
// Booleans: is, has, can, should ile başlar
isActive, hasPermission, canEdit, shouldRefetch

// Async fonksiyonlar: fiil ile başlar
async createOrder() {}
async fetchProducts() {}
async updateInventory() {}

// Event handler'lar: handle ile başlar
handleSubmit, handleClick, handleOrderCreate

// React Query key factory'leri: Keys ile biter
productKeys, orderKeys, userKeys

// Constants: SCREAMING_SNAKE_CASE
MAX_ORDER_AMOUNT, DEFAULT_PAGE_SIZE, JWT_EXPIRES_IN

// Enum değerleri: UPPER_CASE
enum OrderStatus { PENDING, CONFIRMED, CANCELLED }

// Type/Interface: PascalCase, I prefix yok
type ProductEntity = { ... }
interface ProductFilters { ... }

// Generic type parametreleri: T, K, V veya açıklayıcı
function paginate<TItem>(items: TItem[]): PaginatedResponse<TItem>
```

### 5.4 Import Sıralaması

```typescript
// 1. Node.js built-in
import path from 'path';
import fs from 'fs';

// 2. External paketler
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 3. Internal packages (monorepo)
import type { ProductEntity } from '@toptannext/types';

// 4. App-internal (absolute path)
import { PrismaService } from '@/prisma/prisma.service';

// 5. Relative imports
import { ProductsRepository } from './products.repository';
import type { CreateProductDto } from './dto/create-product.dto';
```

---

## BÖLÜM 11 — AJAN GÖREVİ YÖNETİMİ

### 11.1 HTML Alındığında Yapılacaklar (Adım Adım)

Kullanıcı sana bir HTML sayfası veya bileşeni verdiğinde:

```
ADIM 1 — HTML'i Analiz Et (kod yazmadan önce)
─────────────────────────────────────────────
Şunları listele:
  □ Hangi sayfanın HTML'i? (ürün listesi, checkout, dashboard vb.)
  □ Kaç bileşen var? Her birini say ve isimlendir.
  □ Hangi data kaynaklarına ihtiyaç var?
  □ Hangi API endpoint'leri gerekecek?
  □ Form var mı? Validasyon kuralları?
  □ Kullanıcı rolü? (public, buyer, supplier, admin)
  □ Bu sayfa SSR mi CSR mi olmalı? Neden?
  □ State var mı? (filter, pagination, modal, form state)

ADIM 2 — Bileşen Ağacını Çiz
─────────────────────────────────────────────
ProductListPage (Server Component — SSR)
├── ProductFilter (Client Component — filtre state'i var)
│   ├── CategorySelect
│   ├── PriceRange
│   └── SortSelect
├── ProductGrid (Client Component — TanStack Query)
│   └── ProductCard (×n)
│       ├── ProductImage (next/image)
│       ├── ProductInfo
│       └── AddToCartButton
└── Pagination (Client Component)

ADIM 3 — Backend'i Tanımla (API önce gelir)
─────────────────────────────────────────────
Hangi endpoint'ler gerekiyor?
  GET /api/v1/products?page=1&limit=20&categoryId=...
  GET /api/v1/categories (filter için)

Hangi Prisma modelleri etkileniyor?
  Product, Category, Inventory

ADIM 4 — Sırayla Yaz
─────────────────────────────────────────────
Sadece ONAYLANAN bileşeni/özelliği yaz.
Bir sonraki bileşen için kullanıcıdan onay al.
```

### 11.2 Yeni Özellik Geliştirme Şablonu

```
Özellik Adı: [Ürün Arama Filtresi]
Etkilenen Uygulama: [apps/web, apps/api]
Etkilenen Modüller: [products, categories]
Kullanıcı Rolü: [PUBLIC — herkes kullanabilir]
Rendering: [SSR — SEO kritik, URL'de filtre parametreleri]

─── BACKEND ADIMLAR ───
[ ] 1. Prisma schema — değişiklik gerekiyor mu?
[ ] 2. DTO: ProductFilterDto (page, limit, categoryId, minPrice, maxPrice, sort)
[ ] 3. Repository: findMany(filters) metodu
[ ] 4. Repository unit testi
[ ] 5. Service: findAll(filters) metodu (iş kuralları + pagination)
[ ] 6. Service unit testi
[ ] 7. Controller: GET /products endpoint'i
[ ] 8. Controller integration testi
[ ] 9. Meilisearch entegrasyonu (filtreleri search'e yönlendir)

─── FRONTEND ADIMLAR ───
[ ] 10. packages/types: ProductFilters tipi, ProductListResponse tipi
[ ] 11. Hook: useProducts(filters) — TanStack Query
[ ] 12. Hook testi (MSW ile)
[ ] 13. Bileşen: ProductFilter (form kontrolü, URL sync)
[ ] 14. Bileşen testi
[ ] 15. Bileşen: ProductGrid (sonuçları göster)
[ ] 16. Bileşen testi
[ ] 17. Sayfa: /products/page.tsx (SSR, generateMetadata)
[ ] 18. E2E testi (Playwright)
[ ] 19. pnpm test — tümü geçiyor mu?
[ ] 20. pnpm type-check — tip hatası yok mu?
```

### 11.3 Yasak Kısayollar

```
❌ "Test sonra yazarım" → TEST ÖNCE veya AYNI ANDA yazılır
❌ "Bu basit, mock yeter" → Gerçek implementasyon da yazılır
❌ "Bu kısmı atlayalım" → HİÇBİR ŞEYI ATLAMA
❌ "Bir dosyada hepsini halledelim" → Her şeyin yeri var
❌ "import * as X from 'y'" → Tree-shaking bozulur, named import kullan
❌ "Daha sonra optimize ederiz" → Performans sorununu şimdi çöz
❌ "Hardcode değer koyayım şimdilik" → Config'e veya constant'a koy
```

---

## BÖLÜM 12 — SAYFA KATALOĞU VE GELİŞTİRME SIRASI

### Geliştirme Sırası (Vertical Slice)

Her satır bir "slice" — tamamlanmadan bir sonraki başlanmaz.

```
SPRINT 1 — Temel Altyapı
─────────────────────────
[ ] 01. Monorepo kurulumu (Turborepo, pnpm workspaces)
[ ] 02. Docker infrastructure (Postgres, Redis, Meilisearch)
[ ] 03. NestJS boilerplate (GlobalExceptionFilter, ValidationPipe, Swagger)
[ ] 04. Prisma schema v1 (User, Supplier, Product temel modeller)
[ ] 05. packages/types boilerplate
[ ] 06. Next.js boilerplate (layout, fonts, TanStack Query provider)

SPRINT 2 — Auth
─────────────────────────
[ ] 07. Kayıt ol (backend + frontend + test)
[ ] 08. Giriş yap (backend + frontend + test)
[ ] 09. Email doğrulama (backend + frontend + test)
[ ] 10. JWT refresh token (backend + test)
[ ] 11. Şifre sıfırlama (backend + frontend + test)
[ ] 12. middleware.ts — role-based redirect

SPRINT 3 — Ürün Kataloğu (Public)
─────────────────────────
[ ] 13. Kategori CRUD (backend)
[ ] 14. Ürün listeleme sayfası — SSR (frontend)
[ ] 15. Ürün detay sayfası — ISR (frontend)
[ ] 16. Ürün arama + filtre (Meilisearch entegrasyon)
[ ] 17. Kategori sayfası — ISR (frontend)

SPRINT 4 — Tedarikçi
─────────────────────────
[ ] 18. Tedarikçi kayıt + başvuru formu
[ ] 19. Admin tedarikçi onay flow'u
[ ] 20. Tedarikçi ürün ekleme (backend + frontend)
[ ] 21. Tedarikçi ürün listeleme/düzenleme
[ ] 22. Stok yönetimi
[ ] 23. Tedarikçi mağaza profil sayfası (public)

SPRINT 5 — Alıcı & Sipariş
─────────────────────────
[ ] 24. Sepet (Redis + frontend)
[ ] 25. Adres yönetimi
[ ] 26. Sipariş oluşturma
[ ] 27. iyzico ödeme entegrasyon (Sandbox)
[ ] 28. Sipariş listesi (alıcı)
[ ] 29. Sipariş takip (alıcı)

SPRINT 6 — Mesajlaşma & Bildirimler
─────────────────────────
[ ] 30. Alıcı-Tedarikçi mesajlaşma (B2B)
[ ] 31. WebSocket bildirimler (Socket.io)
[ ] 32. Email bildirimleri (Resend)
[ ] 33. Bildirim merkezi (frontend)

SPRINT 7 — Admin Paneli
─────────────────────────
[ ] 34. Admin dashboard (istatistikler)
[ ] 35. Kullanıcı yönetimi
[ ] 36. Sipariş yönetimi
[ ] 37. İçerik moderasyonu

SPRINT 8 — Polishing
─────────────────────────
[ ] 38. SEO optimizasyonu (sitemap, robots.txt, structured data)
[ ] 39. Performance audit
[ ] 40. E2E test tamamlama
[ ] 41. Sentry entegrasyon
[ ] 42. Production build + CI/CD
```

---

## SON KONTROL LİSTESİ (Her Görevi Teslim Etmeden Önce)

```
[ ] pnpm test → Tüm testler geçiyor
[ ] pnpm type-check → Tip hatası yok
[ ] pnpm lint → Lint hatası yok
[ ] Yeni özellik için test yazıldı
[ ] Güvenlik: Endpoint rollerle korunuyor
[ ] Güvenlik: Hassas veri response'da yok
[ ] Performance: N+1 sorgu yok
[ ] Performance: Pagination var
[ ] Hata durumları handle ediliyor
[ ] Loading/skeleton UI var
[ ] Error boundary var
[ ] TypeScript any kullanılmadı
[ ] console.log üretim kodunda yok
[ ] TODO yorum bırakılmadı
[ ] Commit mesajı Conventional Commits formatında
[ ] MEMORY_BANK.md güncellendi ← YENİ
```

---

## DOSYA YÜKLEMESİ ÖZETİ (Hızlı Referans)

```
Her görevde → RULES_CORE.md + MEMORY_BANK.md
Frontend    → + RULES_FRONTEND.md
Backend     → + RULES_BACKEND.md
Database    → + RULES_DATABASE.md
DevOps      → + RULES_DEVOPS.md
Full-stack  → + RULES_DATABASE.md + RULES_BACKEND.md + RULES_FRONTEND.md
```

---

*Bu belge ToptanNext projesinin temel direktifleridir.*
*Görev tipine göre ayrıca şu dosyaları oku:*
*→ Frontend görevi → RULES_FRONTEND.md*
*→ Backend görevi → RULES_BACKEND.md*
*→ Veritabanı/Schema görevi → RULES_DATABASE.md*
*→ DevOps/Altyapı görevi → RULES_DEVOPS.md*
*→ Her görevde → MEMORY_BANK.md (oku ve güncelle)*
