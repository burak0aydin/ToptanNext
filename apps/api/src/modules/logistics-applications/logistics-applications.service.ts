import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogisticsApplicationDocumentType } from '@prisma/client';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ReviewLogisticsApplicationDto } from './dto/review-logistics-application.dto';
import { UpsertLogisticsApplicationContactFinanceDto } from './dto/upsert-logistics-application-contact-finance.dto';
import { UpsertLogisticsApplicationDocumentsDto } from './dto/upsert-logistics-application-documents.dto';
import { UpsertLogisticsApplicationDto } from './dto/upsert-logistics-application.dto';
import {
  LogisticsApplicationAdminListItem,
  LogisticsApplicationDocumentFileRecord,
  LogisticsApplicationRecord,
  LogisticsApplicationUploadedDocumentInput,
  LogisticsApplicationsRepository,
} from './logistics-applications.repository';

export const logisticsApplicationDocumentFieldMap = {
  taxCertificate: 'TAX_CERTIFICATE',
  signatureCircular: 'SIGNATURE_CIRCULAR',
  tradeRegistryGazette: 'TRADE_REGISTRY_GAZETTE',
  activityCertificate: 'ACTIVITY_CERTIFICATE',
  transportLicense: 'TRANSPORT_LICENSE',
} as const;

export type LogisticsApplicationDocumentFieldName =
  keyof typeof logisticsApplicationDocumentFieldMap;

export type UploadedLogisticsApplicationDocument = {
  fieldName: LogisticsApplicationDocumentFieldName;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
};

@Injectable()
export class LogisticsApplicationsService {
  constructor(
    private readonly logisticsApplicationsRepository: LogisticsApplicationsRepository,
  ) {}

  async findByUserId(
    userId: string,
  ): Promise<LogisticsApplicationRecord | null> {
    return this.logisticsApplicationsRepository.findByUserId(userId);
  }

  async upsertForUser(
    userId: string,
    dto: UpsertLogisticsApplicationDto,
  ): Promise<LogisticsApplicationRecord> {
    const existing = await this.logisticsApplicationsRepository.findByUserId(userId);
    if (existing && existing.reviewStatus === 'APPROVED') {
      throw new BadRequestException(
        'Başvurunuz onaylandığı için bilgiler yeniden düzenlenemez.',
      );
    }

    return this.logisticsApplicationsRepository.upsertByUserId({
      userId,
      companyName: dto.companyName.trim(),
      companyType: dto.companyType,
      vknOrTckn: dto.vknOrTckn.trim(),
      taxOffice: dto.taxOffice.trim(),
      mersisNo: dto.mersisNo.trim(),
      tradeRegistryNo: this.normalizeOptionalText(dto.tradeRegistryNo),
      city: dto.city.trim(),
      district: dto.district.trim(),
      referenceCode: this.normalizeOptionalText(dto.referenceCode),
      logisticsAuthorizationDocumentType:
        dto.logisticsAuthorizationDocumentType,
      mainServiceTypes: dto.mainServiceTypes,
    });
  }

  async upsertContactFinanceForUser(
    userId: string,
    dto: UpsertLogisticsApplicationContactFinanceDto,
  ): Promise<LogisticsApplicationRecord> {
    const existing =
      await this.logisticsApplicationsRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Önce şirket kimlik bilgileri adımını tamamlayınız.',
      );
    }

    if (existing.reviewStatus === 'APPROVED') {
      throw new BadRequestException(
        'Başvurunuz onaylandığı için bilgiler yeniden düzenlenemez.',
      );
    }

    return this.logisticsApplicationsRepository.upsertContactFinanceByUserId({
      userId,
      companyIban: dto.companyIban.trim(),
      kepAddress: dto.kepAddress.trim(),
      isEInvoiceTaxpayer: dto.isEInvoiceTaxpayer,
      businessPhone: dto.businessPhone.trim(),
      headquartersAddress: dto.headquartersAddress.trim(),
      serviceRegions: dto.serviceRegions,
      fleetCapacity: dto.fleetCapacity,
      contactFirstName: dto.contactFirstName.trim(),
      contactLastName: dto.contactLastName.trim(),
      contactRole: dto.contactRole.trim(),
      contactPhone: dto.contactPhone.trim(),
      contactEmail: dto.contactEmail.trim(),
    });
  }

  async findManyForAdmin(): Promise<LogisticsApplicationAdminListItem[]> {
    return this.logisticsApplicationsRepository.findManyForAdmin();
  }

  async reviewByAdmin(
    id: string,
    dto: ReviewLogisticsApplicationDto,
  ): Promise<LogisticsApplicationRecord> {
    const existing = await this.logisticsApplicationsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Lojistik başvurusu bulunamadı.');
    }

    const normalizedReviewNote = this.normalizeOptionalText(dto.reviewNote);
    if (dto.status === 'REJECTED' && !normalizedReviewNote) {
      throw new BadRequestException(
        'Başvuruyu reddetmek için red nedeni yazmanız zorunludur.',
      );
    }

    return this.logisticsApplicationsRepository.updateReviewById(id, {
      status: dto.status,
      reviewNote: normalizedReviewNote,
    });
  }

  async findByIdForAdmin(id: string): Promise<LogisticsApplicationRecord> {
    const application = await this.logisticsApplicationsRepository.findById(id);

    if (!application) {
      throw new NotFoundException('Lojistik başvurusu bulunamadı.');
    }

    return application;
  }

  async upsertDocumentsForUser(
    userId: string,
    dto: UpsertLogisticsApplicationDocumentsDto,
    uploadedDocuments: UploadedLogisticsApplicationDocument[],
  ): Promise<LogisticsApplicationRecord> {
    if (!dto.approvedSupplierAgreement) {
      throw new BadRequestException(
        'Lojistik partnerliği sözleşmesini onaylamalısınız.',
      );
    }

    if (!dto.approvedKvkkAgreement) {
      throw new BadRequestException('KVKK aydınlatma metnini onaylamalısınız.');
    }

    const existing =
      await this.logisticsApplicationsRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Önce şirket kimlik bilgileri adımını tamamlayınız.',
      );
    }

    if (existing.reviewStatus === 'APPROVED') {
      throw new BadRequestException(
        'Başvurunuz onaylandığı için yeniden başvuru gönderemezsiniz.',
      );
    }

    const documentsToUpsert = uploadedDocuments.map(
      (document): LogisticsApplicationUploadedDocumentInput => ({
        documentType: logisticsApplicationDocumentFieldMap[document.fieldName],
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        filePath: document.filePath,
      }),
    );

    const previousFilePathByType = new Map<
      LogisticsApplicationDocumentType,
      string
    >();

    for (const document of documentsToUpsert) {
      const previous =
        await this.logisticsApplicationsRepository.findDocumentByUserIdAndType(
          userId,
          document.documentType,
        );
      if (previous) {
        previousFilePathByType.set(document.documentType, previous.filePath);
      }
    }

    const updated =
      await this.logisticsApplicationsRepository.upsertDocumentsAndAgreementsByUserId(
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
    documentType: LogisticsApplicationDocumentType,
  ): Promise<LogisticsApplicationDocumentFileRecord> {
    const document =
      await this.logisticsApplicationsRepository.findDocumentByUserIdAndType(
        userId,
        documentType,
      );

    if (!document) {
      throw new NotFoundException('Belge bulunamadı.');
    }

    return document;
  }

  async getAdminDocumentByType(
    logisticsApplicationId: string,
    documentType: LogisticsApplicationDocumentType,
  ): Promise<LogisticsApplicationDocumentFileRecord> {
    const existing = await this.logisticsApplicationsRepository.findById(
      logisticsApplicationId,
    );

    if (!existing) {
      throw new NotFoundException('Lojistik başvurusu bulunamadı.');
    }

    const document =
      await this.logisticsApplicationsRepository.findDocumentByApplicationIdAndType(
        logisticsApplicationId,
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
    const marker = '/uploads/logistics-documents/';
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex === -1) {
      return normalizedInputPath;
    }

    const relativeTail = normalized.slice(markerIndex + marker.length);

    const candidates = [
      path.join(process.cwd(), 'uploads', 'logistics-documents', relativeTail),
      path.join(
        process.cwd(),
        'apps',
        'api',
        'uploads',
        'logistics-documents',
        relativeTail,
      ),
      path.join(
        process.cwd(),
        '..',
        'apps',
        'api',
        'uploads',
        'logistics-documents',
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
