import {
  LogisticsFleetCapacity,
  LogisticsServiceRegion,
} from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertLogisticsApplicationContactFinanceDto {
  @IsString({ message: 'Şirket IBAN metin olmalıdır.' })
  @MinLength(1, { message: 'Şirket IBAN alan bilgisi zorunlu bir alandır.' })
  @MaxLength(34, { message: 'Şirket IBAN en fazla 34 karakter olabilir.' })
  companyIban!: string;

  @IsEmail({}, { message: 'Geçerli bir KEP adresi giriniz.' })
  kepAddress!: string;

  @IsBoolean({ message: 'E-Fatura Mükellefiyeti bilgisi zorunludur.' })
  isEInvoiceTaxpayer!: boolean;

  @IsString({ message: 'İş telefonu metin olmalıdır.' })
  @MinLength(1, { message: 'İş Telefonu alan bilgisi zorunlu bir alandır.' })
  @MaxLength(30, { message: 'İş telefonu en fazla 30 karakter olabilir.' })
  businessPhone!: string;

  @IsString({ message: 'Şirket merkezi adresi metin olmalıdır.' })
  @MinLength(1, {
    message: 'Şirket Merkezi Adresi alan bilgisi zorunlu bir alandır.',
  })
  @MaxLength(500, {
    message: 'Şirket merkezi adresi en fazla 500 karakter olabilir.',
  })
  headquartersAddress!: string;

  @IsArray({ message: 'Hizmet verilen bölgeler geçerli olmalıdır.' })
  @ArrayMinSize(1, { message: 'En az bir hizmet bölgesi seçmelisiniz.' })
  @IsEnum(LogisticsServiceRegion, {
    each: true,
    message: 'Geçerli bir hizmet bölgesi seçiniz.',
  })
  serviceRegions!: LogisticsServiceRegion[];

  @IsEnum(LogisticsFleetCapacity, {
    message: 'Filo / Araç Kapasitesi alan bilgisi zorunlu bir alandır.',
  })
  fleetCapacity!: LogisticsFleetCapacity;

  @IsString({ message: 'Ad metin olmalıdır.' })
  @MinLength(1, { message: 'Ad alan bilgisi zorunlu bir alandır.' })
  @MaxLength(80, { message: 'Ad en fazla 80 karakter olabilir.' })
  contactFirstName!: string;

  @IsString({ message: 'Soyad metin olmalıdır.' })
  @MinLength(1, { message: 'Soyad alan bilgisi zorunlu bir alandır.' })
  @MaxLength(80, { message: 'Soyad en fazla 80 karakter olabilir.' })
  contactLastName!: string;

  @IsString({ message: 'Görev metin olmalıdır.' })
  @MinLength(1, { message: 'Görev alan bilgisi zorunlu bir alandır.' })
  @MaxLength(120, { message: 'Görev en fazla 120 karakter olabilir.' })
  contactRole!: string;

  @IsString({ message: 'Cep telefonu metin olmalıdır.' })
  @MinLength(1, { message: 'Cep Telefonu alan bilgisi zorunlu bir alandır.' })
  @MaxLength(30, { message: 'Cep telefonu en fazla 30 karakter olabilir.' })
  contactPhone!: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  contactEmail!: string;
}
