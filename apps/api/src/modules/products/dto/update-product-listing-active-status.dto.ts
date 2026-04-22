import { IsBoolean } from 'class-validator';

export class UpdateProductListingActiveStatusDto {
  @IsBoolean({ message: 'Aktiflik durumu true/false olmalıdır.' })
  isActive: boolean;
}
