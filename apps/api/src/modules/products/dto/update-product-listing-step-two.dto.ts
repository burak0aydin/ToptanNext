import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdateProductListingStepTwoDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Birim fiyat sayısal olmalıdır.' })
  @Min(0.01, { message: 'Birim fiyat 0 değerinden büyük olmalıdır.' })
  basePrice: number;

  @IsOptional()
  @IsString({ message: 'Para birimi metin olmalıdır.' })
  @Length(3, 3, { message: 'Para birimi 3 karakter olmalıdır.' })
  currency?: string;

  @Type(() => Number)
  @IsInt({ message: 'Minimum sipariş adedi tam sayı olmalıdır.' })
  @Min(1, { message: 'Minimum sipariş adedi en az 1 olmalıdır.' })
  minOrderQuantity: number;

  @Type(() => Number)
  @IsInt({ message: 'Stok tam sayı olmalıdır.' })
  @Min(0, { message: 'Stok negatif olamaz.' })
  stock: number;
}
