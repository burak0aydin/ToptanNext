import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString({ message: 'Ad metin olmalıdır.' })
  @MaxLength(80, { message: 'Ad en fazla 80 karakter olabilir.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Soyad metin olmalıdır.' })
  @MaxLength(80, { message: 'Soyad en fazla 80 karakter olabilir.' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Telefon numarası metin olmalıdır.' })
  @MaxLength(30, { message: 'Telefon numarası en fazla 30 karakter olabilir.' })
  phoneNumber?: string;
}
