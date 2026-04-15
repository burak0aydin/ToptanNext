import { SupplierCompanyType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SupplierApplicationRecord = {
  id: string;
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  activitySector: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertSupplierApplicationInput = {
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  activitySector: string;
};

@Injectable()
export class SupplierApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SupplierApplicationRecord | null> {
    return this.prisma.supplierApplication.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        companyName: true,
        companyType: true,
        vknOrTckn: true,
        taxOffice: true,
        mersisNo: true,
        tradeRegistryNo: true,
        activitySector: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async upsertByUserId(
    input: UpsertSupplierApplicationInput,
  ): Promise<SupplierApplicationRecord> {
    return this.prisma.supplierApplication.upsert({
      where: { userId: input.userId },
      update: {
        companyName: input.companyName,
        companyType: input.companyType,
        vknOrTckn: input.vknOrTckn,
        taxOffice: input.taxOffice,
        mersisNo: input.mersisNo,
        tradeRegistryNo: input.tradeRegistryNo,
        activitySector: input.activitySector,
      },
      create: {
        userId: input.userId,
        companyName: input.companyName,
        companyType: input.companyType,
        vknOrTckn: input.vknOrTckn,
        taxOffice: input.taxOffice,
        mersisNo: input.mersisNo,
        tradeRegistryNo: input.tradeRegistryNo,
        activitySector: input.activitySector,
      },
      select: {
        id: true,
        userId: true,
        companyName: true,
        companyType: true,
        vknOrTckn: true,
        taxOffice: true,
        mersisNo: true,
        tradeRegistryNo: true,
        activitySector: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
