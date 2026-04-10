import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Ad soyad zorunludur.' })
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalıdır.' })
  @MaxLength(120, { message: 'Ad soyad en fazla 120 karakter olabilir.' })
  fullName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;

  @IsString({ message: 'Şifre zorunludur.' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @MaxLength(72, { message: 'Şifre en fazla 72 karakter olabilir.' })
  password: string;

  @IsBoolean({ message: 'Koşulların kabul edilmesi zorunludur.' })
  @Equals(true, { message: 'Kullanım koşullarını kabul etmelisiniz.' })
  termsAccepted: boolean;
}
