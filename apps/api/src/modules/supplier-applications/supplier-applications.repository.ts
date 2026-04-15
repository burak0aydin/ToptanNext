import { SupplierCompanyType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type SupplierApplicationReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
  city: string;
  district: string;
  referenceCode: string | null;
  companyIban: string | null;
  kepAddress: string | null;
  isEInvoiceTaxpayer: boolean | null;
  businessPhone: string | null;
  headquartersAddress: string | null;
  warehouseSameAsHeadquarters: boolean | null;
  warehouseAddress: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  reviewStatus: SupplierApplicationReviewStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SupplierApplicationAdminListItem = {
  id: string;
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  reviewStatus: SupplierApplicationReviewStatus;
  reviewNote: string | null;
  contactEmail: string | null;
  userEmail: string;
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
  city: string;
  district: string;
  referenceCode: string | null;
};

export type UpsertSupplierApplicationContactFinanceInput = {
  userId: string;
  companyIban: string;
  kepAddress: string;
  isEInvoiceTaxpayer: boolean;
  businessPhone: string;
  headquartersAddress: string;
  warehouseSameAsHeadquarters: boolean;
  warehouseAddress: string;
  contactFirstName: string;
  contactLastName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
};

export type UpdateSupplierApplicationReviewInput = {
  status: SupplierApplicationReviewStatus;
  reviewNote: string | null;
};

@Injectable()
export class SupplierApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly baseSelect = {
    id: true,
    userId: true,
    companyName: true,
    companyType: true,
    vknOrTckn: true,
    taxOffice: true,
    mersisNo: true,
    tradeRegistryNo: true,
    activitySector: true,
    city: true,
    district: true,
    referenceCode: true,
    companyIban: true,
    kepAddress: true,
    isEInvoiceTaxpayer: true,
    businessPhone: true,
    headquartersAddress: true,
    warehouseSameAsHeadquarters: true,
    warehouseAddress: true,
    contactFirstName: true,
    contactLastName: true,
    contactRole: true,
    contactPhone: true,
    contactEmail: true,
    reviewStatus: true,
    reviewNote: true,
    reviewedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findByUserId(
    userId: string,
  ): Promise<SupplierApplicationRecord | null> {
    return this.prisma.supplierApplication.findUnique({
      where: { userId },
      select: this.baseSelect,
    });
  }

  async findById(id: string): Promise<SupplierApplicationRecord | null> {
    return this.prisma.supplierApplication.findUnique({
      where: { id },
      select: this.baseSelect,
    });
  }

  async findManyForAdmin(): Promise<SupplierApplicationAdminListItem[]> {
    const applications = await this.prisma.supplierApplication.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        userId: true,
        companyName: true,
        companyType: true,
        vknOrTckn: true,
        reviewStatus: true,
        reviewNote: true,
        contactEmail: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return applications.map((application) => ({
      id: application.id,
      userId: application.userId,
      companyName: application.companyName,
      companyType: application.companyType,
      vknOrTckn: application.vknOrTckn,
      reviewStatus: application.reviewStatus,
      reviewNote: application.reviewNote,
      contactEmail: application.contactEmail,
      userEmail: application.user.email,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    }));
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
        city: input.city,
        district: input.district,
        referenceCode: input.referenceCode,
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
        city: input.city,
        district: input.district,
        referenceCode: input.referenceCode,
      },
      select: this.baseSelect,
    });
  }

  async upsertContactFinanceByUserId(
    input: UpsertSupplierApplicationContactFinanceInput,
  ): Promise<SupplierApplicationRecord> {
    const updated = await this.prisma.supplierApplication.update({
      where: { userId: input.userId },
      data: {
        companyIban: input.companyIban,
        kepAddress: input.kepAddress,
        isEInvoiceTaxpayer: input.isEInvoiceTaxpayer,
        businessPhone: input.businessPhone,
        headquartersAddress: input.headquartersAddress,
        warehouseSameAsHeadquarters: input.warehouseSameAsHeadquarters,
        warehouseAddress: input.warehouseAddress,
        contactFirstName: input.contactFirstName,
        contactLastName: input.contactLastName,
        contactRole: input.contactRole,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
      } as never,
      select: this.baseSelect as never,
    });

    return updated as unknown as SupplierApplicationRecord;
  }

  async updateReviewById(
    id: string,
    input: UpdateSupplierApplicationReviewInput,
  ): Promise<SupplierApplicationRecord> {
    const updated = await this.prisma.supplierApplication.update({
      where: { id },
      data: {
        reviewStatus: input.status,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      } as never,
      select: this.baseSelect as never,
    });

    return updated as unknown as SupplierApplicationRecord;
  }
}
