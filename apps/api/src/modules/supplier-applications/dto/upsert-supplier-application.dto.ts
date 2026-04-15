import { SupplierCompanyType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertSupplierApplicationDto {
  @IsString({ message: 'Şirket tam adı metin olmalıdır.' })
  @MinLength(1, { message: 'Şirket Tam Adı alan bilgisi zorunlu bir alandır.' })
  @MaxLength(160, { message: 'Şirket tam adı en fazla 160 karakter olabilir.' })
  companyName!: string;

  @IsEnum(SupplierCompanyType, { message: 'Geçerli bir şirket türü seçiniz.' })
  companyType!: SupplierCompanyType;

  @IsString({ message: 'VKN / TCKN metin olmalıdır.' })
  @IsNotEmpty({ message: 'VKN / TCKN alan bilgisi zorunlu bir alandır.' })
  @Matches(/^\d{10,11}$/, {
    message: 'VKN / TCKN alanı 10 veya 11 haneli olmalıdır.',
  })
  vknOrTckn!: string;

  @IsString({ message: 'Vergi dairesi metin olmalıdır.' })
  @MinLength(1, { message: 'Vergi Dairesi alan bilgisi zorunlu bir alandır.' })
  @MaxLength(120, { message: 'Vergi dairesi en fazla 120 karakter olabilir.' })
  taxOffice!: string;

  @IsString({ message: 'MERSİS No metin olmalıdır.' })
  @IsNotEmpty({ message: 'MERSİS No alan bilgisi zorunlu bir alandır.' })
  @Matches(/^\d{16}$/, {
    message: 'MERSİS No alanı 16 haneli olmalıdır.',
  })
  mersisNo!: string;

  @IsOptional()
  @IsString({ message: 'Ticaret sicil no metin olmalıdır.' })
  @MaxLength(40, { message: 'Ticaret sicil no en fazla 40 karakter olabilir.' })
  tradeRegistryNo?: string;

  @IsString({ message: 'Faaliyet alanı metin olmalıdır.' })
  @MinLength(1, { message: 'Faaliyet Alanı alan bilgisi zorunlu bir alandır.' })
  @MaxLength(120, { message: 'Faaliyet alanı en fazla 120 karakter olabilir.' })
  activitySector!: string;

  @IsString({ message: 'İl metin olmalıdır.' })
  @MinLength(1, { message: 'İl alan bilgisi zorunlu bir alandır.' })
  @MaxLength(80, { message: 'İl en fazla 80 karakter olabilir.' })
  city!: string;

  @IsString({ message: 'İlçe metin olmalıdır.' })
  @MinLength(1, { message: 'İlçe alan bilgisi zorunlu bir alandır.' })
  @MaxLength(80, { message: 'İlçe en fazla 80 karakter olabilir.' })
  district!: string;

  @IsOptional()
  @IsString({ message: 'Referans kodu metin olmalıdır.' })
  @MaxLength(60, { message: 'Referans kodu en fazla 60 karakter olabilir.' })
  referenceCode?: string;
}
