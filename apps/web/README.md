# ToptanNext Web

Bu uygulama ToptanNext'in tek frontend uygulamasidir. Alici, satici ve admin arayuzleri ayni Next.js app icinde calisir.

## Rotalar

- `/`: Ana pazar yeri arayuzu
- `/satici-ol`: Satici basvuru akisi
- `/admin`: Admin paneli

## Gelistirme

Kok dizinden:

```bash
pnpm dev
```

Sadece web uygulamasi:

```bash
pnpm --filter web dev
```

## Deploy

Vercel'de root directory olarak `apps/web` secin. Admin panel ayni deploy icinde ve ayni domain altinda `/admin` rotasindan calisir.

Gerekli temel environment:

```bash
NEXT_PUBLIC_API_URL="https://api-domain.com/api/v1"
NEXT_PUBLIC_SOCKET_URL="https://api-domain.com"
```
