"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { requestJson } from "@/lib/api";

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
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const profileMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const savedState = localStorage.getItem("admin-sidebar-collapsed");
		setIsSidebarCollapsed(savedState === "true");
	}, []);

	useEffect(() => {
		const payload = parseJwtPayload(getAccessToken());
		if (payload?.role !== "ADMIN") {
			router.replace("/login");
			return;
		}

		setIsAuthorized(true);
	}, [router]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!profileMenuRef.current) {
				return;
			}

			const target = event.target as Node;
			if (!profileMenuRef.current.contains(target)) {
				setIsProfileMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

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
		setIsSidebarCollapsed((prev) => {
			const nextState = !prev;
			localStorage.setItem("admin-sidebar-collapsed", String(nextState));
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

	const desktopOffsetClass = isSidebarCollapsed ? "lg:left-24" : "lg:left-[19rem]";
	const desktopMainPaddingClass = isSidebarCollapsed ? "lg:pl-24" : "lg:pl-[19rem]";

	const handleLogout = async () => {
		try {
			await requestJson<{ loggedOut: boolean }, undefined>("/auth/logout", {
				method: "POST",
			});
		} catch {
			// Token cleanup is enough for immediate logout UX.
		}

		clearAccessToken();
		setIsProfileMenuOpen(false);
		router.replace("/login");
		router.refresh();
	};

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
				className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 transition-all duration-300 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
			>
				<div className="p-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-slate-900">
							<span className="material-symbols-outlined font-semibold">hub</span>
						</div>
						{!isSidebarCollapsed ? (
							<div>
								<h1 className="text-xl font-bold tracking-tight text-white">ToptanNext</h1>
								<p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
									Yönetici Paneli
								</p>
							</div>
						) : null}
					</div>
				</div>

				<nav className="flex-1 space-y-1 px-3 py-2">
					{navItems.map((item) => {
						const isActive = item.key === activeNav;
						return (
							<Link
								key={item.key}
								className={
									isActive
										? `flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} rounded-xl border border-sky-300/25 bg-sky-400/15 px-4 py-3 font-semibold text-sky-200 transition-all duration-200 ease-in-out`
										: `flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} rounded-xl px-4 py-3 text-slate-300 transition-colors hover:bg-white/5 hover:text-white`
								}
								href={item.href}
								onClick={closeMobileSidebar}
								title={item.label}
							>
								<span className="material-symbols-outlined">{item.icon}</span>
								{!isSidebarCollapsed ? <span className="text-sm">{item.label}</span> : null}
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
						title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
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
					<button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100">
						<span className="material-symbols-outlined text-[20px]">notifications</span>
					</button>

					<div className="relative" ref={profileMenuRef}>
						<button
							className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
							onClick={() => setIsProfileMenuOpen((prev) => !prev)}
							type="button"
						>
							<span className="material-symbols-outlined text-[20px]">account_circle</span>
						</button>

						{isProfileMenuOpen ? (
							<div className="absolute right-0 top-12 z-50 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
								<button
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
									onClick={handleLogout}
									type="button"
								>
									<span className="material-symbols-outlined text-[18px]">logout</span>
									Çıkış Yap
								</button>
							</div>
						) : null}
					</div>
				</div>
			</header>

			<main
				className={`px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 ${desktopMainPaddingClass}`}
			>
				{children}
			</main>
		</div>
	);
}
