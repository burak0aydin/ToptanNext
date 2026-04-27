"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchMyLogisticsApplication } from "@/features/logistics-application/api/logistics-application.api";
import {
  logisticsAuthorizationDocumentTypeLabels,
  logisticsFleetCapacityLabels,
  logisticsMainServiceTypeLabels,
  logisticsServiceRegionLabels,
} from "@/features/logistics-application/logistics-application.store";

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

export default function LogisticsManagementPanelPage() {
  const applicationQuery = useQuery({
    queryKey: ["me", "logistics-application", "management-panel"],
    queryFn: fetchMyLogisticsApplication,
  });

  if (applicationQuery.isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Lojistik panel bilgileri yükleniyor...
      </div>
    );
  }

  if (applicationQuery.isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Panel bilgileri alınırken bir sorun oluştu.
      </div>
    );
  }

  const application = applicationQuery.data;

  if (!application) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Lojistik başvurunuz bulunamadı.</h2>
        <p className="text-sm text-slate-600">
          Önce lojistik partner başvurusunu tamamlayarak panel erişimi alabilirsiniz.
        </p>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          href="/lojistik/basvuru"
        >
          Lojistik Başvurusu Yap
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    );
  }

  if (application.reviewStatus !== "APPROVED") {
    return (
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-bold text-amber-900">Panel erişimi henüz aktif değil.</h2>
        <p className="text-sm text-amber-800">
          Lojistik başvurunuz onaylandığında bu panel üzerinden operasyonlarınızı yönetebilirsiniz.
        </p>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          href="/lojistik/basvuru/basvuru-sonucu"
        >
          Başvuru Sonucunu Gör
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-bold text-emerald-800">Lojistik Yönetim Paneli Aktif</h2>
        <p className="mt-1 text-sm text-emerald-700">
          Başvurunuz onaylandı. Lojistik partner hesabınızla yönetim sürecini buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Başvuru Durumu</p>
          <p className="mt-2 text-lg font-bold text-emerald-700">Onaylandı</p>
          <p className="mt-2 text-sm text-slate-600">Onay Tarihi: {formatDate(application.reviewedAt)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lojistik Yetki Belgesi</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {logisticsAuthorizationDocumentTypeLabels[application.logisticsAuthorizationDocumentType]}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Filo Kapasitesi: {application.fleetCapacity ? logisticsFleetCapacityLabels[application.fleetCapacity] : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ana Hizmet Tipleri</p>
          <p className="mt-2 text-sm font-medium text-slate-800">
            {application.mainServiceTypes.length > 0
              ? application.mainServiceTypes.map((item) => logisticsMainServiceTypeLabels[item]).join(", ")
              : "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hizmet Bölgeleri</p>
          <p className="mt-2 text-sm font-medium text-slate-800">
            {application.serviceRegions.length > 0
              ? application.serviceRegions.map((item) => logisticsServiceRegionLabels[item]).join(", ")
              : "-"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">İletişim Bilgisi</p>
        <p className="mt-2 text-sm text-slate-700">
          {application.contactFirstName ?? ""} {application.contactLastName ?? ""} • {application.contactPhone ?? "-"} • {application.contactEmail ?? "-"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          href="/lojistik/basvuru/basvuru-sonucu"
        >
          Başvuru Sonucu Sayfası
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </Link>
      </div>
    </div>
  );
}
