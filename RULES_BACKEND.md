# ToptanNext — RULES_BACKEND.md
## Backend Geliştirme Standartları

> **AJAN:** Bu dosyayı her backend görevinden önce oku.
> RULES_CORE.md'yi de okumuş olmalısın — bu dosya onu tamamlar.

---

## BÖLÜM 3.2 — BACKEND (apps/api) — NestJS 10

### NestJS Modül Yapısı

```
apps/api/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── auth.service.spec.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts   ← Prisma sorguları SADECE burada
│   │   ├── dto/
│   │   ├── entities/
│   │   │   └── user.entity.ts    ← passwordHash HARİÇ
│   │   ├── users.service.spec.ts
│   │   └── users.controller.spec.ts
│   │
│   ├── suppliers/
│   ├── products/
│   ├── inventory/
│   ├── orders/
│   ├── payments/
│   ├── cart/
│   ├── search/
│   ├── messages/               ← B2B mesajlaşma
│   ├── notifications/
│   └── admin/
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts   ← Standart response formatı
│   └── pipes/
│       └── validation.pipe.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   ├── storage.config.ts
│   ├── iyzico.config.ts
│   ├── meilisearch.config.ts
│   └── resend.config.ts
│
└── prisma/
    ├── prisma.module.ts
    ├── prisma.service.ts
    ├── schema.prisma
    └── migrations/
```

### Her Modülün İç Katman Kuralları

```typescript
// ─── CONTROLLER ─────────────────────────────────────
// Sadece: HTTP al → DTO dönüştür → Service çağır → Response döndür
// İŞ MANTIĞI YAZMA. VERİTABANI ÇAĞIRMA.

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  findAll(@Query() filterDto: ProductFilterDto) {
    // Sadece service'e devret
    return this.productsService.findAll(filterDto);
  }
}

// ─── SERVICE ─────────────────────────────────────────
// İş mantığı, kurallar, validasyon, orchestration
// Veritabanına DOĞRUDAN ERİŞME (repository kullan)

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly searchService: SearchService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(supplierId: string, dto: CreateProductDto): Promise<ProductEntity> {
    // İş kuralı: Tedarikçi onaylı mı?
    // İş kuralı: Kategori var mı?
    // Repository'ye kaydet
    // Search index'e ekle (async)
    // Döndür
  }
}

// ─── REPOSITORY ──────────────────────────────────────
// SADECE Prisma sorguları. İş mantığı yazma.

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: ProductFilterDto): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { /* ... */ },
      select: { /* sadece gerekli alanlar */ },
    });
  }
}
```

### NestJS Kural Listesi

```
✅ Her modül kendi module.ts'ini export eder
✅ Modüller arası iletişim: sadece inject edilen servisler üzerinden
✅ PrismaService sadece repository'lerde inject edilir
✅ Config her zaman @nestjs/config ile okunur (process.env direkt yasak)
✅ Her async operasyon try-catch veya global exception filter ile sarılır
✅ Logger: @nestjs/common içindeki Logger kullanılır (console.log yasak)

❌ Controller'da Prisma import etme
❌ Service'de HTTP işlemi yapma (Axios vb.)
❌ Modül dışından başka modülün repository'sine erişme
❌ Circular dependency oluşturma (forwardRef() ile çözülemiyorsa mimaride sorun var)
```

### Standart API Response

```typescript
// transform.interceptor.ts bu formatı otomatik uygular

// Başarılı tekil
{ "success": true, "data": { "id": "...", "name": "..." } }

// Başarılı liste
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 450, "totalPages": 23 }
}

// Hata
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Ürün bulunamadı",
    "details": []
  }
}

// Validasyon hatası (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Giriş verileri geçersiz",
    "details": [
      { "field": "basePrice", "message": "Fiyat 0'dan büyük olmalı" }
    ]
  }
}
```

### API Endpoint Konvansiyonu

```
Prefix: /api/v1/

Kaynak bazlı:
GET    /api/v1/products           → Liste (sayfalı)
GET    /api/v1/products/:id       → Tekil
POST   /api/v1/products           → Oluştur
PATCH  /api/v1/products/:id       → Kısmi güncelle (PUT değil PATCH)
DELETE /api/v1/products/:id       → Sil

İlişkili kaynaklar:
GET    /api/v1/suppliers/:id/products   → Tedarikçinin ürünleri

Aksiyon endpoint'leri (fiil gerektiğinde):
POST   /api/v1/orders/:id/cancel
POST   /api/v1/orders/:id/confirm
POST   /api/v1/suppliers/:id/approve

Auth:
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

---

## BÖLÜM 3.4 — CACHE (Redis)

```typescript
// Neyi cache'le, ne kadar?

// Sepet: Her kullanıcının sepeti Redis'te yaşar
// Key: cart:{userId}  TTL: 7 gün
await redis.setex(`cart:${userId}`, 604800, JSON.stringify(cart));

// Ürün detay cache: Sık görülen ürünler
// Key: product:{slug}  TTL: 1 saat
await redis.setex(`product:${slug}`, 3600, JSON.stringify(product));

// Rate limit: Login brute-force koruması
// Key: ratelimit:login:{ip}  TTL: 15 dakika
// Max: 5 deneme / 15 dakika

// Session/Token blacklist: Logout edilen JWT'ler
// Key: blacklist:{jti}  TTL: Token'ın kalan süresi

// KURALLAR:
// - Key formatı: {namespace}:{identifier}
// - TTL her zaman set edilir (sonsuz cache yasak)
// - JSON.parse/stringify için try-catch yaz
// - Redis bağlantısı kesilirse uygulama ÇÖKMEMELI (graceful degradation)
```

---

## BÖLÜM 3.5 — ARAMA (Meilisearch)

```typescript
// Index konfigürasyonu — search.service.ts içinde

const PRODUCTS_INDEX_CONFIG = {
  searchableAttributes: [
    'name',           // En yüksek öncelik
    'description',
    'categoryName',
    'supplierName',
    'tags',
  ],
  filterableAttributes: [
    'categoryId',
    'supplierId',
    'isActive',
    'isApproved',
    'currency',
  ],
  sortableAttributes: [
    'basePrice',
    'createdAt',
    'rating',
    'totalSales',
  ],
  faceting: {
    maxValuesPerFacet: 100,
  },
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  },
};

// Senkronizasyon tetikleyicileri:
// - products.service.ts → create → BullMQ job → search.service.addDocument()
// - products.service.ts → update → BullMQ job → search.service.updateDocument()
// - products.service.ts → delete → BullMQ job → search.service.deleteDocument()
```

---

## BÖLÜM 3.6 — JOB QUEUE (BullMQ)

```typescript
// Queue tanımları — apps/api/src/modules/notifications/

// KUYRUKLAR:
export const QUEUES = {
  EMAIL:         'email',
  NOTIFICATIONS: 'notifications',
  INVENTORY:     'inventory',
  SEARCH_SYNC:   'search-sync',
  REPORTS:       'reports',
} as const;

// JOB TİPLERİ:
export const JOB_TYPES = {
  // Email queue
  ORDER_CONFIRMATION:   'order-confirmation',
  ORDER_SHIPPED:        'order-shipped',
  WELCOME_EMAIL:        'welcome-email',
  PASSWORD_RESET:       'password-reset',
  SUPPLIER_NEW_ORDER:   'supplier-new-order',

  // Search sync queue
  PRODUCT_UPSERT:  'product-upsert',
  PRODUCT_DELETE:  'product-delete',

  // Reports queue
  GENERATE_INVOICE: 'generate-invoice',
} as const;

// Job kullanım örneği:
async function createOrder(data: CreateOrderDto) {
  const order = await this.ordersRepository.create(data);

  // Async işlemler — kullanıcıyı bekletme
  await this.emailQueue.add(JOB_TYPES.ORDER_CONFIRMATION, {
    orderId: order.id,
    buyerEmail: buyer.email,
  }, {
    attempts: 3,        // 3 deneme hakkı
    backoff: { type: 'exponential', delay: 2000 },
  });

  return order;
}

// KURAL: Job'lar idempotent olmalı
// Aynı job 2 kez çalışırsa 2 kez email gönderilmemeli
// Job ID'leri unique yaparak sağlanır:
await queue.add(type, data, { jobId: `order-confirm-${orderId}` });
```

---

## BÖLÜM 3.7 — ÖDEME (iyzico)

```typescript
// Ödeme akışı — payments.service.ts

// 1. INITIALIZE (Frontend iyzico form'unu başlatır)
async initializePayment(userId: string, dto: InitPaymentDto) {
  const order = await this.ordersService.create(userId, dto);

  const request = {
    locale: Locale.TR,
    conversationId: order.id,
    price: order.totalAmount.toString(),
    paidPrice: order.totalAmount.toString(),
    currency: Currency.TRY,
    basketId: order.id,
    paymentGroup: PaymentGroup.PRODUCT,
    callbackUrl: `${process.env.API_URL}/api/v1/payments/callback`,
    buyer: { /* kullanıcı bilgileri */ },
    shippingAddress: { /* ... */ },
    billingAddress: { /* ... */ },
    basketItems: order.items.map(item => ({
      id: item.productId,
      name: item.productName,
      category1: item.categoryName,
      itemType: BasketItemType.PHYSICAL,
      price: item.totalPrice.toString(),
    })),
  };

  const result = await CheckoutFormInitialize.create(request, this.iyzicoOptions);
  return { checkoutFormContent: result.checkoutFormContent, token: result.token };
}

// 2. WEBHOOK (iyzico callback — İMZA DOĞRULA)
async handleWebhook(token: string, signature: string) {
  // 1. İmzayı doğrula — doğrulanmadan hiçbir işlem yapma
  const isValid = this.verifySignature(token, signature);
  if (!isValid) throw new UnauthorizedException('Geçersiz webhook imzası');

  // 2. Idempotency kontrolü — aynı token tekrar işlenmesin
  const processed = await this.redis.get(`webhook:${token}`);
  if (processed) return { status: 'already_processed' };

  // 3. iyzico'dan sonucu sorgula
  const result = await CheckoutFormRetrieve.retrieve({ token }, this.iyzicoOptions);

  // 4. Transaction içinde işle
  await this.prisma.$transaction(async (tx) => {
    if (result.paymentStatus === 'SUCCESS') {
      await tx.order.update({
        where: { id: result.conversationId },
        data: { status: 'CONFIRMED', paymentStatus: 'SUCCESS' },
      });
      // Stok düş, bildirim gönder (BullMQ)
    } else {
      await tx.order.update({
        where: { id: result.conversationId },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });
    }
  });

  // 5. İşlendi olarak işaretle
  await this.redis.setex(`webhook:${token}`, 86400, '1');
}
```

---

## BÖLÜM 3.8 — REAL-TIME (Socket.io)

```typescript
// Namespace ve event tanımları

// Namespace: /notifications
// Bağlantı: JWT ile authenticate

gateway.on('connection', (socket) => {
  const user = socket.data.user; // JWT'den çözülen kullanıcı

  if (user.role === 'SUPPLIER') {
    socket.join(`supplier:${user.supplierId}`);
  }
  socket.join(`user:${user.id}`);
});

// Event listesi:
const SOCKET_EVENTS = {
  // Tedarikçiye
  NEW_ORDER:        'order:new',
  STOCK_LOW:        'stock:low',
  // Alıcıya
  ORDER_STATUS:     'order:status',
  // İkisine de
  NEW_MESSAGE:      'message:new',
  NOTIFICATION:     'notification:new',
} as const;

// Kullanım (service içinde):
this.gateway.server
  .to(`supplier:${supplierId}`)
  .emit(SOCKET_EVENTS.NEW_ORDER, { orderId, orderNumber, totalAmount });
```

---

## BÖLÜM 3.9 — EMAIL (Resend)

```typescript
// Email template'leri — apps/api/src/modules/notifications/templates/

// Tüm email'ler Türkçe
// Template: React Email bileşenleri (önerilen)

async sendOrderConfirmation(data: OrderConfirmationData) {
  await this.resend.emails.send({
    from: 'ToptanNext <noreply@toptannext.com>',
    to: data.buyerEmail,
    subject: `Siparişiniz Alındı — ${data.orderNumber}`,
    react: OrderConfirmationEmail(data), // React Email template
  });
}

// Email tipleri:
// - Hoş geldin (kayıt sonrası)
// - Email doğrulama
// - Şifre sıfırlama
// - Sipariş onayı (alıcıya)
// - Sipariş alındı (tedarikçiye)
// - Sipariş kargoya verildi (alıcıya)
// - Tedarikçi başvurusu onaylandı/reddedildi
// - Düşük stok uyarısı (tedarikçiye)
```

---

## BÖLÜM 3.10 — DOSYA DEPOLAMA (AWS S3)

```typescript
// storage.service.ts

async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
  const key = `${folder}/${cuid()}-${file.originalname}`;

  await this.s3.send(new PutObjectCommand({
    Bucket: this.configService.get('S3_BUCKET_NAME'),
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Public değil — CloudFront üzerinden erişim
  }));

  // CloudFront URL döndür (S3 URL değil)
  return `${this.configService.get('CLOUDFRONT_URL')}/${key}`;
}

// Klasör yapısı:
// products/{productId}/images/
// suppliers/{supplierId}/documents/
// invoices/{orderId}/

// KURALLAR:
// - S3 bucket public DEĞİL
// - Tüm görseller CloudFront üzerinden serve edilir
// - Upload limiti: görsel 5MB, belge 10MB
// - İzin verilen tipler: jpg, jpeg, png, webp (görsel), pdf (belge)
// - Dosya adları sanitize edilir (Türkçe karakter, boşluk temizlenir)
```

---

## BÖLÜM 4.2 — BACKEND TEST KURALLARI

**Unit Test (her service ve repository için zorunlu):**

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let searchService: jest.Mocked<SearchService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            create: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: SearchService,
          useValue: { upsertDocument: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(ProductsRepository);
    searchService = module.get(SearchService);
  });

  describe('create', () => {
    it('tedarikçi onaylı değilse ForbiddenException fırlatmalı', async () => {
      repository.findSupplierById = jest.fn().mockResolvedValue({
        id: 'sup-1',
        isApproved: false,
      });

      await expect(service.create('sup-1', createProductDto))
        .rejects.toThrow(ForbiddenException);
    });

    it('başarılı ürün oluşturma search index güncellenmeli', async () => {
      repository.findSupplierById = jest.fn().mockResolvedValue({ isApproved: true });
      repository.create = jest.fn().mockResolvedValue(mockProduct);

      await service.create('sup-1', createProductDto);

      expect(searchService.upsertDocument).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockProduct.id })
      );
    });
  });
});
```

**Integration Test (her controller için zorunlu):**

```typescript
// products.controller.spec.ts
describe('ProductsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],  // Gerçek modül — test DB
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await seedTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await app.close();
  });

  describe('GET /api/v1/products', () => {
    it('auth olmadan ürün listesi dönmeli', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toMatchObject({
        page: expect.any(Number),
        total: expect.any(Number),
      });
    });

    it('SUPPLIER olmayan kullanıcı ürün oluşturamamalı', async () => {
      const buyerToken = await getTestToken('buyer');

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(validProductDto)
        .expect(403);
    });
  });
});
```

**Test Coverage Hedefleri:**

```
Service katmanı:    minimum %80 coverage
Repository katmanı: minimum %70 coverage
Controller katmanı: minimum %70 coverage
Kritik path'ler (payment, order): minimum %90 coverage
```

---

## BÖLÜM 6 — GÜVENLİK STANDARTLARI

### 6.1 Authentication & Authorization

```typescript
// JWT yapılandırması
// Access token:  15 dakika (kısa ömürlü)
// Refresh token: 30 gün (rotation ile)

// Her korunan endpoint şu guards'ı taşır:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPPLIER)
@Post('products')
create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {}

// currentUser.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user[data] : user;
  },
);

// Resource ownership kontrolü (kritik):
// SUPPLIER kendi ürününü günceller, başkasının ürününü güncelleyemez
async update(productId: string, supplierId: string, dto: UpdateProductDto) {
  const product = await this.repository.findById(productId);
  if (!product) throw new NotFoundException();

  // Ownership kontrolü
  if (product.supplierId !== supplierId) {
    throw new ForbiddenException('Bu ürünü güncelleme yetkiniz yok');
  }
}
```

### 6.2 Input Validasyonu

```typescript
// Tüm input'lar DTO ile valide edilir
// class-validator dekoratörleri kullan

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Ürün adı en az 3 karakter olmalı' })
  @MaxLength(200, { message: 'Ürün adı en fazla 200 karakter olabilir' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Fiyat 0\'dan büyük olmalı' })
  @Max(9_999_999, { message: 'Geçersiz fiyat' })
  basePrice: number;

  @IsString()
  @Matches(/^[a-zA-Z0-9\s,.-]+$/, { message: 'Geçersiz karakter' })
  description: string;
}

// Global ValidationPipe — main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,             // DTO'da olmayan alanları sil
  forbidNonWhitelisted: true,  // Fazla alan varsa 400 dön
  transform: true,             // class-transformer uygula
}));
```

### 6.3 Hassas Veri Kuralları

```typescript
// BU ALANLAR HİÇBİR ZAMAN RESPONSE'A GİREMEZ:
const NEVER_EXPOSE = [
  'passwordHash',
  'taxNumber',        // Tam hali — maskelenmiş hali gösterilebilir
  'refreshToken',
  'emailVerifyToken',
  'passwordResetToken',
] as const;

// user.entity.ts — güvenli entity
export class UserEntity {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
  // passwordHash YOK
  // refreshToken YOK
}

// Prisma select ile garantile:
return this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    role: true,
    isVerified: true,
    // passwordHash: false — BELİRTME BİLE
  },
});
```

### 6.4 Rate Limiting

```typescript
// Nginx seviyesinde (nginx.conf):
// /api/v1/auth/* → 5 req/15 dakika (brute-force koruması)
// /api/v1/* → 100 req/dakika (genel API)
// /api/v1/payments/* → 10 req/dakika

// NestJS seviyesinde (@nestjs/throttler):
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Post('auth/login')
login(@Body() dto: LoginDto) {}
```

---

## BÖLÜM 7.2 — BACKEND PERFORMANS

```typescript
// N+1 sorgusu yasak — her zaman include/select kullan
// ❌ N+1 sorunu
const orders = await this.prisma.order.findMany();
for (const order of orders) {
  const items = await this.prisma.orderItem.findMany({ where: { orderId: order.id } });
  // Her order için ayrı sorgu — N+1!
}

// ✅ Tek sorgu
const orders = await this.prisma.order.findMany({
  include: {
    items: { include: { product: { select: { name: true, images: true } } } },
  },
});

// Pagination zorunluluğu — limit olmadan findMany yasak
async findMany(page = 1, limit = 20) {
  if (limit > 100) limit = 100; // Max 100 kayıt
  return this.prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// Database index'leri — sık sorgulanan alanlar
// @@index([supplierId]) → tedarikçi ürünleri
// @@index([categoryId]) → kategori ürünleri
// @@index([isActive, isApproved]) → aktif ürünler
```

---

## BÖLÜM 13 — MESAJLAŞMA SİSTEMİ (B2B)

ToptanNext'te alıcılar ve tedarikçiler doğrudan mesajlaşabilir.
Bu B2B mesajlaşmanın odak noktasıdır.

```typescript
// Message modeli (schema'da tanımlandı)
// Özellikler:
// - Alıcı → Tedarikçi veya Tedarikçi → Alıcı
// - Ürün veya sipariş bağlamı (opsiyonel)
// - Okundu/okunmadı durumu
// - Real-time Socket.io ile anlık mesaj

// Endpoint'ler:
GET  /api/v1/messages/conversations    → Konuşma listesi
GET  /api/v1/messages/:conversationId  → Konuşma detayı (sayfalı)
POST /api/v1/messages                  → Yeni mesaj gönder
PATCH /api/v1/messages/:id/read        → Okundu işaretle

// Conversation = iki kullanıcı arasındaki tüm mesajlar
// (opsiyonel: ürün veya sipariş bazlı gruplama)
```

---

## BÖLÜM 14 — BACKEND HATA YÖNETİMİ

```typescript
// global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Beklenmeyen bir hata oluştu';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      // ...
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = 409;
        code = 'ALREADY_EXISTS';
        message = 'Bu kayıt zaten mevcut';
      }
    }

    // 500 hataları Sentry'ye gönder
    if (status >= 500) {
      this.logger.error(exception);
      Sentry.captureException(exception);
    }

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }
}
```

---

## BÖLÜM 15 — SWAGGER / API DOKÜMANTASYONU

```typescript
// main.ts — Swagger kurulumu
const config = new DocumentBuilder()
  .setTitle('ToptanNext API')
  .setDescription('B2B Toptan Satış Pazaryeri API Dokümantasyonu')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// Her DTO ve Controller'a Swagger dekoratörleri ekle:
@ApiTags('products')
@Controller('products')
export class ProductsController {}

@ApiProperty({ description: 'Ürün adı', example: 'Pamuklu T-Shirt' })
name: string;
```

---

## BACKEND ORTAM DEĞİŞKENLERİ (apps/api/.env)

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

**Kural:**
- `.env` dosyaları asla git'e commit edilmez
- `.env.example` her uygulama için şablona commit edilir
- NestJS'te `process.env.X` direkt kullanma, `ConfigService.get('X')` kullan

---

## BACKEND TEST ZORUNLULUĞU CHECKLİST

```
[ ] Service unit testleri yazıldı ve geçiyor
[ ] Repository unit testleri yazıldı ve geçiyor
[ ] Controller integration testleri yazıldı ve geçiyor
[ ] Endpoint rollerle korunuyor (@UseGuards doğru)
[ ] Ownership kontrolü yapılıyor (başka kullanıcı kaynağına erişim engellendi)
[ ] Hassas veri (passwordHash vb.) response'da yok
[ ] N+1 sorgu yok (include/select kullanıldı)
[ ] Pagination var (limit olmadan findMany yok)
[ ] Webhook imzası doğrulanıyor
[ ] Job'lar idempotent yazıldı
[ ] Swagger dekoratörleri eklendi
```

*Bu dosya RULES_CORE.md ile birlikte kullanılır.*
