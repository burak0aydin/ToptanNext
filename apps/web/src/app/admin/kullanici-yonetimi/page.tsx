"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api";
import { AdminPageHeader } from "../_components/AdminPageHeader";

type AdminGrowthPeriod = "DAILY" | "WEEKLY" | "MONTHLY";
type AdminRoleFilter = "ALL" | "ADMIN" | "SUPPLIER" | "BUYER";
type AdminStatusFilter = "ALL" | "ACTIVE" | "BANNED";

type AdminUserItem = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "ADMIN" | "SUPPLIER" | "BUYER";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminUserManagementResponse = {
  summary: {
    totalUsers: number;
    growthRatePercent: number;
  };
  growth: {
    period: AdminGrowthPeriod;
    labels: string[];
    values: number[];
  };
  users: {
    items: AdminUserItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type AdminUserFilters = {
  search: string;
  role: AdminRoleFilter;
  status: AdminStatusFilter;
};

type AdminUserDetail = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  role: "ADMIN" | "SUPPLIER" | "BUYER";
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function getDisplayName(user: AdminUserItem | AdminUserDetail): string {
  const fullName = user.fullName?.trim();
  if (fullName && fullName.length > 0) {
    return fullName;
  }

  const combined = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (combined.length > 0) {
    return combined;
  }

  return user.email.split("@")[0] || "Kullanıcı";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getRoleLabel(role: AdminUserItem["role"]): string {
  if (role === "ADMIN") {
    return "Admin";
  }

  if (role === "SUPPLIER") {
    return "Satıcı";
  }

  return "Alıcı";
}

function getRoleClassName(role: AdminUserItem["role"]): string {
  if (role === "ADMIN") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (role === "SUPPLIER") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getGrowthBarHeightPercent(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) {
    return 8;
  }

  return Math.max(8, Math.round((value / maxValue) * 100));
}

async function fetchAdminUserManagement(params: {
  page: number;
  limit: number;
  period: AdminGrowthPeriod;
  search: string;
  role: AdminRoleFilter;
  status: AdminStatusFilter;
}): Promise<AdminUserManagementResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(params.page));
  queryParams.set("limit", String(params.limit));
  queryParams.set("period", params.period);

  if (params.search.trim().length > 0) {
    queryParams.set("search", params.search.trim());
  }

  if (params.role !== "ALL") {
    queryParams.set("role", params.role);
  }

  if (params.status !== "ALL") {
    queryParams.set("status", params.status);
  }

  return requestJson<AdminUserManagementResponse>(
    `/users/admin/management?${queryParams.toString()}`,
    {
      auth: true,
    },
  );
}

async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return requestJson<AdminUserDetail>(`/users/admin/${userId}`, {
    auth: true,
  });
}

async function updateAdminUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<AdminUserDetail> {
  return requestJson<AdminUserDetail, { isActive: boolean }>(
    `/users/admin/${userId}/active`,
    {
      method: "PATCH",
      auth: true,
      body: { isActive },
    },
  );
}

export default function AdminUserManagementPage() {
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<AdminGrowthPeriod>("DAILY");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<AdminUserFilters>({
    search: "",
    role: "ALL",
    status: "ALL",
  });

  const [appliedFilters, setAppliedFilters] = useState<AdminUserFilters>({
    search: "",
    role: "ALL",
    status: "ALL",
  });

  const managementQuery = useQuery({
    queryKey: ["admin", "user-management", page, limit, period, appliedFilters],
    queryFn: () =>
      fetchAdminUserManagement({
        page,
        limit,
        period,
        search: appliedFilters.search,
        role: appliedFilters.role,
        status: appliedFilters.status,
      }),
  });

  const selectedUserQuery = useQuery({
    queryKey: ["admin", "user-management", "detail", selectedUserId],
    queryFn: () => fetchAdminUserDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
  });

  const activeStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserActiveStatus(userId, isActive),
    onSuccess: async (_, variables) => {
      setActionError(null);

      await queryClient.invalidateQueries({
        queryKey: ["admin", "user-management"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin", "user-management", "detail", variables.userId],
      });
    },
    onError: (error) => {
      setActionError(
        error instanceof Error
          ? error.message
          : "Kullanıcı durumu güncellenirken bir hata oluştu.",
      );
    },
  });

  const growthMaxValue = useMemo(() => {
    const values = managementQuery.data?.growth.values ?? [];
    return values.length > 0 ? Math.max(...values) : 0;
  }, [managementQuery.data]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const initialFilters: AdminUserFilters = {
      search: "",
      role: "ALL",
      status: "ALL",
    };
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleStatusToggle = async (user: AdminUserItem) => {
    const nextIsActive = !user.isActive;
    const confirmationMessage = nextIsActive
      ? "Bu kullanıcı için banı kaldırmak istiyor musunuz?"
      : "Bu kullanıcıyı banlamak istiyor musunuz?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    await activeStatusMutation.mutateAsync({
      userId: user.id,
      isActive: nextIsActive,
    });
  };

  const users = managementQuery.data?.users.items ?? [];
  const usersMeta = managementQuery.data?.users;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        actions={
          <button
            className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrele
          </button>
        }
        description="Platforma kayıtlı kullanıcıları ve rollerini yönetin."
        title="Kullanıcı Yönetimi"
      />

      {isFilterOpen ? (
        <section className="rounded-xl border border-outline-variant/20 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Arama
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                placeholder="Ad, soyad veya e-posta"
                value={draftFilters.search}
                onChange={(event) =>
                  setDraftFilters((prev) => ({ ...prev, search: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Rol
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                value={draftFilters.role}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    role: event.target.value as AdminRoleFilter,
                  }))
                }
              >
                <option value="ALL">Tümü</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPPLIER">Satıcı</option>
                <option value="BUYER">Alıcı</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Durum
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: event.target.value as AdminStatusFilter,
                  }))
                }
              >
                <option value="ALL">Tümü</option>
                <option value="ACTIVE">Aktif</option>
                <option value="BANNED">Banlı</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              onClick={handleResetFilters}
              type="button"
            >
              Sıfırla
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
              onClick={handleApplyFilters}
              type="button"
            >
              Uygula
            </button>
          </div>
        </section>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                groups
              </span>
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Toplam Kullanıcı Sayısı
            </p>
            <h3 className="mt-2 text-4xl font-extrabold tracking-tight text-on-surface">
              {formatNumber(managementQuery.data?.summary.totalUsers ?? 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span
              className={`flex items-center font-bold ${
                (managementQuery.data?.summary.growthRatePercent ?? 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {(managementQuery.data?.summary.growthRatePercent ?? 0) >= 0
                  ? "trending_up"
                  : "trending_down"}
              </span>
              {Math.abs(managementQuery.data?.summary.growthRatePercent ?? 0).toFixed(1)}%
            </span>
            <span className="italic text-on-surface-variant">Önceki döneme göre</span>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-on-surface">Kullanıcı Artış Analizi</h4>
            <div className="flex rounded-lg bg-surface-container p-1">
              {([
                ["DAILY", "Günlük"],
                ["WEEKLY", "Haftalık"],
                ["MONTHLY", "Aylık"],
              ] as Array<[AdminGrowthPeriod, string]>).map(([value, label]) => (
                <button
                  key={value}
                  className={
                    period === value
                      ? "rounded-md bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm transition-all"
                      : "px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
                  }
                  onClick={() => setPeriod(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {managementQuery.isLoading ? (
            <p className="text-sm text-slate-500">Grafik verileri yükleniyor...</p>
          ) : null}

          {managementQuery.isError ? (
            <p className="text-sm text-rose-700">Grafik verileri alınamadı.</p>
          ) : null}

          {!managementQuery.isLoading && !managementQuery.isError ? (
            <div className="flex h-48 items-end justify-between gap-3">
              {(managementQuery.data?.growth.labels ?? []).map((label, index) => {
                const value = managementQuery.data?.growth.values[index] ?? 0;
                const isActiveBar = value === growthMaxValue && value > 0;
                const barHeightPercent = getGrowthBarHeightPercent(value, growthMaxValue);

                return (
                  <div
                    key={`${label}-${index}`}
                    className="group relative flex flex-1 flex-col items-center"
                    title={`${label}: ${value}`}
                  >
                    <div
                      style={{ height: `${barHeightPercent}%` }}
                      className={
                        isActiveBar
                          ? "w-full rounded-t-lg bg-primary-container transition-all"
                          : "w-full rounded-t-lg bg-primary-fixed transition-all hover:bg-primary-container"
                      }
                    />
                    <span
                      className={
                        isActiveBar
                          ? "mt-2 text-[10px] font-bold text-primary"
                          : "mt-2 text-[10px] font-semibold text-on-surface-variant"
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-6 py-4">
          <h4 className="font-bold text-on-surface">Son Kayıtlı Kullanıcılar</h4>
          <button
            className="flex items-center gap-2 text-xs font-bold text-primary transition-all hover:underline"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrele
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Kullanıcı
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  E-posta Adresi
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Rol
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Durum
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  İşlemler
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-container">
              {managementQuery.isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={6}>
                    Kullanıcı listesi yükleniyor...
                  </td>
                </tr>
              ) : null}

              {managementQuery.isError ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-rose-700" colSpan={6}>
                    Kullanıcı listesi alınamadı.
                  </td>
                </tr>
              ) : null}

              {!managementQuery.isLoading && !managementQuery.isError && users.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-slate-500" colSpan={6}>
                    Filtreye uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : null}

              {users.map((user) => {
                const displayName = getDisplayName(user);
                const initials = getInitials(displayName);

                return (
                  <tr key={user.id} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{displayName}</p>
                          <p className="text-[10px] font-medium text-on-surface-variant">
                            ID: #{user.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-on-surface-variant">{user.email}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${getRoleClassName(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Banlı"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <button
                          className="flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-blue-900"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setActionError(null);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Görüntüle
                        </button>

                        {user.role !== "ADMIN" ? (
                          <button
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                              user.isActive
                                ? "text-error hover:text-red-800"
                                : "text-emerald-700 hover:text-emerald-800"
                            }`}
                            onClick={() => void handleStatusToggle(user)}
                            disabled={activeStatusMutation.isPending}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {user.isActive ? "block" : "verified"}
                            </span>
                            {user.isActive ? "Banla" : "Ban Kaldır"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container px-6 py-4 text-xs font-semibold text-on-surface-variant">
          <span>
            Toplam {formatNumber(usersMeta?.total ?? 0)} kullanıcıdan {formatNumber(users.length)}
            {" "}tanesi gösteriliyor
          </span>

          <div className="flex items-center gap-2">
            <button
              className="rounded p-1 transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              disabled={(usersMeta?.page ?? 1) <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            <span className="rounded bg-primary px-3 py-1 text-white">
              {usersMeta?.page ?? 1}
            </span>

            <button
              className="rounded p-1 transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              disabled={(usersMeta?.page ?? 1) >= (usersMeta?.totalPages ?? 1)}
              onClick={() =>
                setPage((prev) =>
                  Math.min(usersMeta?.totalPages ?? prev, prev + 1),
                )
              }
              type="button"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {selectedUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Kullanıcı Detayı</h3>
              <button
                className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100"
                onClick={() => setSelectedUserId(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {selectedUserQuery.isLoading ? (
              <p className="text-sm text-slate-500">Kullanıcı bilgileri yükleniyor...</p>
            ) : null}

            {selectedUserQuery.isError ? (
              <p className="text-sm text-rose-700">Kullanıcı detayı alınamadı.</p>
            ) : null}

            {selectedUserQuery.data ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Ad Soyad</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {getDisplayName(selectedUserQuery.data)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">E-posta</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {selectedUserQuery.data.email}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Telefon</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {selectedUserQuery.data.phoneNumber ?? "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Rol</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {getRoleLabel(selectedUserQuery.data.role)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Durum</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {selectedUserQuery.data.isActive ? "Aktif" : "Banlı"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Doğrulama</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {selectedUserQuery.data.isVerified ? "Doğrulandı" : "Doğrulanmadı"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Kayıt Tarihi</dt>
                  <dd className="font-semibold text-slate-800 text-right">
                    {formatDate(selectedUserQuery.data.createdAt)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
