import Link from 'next/link';

type SummaryCard = {
  icon: string;
  iconContainerClassName: string;
  label: string;
  value: string;
};

type ProductRow = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  stock: string;
  statusLabel: "YAYINDA" | "ONAY BEKLIYOR" | "PASIF";
  active: boolean;
  rowClassName?: string;
};

const summaryCards: SummaryCard[] = [
  {
    icon: "inventory",
    iconContainerClassName: "bg-primary/10 text-primary",
    label: "Toplam Ürün",
    value: "12,482",
  },
  {
    icon: "pending_actions",
    iconContainerClassName: "bg-amber-100 text-amber-700",
    label: "Onay Bekleyenler",
    value: "156",
  },
  {
    icon: "cancel",
    iconContainerClassName: "bg-red-100 text-red-700",
    label: "Reddedilenler",
    value: "24",
  },
  {
    icon: "pause_circle",
    iconContainerClassName: "bg-slate-100 text-slate-700",
    label: "Pasifte Olanlar",
    value: "89",
  },
  {
    icon: "error_outline",
    iconContainerClassName: "bg-red-50 text-red-600",
    label: "Stokta Olmayanlar",
    value: "42",
  },
];

const productRows: ProductRow[] = [
  {
    id: "TN-99214",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzcxuUxEwMhzfjbBC--30sm2UGX5wuv0ejhusVwm_uh9eOIvAxVubm_OqRm0r84yGLsebxHBq274Ev6SA1JF7__OWRxpBjut_BrqdUgScZ_HwOKylus9oPh3hyx8bwyeoMx--EoiHSVmNJOcYKeYXdYIhXrYPFBeK7BwAXvqn7nxtAhRWQNAZ3h4CXsM_NCHiZo1JVlDXg7n0WJwynP9MaC2Gy-pGuIHxhcWcqBRRjS2kwEl3PgS3KSPM08vR8FOTG8XrC0sIYXnI",
    imageAlt: "Wireless Hızlı Şarj İstasyonu v2",
    name: "Wireless Hızlı Şarj İstasyonu v2",
    sku: "TN-99214",
    category: "Elektronik",
    unitPrice: "₺1,249.00",
    stock: "1,240",
    statusLabel: "YAYINDA",
    active: true,
  },
  {
    id: "TN-88277",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnpwpFfE8QkFSaDfn8OP3Sc1mNIpWZauyn-M8wtwNx7-Ci8ax7ZGX6ht9u4SI2WLCpEXZAdUe25WxqgVjPYKWsMyOkA7sFeRtVF-oiGccBu9eRZQrE7HoQJwCUo8hfgivwDvNAEuNZY_DrqC_XMfJxFZ--HA7jYopi1mQYL-EiQG6GaGJjVKu6voSmSgBW9doIAN5RPACsr-Fz92WFD2enxuL0JNG-f11fo9Qsy1s2KWAB6jRGF_JPayMe1eF4ok9c5vDT8r860t0",
    imageAlt: "Premium Arabica Kahve Çekirdeği 5kg",
    name: "Premium Arabica Kahve Çekirdeği 5kg",
    sku: "TN-88277",
    category: "Gıda",
    unitPrice: "₺2,850.00",
    stock: "50",
    statusLabel: "ONAY BEKLIYOR",
    active: false,
    rowClassName: "bg-amber-50/10",
  },
  {
    id: "TN-11023",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAPd_C3G-iVA6KDq0PtFceVkrJDHPWPtww9p5SSEq2DHVfI7xefv7ZRm7fC__W0cNQ_xnIcMxNowZg1WRObs-SjP7tHOau_JcGX7sOwXHgXHCkOqpMcS7MdOvx3uW59dXBrDUJEt6M3L2yhu-pDpeu12fRt0kJqkMioGVMBc76KT_ky8Gp0d00Ljfs-PswWEnZf98MQEwdjhh3Kd0qxi6k8WSsODO1tir5Ol_XQJ2vA-lCNptUJH20iJPpQJ6zUYX8QPYva1PcqBAw",
    imageAlt: "Ergonomik Yönetici Koltuğu Black Edition",
    name: "Ergonomik Yönetici Koltuğu Black Edition",
    sku: "TN-11023",
    category: "Mobilya",
    unitPrice: "₺4,199.00",
    stock: "0",
    statusLabel: "PASIF",
    active: false,
    rowClassName: "opacity-75",
  },
  {
    id: "TN-00441",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnWXgE2QbKwU8Twykuy3Pezet1gHSA_kpdUXqkk--OwXMsKun99QchhzPfsc07fP1hHdegphOF93LsOgIM_ERQ00TsJWYMC7u69uTPecftw4WW8e8zwXUzhOPYNfMxGrQozca6GFYRJ_QDORY9j0Lt7vfY4ke42EZuchR9vnvsf5Y0i2r8EF5t4IfRo3dm8UVQWeq3rQh54PZkdUhIStwGPzx0wiiwHytWtPvvsIY8ag4vuvI-vKA0mpONMcYIAvFPsXGGoYcDuuM",
    imageAlt: "ProTab X10 Enterprise Edition 256GB",
    name: "ProTab X10 Enterprise Edition 256GB",
    sku: "TN-00441",
    category: "Elektronik",
    unitPrice: "₺14,500.00",
    stock: "215",
    statusLabel: "YAYINDA",
    active: true,
  },
];

function getStatusBadgeClassName(status: ProductRow["statusLabel"]): string {
  if (status === "YAYINDA") {
    return "bg-green-50 text-green-700";
  }

  if (status === "ONAY BEKLIYOR") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getStatusDotClassName(status: ProductRow["statusLabel"]): string {
  if (status === "YAYINDA") {
    return "bg-green-500";
  }

  if (status === "ONAY BEKLIYOR") {
    return "bg-amber-500";
  }

  return "bg-slate-500";
}

export default function SellerProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Ürünlerim</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Platformdaki tüm envanterinizi ve onay bekleyen ürünlerinizi buradan yönetin.
          </p>
        </div>
        <Link
          href="/satici-panelim/urun-yukle"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-md shadow-primary/20 transition-all hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Yeni Ürün Ekle
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconContainerClassName}`}
              >
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-4 text-slate-700">{card.label}</p>
                <h3 className="mt-1 text-[26px] font-semibold leading-none tracking-tight text-slate-900">
                  {card.value}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-surface-container-lowest">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Ürün Kategorileri</option>
                <option>Elektronik</option>
                <option>Tekstil</option>
                <option>Gıda</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <div className="relative">
              <select className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Stok</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <div className="relative">
              <select className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Durum</option>
                <option>Yayında</option>
                <option>Onay Bekliyor</option>
                <option>Pasif</option>
                <option>Reddedildi</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <button className="px-2 text-sm font-semibold text-primary hover:underline">
              Filtreleri Temizle
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs font-medium text-slate-400">Görünüm:</span>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-200/50 bg-surface-container-low/50">
              <tr>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Ürün
                </th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  SKU
                </th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Kategori
                </th>
                <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Birim Fiyat
                </th>
                <th className="px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Stok
                </th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Durum
                </th>
                <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  İşlemler
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {productRows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-slate-50/50 ${row.rowClassName ?? ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.imageUrl}
                          alt={row.imageAlt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-500">{row.sku}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-500">{row.category}</span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-on-surface">{row.unitPrice}</p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-medium ${row.stock === "0" ? "font-bold text-red-500" : "text-on-surface-variant"}`}
                    >
                      {row.stock}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-tighter ${getStatusBadgeClassName(row.statusLabel)}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClassName(row.statusLabel)}`}
                      ></span>
                      {row.statusLabel === "ONAY BEKLIYOR" ? "Onay Bekliyor" : row.statusLabel === "YAYINDA" ? "Yayında" : "Pasif"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-slate-400 transition-colors hover:text-primary" title="Düzenle">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="text-slate-400 transition-colors hover:text-error" title="Sil">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>

                      {row.statusLabel === "ONAY BEKLIYOR" ? (
                        <label
                          className="relative inline-flex cursor-not-allowed items-center opacity-50"
                          title="Onay Bekleyen ürün durumu değiştirilemez"
                        >
                          <input type="checkbox" disabled className="sr-only" />
                          <div className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:content-['']"></div>
                        </label>
                      ) : (
                        <label
                          className="relative inline-flex cursor-pointer items-center"
                          title="Aktif/Pasif"
                        >
                          <input type="checkbox" className="peer sr-only" defaultChecked={row.active} />
                          <div className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 bg-slate-50/30 p-6 sm:flex-row">
          <p className="text-sm text-on-surface-variant">Toplam 12,482 üründen 1-10 arası gösteriliyor</p>
          <div className="flex items-center gap-1">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white hover:shadow-sm">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-md shadow-primary/20">
              1
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg font-medium text-on-surface transition-all hover:bg-white hover:shadow-sm">
              2
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg font-medium text-on-surface transition-all hover:bg-white hover:shadow-sm">
              3
            </button>
            <span className="px-2 text-slate-400">...</span>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg font-medium text-on-surface transition-all hover:bg-white hover:shadow-sm">
              1249
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white hover:shadow-sm">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <section className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <span className="material-symbols-outlined">info</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">İpucu: Ürün Onay Süreçleri</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Yeni eklenen ürünler admin panelinde onaylanana kadar &quot;Onay Bekliyor&quot; statüsünde kalır ve son kullanıcıya gösterilmez.
          </p>
        </div>
      </section>
    </div>
  );
}