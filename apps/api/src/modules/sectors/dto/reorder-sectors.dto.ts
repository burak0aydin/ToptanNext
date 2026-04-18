import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderSectorItemDto {
  @IsString({ message: 'Sektör kimliği metin olmalıdır.' })
  id: string;

  @Type(() => Number)
  @IsInt({ message: 'Sıra değeri tam sayı olmalıdır.' })
  @Min(0, { message: 'Sıra değeri 0 veya daha büyük olmalıdır.' })
  sortOrder: number;
}

export class ReorderSectorsDto {
  @IsArray({ message: 'Sıralama öğeleri dizi olmalıdır.' })
  @ArrayMinSize(1, { message: 'En az bir sıralama öğesi gönderilmelidir.' })
  @ValidateNested({ each: true })
  @Type(() => ReorderSectorItemDto)
  items: ReorderSectorItemDto[];
}
