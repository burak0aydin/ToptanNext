"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-token";

type JwtPayload = {
  role?: "ADMIN" | "SUPPLIER" | "BUYER";
  email?: string;
};

const parseJwtPayload = (token: string | null): JwtPayload | null => {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalizedPayload = base64Payload.padEnd(
      Math.ceil(base64Payload.length / 4) * 4,
      "=",
    );
    const payloadJson = atob(normalizedPayload);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

const sideNavItems = [
  { icon: "group", label: "Kullanıcı Yönetimi" },
  { icon: "how_to_reg", label: "Satıcı Başvuruları" },
  { icon: "local_shipping", label: "Lojistik Başvuruları" },
  { icon: "inventory_2", label: "Ürün Yönetimi" },
  { icon: "category", label: "Kategori ve Sektörler" },
  { icon: "forum", label: "Mesajlar" },
  { icon: "account_balance", label: "Finans ve Muhasebe" },
] as const;

const overviewCards = [
  {
    label: "Toplam Kullanıcı",
    value: "12,842",
    delta: "+%8.2 bu ay",
    icon: "person",
    iconBg: "bg-blue-50 text-blue-600",
    hasUpTrend: true,
  },
  {
    label: "Toplam Satıcı",
    value: "1,450",
    delta: "+%12.5 bu ay",
    icon: "storefront",
    iconBg: "bg-orange-50 text-orange-600",
    hasUpTrend: true,
  },
  {
    label: "Lojistik Firmaları",
    value: "84",
    delta: "Stabil durum",
    icon: "local_shipping",
    iconBg: "bg-slate-100 text-slate-600",
    hasUpTrend: false,
  },
] as const;

const pendingSupplierRows = [
  {
    companyName: "Anadolu Gıda Ltd.",
    sector: "Gıda & İçecek",
    time: "2 saat önce",
  },
  {
    companyName: "TeknoLine Mağazacılık",
    sector: "Elektronik",
    time: "5 saat önce",
  },
  {
    companyName: "Yeşil Bahçe Mobilya",
    sector: "Ev & Yaşam",
    time: "Dün",
  },
] as const;

const pendingLogisticsRows = [
  {
    companyName: "HızlıRota Lojistik",
    region: "Marmara Bölgesi",
    time: "1 gün önce",
  },
  {
    companyName: "TransAnadolu Nakliyat",
    region: "Türkiye Geneli",
    time: "3 gün önce",
  },
  {
    companyName: "Şehirİçi Dağıtım A.Ş.",
    region: "İstanbul",
    time: "5 gün önce",
  },
] as const;

const growthChartDays = [
  {
    label: "Pzt",
    logisticHeight: "h-[20%]",
    supplierHeight: "h-[40%]",
    userHeight: "h-[60%]",
  },
  {
    label: "Sal",
    logisticHeight: "h-[25%]",
    supplierHeight: "h-[50%]",
    userHeight: "h-[75%]",
  },
  {
    label: "Çar",
    logisticHeight: "h-[15%]",
    supplierHeight: "h-[35%]",
    userHeight: "h-[55%]",
  },
  {
    label: "Per",
    logisticHeight: "h-[30%]",
    supplierHeight: "h-[45%]",
    userHeight: "h-[85%]",
  },
  {
    label: "Cum",
    logisticHeight: "h-[20%]",
    supplierHeight: "h-[60%]",
    userHeight: "h-[90%]",
  },
  {
    label: "Cmt",
    logisticHeight: "h-[10%]",
    supplierHeight: "h-[15%]",
    userHeight: "h-[40%]",
  },
  {
    label: "Paz",
    logisticHeight: "h-[5%]",
    supplierHeight: "h-[10%]",
    userHeight: "h-[30%]",
  },
] as const;

const incomeChartDays = [
  { label: "Pzt", incomeHeight: "h-[45%]" },
  { label: "Sal", incomeHeight: "h-[60%]" },
  { label: "Çar", incomeHeight: "h-[55%]" },
  { label: "Per", incomeHeight: "h-[85%]" },
  { label: "Cum", incomeHeight: "h-[75%]" },
  { label: "Cmt", incomeHeight: "h-[40%]" },
  { label: "Paz", incomeHeight: "h-[35%]" },
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const payload = parseJwtPayload(getAccessToken());
    if (payload?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm font-medium text-slate-500">
          Yetki kontrol ediliyor...
        </p>
      </main>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
              <span className="material-symbols-outlined text-white">hub</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                ToptanNext
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Yönetici Paneli
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-2">
          <a
            className="flex items-center gap-3 border-r-4 border-blue-700 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition-all duration-200 ease-in-out dark:bg-blue-900/30 dark:text-blue-300"
            href="#"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">Genel Bakış</span>
          </a>
          {sideNavItems.map((item) => (
            <a
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              href="#"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <p className="mb-1 text-xs font-semibold text-primary">
              Sistem Durumu
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-600">
                Tüm Servisler Aktif
              </span>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              search
            </span>
            <input
              className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Panel içerisinde ara..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="mr-2 flex flex-col items-end">
            <span className="text-sm font-semibold text-on-surface">
              Burak Aydın
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              Süper Admin
            </span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5">
            <img
              alt="Admin Profil Fotoğrafı"
              className="h-full w-full rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU9LatoRdY9Sqs9o5QpTzGKeg9AtZS6OoKlPDHs4E7aHuUA5cprXn2VfaHfMDm9vda_5-NeZJP4XpLsSpIcEnmdyNP0ifUyVrSptwWv6-BuYkfNnHn8xk14hy7HWJV8FZkJwB_EkjQrTLg8wP2GXNg3rKhpQuoJKN1rH76zS8u2mRwbcmlQkMA6T7Dd11ld-POnFgzbEMgvF8IJG8DCQ2CMqM38hIcOuZZZ3b1sMMtIMYri2ezWqa2rmuK45yrhw_y626-Nbr-y4g"
            />
          </div>
        </div>
      </header>

      <main className="ml-64 min-h-screen px-8 pb-12 pt-24">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
                Genel Bakış
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Platform genelindeki güncel performans ve başvuru durumu.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              Rapor İndir
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-5 rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${card.iconBg}`}>
                  <span className="material-symbols-outlined text-3xl">
                    {card.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </p>
                  <h3 className="mt-1 text-3xl font-bold">{card.value}</h3>
                  {card.hasUpTrend ? (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="material-symbols-outlined text-[14px]">
                        trending_up
                      </span>
                      {card.delta}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-slate-500">{card.delta}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-on-surface">
                  Bekleyen Satıcı Başvuruları
                </h4>
                <span className="animate-pulse rounded-lg bg-orange-500 px-3 py-1 text-xs font-black text-white">
                  12 YENİ
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Firma Adı
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Sektör
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {pendingSupplierRows.map((row) => (
                      <tr
                        key={row.companyName}
                        className="transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">
                              {row.companyName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {row.time}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{row.sector}</td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-xs font-bold uppercase tracking-tighter text-primary hover:underline">
                            Detaylar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-on-surface">
                  Bekleyen Lojistik Başvuruları
                </h4>
                <span className="animate-pulse rounded-lg bg-blue-600 px-3 py-1 text-xs font-black text-white">
                  3 YENİ
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Firma Adı
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Bölge
                      </th>
                      <th className="px-4 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {pendingLogisticsRows.map((row) => (
                      <tr
                        key={row.companyName}
                        className="transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">
                              {row.companyName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {row.time}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{row.region}</td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-xs font-bold uppercase tracking-tighter text-primary hover:underline">
                            Detaylar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-8 shadow-sm">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h4 className="text-lg font-bold text-on-surface">Büyüme Analizi</h4>
                  <p className="text-sm text-slate-500">
                    Son 30 günlük yeni kayıt dağılımı
                  </p>
                </div>
                <div className="flex items-center rounded-lg bg-surface-container-low p-1">
                  <button className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm">
                    Günlük
                  </button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-primary">
                    Haftalık
                  </button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-primary">
                    Aylık
                  </button>
                </div>
              </div>

              <div className="mb-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-slate-600">Kullanıcı</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-xs font-medium text-slate-600">Satıcı</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Lojistik</span>
                </div>
              </div>

              <div className="flex h-64 items-end justify-between gap-4 border-b border-slate-100 px-2 pb-2">
                {growthChartDays.map((bar) => (
                  <div
                    key={bar.label}
                    className="group relative flex h-full flex-1 flex-col justify-end gap-1"
                  >
                    <div className="flex h-full w-full items-end justify-center gap-0.5">
                      <div className={`w-1/3 rounded-t-sm bg-slate-400 ${bar.logisticHeight}`} />
                      <div className={`w-1/3 rounded-t-sm bg-secondary ${bar.supplierHeight}`} />
                      <div className={`w-1/3 rounded-t-sm bg-primary ${bar.userHeight}`} />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-8 shadow-sm">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h4 className="text-lg font-bold text-on-surface">Komisyon Geliri Analizi</h4>
                  <p className="text-sm text-slate-500">
                    Günlük bazda toplam platform geliri (₺)
                  </p>
                </div>
                <div className="flex items-center rounded-lg bg-surface-container-low p-1">
                  <button className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm">
                    Günlük
                  </button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-primary">
                    Haftalık
                  </button>
                  <button className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-primary">
                    Aylık
                  </button>
                </div>
              </div>

              <div className="flex h-64 items-end justify-between gap-4 border-b border-slate-100 px-2 pb-2">
                {incomeChartDays.map((bar) => (
                  <div key={bar.label} className="group relative flex flex-1 flex-col justify-end">
                    <div
                      className={`w-full rounded-t-lg bg-primary transition-all group-hover:bg-primary-container ${bar.incomeHeight}`}
                    />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
