import { AddressRecord } from '@/features/addresses/api/addresses.api';

interface AddressCardProps {
  address: AddressRecord;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

export default function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isLoading,
}: AddressCardProps) {
  return (
    <div className="h-[257px]">
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className={`h-[218px] w-full overflow-hidden rounded-lg border-2 p-5 text-left transition ${
          isSelected
            ? 'border-blue-700 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 text-blue-700">
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="truncate text-base font-bold">{address.title || 'Adres'}</span>
          </div>

          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            {isSelected ? (
              <span className="material-symbols-outlined text-[28px] leading-none text-blue-700">
                check_circle
              </span>
            ) : (
              <span className="h-7 w-7 rounded-full border-2 border-slate-300" />
            )}
          </span>
        </div>

        <div className="space-y-1 pl-7 text-sm leading-6 text-slate-600">
          <p className="truncate text-base font-semibold text-slate-900">{address.fullName}</p>
          <p className="truncate">{address.address}</p>
          <p className="truncate">
            {address.neighborhood} / {address.district} / {address.province}
          </p>
          {address.postalCode ? <p className="truncate">{address.postalCode}</p> : null}
          <p className="flex items-center gap-2 truncate pt-1">
            <span className="material-symbols-outlined shrink-0 text-base">phone</span>
            <span className="truncate">{address.phoneNumber}</span>
          </p>
        </div>
      </button>

      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onEdit}
          disabled={isLoading}
          className="font-semibold text-blue-700 transition hover:text-blue-800 disabled:opacity-50"
        >
          Düzenle
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={isLoading}
          className="font-semibold text-slate-600 transition hover:text-red-600 disabled:opacity-50"
        >
          Kaldır
        </button>
      </div>
    </div>
  );
}
