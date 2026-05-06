# ToptanNext
Yeni Nesil B2B Toptan satış odaklı pazaryeri sitesi

## Development

- `pnpm dev`: Tüm uygulamaları geliştirme modunda başlatır.
- `pnpm dev:fresh`: Web `.next` önbelleğini temizleyip tüm uygulamaları geliştirici modunda başlatır.

## Lokal Veritabanını Canlıya Aktarma

Proje PostgreSQL + Prisma kullanıyor. DigitalOcean'daki canlı veritabanına lokal veriyi aktarmak için:

1. DigitalOcean panelinde canlı PostgreSQL connection string'i kopyalayın. Managed database kullanıyorsanız URL'de `sslmode=require` olduğundan emin olun.
2. Lokal Postgres container'ını çalıştırın:

```bash
docker compose up -d postgres
```

3. Lokal veriyi canlıya aktarın:

```bash
PROD_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require" pnpm db:push-local-to-prod
```

Script sırasıyla lokal DB dump'ı alır, varsayılan olarak canlı DB'nin yedeğini `backups/db` altına kaydeder, Prisma migration'ları canlı DB'ye uygular ve lokal dump'ı canlı DB'ye restore eder.

Etkileşimsiz çalıştırmak için:

```bash
CONFIRM_PRODUCTION_RESTORE=YES PROD_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require" pnpm db:push-local-to-prod
```

## Uygulama Yapısı

- `apps/web`: Ana Next.js uygulaması. Alıcı, satıcı ve admin arayüzleri tek domain altında çalışır.
- `apps/web/src/app/admin`: Admin panel rotaları. Yayında `https://domain.com/admin` üzerinden erişilir.
- `apps/api`: NestJS API. Frontend `NEXT_PUBLIC_API_URL` ile bu servise bağlanır.

Admin panel ayrı bir Vercel projesi değildir; web uygulamasının içinde route olarak entegredir.

## Vercel

Web için tek Vercel projesi oluşturun ve root directory olarak `apps/web` seçin. Admin panel aynı deploy içinde `/admin` rotasından gelir.
