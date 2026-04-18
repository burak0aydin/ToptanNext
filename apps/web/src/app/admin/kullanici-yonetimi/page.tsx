import { AdminPageHeader } from "../_components/AdminPageHeader";

type UserRow = {
  initials: string;
  initialsClassName: string;
  name: string;
  id: string;
  email: string;
  role: string;
  roleClassName: string;
  createdAt: string;
};

const growthBars = [
  { label: "Pzt", heightClassName: "h-[40%]", isActive: false },
  { label: "Sal", heightClassName: "h-[55%]", isActive: false },
  { label: "Çar", heightClassName: "h-[75%]", isActive: false },
  { label: "Per", heightClassName: "h-[95%]", isActive: true },
  { label: "Cum", heightClassName: "h-[60%]", isActive: false },
  { label: "Cmt", heightClassName: "h-[45%]", isActive: false },
  { label: "Paz", heightClassName: "h-[30%]", isActive: false },
] as const;

const users: UserRow[] = [
  {
    initials: "AY",
    initialsClassName: "bg-blue-100 text-blue-700",
    name: "Ahmet Yılmaz",
    id: "#UX-20934",
    email: "ahmet.yilmaz@toptannext.com",
    role: "satıcı",
    roleClassName: "bg-blue-50 text-blue-700",
    createdAt: "12 Ekim 2023",
  },
  {
    initials: "MA",
    initialsClassName: "bg-orange-100 text-orange-700",
    name: "Mehmet Aksoy",
    id: "#UX-20812",
    email: "m.aksoy@gmail.com",
    role: "alıcı",
    roleClassName: "bg-slate-100 text-slate-700",
    createdAt: "11 Ekim 2023",
  },
  {
    initials: "EK",
    initialsClassName: "bg-purple-100 text-purple-700",
    name: "Elif Kaya",
    id: "#UX-20755",
    email: "elif.kaya@outlook.com",
    role: "Admin",
    roleClassName: "bg-indigo-50 text-indigo-700",
    createdAt: "10 Ekim 2023",
  },
  {
    initials: "CD",
    initialsClassName: "bg-emerald-100 text-emerald-700",
    name: "Can Demir",
    id: "#UX-20621",
    email: "c_demir@toptannext.com",
    role: "lojistik",
    roleClassName: "bg-blue-50 text-blue-700",
    createdAt: "09 Ekim 2023",
  },
  {
    initials: "ST",
    initialsClassName: "bg-rose-100 text-rose-700",
    name: "Selin Tekin",
    id: "#UX-20511",
    email: "selin.tekin@info.com",
    role: "alıcı",
    roleClassName: "bg-slate-100 text-slate-700",
    createdAt: "08 Ekim 2023",
  },
];

export default function AdminUserManagementPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        actions={
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrele
          </button>
        }
        description="Platforma kayıtlı kullanıcıları ve rollerini yönetin."
        title="Kullanıcı Yönetimi"
      />

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  groups
                </span>
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Toplam Kullanıcı Sayısı
              </p>
              <h3 className="mt-2 text-4xl font-extrabold tracking-tight text-on-surface">
                45,289
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="flex items-center font-bold text-emerald-600">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                12.5%
              </span>
              <span className="italic text-on-surface-variant">Geçen aydan bu yana</span>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
            <div className="mb-8 flex items-center justify-between">
              <h4 className="text-lg font-bold text-on-surface">Kullanıcı Artış Analizi</h4>
              <div className="flex rounded-lg bg-surface-container p-1">
                <button className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm transition-all">
                  Günlük
                </button>
                <button className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary">
                  Haftalık
                </button>
                <button className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary">
                  Aylık
                </button>
              </div>
            </div>

            <div className="flex h-48 items-end justify-between gap-3">
              {growthBars.map((bar) => (
                <div key={bar.label} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className={
                      bar.isActive
                        ? `w-full rounded-t-lg bg-primary-container transition-all ${bar.heightClassName}`
                        : `w-full rounded-t-lg bg-primary-fixed transition-all hover:bg-primary-container ${bar.heightClassName}`
                    }
                  />
                  <span
                    className={
                      bar.isActive
                        ? "mt-2 text-[10px] font-bold text-primary"
                        : "mt-2 text-[10px] font-semibold text-on-surface-variant"
                    }
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-6 py-4">
            <h4 className="font-bold text-on-surface">Son Kayıtlı Kullanıcılar</h4>
            <button className="flex items-center gap-2 text-xs font-bold text-primary transition-all hover:underline">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrele
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    E-posta Adresi
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${user.initialsClassName}`}
                        >
                          {user.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{user.name}</p>
                          <p className="text-[10px] font-medium text-on-surface-variant">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${user.roleClassName}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{user.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-blue-900">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Görüntüle
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-error transition-colors hover:text-red-800">
                          <span className="material-symbols-outlined text-sm">block</span>
                          Banla
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-surface-container px-6 py-4 text-xs font-semibold text-on-surface-variant">
            <span>Toplam 45,289 kullanıcıdan 5 tanesi gösteriliyor</span>
            <div className="flex items-center gap-2">
              <button className="rounded p-1 transition-colors hover:bg-surface-container">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="rounded bg-primary px-3 py-1 text-white">1</span>
              <button className="rounded p-1 transition-colors hover:bg-surface-container">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
