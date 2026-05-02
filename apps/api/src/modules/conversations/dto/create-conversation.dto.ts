import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  participantId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  productListingId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  logisticsRequestId?: string;
}
