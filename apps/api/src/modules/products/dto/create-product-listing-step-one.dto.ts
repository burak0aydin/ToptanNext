import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const toTrimmedString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
};

const toStringArray = ({ value }: { value: unknown }): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const toOptionalStringArray = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return toStringArray({ value });
};

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return value;
};

export class CreateProductListingStepOneDto {
  @Transform(toTrimmedString)
  @IsString({ message: 'Ürün adı metin olmalıdır.' })
  @MaxLength(255, { message: 'Ürün adı en fazla 255 karakter olabilir.' })
  name: string;

  @Transform(toTrimmedString)
  @IsString({ message: 'SKU metin olmalıdır.' })
  @MaxLength(80, { message: 'SKU en fazla 80 karakter olabilir.' })
  sku: string;

  @Transform(toTrimmedString)
  @IsString({ message: 'Kategori bilgisi metin olmalıdır.' })
  categoryId: string;

  @Transform(toOptionalStringArray)
  @IsOptional()
  @IsArray({ message: 'Sektör listesi dizi olmalıdır.' })
  @ArrayMaxSize(12, { message: 'En fazla 12 sektör seçebilirsiniz.' })
  @IsString({ each: true, message: 'Her sektör bilgisi metin olmalıdır.' })
  sectorIds?: string[];

  @Transform(toOptionalStringArray)
  @IsOptional()
  @IsArray({ message: 'Öne çıkan özellikler dizi olmalıdır.' })
  @ArrayMaxSize(12, { message: 'En fazla 12 öne çıkan özellik ekleyebilirsiniz.' })
  @IsString({ each: true, message: 'Her özellik metin olmalıdır.' })
  @MaxLength(80, {
    each: true,
    message: 'Her bir öne çıkan özellik en fazla 80 karakter olabilir.',
  })
  featuredFeatures?: string[];

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean({ message: 'Özelleştirilebilir alanı true/false olmalıdır.' })
  isCustomizable?: boolean;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString({ message: 'Özelleştirme açıklaması metin olmalıdır.' })
  @MaxLength(500, {
    message: 'Özelleştirme açıklaması en fazla 500 karakter olabilir.',
  })
  customizationNote?: string;

  @Transform(toTrimmedString)
  @IsString({ message: 'Ürün açıklaması metin olmalıdır.' })
  @MaxLength(5000, { message: 'Ürün açıklaması en fazla 5000 karakter olabilir.' })
  description: string;
}
