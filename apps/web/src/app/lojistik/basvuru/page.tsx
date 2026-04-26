'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  logisticsApplicationStepOneSchema,
  logisticsAuthorizationDocumentTypeValues,
  logisticsMainServiceTypeValues,
  type LogisticsApplicationStepOneDto,
} from '@/features/logistics-application/logistics-application.schema';
import {
  getStoredLogisticsApplication,
  saveLogisticsApplicationStepOne,
} from '@/features/logistics-application/logistics-application.store';
import { LogisticsApplicationSidebar } from '@/features/logistics-application/components/LogisticsApplicationSidebar';
import { LogisticsMultiSelectField } from '@/features/logistics-application/components/LogisticsMultiSelectField';
import { MainFooter } from '../../components/MainFooter';
import { MainHeader } from '../../components/MainHeader';

const EMPTY_FORM: LogisticsApplicationStepOneDto = {
  companyName: '',
  companyType: '',
  vknOrTckn: '',
  taxOffice: '',
  mersisNo: '',
  tradeRegistryNo: '',
  city: '',
  district: '',
  referenceCode: '',
  logisticsAuthorizationDocumentType: '',
  mainServiceTypes: [],
};

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none';

const COMPANY_TYPE_OPTIONS = [
  { value: 'SAHIS', label: 'Şahıs' },
  { value: 'LIMITED', label: 'Limited' },
  { value: 'ANONIM', label: 'Anonim' },
] as const;

const LOGISTICS_AUTHORIZATION_OPTIONS = logisticsAuthorizationDocumentTypeValues.map((value) => ({
  value,
  label: value === 'DIGER' ? 'Diğer' : value,
}));

const MAIN_SERVICE_TYPE_OPTIONS = [
  { value: 'PARSIYEL_TASIMA', label: 'Parsiyel Taşıma' },
  { value: 'KOMPLE_ARAC_FTL', label: 'Komple Araç (FTL)' },
  { value: 'SOGUK_ZINCIR', label: 'Soğuk Zincir' },
  { value: 'KONTEYNER_GUMRUK', label: 'Konteyner/Gümrük' },
  { value: 'AGIR_YUK', label: 'Ağır Yük' },
  { value: 'DEPOLAMA', label: 'Depolama' },
] as const;

export default function LogisticsApplicationStepOnePage() {
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
  } = useForm<LogisticsApplicationStepOneDto>({
    resolver: zodResolver(logisticsApplicationStepOneSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    const stored = getStoredLogisticsApplication();
    if (stored.stepOne) {
      reset(stored.stepOne);
    }

    setIsLoadingInitialData(false);
  }, [reset]);

  const watchedValues = watch([
    'companyName',
    'companyType',
    'vknOrTckn',
    'taxOffice',
    'mersisNo',
    'tradeRegistryNo',
    'city',
    'district',
    'referenceCode',
    'logisticsAuthorizationDocumentType',
  ]);

  const hasStartedFilling = watchedValues.some((value) => typeof value === 'string' && value.trim().length > 0);
  const mainServiceTypes = watch('mainServiceTypes');

  const onSubmit = async (payload: LogisticsApplicationStepOneDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    try {
      saveLogisticsApplicationStepOne(payload);
      setSubmitSuccessMessage('Şirket kimlik bilgileri başarıyla kaydedildi.');
      router.push('/lojistik/basvuru/iletisim-ve-finans');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilgiler kaydedilirken bir sorun oluştu.';
      setSubmitErrorMessage(message);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <LogisticsApplicationSidebar activeStep={1} />

        <section className='min-w-0 flex-1'>
          <div className='mb-10'>
            <div className='flex justify-between items-end mb-4'>
              <div>
                <h1 className='text-3xl font-extrabold text-on-surface tracking-tight'>
                  Şirket Kimlik Bilgileri
                </h1>
                <p className='text-on-surface-variant mt-1'>
                  Lütfen lojistik firmanızın resmi kayıt bilgilerini giriniz.
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
                  placeholder='Örn: ABC Lojistik ve Taşımacılık A.Ş.'
                  type='text'
                  {...register('companyName')}
                />
                {errors.companyName ? <p className='mt-1 text-xs text-red-600'>{errors.companyName.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Şirket Türü
                </label>
                <div className='relative'>
                  <select className={`${FIELD_CLASS} appearance-none`} {...register('companyType')}>
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
                {errors.companyType ? <p className='mt-1 text-xs text-red-600'>{errors.companyType.message}</p> : null}
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
                {errors.vknOrTckn ? <p className='mt-1 text-xs text-red-600'>{errors.vknOrTckn.message}</p> : null}
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
                {errors.taxOffice ? <p className='mt-1 text-xs text-red-600'>{errors.taxOffice.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  MERSİS No
                </label>
                <input className={FIELD_CLASS} placeholder='16 haneli Mersis No' type='text' {...register('mersisNo')} />
                {errors.mersisNo ? <p className='mt-1 text-xs text-red-600'>{errors.mersisNo.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Ticaret Sicil No <span className='normal-case opacity-50 font-normal'>(Opsiyonel)</span>
                </label>
                <input className={FIELD_CLASS} placeholder='Sicil numaranız' type='text' {...register('tradeRegistryNo')} />
                {errors.tradeRegistryNo ? <p className='mt-1 text-xs text-red-600'>{errors.tradeRegistryNo.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  İl
                </label>
                <input className={FIELD_CLASS} placeholder='İl giriniz' type='text' {...register('city')} />
                {errors.city ? <p className='mt-1 text-xs text-red-600'>{errors.city.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  İlçe
                </label>
                <input className={FIELD_CLASS} placeholder='İlçe giriniz' type='text' {...register('district')} />
                {errors.district ? <p className='mt-1 text-xs text-red-600'>{errors.district.message}</p> : null}
              </div>

              <div className='md:col-span-2'>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Referans Kodu <span className='normal-case opacity-50 font-normal'>(Opsiyonel)</span>
                </label>
                <input className={FIELD_CLASS} placeholder='Varsa referans kodunuzu giriniz' type='text' {...register('referenceCode')} />
                {errors.referenceCode ? <p className='mt-1 text-xs text-red-600'>{errors.referenceCode.message}</p> : null}
              </div>

              <div>
                <label className='block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2'>
                  Lojistik Yetki Belge Türü
                </label>
                <div className='relative'>
                  <select className={`${FIELD_CLASS} appearance-none`} {...register('logisticsAuthorizationDocumentType')}>
                    <option value=''>Seçiniz</option>
                    {LOGISTICS_AUTHORIZATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className='material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400'>
                    expand_more
                  </span>
                </div>
                {errors.logisticsAuthorizationDocumentType ? <p className='mt-1 text-xs text-red-600'>{errors.logisticsAuthorizationDocumentType.message}</p> : null}
              </div>

              <div className='md:col-span-2'>
                <LogisticsMultiSelectField
                  errorMessage={errors.mainServiceTypes?.message}
                  label='Ana Hizmet Tipi'
                  onChange={(nextValue) =>
                    setValue('mainServiceTypes', nextValue, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  options={MAIN_SERVICE_TYPE_OPTIONS}
                  placeholder='Ana hizmet tiplerini seçiniz'
                  value={mainServiceTypes}
                />
              </div>

              <div className='md:col-span-2 mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 flex gap-4'>
                <span className='material-symbols-outlined text-primary'>info</span>
                <p className='text-sm text-slate-600 leading-relaxed'>
                  Girilen veriler lojistik partner doğrulama ve başvuru süreci kapsamında değerlendirilecektir.
                  Lütfen bilgilerin doğruluğundan emin olun.
                </p>
              </div>

              {submitErrorMessage ? <p className='md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{submitErrorMessage}</p> : null}
              {submitSuccessMessage ? <p className='md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{submitSuccessMessage}</p> : null}

              <div className='md:col-span-2 pt-4 flex justify-end'>
                <button
                  className={`group flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                    hasStartedFilling
                      ? 'bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                  disabled={isSubmitting || isLoadingInitialData}
                  type='submit'
                >
                  Kaydet ve Devam Et
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
                KVKK kapsamında tüm başvuru verileriniz güvenli şekilde işlenir.
              </p>
            </div>

            <div className='bg-surface-container-low p-6 rounded-xl border border-outline-variant/10'>
              <span className='material-symbols-outlined text-primary text-3xl mb-4'>flash_on</span>
              <h4 className='font-bold text-sm mb-2 uppercase tracking-tight'>Hızlı Başvuru</h4>
              <p className='text-xs text-on-surface-variant'>
                Başvuru sürecini birkaç adımda tamamlayıp ekibimize iletebilirsiniz.
              </p>
            </div>

            <div className='bg-surface-container-low p-6 rounded-xl border border-outline-variant/10'>
              <span className='material-symbols-outlined text-primary text-3xl mb-4'>headset_mic</span>
              <h4 className='font-bold text-sm mb-2 uppercase tracking-tight'>7/24 Destek</h4>
              <p className='text-xs text-on-surface-variant'>
                Başvuru sürecinde takıldığınız her an yanınızdayız.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
