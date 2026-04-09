# ToptanNext — RULES_DEVOPS.md
## DevOps, Altyapı ve CI/CD Standartları

> **AJAN:** Bu dosyayı Docker, CI/CD, Git, ortam kurulumu veya altyapı görevlerinde oku.
> RULES_CORE.md'yi de okumuş olmalısın — bu dosya onu tamamlar.

---

## BÖLÜM 8 — ORTAM DEĞİŞKENLERİ

### apps/api/.env

```env
# Database
DATABASE_URL="postgresql://toptannext:password@localhost:5432/toptannext"
DATABASE_URL_TEST="postgresql://toptannext:password@localhost:5432/toptannext_test"

# Redis
REDIS_URL="redis://localhost:6379"

# Meilisearch
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_MASTER_KEY="masterKey"
MEILISEARCH_SEARCH_KEY="searchOnlyKey"

# JWT
JWT_SECRET="super-secret-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# iyzico (Sandbox)
IYZICO_API_KEY="sandbox-api-key"
IYZICO_SECRET_KEY="sandbox-secret-key"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"
IYZICO_WEBHOOK_SECRET="webhook-secret"

# AWS
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="toptannext-media-dev"
CLOUDFRONT_URL="https://cdn-dev.toptannext.com"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@toptannext.com"

# Sentry
SENTRY_DSN="https://..."

# App
NODE_ENV="development"
API_PORT=3001
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://localhost:3002"
```

### apps/web/.env.local

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_SENTRY_DSN="https://..."
NEXT_PUBLIC_MEILISEARCH_URL="http://localhost:7700"
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY="searchOnlyKey"
NEXT_PUBLIC_IYZICO_URL="https://sandbox-static.iyzipay.com"
```

### Ortam Değişkeni Kuralları

```
- .env dosyaları asla git'e commit edilmez (.gitignore'da olmalı)
- .env.example dosyaları her uygulama için şablona commit edilir
- NEXT_PUBLIC_ prefix'li değişkenler client'a açılır — gizli bilgi koyma
- NestJS'te process.env.X direkt kullanma, ConfigService.get('X') kullan
- Production'da tüm secret'lar environment'tan gelir, hardcode yasak
- Her ortam için ayrı .env dosyası: .env.development, .env.test, .env.production
```

---

## BÖLÜM 9 — DOCKER VE YEREL GELİŞTİRME

### docker-compose.yml (Sadece Infrastructure)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: toptannext-db
    environment:
      POSTGRES_USER: toptannext
      POSTGRES_PASSWORD: password
      POSTGRES_DB: toptannext
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U toptannext"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgres-test:
    image: postgres:16-alpine
    container_name: toptannext-db-test
    environment:
      POSTGRES_USER: toptannext
      POSTGRES_PASSWORD: password
      POSTGRES_DB: toptannext_test
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    container_name: toptannext-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: toptannext-search
    ports:
      - "7700:7700"
    environment:
      MEILI_MASTER_KEY: "masterKey"
    volumes:
      - meilisearch_data:/meili_data

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
```

> **NOT:** Uygulama servisleri (api, web, admin) Docker Compose'da yer almaz.
> Uygulamalar yerel olarak `pnpm dev` ile çalıştırılır.
> Docker sadece infrastructure (DB, Redis, Search) için kullanılır.

### Geliştirme Başlatma Sırası

```bash
# 1. Infrastructure'ı başlat
docker-compose up -d

# 2. Servislerin hazır olduğunu doğrula
docker-compose ps

# 3. Database migration çalıştır
cd apps/api && pnpm prisma migrate dev

# 4. Test DB migration
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate deploy

# 5. Seed (opsiyonel — geliştirme verisi)
pnpm prisma db seed

# 6. Uygulamaları başlat (farklı terminal'lerde veya Turborepo ile)
cd apps/api   && pnpm dev  # :3001
cd apps/web   && pnpm dev  # :3000
cd apps/admin && pnpm dev  # :3002

# Turborepo ile hepsini başlat (kök dizinde):
pnpm dev
```

### Port Haritası

```
:3000 → apps/web    (Next.js — alıcı + tedarikçi)
:3001 → apps/api    (NestJS — backend API)
:3002 → apps/admin  (Next.js — admin paneli)
:5432 → PostgreSQL  (ana veritabanı)
:5433 → PostgreSQL  (test veritabanı)
:6379 → Redis
:7700 → Meilisearch
```

---

## BÖLÜM 10 — CI/CD VE GIT KURALLARI

### Branch Stratejisi

```
main          → production kodu (direkt push yasak)
develop       → geliştirme branch'i
feature/*     → yeni özellik (feature/add-product-search)
fix/*         → bug fix (fix/cart-quantity-update)
hotfix/*      → production acil fix
```

```
main
 └── develop
      ├── feature/add-product-search
      ├── feature/supplier-onboarding
      ├── fix/cart-quantity-update
      └── hotfix/payment-webhook-fix (production'dan açılır)
```

### Commit Mesajı Formatı (Conventional Commits)

```
<type>(<scope>): <kısa açıklama>

<uzun açıklama — opsiyonel>

<footer — opsiyonel>

Tipler:
  feat:     → Yeni özellik
  fix:      → Bug fix
  test:     → Test ekleme/düzenleme
  refactor: → Kod yeniden düzenleme (özellik/fix yok)
  style:    → Sadece format, boşluk, noktalı virgül
  docs:     → Sadece dokümantasyon
  chore:    → Build, config, bağımlılık güncellemeleri
  perf:     → Performans iyileştirmesi

Örnekler:
  feat(products): ürün arama filtreleme özelliği eklendi
  fix(cart): sepet toplam fiyat hesaplama hatası düzeltildi
  test(auth): JWT refresh token testleri eklendi
  feat(payments): iyzico webhook imza doğrulaması eklendi
  chore(deps): TanStack Query v5'e güncellendi
  refactor(orders): sipariş oluşturma transaction'a alındı
```

### PR Kuralları

```
- Her PR'da test coverage düşemez
- PR açmadan önce: pnpm test + pnpm lint + pnpm type-check
- PR en fazla 400 satır değişiklik içermeli
- Büyük özellikler → feature flags ile küçük PR'lara böl
- PR açıklaması: Ne değişti? Neden? Test ettim mi?
- Her PR'da en az 1 reviewer
- Self-merge yasak (hotfix hariç)
```

### .gitignore Zorunlu Dosyalar

```gitignore
# Ortam değişkenleri
.env
.env.local
.env.development
.env.test
.env.production

# Node modules
node_modules/
.pnpm-store/

# Build çıktıları
.next/
dist/
build/

# Prisma
prisma/migrations/*.sql  # HAYIR — migration'lar commit'lenir!

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json  # .vscode/extensions.json commit edilebilir
.idea/

# Logs
*.log
npm-debug.log*
```

> **ÖNEMLİ:** Prisma migration dosyaları git'e commit EDİLİR.
> `.env` dosyaları commit EDİLMEZ.

---

## CI/CD Pipeline (GitHub Actions Örneği)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: toptannext
          POSTGRES_PASSWORD: password
          POSTGRES_DB: toptannext_test
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Run migrations (test DB)
        run: pnpm prisma migrate deploy
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://toptannext:password@localhost:5432/toptannext_test
      
      - name: Unit & Integration tests
        run: pnpm test
        env:
          DATABASE_URL_TEST: postgresql://toptannext:password@localhost:5432/toptannext_test
          REDIS_URL: redis://localhost:6379
      
      - name: Build
        run: pnpm build

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: E2E tests
        run: pnpm test:e2e
```

---

## Turborepo Komutları

```bash
# Kök dizinde çalıştır

# Tüm uygulamaları geliştirme modunda başlat
pnpm dev

# Tüm uygulamaları build et
pnpm build

# Tüm testleri çalıştır
pnpm test

# E2E testleri çalıştır
pnpm test:e2e

# Tüm uygulamalarda lint çalıştır
pnpm lint

# Tüm uygulamalarda type-check çalıştır
pnpm type-check

# Belirli bir uygulamada çalıştır
pnpm --filter @toptannext/api dev
pnpm --filter @toptannext/web build
pnpm --filter @toptannext/types build
```

---

## DevOps CHECKLİST

```
[ ] .env dosyaları git'e commit edilmedi
[ ] .env.example dosyaları güncel
[ ] docker-compose up -d çalışıyor
[ ] pnpm prisma migrate dev çalıştırıldı
[ ] Test DB migration uygulandı
[ ] Commit mesajı Conventional Commits formatında
[ ] Branch adı konvansiyona uygun (feature/*, fix/*)
[ ] pnpm test → 0 hata
[ ] pnpm lint → 0 hata
[ ] pnpm type-check → 0 hata
[ ] PR 400 satır altında
[ ] CI pipeline geçiyor
```

*Bu dosya RULES_CORE.md ile birlikte kullanılır.*
