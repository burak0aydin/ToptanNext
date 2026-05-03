"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  clearAccessToken,
  getUserRoleFromToken,
  hasAccessToken,
  type AppUserRole,
} from "@/lib/auth-token";
import { requestJson } from "@/lib/api";
import { MainFooter } from "../../components/MainFooter";
import { MainHeader } from "../../components/MainHeader";
import { SellerPanelShell } from "./SellerPanelShell";
import {
  accountTopMenuItems,
  isExactPath,
  isPathInMenu,
  personalMenuItems,
  sellerMenuItems,
} from "./account-menu";

type AccountLayoutShellProps = {
  children: ReactNode;
};

const allLeafItems = [
  ...accountTopMenuItems,
  ...personalMenuItems,
  ...sellerMenuItems,
] as const;

function getPageTitle(pathname: string): string {
  const matchedItem = allLeafItems.find((item) => isExactPath(pathname, item.href));
  if (matchedItem) {
    return matchedItem.label;
  }

  return "Hesabım";
}

function getPageDescription(pathname: string): string {
  if (isExactPath(pathname, "/satici-panelim/urunlerim")) {
    return "Platformdaki tüm envanterinizi ve onay bekleyen ürünlerinizi buradan yönetin.";
  }

  if (isExactPath(pathname, "/satici-panelim/urun-yukle")) {
    return "Yeni ürün ekleme adımlarını buradan tamamlayın.";
  }

  if (pathname.startsWith("/satici-panelim")) {
    return "Satıcı paneli sayfalarını bu alandan yönetebilirsiniz.";
  }

  return "Hesap bilgilerinizi buradan güncelleyebilir ve tercihlerinizi yönetebilirsiniz.";
}

function sectionButtonClass(isActive: boolean): string {
  if (isActive) {
    return "bg-primary/10 text-[#003FB1]";
  }

  return "text-slate-700 hover:bg-slate-50 hover:text-[#003FB1]";
}

function leafItemClass(isActive: boolean): string {
  if (isActive) {
    return "block w-full rounded-r-lg border-l-2 border-[#003FB1] bg-primary/10 px-4 py-2 text-sm font-semibold text-[#003FB1]";
  }

  return "block w-full px-4 py-2 text-sm text-slate-500 transition-all hover:bg-slate-50 hover:text-[#003FB1]";
}

function accountIconForHref(href: string): string {
  if (href === "/siparislerim") return "package_2";
  if (href === "/favorilerim") return "favorite";
  if (href === "/adres-bilgilerim") return "location_on";
  if (href === "/kayitli-kartlarim") return "credit_card";
  if (href === "/duyuru-tercihlerim") return "notifications";
  if (href === "/sifre-degisikligi") return "lock";
  return "person";
}

export function AccountLayoutShell({ children }: AccountLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<AppUserRole | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isPersonalRoute = isPathInMenu(pathname, personalMenuItems);
  const isSellerRoute =
    pathname.startsWith("/satici-panelim") || isPathInMenu(pathname, sellerMenuItems);
  const personalRootHref = personalMenuItems[0]?.href ?? "/kullanici-bilgilerim";

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(hasAccessToken());
      setUserRole(getUserRoleFromToken());
    };

    syncAuthState();

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await requestJson<{ loggedOut: boolean }, undefined>("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Local token cleanup is enough for immediate mobile account UX.
    }

    clearAccessToken();
    setIsLoggedIn(false);
    setUserRole(null);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    if (isSellerRoute && userRole && userRole !== "SUPPLIER") {
      router.replace("/kullanici-bilgilerim");
    }
  }, [isSellerRoute, router, userRole]);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const pageDescription = useMemo(() => getPageDescription(pathname), [pathname]);
  const hideDefaultPageHeader =
    isExactPath(pathname, "/adres-bilgilerim") ||
    isExactPath(pathname, "/kayitli-kartlarim") ||
    isExactPath(pathname, "/satici-panelim/urunlerim") ||
    isExactPath(pathname, "/satici-panelim/urun-yukle");

  if (isSellerRoute) {
    return <SellerPanelShell>{children}</SellerPanelShell>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <MainHeader />

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
          {[...accountTopMenuItems, ...personalMenuItems].map((item) => {
            const isActive = isExactPath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                  isActive
                    ? "border-[#003FB1] bg-blue-50 text-[#003FB1]"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {accountIconForHref(item.href)}
                </span>
                {item.label}
              </Link>
            );
          })}

          {userRole === "SUPPLIER" ? (
            <Link
              href="/satici-panelim"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              Mağaza
            </Link>
          ) : null}

          <div className="h-6 w-px shrink-0 bg-slate-200" />

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Çıkış Yap
            </button>
          ) : (
            <Link
              href="/login?next=%2Fkullanici-bilgilerim"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#003FB1]/20 bg-blue-50 px-3 text-xs font-semibold text-[#003FB1]"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Giriş Yap
            </Link>
          )}
        </div>
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-132px)] w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 pb-28 pt-4 md:flex-row md:px-6 md:py-8">
        <aside className="hidden w-full rounded-2xl border border-slate-200/50 bg-white p-4 md:block md:w-72 md:shrink-0">
          <nav className="space-y-1">
            {accountTopMenuItems.map((item) => {
              const isActive = isExactPath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-[#003FB1]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#003FB1]"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {item.href === "/siparislerim" ? "package_2" : "favorite"}
                  </span>
                  {item.label}
                </Link>
              );
            })}

            <div className={`rounded-lg ${isPersonalRoute ? "bg-primary/5" : ""}`}>
              <Link
                href={personalRootHref}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${sectionButtonClass(false)}`}
              >
                <span className={`material-symbols-outlined ${isPersonalRoute ? "text-[#003FB1]" : "text-slate-600"}`}>
                  person
                </span>
                <span className="text-sm">Kişisel Bilgilerim</span>
              </Link>

              <div className="ml-11 space-y-1 border-l border-slate-100 pb-3">
                {personalMenuItems.map((item) => {
                  const isActive = isExactPath(pathname, item.href);

                  return (
                    <Link key={item.href} href={item.href} className={leafItemClass(isActive)}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {userRole === "SUPPLIER" ? (
              <Link
                href="/satici-panelim"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-[#003FB1]"
              >
                <span className="material-symbols-outlined text-slate-600">storefront</span>
                <span className="text-sm">Mağaza</span>
              </Link>
            ) : null}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-sm md:p-8">
            {hideDefaultPageHeader ? null : (
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-on-surface">{pageTitle}</h1>
                <p className="mt-2 text-sm text-on-surface-variant">{pageDescription}</p>
              </header>
            )}
            {children}
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
