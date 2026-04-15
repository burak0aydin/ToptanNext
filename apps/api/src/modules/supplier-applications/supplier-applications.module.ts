import { Module } from '@nestjs/common';
import { SupplierApplicationsController } from './supplier-applications.controller';
import { SupplierApplicationsRepository } from './supplier-applications.repository';
import { SupplierApplicationsService } from './supplier-applications.service';

@Module({
  controllers: [SupplierApplicationsController],
  providers: [SupplierApplicationsRepository, SupplierApplicationsService],
})
export class SupplierApplicationsModule {}
