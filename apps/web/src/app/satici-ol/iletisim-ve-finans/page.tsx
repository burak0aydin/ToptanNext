"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  supplierApplicationStepTwoSchema,
  type SupplierApplicationStepTwoDto,
} from "@toptannext/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { hasAccessToken } from "@/lib/auth-token";
import {
  fetchMySupplierApplication,
  upsertMySupplierContactFinance,
} from "@/features/supplier-application/api/supplier-application.api";
import { MainFooter } from "../../components/MainFooter";
import { MainHeader } from "../../components/MainHeader";

const FIELD_CLASS =
  "w-full px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none";

const TEXTAREA_CLASS =
  "w-full min-h-[120px] px-4 py-3 rounded-lg border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all outline-none resize-y";

const STEP_THREE_PATH = "/satici-ol/belge-yukleme-ve-onay";
const RESULT_PAGE_PATH = "/satici-ol/basvuru-sonucu";

const EMPTY_FORM: SupplierApplicationStepTwoDto = {
  companyIban: "",
  kepAddress: "",
  isEInvoiceTaxpayer: false,
  businessPhone: "",
  headquartersAddress: "",
  warehouseSameAsHeadquarters: true,
  warehouseAddress: "",
  contactFirstName: "",
  contactLastName: "",
  contactRole: "",
  contactPhone: "",
  contactEmail: "",
};

export default function SaticiOlIletisimVeFinansPage() {
  const router = useRouter();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierApplicationStepTwoDto>({
    resolver: zodResolver(supplierApplicationStepTwoSchema),
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
            "Önce şirket kimlik bilgileri adımını tamamlamalısınız.",
          );
          setIsLoadingInitialData(false);
          return;
        }

        if (existingApplication.reviewStatus !== "REJECTED") {
          router.replace(RESULT_PAGE_PATH);
          return;
        }

        const warehouseSameAsHeadquarters =
          existingApplication.warehouseSameAsHeadquarters ?? true;

        reset({
          companyIban: existingApplication.companyIban ?? "",
          kepAddress: existingApplication.kepAddress ?? "",
          isEInvoiceTaxpayer: existingApplication.isEInvoiceTaxpayer ?? false,
          businessPhone: existingApplication.businessPhone ?? "",
          headquartersAddress: existingApplication.headquartersAddress ?? "",
          warehouseSameAsHeadquarters,
          warehouseAddress: warehouseSameAsHeadquarters
            ? (existingApplication.headquartersAddress ?? "")
            : (existingApplication.warehouseAddress ?? ""),
          contactFirstName: existingApplication.contactFirstName ?? "",
          contactLastName: existingApplication.contactLastName ?? "",
          contactRole: existingApplication.contactRole ?? "",
          contactPhone: existingApplication.contactPhone ?? "",
          contactEmail: existingApplication.contactEmail ?? "",
        });
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
    mutationKey: ["supplier-application", "upsert-contact-finance"],
    mutationFn: (payload: SupplierApplicationStepTwoDto) =>
      upsertMySupplierContactFinance(payload),
  });

  const watchedValues = watch([
    "companyIban",
    "kepAddress",
    "businessPhone",
    "headquartersAddress",
    "warehouseAddress",
    "contactFirstName",
    "contactLastName",
    "contactRole",
    "contactPhone",
    "contactEmail",
  ]);

  const hasStartedFilling = watchedValues.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  const isEInvoiceTaxpayer = watch("isEInvoiceTaxpayer");
  const warehouseSameAsHeadquarters = watch("warehouseSameAsHeadquarters");

  const navigateToStepThree = () => {
    if (typeof window !== "undefined") {
      window.location.assign(STEP_THREE_PATH);
      return;
    }

    router.push(STEP_THREE_PATH);
  };

  const onSubmit = async (payload: SupplierApplicationStepTwoDto) => {
    setSubmitErrorMessage(null);
    setSubmitSuccessMessage(null);

    try {
      const saved = await upsertMutation.mutateAsync(payload);

      const sameAsHeadquarters = saved.warehouseSameAsHeadquarters ?? true;

      reset({
        companyIban: saved.companyIban ?? "",
        kepAddress: saved.kepAddress ?? "",
        isEInvoiceTaxpayer: saved.isEInvoiceTaxpayer ?? false,
        businessPhone: saved.businessPhone ?? "",
        headquartersAddress: saved.headquartersAddress ?? "",
        warehouseSameAsHeadquarters: sameAsHeadquarters,
        warehouseAddress: sameAsHeadquarters
          ? (saved.headquartersAddress ?? "")
          : (saved.warehouseAddress ?? ""),
        contactFirstName: saved.contactFirstName ?? "",
        contactLastName: saved.contactLastName ?? "",
        contactRole: saved.contactRole ?? "",
        contactPhone: saved.contactPhone ?? "",
        contactEmail: saved.contactEmail ?? "",
      });

      setSubmitSuccessMessage(
        "İletişim ve finans bilgileri başarıyla kaydedildi.",
      );
      navigateToStepThree();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bilgiler kaydedilirken bir sorun oluştu.";
      setSubmitErrorMessage(message);
    }
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

              <div className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-sm font-bold text-primary shadow-sm">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  description
                </span>
                <span className="whitespace-nowrap">İletişim ve Finans</span>
              </div>

              <div className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500">
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="whitespace-nowrap">Belge Yükleme ve Onay</span>
              </div>

              <div className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500">
                <span className="material-symbols-outlined">task_alt</span>
                <span className="whitespace-nowrap">Satıcı Başvuru Sonucu</span>
              </div>
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                Bir Sonraki Aşama
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    inventory_2
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Belge yükleme adımında şirket evraklarınızı ileteceksiniz.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    rule
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Başvurunuz admin ekibi tarafından kontrol edilip onaya
                    alınacaktır.
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
                <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
                  İletişim ve Finans Bilgileri
                </h1>
                <p className="text-on-surface-variant mt-1">
                  Lütfen İletişim ve Finans bilgilerinizi giriniz.
                </p>
              </div>

              <span className="text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full">
                Adım 2 / 3
              </span>
            </div>

            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-primary rounded-full transition-all duration-500" />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm">
              <h2 className="text-lg font-bold mb-5">
                Şirket Finans Bilgileri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Şirket IBAN
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    type="text"
                    {...register("companyIban")}
                  />
                  {errors.companyIban ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.companyIban.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    KEP Adresi
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="ornek@kep.tr"
                    type="email"
                    {...register("kepAddress")}
                  />
                  {errors.kepAddress ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.kepAddress.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <span className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    E-Fatura Mükellefi misiniz?
                  </span>
                  <div className="flex items-center gap-4 rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        className="h-4 w-4 accent-primary"
                        type="radio"
                        checked={isEInvoiceTaxpayer === true}
                        onChange={() =>
                          setValue("isEInvoiceTaxpayer", true, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      Evet
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        className="h-4 w-4 accent-primary"
                        type="radio"
                        checked={isEInvoiceTaxpayer === false}
                        onChange={() =>
                          setValue("isEInvoiceTaxpayer", false, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      Hayır
                    </label>
                  </div>
                  {errors.isEInvoiceTaxpayer ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.isEInvoiceTaxpayer.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    İş Telefonu
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="Örn: 0212 000 00 00"
                    type="text"
                    {...register("businessPhone")}
                  />
                  {errors.businessPhone ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.businessPhone.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm">
              <h2 className="text-lg font-bold mb-5">Adres Bilgileri</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Şirket Merkezi Adresi
                  </label>
                  <textarea
                    className={TEXTAREA_CLASS}
                    placeholder="Şirket merkez adresini detaylı şekilde yazınız."
                    {...register("headquartersAddress")}
                  />
                  {errors.headquartersAddress ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.headquartersAddress.message}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      className="h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={warehouseSameAsHeadquarters}
                      onChange={(event) =>
                        setValue(
                          "warehouseSameAsHeadquarters",
                          event.target.checked,
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                    Sevkiyat / İade Depo Adresi, şirket merkezi adresi ile
                    aynıdır.
                  </label>
                </div>

                {!warehouseSameAsHeadquarters ? (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                      Sevkiyat / İade Depo Adresi
                    </label>
                    <textarea
                      className={TEXTAREA_CLASS}
                      placeholder="Depo adresini detaylı şekilde yazınız."
                      {...register("warehouseAddress")}
                    />
                    {errors.warehouseAddress ? (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.warehouseAddress.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-sm">
              <h2 className="text-lg font-bold mb-5">Yetkili Kişi Bilgileri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Ad
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="Yetkili kişinin adı"
                    type="text"
                    {...register("contactFirstName")}
                  />
                  {errors.contactFirstName ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.contactFirstName.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Soyad
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="Yetkili kişinin soyadı"
                    type="text"
                    {...register("contactLastName")}
                  />
                  {errors.contactLastName ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.contactLastName.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Görev
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="Örn: Operasyon Müdürü"
                    type="text"
                    {...register("contactRole")}
                  />
                  {errors.contactRole ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.contactRole.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Cep Telefonu
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="Örn: 05xx xxx xx xx"
                    type="text"
                    {...register("contactPhone")}
                  />
                  {errors.contactPhone ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.contactPhone.message}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    className={FIELD_CLASS}
                    placeholder="yetkili@firma.com"
                    type="email"
                    {...register("contactEmail")}
                  />
                  {errors.contactEmail ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.contactEmail.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3">
              <span className="material-symbols-outlined text-primary">
                info
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bu adımda girilen bilgiler, sözleşme ve ödeme süreçlerinde
                kullanılacaktır. Lütfen kurumunuzla uyumlu ve güncel bilgi
                giriniz.
              </p>
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
                onClick={() => router.push("/satici-ol")}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Önceki Adım
              </button>

              <button
                className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                  hasStartedFilling
                    ? "bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20"
                    : "bg-slate-300 text-slate-600"
                }`}
                type="submit"
                disabled={
                  isSubmitting ||
                  upsertMutation.isPending ||
                  isLoadingInitialData
                }
              >
                {upsertMutation.isPending
                  ? "Kaydediliyor..."
                  : "Kaydet ve Devam Et"}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
