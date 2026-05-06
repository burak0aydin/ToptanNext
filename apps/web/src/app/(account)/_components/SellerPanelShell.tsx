"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";

type SellerPanelShellProps = {
  children: ReactNode;
};

const sellerNavItems = [
  { href: "/satici-panelim/genel-bakis", icon: "dashboard", label: "Genel Bakış" },
  { href: "/satici-panelim/mesajlar", icon: "mail", label: "Mesajlar" },
  { href: "/satici-panelim/teklif-merkezi", icon: "local_offer", label: "Teklif Merkezi" },
  { href: "/satici-panelim/urunlerim", icon: "inventory_2", label: "Ürünlerim" },
  { href: "/satici-panelim/urun-yukle", icon: "add_box", label: "Yeni Ürün Yükle" },
  { href: "/satici-panelim/siparisler", icon: "shopping_cart", label: "Siparişler" },
  { href: "/satici-panelim/lojistik-sevkiyat", icon: "local_shipping", label: "Lojistik ve Sevkiyat" },
  { href: "/satici-panelim/cuzdan", icon: "account_balance_wallet", label: "Cüzdan ve Hakedişler" },
  { href: "/satici-panelim/faturalar", icon: "receipt_long", label: "Faturalarım" },
  { href: "/satici-panelim/satici-sayfam", icon: "store", label: "Mağaza Profili" },
  { href: "/satici-panelim/sirket-bilgilerim", icon: "business", label: "Şirket Bilgileri" },
] as const;

const bottomNavItems = [
  { href: "/satici-panelim/ayarlar", icon: "settings", label: "Ayarlar" },
  { href: "/satici-panelim/destek", icon: "help_center", label: "Destek" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/satici-panelim/mesajlar") {
    return pathname === "/satici-panelim" || pathname.startsWith("/satici-panelim/mesajlar");
  }

  if (href === "/satici-panelim/genel-bakis") {
    return pathname.startsWith("/satici-panelim/genel-bakis");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SellerPanelShell({ children }: SellerPanelShellProps) {
  const pathname = usePathname();
  const isMessagesSurface =
    pathname === "/satici-panelim" || pathname.startsWith("/satici-panelim/mesajlar");

  const shell = (
    <div className="flex h-dvh overflow-hidden bg-[#f7f9fb] font-body text-[#191c1e]">
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 py-4 text-sm font-medium tracking-tight text-slate-400 shadow-xl">
        <div className="px-6 pb-6 pt-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            ToptanNext
          </Link>
          <p className="mt-1 text-xs text-slate-400">Satıcı Paneli</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {sellerNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 active:scale-95",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <nav className="mt-auto flex flex-col gap-1 border-t border-slate-800 px-2 pt-4">
          {bottomNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-slate-100 bg-white/90 px-8 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Bildirimler"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link
              href="/kullanici-bilgilerim"
              aria-label="Hesap"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          </div>
        </header>

        <main
          className={[
            "min-h-0 flex-1 overflow-hidden",
            isMessagesSurface ? "" : "overflow-y-auto p-6",
          ].join(" ")}
        >
          {isMessagesSurface ? (
            children
          ) : (
            <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  if (isMessagesSurface) {
    return <RequireAuth>{shell}</RequireAuth>;
  }

  return shell;
}
