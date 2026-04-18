import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderCategoryItemDto {
  @IsString({ message: 'Kategori kimliği metin olmalıdır.' })
  id: string;

  @Type(() => Number)
  @IsInt({ message: 'Sıra değeri tam sayı olmalıdır.' })
  @Min(0, { message: 'Sıra değeri 0 veya daha büyük olmalıdır.' })
  sortOrder: number;
}

export class ReorderCategoriesDto {
  @IsArray({ message: 'Sıralama öğeleri dizi olmalıdır.' })
  @ArrayMinSize(1, { message: 'En az bir sıralama öğesi gönderilmelidir.' })
  @ValidateNested({ each: true })
  @Type(() => ReorderCategoryItemDto)
  items: ReorderCategoryItemDto[];
}
