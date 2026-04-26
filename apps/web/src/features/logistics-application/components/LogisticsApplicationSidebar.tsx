import Link from 'next/link';

type LogisticsApplicationSidebarProps = {
  activeStep: 1 | 2 | 3 | 'result';
};

const buttonBaseClass = 'flex w-full items-center gap-3 rounded-lg p-3.5 text-left text-sm font-semibold';
const enabledClass = 'text-slate-500 transition-colors hover:bg-slate-100';
const activeClass = 'border border-primary/20 bg-primary/10 font-bold text-primary shadow-sm';

export function LogisticsApplicationSidebar({ activeStep }: LogisticsApplicationSidebarProps) {
  return (
    <aside className='w-full md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]'>
      <div className='h-auto flex flex-col gap-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm'>
        <div className='mb-4'>
          <h2 className='text-lg font-bold text-blue-900'>Lojistik Partner Başvuru Formu</h2>
          <p className='text-slate-500 text-xs font-medium'>ToptanNext Pazaryeri</p>
        </div>

        <nav className='flex flex-col gap-2'>
          <Link
            className={`${buttonBaseClass} ${activeStep === 1 ? activeClass : enabledClass}`}
            href='/lojistik/basvuru'
          >
            <span className='material-symbols-outlined'>business</span>
            <span className='whitespace-nowrap'>Şirket Bilgileri</span>
          </Link>

          <Link
            className={`${buttonBaseClass} ${activeStep === 2 ? activeClass : enabledClass}`}
            href='/lojistik/basvuru/iletisim-ve-finans'
          >
            <span className='material-symbols-outlined'>description</span>
            <span className='whitespace-nowrap'>İletişim ve Finans</span>
          </Link>

          <Link
            className={`${buttonBaseClass} ${activeStep === 3 ? activeClass : enabledClass}`}
            href='/lojistik/basvuru/belge-yukleme-ve-onay'
          >
            <span className='material-symbols-outlined'>inventory_2</span>
            <span className='whitespace-nowrap'>Belge Yükleme ve Onay</span>
          </Link>

          <Link
            className={`${buttonBaseClass} ${activeStep === 'result' ? activeClass : enabledClass}`}
            href='/lojistik/basvuru/basvuru-sonucu'
          >
            <span className='material-symbols-outlined'>task_alt</span>
            <span className='whitespace-nowrap'>Lojistik Başvuru Sonucu</span>
          </Link>
        </nav>

        <div className='mt-8 pt-6 border-t border-slate-200'>
          <h3 className='text-xs font-bold text-slate-900 uppercase tracking-widest mb-4'>
            Neden Lojistik Partner Olmalısınız?
          </h3>

          <div className='space-y-4'>
            <div className='flex items-start gap-3'>
              <span className='material-symbols-outlined text-primary text-lg'>verified</span>
              <p className='text-xs text-slate-600 leading-relaxed'>
                Güvenilir iş ortaklığı modeli ile sevkiyat ağınızı daha geniş bir müşteri kitlesine ulaştırın.
              </p>
            </div>

            <div className='flex items-start gap-3'>
              <span className='material-symbols-outlined text-primary text-lg'>route</span>
              <p className='text-xs text-slate-600 leading-relaxed'>
                Bölge, filo ve yetki belgelerinize göre size en uygun operasyon fırsatlarını değerlendirin.
              </p>
            </div>

            <div className='flex items-start gap-3'>
              <span className='material-symbols-outlined text-primary text-lg'>payments</span>
              <p className='text-xs text-slate-600 leading-relaxed'>
                Şeffaf teklif akışı ve düzenli süreç yönetimiyle operasyonlarınızı daha verimli yönetin.
              </p>
            </div>
          </div>
        </div>

        <button
          className='mt-6 w-full py-3 bg-primary-container/10 text-primary font-bold text-xs rounded-lg hover:bg-primary-container/20 transition-colors uppercase tracking-widest'
          type='button'
        >
          Yardım
        </button>
      </div>
    </aside>
  );
}
