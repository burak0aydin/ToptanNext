'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoredLogisticsApplication,
  isLogisticsApplicationComplete,
  logisticsAuthorizationDocumentTypeLabels,
  logisticsFleetCapacityLabels,
  logisticsMainServiceTypeLabels,
  logisticsServiceRegionLabels,
  type LogisticsApplicationStoredData,
} from '@/features/logistics-application/logistics-application.store';
import { MainFooter } from '../../../components/MainFooter';
import { MainHeader } from '../../../components/MainHeader';

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export default function LogisticsApplicationResultPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<LogisticsApplicationStoredData | null>(null);

  useEffect(() => {
    const stored = getStoredLogisticsApplication();
    setApplication(stored);
    setIsLoading(false);
  }, []);

  const isComplete = useMemo(() => {
    if (!application) {
      return false;
    }

    return isLogisticsApplicationComplete(application);
  }, [application]);

  const stepOne = application?.stepOne;
  const stepTwo = application?.stepTwo;

  const selectedMainServices = stepOne?.mainServiceTypes?.map((value) => logisticsMainServiceTypeLabels[value as keyof typeof logisticsMainServiceTypeLabels]) ?? [];
  const selectedRegions = stepTwo?.serviceRegions?.map((value) => logisticsServiceRegionLabels[value as keyof typeof logisticsServiceRegionLabels]) ?? [];
  const selectedDocumentNames = application?.uploadedDocumentNames ? Object.values(application.uploadedDocumentNames).filter(Boolean) : [];

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <aside className='w-full md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]'>
          <div className='h-auto flex flex-col gap-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm'>
            <div className='mb-4'>
              <h2 className='text-lg font-bold text-blue-900'>Lojistik Partner Başvuru Formu</h2>
              <p className='text-slate-500 text-xs font-medium'>ToptanNext Pazaryeri</p>
            </div>

            <nav className='flex flex-col gap-2'>
              <button className='flex w-full items-center gap-3 rounded-lg p-3.5 text-left text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100' type='button' onClick={() => router.push('/lojistik/basvuru')}>
                <span className='material-symbols-outlined'>business</span>
                <span className='whitespace-nowrap'>Şirket Bilgileri</span>
              </button>

              <button className='flex w-full items-center gap-3 rounded-lg p-3.5 text-left text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100' type='button' onClick={() => router.push('/lojistik/basvuru/iletisim-ve-finans')}>
                <span className='material-symbols-outlined'>description</span>
                <span className='whitespace-nowrap'>İletişim ve Finans</span>
              </button>

              <button className='flex w-full items-center gap-3 rounded-lg p-3.5 text-left text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100' type='button' onClick={() => router.push('/lojistik/basvuru/belge-yukleme-ve-onay')}>
                <span className='material-symbols-outlined'>inventory_2</span>
                <span className='whitespace-nowrap'>Belge Yükleme ve Onay</span>
              </button>

              <div className='flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-sm font-bold text-primary shadow-sm'>
                <span className='material-symbols-outlined' style={{ fontVariationSettings: '"FILL" 1' }}>
                  task_alt
                </span>
                <span className='whitespace-nowrap'>Lojistik Başvuru Sonucu</span>
              </div>
            </nav>

            <div className='mt-8 pt-6 border-t border-slate-200'>
              <h3 className='text-xs font-bold text-slate-900 uppercase tracking-widest mb-4'>
                Bilgilendirme
              </h3>

              <div className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <span className='material-symbols-outlined text-primary text-lg'>
                    notification_important
                  </span>
                  <p className='text-xs text-slate-600 leading-relaxed'>
                    Başvurunuzun sonucu bu sayfadan canlı takip edilir.
                  </p>
                </div>

                <div className='flex items-start gap-3'>
                  <span className='material-symbols-outlined text-primary text-lg'>
                    schedule
                  </span>
                  <p className='text-xs text-slate-600 leading-relaxed'>
                    Sonuç bilgilendirmesi ortalama 24 saat içerisinde yapılır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className='min-w-0 flex-1'>
          <div className='mb-10'>
            <div className='flex justify-between items-end mb-4'>
              <div>
                <h1 className='text-3xl font-extrabold text-on-surface tracking-tight'>
                  Lojistik Başvuru Sonucu
                </h1>
                <p className='text-on-surface-variant mt-1'>
                  Başvurunuzun durumunu buradan takip edebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className='rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600'>
              Başvuru sonucu yükleniyor...
            </div>
          ) : null}

          {!isLoading && !application ? (
            <div className='space-y-4 rounded-xl border border-slate-200 bg-white p-6'>
              <h2 className='text-lg font-bold text-slate-900'>
                Henüz tamamlanmış bir lojistik başvurunuz bulunmuyor.
              </h2>
              <p className='text-sm text-slate-600'>
                Başvuru adımlarını tamamladıktan sonra sonuç bu ekranda görüntülenir.
              </p>
              <button
                className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'
                onClick={() => router.push('/lojistik/basvuru')}
                type='button'
              >
                Başvuruya Başla
                <span className='material-symbols-outlined text-base'>arrow_forward</span>
              </button>
            </div>
          ) : null}

          {!isLoading && application && !isComplete ? (
            <div className='space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6'>
              <h2 className='text-lg font-bold text-amber-900'>
                Başvurunuz henüz tamamlanmadı.
              </h2>
              <p className='text-sm text-amber-800'>
                Lütfen eksik adımları tamamlayın ve ardından sonucu tekrar kontrol edin.
              </p>
              <button
                className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'
                onClick={() => router.push(stepOne ? '/lojistik/basvuru/iletisim-ve-finans' : '/lojistik/basvuru')}
                type='button'
              >
                Başvuruya Devam Et
                <span className='material-symbols-outlined text-base'>arrow_forward</span>
              </button>
            </div>
          ) : null}

          {!isLoading && application ? (
            <div className='space-y-6'>
              <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700'>
                    <span className='material-symbols-outlined text-base'>schedule</span>
                    İnceleniyor
                  </span>
                  <span className='text-xs text-slate-500'>
                    Son güncelleme: {formatDate(application.submittedAt)}
                  </span>
                </div>

                <h2 className='mt-4 text-xl font-bold text-slate-900'>
                  Lojistik partner başvurunuz alındı.
                </h2>
                <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                  Başvurunuz lojistik ekibi tarafından incelenecek ve uygun görülmesi halinde sizinle iletişime geçilecektir.
                </p>

                {isComplete ? (
                  <div className='mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
                    Tüm adımlar tamamlandı ve başvurunuz değerlendirme kuyruğuna alındı.
                  </div>
                ) : null}
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <h3 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                    Başvuru Özeti
                  </h3>
                  <dl className='mt-4 space-y-3 text-sm'>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Firma</dt>
                      <dd className='font-semibold text-slate-800 text-right'>{stepOne?.companyName ?? '-'}</dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Lojistik Yetki Belgesi</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {stepOne?.logisticsAuthorizationDocumentType ? (
                          stepOne.logisticsAuthorizationDocumentType === 'DIGER'
                            ? 'Diğer'
                            : stepOne.logisticsAuthorizationDocumentType
                        ) : '-'}
                      </dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Hizmet Tipleri</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {selectedMainServices.length > 0 ? selectedMainServices.join(', ') : '-'}
                      </dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Hizmet Bölgeleri</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {selectedRegions.length > 0 ? selectedRegions.join(', ') : '-'}
                      </dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Filo Kapasitesi</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {stepTwo?.fleetCapacity ? logisticsFleetCapacityLabels[stepTwo.fleetCapacity] : '-'}
                      </dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Yüklenen Belge Sayısı</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {selectedDocumentNames.length}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <h3 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                    Sonraki Adım
                  </h3>
                  <div className='mt-4 space-y-3 text-sm text-slate-600'>
                    <p>
                      Lojistik partner başvurunuz ortalama 24 saat içinde değerlendirilecektir.
                    </p>
                    <p>
                      Belgeleriniz ve operasyon bilginiz incelendikten sonra tarafınıza dönüş yapılır.
                    </p>
                    <p>
                      Başvurunun gönderildiği tarih: {formatDate(application.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
