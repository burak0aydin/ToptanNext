"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasAccessToken } from "@/lib/auth-token";
import {
  fetchMySupplierApplication,
  type SupplierApplicationRecord,
} from "@/features/supplier-application/api/supplier-application.api";
import { MainHeader } from "../../components/MainHeader";
import { MainFooter } from "../../components/MainFooter";

type StatusUiModel = {
  badgeClassName: string;
  badgeText: string;
  title: string;
  description: string;
  icon: string;
};

const STATUS_UI: Record<
  SupplierApplicationRecord["reviewStatus"],
  StatusUiModel
> = {
  PENDING: {
    badgeClassName:
      "border border-amber-200 bg-amber-50 text-amber-700",
    badgeText: "İnceleniyor",
    title: "Başvurunuz alındı ve inceleme sürecinde.",
    description:
      "Başvurunuz ortalama 24 saat içinde sonuçlandırılır. Sonucu bu sayfadan takip edebilirsiniz.",
    icon: "schedule",
  },
  APPROVED: {
    badgeClassName:
      "border border-emerald-200 bg-emerald-50 text-emerald-700",
    badgeText: "Onaylandı",
    title: "Tebrikler. Satıcı başvurunuz onaylandı.",
    description:
      "Hesabınız satıcı rolüne geçirildi. Artık satıcı paneli ve ilgili işlemleri kullanabilirsiniz.",
    icon: "verified",
  },
  REJECTED: {
    badgeClassName: "border border-rose-200 bg-rose-50 text-rose-700",
    badgeText: "Reddedildi",
    title: "Başvurunuz bu aşamada reddedildi.",
    description:
      "Red nedenini inceleyip bilgilerinizi güncelledikten sonra yeniden başvuru yapabilirsiniz.",
    icon: "gpp_bad",
  },
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function SaticiBasvuruSonucuPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [application, setApplication] =
    useState<SupplierApplicationRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplication = async () => {
      if (!hasAccessToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await fetchMySupplierApplication();
        if (!isMounted) {
          return;
        }

        setApplication(result);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          "Başvuru sonucu bilgileri alınırken bir sorun oluştu. Lütfen tekrar deneyiniz.",
        );
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

  const statusUi = useMemo(() => {
    if (!application) {
      return null;
    }

    return STATUS_UI[application.reviewStatus];
  }, [application]);

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

              <button
                className="flex w-full items-center gap-3 rounded-lg p-3.5 text-sm font-semibold text-slate-500 text-left"
                type="button"
                onClick={() => router.push("/satici-ol/belge-yukleme-ve-onay")}
              >
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="whitespace-nowrap">Belge Yükleme ve Onay</span>
              </button>

              <div className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-sm font-bold text-primary shadow-sm">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  task_alt
                </span>
                <span className="whitespace-nowrap">Satıcı Başvuru Sonucu</span>
              </div>
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                Bilgilendirme
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    notification_important
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Başvurunuzun sonucu bu sayfadan canlı takip edilir.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">
                    schedule
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sonuç bilgilendirmesi ortalama 24 saat içerisinde yapılır.
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
                  Satıcı Başvuru Sonucu
                </h1>
                <p className="text-on-surface-variant mt-1">
                  Başvurunuzun değerlendirme durumunu buradan takip edebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Başvuru sonucu yükleniyor...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && !application ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Henüz tamamlanmış bir satıcı başvurunuz bulunmuyor.
              </h2>
              <p className="text-sm text-slate-600">
                Başvuru adımlarını tamamladıktan sonra sonuç bu ekranda görüntülenir.
              </p>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={() => router.push("/satici-ol")}
                type="button"
              >
                Başvuruya Başla
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          ) : null}

          {!isLoading && !errorMessage && application && statusUi ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusUi.badgeClassName}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {statusUi.icon}
                    </span>
                    {statusUi.badgeText}
                  </span>
                  <span className="text-xs text-slate-500">
                    Son güncelleme: {formatDate(application.reviewedAt ?? application.updatedAt)}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">{statusUi.title}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {statusUi.description}
                </p>

                {application.reviewStatus === "REJECTED" ? (
                  <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <h3 className="text-sm font-bold text-rose-800">Red Nedeni</h3>
                    <p className="mt-1 text-sm text-rose-700">
                      {application.reviewNote && application.reviewNote.trim().length > 0
                        ? application.reviewNote
                        : "Değerlendirme notu paylaşılmadı. Lütfen destek ekibi ile iletişime geçiniz."}
                    </p>
                  </div>
                ) : null}

                {application.reviewStatus === "APPROVED" ? (
                  <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Tebrikler. Başvurunuz onaylandı ve hesabınız satıcı rolüne geçirildi.
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Başvuru Özeti
                  </h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Firma</dt>
                      <dd className="font-semibold text-slate-800 text-right">
                        {application.companyName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Sektör</dt>
                      <dd className="font-semibold text-slate-800 text-right">
                        {application.activitySector}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Başvuru Tarihi</dt>
                      <dd className="font-semibold text-slate-800 text-right">
                        {formatDate(application.createdAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Yüklenen Belge Sayısı</dt>
                      <dd className="font-semibold text-slate-800 text-right">
                        {application.documents.length}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Sonraki Adım
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {application.reviewStatus === "PENDING" ? (
                      <p>
                        Başvurunuz değerlendirmededir. Ortalama 24 saat içinde
                        sonuçlandırılır ve bu sayfada güncellenir.
                      </p>
                    ) : null}
                    {application.reviewStatus === "APPROVED" ? (
                      <p>
                        Satıcı paneli akışlarını kullanmaya başlayabilir, ürün ve
                        mağaza yönetimi işlemlerine geçebilirsiniz.
                      </p>
                    ) : null}
                    {application.reviewStatus === "REJECTED" ? (
                      <p>
                        Red nedenine göre bilgilerinizi güncelleyip yeniden başvuru
                        adımlarını tamamlayabilirsiniz.
                      </p>
                    ) : null}
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
