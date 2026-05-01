import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, IsBoolean, IsNumber } from 'class-validator';

export class CreateLogisticsRequestDto {
  @IsString()
  fromCity!: string;

  @IsString()
  toCity!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  palletCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemCount?: number;

  @IsOptional()
  @IsBoolean()
  isSellerDelivery?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellerDeliveryFee?: number;
}
