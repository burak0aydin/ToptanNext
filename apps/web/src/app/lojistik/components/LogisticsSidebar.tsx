'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type LogisticsSidebarProps = {
  isHidden: boolean;
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

export function LogisticsSidebar({ isHidden }: LogisticsSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.includes(href);

  return (
    <aside
      className={[
        "hidden md:flex fixed left-0 top-0 z-40 h-full w-64 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 py-4 font-['Inter'] text-sm font-semibold tracking-tight text-slate-400 shadow-xl transition-all duration-300",
        isHidden ? 'md:-translate-x-full' : 'md:translate-x-0',
      ].join(' ')}
    >
      <div className="px-6 pb-6 pt-2">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          ToptanNext
        </Link>
        <p className="mt-1 text-xs font-normal text-slate-400">Lojistik Paneli</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {menuSections.map((section) => (
          <div className="mb-4" key={section.title}>
            <h3 className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined shrink-0 text-[22px]">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
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
