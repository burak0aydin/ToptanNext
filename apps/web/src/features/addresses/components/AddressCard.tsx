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
    <div className="min-h-[170px] sm:h-[257px]">
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className={`h-[132px] w-full overflow-hidden rounded-lg border-2 p-2 text-left transition sm:h-[218px] sm:p-5 ${
          isSelected
            ? 'border-blue-700 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <div className="mb-1.5 flex items-start justify-between gap-1.5 sm:mb-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-1.5 text-blue-700 sm:gap-2">
            <span className="material-symbols-outlined text-[15px] sm:text-xl">home</span>
            <span className="truncate text-[11px] font-medium sm:text-base">{address.title || 'Adres'}</span>
          </div>

          <span className="flex h-4 w-4 shrink-0 items-center justify-center sm:h-7 sm:w-7">
            {isSelected ? (
              <span className="material-symbols-outlined text-[18px] leading-none text-blue-700 sm:text-[28px]">
                check_circle
              </span>
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 sm:h-7 sm:w-7" />
            )}
          </span>
        </div>

        <div className="space-y-0.5 pl-0 text-[10px] leading-[15px] text-slate-600 sm:space-y-1 sm:pl-7 sm:text-sm sm:leading-6">
          <p className="truncate text-[11px] font-medium text-slate-900 sm:text-base">{address.fullName}</p>
          <p className="truncate">{address.address}</p>
          <p className="truncate">
            {address.neighborhood} / {address.district} / {address.province}
          </p>
          {address.postalCode ? <p className="truncate">{address.postalCode}</p> : null}
          <p className="flex items-center gap-1.5 truncate pt-0.5 sm:gap-2 sm:pt-1">
            <span className="material-symbols-outlined shrink-0 text-[13px] sm:text-base">phone</span>
            <span className="truncate">{address.phoneNumber}</span>
          </p>
        </div>
      </button>

      <div className="mt-2 flex items-center gap-2 text-[11px] sm:mt-3 sm:gap-3 sm:text-sm">
        <button
          type="button"
          onClick={onEdit}
          disabled={isLoading}
          className="font-medium text-blue-700 transition hover:text-blue-800 disabled:opacity-50"
        >
          Düzenle
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={isLoading}
          className="font-medium text-slate-600 transition hover:text-red-600 disabled:opacity-50"
        >
          Kaldır
        </button>
      </div>
    </div>
  );
}
