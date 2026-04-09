# ToptanNext — RULES_DATABASE.md
## Veritabanı ve Prisma Standartları

> **AJAN:** Bu dosyayı her schema veya veritabanı görevi öncesinde oku.
> RULES_CORE.md'yi de okumuş olmalısın — bu dosya onu tamamlar.

---

## BÖLÜM 3.3 — VERİTABANI (PostgreSQL + Prisma)

### Prisma Schema Kuralları

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── KURALLAR ───────────────────────────────────────
// 1. ID: String @id @default(cuid()) — UUID değil CUID
// 2. Zaman: createdAt DateTime @default(now()), updatedAt DateTime @updatedAt
// 3. Soft delete: deletedAt DateTime? (hard delete yerine)
// 4. Para: Decimal (Float değil — kayan nokta hatası olur)
// 5. Enum'lar schema'da tanımlanır, TypeScript'e Prisma generate eder
// 6. Index: Sorgulanan tüm alanlar @index veya @@index ile indexlenir
// 7. Unique: Email, slug, taxNumber gibi alanlar @unique
```

---

### Tam Prisma Schema (Referans)

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String    // ASLA response'a koyma
  role         Role      @default(BUYER)
  isVerified   Boolean   @default(false)
  isActive     Boolean   @default(true)
  deletedAt    DateTime?          // Soft delete
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  profile      Profile?
  supplier     Supplier?
  orders       Order[]
  addresses    Address[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")

  @@index([email])
  @@index([role])
  @@map("users")
}

model Supplier {
  id             String   @id @default(cuid())
  userId         String   @unique
  companyName    String
  taxNumber      String   @unique
  taxOffice      String
  taxDocumentUrl String?  // S3 URL
  isApproved     Boolean  @default(false)
  isActive       Boolean  @default(true)
  commissionRate Decimal  @default(0.05) @db.Decimal(5, 4)
  rating         Decimal  @default(0)    @db.Decimal(3, 2)
  totalSales     Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user      User      @relation(fields: [userId], references: [id])
  products  Product[]
  orders    OrderItem[]

  @@index([isApproved])
  @@map("suppliers")
}

model Product {
  id           String   @id @default(cuid())
  supplierId   String
  categoryId   String
  name         String
  slug         String   @unique
  description  String   @db.Text
  basePrice    Decimal  @db.Decimal(12, 2)
  currency     String   @default("TRY")
  minOrderQty  Int      @default(1)
  maxOrderQty  Int?
  unit         String   // "adet", "kg", "metre", "koli"
  isActive     Boolean  @default(true)
  isApproved   Boolean  @default(false)
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  supplier  Supplier        @relation(fields: [supplierId], references: [id])
  category  Category        @relation(fields: [categoryId], references: [id])
  variants  ProductVariant[]
  images    ProductImage[]
  inventory Inventory?
  tags      ProductTag[]

  @@index([supplierId])
  @@index([categoryId])
  @@index([isActive, isApproved])
  @@index([slug])
  @@map("products")
}

model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique // ORD-2024-000001 formatı
  buyerId           String
  status            OrderStatus   @default(PENDING)
  totalAmount       Decimal       @db.Decimal(12, 2)
  currency          String        @default("TRY")
  paymentStatus     PaymentStatus @default(WAITING)
  shippingAddressId String
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  buyer           User      @relation(fields: [buyerId], references: [id])
  items           OrderItem[]
  payment         Payment?
  shippingAddress Address   @relation(fields: [shippingAddressId], references: [id])

  @@index([buyerId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model Message {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  productId  String?  // Ürün hakkındaysa
  orderId    String?  // Sipariş hakkındaysa
  content    String   @db.Text
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender   User  @relation("SentMessages", fields: [senderId], references: [id])
  receiver User  @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([senderId, receiverId])
  @@index([receiverId, isRead])
  @@map("messages")
}

enum Role          { ADMIN SUPPLIER BUYER }
enum OrderStatus   { PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED REFUNDED }
enum PaymentStatus { WAITING SUCCESS FAILED REFUNDED CANCELLED }
```

---

### Prisma Kullanım Kuralları

```typescript
// ─── SELECT HER ZAMAN KULLAN ────────────────────────
// findMany'de tüm alanları çekme
// ❌ Kötü
const products = await prisma.product.findMany();

// ✅ İyi
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    basePrice: true,
    images: { select: { url: true }, take: 1 },
  },
});

// ─── FİNANSAL İŞLEM = TRANSACTION ──────────────────
// Sipariş + stok + ödeme kaydı her zaman transaction'da
async createOrder(data: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: { ... } });
    await tx.inventory.update({
      where: { productId: data.productId },
      data: { stock: { decrement: data.quantity } },
    });
    return order;
  });
}

// ─── SOFT DELETE ────────────────────────────────────
// Hard delete yasak (finansal kayıt bütünlüğü için)
await prisma.product.update({
  where: { id },
  data: { deletedAt: new Date(), isActive: false },
});

// ─── RAW SQL YASAK ──────────────────────────────────
// prisma.$queryRaw → YASAK (zorunlu durumda reviewla)
// prisma.$executeRaw → YASAK

// ─── N+1 YASAK ──────────────────────────────────────
// ❌ N+1 sorunu
const orders = await this.prisma.order.findMany();
for (const order of orders) {
  const items = await this.prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// ✅ Tek sorgu
const orders = await this.prisma.order.findMany({
  include: {
    items: { include: { product: { select: { name: true, images: true } } } },
  },
});

// ─── PAGINATION ZORUNLU ─────────────────────────────
// Limit olmadan findMany yasak
async findMany(page = 1, limit = 20) {
  if (limit > 100) limit = 100; // Max 100 kayıt
  return this.prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// ─── HASSAS VERİ — SELECT'TE ÇIKART ─────────────────
// passwordHash asla response'a girmemeli
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

---

### Migration Kuralları

```bash
# Yeni migration oluştur (development)
pnpm prisma migrate dev --name add_product_variants

# Production migration (CI/CD'de)
pnpm prisma migrate deploy

# Schema'yı sıfırla (SADECE development/test DB)
pnpm prisma migrate reset

# Prisma Client'ı yeniden generate et (schema değişince)
pnpm prisma generate

# Migration adlandırma konvansiyonu:
# add_{model}           → yeni model ekleme
# add_{field}_to_{model} → alana ekleme
# update_{field}_in_{model} → alan değişikliği
# remove_{field}_from_{model} → alan silme
# create_{index}_{model} → index ekleme
```

### Index Stratejisi

```prisma
// Hangi alanlar index'lenmeli?
// ✅ WHERE koşullarında kullanılan alanlar
// ✅ JOIN'lerde kullanılan foreign key'ler
// ✅ ORDER BY'da kullanılan alanlar
// ✅ UNIQUE constraint gereken alanlar

// Composite index — birden fazla alanı birlikte sorguluyorsan
@@index([isActive, isApproved])   // WHERE isActive = true AND isApproved = true
@@index([supplierId, isActive])   // WHERE supplierId = X AND isActive = true

// ❌ Her alana index koyma — yazma performansını düşürür
```

---

## DATABASE TEST VE SEED

```typescript
// Seed dosyası — prisma/seed.ts
// Geliştirme ortamı için örnek veri

async function main() {
  // Admin kullanıcı
  await prisma.user.upsert({
    where: { email: 'admin@toptannext.com' },
    update: {},
    create: {
      email: 'admin@toptannext.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Test tedarikçi
  await prisma.user.upsert({
    where: { email: 'supplier@test.com' },
    update: {},
    create: {
      email: 'supplier@test.com',
      passwordHash: await bcrypt.hash('Test123!', 10),
      role: 'SUPPLIER',
      isVerified: true,
      supplier: {
        create: {
          companyName: 'Test Tekstil A.Ş.',
          taxNumber: '1234567890',
          taxOffice: 'Kadıköy',
          isApproved: true,
        },
      },
    },
  });
}

// Test DB temizleme (integration testlerinde)
async function cleanTestDatabase() {
  // Cascade order'ı önemli — foreign key'lere dikkat
  await prisma.message.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
}
```

---

## DATABASE CHECKLİST

```
[ ] Yeni model için CUID id kullanıldı
[ ] createdAt ve updatedAt eklendi
[ ] Soft delete için deletedAt DateTime? eklendi (finansal modeller)
[ ] Para alanları Decimal olarak tanımlandı (Float değil)
[ ] Sorgulanan tüm alanlar @@index ile indexlendi
[ ] Unique alanlar @unique ile işaretlendi
[ ] Migration adı konvansiyona uygun
[ ] pnpm prisma migrate dev çalıştırıldı
[ ] pnpm prisma generate çalıştırıldı
[ ] Seed verisi güncellendi (gerekiyorsa)
[ ] Foreign key relation'ları doğru tanımlandı
[ ] passwordHash gibi hassas alanlar select'ten çıkarıldı
[ ] Transaction kullanılan yerlerde $transaction yazıldı
[ ] Raw SQL ($queryRaw, $executeRaw) kullanılmadı
```

*Bu dosya RULES_CORE.md ile birlikte kullanılır.*
