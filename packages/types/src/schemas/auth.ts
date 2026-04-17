import { z } from "zod";

const adminLoginAlias = "admin01@hotmail.com";

const loginIdentifierSchema = z
  .string()
  .min(1, "E-posta adresi veya kullanıcı adı zorunludur.")
  .trim()
  .refine((value) => {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue === adminLoginAlias) {
      return true;
    }

    return z.string().email().safeParse(normalizedValue).success;
  }, "Geçerli bir e-posta adresi veya admin kullanıcı adı giriniz.");

export const loginDtoSchema = z.object({
  email: loginIdentifierSchema,
  password: z
    .string()
    .min(1, "Şifre zorunludur.")
    .min(8, "Şifre en az 8 karakter olmalıdır.")
    .max(72, "Şifre en fazla 72 karakter olabilir."),
});

export const registerDtoSchema = z.object({
  fullName: z
    .string()
    .min(1, "Ad soyad zorunludur.")
    .min(2, "Ad soyad en az 2 karakter olmalıdır.")
    .max(120, "Ad soyad en fazla 120 karakter olabilir.")
    .trim(),
  email: z
    .string()
    .min(1, "E-posta adresi zorunludur.")
    .email("Geçerli bir e-posta adresi giriniz.")
    .trim(),
  password: z
    .string()
    .min(1, "Şifre zorunludur.")
    .min(8, "Şifre en az 8 karakter olmalıdır.")
    .max(72, "Şifre en fazla 72 karakter olabilir."),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "Kullanım koşullarını kabul etmelisiniz.",
  }),
});

export type LoginDto = z.infer<typeof loginDtoSchema>;
export type RegisterDto = z.infer<typeof registerDtoSchema>;
