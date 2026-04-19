export type AccountMenuLeafItem = {
  label: string;
  href: string;
};

export const accountTopMenuItems: AccountMenuLeafItem[] = [
  { label: "Siparişlerim", href: "/siparislerim" },
  { label: "Favorilerim", href: "/favorilerim" },
];

export const personalMenuItems: AccountMenuLeafItem[] = [
  { label: "Kişisel Bilgilerim", href: "/kullanici-bilgilerim" },
  { label: "Adres Bilgilerim", href: "/adres-bilgilerim" },
  { label: "Kayıtlı Kartlarım", href: "/kayitli-kartlarim" },
  { label: "Duyuru Tercihlerim", href: "/duyuru-tercihlerim" },
  { label: "Şifre Değişikliği", href: "/sifre-degisikligi" },
];

export const sellerMenuItems: AccountMenuLeafItem[] = [
  { label: "Genel Bakış", href: "/satici-panelim" },
  { label: "Ürünlerim", href: "/satici-panelim/urunlerim" },
  { label: "Siparişler", href: "/satici-panelim/siparisler" },
  { label: "Mesajlar", href: "/satici-panelim/mesajlar" },
  { label: "Finans", href: "/satici-panelim/finans" },
  { label: "Şirket Bilgilerim", href: "/satici-panelim/sirket-bilgilerim" },
  { label: "Satıcı Sayfam", href: "/satici-panelim/satici-sayfam" },
];

export function normalizePath(pathname: string): string {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (normalizedPath === "/satici-panelim/genel-bakis") {
    return "/satici-panelim";
  }

  return normalizedPath;
}

export function isExactPath(pathname: string, href: string): boolean {
  return normalizePath(pathname) === normalizePath(href);
}

export function isPathInMenu(pathname: string, items: AccountMenuLeafItem[]): boolean {
  return items.some((item) => isExactPath(pathname, item.href));
}
