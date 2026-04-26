"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  supplierApplicationStepThreeSchema,
  type SupplierApplicationDocumentType,
  type SupplierApplicationStepThreeDto,
} from "@toptannext/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { hasAccessToken } from "@/lib/auth-token";
import {
  fetchMySupplierApplication,
  upsertMySupplierDocuments,
  type SupplierApplicationDocumentRecord,
} from "@/features/supplier-application/api/supplier-application.api";
import {
  isStepOneCompleted,
  isStepTwoCompleted,
  shouldRedirectSupplierApplicationToResult,
} from "@/features/supplier-application/api/supplier-application-progress";
import { MainFooter } from "../../components/MainFooter";
import { MainHeader } from "../../components/MainHeader";

type DocumentFieldKey =
  | "taxCertificate"
  | "signatureCircular"
  | "tradeRegistryGazette"
  | "activityCertificate";

type DocumentCardConfig = {
  field: DocumentFieldKey;
  documentType: SupplierApplicationDocumentType;
  title: string;
  description: string;
  icon: string;
};

const DOCUMENT_CARDS: DocumentCardConfig[] = [
  {
    field: "taxCertificate",
    documentType: "TAX_CERTIFICATE",
    title: "Güncel Vergi Levhası",
    description: "PDF, PNG veya JPEG (Maks. 15MB)",
    icon: "description",
  },
  {
    field: "signatureCircular",
    documentType: "SIGNATURE_CIRCULAR",
    title: "İmza Sirküleri",
    description: "Noter onaylı güncel sirküler",
    icon: "edit_document",
  },
  {
    field: "tradeRegistryGazette",
    documentType: "TRADE_REGISTRY_GAZETTE",
    title: "Ticaret Sicil Gazetesi",
    description: "Kuruluş ve en son değişiklik gazetesi",
    icon: "newspaper",
  },
  {
    field: "activityCertificate",
    documentType: "ACTIVITY_CERTIFICATE",
    title: "Faaliyet Belgesi",
    description: "Son 6 ay içerisinde alınmış belge",
    icon: "badge",
  },
];

const EMPTY_FORM: SupplierApplicationStepThreeDto = {
  approvedSupplierAgreement: false,
  approvedKvkkAgreement: false,
  approvedCommercialMessage: false,
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const RESULT_PAGE_PATH = "/satici-ol/basvuru-sonucu";

export default function SaticiOlBelgeYuklemeVeOnayPage() {
  const router = useRouter();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<
    string | null
  >(null);
  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<DocumentFieldKey, File>>
  >({});
  const [uploadedDocuments, setUploadedDocuments] = useState<
    SupplierApplicationDocumentRecord[]
  >([]);

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierApplicationStepThreeDto>({
    resolver: zodResolver(supplierApplicationStepThreeSchema),
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
        if (!isMounted) {
          return;
        }

        if (!existingApplication) {
          setSubmitErrorMessage(
            "Önce şirket bilgileri adımlarını tamamlamalısınız.",
          );
          setIsLoadingInitialData(false);
          return;
        }

        if (!isStepOneCompleted(existingApplication) || !isStepTwoCompleted(existingApplication)) {
          setSubmitErrorMessage(
            "Önce şirket bilgileri ve iletişim-finans adımlarını tamamlamalısınız.",
          );
          setIsLoadingInitialData(false);
          return;
        }

        if (shouldRedirectSupplierApplicationToResult(existingApplication)) {
          router.replace(RESULT_PAGE_PATH);
          return;
        }

        reset({
          approvedSupplierAgreement:
            existingApplication.approvedSupplierAgreement,
          approvedKvkkAgreement: existingApplication.approvedKvkkAgreement,
          approvedCommercialMessage:
            existingApplication.approvedCommercialMessage,
        });

        setUploadedDocuments(existingApplication.documents ?? []);
      } catch {
        setSubmitErrorMessage("Başvuru bilgileri alınırken bir sorun oluştu.");
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
  }, [reset, router]);

  const upsertMutation = useMutation({
    mutationKey: ["supplier-application", "upsert-documents"],
    mutationFn: upsertMySupplierDocuments,
  });

  const approvedSupplierAgreement = watch("approvedSupplierAgreement");
  const approvedKvkkAgreement = watch("approvedKvkkAgreement");
  const approvedCommercialMessage = watch("approvedCommercialMessage");

  const uploadedDocumentByType = useMemo(() => {
    const map = new Map<
      SupplierApplicationDocumentType,
      SupplierApplicationDocumentRecord
    >();
    for (const document of uploadedDocuments) {
      map.set(document.documentType, document);
    }
    return map;
  }, [uploadedDocuments]);

  const hasAllRequiredDocuments = DOCUMENT_CARDS.every((card) => {
    return (
      Boolean(selectedFiles[card.field]) ||
      uploadedDocumentByType.has(card.documentType)
    );
  });

  const onSubmit = async (payload: SupplierApplicationStepThreeDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    if (!hasAllRequiredDocuments) {
      setSubmitErrorMessage("Lütfen tüm zorunlu belgeleri yükleyiniz.");
      return;
    }

    try {
      const saved = await upsertMutation.mutateAsync({
        ...payload,
        taxCertificate: selectedFiles.taxCertificate,
        signatureCircular: selectedFiles.signatureCircular,
        tradeRegistryGazette: selectedFiles.tradeRegistryGazette,
        activityCertificate: selectedFiles.activityCertificate,
      });

      reset({
        approvedSupplierAgreement: saved.approvedSupplierAgreement,
        approvedKvkkAgreement: saved.approvedKvkkAgreement,
        approvedCommercialMessage: saved.approvedCommercialMessage,
      });

      setUploadedDocuments(saved.documents ?? []);
      setSelectedFiles({});
      setSubmitSuccessMessage(
        "Belge yükleme ve onay bilgileri başarıyla kaydedildi.",
      );
      router.push(RESULT_PAGE_PATH);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bilgiler kaydedilirken bir sorun oluştu.";
      setSubmitErrorMessage(message);
    }
  };

  const handleFileChange = (field: DocumentFieldKey, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setSubmitErrorMessage(
        "Yüklediğiniz dosya 15 MB sınırını aşıyor. Lütfen daha küçük bir dosya seçiniz.",
      );
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
    <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased">
      <MainHeader />

      <main className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8 md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start">
        <aside className="w-full md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]">
          <div className="h-auto flex flex-col gap-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-blue-900">
                Satıcı Başvuru Formu
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                ToptanNext Pazaryeri
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500 text-left"
                type="button"
                onClick={() => router.push("/satici-ol")}
              >
                <span className="material-symbols-outlined">business</span>
                <span className="whitespace-nowrap">Şirket Bilgileri</span>
              </button>

              <button
                className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500 text-left"
                type="button"
                onClick={() => router.push("/satici-ol/iletisim-ve-finans")}
              >
                <span className="material-symbols-outlined">description</span>
                <span className="whitespace-nowrap">İletişim ve Finans</span>
              </button>

              <div className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-sm font-bold text-primary shadow-sm">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  inventory_2
                </span>
                <span className="whitespace-nowrap">Belge Yükleme ve Onay</span>
              </div>

              <button
                className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500 text-left"
                type="button"
                onClick={() => router.push(RESULT_PAGE_PATH)}
              >
                <span className="material-symbols-outlined">task_alt</span>
                <span className="whitespace-nowrap">Satıcı Başvuru Sonucu</span>
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                Son Kontroller
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    verified_user
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tüm belgeleriniz doğrulandıktan sonra hesabınız aktif
                    edilir.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    schedule
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Onay süreci ortalama 24 saat içerisinde tamamlanır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-black tracking-tight">
                  Belge Yükleme ve Onay
                </h1>
                <p className="text-slate-500 mt-1">
                  Lütfen gerekli belgeleri yükleyiniz.
                </p>
              </div>

              <span className="text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full">
                Adım 3 / 3
              </span>
            </div>

            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="w-full h-full bg-primary rounded-full transition-all duration-500" />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DOCUMENT_CARDS.map((card) => {
                const selectedFile = selectedFiles[card.field];
                const uploadedDocument = uploadedDocumentByType.get(
                  card.documentType,
                );

                return (
                  <div
                    key={card.field}
                    className="rounded-xl border border-dashed border-sky-200 bg-white p-6"
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-primary">
                        <span className="material-symbols-outlined">
                          {card.icon}
                        </span>
                      </span>

                      <h3 className="text-base font-bold text-black">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {card.description}
                      </p>

                      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 font-bold text-primary">
                        <span className="material-symbols-outlined">
                          cloud_upload
                        </span>
                        <span>DOSYA SEÇ</span>
                        <input
                          className="hidden"
                          type="file"
                          accept="application/pdf,image/png,image/jpeg"
                          onChange={(event) =>
                            handleFileChange(
                              card.field,
                              event.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </label>

                      {selectedFile ? (
                        <p className="text-xs text-emerald-700 font-semibold">
                          Seçilen dosya: {selectedFile.name}
                        </p>
                      ) : uploadedDocument ? (
                        <p className="text-xs text-emerald-700 font-semibold">
                          Yüklü: {uploadedDocument.originalName}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Henüz dosya seçilmedi.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full rounded-xl bg-gray-100 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-black">
                <span className="material-symbols-outlined text-primary">
                  shield
                </span>
                Hukuki Onaylar ve Sözleşmeler
              </h2>

              <div className="space-y-3">
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <label className="flex items-start gap-3">
                    <input
                      className="mt-0.5 h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={approvedSupplierAgreement}
                      onChange={(event) =>
                        setValue(
                          "approvedSupplierAgreement",
                          event.target.checked,
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                    <span className="text-sm text-slate-700">
                      Tedarikçi İş Ortaklığı Sözleşmesini okudum, onaylıyorum.
                    </span>
                  </label>
                  <button
                    className="ml-7 mt-2 text-sm font-semibold text-primary hover:underline"
                    type="button"
                    onClick={() => undefined}
                  >
                    Sözleşmeyi Görüntüle
                  </button>
                  {errors.approvedSupplierAgreement ? (
                    <p className="ml-7 mt-1 text-xs text-red-600">
                      {errors.approvedSupplierAgreement.message}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-md bg-white p-4 shadow-sm">
                  <label className="flex items-start gap-3">
                    <input
                      className="mt-0.5 h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={approvedKvkkAgreement}
                      onChange={(event) =>
                        setValue(
                          "approvedKvkkAgreement",
                          event.target.checked,
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                    <span className="text-sm text-slate-700">
                      KVKK Aydınlatma Metni çerçevesinde verilerimin işlenmesini
                      kabul ediyorum.
                    </span>
                  </label>
                  <button
                    className="ml-7 mt-2 text-sm font-semibold text-primary hover:underline"
                    type="button"
                    onClick={() => undefined}
                  >
                    Aydınlatma Metni
                  </button>
                  {errors.approvedKvkkAgreement ? (
                    <p className="ml-7 mt-1 text-xs text-red-600">
                      {errors.approvedKvkkAgreement.message}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-md bg-white p-4 shadow-sm">
                  <label className="flex items-start gap-3">
                    <input
                      className="mt-0.5 h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={approvedCommercialMessage}
                      onChange={(event) =>
                        setValue(
                          "approvedCommercialMessage",
                          event.target.checked,
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                    <span className="text-sm text-slate-700">
                      Ticari Elektronik İleti gönderilmesine izin veriyorum.
                    </span>
                  </label>
                  <p className="ml-7 mt-1 text-xs italic text-slate-500">
                    Kampanya ve duyurulardan haberdar olmak için.
                  </p>
                </div>
              </div>
            </div>

            {submitErrorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitErrorMessage}
              </p>
            ) : null}

            {submitSuccessMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {submitSuccessMessage}
              </p>
            ) : null}

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                type="button"
                onClick={() => router.push("/satici-ol/iletisim-ve-finans")}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Önceki Adım
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20"
                type="submit"
                disabled={
                  isSubmitting ||
                  upsertMutation.isPending ||
                  isLoadingInitialData
                }
              >
                {upsertMutation.isPending
                  ? "Kaydediliyor..."
                  : "Başvuruyu Tamamla"}
                <span className="material-symbols-outlined">check_circle</span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
