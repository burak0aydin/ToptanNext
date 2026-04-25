import { MainFooter } from '../components/MainFooter';
import { MainHeader } from '../components/MainHeader';

type LogisticsCardItem = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  tags: string[];
  premium?: boolean;
  verified?: boolean;
  rating?: number;
};

const logisticsCards: LogisticsCardItem[] = [
  {
    id: 'marmara-ekspres',
    title: 'Marmara Ekspres Ambar',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtISr7CFMKCStXn4gjuWSP66b-RKs5ZCYIam-T5NIC0RgGS1qn7wteFvgs3LcghH2DAXN1dWvHYGWSrlnlNeabZatG3NXZotuISY0hXEleRZ6qDRIXambm-0QUtXndIqWQtblYtoH0X5gs65OKSrD5E8QJqxS8BVPhMM34wcU3dlxAtUr6m3z-mBwY5ji4cqjpozo4Soqs5jFg5YreXTEuKGcj6k36M6YETaUYsXIkI-hRJmtOcDvJBuQfICT_MIHi96PegZVv9jo',
    description:
      'Marmara bölgesinin en geniş ambar ağına sahip, 40 yıllık tecrübesiyle ağır yük ve paletli gönderimlerinizde güvenilir çözüm ortağınız.',
    tags: ['Ağır Yük Taşıma', 'Paletli Gönderim'],
    premium: true,
    verified: true,
  },
  {
    id: 'hizli-kargo',
    title: 'Hızlı Kargo A.Ş.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIMoy4te7f5BTW1OX2oEe_W_ltj3gK3Oj-9-5_ddkTM548pb9evGLt25ZXYRzmkVcWLLEIa0Jf3ZDpYYF-dsMXtloPUZD_F6Tv68NVciRSuB9F_vOevN0Sog9LHstZ4Mo-8p-tlCplq8aSFz99_rBBIhEt7eqDPKzqFYZNEkMdBwBxk8X47-xZV2bhgmGl_yZ9lcSoL3lgm5OlYZOdrt4xH8Fa99aFgFC-Sc8jV1p5AJ-_tx4kziCytdeJ4PXXotO3KPJBeyymjXs',
    description:
      "Medikal ve gıda taşımacılığı için tam donanımlı filomuzla Türkiye'nin her noktasına kontrollü sıcaklık garantili sevkiyat sağlıyoruz.",
    tags: ['Soğuk Zincir', 'Ertesi Gün Teslimat'],
    rating: 4.8,
  },
  {
    id: 'ege-lojistik',
    title: 'Ege Lojistik',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCJX4lbk9pOkmd6HYSL9YsCA5mQlFifIVr7Gj8t4u7KtZ3jRWlOcq9wMCfm2yVwwgU-K92anM700IspIq_eSNlx8SJ5XQCVqa59BedHal8IN6yAxLEMHpCMhR0yIAk62L-0CkEobnh-zxZVQ2GYQM5R2kbDUnYQf5HyjUUkQWdfZaCW1rBMzFACpNrVIdSXZ7mM9i69tGk74EVoTmi5PfwqX7dYXmN1grBELNAZ-lyLGJtnwfxD4ZxT2SN7z7csM96GWiPjyXGlAAo',
    description:
      'Ege ve Akdeniz hattında günlük parsiyel seferler. Küçük ve orta ölçekli işletmeler için optimize edilmiş lojistik maliyet çözümleri.',
    tags: ['Parsiyel Taşıma', 'Paletli Gönderim'],
  },
  {
    id: 'anadolu-grup',
    title: 'Anadolu Lojistik Grup',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAp4xohDfI_eELqirQ9e_tURmaIoO9-ghhJfLcIXrcBeBZLV_cUfFGvo6NubVK9TtIocQtr_c2MYwD-D-k674USXo_-pMqACfv41XTmKDpb3PotbC0-0gNvN4EAs3n95rD_xA51YeTNeOGM1T3ddNU3rqXMGZBIZYcPEOgJHjzK0WU4z79iSF5yo-7ds_FUM7Gh0YCn4JlMXWvwk856fZgmIdD-IgHj2Bch2Hwz5DHgI2nRfptFTzWcvQxueDVkIa4cYla2yz8iIAc',
    description:
      'Uluslararası standartlarda gümrükleme ve konteyner taşımacılığı. İthalat ve ihracat süreçlerinizde entegre lojistik desteği.',
    tags: ['Konteyner Taşıma', 'Gümrükleme'],
  },
  {
    id: 'bursa-merkez',
    title: 'Bursa Lojistik Merkezi',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAFsOHqcfzPrkyQ2GyYwepuQTsMWB1ptsaCIbdGTgDKcIKthmGw04YNC2AbLWhTPId9KPD9th9_eirCQ2XNypCZRvUGs1KJCV7THtSS4l-cwkzM--_qL7MNpEQpCTyG3Ifd4h74uOs9wpvEFY8cKcE_io2BFXvzmwS1QWt3OSZOI2HjO0-jl5pvXFYNU2W3Oli_VxAtiOB8toVevqL3lvyRA3FLJmfODENwnwstSzSmjdOLzfHDRkfR3EfXqhP6XD2UCqeMln7liiU',
    description:
      'Sanayi şehrinin kalbinde stratejik depolama ve dağıtım çözümleri. Akıllı depo sistemleri ile stok yönetimi entegrasyonu.',
    tags: ['Depolama', 'Paletli Gönderim'],
  },
];

function LogisticsCard({ item }: { item: LogisticsCardItem }) {
  return (
    <div className='group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl'>
      <div className='relative h-48 overflow-hidden'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={item.title}
          className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          src={item.imageUrl}
        />
        {item.premium ? (
          <div className='absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-sm'>
            Premium Partner
          </div>
        ) : null}
      </div>

      <div className='flex flex-1 flex-col p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <h3 className='text-xl font-bold text-on-surface transition-colors group-hover:text-primary'>{item.title}</h3>
          {item.verified ? (
            <span
              className='material-symbols-outlined text-yellow-500'
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          ) : null}
          {item.rating ? (
            <div className='flex items-center gap-1'>
              <span className='text-sm font-bold text-on-surface'>{item.rating.toFixed(1)}</span>
              <span
                className='material-symbols-outlined text-sm text-amber-400'
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </div>
          ) : null}
        </div>

        <div className='mb-4 flex flex-wrap gap-2'>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className='rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant'
            >
              {tag}
            </span>
          ))}
        </div>

        <p className='mb-6 line-clamp-3 text-sm leading-relaxed text-on-surface-variant'>
          {item.description}
        </p>

        <div className='mt-auto grid grid-cols-2 gap-3'>
          <button
            className='flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-container active:scale-95'
            type='button'
          >
            <span className='material-symbols-outlined text-lg'>request_quote</span>
            Teklif İste
          </button>
          <button
            className='flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-high active:scale-95'
            type='button'
          >
            <span className='material-symbols-outlined text-lg'>forum</span>
            Sohbet Et
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsPage() {
  return (
    <div className='min-h-screen bg-surface text-on-surface antialiased'>
      <MainHeader />

      <main className='mx-auto max-w-screen-2xl px-6 py-12'>
        <section className='mb-12 rounded-xl border border-slate-100 bg-surface-container-lowest p-8 shadow-sm'>
          <div className='grid grid-cols-1 items-end gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block px-1 text-sm font-semibold text-on-surface'>Firma Adı</label>
              <div className='relative'>
                <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline'>
                  search
                </span>
                <input
                  className='w-full rounded-xl border-outline-variant/30 bg-surface-container-low py-3 pl-11 focus:border-primary focus:ring-primary'
                  placeholder='Lojistik firması ara...'
                  type='text'
                />
              </div>
            </div>
            <div>
              <label className='mb-2 block px-1 text-sm font-semibold text-on-surface'>Hizmet Tipi</label>
              <select className='w-full rounded-xl border-outline-variant/30 bg-surface-container-low py-3 focus:border-primary focus:ring-primary'>
                <option>Tüm Hizmetler</option>
                <option>Kargo</option>
                <option>Ambar</option>
                <option>Soğuk Zincir</option>
                <option>Ağır Yük</option>
              </select>
            </div>
            <div>
              <label className='mb-2 block px-1 text-sm font-semibold text-on-surface'>Hizmet Bölgesi</label>
              <select className='w-full rounded-xl border-outline-variant/30 bg-surface-container-low py-3 focus:border-primary focus:ring-primary'>
                <option>Tüm Türkiye</option>
                <option>Marmara Bölgesi</option>
                <option>Ege Bölgesi</option>
                <option>İç Anadolu</option>
              </select>
            </div>
          </div>
        </section>

        <section className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {logisticsCards.map((item) => (
            <LogisticsCard key={item.id} item={item} />
          ))}

          <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container p-8 text-white shadow-xl shadow-primary/20'>
            <div className='absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl' />
            <div className='relative z-10'>
              <span
                className='material-symbols-outlined mb-6 text-5xl'
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
              <h3 className='mb-4 text-2xl font-bold'>Kendi Filonuz mu Var?</h3>
              <p className='mb-8 leading-relaxed text-on-primary-container'>
                ToptanNext ekosistemine lojistik partneri olarak katılın, binlerce işletmenin sevkiyat taleplerine
                doğrudan ulaşın.
              </p>
              <button
                className='w-full rounded-xl bg-white py-3.5 font-bold text-primary transition-all hover:bg-slate-50 active:scale-95'
                type='button'
              >
                Hemen Başvur
              </button>
            </div>
          </div>
        </section>

      </main>

      <MainFooter />
    </div>
  );
}
