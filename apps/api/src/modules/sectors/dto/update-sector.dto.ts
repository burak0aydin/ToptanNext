import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSectorDto {
  @IsOptional()
  @IsString({ message: 'Sektör adı metin olmalıdır.' })
  @MaxLength(255, { message: 'Sektör adı en fazla 255 karakter olabilir.' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sıra değeri tam sayı olmalıdır.' })
  @Min(0, { message: 'Sıra değeri 0 veya daha büyük olmalıdır.' })
  sortOrder?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Aktiflik bilgisi doğru/yanlış olmalıdır.' })
  isActive?: boolean;
}
