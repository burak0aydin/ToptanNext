import { Injectable } from '@nestjs/common';
import { UpsertSupplierApplicationDto } from './dto/upsert-supplier-application.dto';
import {
  SupplierApplicationRecord,
  SupplierApplicationsRepository,
} from './supplier-applications.repository';

@Injectable()
export class SupplierApplicationsService {
  constructor(
    private readonly supplierApplicationsRepository: SupplierApplicationsRepository,
  ) {}

  async findByUserId(userId: string): Promise<SupplierApplicationRecord | null> {
    return this.supplierApplicationsRepository.findByUserId(userId);
  }

  async upsertForUser(
    userId: string,
    dto: UpsertSupplierApplicationDto,
  ): Promise<SupplierApplicationRecord> {
    return this.supplierApplicationsRepository.upsertByUserId({
      userId,
      companyName: dto.companyName.trim(),
      companyType: dto.companyType,
      vknOrTckn: dto.vknOrTckn.trim(),
      taxOffice: dto.taxOffice.trim(),
      mersisNo: dto.mersisNo.trim(),
      tradeRegistryNo: this.normalizeOptionalText(dto.tradeRegistryNo),
      activitySector: dto.activitySector.trim(),
    });
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
