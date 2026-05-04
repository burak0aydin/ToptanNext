# ToptanNext
Yeni Nesil B2B Toptan satış odaklı pazaryeri sitesi

## Development

- `pnpm dev`: Tüm uygulamaları geliştirme modunda başlatır.
- `pnpm dev:fresh`: Web `.next` önbelleğini temizleyip tüm uygulamaları geliştirici modunda başlatır.

## Uygulama Yapısı

- `apps/web`: Ana Next.js uygulaması. Alıcı, satıcı ve admin arayüzleri tek domain altında çalışır.
- `apps/web/src/app/admin`: Admin panel rotaları. Yayında `https://domain.com/admin` üzerinden erişilir.
- `apps/api`: NestJS API. Frontend `NEXT_PUBLIC_API_URL` ile bu servise bağlanır.

Admin panel ayrı bir Vercel projesi değildir; web uygulamasının içinde route olarak entegredir.

## Vercel

Web için tek Vercel projesi oluşturun ve root directory olarak `apps/web` seçin. Admin panel aynı deploy içinde `/admin` rotasından gelir.
