import {
  LogisticsApplicationDocumentType,
  LogisticsApplicationReviewStatus,
  LogisticsAuthorizationDocumentType,
  LogisticsFleetCapacity,
  LogisticsMainServiceType,
  LogisticsServiceRegion,
  SupplierCompanyType,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type LogisticsApplicationRecord = {
  id: string;
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  city: string;
  district: string;
  referenceCode: string | null;
  logisticsAuthorizationDocumentType: LogisticsAuthorizationDocumentType;
  mainServiceTypes: LogisticsMainServiceType[];
  companyIban: string | null;
  kepAddress: string | null;
  isEInvoiceTaxpayer: boolean | null;
  businessPhone: string | null;
  headquartersAddress: string | null;
  serviceRegions: LogisticsServiceRegion[];
  fleetCapacity: LogisticsFleetCapacity | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  reviewStatus: LogisticsApplicationReviewStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  approvedSupplierAgreement: boolean;
  approvedKvkkAgreement: boolean;
  approvedCommercialMessage: boolean;
  documents: LogisticsApplicationDocumentRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type LogisticsApplicationDocumentRecord = {
  id: string;
  documentType: LogisticsApplicationDocumentType;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
};

export type LogisticsApplicationDocumentFileRecord = {
  id: string;
  logisticsApplicationId: string;
  documentType: LogisticsApplicationDocumentType;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
};

export type LogisticsApplicationAdminListItem = {
  id: string;
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  logisticsAuthorizationDocumentType: LogisticsAuthorizationDocumentType;
  mainServiceTypes: LogisticsMainServiceType[];
  reviewStatus: LogisticsApplicationReviewStatus;
  reviewNote: string | null;
  contactEmail: string | null;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertLogisticsApplicationInput = {
  userId: string;
  companyName: string;
  companyType: SupplierCompanyType;
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  city: string;
  district: string;
  referenceCode: string | null;
  logisticsAuthorizationDocumentType: LogisticsAuthorizationDocumentType;
  mainServiceTypes: LogisticsMainServiceType[];
};

export type UpsertLogisticsApplicationContactFinanceInput = {
  userId: string;
  companyIban: string;
  kepAddress: string;
  isEInvoiceTaxpayer: boolean;
  businessPhone: string;
  headquartersAddress: string;
  serviceRegions: LogisticsServiceRegion[];
  fleetCapacity: LogisticsFleetCapacity;
  contactFirstName: string;
  contactLastName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
};

export type UpdateLogisticsApplicationReviewInput = {
  status: LogisticsApplicationReviewStatus;
  reviewNote: string | null;
};

export type LogisticsApplicationUploadedDocumentInput = {
  documentType: LogisticsApplicationDocumentType;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
};

export type UpsertLogisticsApplicationDocumentsInput = {
  userId: string;
  approvedSupplierAgreement: boolean;
  approvedKvkkAgreement: boolean;
  approvedCommercialMessage: boolean;
  documents: LogisticsApplicationUploadedDocumentInput[];
};

@Injectable()
export class LogisticsApplicationsRepository {
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
    city: true,
    district: true,
    referenceCode: true,
    logisticsAuthorizationDocumentType: true,
    mainServiceTypes: true,
    companyIban: true,
    kepAddress: true,
    isEInvoiceTaxpayer: true,
    businessPhone: true,
    headquartersAddress: true,
    serviceRegions: true,
    fleetCapacity: true,
    contactFirstName: true,
    contactLastName: true,
    contactRole: true,
    contactPhone: true,
    contactEmail: true,
    reviewStatus: true,
    reviewNote: true,
    reviewedAt: true,
    approvedSupplierAgreement: true,
    approvedKvkkAgreement: true,
    approvedCommercialMessage: true,
    documents: {
      select: {
        id: true,
        documentType: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    },
    createdAt: true,
    updatedAt: true,
  } as const;

  async findByUserId(
    userId: string,
  ): Promise<LogisticsApplicationRecord | null> {
    return this.prisma.logisticsApplication.findUnique({
      where: { userId },
      select: this.baseSelect,
    });
  }

  async findById(id: string): Promise<LogisticsApplicationRecord | null> {
    return this.prisma.logisticsApplication.findUnique({
      where: { id },
      select: this.baseSelect,
    });
  }

  async findManyForAdmin(): Promise<LogisticsApplicationAdminListItem[]> {
    const applications = await this.prisma.logisticsApplication.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        userId: true,
        companyName: true,
        companyType: true,
        vknOrTckn: true,
        logisticsAuthorizationDocumentType: true,
        mainServiceTypes: true,
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
      logisticsAuthorizationDocumentType:
        application.logisticsAuthorizationDocumentType,
      mainServiceTypes: application.mainServiceTypes,
      reviewStatus: application.reviewStatus,
      reviewNote: application.reviewNote,
      contactEmail: application.contactEmail,
      userEmail: application.user.email,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    }));
  }

  async upsertByUserId(
    input: UpsertLogisticsApplicationInput,
  ): Promise<LogisticsApplicationRecord> {
    return this.prisma.logisticsApplication.upsert({
      where: { userId: input.userId },
      update: {
        companyName: input.companyName,
        companyType: input.companyType,
        vknOrTckn: input.vknOrTckn,
        taxOffice: input.taxOffice,
        mersisNo: input.mersisNo,
        tradeRegistryNo: input.tradeRegistryNo,
        city: input.city,
        district: input.district,
        referenceCode: input.referenceCode,
        logisticsAuthorizationDocumentType:
          input.logisticsAuthorizationDocumentType,
        mainServiceTypes: input.mainServiceTypes,
      },
      create: {
        userId: input.userId,
        companyName: input.companyName,
        companyType: input.companyType,
        vknOrTckn: input.vknOrTckn,
        taxOffice: input.taxOffice,
        mersisNo: input.mersisNo,
        tradeRegistryNo: input.tradeRegistryNo,
        city: input.city,
        district: input.district,
        referenceCode: input.referenceCode,
        logisticsAuthorizationDocumentType:
          input.logisticsAuthorizationDocumentType,
        mainServiceTypes: input.mainServiceTypes,
      },
      select: this.baseSelect,
    });
  }

  async upsertContactFinanceByUserId(
    input: UpsertLogisticsApplicationContactFinanceInput,
  ): Promise<LogisticsApplicationRecord> {
    const updated = await this.prisma.logisticsApplication.update({
      where: { userId: input.userId },
      data: {
        companyIban: input.companyIban,
        kepAddress: input.kepAddress,
        isEInvoiceTaxpayer: input.isEInvoiceTaxpayer,
        businessPhone: input.businessPhone,
        headquartersAddress: input.headquartersAddress,
        serviceRegions: input.serviceRegions,
        fleetCapacity: input.fleetCapacity,
        contactFirstName: input.contactFirstName,
        contactLastName: input.contactLastName,
        contactRole: input.contactRole,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
      },
      select: this.baseSelect,
    });

    return updated;
  }

  async updateReviewById(
    id: string,
    input: UpdateLogisticsApplicationReviewInput,
  ): Promise<LogisticsApplicationRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const reviewedApplication = await tx.logisticsApplication.update({
        where: { id },
        data: {
          reviewStatus: input.status,
          reviewNote: input.reviewNote,
          reviewedAt: new Date(),
        },
        select: {
          userId: true,
        },
      });

      if (input.status === 'APPROVED') {
        await tx.user.update({
          where: { id: reviewedApplication.userId },
          data: { isLogisticsPartner: true },
        });
      }

      if (input.status === 'REJECTED') {
        await tx.user.update({
          where: { id: reviewedApplication.userId },
          data: { isLogisticsPartner: false },
        });
      }

      return tx.logisticsApplication.findUniqueOrThrow({
        where: { id },
        select: this.baseSelect,
      });
    });

    return updated;
  }

  async upsertDocumentsAndAgreementsByUserId(
    input: UpsertLogisticsApplicationDocumentsInput,
  ): Promise<LogisticsApplicationRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const currentApplication = await tx.logisticsApplication.findUniqueOrThrow({
        where: { userId: input.userId },
        select: {
          id: true,
          reviewStatus: true,
        },
      });

      const application = await tx.logisticsApplication.update({
        where: { userId: input.userId },
        data: {
          approvedSupplierAgreement: input.approvedSupplierAgreement,
          approvedKvkkAgreement: input.approvedKvkkAgreement,
          approvedCommercialMessage: input.approvedCommercialMessage,
          ...(currentApplication.reviewStatus === 'REJECTED'
            ? {
                reviewStatus: 'PENDING',
                reviewNote: null,
                reviewedAt: null,
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      for (const document of input.documents) {
        await tx.logisticsApplicationDocument.upsert({
          where: {
            logisticsApplicationId_documentType: {
              logisticsApplicationId: application.id,
              documentType: document.documentType,
            },
          },
          create: {
            logisticsApplicationId: application.id,
            documentType: document.documentType,
            originalName: document.originalName,
            filePath: document.filePath,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
          },
          update: {
            originalName: document.originalName,
            filePath: document.filePath,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
            uploadedAt: new Date(),
          },
        });
      }

      return tx.logisticsApplication.findUniqueOrThrow({
        where: { userId: input.userId },
        select: this.baseSelect,
      });
    });

    return updated;
  }

  async findDocumentByUserIdAndType(
    userId: string,
    documentType: LogisticsApplicationDocumentType,
  ): Promise<LogisticsApplicationDocumentFileRecord | null> {
    return this.prisma.logisticsApplicationDocument.findFirst({
      where: {
        documentType,
        logisticsApplication: {
          userId,
        },
      },
      select: {
        id: true,
        logisticsApplicationId: true,
        documentType: true,
        originalName: true,
        filePath: true,
        mimeType: true,
        fileSize: true,
        uploadedAt: true,
      },
    });
  }

  async findDocumentByApplicationIdAndType(
    logisticsApplicationId: string,
    documentType: LogisticsApplicationDocumentType,
  ): Promise<LogisticsApplicationDocumentFileRecord | null> {
    return this.prisma.logisticsApplicationDocument.findUnique({
      where: {
        logisticsApplicationId_documentType: {
          logisticsApplicationId,
          documentType,
        },
      },
      select: {
        id: true,
        logisticsApplicationId: true,
        documentType: true,
        originalName: true,
        filePath: true,
        mimeType: true,
        fileSize: true,
        uploadedAt: true,
      },
    });
  }
}
