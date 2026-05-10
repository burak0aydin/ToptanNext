import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const toTrimmedString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
};

export class UpsertProductReviewDto {
  @IsInt({ message: 'Puan tam sayı olmalıdır.' })
  @Min(1, { message: 'Puan en az 1 olmalıdır.' })
  @Max(5, { message: 'Puan en fazla 5 olmalıdır.' })
  rating: number;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString({ message: 'Yorum metin olmalıdır.' })
  @MaxLength(1000, { message: 'Yorum en fazla 1000 karakter olabilir.' })
  comment?: string;
}
