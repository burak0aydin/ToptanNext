import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const reviewStatusValues = ['APPROVED', 'REJECTED'] as const;

export type ReviewProductListingStatus = (typeof reviewStatusValues)[number];

export class ReviewProductListingDto {
  @IsEnum(reviewStatusValues, {
    message: 'Geçerli bir değerlendirme durumu seçiniz.',
  })
  status: ReviewProductListingStatus;

  @IsOptional()
  @IsString({ message: 'Değerlendirme notu metin olmalıdır.' })
  @MaxLength(1000, { message: 'Değerlendirme notu en fazla 1000 karakter olabilir.' })
  reviewNote?: string;
}
