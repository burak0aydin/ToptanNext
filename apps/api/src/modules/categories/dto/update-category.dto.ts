import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Kategori adı metin olmalıdır.' })
  @MaxLength(255, { message: 'Kategori adı en fazla 255 karakter olabilir.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Üst kategori bilgisi metin olmalıdır.' })
  parentId?: string | null;

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
