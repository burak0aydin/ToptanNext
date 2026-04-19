"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginDtoSchema, type LoginDto } from "@toptannext/types";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/features/auth/hooks/useAuthMutations";
import { setAccessToken } from "@/lib/auth-token";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginDtoSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (payload: LoginDto) => {
    loginMutation.mutate(payload, {
      onSuccess: (result) => {
        setAccessToken(result.accessToken);
        if (result.user.role === "ADMIN") {
          router.push("/admin");
          return;
        }

        router.push("/");
      },
    });
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-6 md:py-8">
      <div className="w-full max-w-[1100px] grid md:grid-cols-2 md:h-[min(780px,calc(100dvh-64px))] bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl shadow-on-surface/5 border border-outline-variant/20">
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <img
              alt="B2B Business Professionals"
              className="w-full h-full object-cover"
              src="/images/people.png"
            />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-on-primary tracking-tight mb-4">
              Toptan<span style={{ color: "#FF5A1F" }}>Next</span>
            </h1>
            <p className="text-on-primary-container text-lg leading-relaxed max-w-sm">
              Türkiye&apos;nin en modern B2B ticaret ekosistemine katılarak
              işinizi dijital dünyada büyütün.
            </p>
          </div>
          <div className="relative z-10 grid gap-6">
            <div className="flex items-center gap-4 text-on-primary">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white"
                  data-icon="verified"
                >
                  verified
                </span>
              </div>
              <div>
                <p className="font-semibold text-base">Kurumsal Doğrulama</p>
                <p className="text-sm opacity-80">
                  Güvenli ve şeffaf işlem altyapısı.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-on-primary">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white"
                  data-icon="local_shipping"
                >
                  local_shipping
                </span>
              </div>
              <div>
                <p className="font-semibold text-base">Global Lojistik Ağı</p>
                <p className="text-sm opacity-80">
                  Dünya çapında hızlı ve güvenilir teslimat.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-on-primary">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white"
                  data-icon="payments"
                >
                  payments
                </span>
              </div>
              <div>
                <p className="font-semibold text-base">Güvenli Ödeme Sistemi</p>
                <p className="text-sm opacity-80">
                  Koruma altındaki ticari işlemler.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-on-primary">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white"
                  data-icon="support_agent"
                >
                  support_agent
                </span>
              </div>
              <div>
                <p className="font-semibold text-base">7/24 Kurumsal Destek</p>
                <p className="text-sm opacity-80">
                  Her an yanınızda olan profesyonel ekip.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-container-lowest">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">
              Tekrar Hoş Geldiniz
            </h2>
            <p className="text-on-surface-variant body-md">
              B2B ticaretin yeni nesil platformuna giriş yapın.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <button className="flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
              <img
                alt="Google"
                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                src="/images/google.png"
              />
            </button>
            <button className="flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
              <img
                alt="Facebook"
                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                src="/images/facebook.png"
              />
            </button>
            <button className="flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
              <img
                alt="LinkedIn"
                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                src="/images/linkedin.png"
              />
            </button>
          </div>

          <div className="relative flex py-5 items-center mb-6">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-outline uppercase tracking-widest">
              VEYA E-POSTA İLE
            </span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">
                 E-POSTA ADRESİ / KULLANICI ADI
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                  mail
                </span>
                <input
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm shadow-sm"
                  placeholder="ornek@sirket.com veya admin01@hotmail.com / admin01@homtail.com"
                  type="text"
                  required
                  {...register("email")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  ŞİFRE
                </label>
                <Link
                  className="text-xs font-bold text-primary hover:text-secondary-container transition-colors"
                  href="/forgot-password"
                >
                  Şifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                  lock
                </span>
                <input
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm shadow-sm"
                  placeholder="••••••••"
                  type="password"
                  required
                  minLength={8}
                  {...register("password")}
                />
              </div>
            </div>

            <div className="flex items-center px-1">
              <input
                className="w-4 h-4 text-primary bg-surface-container border-outline-variant rounded focus:ring-primary/20"
                id="remember"
                type="checkbox"
              />
              <label
                className="ml-2 text-sm text-on-surface-variant font-medium"
                htmlFor="remember"
              >
                Beni hatırla
              </label>
            </div>

            {loginMutation.error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loginMutation.error.message}
              </p>
            ) : null}

            <button
              className="w-full py-4 bg-[#1A56DB] text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-[#1353d8] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 group disabled:opacity-60"
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
            >
              <span>
                {loginMutation.isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Hesabınız yok mu?
              <Link
                className="text-primary font-bold hover:text-secondary-container transition-colors ml-1"
                href="/register"
              >
                Hemen Kaydolun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
