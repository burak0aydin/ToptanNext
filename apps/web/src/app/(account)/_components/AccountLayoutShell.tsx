"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getUserRoleFromToken, type AppUserRole } from "@/lib/auth-token";
import { MainFooter } from "../../components/MainFooter";
import { MainHeader } from "../../components/MainHeader";
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

export function AccountLayoutShell({ children }: AccountLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<AppUserRole | null>(null);

  const isPersonalRoute = isPathInMenu(pathname, personalMenuItems);
  const isSellerRoute =
    pathname.startsWith("/satici-panelim") || isPathInMenu(pathname, sellerMenuItems);
  const personalRootHref = personalMenuItems[0]?.href ?? "/kullanici-bilgilerim";
  const sellerRootHref = sellerMenuItems[0]?.href ?? "/satici-panelim";

  useEffect(() => {
    const syncUserRole = () => {
      setUserRole(getUserRoleFromToken());
    };

    syncUserRole();

    window.addEventListener("storage", syncUserRole);
    window.addEventListener("focus", syncUserRole);

    return () => {
      window.removeEventListener("storage", syncUserRole);
      window.removeEventListener("focus", syncUserRole);
    };
  }, []);

  useEffect(() => {
    if (isSellerRoute && userRole && userRole !== "SUPPLIER") {
      router.replace("/kullanici-bilgilerim");
    }
  }, [isSellerRoute, router, userRole]);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const pageDescription = useMemo(() => getPageDescription(pathname), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <MainHeader />

      <main className="mx-auto flex min-h-[calc(100vh-132px)] w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6 md:py-8">
        <aside className="w-full rounded-2xl border border-slate-200/50 bg-white p-4 md:w-72 md:shrink-0">
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
              <div className={`rounded-lg ${isSellerRoute ? "bg-primary/5" : ""}`}>
                <Link
                  href={sellerRootHref}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${sectionButtonClass(false)}`}
                >
                  <span className={`material-symbols-outlined ${isSellerRoute ? "text-[#003FB1]" : "text-slate-600"}`}>
                    storefront
                  </span>
                  <span className="text-sm">Satıcı Panelim</span>
                </Link>

                <div className="ml-11 space-y-1 border-l border-slate-100 pb-3">
                  {sellerMenuItems.map((item) => {
                    const isActive = isExactPath(pathname, item.href);

                    return (
                      <Link key={item.href} href={item.href} className={leafItemClass(isActive)}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-sm md:p-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-on-surface">{pageTitle}</h1>
              <p className="mt-2 text-sm text-on-surface-variant">{pageDescription}</p>
            </header>
            {children}
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
