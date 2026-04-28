'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type LogisticsSidebarProps = {
  isCollapsed: boolean;
};

const menuSections = [
  {
    title: 'Ana Ekran',
    items: [
      { href: '/lojistik/genel-bakis', icon: 'dashboard', label: 'Genel Bakış' },
      { href: '/lojistik/mesajlar', icon: 'forum', label: 'Mesajlar' },
    ],
  },
  {
    title: 'İş Bul & Teklif Ver',
    items: [
      { href: '/lojistik/acik-talepler', icon: 'local_shipping', label: 'Açık Yük İlanları' },
      { href: '/lojistik/verdigim-teklifler', icon: 'pending_actions', label: 'Verdiğim Teklifler' },
    ],
  },
  {
    title: 'Operasyon',
    items: [
      { href: '/lojistik/aktif-seferler', icon: 'route', label: 'Aktif Seferler' },
      { href: '/lojistik/gecmis-isler', icon: 'task_alt', label: 'Geçmiş / Tamamlanan İşler' },
    ],
  },
  {
    title: 'Finans ve Yönetim',
    items: [
      { href: '/lojistik/cuzdan-kazanclar', icon: 'account_balance_wallet', label: 'Cüzdan ve Kazançlar' },
      { href: '/lojistik/faturalar', icon: 'receipt_long', label: 'Faturalar' },
      { href: '/lojistik/filo-araclarim', icon: 'directions_car', label: 'Filo ve Araçlarım' },
      { href: '/lojistik/ayarlar', icon: 'settings', label: 'Ayarlar' },
    ],
  },
] as const;

export function LogisticsSidebar({ isCollapsed }: LogisticsSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.includes(href);

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 h-full z-40 fixed left-0 top-0 pt-0 font-['Inter'] text-sm font-semibold divide-y divide-slate-800 transition-all duration-200 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`p-6 ${isCollapsed ? 'px-4' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-start gap-3' : 'gap-3'} mb-2`}>
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              local_shipping
            </span>
          </div>
          {isCollapsed ? null : (
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">ToptanNext</h2>
              <p className="text-xs font-normal text-slate-400">Lojistik Paneli</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuSections.map((section) => (
          <div className={`${isCollapsed ? 'px-2' : 'px-3'} mb-6`} key={section.title}>
            {isCollapsed ? null : (
              <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex w-full items-center rounded-lg transition-all duration-200 ease-in-out border-r-4 ${
                        active
                          ? 'bg-blue-900/50 text-blue-400 border-blue-500'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined shrink-0">
                        {item.icon}
                      </span>
                      {isCollapsed ? null : <span className="px-3 py-2.5">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
