"use client";

import { useEffect, useMemo, useState } from "react";
import {
	productListingDeliveryMethodValues,
	productListingPackageTypeValues,
	productListingShippingTimeValues,
	type ProductListingDeliveryMethod,
	type ProductListingPackageType,
	type ProductListingShippingTime,
	type ProductListingStepOneDto,
	type ProductListingStepThreeDto,
	type ProductListingStepTwoDto,
} from "@toptannext/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type AdminProductListingGrowthPeriod,
	type AdminProductListingStatus,
	fetchAdminProductListingById,
	fetchAdminProductListings,
	fetchCategoriesTree,
	fetchSectors,
	type ProductListingRecord,
	reviewProductListingByAdmin,
	updateAdminProductListingStepOne,
	updateAdminProductListingStepThree,
	updateAdminProductListingStepTwo,
} from "@/features/product-listing/api/product-listing.api";
import { AdminPageHeader } from "../_components/AdminPageHeader";

const LIST_LIMIT = 10;

const statusLabelMap: Record<ProductListingRecord["status"], string> = {
	DRAFT: "Taslak",
	PENDING_REVIEW: "Beklemede",
	APPROVED: "Onaylandı",
	REJECTED: "Reddedildi",
};

const packageTypeLabelMap: Record<ProductListingPackageType, string> = {
	BOX: "Koli",
	PALLET: "Palet",
	SACK: "Çuval",
	OTHER: "Diğer",
};

const shippingTimeLabelMap: Record<ProductListingShippingTime, string> = {
	ONE_TO_THREE_DAYS: "1-3 Gün",
	THREE_TO_FIVE_DAYS: "3-5 Gün",
	ONE_WEEK: "1 Hafta",
	CUSTOM_PRODUCTION: "Özel Üretim",
};

const deliveryMethodLabelMap: Record<ProductListingDeliveryMethod, string> = {
	CONTRACTED_CARGO: "Anlaşmalı Kargo Firmaları",
	FREIGHT_FORWARDER: "Ambar / Nakliyat Firması",
	BUYER_PICKUP: "Alıcı Kendi Teslim Alabilir",
	OWN_VEHICLE: "Kendi Aracımızla Gönderim",
};

const statusClassMap: Record<ProductListingRecord["status"], string> = {
	DRAFT: "bg-slate-100 text-slate-700",
	PENDING_REVIEW: "bg-amber-100 text-amber-800",
	APPROVED: "bg-emerald-100 text-emerald-700",
	REJECTED: "bg-rose-100 text-rose-700",
};

const statusFilterOptions: Array<{ value: AdminProductListingStatus; label: string }> = [
	{ value: "ALL", label: "Tüm Durumlar" },
	{ value: "PENDING_REVIEW", label: "Beklemede" },
	{ value: "APPROVED", label: "Onaylandı" },
	{ value: "REJECTED", label: "Reddedildi" },
	{ value: "DRAFT", label: "Taslak" },
];

const periodOptions: Array<{ value: AdminProductListingGrowthPeriod; label: string }> = [
	{ value: "DAILY", label: "Günlük" },
	{ value: "WEEKLY", label: "Haftalık" },
	{ value: "MONTHLY", label: "Aylık" },
];

type EditablePricingTier = {
	minQuantity: string;
	maxQuantity: string;
	unitPrice: string;
};

type ListingEditForm = {
	name: string;
	sku: string;
	description: string;
	categoryId: string;
	sectorIds: string[];
	featuredFeatures: string;
	isCustomizable: boolean;
	customizationNote: string;
	minOrderQuantity: string;
	stock: string;
	isNegotiationEnabled: boolean;
	negotiationThreshold: string;
	pricingTiers: EditablePricingTier[];
	packageType: ProductListingPackageType;
	leadTimeDays: string;
	shippingTime: ProductListingShippingTime;
	deliveryMethods: ProductListingDeliveryMethod[];
	dynamicFreightAgreement: boolean;
	packageLengthCm: string;
	packageWidthCm: string;
	packageHeightCm: string;
	packageWeightKg: string;
};

function formatDate(value: string | null): string {
	if (!value) {
		return "-";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return "-";
	}

	return new Intl.DateTimeFormat("tr-TR").format(parsed);
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("tr-TR").format(value);
}

function getInitials(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
		.join("") || "Ü";
}

function resolvePackageSummary(listing: ProductListingRecord): string {
	const packageType = listing.packageType ? packageTypeLabelMap[listing.packageType] : "Paket tipi yok";
	const dimensions =
		listing.packageWidthCm && listing.packageLengthCm && listing.packageHeightCm
			? `${listing.packageWidthCm} x ${listing.packageLengthCm} x ${listing.packageHeightCm} cm`
			: "Boyut yok";

	return `${packageType} / ${dimensions}`;
}

function createInitialForm(listing: ProductListingRecord): ListingEditForm {
	return {
		name: listing.name,
		sku: listing.sku,
		description: listing.description,
		categoryId: listing.categoryId,
		sectorIds: listing.sectors.map((item) => item.sectorId),
		featuredFeatures: listing.featuredFeatures
			.map((item) => `${item.title}: ${item.description}`)
			.join("\n"),
		isCustomizable: listing.isCustomizable,
		customizationNote: listing.customizationNote ?? "",
		minOrderQuantity: listing.minOrderQuantity !== null ? String(listing.minOrderQuantity) : "1",
		stock: listing.stock !== null ? String(listing.stock) : "0",
		isNegotiationEnabled: listing.isNegotiationEnabled,
		negotiationThreshold:
			listing.negotiationThreshold !== null ? String(listing.negotiationThreshold) : "",
		pricingTiers:
			listing.pricingTiers.length > 0
				? listing.pricingTiers.map((tier) => ({
						minQuantity: String(tier.minQuantity),
						maxQuantity: String(tier.maxQuantity),
						unitPrice: String(tier.unitPrice),
					}))
				: [{ minQuantity: "1", maxQuantity: "1", unitPrice: "1" }],
		packageType: listing.packageType ?? "BOX",
		leadTimeDays: listing.leadTimeDays !== null ? String(listing.leadTimeDays) : "0",
		shippingTime: listing.shippingTime ?? "ONE_TO_THREE_DAYS",
		deliveryMethods:
			listing.deliveryMethods.length > 0 ? listing.deliveryMethods : ["CONTRACTED_CARGO"],
		dynamicFreightAgreement: listing.dynamicFreightAgreement,
		packageLengthCm: listing.packageLengthCm ?? "1",
		packageWidthCm: listing.packageWidthCm ?? "1",
		packageHeightCm: listing.packageHeightCm ?? "1",
		packageWeightKg: listing.packageWeightKg ?? "1",
	};
}

function flattenLeafCategories(
	nodes: Array<{ id: string; name: string; level: number; children: Array<unknown> }>,
): Array<{ id: string; name: string }> {
	const output: Array<{ id: string; name: string }> = [];

	const walk = (items: Array<{ id: string; name: string; level: number; children: Array<unknown> }>): void => {
		items.forEach((item) => {
			if (item.level === 3) {
				output.push({ id: item.id, name: item.name });
				return;
			}

			if (Array.isArray(item.children) && item.children.length > 0) {
				walk(item.children as Array<{ id: string; name: string; level: number; children: Array<unknown> }>);
			}
		});
	};

	walk(nodes);
	return output;
}

function parsePositiveInteger(value: string, fieldLabel: string): number {
	const numberValue = Number(value);
	if (!Number.isFinite(numberValue) || !Number.isInteger(numberValue)) {
		throw new Error(`${fieldLabel} tam sayı olmalıdır.`);
	}

	return numberValue;
}

function parsePositiveNumber(value: string, fieldLabel: string): number {
	const numberValue = Number(value);
	if (!Number.isFinite(numberValue)) {
		throw new Error(`${fieldLabel} geçerli bir sayı olmalıdır.`);
	}

	return numberValue;
}

export default function AdminProductManagementPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<AdminProductListingStatus>("ALL");
	const [period, setPeriod] = useState<AdminProductListingGrowthPeriod>("WEEKLY");
	const [categoryId, setCategoryId] = useState("");
	const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<ListingEditForm | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const adminQuery = useQuery({
		queryKey: ["admin", "product-listings", page, status, period, categoryId],
		queryFn: () =>
			fetchAdminProductListings({
				page,
				limit: LIST_LIMIT,
				status,
				period,
				categoryId: categoryId || undefined,
			}),
		refetchInterval: 15_000,
		refetchOnWindowFocus: true,
	});

	const categoriesQuery = useQuery({
		queryKey: ["admin", "product-listing-categories"],
		queryFn: fetchCategoriesTree,
	});

	const sectorsQuery = useQuery({
		queryKey: ["admin", "product-listing-sectors"],
		queryFn: fetchSectors,
	});

	const selectedListingQuery = useQuery({
		queryKey: ["admin", "product-listing-detail", selectedListingId],
		queryFn: () => fetchAdminProductListingById(selectedListingId as string),
		enabled: Boolean(selectedListingId),
	});

	useEffect(() => {
		if (selectedListingQuery.data) {
			setEditForm(createInitialForm(selectedListingQuery.data));
		}
	}, [selectedListingQuery.data]);

	const reviewMutation = useMutation({
		mutationFn: ({
			id,
			nextStatus,
			reviewNote,
		}: {
			id: string;
			nextStatus: "APPROVED" | "REJECTED";
			reviewNote?: string;
		}) => reviewProductListingByAdmin(id, { status: nextStatus, reviewNote }),
		onSuccess: async (_, variables) => {
			setActionError(null);
			setActionMessage(
				variables.nextStatus === "APPROVED"
					? "Ürün başvurusu onaylandı."
					: "Ürün başvurusu reddedildi.",
			);
			await queryClient.invalidateQueries({
				queryKey: ["admin", "product-listings"],
			});
			if (selectedListingId) {
				await queryClient.invalidateQueries({
					queryKey: ["admin", "product-listing-detail", selectedListingId],
				});
			}
		},
		onError: (error) => {
			setActionMessage(null);
			setActionError(
				error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu.",
			);
		},
	});

	const saveMutation = useMutation({
		mutationFn: async ({ id, form }: { id: string; form: ListingEditForm }) => {
			const categoryValue = form.categoryId.trim();
			if (categoryValue.length === 0) {
				throw new Error("Kategori seçimi zorunludur.");
			}

			const normalizedFeatures = form.featuredFeatures
				.split(/\n/)
				.map((item) => item.trim())
				.filter((item) => item.length > 0)
				.map((item) => {
					const separatorIndex = item.indexOf(":");
					if (separatorIndex <= 0 || separatorIndex >= item.length - 1) {
						throw new Error(
							"Öne çıkan özellikleri 'Başlık: Açıklama' formatında satır satır giriniz.",
						);
					}

					const title = item.slice(0, separatorIndex).trim();
					const description = item.slice(separatorIndex + 1).trim();

					if (!title || !description) {
						throw new Error(
							"Öne çıkan özelliklerde hem başlık hem açıklama zorunludur.",
						);
					}

					return {
						title,
						description,
					};
				});

			const stepOnePayload: ProductListingStepOneDto = {
				name: form.name.trim(),
				sku: form.sku.trim(),
				categoryId: categoryValue,
				sectorIds: form.sectorIds,
				featuredFeatures: normalizedFeatures,
				isCustomizable: form.isCustomizable,
				customizationNote: form.customizationNote.trim(),
				variantGroups: selectedListingQuery.data?.variantGroups ?? [],
				description: form.description.trim(),
			};

			const stepTwoPayload: ProductListingStepTwoDto = {
				minOrderQuantity: parsePositiveInteger(
					form.minOrderQuantity,
					"Minimum sipariş adedi",
				),
				stock: parsePositiveInteger(form.stock, "Stok"),
				isNegotiationEnabled: form.isNegotiationEnabled,
				negotiationThreshold: form.isNegotiationEnabled
					? parsePositiveInteger(form.negotiationThreshold, "Pazarlık eşiği")
					: null,
				pricingTiers: form.pricingTiers.map((tier, index) => ({
					minQuantity: parsePositiveInteger(
						tier.minQuantity,
						`${index + 1}. kademe minimum adedi`,
					),
					maxQuantity: parsePositiveInteger(
						tier.maxQuantity,
						`${index + 1}. kademe maksimum adedi`,
					),
					unitPrice: parsePositiveNumber(
						tier.unitPrice,
						`${index + 1}. kademe birim fiyatı`,
					),
				})),
			};

			const stepThreePayload: ProductListingStepThreeDto = {
				packageType: form.packageType,
				leadTimeDays: parsePositiveInteger(form.leadTimeDays, "Tedarik süresi"),
				shippingTime: form.shippingTime,
				deliveryMethods: form.deliveryMethods,
				dynamicFreightAgreement: form.dynamicFreightAgreement,
				packageLengthCm: parsePositiveNumber(form.packageLengthCm, "Paket eni"),
				packageWidthCm: parsePositiveNumber(form.packageWidthCm, "Paket boyu"),
				packageHeightCm: parsePositiveNumber(form.packageHeightCm, "Paket yüksekliği"),
				packageWeightKg: parsePositiveNumber(form.packageWeightKg, "Paket ağırlığı"),
			};

			await updateAdminProductListingStepOne(id, stepOnePayload);
			await updateAdminProductListingStepTwo(id, stepTwoPayload);
			return updateAdminProductListingStepThree(id, stepThreePayload);
		},
		onSuccess: async () => {
			setActionError(null);
			setActionMessage("Ürün başvuru detayları güncellendi.");
			await queryClient.invalidateQueries({
				queryKey: ["admin", "product-listings"],
			});
			if (selectedListingId) {
				await queryClient.invalidateQueries({
					queryKey: ["admin", "product-listing-detail", selectedListingId],
				});
			}
		},
		onError: (error) => {
			setActionMessage(null);
			setActionError(
				error instanceof Error ? error.message : "Detay güncellenirken bir hata oluştu.",
			);
		},
	});

	const data = adminQuery.data;
	const items = data?.listings.items ?? [];
	const summary = data?.summary ?? { totalProducts: 0, pendingReview: 0 };
	const growth = data?.growth ?? { period, labels: [], values: [] };
	const distribution = data?.categoryDistribution ?? [];

	const growthMax = useMemo(() => {
		if (growth.values.length === 0) {
			return 1;
		}
		return Math.max(...growth.values, 1);
	}, [growth.values]);

	const categoryOptions = useMemo(() => {
		const map = new Map<string, string>();

		distribution.forEach((item) => map.set(item.categoryId, item.categoryName));
		items.forEach((item) => map.set(item.categoryId, item.categoryName));

		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [distribution, items]);

	const leafCategoryOptions = useMemo(
		() => flattenLeafCategories(categoriesQuery.data ?? []),
		[categoriesQuery.data],
	);

	const canGoPrev = (data?.listings.page ?? 1) > 1;
	const canGoNext = (data?.listings.page ?? 1) < (data?.listings.totalPages ?? 1);

	async function handleApprove(listingId: string): Promise<void> {
		setActionMessage(null);
		setActionError(null);
		await reviewMutation.mutateAsync({
			id: listingId,
			nextStatus: "APPROVED",
			reviewNote: "",
		});
	}

	async function handleReject(listingId: string): Promise<void> {
		const note = window.prompt("Red nedeni giriniz:");
		if (!note || note.trim().length === 0) {
			setActionMessage(null);
			setActionError("Ürünü reddetmek için not zorunludur.");
			return;
		}

		setActionMessage(null);
		setActionError(null);
		await reviewMutation.mutateAsync({
			id: listingId,
			nextStatus: "REJECTED",
			reviewNote: note.trim(),
		});
	}

	function closeDetailModal(): void {
		setSelectedListingId(null);
		setEditForm(null);
	}

	function toggleSector(sectorId: string): void {
		setEditForm((current) => {
			if (!current) {
				return current;
			}

			const alreadySelected = current.sectorIds.includes(sectorId);
			return {
				...current,
				sectorIds: alreadySelected
					? current.sectorIds.filter((value) => value !== sectorId)
					: [...current.sectorIds, sectorId],
			};
		});
	}

	function toggleDeliveryMethod(method: ProductListingDeliveryMethod): void {
		setEditForm((current) => {
			if (!current) {
				return current;
			}

			const exists = current.deliveryMethods.includes(method);
			const next = exists
				? current.deliveryMethods.filter((value) => value !== method)
				: [...current.deliveryMethods, method];

			return {
				...current,
				deliveryMethods: next,
			};
		});
	}

	function addPricingTier(): void {
		setEditForm((current) => {
			if (!current || current.pricingTiers.length >= 6) {
				return current;
			}

			return {
				...current,
				pricingTiers: [...current.pricingTiers, { minQuantity: "1", maxQuantity: "1", unitPrice: "1" }],
			};
		});
	}

	function removePricingTier(index: number): void {
		setEditForm((current) => {
			if (!current || current.pricingTiers.length <= 1) {
				return current;
			}

			return {
				...current,
				pricingTiers: current.pricingTiers.filter((_, itemIndex) => itemIndex !== index),
			};
		});
	}

	function updatePricingTier(index: number, key: keyof EditablePricingTier, value: string): void {
		setEditForm((current) => {
			if (!current) {
				return current;
			}

			return {
				...current,
				pricingTiers: current.pricingTiers.map((tier, tierIndex) =>
					tierIndex === index ? { ...tier, [key]: value } : tier,
				),
			};
		});
	}

	return (
		<div className="mx-auto max-w-7xl space-y-8">
			<AdminPageHeader
				actions={
					<button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90">
						Listeyi Dışa Aktar
					</button>
				}
				description="Bekleyen ürün başvurularını inceleyin ve aksiyon alın."
				title="Ürün Yönetimi"
			/>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="group flex cursor-default items-center justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
					<div>
						<p className="text-sm font-medium text-on-surface-variant">Toplam Ürün Sayısı</p>
						<h3 className="mt-1 text-3xl font-bold tracking-tight text-primary">
							{formatNumber(summary.totalProducts)}
						</h3>
					</div>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
						<span className="material-symbols-outlined text-3xl">storefront</span>
					</div>
				</div>

				<div className="group flex cursor-default items-center justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
					<div>
						<p className="text-sm font-medium text-on-surface-variant">Bekleyen Ürün Başvuruları</p>
						<h3 className="mt-1 text-3xl font-bold tracking-tight text-secondary">
							{formatNumber(summary.pendingReview)}
						</h3>
						<p className="mt-2 flex items-center text-xs font-semibold text-secondary-container">
							<span className="material-symbols-outlined mr-1 text-sm">priority_high</span>
							Aksiyon bekleniyor
						</p>
					</div>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/5 text-secondary">
						<span className="material-symbols-outlined text-3xl">pending_actions</span>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-on-surface">Ürün Sayısı Artış Analizi</h2>
						<p className="text-sm text-on-surface-variant">
							Sisteme eklenen ürün başvurularının zamansal dağılımı
						</p>
					</div>
					<div className="flex rounded-lg bg-surface-container-low p-1">
						{periodOptions.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => setPeriod(option.value)}
								className={
									period === option.value
										? "rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors"
										: "rounded-md px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
								}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				<div className="flex h-64 items-end justify-between gap-4 px-2">
					{growth.labels.map((label, index) => {
						const value = growth.values[index] ?? 0;
						const heightPercent =
							value === 0 ? 6 : Math.max(10, Math.round((value / growthMax) * 100));
						const isActive = index === growth.labels.length - 1;
						return (
							<div key={label} className="flex flex-1 flex-col items-center gap-2">
								<div
									style={{ height: `${heightPercent}%` }}
									className={
										isActive
											? "group relative w-full rounded-t-lg bg-primary transition-all hover:opacity-90"
											: "group relative w-full rounded-t-lg bg-primary/10 transition-all hover:bg-primary/20"
									}
								>
									<span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-inverse-surface px-2 py-1 text-[10px] text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
										{value}
									</span>
								</div>
								<span
									className={
										isActive
											? "text-[10px] font-bold text-primary"
											: "text-[10px] font-bold text-slate-400"
									}
								>
									{label}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-slate-100/50 bg-surface-container-lowest shadow-sm">
				<div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="text-xl font-bold text-on-surface">Ürün Başvuruları</h2>
					<div className="flex flex-wrap gap-2">
						<select
							value={categoryId}
							onChange={(event) => {
								setCategoryId(event.target.value);
								setPage(1);
							}}
							className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant"
						>
							<option value="">Tüm Kategoriler</option>
							{categoryOptions.map((option) => (
								<option key={option.id} value={option.id}>
									{option.name}
								</option>
							))}
						</select>
						<select
							value={status}
							onChange={(event) => {
								setStatus(event.target.value as AdminProductListingStatus);
								setPage(1);
							}}
							className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant"
						>
							{statusFilterOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="overflow-x-auto">
					{adminQuery.error ? (
						<p className="border-b border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
							{adminQuery.error instanceof Error
								? adminQuery.error.message
								: "Ürün başvuruları yüklenemedi."}
						</p>
					) : null}
					{actionError ? (
						<p className="border-b border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
							{actionError}
						</p>
					) : null}
					{actionMessage ? (
						<p className="border-b border-emerald-100 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
							{actionMessage}
						</p>
					) : null}
					{adminQuery.isLoading ? (
						<p className="border-b border-slate-100 px-6 py-4 text-sm text-on-surface-variant">
							Ürün başvuruları yükleniyor...
						</p>
					) : null}
					<table className="w-full text-left">
						<thead>
							<tr className="bg-surface-container-low">
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Firma Adı
								</th>
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Başvuru Tarihi
								</th>
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Kategori
								</th>
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Paket / Boyut
								</th>
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Lojistik
								</th>
								<th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
									Durum
								</th>
								<th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
									İşlemler
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{items.map((listing) => (
								<tr key={listing.id} className="transition-colors hover:bg-slate-50">
									<td className="px-6 py-4">
										<div className="flex items-center">
											<div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 font-bold text-primary">
												{getInitials(listing.name)}
											</div>
											<div>
												<div className="text-sm font-bold text-on-surface">{listing.name}</div>
												<div className="text-[11px] text-slate-400">{listing.sku}</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-on-surface-variant">
										{formatDate(listing.submittedAt ?? listing.updatedAt)}
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold text-on-surface-variant">
											{listing.categoryName}
										</span>
									</td>
									<td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
										{resolvePackageSummary(listing)}
									</td>
									<td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
										{listing.deliveryMethods.length > 0
											? `${listing.deliveryMethods.length} teslimat yöntemi`
											: "Belirlenmedi"}
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight ${statusClassMap[listing.status]}`}
										>
											{statusLabelMap[listing.status]}
										</span>
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end space-x-2">
											<button
												type="button"
												className="rounded-lg p-2 text-error transition-colors hover:bg-error/10 disabled:opacity-40"
												title="Reddet"
												disabled={reviewMutation.isPending}
												onClick={() => {
													void handleReject(listing.id);
												}}
											>
												<span className="material-symbols-outlined text-lg">close</span>
											</button>
											<button
												type="button"
												className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-40"
												title="Onayla"
												disabled={reviewMutation.isPending}
												onClick={() => {
													void handleApprove(listing.id);
												}}
											>
												<span className="material-symbols-outlined text-lg">check</span>
											</button>
											<button
												type="button"
												className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
												onClick={() => {
													setActionMessage(null);
													setActionError(null);
													setSelectedListingId(listing.id);
												}}
											>
												Detayları Gör
											</button>
										</div>
									</td>
								</tr>
							))}
							{items.length === 0 && !adminQuery.isLoading ? (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-sm text-on-surface-variant"
									>
										Seçilen filtrelere uygun ürün başvurusu bulunamadı.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between bg-surface-container-low p-6">
					<p className="text-xs font-medium text-on-surface-variant">
						{(() => {
							const total = data?.listings.total ?? 0;
							if (total === 0) {
								return "Henüz ürün başvurusu bulunmuyor.";
							}

							const currentPage = data?.listings.page ?? 1;
							const currentLimit = data?.listings.limit ?? LIST_LIMIT;
							const start = (currentPage - 1) * currentLimit + 1;
							const end = Math.min(currentPage * currentLimit, total);

							return `Toplam ${formatNumber(total)} ürün başvurusundan ${formatNumber(start)}-${formatNumber(end)} arası gösteriliyor`;
						})()}
					</p>
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={() => setPage((current) => Math.max(1, current - 1))}
							disabled={!canGoPrev}
							className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm disabled:opacity-50"
						>
							<span className="material-symbols-outlined text-sm">chevron_left</span>
						</button>
						<button className="rounded-lg bg-primary p-2 text-on-primary shadow-sm">
							<span className="text-xs font-bold">{data?.listings.page ?? 1}</span>
						</button>
						<button
							type="button"
							onClick={() =>
								setPage((current) =>
									Math.min(data?.listings.totalPages ?? current, current + 1),
								)
							}
							disabled={!canGoNext}
							className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm disabled:opacity-50"
						>
							<span className="material-symbols-outlined text-sm">chevron_right</span>
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm">
				<div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h3 className="text-xl font-bold text-on-surface">Kategori Bazlı Ürün Dağılımı</h3>
						<p className="text-sm text-on-surface-variant">
							Hangi kategoride kaç ürün olduğunu yüzde ve adet olarak görün.
						</p>
					</div>
					<p className="text-xs font-semibold text-on-surface-variant">
						Toplam ürün: {formatNumber(summary.totalProducts)}
					</p>
				</div>

				<div className="space-y-4">
					{distribution.map((item) => (
						<div key={item.categoryId} className="space-y-2">
							<div className="flex items-center justify-between gap-3 text-sm">
								<p className="font-semibold text-on-surface">{item.categoryName}</p>
								<p className="text-on-surface-variant">
									<span className="font-bold text-on-surface">%{item.percentage}</span>{" "}
									<span className="text-xs">({formatNumber(item.count)} ürün)</span>
								</p>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100">
								<div
									className="h-full rounded-full bg-primary"
									style={{ width: `${item.percentage}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			{selectedListingId ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
					<div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
						<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
							<h3 className="text-lg font-bold text-slate-900">Ürün Başvuru Detayı</h3>
							<button
								type="button"
								onClick={closeDetailModal}
								className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							{selectedListingQuery.isLoading ? (
								<p className="text-sm text-slate-500">Detaylar yükleniyor...</p>
							) : null}
							{selectedListingQuery.isError ? (
								<p className="text-sm text-rose-700">Detaylar yüklenemedi.</p>
							) : null}

							{editForm ? (
								<div className="space-y-6">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<label className="text-sm font-medium text-slate-700">
											Ürün Adı
											<input
												type="text"
												value={editForm.name}
												onChange={(event) =>
													setEditForm((current) =>
														current ? { ...current, name: event.target.value } : current,
													)
												}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
											/>
										</label>
										<label className="text-sm font-medium text-slate-700">
											SKU
											<input
												type="text"
												value={editForm.sku}
												onChange={(event) =>
													setEditForm((current) =>
														current ? { ...current, sku: event.target.value } : current,
													)
												}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
											/>
										</label>
									</div>

									<label className="block text-sm font-medium text-slate-700">
										Açıklama
										<textarea
											value={editForm.description}
											onChange={(event) =>
												setEditForm((current) =>
													current ? { ...current, description: event.target.value } : current,
												)
											}
											rows={5}
											className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
										/>
									</label>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<label className="text-sm font-medium text-slate-700">
											Kategori
											<select
												value={editForm.categoryId}
												onChange={(event) =>
													setEditForm((current) =>
														current ? { ...current, categoryId: event.target.value } : current,
													)
												}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
											>
												<option value="">Seçiniz</option>
												{leafCategoryOptions.map((option) => (
													<option key={option.id} value={option.id}>
														{option.name}
													</option>
												))}
											</select>
										</label>
										<label className="text-sm font-medium text-slate-700">
											Öne Çıkan Özellikler (Başlık: Açıklama)
											<textarea
												value={editForm.featuredFeatures}
												onChange={(event) =>
													setEditForm((current) =>
														current
															? { ...current, featuredFeatures: event.target.value }
															: current,
													)
												}
												rows={4}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
											/>
										</label>
									</div>

									<div className="rounded-lg border border-slate-200 p-4">
										<p className="mb-3 text-sm font-semibold text-slate-700">Sektörler</p>
										<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
											{(sectorsQuery.data ?? []).map((sector) => (
												<label key={sector.id} className="flex items-center gap-2 text-sm text-slate-700">
													<input
														type="checkbox"
														checked={editForm.sectorIds.includes(sector.id)}
														onChange={() => toggleSector(sector.id)}
													/>
													{sector.name}
												</label>
											))}
										</div>
									</div>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
											<input
												type="checkbox"
												checked={editForm.isCustomizable}
												onChange={(event) =>
													setEditForm((current) =>
														current
															? { ...current, isCustomizable: event.target.checked }
															: current,
													)
												}
											/>
											Ürün özelleştirilebilir
										</label>
										<label className="text-sm font-medium text-slate-700 md:col-span-2">
											Özelleştirme Notu
											<input
												type="text"
												value={editForm.customizationNote}
												onChange={(event) =>
													setEditForm((current) =>
														current
															? { ...current, customizationNote: event.target.value }
															: current,
													)
												}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
											/>
										</label>
									</div>

									<div className="rounded-lg border border-slate-200 p-4">
										<p className="mb-3 text-sm font-semibold text-slate-700">Fiyatlandırma ve Stok</p>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
											<label className="text-sm font-medium text-slate-700">
												Minimum Sipariş Adedi
												<input
													type="number"
													min={1}
													value={editForm.minOrderQuantity}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, minOrderQuantity: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="text-sm font-medium text-slate-700">
												Stok
												<input
													type="number"
													min={0}
													value={editForm.stock}
													onChange={(event) =>
														setEditForm((current) =>
															current ? { ...current, stock: event.target.value } : current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="text-sm font-medium text-slate-700">
												Pazarlık Eşiği
												<input
													type="number"
													min={1}
													disabled={!editForm.isNegotiationEnabled}
													value={editForm.negotiationThreshold}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, negotiationThreshold: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
												/>
											</label>
										</div>
										<label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
											<input
												type="checkbox"
												checked={editForm.isNegotiationEnabled}
												onChange={(event) =>
													setEditForm((current) =>
														current
															? { ...current, isNegotiationEnabled: event.target.checked }
															: current,
													)
												}
											/>
											Pazarlık Aktif
										</label>
									</div>

									<div className="rounded-lg border border-slate-200 p-4">
										<div className="mb-3 flex items-center justify-between">
											<p className="text-sm font-semibold text-slate-700">Fiyat Kademeleri</p>
											<button
												type="button"
												onClick={addPricingTier}
												className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
											>
												Kademe Ekle
											</button>
										</div>
										<div className="space-y-2">
											{editForm.pricingTiers.map((tier, index) => (
												<div key={`${index.toString()}-tier`} className="grid grid-cols-1 gap-2 md:grid-cols-4">
													<input
														type="number"
														min={1}
														placeholder="Min"
														value={tier.minQuantity}
														onChange={(event) =>
															updatePricingTier(index, "minQuantity", event.target.value)
														}
														className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
													/>
													<input
														type="number"
														min={1}
														placeholder="Max"
														value={tier.maxQuantity}
														onChange={(event) =>
															updatePricingTier(index, "maxQuantity", event.target.value)
														}
														className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
													/>
													<input
														type="number"
														min={0.01}
														step="0.01"
														placeholder="Birim Fiyat"
														value={tier.unitPrice}
														onChange={(event) =>
															updatePricingTier(index, "unitPrice", event.target.value)
														}
														className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
													/>
													<button
														type="button"
														onClick={() => removePricingTier(index)}
														className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700"
													>
														Sil
													</button>
												</div>
											))}
										</div>
									</div>

									<div className="rounded-lg border border-slate-200 p-4">
										<p className="mb-3 text-sm font-semibold text-slate-700">Lojistik Bilgileri</p>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<label className="text-sm font-medium text-slate-700">
												Paket Tipi
												<select
													value={editForm.packageType}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? {
																		...current,
																		packageType: event.target.value as ProductListingPackageType,
																	}
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												>
													{productListingPackageTypeValues.map((value) => (
														<option key={value} value={value}>
															{packageTypeLabelMap[value]}
														</option>
													))}
												</select>
											</label>
											<label className="text-sm font-medium text-slate-700">
												Kargoya Verilme Süresi
												<select
													value={editForm.shippingTime}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? {
																		...current,
																		shippingTime: event.target.value as ProductListingShippingTime,
																	}
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												>
													{productListingShippingTimeValues.map((value) => (
														<option key={value} value={value}>
															{shippingTimeLabelMap[value]}
														</option>
													))}
												</select>
											</label>
										</div>
										<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
											<label className="text-sm font-medium text-slate-700">
												Tedarik Süresi (Gün)
												<input
													type="number"
													min={0}
													value={editForm.leadTimeDays}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, leadTimeDays: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="text-sm font-medium text-slate-700">
												En (cm)
												<input
													type="number"
													step="0.01"
													value={editForm.packageLengthCm}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, packageLengthCm: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="text-sm font-medium text-slate-700">
												Boy (cm)
												<input
													type="number"
													step="0.01"
													value={editForm.packageWidthCm}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, packageWidthCm: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="text-sm font-medium text-slate-700">
												Yükseklik (cm)
												<input
													type="number"
													step="0.01"
													value={editForm.packageHeightCm}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, packageHeightCm: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
										</div>
										<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
											<label className="text-sm font-medium text-slate-700">
												Paket Ağırlığı (kg)
												<input
													type="number"
													step="0.001"
													value={editForm.packageWeightKg}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? { ...current, packageWeightKg: event.target.value }
																: current,
														)
													}
													className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
											<label className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700">
												<input
													type="checkbox"
													checked={editForm.dynamicFreightAgreement}
													onChange={(event) =>
														setEditForm((current) =>
															current
																? {
																		...current,
																		dynamicFreightAgreement: event.target.checked,
																	}
																: current,
														)
													}
												/>
												Dinamik navlun anlaşması aktif
											</label>
										</div>
										<div className="mt-4 rounded-lg border border-slate-200 p-3">
											<p className="mb-2 text-sm font-semibold text-slate-700">Teslimat Yöntemleri</p>
											<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
												{productListingDeliveryMethodValues.map((method) => (
													<label key={method} className="flex items-center gap-2 text-sm text-slate-700">
														<input
															type="checkbox"
															checked={editForm.deliveryMethods.includes(method)}
															onChange={() => toggleDeliveryMethod(method)}
														/>
														{deliveryMethodLabelMap[method]}
													</label>
												))}
											</div>
										</div>
									</div>
								</div>
							) : null}
						</div>

						<div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={selectedListingQuery.isLoading || reviewMutation.isPending}
									onClick={() => {
										if (selectedListingId) {
											void handleApprove(selectedListingId);
										}
									}}
									className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
								>
									Onayla
								</button>
								<button
									type="button"
									disabled={selectedListingQuery.isLoading || reviewMutation.isPending}
									onClick={() => {
										if (selectedListingId) {
											void handleReject(selectedListingId);
										}
									}}
									className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
								>
									Reddet
								</button>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={closeDetailModal}
									className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
								>
									Kapat
								</button>
								<button
									type="button"
									disabled={!editForm || saveMutation.isPending || selectedListingQuery.isLoading}
									onClick={() => {
										if (selectedListingId && editForm) {
											void saveMutation.mutateAsync({ id: selectedListingId, form: editForm });
										}
									}}
									className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
								>
									Kaydet
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
