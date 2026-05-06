import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Ad zorunludur.' })
  @MinLength(2, { message: 'Ad en az 2 karakter olmalıdır.' })
  @MaxLength(60, { message: 'Ad en fazla 60 karakter olabilir.' })
  firstName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Soyad zorunludur.' })
  @MinLength(2, { message: 'Soyad en az 2 karakter olmalıdır.' })
  @MaxLength(60, { message: 'Soyad en fazla 60 karakter olabilir.' })
  lastName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;

  @IsString({ message: 'Şifre zorunludur.' })
  @MinLength(6, { message: 'Şifreniz 6 ile 20 karakter arasında olmalıdır.' })
  @MaxLength(20, { message: 'Şifreniz 6 ile 20 karakter arasında olmalıdır.' })
  @Matches(/^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]+$/, {
    message: 'Şifrenizde emoji ve benzeri semboller olmamalıdır.',
  })
  @Matches(/^(?:(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~])|(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~])).+$/, {
    message: 'Şifreniz harf, rakam ve özel karakterlerden en az ikisini içermelidir',
  })
  password: string;

  @IsBoolean({ message: 'Koşulların kabul edilmesi zorunludur.' })
  @Equals(true, { message: 'Kullanım koşullarını kabul etmelisiniz.' })
  termsAccepted: boolean;
}
