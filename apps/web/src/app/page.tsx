import { MainFooter } from './components/MainFooter';
import { FeaturedSectorsCarousel } from './components/FeaturedSectorsCarousel';
import { HomeHeroSlider } from './components/HomeHeroSlider';
import { MainHeader } from './components/MainHeader';

export default function Home() {
  const products = [
    {
      sku: 'MSM: TX-9042',
      title: 'Premium Kablosuz Gurultu Engelleyici Kulaklik',
      price: 'TL2.450 - TL2.850',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCyGffFgAGO7jcnnfx3rjq_OK93CN6UfcFeKmQe23A-cH20TiXlSd9Yf5QVe6B_8iCFQu2tE2QgPIU_o4MCq1WG5WUV2F-ODuNaqrjudtwiVBBpVExftDH5gCOI5nw4EzfpTWrhqTsLffY6PLgI-zFCrhU9cnqnCxJbGsTOoRnneGOxgXVW6dyGnQwWFAmX_y3jehayLK3rO-dSbZdCCsPHOv5sQHYqKAoW7oLA84aP9uvc6F_-u10ieOukAchEpBFV6Ab6fTihmdI',
    },
    {
      sku: 'MSM: TX-3312',
      title: 'Hafif Tabanli Profesyonel Kosu Ayakkabisi',
      price: 'TL850 - TL980',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCwQkkBIUOKiFYD0bzAR2U3StlTDtFYpe-LHPFJZBITlRzFyM1YKpcTIyW3BtD204B74M1dbrqtI8mxL-jUPBOcxEfkTegVRyrhtK9X_rovU8V7WD2gBvR3GV51rTSnfT-ACnK_yuG92wEX6NfjFVGVWqVGUdSAV7YllsVx-xwERkIP6xDGvO8DNKxSVSnYGPIXAxkbmgTrRvhCVwpgclJUXPAOotyhd1LwvlUoxM02K19tGNfx5sbzWczQCaYMSr5Ec0txHzm-Uos',
    },
    {
      sku: 'MSM: TX-1188',
      title: 'Ergonomik Fileli Ofis Calisma Koltugu',
      price: 'TL1.150 - TL1.400',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ5E4iuehvVbr3rXzlausdIiQIEDRK3AD0Qc4jKECawiOf5Y18GAa_72SipRGX81vp2Hxb7BfmkNPEhBCbZjz00Fby4DaeFcEaw35_WfENR9MS1qA8GzUtY14ykqo1InLxzSBEzv6xmH9IKIbIovKYABP6o4KBvpmZhsJgCqnMv7MzTI9E1thaZK5nmXuV8xRMIpZsO_aVmQqETwy4otshkQDQPaCMHEBuumchyh5vu1kFfZYkX1oDedMhE46bYFA0nQ-M22brMDw',
    },
    {
      sku: 'MSM: TX-5521',
      title: 'Minimalist Tasarim Akilli Kol Saati',
      price: 'TL1.120 - TL1.450',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD0XCb_Tof0DrAwcF3y1aV_fhE1C7GbRbsfZ6Ak1YF9DHx7KO3Hw91dR5p2CnDoX1ohevogkW6X7AXn_v7Uiit5JgsMKos_lzph8RTRWguwIpRukjfgEMIlXDqd4sn71znTDvV65HsU1B7xndtjURk4BUJaRrgsxMMF0TgHd-ZdkOdZg9vswb5xOiWkBFwafSUVJDKWojmAeA-z5lNceT5bqefs_4BMOJo4YyRJlLnz9VrbWaY-DvKwF4JDIWGz4G8lHcVQK9wK5s0',
    },
    {
      sku: 'MSM: TX-7733',
      title: '20000mAh Endustriyel Power Bank - Su Gecirmez',
      price: 'TL350 - TL420',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB5lMjWFwfR3tVtOzfFmMUf5fG5VZhUof-3cp3MPscPC2BsVpw1CebYQp8cYKmvMdO1Ay4v7672xLEMOeZcUEZXF87jQpScx544ftob7ZKbWzv5Hfj1oBkG9lb_1j1_Z1LOndWqO7HCgdb_gGuUmLJ4KykXZTECM9I2rDbZiU1J25Ek1524sBvNqTAOkMO96qDjZ1qAtgMr6fWS5e12hpfKJ7PqRMu3t32i4IjLktLnZ-8tRuF0yix5r3QW7y6aqVp7rB-mA2FYBmE',
    },
  ];

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='flex-1'>
        <HomeHeroSlider />

        <FeaturedSectorsCarousel />

        <section className='bg-[#F8FAFC] py-16'>
          <div className='container mx-auto px-6'>
            <div className='mb-10 flex items-center justify-between'>
              <h2 className='text-3xl font-bold text-on-surface'>Kesfetmeye Devam Et</h2>
              <div className='relative'>
                <select className='appearance-none rounded-lg border border-outline-variant/30 bg-white px-4 py-2 pr-10 text-sm font-medium'>
                  <option>Onerilen</option>
                  <option>En Yeniler</option>
                  <option>Fiyata Gore (Artan)</option>
                  <option>Fiyata Gore (Azalan)</option>
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-outline'>
                  expand_more
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
              {products.map((product) => (
                <div
                  key={product.title}
                  className='group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md'
                >
                  <div className='aspect-square overflow-hidden bg-slate-50'>
                    <img
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                      src={product.image}
                      alt={product.title}
                    />
                  </div>
                  <div className='p-4'>
                    <p className='mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'>
                      {product.sku}
                    </p>
                    <h3 className='mb-3 min-h-[40px] line-clamp-2 text-sm font-bold text-on-surface'>
                      {product.title}
                    </h3>
                    <p className='mb-1 text-[10px] text-on-surface-variant'>Toptan Fiyat Araligi</p>
                    <div className='flex items-baseline gap-1'>
                      <span className='text-lg font-bold text-primary'>{product.price}</span>
                      <span className='text-[10px] text-on-surface-variant'>/ Adet</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-12 flex justify-center'>
              <button className='rounded-lg border border-outline-variant bg-white px-12 py-3 text-sm font-bold text-on-surface-variant shadow-sm'>
                Daha Fazla Yukle
              </button>
            </div>
          </div>
        </section>

      </main>

      <MainFooter />
    </div>
  );
}
