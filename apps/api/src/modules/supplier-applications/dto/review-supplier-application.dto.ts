import { SupplierApplicationReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewSupplierApplicationDto {
  @IsEnum(SupplierApplicationReviewStatus, {
    message: 'Geçerli bir başvuru durum değeri giriniz.',
  })
  status!: SupplierApplicationReviewStatus;

  @IsOptional()
  @IsString({ message: 'Değerlendirme notu metin olmalıdır.' })
  @MaxLength(500, {
    message: 'Değerlendirme notu en fazla 500 karakter olabilir.',
  })
  reviewNote?: string;
}
