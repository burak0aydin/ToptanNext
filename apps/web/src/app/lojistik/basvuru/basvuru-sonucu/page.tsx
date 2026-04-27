'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAccessToken } from '@/lib/auth-token';
import {
  fetchMyLogisticsApplication,
  type LogisticsApplicationRecord,
} from '@/features/logistics-application/api/logistics-application.api';
import {
  isStepOneCompleted,
  isStepThreeCompleted,
  isStepTwoCompleted,
} from '@/features/logistics-application/api/logistics-application-progress';
import {
  logisticsAuthorizationDocumentTypeLabels,
  logisticsFleetCapacityLabels,
  logisticsMainServiceTypeLabels,
  logisticsServiceRegionLabels,
} from '@/features/logistics-application/logistics-application.store';
import { LogisticsApplicationSidebar } from '@/features/logistics-application/components/LogisticsApplicationSidebar';
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

function resolveStatusPresentation(status: LogisticsApplicationRecord['reviewStatus']): {
  label: string;
  icon: string;
  className: string;
} {
  if (status === 'APPROVED') {
    return {
      label: 'Onaylandı',
      icon: 'verified',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (status === 'REJECTED') {
    return {
      label: 'Reddedildi',
      icon: 'cancel',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  return {
    label: 'İnceleniyor',
    icon: 'schedule',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

function resolveContinuePath(application: LogisticsApplicationRecord): string {
  if (!isStepOneCompleted(application)) {
    return '/lojistik/basvuru';
  }

  if (!isStepTwoCompleted(application)) {
    return '/lojistik/basvuru/iletisim-ve-finans';
  }

  if (!isStepThreeCompleted(application)) {
    return '/lojistik/basvuru/belge-yukleme-ve-onay';
  }

  return '/lojistik/basvuru/basvuru-sonucu';
}

export default function LogisticsApplicationResultPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [application, setApplication] = useState<LogisticsApplicationRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplication = async () => {
      if (!hasAccessToken()) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await fetchMyLogisticsApplication();
        if (!isMounted) {
          return;
        }

        setApplication(data);
      } catch {
        if (isMounted) {
          setErrorMessage('Başvuru sonucu alınırken bir sorun oluştu.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApplication();

    return () => {
      isMounted = false;
    };
  }, []);

  const isComplete = useMemo(() => {
    if (!application) {
      return false;
    }

    return (
      isStepOneCompleted(application)
      && isStepTwoCompleted(application)
      && isStepThreeCompleted(application)
    );
  }, [application]);

  const selectedMainServices =
    application?.mainServiceTypes?.map((value) => logisticsMainServiceTypeLabels[value]) ?? [];
  const selectedRegions =
    application?.serviceRegions?.map((value) => logisticsServiceRegionLabels[value]) ?? [];
  const continuePath = application ? resolveContinuePath(application) : '/lojistik/basvuru';
  const statusPresentation = application
    ? resolveStatusPresentation(application.reviewStatus)
    : resolveStatusPresentation('PENDING');

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <LogisticsApplicationSidebar activeStep='result' />

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

          {!isLoading && errorMessage ? (
            <div className='rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700'>
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && !application ? (
            <div className='space-y-4 rounded-xl border border-slate-200 bg-white p-6'>
              <h2 className='text-lg font-bold text-slate-900'>
                Henüz bir lojistik başvurunuz bulunmuyor.
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

          {!isLoading && !errorMessage && application && !isComplete ? (
            <div className='space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6'>
              <h2 className='text-lg font-bold text-amber-900'>
                Başvurunuz henüz tamamlanmadı.
              </h2>
              <p className='text-sm text-amber-800'>
                Lütfen eksik adımları tamamlayın ve ardından sonucu tekrar kontrol edin.
              </p>
              <button
                className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'
                onClick={() => router.push(continuePath)}
                type='button'
              >
                Başvuruya Devam Et
                <span className='material-symbols-outlined text-base'>arrow_forward</span>
              </button>
            </div>
          ) : null}

          {!isLoading && !errorMessage && application ? (
            <div className='space-y-6'>
              <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
                <div className='flex flex-wrap items-center gap-3'>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${statusPresentation.className}`}
                  >
                    <span className='material-symbols-outlined text-base'>
                      {statusPresentation.icon}
                    </span>
                    {statusPresentation.label}
                  </span>
                  <span className='text-xs text-slate-500'>
                    Son güncelleme: {formatDate(application.updatedAt)}
                  </span>
                </div>

                <h2 className='mt-4 text-xl font-bold text-slate-900'>
                  Lojistik partner başvurunuz alındı.
                </h2>
                <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                  Başvurunuz lojistik ekibi tarafından incelenecek ve uygun görülmesi halinde sizinle iletişime geçilecektir.
                </p>

                {application.reviewStatus === 'REJECTED' && application.reviewNote ? (
                  <div className='mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800'>
                    Red Notu: {application.reviewNote}
                  </div>
                ) : null}

                {application.reviewStatus === 'APPROVED' ? (
                  <div className='mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
                    Başvurunuz onaylandı. Hesabım menüsünden Lojistik Yönetim Paneli alanını kullanabilirsiniz.
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
                      <dd className='font-semibold text-slate-800 text-right'>{application.companyName}</dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Lojistik Yetki Belgesi</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {logisticsAuthorizationDocumentTypeLabels[application.logisticsAuthorizationDocumentType]}
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
                        {application.fleetCapacity
                          ? logisticsFleetCapacityLabels[application.fleetCapacity]
                          : '-'}
                      </dd>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <dt className='text-slate-500'>Yüklenen Belge Sayısı</dt>
                      <dd className='font-semibold text-slate-800 text-right'>
                        {application.documents.length}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <h3 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                    Süreç Bilgisi
                  </h3>
                  <div className='mt-4 space-y-3 text-sm text-slate-600'>
                    <p>
                      Başvurunun gönderildiği tarih: {formatDate(application.createdAt)}
                    </p>
                    <p>
                      Son güncelleme tarihi: {formatDate(application.updatedAt)}
                    </p>
                    <p>
                      İnceleme tamamlandığında bu ekran otomatik olarak güncel durumu gösterecektir.
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
