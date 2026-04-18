type SummaryCard = {
	title: string;
	value: string;
	icon: string;
	iconClassName: string;
	badgeText: string;
	badgeClassName: string;
};

type DisputeItem = {
	id: string;
	title: string;
	description: string;
	amount?: string;
	metaLabel?: string;
	metaClassName?: string;
	containerClassName: string;
	iconWrapperClassName: string;
	icon: string;
	titleClassName?: string;
};

type PayoutStatus = {
	label: string;
	className: string;
};

type PayoutAction = {
	label: string;
	className: string;
};

type PayoutRow = {
	orderNo: string;
	seller: string;
	taxInfo: string;
	grossAmount: string;
	commission: string;
	posCut: string;
	netPayout: string;
	status: PayoutStatus;
	action: PayoutAction;
};

const summaryCards: SummaryCard[] = [
	{
		title: "Toplam Ciro (GMV)",
		value: "₺1,245,000.00",
		icon: "trending_up",
		iconClassName: "bg-blue-50 text-blue-600",
		badgeText: "+12.5%",
		badgeClassName: "bg-green-50 text-green-600",
	},
	{
		title: "Platform Geliri",
		value: "₺186,750.00",
		icon: "account_balance_wallet",
		iconClassName: "bg-orange-50 text-orange-600",
		badgeText: "Net Kar",
		badgeClassName: "bg-blue-50 text-blue-600",
	},
	{
		title: "Havuzdaki Bakiye",
		value: "₺412,000.00",
		icon: "layers",
		iconClassName: "bg-purple-50 text-purple-600",
		badgeText: "Beklemede",
		badgeClassName: "bg-slate-50 text-slate-400",
	},
	{
		title: "Ödenecek Hakedişler",
		value: "₺154,200.00",
		icon: "outbox",
		iconClassName: "bg-red-50 text-red-600",
		badgeText: "Bu Hafta",
		badgeClassName: "bg-red-50 text-red-600",
	},
];

const barChartData = [
	{ day: "Paz", height: "h-[40%]", value: "₺12.4k" },
	{ day: "Pzt", height: "h-[65%]", value: "₺18.2k" },
	{ day: "Sal", height: "h-[45%]", value: "" },
	{ day: "Çar", height: "h-[85%]", value: "" },
	{ day: "Per", height: "h-[95%]", value: "" },
	{ day: "Cum", height: "h-[70%]", value: "" },
	{ day: "Cmt", height: "h-[55%]", value: "" },
] as const;

const disputeItems: DisputeItem[] = [
	{
		id: "TR-8842",
		title: "#TR-8842 Uyuşmazlık",
		description: "Alıcı kusurlu ürün bildirdi. Beklemede.",
		amount: "₺2,450.00",
		metaLabel: "Detayı Gör",
		metaClassName: "text-blue-600",
		containerClassName: "border border-red-100 bg-red-50/30",
		iconWrapperClassName: "bg-red-100 text-red-600",
		icon: "assignment_return",
	},
	{
		id: "TR-9011",
		title: "#TR-9011 İade Onaylandı",
		description: "Satıcı iadeyi kabul etti. Geri ödeme yapılıyor.",
		amount: "₺1,120.00",
		metaLabel: "İşleniyor",
		metaClassName: "text-green-600 italic",
		containerClassName: "border border-slate-100 bg-white",
		iconWrapperClassName: "bg-slate-100 text-slate-600",
		icon: "undo",
	},
	{
		id: "TR-8722",
		title: "#TR-8722 Çözüldü",
		description: "İade süreci tamamlandı ve bakiye düşüldü.",
		containerClassName: "border border-slate-100 bg-white opacity-70",
		iconWrapperClassName: "bg-slate-100 text-slate-400",
		icon: "check_circle",
		titleClassName: "line-through text-slate-400",
	},
];

const payoutRows: PayoutRow[] = [
	{
		orderNo: "#TN-45920",
		seller: "Teknoloji Dünyası A.Ş.",
		taxInfo: "VKN: 9988776655 | TR98 0000...",
		grossAmount: "₺12,500.00",
		commission: "-₺1,875.00",
		posCut: "-₺312.50",
		netPayout: "₺10,312.50",
		status: {
			label: "Ödendi",
			className: "bg-green-50 text-green-700",
		},
		action: {
			label: "Detay",
			className: "text-blue-700 hover:bg-blue-50",
		},
	},
	{
		orderNo: "#TN-45921",
		seller: "Moda Lojistik Ltd.",
		taxInfo: "VKN: 1122334455 | TR12 0000...",
		grossAmount: "₺45,000.00",
		commission: "-₺6,750.00",
		posCut: "-₺1,125.00",
		netPayout: "₺37,125.00",
		status: {
			label: "Ödemeye Hazır",
			className: "bg-blue-50 text-blue-700",
		},
		action: {
			label: "Onayla",
			className: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm",
		},
	},
	{
		orderNo: "#TN-45922",
		seller: "Gıda Market Pazarlama",
		taxInfo: "VKN: 5544332211 | TR55 0000...",
		grossAmount: "₺8,200.00",
		commission: "-₺1,230.00",
		posCut: "-₺205.00",
		netPayout: "₺6,765.00",
		status: {
			label: "Beklemede",
			className: "bg-slate-100 text-slate-500",
		},
		action: {
			label: "Detay",
			className: "text-blue-700 hover:bg-blue-50",
		},
	},
	{
		orderNo: "#TN-45923",
		seller: "Yapı Malzeme Tedarik",
		taxInfo: "VKN: 6677889900 | TR66 0000...",
		grossAmount: "₺122,000.00",
		commission: "-₺18,300.00",
		posCut: "-₺3,050.00",
		netPayout: "₺100,650.00",
		status: {
			label: "Ödemeye Hazır",
			className: "bg-blue-50 text-blue-700",
		},
		action: {
			label: "Onayla",
			className: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm",
		},
	},
];

export default function AdminFinanceAccountingPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-end justify-between">
				<div>
					<h2 className="text-2xl font-bold text-on-surface">Finans ve Muhasebe</h2>
					<p className="mt-1 text-on-surface-variant">
						Platformun finansal sağlığını ve hakediş süreçlerini buradan yönetin.
					</p>
				</div>
				<div className="flex gap-3">
					<button
						className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container"
						type="button"
					>
						<span className="material-symbols-outlined text-lg">download</span>
						Dışa Aktar (.XLSX)
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{summaryCards.map((card) => (
					<div
						key={card.title}
						className="flex flex-col justify-between rounded-xl border border-slate-100 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div className="flex items-start justify-between">
							<div
								className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.iconClassName}`}
							>
								<span className="material-symbols-outlined">{card.icon}</span>
							</div>
							<span className={`rounded px-2 py-1 text-xs font-bold ${card.badgeClassName}`}>
								{card.badgeText}
							</span>
						</div>
						<div className="mt-4">
							<p className="text-sm font-medium uppercase tracking-wider text-slate-500">
								{card.title}
							</p>
							<h3 className="mt-1 text-2xl font-extrabold text-slate-900">{card.value}</h3>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<h4 className="text-lg font-bold">Komisyon Kar Analizi</h4>
							<p className="text-sm text-slate-500">
								Platform komisyon gelirlerinin zamana göre dağılımı
							</p>
						</div>
						<div className="flex rounded-lg bg-slate-100 p-1">
							<button
								className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm"
								type="button"
							>
								Günlük
							</button>
							<button
								className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
								type="button"
							>
								Haftalık
							</button>
							<button
								className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
								type="button"
							>
								Aylık
							</button>
						</div>
					</div>

					<div className="flex h-64 items-end gap-4 px-2">
						{barChartData.map((bar, index) => (
							<div
								key={bar.day}
								className={`group relative flex-1 rounded-t-lg transition-colors ${bar.height} ${index === 4 ? "bg-blue-600" : "bg-blue-100 hover:bg-blue-600"}`}
							>
								{bar.value.length > 0 ? (
									<span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
										{bar.value}
									</span>
								) : null}
							</div>
						))}
					</div>
					<div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase text-slate-400">
						{barChartData.map((bar) => (
							<span key={bar.day}>{bar.day}</span>
						))}
					</div>
				</div>

				<div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-6 shadow-sm">
					<h4 className="mb-6 text-lg font-bold">İptal ve İade Takibi</h4>
					<div className="space-y-4">
						{disputeItems.map((item) => (
							<div key={item.id} className={`flex gap-4 rounded-xl p-4 ${item.containerClassName}`}>
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconWrapperClassName}`}
								>
									<span className="material-symbols-outlined text-xl">{item.icon}</span>
								</div>
								<div>
									<p
										className={`text-sm font-bold text-slate-900 ${item.titleClassName ?? ""}`}
									>
										{item.title}
									</p>
									<p className="mt-1 text-xs text-slate-500">{item.description}</p>
									{item.amount ? (
										<div className="mt-2 flex items-center gap-2">
											<span className="text-xs font-bold text-slate-700">{item.amount}</span>
											<span className="h-1 w-1 rounded-full bg-slate-300" />
											<span
												className={`text-xs font-bold ${item.metaClassName ?? "text-slate-500"}`}
											>
												{item.metaLabel}
											</span>
										</div>
									) : null}
								</div>
							</div>
						))}
					</div>

					<button
						className="mt-6 w-full rounded-xl border border-blue-100 py-2.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
						type="button"
					>
						Tüm Uyuşmazlıkları Gör
					</button>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm">
				<div className="flex items-center justify-between border-b border-slate-50 p-6">
					<div>
						<h4 className="text-lg font-bold">Hakediş Yönetimi ve İşlem Geçmişi</h4>
						<p className="text-sm text-slate-500">
							Satıcılara yapılacak net ödemeler ve platform kesintileri
						</p>
					</div>
					<div className="flex gap-2">
						<button
							className="rounded-lg border p-2 transition-colors hover:bg-slate-50"
							type="button"
						>
							<span className="material-symbols-outlined text-slate-500">filter_list</span>
						</button>
						<button
							className="rounded-lg border p-2 transition-colors hover:bg-slate-50"
							type="button"
						>
							<span className="material-symbols-outlined text-slate-500">sort</span>
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
								<th className="px-6 py-4">Sipariş No</th>
								<th className="px-6 py-4">Satıcı ve Vergi Bilgisi</th>
								<th className="px-6 py-4">Brüt Tutar</th>
								<th className="px-6 py-4">Komisyon (%15)</th>
								<th className="px-6 py-4">POS Kesintisi</th>
								<th className="px-6 py-4">Net Hakediş</th>
								<th className="px-6 py-4">Durum</th>
								<th className="px-6 py-4 text-right">İşlem</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{payoutRows.map((row) => (
								<tr key={row.orderNo} className="transition-colors hover:bg-slate-50/50">
									<td className="px-6 py-5 font-bold text-blue-700">{row.orderNo}</td>
									<td className="px-6 py-5">
										<div className="flex flex-col">
											<span className="text-sm font-bold">{row.seller}</span>
											<span className="text-[10px] text-slate-400">{row.taxInfo}</span>
										</div>
									</td>
									<td className="px-6 py-5 text-sm font-medium">{row.grossAmount}</td>
									<td className="px-6 py-5 text-sm text-red-600">{row.commission}</td>
									<td className="px-6 py-5 text-sm text-red-400">{row.posCut}</td>
									<td className="px-6 py-5 text-sm font-bold text-slate-900">{row.netPayout}</td>
									<td className="px-6 py-5">
										<span
											className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${row.status.className}`}
										>
											{row.status.label}
										</span>
									</td>
									<td className="px-6 py-5 text-right">
										<button
											className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${row.action.className}`}
											type="button"
										>
											{row.action.label}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between bg-slate-50/50 p-6 text-sm">
					<p className="font-medium text-slate-500">
						Toplam 2,450 kayıttan 1-4 arası gösteriliyor
					</p>
					<div className="flex gap-1">
						<button
							className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-slate-100"
							type="button"
						>
							<span className="material-symbols-outlined text-sm">chevron_left</span>
						</button>
						<button
							className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white"
							type="button"
						>
							1
						</button>
						<button
							className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
							type="button"
						>
							2
						</button>
						<button
							className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
							type="button"
						>
							3
						</button>
						<button
							className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-slate-100"
							type="button"
						>
							<span className="material-symbols-outlined text-sm">chevron_right</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
