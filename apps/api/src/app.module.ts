import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { SupplierApplicationsModule } from './modules/supplier-applications/supplier-applications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      },
    }),
    ScheduleModule.forRoot(),
    RealtimeModule,
    RedisModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    SectorsModule,
    ProductsModule,
    SupplierApplicationsModule,
    ConversationsModule,
    QuotesModule,
    NotificationsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
