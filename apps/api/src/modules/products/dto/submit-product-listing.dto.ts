import { IsBoolean } from 'class-validator';

export class SubmitProductListingDto {
  @IsBoolean({ message: 'Onay alanı true/false olmalıdır.' })
  confirmSubmission: boolean;
}
