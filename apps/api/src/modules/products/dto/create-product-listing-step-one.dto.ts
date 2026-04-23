import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
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

const toOptionalVariantGroups = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

export class ProductListingVariantOptionDto {
  @Transform(toTrimmedString)
  @IsString({ message: 'Varyant seçenek etiketi metin olmalıdır.' })
  @MaxLength(80, { message: 'Varyant seçenek etiketi en fazla 80 karakter olabilir.' })
  label: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString({ message: 'Varyant seçenek görsel bağlantısı metin olmalıdır.' })
  @MaxLength(1024, {
    message: 'Varyant seçenek görsel bağlantısı en fazla 1024 karakter olabilir.',
  })
  imageUrl?: string;
}

export class ProductListingVariantGroupDto {
  @Transform(toTrimmedString)
  @IsString({ message: 'Varyant grup adı metin olmalıdır.' })
  @MaxLength(60, { message: 'Varyant grup adı en fazla 60 karakter olabilir.' })
  groupName: string;

  @Transform(toTrimmedString)
  @IsIn(['image', 'text'], {
    message: 'Varyant görünüm tipi image veya text olmalıdır.',
  })
  displayType: 'image' | 'text';

  @IsArray({ message: 'Varyant seçenekleri dizi olmalıdır.' })
  @ArrayMinSize(1, { message: 'Her varyant grubunda en az 1 seçenek olmalıdır.' })
  @ArrayMaxSize(30, { message: 'Her varyant grubunda en fazla 30 seçenek olabilir.' })
  @ValidateNested({ each: true })
  @Type(() => ProductListingVariantOptionDto)
  options: ProductListingVariantOptionDto[];
}

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

  @Transform(toOptionalVariantGroups)
  @IsOptional()
  @IsArray({ message: 'Varyant grupları dizi olmalıdır.' })
  @ArrayMaxSize(6, { message: 'En fazla 6 varyant grubu ekleyebilirsiniz.' })
  @ValidateNested({ each: true })
  @Type(() => ProductListingVariantGroupDto)
  variantGroups?: ProductListingVariantGroupDto[];

  @Transform(toTrimmedString)
  @IsString({ message: 'Ürün açıklaması metin olmalıdır.' })
  @MaxLength(5000, { message: 'Ürün açıklaması en fazla 5000 karakter olabilir.' })
  description: string;
}
