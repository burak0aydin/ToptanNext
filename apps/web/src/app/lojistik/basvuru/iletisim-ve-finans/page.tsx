'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  logisticsApplicationStepTwoSchema,
  logisticsFleetCapacityValues,
  logisticsServiceRegionValues,
  type LogisticsApplicationStepTwoDto,
} from '@/features/logistics-application/logistics-application.schema';
import {
  getStoredLogisticsApplication,
  hasStoredStepOne,
  saveLogisticsApplicationStepTwo,
} from '@/features/logistics-application/logistics-application.store';
import { LogisticsApplicationSidebar } from '@/features/logistics-application/components/LogisticsApplicationSidebar';
import { LogisticsMultiSelectField } from '@/features/logistics-application/components/LogisticsMultiSelectField';
import { MainFooter } from '../../../components/MainFooter';
import { MainHeader } from '../../../components/MainHeader';

const EMPTY_FORM: LogisticsApplicationStepTwoDto = {
  companyIban: '',
  kepAddress: '',
  isEInvoiceTaxpayer: false,
  businessPhone: '',
  headquartersAddress: '',
  serviceRegions: [],
  fleetCapacity: '',
  contactFirstName: '',
  contactLastName: '',
  contactRole: '',
  contactPhone: '',
  contactEmail: '',
};

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none';
const TEXTAREA_CLASS =
  'w-full min-h-[120px] px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none resize-y';

const SERVICE_REGION_OPTIONS = logisticsServiceRegionValues.map((value) => ({
  value,
  label:
    value === 'TUM_TURKIYE'
      ? 'Tüm Türkiye'
      : value === 'BELIRLI_BOLGELER_SEHIRLER'
        ? 'Belirli Bölgeler/Şehirler'
        : 'Uluslararası',
}));

const FLEET_CAPACITY_OPTIONS = logisticsFleetCapacityValues.map((value) => ({
  value,
  label:
    value === '1-5'
      ? '1-5 Araç'
      : value === '6-20'
        ? '6-20 Araç'
        : value === '21-50'
          ? '21-50 Araç'
          : '50+ Araç',
}));

export default function LogisticsApplicationStepTwoPage() {
  const router = useRouter();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LogisticsApplicationStepTwoDto>({
    resolver: zodResolver(logisticsApplicationStepTwoSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    const stored = getStoredLogisticsApplication();

    if (!hasStoredStepOne(stored) || !stored.stepOne) {
      setSubmitErrorMessage('Önce şirket kimlik bilgileri adımını tamamlamalısınız.');
      router.replace('/lojistik/basvuru');
      setIsLoadingInitialData(false);
      return;
    }

    if (stored.stepTwo) {
      reset(stored.stepTwo);
    }

    setIsLoadingInitialData(false);
  }, [reset]);

  const watchedValues = watch([
    'companyIban',
    'kepAddress',
    'businessPhone',
    'headquartersAddress',
    'contactFirstName',
    'contactLastName',
    'contactRole',
    'contactPhone',
    'contactEmail',
    'fleetCapacity',
  ]);

  const hasStartedFilling = watchedValues.some((value) => typeof value === 'string' && value.trim().length > 0);
  const serviceRegions = watch('serviceRegions');
  const isEInvoiceTaxpayer = watch('isEInvoiceTaxpayer');

  const onSubmit = async (payload: LogisticsApplicationStepTwoDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    try {
      saveLogisticsApplicationStepTwo(payload);
      setSubmitSuccessMessage('İletişim ve finans bilgileri başarıyla kaydedildi.');
      router.push('/lojistik/basvuru/belge-yukleme-ve-onay');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilgiler kaydedilirken bir sorun oluştu.';
      setSubmitErrorMessage(message);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <LogisticsApplicationSidebar activeStep={2} />

        <section className='min-w-0 flex-1'>
          <div className='mb-10'>
            <div className='flex justify-between items-end mb-4'>
              <div>
                <h1 className='text-3xl font-extrabold text-on-surface tracking-tight'>
                  İletişim ve Finans Bilgileri
                </h1>
                <p className='text-on-surface-variant mt-1'>
                  Lütfen lojistik partnerinizin iletişim ve finans bilgilerini giriniz.
                </p>
              </div>

              <span className='text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full'>
                Adım 2 / 3
              </span>
            </div>

            <div className='w-full h-2 bg-surface-container rounded-full overflow-hidden'>
              <div className='w-2/3 h-full bg-primary rounded-full transition-all duration-500' />
            </div>
          </div>

          <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
            <div className='bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm'>
              <h2 className='text-lg font-bold mb-5'>
                Şirket Finans Bilgileri
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Şirket IBAN
                  </label>
                  <input className={FIELD_CLASS} placeholder='TR00 0000 0000 0000 0000 0000 00' type='text' {...register('companyIban')} />
                  {errors.companyIban ? <p className='mt-1 text-xs text-red-600'>{errors.companyIban.message}</p> : null}
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    KEP Adresi
                  </label>
                  <input className={FIELD_CLASS} placeholder='ornek@kep.tr' type='email' {...register('kepAddress')} />
                  {errors.kepAddress ? <p className='mt-1 text-xs text-red-600'>{errors.kepAddress.message}</p> : null}
                </div>

                <div>
                  <span className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    E-Fatura Mükellefi misiniz?
                  </span>
                  <div className='flex items-center gap-4 rounded-lg border border-slate-300 bg-white p-3 shadow-sm'>
                    <label className='inline-flex items-center gap-2 text-sm font-medium text-slate-700'>
                      <input
                        className='h-4 w-4 accent-primary'
                        checked={isEInvoiceTaxpayer === true}
                        type='radio'
                        onChange={() =>
                          setValue('isEInvoiceTaxpayer', true, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      Evet
                    </label>

                    <label className='inline-flex items-center gap-2 text-sm font-medium text-slate-700'>
                      <input
                        className='h-4 w-4 accent-primary'
                        checked={isEInvoiceTaxpayer === false}
                        type='radio'
                        onChange={() =>
                          setValue('isEInvoiceTaxpayer', false, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      Hayır
                    </label>
                  </div>
                  {errors.isEInvoiceTaxpayer ? <p className='mt-1 text-xs text-red-600'>{errors.isEInvoiceTaxpayer.message}</p> : null}
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    İş Telefonu
                  </label>
                  <input className={FIELD_CLASS} placeholder='Örn: 0212 000 00 00' type='text' {...register('businessPhone')} />
                  {errors.businessPhone ? <p className='mt-1 text-xs text-red-600'>{errors.businessPhone.message}</p> : null}
                </div>
              </div>
            </div>

            <div className='bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm'>
              <h2 className='text-lg font-bold mb-5'>
                Operasyon Bilgileri
              </h2>

              <div className='space-y-6'>
                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Şirket Merkezi Adresi
                  </label>
                  <textarea className={TEXTAREA_CLASS} placeholder='Şirket merkez adresini detaylı şekilde yazınız.' {...register('headquartersAddress')} />
                  {errors.headquartersAddress ? <p className='mt-1 text-xs text-red-600'>{errors.headquartersAddress.message}</p> : null}
                </div>

                <div className='md:col-span-2'>
                  <LogisticsMultiSelectField
                    errorMessage={errors.serviceRegions?.message}
                    label='Hizmet Verilen Bölgeler'
                    onChange={(nextValue) =>
                      setValue('serviceRegions', nextValue, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    options={SERVICE_REGION_OPTIONS}
                    placeholder='Hizmet verilen bölgeleri seçiniz'
                    value={serviceRegions}
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Filo / Araç Kapasitesi
                  </label>
                  <div className='relative'>
                    <select className={`${FIELD_CLASS} appearance-none`} {...register('fleetCapacity')}>
                      <option value=''>Seçiniz</option>
                      {FLEET_CAPACITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className='material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400'>
                      expand_more
                    </span>
                  </div>
                  {errors.fleetCapacity ? <p className='mt-1 text-xs text-red-600'>{errors.fleetCapacity.message}</p> : null}
                </div>
              </div>
            </div>

            <div className='bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm'>
              <h2 className='text-lg font-bold mb-5'>Yetkili Kişi Bilgileri</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Ad
                  </label>
                  <input className={FIELD_CLASS} placeholder='Yetkili kişinin adı' type='text' {...register('contactFirstName')} />
                  {errors.contactFirstName ? <p className='mt-1 text-xs text-red-600'>{errors.contactFirstName.message}</p> : null}
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Soyad
                  </label>
                  <input className={FIELD_CLASS} placeholder='Yetkili kişinin soyadı' type='text' {...register('contactLastName')} />
                  {errors.contactLastName ? <p className='mt-1 text-xs text-red-600'>{errors.contactLastName.message}</p> : null}
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Görev
                  </label>
                  <input className={FIELD_CLASS} placeholder='Örn: Operasyon Müdürü' type='text' {...register('contactRole')} />
                  {errors.contactRole ? <p className='mt-1 text-xs text-red-600'>{errors.contactRole.message}</p> : null}
                </div>

                <div>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    Cep Telefonu
                  </label>
                  <input className={FIELD_CLASS} placeholder='Örn: 05xx xxx xx xx' type='text' {...register('contactPhone')} />
                  {errors.contactPhone ? <p className='mt-1 text-xs text-red-600'>{errors.contactPhone.message}</p> : null}
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                    E-posta Adresi
                  </label>
                  <input className={FIELD_CLASS} placeholder='yetkili@firma.com' type='email' {...register('contactEmail')} />
                  {errors.contactEmail ? <p className='mt-1 text-xs text-red-600'>{errors.contactEmail.message}</p> : null}
                </div>
              </div>
            </div>

            <div className='rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3'>
              <span className='material-symbols-outlined text-primary'>info</span>
              <p className='text-sm text-slate-600 leading-relaxed'>
                Bu adımda girilen iletişim ve finans bilgileri lojistik partner sözleşmesi ve ödeme süreçlerinde kullanılacaktır.
              </p>
            </div>

            {submitErrorMessage ? <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{submitErrorMessage}</p> : null}
            {submitSuccessMessage ? <p className='rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{submitSuccessMessage}</p> : null}

            <div className='pt-2 flex flex-col-reverse sm:flex-row sm:justify-between gap-3'>
              <button
                className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors'
                type='button'
                onClick={() => router.push('/lojistik/basvuru')}
              >
                <span className='material-symbols-outlined'>arrow_back</span>
                Önceki Adım
              </button>

              <button
                className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                  hasStartedFilling
                    ? 'bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-300 text-slate-600'
                }`}
                disabled={isSubmitting || isLoadingInitialData}
                type='submit'
              >
                Kaydet ve Devam Et
                <span className='material-symbols-outlined'>arrow_forward</span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
