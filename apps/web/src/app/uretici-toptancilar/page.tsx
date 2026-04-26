import Link from 'next/link';
import { MainFooter } from '../components/MainFooter';
import { MainHeader } from '../components/MainHeader';

type SupplierProduct = {
  id: string;
  name: string;
  price: string;
  minOrder: string;
  unit: string;
  imageUrl: string;
};

type SupplierCard = {
  id: string;
  companyName: string;
  rating: string;
  ratingCount: string;
  companyAge: string;
  employeeCount: string;
  location: string;
  icon: string;
  metrics: Array<{ label: string; value: string; valueClassName?: string }>;
  galleryImageUrl: string;
  galleryCount: string;
  products: SupplierProduct[];
};

const suppliers: SupplierCard[] = [
  {
    id: 'global-tekstil',
    companyName: 'Global Tekstil San. ve Tic. A.Ş.',
    rating: '4.8',
    ratingCount: '124 Yorum',
    companyAge: '12 Yıllık Şirket',
    employeeCount: '500+ Çalışan',
    location: 'Bursa, TR',
    icon: 'factory',
    metrics: [
      { label: 'Fabrika Kapasitesi:', value: '50.000 adet/ay' },
      { label: 'Yanıt Süresi:', value: '< 2 Saat' },
      { label: 'Zamanında Teslimat:', value: '%98.5', valueClassName: 'text-[#059669]' },
    ],
    galleryImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfudEL5B2tMqpv4i2AOWxmoAIomzsnwqFsQ4y6st5uSH9NwCt4LbaTW69M0Nfdza2r0C5bLp_yZxtgmg1u8EkRb8ybjLk8_IAVfSCFEZ-quQW5anUGTMSHUhDHpic448NvU27RTtDPuC3s-a0_0R4HxMSKyRt_rg5_-Oq6biTEWCKAGazk7m-sgjjjQwkAfw9ZTpddc2Ioq5qqv8nvn8T0AtI3TGGPvxtuQ8Q0IrfcTjNOMkSkZlG1tAbqQYGhsEY720zGb99Mzuc',
    galleryCount: '1/24',
    products: [
      {
        id: 'tshirt',
        name: 'Pamuklu Tişört',
        price: '₺ 145.00',
        unit: '/ adet',
        minOrder: 'MSM: 500 Adet',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDn8IeiwwJcbvUxjFJplyaHSctW1vQBTLXEEvII48YICacIIexZEpXRS6lBOK5Pk0uNQCrAuKF741caoBlKXfyKCCERhlf8aQ1Ymr94HuVXv0PWiz1CdnYDM7R3U84sxtIlQanJ8YQBJ1AO-QkEw41oWfXDfugjdjA0w_h-2vmyV7obFI6RjfulNV0wS501GXhi4kMItO839oqAtgaUQrjgDqgOSv4u0sesAEy5oU9UweUBAXJJHy9jrVSPUtNiReqXeR0tKvz_Ja0',
      },
      {
        id: 'denim',
        name: 'Premium Denim',
        price: '₺ 85.00',
        unit: '/ metre',
        minOrder: 'MSM: 1000 Metre',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1kAtiP-JIT0VggCjopo2jBNXRt1fr6ilEJaSQbK5fIBidIOMTVTvtnAxnFgUUVDSyu7ZHHyReSQuEcTofgusgG43nRbrqHWO3bSnTbyC_uZHaOHjeP4-E0mUyRE-O9xuwLYI82UWY0yaWAVRikGpk9JdmaqgC8er2OekfLOcfQZBYlA_o6Qy6exj_AjqIL-tiq5XhcFSTjybHK2bHtvXNI8Q9VyDkfH7IkCLeCHBnkoyhSrU8drgwESBYuNX_4Qf1kBedve0YPc',
      },
      {
        id: 'sweatshirt',
        name: 'Kapüşonlu Sweatshirt',
        price: '₺ 320.00',
        unit: '/ adet',
        minOrder: 'MSM: 250 Adet',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuASG1mcZ4DK9qP6U8FCg8YSNWP4GOVH0daQugByVZaDigBEZF83b1lbpNfRB_BJdeEYiHurjVkAU-5EnYUubq5785CllMt9jDv7dX3-nsgwYzvSj6YAyJkFEuyK75ul7mAaE8AuAxzb66TNot6KYtofCvrIHNbCv-OoWejGQVKJAdE2tZ9lZQps8eqEi4JCe_iHxxrGntX01Kx0a3wpYNcYEh66y4YMV06yTTgjAk4-raWsvGQ90YtjPdrFz9_P-bbmfOCSaqAk9wY',
      },
    ],
  },
  {
    id: 'apex-endustriyel',
    companyName: 'Apex Endüstriyel Makine ve Metal Ltd.',
    rating: '4.9',
    ratingCount: '86 Yorum',
    companyAge: '8 Yıllık Şirket',
    employeeCount: '150+ Çalışan',
    location: 'Kocaeli, TR',
    icon: 'precision_manufacturing',
    metrics: [
      { label: 'Aylık Kapasite:', value: '10.000 Ton' },
      { label: 'Yanıt Süresi:', value: '< 4 Saat' },
      { label: 'İhracat Oranı:', value: '%65' },
    ],
    galleryImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfjIzu2pELYhlnefUE4uD_X5Uo7Q7FKFjg3UP9sAxn4tHIOaBa9bvmXbOnfAnYaVLdHviOjezP6vY6MF_Ycbu1zL2W-ewcKkTY_GGKjb9XRurUmSJpLXEaXFzU-QR1xfJEm7AMlbe11PDL0zAl-0pv_isucbX2smxozrlX5uGtOi_XuPL-pwau8N7jKKoF3EGar9in5VmGFa3An_Xn2JLPc0WZIu18NasWYQ-4HVaApwsdWIEumgvgI_2RAKoO4KT7gFTsQwhl6a8',
    galleryCount: '1/15',
    products: [
      {
        id: 'steel-pipes',
        name: 'Endüstriyel Çelik Borular',
        price: '₺ 4,500.00',
        unit: '/ ton',
        minOrder: 'MSM: 10 Ton',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA2RrmKT0hzB3kW1_y4fQI8mfzHg91YEq43e0YJHBk8-HGRMNm2LzkkNxwtTwQFULaewH8QzB1E5fRiPMv6QfM6kLGPx2HBt7oJ0ii2okqihvIimo79DJiJ2KauiccklE9wrIJmupsaF0psAhNtffPJUVdsvR9O42lqKqS5u3ixbjR8tjBv-hDDxLVgBtuoODvp_Zcns-aYXc7JDWLZpC2BqQd1czy870xp3n9ggcokr5tKMXVshKnApyXyEqZvuaf7N4xYHpUmAAA',
      },
      {
        id: 'cnc-parts',
        name: 'CNC İşlenmiş Metal Parçalar',
        price: 'Fiyat Sorunuz',
        unit: '',
        minOrder: 'MSM: 50 Adet',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD4qOHv0MlmnsZjsBtuVvcIGRd2dvtj2myuxdmBerxWYGgIw7EmVWFOycY3EfiVNqSkCQ3MM6iYRKimvwcev5xQoAZf0Zt25zsybGiCpd_XzUNbZUPIoZSjlH_X8izozkmc_VYeXhu7U5WIkOwv-p9dRK4XRVZ_ana4E_R8xb-nLC4PGVaqpiqC6V9Pg7R7S6F2rrci7xLFUK6PhEmksGzuFCXaL5m-4qjcco7NYfiB4vIfa2Cn-dXEjtu9VBI8r89OkynhjlyTsW8',
      },
      {
        id: 'industrial-valve',
        name: 'Endüstriyel Valf',
        price: '₺ 1,250.00',
        unit: '/ adet',
        minOrder: 'MSM: 20 Adet',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBALON2ImUqis3_gCT8l1ixdT_--4mvLGYSyov5DQ1dhkvxbcfoBco3TD7Yn4D0U0h3Jb25CSr1qr1naxSWGT00mhbq5YEV_Hx4QxuhbczBJCGebRixIihZy0aZrUgut-UnW7paRAHzmf0E5S8VfX8dGHFLGSphR6TCrXWLyWv9JhfsspjC9JJVV1fb7bFvriwYpFnWQfvVPn4TVLs28hdJiQTU4XC4r75i1_hvcD6uOERTQcaUJqxYF7irSdAOu_O8vw4a3S2Zr44',
      },
    ],
  },
];

function SupplierCard({ supplier }: { supplier: SupplierCard }) {
  return (
    <article className='flex flex-col gap-8 rounded-xl bg-surface-container-lowest p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] xl:flex-row'>
      <div className='flex flex-col gap-4 xl:w-[320px]'>
        <div className='flex items-start gap-4'>
          <div className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-low'>
            <span className='material-symbols-outlined text-3xl text-primary'>{supplier.icon}</span>
          </div>
          <div>
            <h2 className='mb-1 text-lg font-semibold leading-tight text-on-surface'>{supplier.companyName}</h2>
          </div>
        </div>

        <div className='mt-2 grid grid-cols-2 gap-x-4 gap-y-2'>
          <div className='flex items-center gap-1.5 text-sm text-on-surface-variant'>
            <span
              className='material-symbols-outlined text-[16px] text-[#F59E0B]'
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className='font-semibold text-on-surface'>{supplier.rating}</span> ({supplier.ratingCount})
          </div>
          <div className='flex items-center gap-1.5 text-sm text-on-surface-variant'>
            <span className='material-symbols-outlined text-[16px]'>business</span>
            {supplier.companyAge}
          </div>
          <div className='flex items-center gap-1.5 text-sm text-on-surface-variant'>
            <span className='material-symbols-outlined text-[16px]'>group</span>
            {supplier.employeeCount}
          </div>
          <div className='flex items-center gap-1.5 text-sm text-on-surface-variant'>
            <span className='material-symbols-outlined text-[16px]'>location_on</span>
            {supplier.location}
          </div>
        </div>

        <div className='my-2 h-px bg-surface-container-highest' />

        <div className='space-y-2'>
          {supplier.metrics.map((metric) => (
            <div key={metric.label} className='flex justify-between text-sm'>
              <span className='text-on-surface-variant'>{metric.label}</span>
              <span className={`font-medium text-on-surface ${metric.valueClassName ?? ''}`}>{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className='flex-1 border-y border-surface-container-highest py-6 xl:border-x xl:border-y-0 xl:px-6 xl:py-0'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-on-surface'>Popüler Ürünler</h3>
          <Link className='flex items-center text-sm font-medium text-primary hover:underline' href='#'>
            Tümünü Gör <span className='material-symbols-outlined text-[16px]'>chevron_right</span>
          </Link>
        </div>

        <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
          {supplier.products.map((product, index) => (
            <div key={product.id} className={`group cursor-pointer ${index === 2 ? 'hidden md:block' : ''}`}>
              <div className='relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-surface-container-low'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={product.name}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                  src={product.imageUrl}
                />
              </div>
              <div className='mb-1 font-semibold text-on-surface'>
                {product.price}{' '}
                {product.unit ? <span className='text-xs font-normal text-on-surface-variant'>{product.unit}</span> : null}
              </div>
              <div className='text-xs text-on-surface-variant'>{product.minOrder}</div>
            </div>
          ))}
        </div>
      </div>

      <div className='flex flex-col justify-between xl:w-[280px]'>
        <div className='relative mb-6 h-40 w-full overflow-hidden rounded-lg xl:h-48'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={`${supplier.companyName} tesis görseli`} className='h-full w-full object-cover' src={supplier.galleryImageUrl} />
          <div className='absolute bottom-2 right-2 flex items-center gap-1 rounded bg-inverse-surface/80 px-2 py-1 text-xs font-medium text-inverse-on-surface backdrop-blur-sm'>
            <span className='material-symbols-outlined text-[14px]'>photo_camera</span> {supplier.galleryCount}
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          <button className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container/10 py-2.5 font-medium text-primary transition-colors hover:bg-primary-container/20'>
            <span className='material-symbols-outlined text-[18px]'>chat</span> Hemen Sohbet Edin
          </button>
        </div>
      </div>
    </article>
  );
}

export default function UreticiToptancilarPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface'>
      <MainHeader />

      <main className='mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 md:px-6'>
        <div className='mb-6 flex flex-col items-center gap-4 rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] lg:flex-row'>
          <div className='relative w-full lg:flex-1'>
            <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant'>search</span>
            <input
              className='w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 pl-10 pr-4 text-sm placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
              placeholder='Firma adı ile ara...'
              type='text'
            />
          </div>

          <div className='flex w-full flex-col gap-4 sm:flex-row lg:w-auto'>
            {['Kategori', 'Sektör', 'Bölge'].map((label) => (
              <div key={label} className='relative w-full sm:w-[180px]'>
                <select className='w-full cursor-pointer appearance-none rounded-lg border border-outline-variant/50 bg-surface py-2.5 pl-4 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'>
                  <option value=''>{label}</option>
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant'>
                  expand_more
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-6'>
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
