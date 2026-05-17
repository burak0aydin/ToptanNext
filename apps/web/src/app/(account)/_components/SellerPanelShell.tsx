"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PanelAccountMenu } from "@/app/components/PanelAccountMenu";

type SellerPanelShellProps = {
  children: ReactNode;
};

const sellerNavItems = [
  { href: "/satici-panelim/genel-bakis", icon: "dashboard", label: "Genel Bakış" },
  { href: "/satici-panelim/mesajlar", icon: "mail", label: "Mesajlar" },
  { href: "/satici-panelim/teklif-merkezi", icon: "local_offer", label: "Teklif Merkezi" },
  { href: "/satici-panelim/urunlerim", icon: "inventory_2", label: "Ürünlerim" },
  { href: "/satici-panelim/urun-yukle?new=1", icon: "add_box", label: "Yeni Ürün Yükle" },
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
  const hrefPathname = href.split("?")[0] ?? href;

  if (hrefPathname === "/satici-panelim/mesajlar") {
    return pathname === "/satici-panelim" || pathname.startsWith("/satici-panelim/mesajlar");
  }

  if (hrefPathname === "/satici-panelim/genel-bakis") {
    return pathname.startsWith("/satici-panelim/genel-bakis");
  }

  return pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`);
}

export function SellerPanelShell({ children }: SellerPanelShellProps) {
  const pathname = usePathname();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const isMessagesSurface =
    pathname === "/satici-panelim" || pathname.startsWith("/satici-panelim/mesajlar");

  const shell = (
    <div className="flex h-dvh overflow-hidden bg-[#f7f9fb] font-body text-[#191c1e]">
      <aside
        className={[
          "flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 py-4 text-sm font-semibold tracking-tight text-slate-400 shadow-xl transition-all duration-300",
          isSidebarHidden ? "-ml-64" : "ml-0",
        ].join(" ")}
      >
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
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-6 shadow-sm backdrop-blur">
          <button
            type="button"
            aria-label="Menüyü aç/kapat"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={() => setIsSidebarHidden((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <PanelAccountMenu />
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

  return <RequireAuth>{shell}</RequireAuth>;
}
