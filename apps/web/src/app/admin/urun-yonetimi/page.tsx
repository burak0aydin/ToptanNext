import { AdminPageHeader } from "../_components/AdminPageHeader";

type ProductApplication = {
	initials: string;
	initialsClassName: string;
	companyName: string;
	email: string;
	applicationDate: string;
	category: string;
};

const productGrowthBars = [
	{ label: "Pzt", value: 45, heightClassName: "h-[45%]", isActive: false },
	{ label: "Sal", value: 65, heightClassName: "h-[65%]", isActive: false },
	{ label: "Çar", value: 85, heightClassName: "h-[85%]", isActive: true },
	{ label: "Per", value: 55, heightClassName: "h-[55%]", isActive: false },
	{ label: "Cum", value: 70, heightClassName: "h-[70%]", isActive: false },
	{ label: "Cmt", value: 30, heightClassName: "h-[30%]", isActive: false },
	{ label: "Paz", value: 25, heightClassName: "h-[25%]", isActive: false },
] as const;

const productApplications: ProductApplication[] = [
	{
		initials: "AT",
		initialsClassName: "bg-blue-50 text-primary",
		companyName: "Alp Teknoloji A.Ş.",
		email: "alp_tek@info.com",
		applicationDate: "12.10.2023",
		category: "Giyim ve Aksesuar",
	},
	{
		initials: "GÜ",
		initialsClassName: "bg-orange-50 text-orange-700",
		companyName: "Global Üretim Ltd.",
		email: "global@uret.tr",
		applicationDate: "11.10.2023",
		category: "Ev, Yaşam ve Bahçe",
	},
	{
		initials: "ÖL",
		initialsClassName: "bg-green-50 text-green-700",
		companyName: "Öz Lojistik Market",
		email: "oz@market.com",
		applicationDate: "10.10.2023",
		category: "Ambalaj Baskı",
	},
	{
		initials: "MK",
		initialsClassName: "bg-purple-50 text-purple-700",
		companyName: "Moda Kimya",
		email: "moda@kimya.com",
		applicationDate: "09.10.2023",
		category: "Giyim Ve Aksesuar",
	},
];

const categoryDistribution = [
	{ name: "Giyim ve Aksesuar", percentage: 34, count: 4_244 },
	{ name: "Ev, Yaşam ve Bahçe", percentage: 26, count: 3_246 },
	{ name: "Ambalaj ve Baskı", percentage: 18, count: 2_246 },
	{ name: "Elektronik", percentage: 13, count: 1_622 },
	{ name: "Diğer", percentage: 9, count: 1_124 },
] as const;

export default function AdminProductManagementPage() {
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
						<h3 className="mt-1 text-3xl font-bold tracking-tight text-primary">12,482</h3>
						<p className="mt-2 flex items-center text-xs font-semibold text-green-600">
							<span className="material-symbols-outlined mr-1 text-sm">trending_up</span>
							Geçen aya göre +4.2%
						</p>
					</div>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
						<span className="material-symbols-outlined text-3xl">storefront</span>
					</div>
				</div>

				<div className="group flex cursor-default items-center justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
					<div>
						<p className="text-sm font-medium text-on-surface-variant">Bekleyen Ürün Başvuruları</p>
						<h3 className="mt-1 text-3xl font-bold tracking-tight text-secondary">142</h3>
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
							Platforma yeni katılan satıcıların zamansal dağılımı
						</p>
					</div>
					<div className="flex rounded-lg bg-surface-container-low p-1">
						<button className="rounded-md px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary">
							Günlük
						</button>
						<button className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors">
							Haftalık
						</button>
						<button className="rounded-md px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary">
							Aylık
						</button>
					</div>
				</div>

				<div className="flex h-64 items-end justify-between gap-4 px-2">
					{productGrowthBars.map((bar) => (
						<div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
							<div
								className={
									bar.isActive
										? `group relative w-full rounded-t-lg bg-primary transition-all hover:opacity-90 ${bar.heightClassName}`
										: `group relative w-full rounded-t-lg bg-primary/10 transition-all hover:bg-primary/20 ${bar.heightClassName}`
								}
							>
								<span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-inverse-surface px-2 py-1 text-[10px] text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
									{bar.value}
								</span>
							</div>
							<span
								className={
									bar.isActive
										? "text-[10px] font-bold text-primary"
										: "text-[10px] font-bold text-slate-400"
								}
							>
								{bar.label}
							</span>
						</div>
					))}
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-slate-100/50 bg-surface-container-lowest shadow-sm">
				<div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="text-xl font-bold text-on-surface">Ürün Başvuruları</h2>
					<div className="flex flex-wrap gap-2">
						<button className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-slate-50">
							Filtrele
						</button>
						<button className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-slate-50">
							Dışa Aktar
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
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
									Durum
								</th>
								<th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
									İşlemler
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{productApplications.map((application) => (
								<tr key={application.email} className="transition-colors hover:bg-slate-50">
									<td className="px-6 py-4">
										<div className="flex items-center">
											<div
												className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg font-bold ${application.initialsClassName}`}
											>
												{application.initials}
											</div>
											<div>
												<div className="text-sm font-bold text-on-surface">
													{application.companyName}
												</div>
												<div className="text-[11px] text-slate-400">{application.email}</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-on-surface-variant">
										{application.applicationDate}
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold text-on-surface-variant">
											{application.category}
										</span>
									</td>
									<td className="px-6 py-4">
										<span className="inline-flex items-center rounded-full bg-secondary-fixed px-2.5 py-1 text-[11px] font-bold uppercase tracking-tight text-on-secondary-container">
											<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
											Beklemede
										</span>
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end space-x-2">
											<button
												className="rounded-lg p-2 text-error transition-colors hover:bg-error/10"
												title="Reddet"
											>
												<span className="material-symbols-outlined text-lg">close</span>
											</button>
											<button
												className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
												title="Onayla"
											>
												<span className="material-symbols-outlined text-lg">check</span>
											</button>
											<button className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
												Detayları Gör
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between bg-surface-container-low p-6">
					<p className="text-xs font-medium text-on-surface-variant">
						Toplam 142 başvurudan 1-10 arası gösteriliyor
					</p>
					<div className="flex space-x-2">
						<button className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm disabled:opacity-50">
							<span className="material-symbols-outlined text-sm">chevron_left</span>
						</button>
						<button className="rounded-lg bg-primary p-2 text-on-primary shadow-sm">
							<span className="text-xs font-bold">1</span>
						</button>
						<button className="rounded-lg border border-slate-100 bg-white p-2 text-on-surface-variant transition-colors hover:bg-slate-50">
							<span className="text-xs font-bold">2</span>
						</button>
						<button className="rounded-lg border border-slate-100 bg-white p-2 text-on-surface-variant transition-colors hover:bg-slate-50">
							<span className="text-xs font-bold">3</span>
						</button>
						<button className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
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
					<p className="text-xs font-semibold text-on-surface-variant">Toplam ürün: 12,482</p>
				</div>

				<div className="space-y-4">
					{categoryDistribution.map((item) => (
						<div key={item.name} className="space-y-2">
							<div className="flex items-center justify-between gap-3 text-sm">
								<p className="font-semibold text-on-surface">{item.name}</p>
								<p className="text-on-surface-variant">
									<span className="font-bold text-on-surface">%{item.percentage}</span>
									 <span className="text-xs">({item.count.toLocaleString("tr-TR")} ürün)</span>
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
		</div>
	);
}
