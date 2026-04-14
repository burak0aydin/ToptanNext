import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Ürün adı metin olmalıdır.' })
  @MaxLength(255, { message: 'Ürün adı en fazla 255 karakter olabilir.' })
  name: string;

  @IsString({ message: 'Kategori bilgisi metin olmalıdır.' })
  categoryId: string;

  @IsOptional()
  @IsString({ message: 'Sektör bilgisi metin olmalıdır.' })
  sectorId?: string;

  @IsOptional()
  @IsString({ message: 'Slug metin olmalıdır.' })
  slug?: string;
}
