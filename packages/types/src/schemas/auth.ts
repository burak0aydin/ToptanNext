import { z } from "zod";

const adminLoginAlias = "admin01@hotmail.com";
const passwordAllowedCharactersRegex = /^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]+$/;

function hasAtLeastTwoPasswordCharacterGroups(value: string): boolean {
  const groups = [
    /[A-Za-z]/.test(value),
    /\d/.test(value),
    /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value),
  ];

  return groups.filter(Boolean).length >= 2;
}

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
    .min(6, "Şifre en az 6 karakter olmalıdır.")
    .max(72, "Şifre en fazla 72 karakter olabilir."),
});

export const registerDtoSchema = z.object({
  firstName: z
    .string()
    .min(1, "Ad zorunludur.")
    .min(2, "Ad en az 2 karakter olmalıdır.")
    .max(60, "Ad en fazla 60 karakter olabilir.")
    .trim(),
  lastName: z
    .string()
    .min(1, "Soyad zorunludur.")
    .min(2, "Soyad en az 2 karakter olmalıdır.")
    .max(60, "Soyad en fazla 60 karakter olabilir.")
    .trim(),
  email: z
    .string()
    .min(1, "E-posta adresi zorunludur.")
    .email("Geçerli bir e-posta adresi giriniz.")
    .trim(),
  password: z
    .string()
    .min(1, "Şifre zorunludur.")
    .min(6, "Şifreniz 6 ile 20 karakter arasında olmalıdır.")
    .max(20, "Şifreniz 6 ile 20 karakter arasında olmalıdır.")
    .regex(passwordAllowedCharactersRegex, "Şifrenizde emoji ve benzeri semboller olmamalıdır.")
    .refine(
      hasAtLeastTwoPasswordCharacterGroups,
      "Şifreniz harf, rakam ve özel karakterlerden en az ikisini içermelidir",
    ),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "Kullanım koşullarını kabul etmelisiniz.",
  }),
});

export type LoginDto = z.infer<typeof loginDtoSchema>;
export type RegisterDto = z.infer<typeof registerDtoSchema>;
