import {
  LogisticsAuthorizationDocumentType,
  LogisticsMainServiceType,
  SupplierCompanyType,
} from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertLogisticsApplicationDto {
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

  @IsEnum(LogisticsAuthorizationDocumentType, {
    message: 'Geçerli bir lojistik yetki belge türü seçiniz.',
  })
  logisticsAuthorizationDocumentType!: LogisticsAuthorizationDocumentType;

  @IsArray({ message: 'Ana hizmet tipi listesi geçerli olmalıdır.' })
  @ArrayMinSize(1, { message: 'En az bir ana hizmet tipi seçmelisiniz.' })
  @IsEnum(LogisticsMainServiceType, {
    each: true,
    message: 'Geçerli bir ana hizmet tipi seçiniz.',
  })
  mainServiceTypes!: LogisticsMainServiceType[];
}
