import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class ProductListingPricingTierDto {
  @Type(() => Number)
  @IsInt({ message: 'Kademe minimum adedi tam sayı olmalıdır.' })
  @Min(1, { message: 'Kademe minimum adedi en az 1 olmalıdır.' })
  minQuantity!: number;

  @Type(() => Number)
  @IsInt({ message: 'Kademe maksimum adedi tam sayı olmalıdır.' })
  @Min(1, { message: 'Kademe maksimum adedi en az 1 olmalıdır.' })
  maxQuantity!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Kademe birim fiyatı sayısal olmalıdır.' })
  @Min(0.01, { message: 'Kademe birim fiyatı 0 değerinden büyük olmalıdır.' })
  unitPrice!: number;
}

export class UpdateProductListingStepTwoDto {
  @Type(() => Number)
  @IsInt({ message: 'Minimum sipariş adedi tam sayı olmalıdır.' })
  @Min(1, { message: 'Minimum sipariş adedi en az 1 olmalıdır.' })
  minOrderQuantity!: number;

  @Type(() => Number)
  @IsInt({ message: 'Stok tam sayı olmalıdır.' })
  @Min(0, { message: 'Stok negatif olamaz.' })
  stock!: number;

  @Type(() => Boolean)
  @IsBoolean({ message: 'Pazarlık eşiği durumu true/false olmalıdır.' })
  isNegotiationEnabled!: boolean;

  @ValidateIf((dto: UpdateProductListingStepTwoDto) => dto.isNegotiationEnabled)
  @Type(() => Number)
  @IsInt({ message: 'Pazarlık sınırı tam sayı olmalıdır.' })
  @Min(1, { message: 'Pazarlık sınırı en az 1 olmalıdır.' })
  negotiationThreshold?: number;

  @IsArray({ message: 'Kademeli fiyatlandırma bir dizi olmalıdır.' })
  @ArrayMinSize(1, { message: 'En az 1 fiyat kademesi tanımlamalısınız.' })
  @ArrayMaxSize(6, {
    message: 'En fazla 6 fiyat kademesi tanımlayabilirsiniz.',
  })
  @ValidateNested({ each: true })
  @Type(() => ProductListingPricingTierDto)
  pricingTiers!: ProductListingPricingTierDto[];
}
