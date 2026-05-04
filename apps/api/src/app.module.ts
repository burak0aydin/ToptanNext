import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { LogisticsApplicationsModule } from './modules/logistics-applications/logistics-applications.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentCardsModule } from './modules/payment-cards/payment-cards.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { SupplierApplicationsModule } from './modules/supplier-applications/supplier-applications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';

const redisUrl = process.env.REDIS_URL?.trim();
const bullImports = redisUrl
  ? [
      BullModule.forRoot({
        connection: {
          url: redisUrl,
        },
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...bullImports,
    ScheduleModule.forRoot(),
    RealtimeModule,
    RedisModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    PaymentCardsModule,
    CartModule,
    CategoriesModule,
    SectorsModule,
    ProductsModule,
    SupplierApplicationsModule,
    LogisticsApplicationsModule,
    ConversationsModule,
    QuotesModule,
    NotificationsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
