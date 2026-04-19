import { IsBoolean } from 'class-validator';

export class UpdateUserActiveStatusDto {
  @IsBoolean({ message: 'isActive alanı true veya false olmalıdır.' })
  isActive!: boolean;
}
