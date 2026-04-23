"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  deleteProductListing,
  fetchCategoriesTree,
  fetchMyProductListings,
  resolveProductListingMediaUrl,
  updateProductListingActiveStatus,
  type CategoryTreeNode,
  type ProductListingManagementStatus,
  type ProductListingRecord,
} from "@/features/product-listing/api/product-listing.api";

type SummaryCard = {
  icon: string;
  iconContainerClassName: string;
  label: string;
  value: number;
};

type StockFilter = "ALL" | "OUT_OF_STOCK";

const PAGE_SIZE = 10;

function flattenLeafCategories(nodes: CategoryTreeNode[]): Array<{ id: string; name: string }> {
  return nodes.flatMap((node) => {
    if (node.children.length === 0) {
      return node.level === 3 ? [{ id: node.id, name: node.name }] : [];
    }

    return flattenLeafCategories(node.children);
  });
}

function formatCurrency(value: string | null): string {
  if (!value) {
    return "-";
  }

  return Number(value).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString("tr-TR");
}

function resolveStatusLabel(listing: ProductListingRecord): "YAYINDA" | "ONAY BEKLIYOR" | "PASIF" | "REDDEDILDI" | "TASLAK" {
  if (!listing.isActive) {
    return "PASIF";
  }

  if (listing.status === "APPROVED") {
    return "YAYINDA";
  }

  if (listing.status === "PENDING_REVIEW") {
    return "ONAY BEKLIYOR";
  }

  if (listing.status === "REJECTED") {
    return "REDDEDILDI";
  }

  return "TASLAK";
}

function getStatusBadgeClassName(status: ReturnType<typeof resolveStatusLabel>): string {
  if (status === "YAYINDA") {
    return "bg-green-50 text-green-700";
  }

  if (status === "ONAY BEKLIYOR") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "REDDEDILDI") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getStatusDotClassName(status: ReturnType<typeof resolveStatusLabel>): string {
  if (status === "YAYINDA") {
    return "bg-green-500";
  }

  if (status === "ONAY BEKLIYOR") {
    return "bg-amber-500";
  }

  if (status === "REDDEDILDI") {
    return "bg-red-500";
  }

  return "bg-slate-500";
}

function getDisplayStatus(status: ReturnType<typeof resolveStatusLabel>): string {
  if (status === "ONAY BEKLIYOR") {
    return "Onay Bekliyor";
  }

  if (status === "YAYINDA") {
    return "Yayında";
  }

  if (status === "REDDEDILDI") {
    return "Reddedildi";
  }

  if (status === "TASLAK") {
    return "Taslak";
  }

  return "Pasif";
}

function getCoverImage(listing: ProductListingRecord): string | null {
  const cover = listing.media.find((media) => media.mediaType === "IMAGE");
  return cover ? resolveProductListingMediaUrl(cover.id) : null;
}

export default function SellerProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ProductListingManagementStatus>("ALL");
  const [stock, setStock] = useState<StockFilter>("ALL");
  const [previewListing, setPreviewListing] = useState<ProductListingRecord | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const effectiveStatus: ProductListingManagementStatus =
    stock === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : status;

  const listingsQuery = useQuery({
    queryKey: ["seller-product-listings", { page, categoryId, effectiveStatus }],
    queryFn: () =>
      fetchMyProductListings({
        page,
        limit: PAGE_SIZE,
        categoryId: categoryId || undefined,
        status: effectiveStatus,
      }),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const categoriesQuery = useQuery({
    queryKey: ["seller-product-listing-categories"],
    queryFn: fetchCategoriesTree,
    staleTime: 5 * 60 * 1000,
  });

  const activePayload = listingsQuery.data;
  const productRows = activePayload?.items ?? [];
  const summary = activePayload?.summary ?? {
    totalProducts: 0,
    pendingReview: 0,
    rejected: 0,
    passive: 0,
    outOfStock: 0,
  };

  const summaryCards: SummaryCard[] = [
    {
      icon: "inventory",
      iconContainerClassName: "bg-primary/10 text-primary",
      label: "Toplam Ürün",
      value: summary.totalProducts,
    },
    {
      icon: "pending_actions",
      iconContainerClassName: "bg-amber-100 text-amber-700",
      label: "Onay Bekleyenler",
      value: summary.pendingReview,
    },
    {
      icon: "cancel",
      iconContainerClassName: "bg-red-100 text-red-700",
      label: "Reddedilenler",
      value: summary.rejected,
    },
    {
      icon: "pause_circle",
      iconContainerClassName: "bg-slate-100 text-slate-700",
      label: "Pasifte Olanlar",
      value: summary.passive,
    },
    {
      icon: "error_outline",
      iconContainerClassName: "bg-red-50 text-red-600",
      label: "Stokta Olmayanlar",
      value: summary.outOfStock,
    },
  ];

  const categoryOptions = useMemo(
    () => flattenLeafCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const activeStatusMutation = useMutation({
    mutationFn: ({ listingId, isActive }: { listingId: string; isActive: boolean }) =>
      updateProductListingActiveStatus(listingId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller-product-listings"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductListing,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller-product-listings"] });
    },
  });

  const resetFilters = () => {
    setCategoryId("");
    setStatus("ALL");
    setStock("ALL");
    setPage(1);
  };

  const total = activePayload?.total ?? 0;
  const totalPages = activePayload?.totalPages ?? 1;
  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);
  const previewImages = previewListing
    ? previewListing.media
        .filter((media) => media.mediaType === "IMAGE")
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((media) => resolveProductListingMediaUrl(media.id))
    : [];
  const previewMainImage = previewImages[previewImageIndex] ?? null;
  const previewDescription = previewListing
    ? previewListing.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Ürünlerim</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Platformdaki tüm envanterinizi ve onay bekleyen ürünlerinizi buradan yönetin.
          </p>
        </div>
        <Link
          href="/satici-panelim/urun-yukle"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-md shadow-primary/20 transition-all hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Yeni Ürün Ekle
        </Link>
      </div>

      {listingsQuery.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Ürünler yüklenirken hata oluştu.
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconContainerClassName}`}
              >
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-4 text-slate-700">{card.label}</p>
                <h3 className="mt-1 text-[26px] font-semibold leading-none tracking-tight text-slate-900">
                  {formatNumber(card.value)}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-surface-container-lowest">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Ürün Kategorileri</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <div className="relative">
              <select
                className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10"
                value={stock}
                onChange={(event) => {
                  setStock(event.target.value as StockFilter);
                  setPage(1);
                }}
              >
                <option value="ALL">Stok</option>
                <option value="OUT_OF_STOCK">Stokta Olmayanlar</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <div className="relative">
              <select
                className="cursor-pointer appearance-none rounded-xl border-none bg-surface-container-low px-4 py-2 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as ProductListingManagementStatus);
                  setPage(1);
                }}
                disabled={stock === "OUT_OF_STOCK"}
              >
                <option value="ALL">Durum</option>
                <option value="ACTIVE">Yayında</option>
                <option value="PENDING_REVIEW">Onay Bekliyor</option>
                <option value="PASSIVE">Pasif</option>
                <option value="REJECTED">Reddedildi</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                keyboard_arrow_down
              </span>
            </div>

            <button
              className="px-2 text-sm font-semibold text-primary hover:underline"
              onClick={resetFilters}
              type="button"
            >
              Filtreleri Temizle
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs font-medium text-slate-400">Görünüm:</span>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-200/50 bg-surface-container-low/50">
              <tr>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">Ürün</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">SKU</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">Kategori</th>
                <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-700">Birim Fiyat</th>
                <th className="px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-700">Stok</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-700">Durum</th>
                <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-700">İşlemler</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {listingsQuery.isPending ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    Ürünler yükleniyor...
                  </td>
                </tr>
              ) : productRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                productRows.map((row) => {
                  const statusLabel = resolveStatusLabel(row);
                  const coverImage = getCoverImage(row);
                  const canToggle = row.status !== "PENDING_REVIEW";
                  const canDelete = row.status !== "PENDING_REVIEW";

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50/50 ${!row.isActive ? "opacity-75" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverImage}
                                alt={row.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-500">{row.sku}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-500">{row.categoryName}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-on-surface">{formatCurrency(row.basePrice)}</p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm font-medium ${(row.stock ?? 0) === 0 ? "font-bold text-red-500" : "text-on-surface-variant"}`}
                        >
                          {formatNumber(row.stock ?? 0)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-tighter ${getStatusBadgeClassName(statusLabel)}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${getStatusDotClassName(statusLabel)}`} />
                          {getDisplayStatus(statusLabel)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="text-slate-400 transition-colors hover:text-primary"
                            title="Önizle"
                            type="button"
                            onClick={() => {
                              setPreviewListing(row);
                              setPreviewImageIndex(0);
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <Link
                            href="/satici-panelim/urun-yukle"
                            className="text-slate-400 transition-colors hover:text-primary"
                            title="Düzenle"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </Link>
                          <button
                            className="text-slate-400 transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                            title="Sil"
                            type="button"
                            disabled={!canDelete || deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
                                deleteMutation.mutate(row.id);
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>

                          <label
                            className={`relative inline-flex items-center ${canToggle ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                            title={canToggle ? "Aktif/Pasif" : "Onay bekleyen ürün durumu değiştirilemez"}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={row.isActive}
                              disabled={!canToggle || activeStatusMutation.isPending}
                              onChange={(event) => {
                                activeStatusMutation.mutate({
                                  listingId: row.id,
                                  isActive: event.target.checked,
                                });
                              }}
                            />
                            <span className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 bg-slate-50/30 p-6 sm:flex-row">
          <p className="text-sm text-on-surface-variant">
            Toplam {formatNumber(total)} üründen {formatNumber(startIndex)}-{formatNumber(endIndex)} arası gösteriliyor
          </p>
          <div className="flex items-center gap-1">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white hover:shadow-sm disabled:opacity-40"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  key={pageNumber}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium transition-all ${
                    page === pageNumber
                      ? "bg-primary font-bold text-white shadow-md shadow-primary/20"
                      : "text-on-surface hover:bg-white hover:shadow-sm"
                  }`}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}

            {totalPages > 5 ? (
              <>
                <span className="px-2 text-slate-400">...</span>
                <button
                  className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-medium text-on-surface transition-all hover:bg-white hover:shadow-sm"
                  type="button"
                  onClick={() => setPage(totalPages)}
                >
                  {formatNumber(totalPages)}
                </button>
              </>
            ) : null}

            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white hover:shadow-sm disabled:opacity-40"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <section className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <span className="material-symbols-outlined">info</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">İpucu: Ürün Onay Süreçleri</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Yeni eklenen ürünler admin panelinde onaylanana kadar &quot;Onay Bekliyor&quot; statüsünde kalır ve son kullanıcıya gösterilmez.
          </p>
        </div>
      </section>

      {previewListing ? (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 p-3 backdrop-blur-sm md:p-8">
          <div className="mx-auto h-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Alıcı Önizleme</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {previewListing.name}
                  </h3>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setPreviewListing(null)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-2">
                <div className="border-b border-slate-200 bg-slate-100/70 p-4 md:border-b-0 md:border-r">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {previewMainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewMainImage}
                        alt={previewListing.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-5xl">inventory_2</span>
                      </div>
                    )}
                  </div>

                  {previewImages.length > 1 ? (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {previewImages.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setPreviewImageIndex(index)}
                          className={`overflow-hidden rounded-xl border bg-white ${
                            previewImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-slate-200"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt={`${previewListing.name} ${index + 1}`} className="h-16 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {previewListing.categoryName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      SKU: {previewListing.sku}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Başlangıç Fiyatı</p>
                      <p className="text-3xl font-black tracking-tight text-slate-900">
                        {formatCurrency(previewListing.basePrice)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                      <p className="text-xs text-slate-500">Min. Sipariş</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatNumber(previewListing.minOrderQuantity ?? 0)} Adet
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-slate-500">Stok</p>
                      <p className={`mt-1 font-semibold ${(previewListing.stock ?? 0) === 0 ? "text-red-600" : "text-slate-900"}`}>
                        {formatNumber(previewListing.stock ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-slate-500">Teslim Süresi</p>
                      <p className="mt-1 font-semibold text-slate-900">{previewListing.shippingTime ?? "-"}</p>
                    </div>
                  </div>

                  {previewListing.featuredFeatures.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Öne Çıkan Özellikler</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {previewListing.featuredFeatures.map((feature) => (
                          <span key={feature} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ürün Açıklaması</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {previewDescription || "Bu ürün için henüz açıklama girilmedi."}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">request_quote</span>
                      Teklif İste
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Satıcıya Mesaj Gönder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
