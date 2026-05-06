import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(
    /^(admin01@hotmail\.com|[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+)$/i,
    {
    message: 'Geçerli bir e-posta adresi veya admin kullanıcı adı giriniz.',
    },
  )
  email: string;

  @IsString({ message: 'Şifre zorunludur.' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
  @MaxLength(72, { message: 'Şifre en fazla 72 karakter olabilir.' })
  password: string;
}
