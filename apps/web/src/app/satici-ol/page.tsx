'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  supplierApplicationStepOneSchema,
  type SupplierApplicationStepOneDto,
} from '@toptannext/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { hasAccessToken } from '@/lib/auth-token';
import {
  fetchMySupplierApplication,
  upsertMySupplierApplication,
} from '@/features/supplier-application/api/supplier-application.api';
import { MainFooter } from '../components/MainFooter';
import { MainHeader } from '../components/MainHeader';

const EMPTY_FORM: SupplierApplicationStepOneDto = {
  companyName: '',
  companyType: '',
  vknOrTckn: '',
  taxOffice: '',
  mersisNo: '',
  tradeRegistryNo: '',
  activitySector: '',
  city: '',
  district: '',
  referenceCode: '',
};

const COMPANY_TYPE_OPTIONS = [
  { value: 'SAHIS', label: 'Şahıs' },
  { value: 'LIMITED', label: 'Limited' },
  { value: 'ANONIM', label: 'Anonim' },
] as const;

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none';

export default function SaticiOlPage() {
  const router = useRouter();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierApplicationStepOneDto>({
    resolver: zodResolver(supplierApplicationStepOneSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    let isMounted = true;

    const loadApplication = async () => {
      if (!hasAccessToken()) {
        setIsLoadingInitialData(false);
        return;
      }

      try {
        const existingApplication = await fetchMySupplierApplication();
        if (!isMounted || !existingApplication) {
          return;
        }

        reset({
          companyName: existingApplication.companyName,
          companyType: existingApplication.companyType,
          vknOrTckn: existingApplication.vknOrTckn,
          taxOffice: existingApplication.taxOffice,
          mersisNo: existingApplication.mersisNo,
          tradeRegistryNo: existingApplication.tradeRegistryNo ?? '',
          activitySector: existingApplication.activitySector,
          city: existingApplication.city,
          district: existingApplication.district,
          referenceCode: existingApplication.referenceCode ?? '',
        });
      } catch {
        // Do not print Unauthorized or other load errors inside the form canvas.
      } finally {
        if (isMounted) {
          setIsLoadingInitialData(false);
        }
      }
    };

    loadApplication();

    return () => {
      isMounted = false;
    };
  }, [reset]);

  const upsertMutation = useMutation({
    mutationKey: ['supplier-application', 'upsert'],
    mutationFn: (payload: SupplierApplicationStepOneDto) =>
      upsertMySupplierApplication(payload),
  });

  const watchedValues = watch([
    'companyName',
    'companyType',
    'vknOrTckn',
    'taxOffice',
    'mersisNo',
    'tradeRegistryNo',
    'activitySector',
    'city',
    'district',
    'referenceCode',
  ]);

  const hasStartedFilling = watchedValues.some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  const onSubmit = async (payload: SupplierApplicationStepOneDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    try {
      const saved = await upsertMutation.mutateAsync(payload);

      reset({
        companyName: saved.companyName,
        companyType: saved.companyType,
        vknOrTckn: saved.vknOrTckn,
        taxOffice: saved.taxOffice,
        mersisNo: saved.mersisNo,
        tradeRegistryNo: saved.tradeRegistryNo ?? '',
        activitySector: saved.activitySector,
        city: saved.city,
        district: saved.district,
        referenceCode: saved.referenceCode ?? '',
      });

      setSubmitSuccessMessage('Şirket kimlik bilgileri başarıyla kaydedildi.');
      router.push('/satici-ol/iletisim-ve-finans');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Bilgiler kaydedilirken bir sorun oluştu.';
      setSubmitErrorMessage(message);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <aside className='w-full md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]'>
          <div className='h-auto sticky top-24 flex flex-col gap-4 p-6 overflow-y-auto bg-slate-50 rounded-xl border border-slate-100'>
            <div className='mb-4'>
              <h2 className='text-lg font-bold text-blue-900'>Satıcı Başvuru Formu</h2>
              <p className='text-slate-500 text-xs font-medium'>ToptanNext Pazaryeri</p>
            </div>

            <nav className='flex flex-col gap-2'>
              <div className='flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-sm font-bold text-primary shadow-sm'>
                <span
                  className='material-symbols-outlined'
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  business
                </span>
                <span className='whitespace-nowrap'>Şirket Bilgileri</span>
              </div>

              <div className='flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500'>
                <span className='material-symbols-outlined'>description</span>
                <span className='whitespace-nowrap'>İletişim ve Finans</span>
              </div>

              <div className='flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500'>
                <span className='material-symbols-outlined'>inventory_2</span>
                <span className='whitespace-nowrap'>Belge Yükleme ve Onay</span>
              </div>
            </nav>

            <div className='mt-8 pt-6 border-t border-slate-200'>
              <h3 className='text-xs font-bold text-slate-900 uppercase tracking-widest mb-4'>
                Neden Tedarikçi Olmalısınız?
              </h3>

              <div className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <span className='material-symbols-outlined text-primary text-lg'>verified</span>
                  <p className='text-xs text-slate-600 leading-relaxed'>
                    Güvenilir B2B ağı ile markanızı binlerce alıcıya ulaştırın.
                  </p>
                </div>

                <div className='flex items-start gap-3'>
                  <span className='material-symbols-outlined text-primary text-lg'>analytics</span>
                  <p className='text-xs text-slate-600 leading-relaxed'>
                    Gelişmiş analitik araçlarla satış performansınızı takip edin.
                  </p>
                </div>

                <div className='flex items-start gap-3'>
                  <span className='material-symbols-outlined text-primary text-lg'>payments</span>
                  <p className='text-xs text-slate-600 leading-relaxed'>
                    Güvenceli ödeme sistemleri ile nakit akışınızı koruyun.
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

        <section className='min-w-0 flex-1'>
          <div className='mb-10'>
            <div className='flex justify-between items-end mb-4'>
              <div>
                <h1 className='text-3xl font-extrabold text-on-surface tracking-tight'>
                  Şirket Kimlik Bilgileri
                </h1>
                <p className='text-on-surface-variant mt-1'>
                  Lütfen işletmenizin resmi kayıt bilgilerini giriniz.
                </p>
              </div>

              <span className='text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full'>
                Adım 1 / 3
              </span>
            </div>

            <div className='w-full h-2 bg-surface-container rounded-full overflow-hidden'>
              <div className='w-1/3 h-full bg-primary rounded-full transition-all duration-500' />
            </div>
          </div>

          <div className='bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm'>
            <form className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6' onSubmit={handleSubmit(onSubmit)}>
              <div className='md:col-span-2 group'>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Şirket Tam Adı (Unvan)
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='Örn: ABC Teknolojik Çözümler A.Ş.'
                  type='text'
                  {...register('companyName')}
                />
                {errors.companyName ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.companyName.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Şirket Türü
                </label>
                <div className='relative'>
                  <select
                    className={`${FIELD_CLASS} appearance-none`}
                    {...register('companyType')}
                  >
                    <option value=''>Seçiniz</option>
                    {COMPANY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className='material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400'>
                    expand_more
                  </span>
                </div>
                {errors.companyType ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.companyType.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  VKN / TCKN
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='10 veya 11 haneli numara'
                  type='text'
                  {...register('vknOrTckn')}
                />
                {errors.vknOrTckn ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.vknOrTckn.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Vergi Dairesi
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='Bağlı olduğunuz vergi dairesi'
                  type='text'
                  {...register('taxOffice')}
                />
                {errors.taxOffice ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.taxOffice.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  MERSİS No
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='16 haneli Mersis No'
                  type='text'
                  {...register('mersisNo')}
                />
                {errors.mersisNo ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.mersisNo.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Ticaret Sicil No <span className='normal-case opacity-50 font-normal'>(Opsiyonel)</span>
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='Sicil numaranız'
                  type='text'
                  {...register('tradeRegistryNo')}
                />
                {errors.tradeRegistryNo ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.tradeRegistryNo.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Faaliyet Alanı
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='Faaliyet alanını giriniz'
                  type='text'
                  {...register('activitySector')}
                />
                {errors.activitySector ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.activitySector.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  İl
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='İl giriniz'
                  type='text'
                  {...register('city')}
                />
                {errors.city ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.city.message}</p>
                ) : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  İlçe
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='İlçe giriniz'
                  type='text'
                  {...register('district')}
                />
                {errors.district ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.district.message}</p>
                ) : null}
              </div>

              <div className='md:col-span-2'>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Referans Kodu <span className='normal-case opacity-50 font-normal'>(Opsiyonel)</span>
                </label>
                <input
                  className={FIELD_CLASS}
                  placeholder='Varsa referans kodunuzu giriniz'
                  type='text'
                  {...register('referenceCode')}
                />
                {errors.referenceCode ? (
                  <p className='mt-1 text-xs text-red-600'>{errors.referenceCode.message}</p>
                ) : null}
              </div>

              <div className='md:col-span-2 mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 flex gap-4'>
                <span className='material-symbols-outlined text-primary'>info</span>
                <p className='text-sm text-slate-600 leading-relaxed'>
                  Girilen veriler Maliye Bakanlığı ve Ticaret Bakanlığı veritabanları üzerinden doğrulanacaktır.
                  Lütfen bilgilerin doğruluğundan emin olun.
                </p>
              </div>

              {submitErrorMessage ? (
                <p className='md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  {submitErrorMessage}
                </p>
              ) : null}

              {submitSuccessMessage ? (
                <p className='md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                  {submitSuccessMessage}
                </p>
              ) : null}

              <div className='md:col-span-2 pt-4 flex justify-end'>
                <button
                  className={`group flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                    hasStartedFilling
                      ? 'bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                  type='submit'
                  disabled={isSubmitting || upsertMutation.isPending || isLoadingInitialData}
                >
                  {upsertMutation.isPending ? 'Kaydediliyor...' : 'Sonraki Adım'}
                  <span className='material-symbols-outlined group-hover:translate-x-1 transition-transform'>
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className='mt-12 grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-surface-container-low p-6 rounded-xl border border-outline-variant/10'>
              <span className='material-symbols-outlined text-primary text-3xl mb-4'>security</span>
              <h4 className='font-bold text-sm mb-2 uppercase tracking-tight'>Veri Güvenliği</h4>
              <p className='text-xs text-on-surface-variant'>
                KVKK kapsamında tüm verileriniz 256-bit şifreleme ile korunmaktadır.
              </p>
            </div>

            <div className='bg-surface-container-low p-6 rounded-xl border border-outline-variant/10'>
              <span className='material-symbols-outlined text-primary text-3xl mb-4'>flash_on</span>
              <h4 className='font-bold text-sm mb-2 uppercase tracking-tight'>Hızlı Onay</h4>
              <p className='text-xs text-on-surface-variant'>
                Başvurunuz tamamlandıktan sonra 24 saat içinde ön onay alırsınız.
              </p>
            </div>

            <div className='bg-surface-container-low p-6 rounded-xl border border-outline-variant/10'>
              <span className='material-symbols-outlined text-primary text-3xl mb-4'>headset_mic</span>
              <h4 className='font-bold text-sm mb-2 uppercase tracking-tight'>7/24 Destek</h4>
              <p className='text-xs text-on-surface-variant'>
                Onboarding sürecinde takıldığınız her an yanınızdayız.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
