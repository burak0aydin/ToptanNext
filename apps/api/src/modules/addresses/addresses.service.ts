import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Address } from '@prisma/client';

export interface CreateAddressDto {
  title: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  invoiceType: 'individual' | 'corporate';
  taxId?: string;
  taxOffice?: string;
  companyName?: string;
  isETaxPayer?: boolean;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async createAddress(userId: string, data: CreateAddressDto): Promise<Address> {
    if (!data.title?.trim()) {
      throw new BadRequestException('Adres başlığı boş olamaz');
    }

    if (!data.fullName?.trim()) {
      throw new BadRequestException('Ad Soyad boş olamaz');
    }

    if (!data.phoneNumber?.trim()) {
      throw new BadRequestException('Telefon numarası boş olamaz');
    }

    if (!data.address?.trim()) {
      throw new BadRequestException('Açık adres boş olamaz');
    }

    if (data.invoiceType === 'corporate') {
      if (!data.taxId?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: VKN/TCKN boş olamaz');
      }
      if (!data.taxOffice?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: Vergi Dairesi boş olamaz');
      }
      if (!data.companyName?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: Firma Adı boş olamaz');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isSelected: false },
      });

      return tx.address.create({
        data: {
          userId,
          title: data.title.trim(),
          fullName: data.fullName.trim(),
          phoneNumber: data.phoneNumber.trim(),
          province: data.province,
          district: data.district,
          neighborhood: data.neighborhood,
          address: data.address.trim(),
          postalCode: data.postalCode,
          isSelected: true,
          invoiceType: data.invoiceType,
          taxId: data.taxId?.trim(),
          taxOffice: data.taxOffice?.trim(),
          companyName: data.companyName?.trim(),
          isETaxPayer: data.isETaxPayer || false,
        },
      });
    });
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAddressById(addressId: string, userId: string): Promise<Address> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Adres bulunamadı');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Bu adrese erişim izniniz yok');
    }

    return address;
  }

  async updateAddress(
    addressId: string,
    userId: string,
    data: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getAddressById(addressId, userId);

    if (data.invoiceType === 'corporate') {
      if (!data.taxId?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: VKN/TCKN boş olamaz');
      }
      if (!data.taxOffice?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: Vergi Dairesi boş olamaz');
      }
      if (!data.companyName?.trim()) {
        throw new BadRequestException('Kurumsal seçildi: Firma Adı boş olamaz');
      }
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        title: data.title?.trim(),
        fullName: data.fullName?.trim(),
        phoneNumber: data.phoneNumber?.trim(),
        province: data.province,
        district: data.district,
        neighborhood: data.neighborhood,
        address: data.address?.trim(),
        postalCode: data.postalCode,
        invoiceType: data.invoiceType,
        taxId: data.taxId?.trim(),
        taxOffice: data.taxOffice?.trim(),
        companyName: data.companyName?.trim(),
        isETaxPayer: data.isETaxPayer,
      },
    });
  }

  async deleteAddress(addressId: string, userId: string): Promise<Address> {
    const address = await this.getAddressById(addressId, userId);

    return this.prisma.address.delete({
      where: { id: addressId },
    });
  }

  async setSelectedAddress(addressId: string, userId: string): Promise<Address> {
    const address = await this.getAddressById(addressId, userId);

    // Deselectează alle adresele utilizatorului
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isSelected: false },
    });

    // Selectează noul adres
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isSelected: true },
    });
  }
}
