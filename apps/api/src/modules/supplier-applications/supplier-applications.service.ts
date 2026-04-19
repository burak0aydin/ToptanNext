import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ReviewSupplierApplicationDto } from './dto/review-supplier-application.dto';
import { UpsertSupplierApplicationContactFinanceDto } from './dto/upsert-supplier-application-contact-finance.dto';
import { UpsertSupplierApplicationDocumentsDto } from './dto/upsert-supplier-application-documents.dto';
import { UpsertSupplierApplicationDto } from './dto/upsert-supplier-application.dto';
import {
  SupplierApplicationDocumentFileRecord,
  SupplierApplicationAdminListItem,
  SupplierApplicationRecord,
  SupplierApplicationUploadedDocumentInput,
  SupplierApplicationsRepository,
} from './supplier-applications.repository';

type SupplierApplicationDocumentType =
  | 'TAX_CERTIFICATE'
  | 'SIGNATURE_CIRCULAR'
  | 'TRADE_REGISTRY_GAZETTE'
  | 'ACTIVITY_CERTIFICATE';

export const supplierApplicationDocumentFieldMap = {
  taxCertificate: 'TAX_CERTIFICATE',
  signatureCircular: 'SIGNATURE_CIRCULAR',
  tradeRegistryGazette: 'TRADE_REGISTRY_GAZETTE',
  activityCertificate: 'ACTIVITY_CERTIFICATE',
} as const;

export type SupplierApplicationDocumentFieldName =
  keyof typeof supplierApplicationDocumentFieldMap;

export type UploadedSupplierApplicationDocument = {
  fieldName: SupplierApplicationDocumentFieldName;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
};

@Injectable()
export class SupplierApplicationsService {
  constructor(
    private readonly supplierApplicationsRepository: SupplierApplicationsRepository,
  ) {}

  async findByUserId(
    userId: string,
  ): Promise<SupplierApplicationRecord | null> {
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
      city: dto.city.trim(),
      district: dto.district.trim(),
      referenceCode: this.normalizeOptionalText(dto.referenceCode),
    });
  }

  async upsertContactFinanceForUser(
    userId: string,
    dto: UpsertSupplierApplicationContactFinanceDto,
  ): Promise<SupplierApplicationRecord> {
    const existing =
      await this.supplierApplicationsRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Önce şirket kimlik bilgileri adımını tamamlayınız.',
      );
    }

    const warehouseAddress = dto.warehouseAddress.trim();
    if (!dto.warehouseSameAsHeadquarters && warehouseAddress.length === 0) {
      throw new BadRequestException(
        'Sevkiyat / iade depo adresi alanı zorunludur.',
      );
    }

    return this.supplierApplicationsRepository.upsertContactFinanceByUserId({
      userId,
      companyIban: dto.companyIban.trim(),
      kepAddress: dto.kepAddress.trim(),
      isEInvoiceTaxpayer: dto.isEInvoiceTaxpayer,
      businessPhone: dto.businessPhone.trim(),
      headquartersAddress: dto.headquartersAddress.trim(),
      warehouseSameAsHeadquarters: dto.warehouseSameAsHeadquarters,
      warehouseAddress: dto.warehouseSameAsHeadquarters
        ? dto.headquartersAddress.trim()
        : warehouseAddress,
      contactFirstName: dto.contactFirstName.trim(),
      contactLastName: dto.contactLastName.trim(),
      contactRole: dto.contactRole.trim(),
      contactPhone: dto.contactPhone.trim(),
      contactEmail: dto.contactEmail.trim(),
    });
  }

  async findManyForAdmin(): Promise<SupplierApplicationAdminListItem[]> {
    return this.supplierApplicationsRepository.findManyForAdmin();
  }

  async reviewByAdmin(
    id: string,
    dto: ReviewSupplierApplicationDto,
  ): Promise<SupplierApplicationRecord> {
    const existing = await this.supplierApplicationsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Tedarikçi başvurusu bulunamadı.');
    }

    const normalizedReviewNote = this.normalizeOptionalText(dto.reviewNote);
    if (dto.status === 'REJECTED' && !normalizedReviewNote) {
      throw new BadRequestException(
        'Başvuruyu reddetmek için red nedeni yazmanız zorunludur.',
      );
    }

    return this.supplierApplicationsRepository.updateReviewById(id, {
      status: dto.status,
      reviewNote: normalizedReviewNote,
    });
  }

  async findByIdForAdmin(id: string): Promise<SupplierApplicationRecord> {
    const application = await this.supplierApplicationsRepository.findById(id);

    if (!application) {
      throw new NotFoundException('Tedarikçi başvurusu bulunamadı.');
    }

    return application;
  }

  async upsertDocumentsForUser(
    userId: string,
    dto: UpsertSupplierApplicationDocumentsDto,
    uploadedDocuments: UploadedSupplierApplicationDocument[],
  ): Promise<SupplierApplicationRecord> {
    if (!dto.approvedSupplierAgreement) {
      throw new BadRequestException(
        'Tedarikçi iş ortaklığı sözleşmesini onaylamalısınız.',
      );
    }

    if (!dto.approvedKvkkAgreement) {
      throw new BadRequestException('KVKK aydınlatma metnini onaylamalısınız.');
    }

    const existing =
      await this.supplierApplicationsRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Önce şirket kimlik bilgileri adımını tamamlayınız.',
      );
    }

    const documentsToUpsert = uploadedDocuments.map(
      (document): SupplierApplicationUploadedDocumentInput => ({
        documentType: supplierApplicationDocumentFieldMap[document.fieldName],
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        filePath: document.filePath,
      }),
    );

    const previousFilePathByType = new Map<
      SupplierApplicationDocumentType,
      string
    >();

    for (const document of documentsToUpsert) {
      const previous =
        await this.supplierApplicationsRepository.findDocumentByUserIdAndType(
          userId,
          document.documentType,
        );
      if (previous) {
        previousFilePathByType.set(document.documentType, previous.filePath);
      }
    }

    const updated =
      await this.supplierApplicationsRepository.upsertDocumentsAndAgreementsByUserId(
        {
          userId,
          approvedSupplierAgreement: dto.approvedSupplierAgreement,
          approvedKvkkAgreement: dto.approvedKvkkAgreement,
          approvedCommercialMessage: dto.approvedCommercialMessage,
          documents: documentsToUpsert,
        },
      );

    for (const document of documentsToUpsert) {
      const previousFilePath = previousFilePathByType.get(
        document.documentType,
      );
      if (!previousFilePath || previousFilePath === document.filePath) {
        continue;
      }

      await this.removeFileIfExists(previousFilePath);
    }

    return updated;
  }

  async getMyDocumentByType(
    userId: string,
    documentType: SupplierApplicationDocumentType,
  ): Promise<SupplierApplicationDocumentFileRecord> {
    const document =
      await this.supplierApplicationsRepository.findDocumentByUserIdAndType(
        userId,
        documentType,
      );

    if (!document) {
      throw new NotFoundException('Belge bulunamadı.');
    }

    return document;
  }

  async getAdminDocumentByType(
    supplierApplicationId: string,
    documentType: SupplierApplicationDocumentType,
  ): Promise<SupplierApplicationDocumentFileRecord> {
    const existing = await this.supplierApplicationsRepository.findById(
      supplierApplicationId,
    );

    if (!existing) {
      throw new NotFoundException('Tedarikçi başvurusu bulunamadı.');
    }

    const document =
      await this.supplierApplicationsRepository.findDocumentByApplicationIdAndType(
        supplierApplicationId,
        documentType,
      );

    if (!document) {
      throw new NotFoundException('Belge bulunamadı.');
    }

    return document;
  }

  resolveDocumentAbsolutePath(filePath: string): string {
    if (typeof filePath !== 'string' || filePath.trim().length === 0) {
      return '';
    }

    const normalizedInputPath = filePath.trim();

    if (!path.isAbsolute(normalizedInputPath)) {
      return path.join(process.cwd(), normalizedInputPath);
    }

    if (existsSync(normalizedInputPath)) {
      return normalizedInputPath;
    }

    const normalized = normalizedInputPath.replace(/\\/g, '/');
    const marker = '/uploads/supplier-documents/';
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex === -1) {
      return normalizedInputPath;
    }

    const relativeTail = normalized.slice(markerIndex + marker.length);

    const candidates = [
      path.join(process.cwd(), 'uploads', 'supplier-documents', relativeTail),
      path.join(
        process.cwd(),
        'apps',
        'api',
        'uploads',
        'supplier-documents',
        relativeTail,
      ),
      path.join(
        process.cwd(),
        '..',
        'apps',
        'api',
        'uploads',
        'supplier-documents',
        relativeTail,
      ),
    ];

    const foundCandidate = candidates.find((candidatePath) =>
      existsSync(candidatePath),
    );

    return foundCandidate ?? candidates[0];
  }

  private async removeFileIfExists(filePath: string): Promise<void> {
    const absolutePath = this.resolveDocumentAbsolutePath(filePath);

    try {
      await fs.unlink(absolutePath);
    } catch {
      // Ignore missing files during replacement cleanup.
    }
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
