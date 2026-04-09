# ToptanNext — RULES_FRONTEND.md
## Frontend Geliştirme Standartları

> **AJAN:** Bu dosyayı her frontend görevinden önce oku.
> RULES_CORE.md'yi de okumuş olmalısın — bu dosya onu tamamlar.

---

## BÖLÜM 3.1 — FRONTEND (apps/web ve apps/admin)

### Next.js 14 (App Router)

```
Versiyon: 14.x
Routing: App Router (pages/ router YASAK)
Rendering:
  - SSG: Statik sayfalar (hakkında, iletişim)
  - SSR: Ürün listesi, arama sonuçları
  - ISR: Ürün detay (revalidate: 3600)
  - CSR: Dashboard'lar, sipariş yönetimi
```

**App Router Klasör Yapısı (apps/web/src/app/):**
```
app/
├── (public)/               ← Auth gerektirmez, SEO kritik
│   ├── page.tsx            ← Ana sayfa (SSR)
│   ├── layout.tsx
│   ├── loading.tsx         ← ZORUNLU
│   ├── error.tsx           ← ZORUNLU
│   ├── products/
│   │   ├── page.tsx        ← Ürün listesi (SSR + filtre)
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx    ← Ürün detay (ISR)
│   │       └── loading.tsx
│   ├── suppliers/
│   │   └── [id]/
│   │       └── page.tsx    ← Mağaza profili (SSR)
│   ├── categories/
│   │   └── [slug]/
│   │       └── page.tsx    ← Kategori sayfası (ISR)
│   └── search/
│       └── page.tsx        ← Arama sonuçları (SSR)
│
├── (auth)/                 ← Auth sayfaları (giriş yapmış redirect)
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── verify-email/page.tsx
│
├── (buyer)/                ← BUYER rolü zorunlu
│   ├── layout.tsx          ← auth + role kontrolü burada
│   ├── dashboard/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── messages/page.tsx
│   └── profile/page.tsx
│
├── (supplier)/             ← SUPPLIER rolü zorunlu
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── messages/page.tsx
│   └── store/page.tsx
│
├── layout.tsx              ← Root (Providers, fonts)
├── globals.css
└── not-found.tsx           ← 404 sayfası
```

**Server vs Client Component Karar Tablosu:**

| Durum | Component Tipi |
|---|---|
| Sadece veri gösterme, form yok | Server Component |
| SEO gerekiyor | Server Component |
| useState veya useEffect var | Client Component |
| onClick, onChange var | Client Component |
| Browser API kullanıyor | Client Component |
| TanStack Query kullanıyor | Client Component |
| Form var (React Hook Form) | Client Component |

**Kural:** Mümkün olduğunca Server Component kullan. `'use client'` direktifini en alt bileşenlere it.

---

### TypeScript 5+

```typescript
// tsconfig.json temel ayarları
{
  "compilerOptions": {
    "strict": true,          // KAPATAMAZSIN
    "noUncheckedIndexedAccess": true,  // array[i] → T | undefined
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// YASAKLAR:
// @ts-ignore      → YASAK (geçici fix gibi görünür, kalıcı olur)
// @ts-expect-error → sadece test dosyalarında, gerekçe yorumu ile
// any             → YASAK (unknown kullan + type guard yaz)
// as Type         → Zorundaysan kullan ama yorum bırak neden gerektiğini
// !               → non-null assertion — sadece kesin null olamayacağını
//                   kanıtlayabiliyorsan, yoksa if kontrolü yaz
```

---

### Tailwind CSS 3+

```typescript
// tailwind.config.ts — ToptanNext design tokens
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',   // Ana marka rengi
          600: '#2563eb',   // Hover
          700: '#1d4ed8',   // Active
          900: '#1e3a8a',
        },
        supplier: '#0f766e',  // Tedarikçi vurgu rengi (teal)
        buyer:    '#7c3aed',  // Alıcı vurgu rengi (violet)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};

// KURALLAR:
// - Inline style kullanma, Tailwind class kullan
// - Özel değer için tailwind.config'e ekle: text-[#1a1a1a] değil
// - cn() utility ile koşullu class'lar yaz (clsx + tailwind-merge)
// - Responsive önce mobile: sm: md: lg: xl: 2xl:
```

---

### TanStack Query v5

```typescript
// Temel kullanım paterni — apps/web/src/hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product, ProductFilters, PaginatedResponse } from '@toptannext/types';

// QUERY KEY FACTORY — sihirli string yasak
export const productKeys = {
  all:     () => ['products'] as const,
  lists:   () => [...productKeys.all(), 'list'] as const,
  list:    (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all(), 'detail'] as const,
  detail:  (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<Product>>('/products', { params: filters }),
    staleTime: 5 * 60 * 1000,   // 5 dakika
    gcTime:    10 * 60 * 1000,  // 10 dakika (eski: cacheTime)
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) =>
      api.post<Product>('/products', data),
    onSuccess: () => {
      // Listeyi invalidate et
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// KURALLAR:
// - useQuery'de queryKey her zaman factory'den gelir
// - Mutation sonrası ilgili query'leri invalidate et
// - isLoading değil isPending kullan (v5 değişikliği)
// - select ile data transform yap, component'ta yapma
```

---

### React Hook Form + Zod

```typescript
// Form pattern — HTML'den dönüştürürken bu yapıyı kullan
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Şema her zaman packages/types/src/schemas/ içinde tanımlanır
// Buraya import edilir, burada tanımlanmaz
import { createProductSchema } from '@toptannext/types';
type CreateProductForm = z.infer<typeof createProductSchema>;

export function ProductForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { minOrderQty: 1, currency: 'TRY' },
  });

  const { mutate, isPending } = useCreateProduct();

  const onSubmit = (data: CreateProductForm) => mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}

// KURALLAR:
// - Zod şema packages/types içinde tanımlanır
// - errors mesajları Türkçe olur
// - isSubmitting VE isPending (mutation) ikisi de disabled için kontrol edilir
// - File upload için Controller kullan (register çalışmaz)
```

---

## BÖLÜM 4.3 — FRONTEND TEST KURALLARI

```typescript
// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Ürün',
  basePrice: new Decimal(100),
  minOrderQty: 5,
  supplier: { companyName: 'Test Firma' },
  images: [{ url: 'https://...' }],
};

describe('ProductCard', () => {
  it('ürün adı ve fiyatı göstermeli', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Ürün')).toBeInTheDocument();
    expect(screen.getByText('₺100,00')).toBeInTheDocument();
    expect(screen.getByText('Min. 5 adet')).toBeInTheDocument();
  });

  it('sepete ekle tıklandığında callback çağırılmalı', async () => {
    const onAddToCart = jest.fn();
    const user = userEvent.setup();

    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    await user.click(screen.getByRole('button', { name: /sepete ekle/i }));

    expect(onAddToCart).toHaveBeenCalledWith('prod-1', 5); // default = minOrderQty
  });
});
```

```typescript
// use-products.test.tsx (custom hook test)
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientWrapper } from '@/test-utils/wrapper';
import { useProducts } from './use-products';
import { server } from '@/mocks/server'; // MSW
import { http, HttpResponse } from 'msw';

describe('useProducts', () => {
  it('ürün listesini getirmeli', async () => {
    server.use(
      http.get('/api/v1/products', () =>
        HttpResponse.json({
          success: true,
          data: [mockProduct],
          meta: { page: 1, total: 1, totalPages: 1, limit: 20 },
        })
      )
    );

    const { result } = renderHook(() => useProducts({}), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });
});
```

**Frontend test araçları:**
- `@testing-library/react` — bileşen test
- `@testing-library/user-event` — kullanıcı etkileşimi
- `msw` (Mock Service Worker) — API mock
- `jest-axe` — erişilebilirlik testi
- `Playwright` — E2E test

---

## BÖLÜM 4.4 — E2E TEST KURALLARI (Playwright)

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ödeme Akışı', () => {
  test.beforeEach(async ({ page }) => {
    // Test kullanıcısıyla login
    await loginAsTestBuyer(page);
  });

  test('alıcı ürünü sepete ekleyip ödeme başlatabilmeli', async ({ page }) => {
    // 1. Ürün sayfasına git
    await page.goto('/products/test-urun');

    // 2. Miktarı ayarla
    await page.fill('[data-testid="quantity-input"]', '10');

    // 3. Sepete ekle
    await page.click('[data-testid="add-to-cart"]');

    // 4. Sepeti kontrol et
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // 5. Ödemeye geç
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL('/checkout');

    // 6. iyzico form yüklendi mi?
    await expect(page.locator('[data-testid="iyzico-form"]')).toBeVisible();
  });
});
```

**E2E Test kuralları:**
- Her kritik kullanıcı flow'u için en az 1 happy path testi
- `data-testid` attribute'ları bileşenlere ekle (test için)
- Test ortamı için ayrı `.env.test` dosyası
- CI/CD'de otomatik çalışır

---

## BÖLÜM 7.1 — FRONTEND PERFORMANS

```
Core Web Vitals hedefleri:
  LCP (Largest Contentful Paint): < 2.5s
  FID (First Input Delay): < 100ms
  CLS (Cumulative Layout Shift): < 0.1

Resim optimizasyonu:
  - next/image her zaman kullan (img etiketi değil)
  - WebP formatı tercih et
  - sizes attribute ile responsive resimler
  - priority prop ana sayfada ve ürün detayda

Bundle optimizasyonu:
  - Dynamic import: Büyük bileşenler lazy load
  - Barrel export yasak (packages/ui dışında)
  - Tree-shaking'i bozmak için side-effect'siz importlar
```

---

## BÖLÜM 14 — FRONTEND HATA YÖNETİMİ

```typescript
// apps/web/src/app/error.tsx — her route segment için
'use client';
export default function ErrorBoundary({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Bir hata oluştu</h2>
      <button onClick={reset}>Tekrar Dene</button>
    </div>
  );
}

// API hata yönetimi — lib/api.ts
axios.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token refresh dene
      try {
        await refreshToken();
        return axios.request(error.config);
      } catch {
        // Refresh başarısız → login'e yönlendir
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data?.error ?? error);
  }
);
```

---

## FRONTEND ORTAM DEĞİŞKENLERİ (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_SENTRY_DSN="https://..."
NEXT_PUBLIC_MEILISEARCH_URL="http://localhost:7700"
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY="searchOnlyKey"
NEXT_PUBLIC_IYZICO_URL="https://sandbox-static.iyzipay.com"
```

**Kural:**
- `.env` dosyaları asla git'e commit edilmez
- `.env.example` her uygulama için şablona commit edilir
- `NEXT_PUBLIC_` prefix'li değişkenler client'a açılır — gizli bilgi koyma

---

## FRONTEND TEST ZORUNLULUĞU CHECKLİST

```
[ ] Frontend bileşen testleri yazıldı ve geçiyor
[ ] Frontend hook testleri yazıldı ve geçiyor
[ ] Kritik flow için E2E test yazıldı (ödeme, sipariş, auth)
[ ] Loading/skeleton UI var
[ ] Error boundary var
[ ] data-testid attribute'ları eklendi
[ ] next/image kullanıldı (img etiketi yok)
[ ] Server/Client Component ayrımı doğru yapıldı
[ ] Zod şema packages/types içinde tanımlandı
[ ] TypeScript any kullanılmadı
```

*Bu dosya RULES_CORE.md ile birlikte kullanılır.*
