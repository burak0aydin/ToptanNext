"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginDtoSchema, type LoginDto } from "@toptannext/types";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/features/auth/hooks/useAuthMutations";
import { setAccessToken } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full pl-11 pr-4 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm";
const passwordInputClass =
  "w-full pl-11 pr-11 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm";
const buttonClass =
  "w-full h-[52px] bg-[#1A56DB] text-on-primary text-base font-bold rounded-xl shadow-lg shadow-[#1A56DB]/20 hover:bg-[#1353d8] active:scale-[0.98] transition-all duration-200 disabled:opacity-60";

function AuthTabs() {
  return (
    <div className="relative mb-9 h-12 border-b border-outline-variant/40">
      <div className="grid h-full grid-cols-2 text-center text-[15px] font-bold leading-none">
        <Link className="flex h-12 items-center justify-center text-[#1A56DB]" href="/login">
          Giriş Yap
        </Link>
        <Link className="flex h-12 items-center justify-center text-on-surface-variant" href="/register">
          Üye Ol
        </Link>
      </div>
      <span className="absolute bottom-[-1px] left-0 h-0.5 w-1/2 rounded-full bg-[#1A56DB]" />
    </div>
  );
}

function SocialAuthArea() {
  return (
    <div className="mt-9">
      <p className="mb-3 text-center text-xs font-medium text-on-surface-variant">
        Sosyal hesabın ile giriş yap
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Google", "/images/google.png"],
          ["Facebook", "/images/facebook.png"],
          ["LinkedIn", "/images/linkedin.png"],
        ].map(([name, src]) => (
          <button
            aria-label={`${name} ile giriş yap`}
            className="flex h-12 items-center justify-center rounded-xl border border-outline-variant/60 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9AB8F6] hover:bg-[#F8FAFF] hover:shadow-md"
            key={name}
            type="button"
          >
            <img alt={name} className="h-6 w-6 object-contain" src={src} />
          </button>
        ))}
      </div>
    </div>
  );
}

function VisualPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <img alt="B2B Business Professionals" className="w-full h-full object-cover" src="/images/people.png" />
      </div>
      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold text-on-primary tracking-tight mb-4">
          Toptan<span style={{ color: "#FF5A1F" }}>Next</span>
        </h1>
        <p className="text-on-primary-container text-lg leading-relaxed max-w-sm">
          Türkiye&apos;nin en modern B2B ticaret ekosistemine katılarak işinizi dijital dünyada büyütün.
        </p>
      </div>
      <div className="relative z-10 grid gap-6">
        {[
          ["verified", "Kurumsal Doğrulama", "Güvenli ve şeffaf işlem altyapısı."],
          ["local_shipping", "Global Lojistik Ağı", "Dünya çapında hızlı ve güvenilir teslimat."],
          ["payments", "Güvenli Ödeme Sistemi", "Koruma altındaki ticari işlemler."],
          ["support_agent", "7/24 Kurumsal Destek", "Her an yanınızda olan profesyonel ekip."],
        ].map(([icon, title, text]) => (
          <div className="flex items-center gap-4 text-on-primary" key={title}>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white" data-icon={icon}>
                {icon}
              </span>
            </div>
            <div>
              <p className="font-semibold text-base">{title}</p>
              <p className="text-sm opacity-80">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next"));
  }, []);

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
        setAccessToken(result.accessToken, rememberMe);
        if (result.user.role === "ADMIN") {
          router.push("/admin");
          return;
        }

        if (nextPath && nextPath.startsWith("/")) {
          router.push(nextPath);
          return;
        }

        router.push("/");
      },
    });
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#F3F6FB] px-3 py-3 md:px-4 md:py-8">
      <div className="w-full max-w-[1100px] grid md:grid-cols-2 md:h-[min(780px,calc(100dvh-64px))] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-on-surface/10 border border-outline-variant/20">
        <VisualPanel />

        <div className="relative flex flex-col justify-start overflow-hidden bg-white px-5 py-8 md:min-h-0 md:justify-center md:p-10 lg:p-12">
          <div className="absolute inset-0 md:hidden">
            <img alt="" className="h-full w-full object-cover opacity-[0.08]" src="/images/people.png" />
            <div className="absolute inset-0 bg-white/90" />
          </div>

          <div className="relative mx-auto flex w-full max-w-[480px] flex-col bg-transparent p-0 md:min-h-[620px] md:justify-center">
            <div className="hidden md:mb-9 md:block md:min-h-[120px]">
              <p className="max-w-md text-[24px] font-bold leading-tight tracking-tight text-on-surface">
                ToptanNext deneyimine hoş geldiniz
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
                Ürünleri keşfedin, favorilerinizi takip edin ve hesabınıza bağlı tüm işlemleri güvenle yönetin.
              </p>
            </div>

            <AuthTabs />

            <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  E-POSTA ADRESİ
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                    mail
                  </span>
                  <input className={inputClass} type="text" required {...register("email")} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    ŞİFRE
                  </label>
                  <Link className="text-xs font-bold text-primary hover:text-secondary-container" href="/forgot-password">
                    Şifremi Unuttum
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                    lock
                  </span>
                  <input
                    className={passwordInputClass}
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    {...register("password")}
                  />
                  <button
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center px-1">
                <input
                  checked={rememberMe}
                  className="w-4 h-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary/20"
                  id="remember"
                  type="checkbox"
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <label className="ml-2 text-sm font-medium text-on-surface-variant" htmlFor="remember">
                  Beni hatırla
                </label>
              </div>

              {loginMutation.error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {loginMutation.error.message}
                </p>
              ) : null}

              <button className={buttonClass} type="submit" disabled={isSubmitting || loginMutation.isPending}>
                {loginMutation.isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <SocialAuthArea />
          </div>
        </div>
      </div>
    </main>
  );
}
