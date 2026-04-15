import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewSupplierApplicationDto } from './dto/review-supplier-application.dto';
import { UpsertSupplierApplicationContactFinanceDto } from './dto/upsert-supplier-application-contact-finance.dto';
import { UpsertSupplierApplicationDto } from './dto/upsert-supplier-application.dto';
import {
  SupplierApplicationAdminListItem,
  SupplierApplicationRecord,
  SupplierApplicationsRepository,
} from './supplier-applications.repository';

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

    return this.supplierApplicationsRepository.updateReviewById(id, {
      status: dto.status,
      reviewNote: this.normalizeOptionalText(dto.reviewNote),
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
