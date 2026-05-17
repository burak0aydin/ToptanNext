"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getAccessToken } from "@/lib/auth-token";
import { PanelAccountMenu } from "@/app/components/PanelAccountMenu";

type JwtPayload = {
	role?: "ADMIN" | "SUPPLIER" | "BUYER";
};

type AdminNavKey =
	| "overview"
	| "users"
	| "supplierApplications"
	| "logisticsApplications"
	| "products"
	| "categories"
	| "messages"
	| "finance";

type AdminShellProps = { children: ReactNode };

type NavItem = {
	key: AdminNavKey;
	icon: string;
	label: string;
	href: string;
};

const navItems: NavItem[] = [
	{ key: "overview", icon: "dashboard", label: "Genel Bakış", href: "/admin" },
	{
		key: "users",
		icon: "group",
		label: "Kullanıcı Yönetimi",
		href: "/admin/kullanici-yonetimi",
	},
	{
		key: "supplierApplications",
		icon: "how_to_reg",
		label: "Satıcı Başvuruları",
		href: "/admin/satici-basvurulari",
	},
	{
		key: "logisticsApplications",
		icon: "local_shipping",
		label: "Lojistik Başvuruları",
		href: "/admin/lojistik-basvurulari",
	},
	{
		key: "products",
		icon: "inventory_2",
		label: "Ürün Yönetimi",
		href: "/admin/urun-yonetimi",
	},
	{
		key: "categories",
		icon: "category",
		label: "Kategori ve Sektörler",
		href: "/admin/kategori-ve-sektorler",
	},
	{ key: "messages", icon: "forum", label: "Mesajlar", href: "#" },
	{
		key: "finance",
		icon: "account_balance",
		label: "Finans ve Muhasebe",
		href: "/admin/finans-ve-muhasebe",
	},
];

const parseJwtPayload = (token: string | null): JwtPayload | null => {
	if (!token) {
		return null;
	}

	const parts = token.split(".");
	if (parts.length < 2) {
		return null;
	}

	try {
		const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const normalizedPayload = base64Payload.padEnd(
			Math.ceil(base64Payload.length / 4) * 4,
			"=",
		);
		const payloadJson = atob(normalizedPayload);
		return JSON.parse(payloadJson) as JwtPayload;
	} catch {
		return null;
	}
};

export function AdminShell({ children }: AdminShellProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [isSidebarHidden, setIsSidebarHidden] = useState(false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	useEffect(() => {
		const savedState = localStorage.getItem("admin-sidebar-hidden");
		setIsSidebarHidden(savedState === "true");
	}, []);

	useEffect(() => {
		const payload = parseJwtPayload(getAccessToken());
		if (payload?.role !== "ADMIN") {
			router.replace("/login");
			return;
		}

		setIsAuthorized(true);
	}, [router]);

	const activeNav = useMemo<AdminNavKey>(() => {
		if (pathname.startsWith("/admin/kullanici-yonetimi")) {
			return "users";
		}
		if (pathname.startsWith("/admin/satici-basvurulari")) {
			return "supplierApplications";
		}
		if (pathname.startsWith("/admin/lojistik-basvurulari")) {
			return "logisticsApplications";
		}
		if (pathname.startsWith("/admin/urun-yonetimi")) {
			return "products";
		}
		if (pathname.startsWith("/admin/kategori-ve-sektorler")) {
			return "categories";
		}
		if (pathname.startsWith("/admin/finans-ve-muhasebe")) {
			return "finance";
		}
		return "overview";
	}, [pathname]);

	const toggleSidebar = () => {
		setIsSidebarHidden((prev) => {
			const nextState = !prev;
			localStorage.setItem("admin-sidebar-hidden", String(nextState));
			return nextState;
		});
	};

	const handleMenuButtonClick = () => {
		if (window.matchMedia("(min-width: 1024px)").matches) {
			toggleSidebar();
			return;
		}

		setIsMobileSidebarOpen((prev) => !prev);
	};

	const closeMobileSidebar = () => {
		setIsMobileSidebarOpen(false);
	};

	const desktopOffsetClass = isSidebarHidden ? "lg:left-0" : "lg:left-64";
	const desktopMainOffsetClass = isSidebarHidden ? "lg:ml-0" : "lg:ml-64";
	const contentPaddingClass = isSidebarHidden ? "lg:px-8" : "lg:px-12";

	if (!isAuthorized) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-surface">
				<p className="text-sm font-medium text-slate-500">Yetki kontrol ediliyor...</p>
			</main>
		);
	}

	return (
		<div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
			{isMobileSidebarOpen ? (
				<button
					aria-label="Kenar menüyü kapat"
					className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden"
					onClick={closeMobileSidebar}
					type="button"
				/>
			) : null}

			<aside
				className={[
					"fixed left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 py-4 text-sm font-semibold tracking-tight text-slate-400 shadow-xl transition-all duration-300",
					isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
					isSidebarHidden ? "lg:-translate-x-full" : "lg:translate-x-0",
				].join(" ")}
			>
				<div className="px-6 pb-6 pt-2">
					<Link href="/" className="text-xl font-bold tracking-tight text-white">
						ToptanNext
					</Link>
					<p className="mt-1 text-xs text-slate-400">Yönetici Paneli</p>
				</div>

				<nav className="flex-1 space-y-1 px-2">
					{navItems.map((item) => {
						const isActive = item.key === activeNav;
						return (
							<Link
								key={item.key}
								className={
									isActive
										? "flex items-center gap-3 rounded-md bg-blue-600 px-3 py-2 text-white transition-all duration-200 active:scale-95"
										: "flex items-center gap-3 rounded-md px-3 py-2 text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white active:scale-95"
								}
								href={item.href}
								onClick={closeMobileSidebar}
								title={item.label}
							>
								<span className="material-symbols-outlined text-[22px]">{item.icon}</span>
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</aside>

			<header
				className={`fixed right-0 top-0 left-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-all duration-300 sm:px-6 ${desktopOffsetClass}`}
			>
				<div className="flex flex-1 items-center gap-4">
					<button
						className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
						onClick={handleMenuButtonClick}
						title={isSidebarHidden ? "Menüyü Göster" : "Menüyü Gizle"}
						type="button"
					>
						<span className="material-symbols-outlined text-[20px]">menu</span>
					</button>

					<div className="relative hidden w-72 max-w-full md:block">
						<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
							search
						</span>
						<input
							className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
							placeholder="Panel içerisinde ara..."
							type="text"
						/>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<PanelAccountMenu />
				</div>
			</header>

			<main
				className={`px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 ${desktopMainOffsetClass} ${contentPaddingClass}`}
			>
				{children}
			</main>
		</div>
	);
}
