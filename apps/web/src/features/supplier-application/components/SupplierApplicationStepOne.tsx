'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  supplierApplicationStepOneSchema,
  type SupplierApplicationStepOneDto,
} from '@toptannext/types';
import { useForm } from 'react-hook-form';
import {
  fetchMySupplierApplication,
  upsertMySupplierApplication,
} from '../api/supplier-application.api';
import { hasAccessToken } from '@/lib/auth-token';

const EMPTY_FORM: SupplierApplicationStepOneDto = {
  companyName: '',
  companyType: '',
  vknOrTckn: '',
  taxOffice: '',
  mersisNo: '',
  tradeRegistryNo: '',
  activitySector: '',
};

const COMPANY_TYPE_OPTIONS = [
  { value: 'SAHIS', label: 'Şahıs' },
  { value: 'LIMITED', label: 'Limited' },
  { value: 'ANONIM', label: 'Anonim' },
] as const;

const ACTIVITY_SECTOR_OPTIONS = [
  'Tekstil ve Giyim',
  'Gıda ve İçecek',
  'Elektronik',
  'İnşaat Malzemeleri',
  'Lojistik',
] as const;

export function SupplierApplicationStepOne() {
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
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
        setLoadErrorMessage(null);

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
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Başvuru bilgileriniz yüklenirken bir sorun oluştu.';

        // Show only non-auth related load errors in the UI.
        if (!message.toLocaleLowerCase('en-US').includes('unauthorized')) {
          setLoadErrorMessage(message);
        }
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
      });

      setSubmitSuccessMessage('Şirket kimlik bilgileri başarıyla kaydedildi.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Bilgiler kaydedilirken bir sorun oluştu.';

      setSubmitErrorMessage(message);
    }
  };

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:py-12'>
      <aside className='w-full shrink-0 md:w-64'>
        <div className='sticky top-24 flex h-auto flex-col gap-4 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-6'>
          <div className='mb-4'>
            <h2 className='text-lg font-bold text-blue-900'>Satıcı Başvuru Formu</h2>
            <p className='text-xs font-medium text-slate-500'>ToptanNext Pazaryeri</p>
          </div>

          <nav className='flex flex-col gap-2'>
            <div className='flex items-center gap-3 rounded-lg bg-white p-3 font-sans text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-sm'>
              <span className='material-symbols-outlined' style={{ fontVariationSettings: '"FILL" 1' }}>
                business
              </span>
              <span>Şirket Bilgileri</span>
            </div>
            <div className='flex items-center gap-3 p-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400'>
              <span className='material-symbols-outlined'>description</span>
              <span>iletişim ve finans</span>
            </div>
            <div className='flex items-center gap-3 p-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400'>
              <span className='material-symbols-outlined'>inventory_2</span>
              <span>belge yükleme ve onay</span>
            </div>
          </nav>

          <div className='mt-8 border-t border-slate-200 pt-6'>
            <h3 className='mb-4 text-xs font-bold uppercase tracking-widest text-slate-900'>
              Neden Tedarikçi Olmalısınız?
            </h3>

            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <span className='material-symbols-outlined text-lg text-primary'>verified</span>
                <p className='text-xs leading-relaxed text-slate-600'>
                  Güvenilir B2B ağı ile markanızı binlerce alıcıya ulaştırın.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <span className='material-symbols-outlined text-lg text-primary'>analytics</span>
                <p className='text-xs leading-relaxed text-slate-600'>
                  Gelişmiş analitik araçlarla satış performansınızı takip edin.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <span className='material-symbols-outlined text-lg text-primary'>payments</span>
                <p className='text-xs leading-relaxed text-slate-600'>
                  Güvenceli ödeme sistemleri ile nakit akışınızı koruyun.
                </p>
              </div>
            </div>
          </div>

          <button
            className='mt-6 w-full rounded-lg bg-primary/10 py-3 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20'
            type='button'
          >
            Need Help?
          </button>
        </div>
      </aside>

      <section className='flex-1'>
        <div className='mb-10'>
          <div className='mb-4 flex items-end justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight text-on-surface'>
                Şirket Kimlik Bilgileri
              </h1>
              <p className='mt-1 text-on-surface-variant'>
                Lütfen işletmenizin resmi kayıt bilgilerini giriniz.
              </p>
            </div>

            <span className='rounded-full bg-primary/5 px-3 py-1 text-sm font-bold text-primary'>
              Adım 1 / 3
            </span>
          </div>

          <div className='h-2 w-full overflow-hidden rounded-full bg-surface-container'>
            <div className='h-full w-1/3 rounded-full bg-primary transition-all duration-500' />
          </div>
        </div>

        <div className='rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm'>
          {loadErrorMessage ? (
            <p className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700'>
              {loadErrorMessage}
            </p>
          ) : null}

          <form className='grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2' onSubmit={handleSubmit(onSubmit)}>
            <label className='group md:col-span-2'>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                Şirket Tam Adı (Unvan)
              </span>
              <input
                className='w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                placeholder='Örn: ABC Teknolojik Çözümler A.Ş.'
                type='text'
                {...register('companyName')}
              />
              {errors.companyName ? (
                <p className='mt-1 text-xs text-red-600'>{errors.companyName.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                Şirket Türü
              </span>
              <div className='relative'>
                <select
                  className='w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                  {...register('companyType')}
                >
                  <option value=''>Seçiniz</option>
                  {COMPANY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-3 top-3 text-slate-400'>
                  expand_more
                </span>
              </div>
              {errors.companyType ? (
                <p className='mt-1 text-xs text-red-600'>{errors.companyType.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                VKN / TCKN
              </span>
              <input
                className='w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                placeholder='10 veya 11 haneli numara'
                type='text'
                {...register('vknOrTckn')}
              />
              {errors.vknOrTckn ? (
                <p className='mt-1 text-xs text-red-600'>{errors.vknOrTckn.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                Vergi Dairesi
              </span>
              <input
                className='w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                placeholder='Bağlı olduğunuz vergi dairesi'
                type='text'
                {...register('taxOffice')}
              />
              {errors.taxOffice ? (
                <p className='mt-1 text-xs text-red-600'>{errors.taxOffice.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                MERSİS No
              </span>
              <input
                className='w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                placeholder='16 haneli Mersis No'
                type='text'
                {...register('mersisNo')}
              />
              {errors.mersisNo ? (
                <p className='mt-1 text-xs text-red-600'>{errors.mersisNo.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                Ticaret Sicil No{' '}
                <span className='normal-case font-normal opacity-50'>(Opsiyonel)</span>
              </span>
              <input
                className='w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                placeholder='Sicil numaranız'
                type='text'
                {...register('tradeRegistryNo')}
              />
              {errors.tradeRegistryNo ? (
                <p className='mt-1 text-xs text-red-600'>{errors.tradeRegistryNo.message}</p>
              ) : null}
            </label>

            <label>
              <span className='mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                Faaliyet Alanı
              </span>
              <div className='relative'>
                <select
                  className='w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary'
                  {...register('activitySector')}
                >
                  <option value=''>Sektör Seçiniz</option>
                  {ACTIVITY_SECTOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-3 top-3 text-slate-400'>
                  expand_more
                </span>
              </div>
              {errors.activitySector ? (
                <p className='mt-1 text-xs text-red-600'>{errors.activitySector.message}</p>
              ) : null}
            </label>

            <div className='md:col-span-2 mt-4 flex gap-4 rounded-lg border border-primary/10 bg-primary/5 p-4'>
              <span className='material-symbols-outlined text-primary'>info</span>
              <p className='text-sm leading-relaxed text-slate-600'>
                Girilen veriler Maliye Bakanlığı ve Ticaret Bakanlığı veritabanları üzerinden
                doğrulanacaktır. Lütfen bilgilerin doğruluğundan emin olun.
              </p>
            </div>

            {submitErrorMessage ? (
              <p className='md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {submitErrorMessage}
              </p>
            ) : null}

            {submitSuccessMessage ? (
              <p className='md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                {submitSuccessMessage}
              </p>
            ) : null}

            <div className='md:col-span-2 flex justify-end pt-8'>
              <button
                className={`group flex items-center gap-2 rounded-xl px-8 py-4 font-bold transition-all ${
                  hasStartedFilling
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-container'
                    : 'bg-slate-300 text-slate-600'
                }`}
                type='submit'
                disabled={isSubmitting || upsertMutation.isPending || isLoadingInitialData}
              >
                {upsertMutation.isPending ? 'Kaydediliyor...' : 'Sonraki Adım'}
                <span className='material-symbols-outlined transition-transform group-hover:translate-x-1'>
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className='mt-12 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-6'>
            <span className='material-symbols-outlined mb-4 block text-3xl text-secondary'>
              security
            </span>
            <h4 className='mb-2 text-sm font-bold uppercase tracking-tight'>Veri Güvenliği</h4>
            <p className='text-xs text-on-surface-variant'>
              KVKK kapsamında tüm verileriniz 256-bit şifreleme ile korunmaktadır.
            </p>
          </div>

          <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-6'>
            <span className='material-symbols-outlined mb-4 block text-3xl text-primary'>
              flash_on
            </span>
            <h4 className='mb-2 text-sm font-bold uppercase tracking-tight'>Hızlı Onay</h4>
            <p className='text-xs text-on-surface-variant'>
              Başvurunuz tamamlandıktan sonra 24 saat içinde ön onay alırsınız.
            </p>
          </div>

          <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-6'>
            <span className='material-symbols-outlined mb-4 block text-3xl text-tertiary'>
              headset_mic
            </span>
            <h4 className='mb-2 text-sm font-bold uppercase tracking-tight'>7/24 Destek</h4>
            <p className='text-xs text-on-surface-variant'>
              Onboarding sürecinde takıldığınız her an yanınızdayız.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
