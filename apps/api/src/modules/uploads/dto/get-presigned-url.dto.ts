import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  fileSize!: number;
}
