"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import {
  downloadSupplierApplicationDocumentForAdmin,
  fetchSupplierApplicationDocumentForAdmin,
  fetchSupplierApplicationByIdForAdmin,
  fetchSupplierApplicationsForAdmin,
  openSupplierApplicationDocumentForAdmin,
  reviewSupplierApplicationByAdmin,
  type SupplierApplicationAdminListItem,
  type SupplierApplicationRecord,
} from "@/features/supplier-application/api/supplier-application.api";

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

function resolveStatusLabel(status: SupplierApplicationRecord["reviewStatus"]): string {
  if (status === "APPROVED") {
    return "Onaylandı";
  }

  if (status === "REJECTED") {
    return "Reddedildi";
  }

  return "Beklemede";
}

function resolveStatusClassName(status: SupplierApplicationRecord["reviewStatus"]): string {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-700 border border-rose-200";
  }

  return "bg-amber-100 text-amber-700 border border-amber-200";
}

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return "-";
  }

  return value ? "Evet" : "Hayır";
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

function makeUniqueFileName(fileName: string, used: Map<string, number>): string {
  const nextName = fileName.trim().length > 0 ? fileName.trim() : "belge";
  const currentCount = used.get(nextName) ?? 0;

  if (currentCount === 0) {
    used.set(nextName, 1);
    return nextName;
  }

  used.set(nextName, currentCount + 1);

  const extensionIndex = nextName.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${nextName} (${currentCount + 1})`;
  }

  const baseName = nextName.slice(0, extensionIndex);
  const extension = nextName.slice(extensionIndex);
  return `${baseName} (${currentCount + 1})${extension}`;
}

async function downloadApplicationDetailPdf(
  application: SupplierApplicationRecord,
): Promise<Blob> {
  const jsPdfModule = await import("jspdf");
  const { jsPDF } = jsPdfModule;

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 14;
  const maxWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const writeText = (text: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth) as string[];

    for (const line of lines) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }

      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    cursorY += 4;
  };

  writeText("Satıcı Başvuru Detayı", true);
  writeText(`Firma: ${application.companyName}`);
  writeText(`Dışa Aktarım Tarihi: ${formatDate(new Date().toISOString())}`);
  writeText("", false);

  writeText("Başvuru Bilgileri", true);

  const detailRows = [
    ["Başvuru ID", application.id],
    ["Kullanıcı ID", application.userId],
    ["Firma Unvanı", application.companyName],
    ["Şirket Türü", application.companyType],
    ["VKN/TCKN", application.vknOrTckn],
    ["Vergi Dairesi", application.taxOffice],
    ["MERSİS No", application.mersisNo],
    ["Ticaret Sicil No", application.tradeRegistryNo ?? "-"],
    ["Faaliyet Alanı", application.activitySector],
    ["İl", application.city],
    ["İlçe", application.district],
    ["Referans Kodu", application.referenceCode ?? "-"],
    ["IBAN", application.companyIban ?? "-"],
    ["KEP Adresi", application.kepAddress ?? "-"],
    ["E-Fatura Mükellefi", formatBoolean(application.isEInvoiceTaxpayer)],
    ["İşletme Telefonu", application.businessPhone ?? "-"],
    ["Merkez Adresi", application.headquartersAddress ?? "-"],
    [
      "Depo Adresi Merkezle Aynı",
      formatBoolean(application.warehouseSameAsHeadquarters),
    ],
    ["Depo Adresi", application.warehouseAddress ?? "-"],
    ["Yetkili Ad", application.contactFirstName ?? "-"],
    ["Yetkili Soyad", application.contactLastName ?? "-"],
    ["Yetkili Görev", application.contactRole ?? "-"],
    ["Yetkili Telefon", application.contactPhone ?? "-"],
    ["Yetkili E-posta", application.contactEmail ?? "-"],
    [
      "Tedarikçi Sözleşme Onayı",
      application.approvedSupplierAgreement ? "Evet" : "Hayır",
    ],
    ["KVKK Onayı", application.approvedKvkkAgreement ? "Evet" : "Hayır"],
    [
      "Ticari İleti İzni",
      application.approvedCommercialMessage ? "Evet" : "Hayır",
    ],
    ["Durum", resolveStatusLabel(application.reviewStatus)],
    ["Değerlendirme Notu", application.reviewNote ?? "-"],
    ["Değerlendirme Tarihi", formatDate(application.reviewedAt)],
    ["Oluşturulma", formatDate(application.createdAt)],
    ["Güncellenme", formatDate(application.updatedAt)],
  ];

  for (const [label, value] of detailRows) {
    writeText(`${label}: ${value}`);
  }

  writeText("", false);
  writeText("Yüklenen Belgeler", true);

  if (application.documents.length === 0) {
    writeText("Belge bulunmuyor.");
  } else {
    for (const document of application.documents) {
      writeText(
        `${document.documentType} | ${document.originalName} | ${formatFileSizeMb(document.fileSize)} | ${document.mimeType} | ${formatDate(document.uploadedAt)}`,
      );
    }
  }

  return doc.output("blob");
}

export default function AdminSupplierApplicationsPage() {
  const queryClient = useQueryClient();
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDownloadingAllDocuments, setIsDownloadingAllDocuments] = useState(false);
  const [isDownloadingDetailPdf, setIsDownloadingDetailPdf] = useState(false);

  const applicationsQuery = useQuery({
    queryKey: ["admin", "supplier-applications"],
    queryFn: fetchSupplierApplicationsForAdmin,
  });

  const selectedApplicationQuery = useQuery({
    queryKey: ["admin", "supplier-applications", selectedApplicationId],
    queryFn: () => fetchSupplierApplicationByIdForAdmin(selectedApplicationId as string),
    enabled: Boolean(selectedApplicationId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reviewNote?: string;
    }) => reviewSupplierApplicationByAdmin(id, { status, reviewNote }),
    onSuccess: async (_, variables) => {
      setActionError(null);
      setActionMessage(
        variables.status === "APPROVED"
          ? "Başvuru onaylandı ve kullanıcı rolü satıcıya geçirildi."
          : "Başvuru reddedildi ve red nedeni kaydedildi.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["admin", "supplier-applications"],
      });

      if (selectedApplicationId) {
        await queryClient.invalidateQueries({
          queryKey: ["admin", "supplier-applications", selectedApplicationId],
        });
      }
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(
        error instanceof Error
          ? error.message
          : "Başvuru güncellenirken bir sorun oluştu.",
      );
    },
  });

  const totals = useMemo(() => {
    const rows = applicationsQuery.data ?? [];

    return {
      total: rows.length,
      pending: rows.filter((item) => item.reviewStatus === "PENDING").length,
      approved: rows.filter((item) => item.reviewStatus === "APPROVED").length,
      rejected: rows.filter((item) => item.reviewStatus === "REJECTED").length,
    };
  }, [applicationsQuery.data]);

  const handleApprove = async (application: SupplierApplicationAdminListItem) => {
    setActionMessage(null);
    setActionError(null);
    setRejectTargetId(null);

    await reviewMutation.mutateAsync({
      id: application.id,
      status: "APPROVED",
      reviewNote: "",
    });
  };

  const handleReject = async () => {
    if (!rejectTargetId) {
      return;
    }

    if (rejectNote.trim().length === 0) {
      setActionMessage(null);
      setActionError("Başvuruyu reddetmek için red nedeni yazmanız zorunludur.");
      return;
    }

    setActionMessage(null);
    setActionError(null);

    await reviewMutation.mutateAsync({
      id: rejectTargetId,
      status: "REJECTED",
      reviewNote: rejectNote.trim(),
    });

    setRejectTargetId(null);
    setRejectNote("");
  };

  const handleOpenDetail = (applicationId: string) => {
    setDetailError(null);
    setSelectedApplicationId(applicationId);
  };

  const handleDownloadAllDocuments = async (
    application: SupplierApplicationRecord,
  ) => {
    if (application.documents.length === 0) {
      return;
    }

    setDetailError(null);
    setIsDownloadingAllDocuments(true);

    try {
      for (const document of application.documents) {
        await downloadSupplierApplicationDocumentForAdmin(
          application.id,
          document.documentType,
          document.originalName,
        );
      }
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Belgeler indirilirken bir sorun oluştu.",
      );
    } finally {
      setIsDownloadingAllDocuments(false);
    }
  };

  const handleDownloadDetailPdf = async (
    application: SupplierApplicationRecord,
  ) => {
    setDetailError(null);
    setIsDownloadingDetailPdf(true);

    try {
      const [pdfBlob, jsZipModule] = await Promise.all([
        downloadApplicationDetailPdf(application),
        import("jszip"),
      ]);

      const JSZipCtor = (jsZipModule.default ?? jsZipModule) as unknown as {
        new (): {
          file: (name: string, data: Blob | string) => void;
          generateAsync: (options: { type: "blob" }) => Promise<Blob>;
        };
      };

      const zip = new JSZipCtor();
      const baseFileName = sanitizeFileName(application.companyName) || "satici-basvurusu";
      zip.file(`${baseFileName}-detay.pdf`, pdfBlob);

      const usedNames = new Map<string, number>();
      const failedDocuments: string[] = [];
      for (const document of application.documents) {
        try {
          const { blob, fileName } = await fetchSupplierApplicationDocumentForAdmin(
            application.id,
            document.documentType,
          );

          const preferredName =
            fileName.trim().length > 0 && fileName !== "belge"
              ? fileName
              : document.originalName;

          const uniqueName = makeUniqueFileName(preferredName, usedNames);
          zip.file(`belgeler/${uniqueName}`, blob);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Belge indirilemedi.";
          failedDocuments.push(
            `${document.documentType} (${document.originalName}): ${reason}`,
          );
        }
      }

      if (failedDocuments.length > 0) {
        zip.file(
          "belgeler/indirme-hatalari.txt",
          [
            "Aşağıdaki belgeler indirilirken hata alındı:",
            ...failedDocuments,
          ].join("\n"),
        );
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${baseFileName}-detay-ve-belgeler.zip`);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Başvuru detayı ve belgeler ZIP olarak indirilemedi.",
      );
    } finally {
      setIsDownloadingDetailPdf(false);
    }
  };

  const selectedApplication = selectedApplicationQuery.data;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        actions={
          <button
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant"
            type="button"
          >
            Listeyi Dışa Aktar
          </button>
        }
        description="Satıcı başvurularını inceleyin, detayları görüntüleyin ve onay/red işlemini yönetin."
        title="Satıcı Başvuruları"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-100/70 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Toplam Başvuru</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Bekleyen</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Onaylanan</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">{totals.approved}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Reddedilen</p>
          <p className="mt-2 text-3xl font-bold text-rose-800">{totals.rejected}</p>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-100/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Firma</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Sektör</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Başvuru Tarihi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Durum</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicationsQuery.isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={5}>
                    Başvurular yükleniyor...
                  </td>
                </tr>
              ) : null}

              {applicationsQuery.isError ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-rose-700" colSpan={5}>
                    Başvuru listesi alınamadı. Lütfen sayfayı yenileyiniz.
                  </td>
                </tr>
              ) : null}

              {!applicationsQuery.isLoading &&
              !applicationsQuery.isError &&
              (applicationsQuery.data ?? []).length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={5}>
                    Henüz satıcı başvurusu bulunmuyor.
                  </td>
                </tr>
              ) : null}

              {(applicationsQuery.data ?? []).map((application) => (
                <tr key={application.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{application.companyName}</p>
                      <p className="text-xs text-slate-500">{application.userEmail}</p>
                      <p className="text-xs text-slate-500">VKN/TCKN: {application.vknOrTckn}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 align-top">
                    {application.activitySector}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 align-top">
                    {formatDate(application.createdAt)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${resolveStatusClassName(application.reviewStatus)}`}
                    >
                      {resolveStatusLabel(application.reviewStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                        onClick={() => handleOpenDetail(application.id)}
                        type="button"
                      >
                        Detayları Gör
                      </button>
                      <button
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                        disabled={reviewMutation.isPending}
                        onClick={() => handleApprove(application)}
                        type="button"
                      >
                        Onayla
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                        disabled={reviewMutation.isPending}
                        onClick={() => {
                          setRejectTargetId(application.id);
                          setRejectNote(application.reviewNote ?? "");
                        }}
                        type="button"
                      >
                        Reddet
                      </button>
                    </div>

                    {rejectTargetId === application.id ? (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                          Red Nedeni
                        </label>
                        <textarea
                          className="mt-2 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-300"
                          onChange={(event) => setRejectNote(event.target.value)}
                          placeholder="Örn: Vergi levhası okunaksız olduğu için başvuru reddedildi."
                          rows={3}
                          value={rejectNote}
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                            onClick={() => {
                              setRejectTargetId(null);
                              setRejectNote("");
                            }}
                            type="button"
                          >
                            Vazgeç
                          </button>
                          <button
                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            disabled={reviewMutation.isPending}
                            onClick={handleReject}
                            type="button"
                          >
                            Reddi Kaydet
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-xl border border-slate-100/70 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-on-surface">Başvuru Detayı</h3>
          <div className="flex flex-wrap items-center gap-2">
            {selectedApplication ? (
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDownloadingDetailPdf}
                onClick={() => handleDownloadDetailPdf(selectedApplication)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                {isDownloadingDetailPdf
                  ? "ZIP Hazırlanıyor..."
                  : "Başvuru Detayı + Belgeler ZIP İndir"}
              </button>
            ) : null}

            {selectedApplicationId ? (
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                onClick={() => setSelectedApplicationId(null)}
                type="button"
              >
                Kapat
              </button>
            ) : null}
          </div>
        </div>

        {!selectedApplicationId ? (
          <p className="text-sm text-slate-500">Detaylarını görmek için tablodan bir başvuru seçiniz.</p>
        ) : null}

        {selectedApplicationId && selectedApplicationQuery.isLoading ? (
          <p className="text-sm text-slate-500">Başvuru detayı yükleniyor...</p>
        ) : null}

        {selectedApplicationId && selectedApplicationQuery.isError ? (
          <p className="text-sm text-rose-700">Başvuru detayı alınamadı.</p>
        ) : null}

        {detailError ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {detailError}
          </p>
        ) : null}

        {selectedApplication ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Şirket Bilgileri</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Unvan</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.companyName}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Şirket Türü</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.companyType}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">VKN/TCKN</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.vknOrTckn}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Vergi Dairesi</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.taxOffice}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">MERSİS No</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.mersisNo}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Ticaret Sicil No</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.tradeRegistryNo ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Faaliyet Alanı</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.activitySector}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">İl / İlçe</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.city} / {selectedApplication.district}</dd></div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">İletişim ve Finans</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">İletişim E-postası</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.contactEmail ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">İletişim Telefonu</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.contactPhone ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Yetkili</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.contactFirstName ?? ""} {selectedApplication.contactLastName ?? ""}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Görev</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.contactRole ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">IBAN</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.companyIban ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">KEP</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.kepAddress ?? "-"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">E-Fatura</dt><dd className="font-semibold text-slate-800 text-right">{selectedApplication.isEInvoiceTaxpayer ? "Evet" : "Hayır"}</dd></div>
                </dl>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Adres ve Sözleşme Onayları</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Şirket Merkezi Adresi</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedApplication.headquartersAddress ?? "-"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Depo Adresi</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedApplication.warehouseAddress ?? "-"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p>Sözleşme Onayı: <strong>{selectedApplication.approvedSupplierAgreement ? "Evet" : "Hayır"}</strong></p>
                  <p>KVKK Onayı: <strong>{selectedApplication.approvedKvkkAgreement ? "Evet" : "Hayır"}</strong></p>
                  <p>Ticari İleti İzni: <strong>{selectedApplication.approvedCommercialMessage ? "Evet" : "Hayır"}</strong></p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p>Durum: <strong>{resolveStatusLabel(selectedApplication.reviewStatus)}</strong></p>
                  <p>Değerlendirme Tarihi: <strong>{formatDate(selectedApplication.reviewedAt ?? selectedApplication.updatedAt)}</strong></p>
                  <p className="mt-1">Not: <strong>{selectedApplication.reviewNote ?? "-"}</strong></p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Yüklenen Belgeler</h4>
                {selectedApplication.documents.length > 0 ? (
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isDownloadingAllDocuments}
                    onClick={() => handleDownloadAllDocuments(selectedApplication)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {isDownloadingAllDocuments
                      ? "Belgeler İndiriliyor..."
                      : "Tüm Belgeleri İndir"}
                  </button>
                ) : null}
              </div>
              {selectedApplication.documents.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Bu başvuru için yüklenmiş belge bulunmuyor.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {selectedApplication.documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{document.originalName}</p>
                        <p className="text-xs text-slate-500">
                          Tür: {document.documentType} • Boyut: {formatFileSizeMb(document.fileSize)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                          onClick={async () => {
                            try {
                              setDetailError(null);
                              await openSupplierApplicationDocumentForAdmin(
                                selectedApplication.id,
                                document.documentType,
                              );
                            } catch (error) {
                              setDetailError(
                                error instanceof Error
                                  ? error.message
                                  : "Belge görüntülenemedi.",
                              );
                            }
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Belgeyi Görüntüle
                        </button>

                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={async () => {
                            try {
                              setDetailError(null);
                              await downloadSupplierApplicationDocumentForAdmin(
                                selectedApplication.id,
                                document.documentType,
                                document.originalName,
                              );
                            } catch (error) {
                              setDetailError(
                                error instanceof Error
                                  ? error.message
                                  : "Belge indirilemedi.",
                              );
                            }
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          İndir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
