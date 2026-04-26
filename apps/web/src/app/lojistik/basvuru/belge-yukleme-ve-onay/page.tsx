'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  logisticsApplicationStepThreeSchema,
  type LogisticsApplicationStepThreeDto,
} from '@/features/logistics-application/logistics-application.schema';
import {
  getStoredLogisticsApplication,
  hasStoredStepOne,
  hasStoredStepTwo,
  saveLogisticsApplicationStepThree,
  type LogisticsApplicationDocumentFieldKey,
} from '@/features/logistics-application/logistics-application.store';
import { LogisticsApplicationSidebar } from '@/features/logistics-application/components/LogisticsApplicationSidebar';
import { MainFooter } from '../../../components/MainFooter';
import { MainHeader } from '../../../components/MainHeader';

type DocumentFieldConfig = {
  field: LogisticsApplicationDocumentFieldKey;
  title: string;
  description: string;
  icon: string;
  required?: boolean;
};

const DOCUMENT_CARDS: DocumentFieldConfig[] = [
  {
    field: 'taxCertificate',
    title: 'Güncel Vergi Levhası',
    description: 'PDF, PNG veya JPEG (Maks. 15MB)',
    icon: 'description',
  },
  {
    field: 'signatureCircular',
    title: 'İmza Sirküleri',
    description: 'Noter onaylı güncel sirküler',
    icon: 'edit_document',
  },
  {
    field: 'tradeRegistryGazette',
    title: 'Ticaret Sicil Gazetesi',
    description: 'Kuruluş ve en son değişiklik gazetesi',
    icon: 'newspaper',
  },
  {
    field: 'activityCertificate',
    title: 'Faaliyet Belgesi',
    description: 'Son 6 ay içerisinde alınmış belge',
    icon: 'badge',
  },
  {
    field: 'transportLicense',
    title: 'Ulaştırma / Lojistik Yetki Belgesi',
    description: 'Yetki belgenizin güncel kopyası',
    icon: 'license',
    required: true,
  },
];

const EMPTY_FORM: LogisticsApplicationStepThreeDto = {
  approvedSupplierAgreement: false,
  approvedKvkkAgreement: false,
  approvedCommercialMessage: false,
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export default function LogisticsApplicationStepThreePage() {
  const router = useRouter();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<LogisticsApplicationDocumentFieldKey, File>>>({});
  const [uploadedDocumentNames, setUploadedDocumentNames] = useState<Partial<Record<LogisticsApplicationDocumentFieldKey, string>>>({});

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LogisticsApplicationStepThreeDto>({
    resolver: zodResolver(logisticsApplicationStepThreeSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    const stored = getStoredLogisticsApplication();

    if (!hasStoredStepOne(stored) || !hasStoredStepTwo(stored)) {
      setSubmitErrorMessage('Önce şirket ve iletişim-finans adımlarını tamamlamalısınız.');
      if (!hasStoredStepOne(stored)) {
        router.replace('/lojistik/basvuru');
      } else {
        router.replace('/lojistik/basvuru/iletisim-ve-finans');
      }
      setIsLoadingInitialData(false);
      return;
    }

    if (stored.stepThree) {
      reset(stored.stepThree);
    }

    if (stored.uploadedDocumentNames) {
      setUploadedDocumentNames(stored.uploadedDocumentNames);
    }

    setIsLoadingInitialData(false);
  }, [reset]);

  const approvedSupplierAgreement = watch('approvedSupplierAgreement');
  const approvedKvkkAgreement = watch('approvedKvkkAgreement');
  const approvedCommercialMessage = watch('approvedCommercialMessage');

  const hasAllRequiredDocuments = useMemo(() => {
    return DOCUMENT_CARDS.every((card) => {
      return Boolean(selectedFiles[card.field]) || Boolean(uploadedDocumentNames[card.field]);
    });
  }, [selectedFiles, uploadedDocumentNames]);

  const onSubmit = async (payload: LogisticsApplicationStepThreeDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    if (!hasAllRequiredDocuments) {
      setSubmitErrorMessage('Lütfen tüm zorunlu belgeleri yükleyiniz.');
      return;
    }

    try {
      const fileNameMap: Partial<Record<LogisticsApplicationDocumentFieldKey, string>> = {};

      DOCUMENT_CARDS.forEach((card) => {
        const selectedFile = selectedFiles[card.field];
        if (selectedFile) {
          fileNameMap[card.field] = selectedFile.name;
          return;
        }

        const storedFileName = uploadedDocumentNames[card.field];
        if (storedFileName) {
          fileNameMap[card.field] = storedFileName;
        }
      });

      saveLogisticsApplicationStepThree(payload, fileNameMap);
      setSubmitSuccessMessage('Belge yükleme ve onay bilgileri başarıyla kaydedildi.');
      router.push('/lojistik/basvuru/basvuru-sonucu');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilgiler kaydedilirken bir sorun oluştu.';
      setSubmitErrorMessage(message);
    }
  };

  const handleFileChange = (field: LogisticsApplicationDocumentFieldKey, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setSubmitErrorMessage('Yüklediğiniz dosya 15 MB sınırını aşıyor. Lütfen daha küçük bir dosya seçiniz.');
      return;
    }

    setSubmitErrorMessage(null);
    setSelectedFiles((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[field];
        return next;
      }

      return {
        ...prev,
        [field]: file,
      };
    });
  };

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start'>
        <LogisticsApplicationSidebar activeStep={3} />

        <section className='min-w-0 flex-1'>
          <div className='mb-10'>
            <div className='flex justify-between items-end mb-4'>
              <div>
                <h1 className='text-3xl font-extrabold text-black tracking-tight'>
                  Belge Yükleme ve Onay
                </h1>
                <p className='text-slate-500 mt-1'>
                  Lütfen gerekli belgeleri yükleyiniz.
                </p>
              </div>

              <span className='text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full'>
                Adım 3 / 3
              </span>
            </div>

            <div className='w-full h-2 bg-surface-container rounded-full overflow-hidden'>
              <div className='w-full h-full bg-primary rounded-full transition-all duration-500' />
            </div>
          </div>

          <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {DOCUMENT_CARDS.map((card) => {
                const selectedFile = selectedFiles[card.field];
                const uploadedName = uploadedDocumentNames[card.field];

                return (
                  <div key={card.field} className='rounded-xl border border-dashed border-sky-200 bg-white p-6'>
                    <div className='flex flex-col items-center text-center gap-3'>
                      <span className='inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-primary'>
                        <span className='material-symbols-outlined'>{card.icon}</span>
                      </span>

                      <h3 className='text-base font-bold text-black'>{card.title}</h3>
                      <p className='text-xs text-slate-500'>{card.description}</p>

                      <label className='mt-2 inline-flex cursor-pointer items-center gap-2 font-bold text-primary'>
                        <span className='material-symbols-outlined'>cloud_upload</span>
                        <span>DOSYA SEÇ</span>
                        <input
                          className='hidden'
                          type='file'
                          accept='application/pdf,image/png,image/jpeg'
                          onChange={(event) => handleFileChange(card.field, event.target.files?.[0] ?? null)}
                        />
                      </label>

                      {selectedFile ? (
                        <p className='text-xs text-emerald-700 font-semibold'>
                          Seçilen dosya: {selectedFile.name}
                        </p>
                      ) : uploadedName ? (
                        <p className='text-xs text-emerald-700 font-semibold'>
                          Yüklü: {uploadedName}
                        </p>
                      ) : (
                        <p className='text-xs text-slate-400'>Henüz dosya seçilmedi.</p>
                      )}

                      {card.required ? (
                        <span className='rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700'>
                          Zorunlu
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='w-full rounded-xl bg-gray-100 p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-bold text-black'>
                <span className='material-symbols-outlined text-primary'>
                  shield
                </span>
                Hukuki Onaylar ve Sözleşmeler
              </h2>

              <div className='space-y-3'>
                <div className='rounded-md bg-white p-4 shadow-sm'>
                  <label className='flex items-start gap-3'>
                    <input
                      className='mt-0.5 h-4 w-4 accent-primary'
                      type='checkbox'
                      checked={approvedSupplierAgreement}
                      onChange={(event) =>
                        setValue('approvedSupplierAgreement', event.target.checked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className='text-sm text-slate-700'>
                      Lojistik Partnerliği Sözleşmesini okudum, onaylıyorum.
                    </span>
                  </label>
                  <button
                    className='ml-7 mt-2 text-sm font-semibold text-primary hover:underline'
                    type='button'
                    onClick={() => undefined}
                  >
                    Lojistik Partnerliği Sözleşmesini Görüntüle
                  </button>
                  {errors.approvedSupplierAgreement ? <p className='ml-7 mt-1 text-xs text-red-600'>{errors.approvedSupplierAgreement.message}</p> : null}
                </div>

                <div className='rounded-md bg-white p-4 shadow-sm'>
                  <label className='flex items-start gap-3'>
                    <input
                      className='mt-0.5 h-4 w-4 accent-primary'
                      type='checkbox'
                      checked={approvedKvkkAgreement}
                      onChange={(event) =>
                        setValue('approvedKvkkAgreement', event.target.checked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className='text-sm text-slate-700'>
                      KVKK Aydınlatma Metni çerçevesinde verilerimin işlenmesini kabul ediyorum.
                    </span>
                  </label>
                  <button
                    className='ml-7 mt-2 text-sm font-semibold text-primary hover:underline'
                    type='button'
                    onClick={() => undefined}
                  >
                    Aydınlatma Metni
                  </button>
                  {errors.approvedKvkkAgreement ? <p className='ml-7 mt-1 text-xs text-red-600'>{errors.approvedKvkkAgreement.message}</p> : null}
                </div>

                <div className='rounded-md bg-white p-4 shadow-sm'>
                  <label className='flex items-start gap-3'>
                    <input
                      className='mt-0.5 h-4 w-4 accent-primary'
                      type='checkbox'
                      checked={approvedCommercialMessage}
                      onChange={(event) =>
                        setValue('approvedCommercialMessage', event.target.checked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className='text-sm text-slate-700'>
                      Ticari Elektronik İleti gönderilmesine izin veriyorum.
                    </span>
                  </label>
                  <p className='ml-7 mt-1 text-xs italic text-slate-500'>
                    Kampanya ve duyurulardan haberdar olmak için.
                  </p>
                </div>
              </div>
            </div>

            {submitErrorMessage ? <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{submitErrorMessage}</p> : null}
            {submitSuccessMessage ? <p className='rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{submitSuccessMessage}</p> : null}

            <div className='pt-2 flex flex-col-reverse sm:flex-row sm:justify-between gap-3'>
              <button
                className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors'
                type='button'
                onClick={() => router.push('/lojistik/basvuru/iletisim-ve-finans')}
              >
                <span className='material-symbols-outlined'>arrow_back</span>
                Önceki Adım
              </button>

              <button
                className='inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20'
                disabled={isSubmitting || isLoadingInitialData}
                type='submit'
              >
                Başvuruyu Tamamla
                <span className='material-symbols-outlined'>check_circle</span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
