import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import {
  ProductListingDeliveryMethod,
  ProductListingPackageType,
  ProductListingShippingTime,
} from '@prisma/client';

export class UpdateProductListingStepThreeDto {
  @IsEnum(ProductListingPackageType, {
    message: 'Geçerli bir paket tipi seçiniz.',
  })
  packageType: ProductListingPackageType;

  @Type(() => Number)
  @IsInt({ message: 'Tedarik süresi tam sayı olmalıdır.' })
  @Min(0, { message: 'Tedarik süresi negatif olamaz.' })
  leadTimeDays: number;

  @IsEnum(ProductListingShippingTime, {
    message: 'Geçerli bir kargoya verilme süresi seçiniz.',
  })
  shippingTime: ProductListingShippingTime;

  @IsArray({ message: 'Teslimat yöntemleri liste olarak gönderilmelidir.' })
  @ArrayNotEmpty({ message: 'En az bir teslimat yöntemi seçmelisiniz.' })
  @IsEnum(ProductListingDeliveryMethod, {
    each: true,
    message: 'Geçerli teslimat yöntemleri seçiniz.',
  })
  deliveryMethods: ProductListingDeliveryMethod[];

  @IsBoolean({ message: 'Dinamik navlun anlaşması true/false olmalıdır.' })
  dynamicFreightAgreement: boolean;

  @Type(() => Number)
  @IsNumber({}, { message: 'Paket uzunluğu sayısal olmalıdır.' })
  @Min(0.01, { message: 'Paket uzunluğu 0 değerinden büyük olmalıdır.' })
  packageLengthCm: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Paket genişliği sayısal olmalıdır.' })
  @Min(0.01, { message: 'Paket genişliği 0 değerinden büyük olmalıdır.' })
  packageWidthCm: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Paket yüksekliği sayısal olmalıdır.' })
  @Min(0.01, { message: 'Paket yüksekliği 0 değerinden büyük olmalıdır.' })
  packageHeightCm: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Paket ağırlığı sayısal olmalıdır.' })
  @Min(0.001, { message: 'Paket ağırlığı 0 değerinden büyük olmalıdır.' })
  packageWeightKg: number;
}
