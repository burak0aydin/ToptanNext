import { AdminPageHeader } from "./_components/AdminPageHeader";

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
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        actions={
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-sm">download</span>
            Rapor İndir
          </button>
        }
        description="Platform genelindeki güncel performans ve başvuru durumu."
        title="Genel Bakış"
      />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-5 rounded-xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${card.iconBg}`}>
                <span className="material-symbols-outlined text-3xl">{card.icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <h3 className="mt-1 text-3xl font-bold">{card.value}</h3>
                {card.hasUpTrend ? (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
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
              <h4 className="text-base font-bold text-on-surface">Bekleyen Satıcı Başvuruları</h4>
              <span className="animate-pulse rounded-lg bg-orange-500 px-3 py-1 text-xs font-black text-white">
                12 YENİ
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-container bg-surface-container-low">
                    <th className="px-4 py-3 font-semibold text-slate-600">Firma Adı</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Sektör</th>
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
                          <span className="font-bold text-on-surface">{row.companyName}</span>
                          <span className="text-[11px] text-slate-500">{row.time}</span>
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
              <h4 className="text-base font-bold text-on-surface">Bekleyen Lojistik Başvuruları</h4>
              <span className="animate-pulse rounded-lg bg-blue-600 px-3 py-1 text-xs font-black text-white">
                3 YENİ
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-container bg-surface-container-low">
                    <th className="px-4 py-3 font-semibold text-slate-600">Firma Adı</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Bölge</th>
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
                          <span className="font-bold text-on-surface">{row.companyName}</span>
                          <span className="text-[11px] text-slate-500">{row.time}</span>
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
                <p className="text-sm text-slate-500">Son 30 günlük yeni kayıt dağılımı</p>
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

            <div className="mb-8 flex flex-wrap items-center gap-4 sm:gap-6">
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
                <p className="text-sm text-slate-500">Günlük bazda toplam platform geliri (TRY)</p>
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
  );
}
