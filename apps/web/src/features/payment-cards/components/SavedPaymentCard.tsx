import { PaymentCardRecord } from '@/features/payment-cards/api/payment-cards.api';

interface SavedPaymentCardProps {
  card: PaymentCardRecord;
  onSelect: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  selectableOnly?: boolean;
  onEdit?: () => void;
}

export default function SavedPaymentCard({
  card,
  onSelect,
  onDelete,
  onEdit,
  isLoading = false,
  selectableOnly = false,
}: SavedPaymentCardProps) {
  const expiry = `${card.expiryMonth}/${card.expiryYear}`;

  return (
    <div className={selectableOnly ? 'min-h-[132px] sm:h-[218px]' : 'min-h-[170px] sm:h-[257px]'}>
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className={`h-[132px] w-full overflow-hidden rounded-lg border-2 p-2 text-left transition sm:h-[218px] sm:p-5 ${
          card.isSelected
            ? 'border-blue-700 bg-blue-50'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <div className="mb-1.5 flex items-start justify-between gap-1.5 sm:mb-4 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-blue-700 sm:text-xs sm:tracking-[0.18em]">
              {card.brand}
            </p>
            <p className="mt-1 font-mono text-[10px] font-medium leading-4 tracking-[0.02em] text-slate-900 min-[390px]:text-[11px] sm:mt-2 sm:text-lg sm:tracking-[0.08em]">
              {card.maskedNumber}
            </p>
          </div>

          <span className="flex h-4 w-4 shrink-0 items-center justify-center sm:h-7 sm:w-7">
            {card.isSelected ? (
              <span className="material-symbols-outlined text-[18px] leading-none text-blue-700 sm:text-[28px]">
                check_circle
              </span>
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 sm:h-7 sm:w-7" />
            )}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-[0.06em] text-slate-500 sm:mt-6 sm:gap-4 sm:text-xs sm:tracking-[0.12em]">
          <div className="min-w-0">
            <p>Kart Sahibi</p>
            <p className="mt-0.5 truncate text-[10px] font-medium normal-case tracking-normal text-slate-900 sm:mt-1 sm:text-sm">
              {card.cardHolderName}
            </p>
          </div>
          <div className="text-right">
            <p>SKT</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-normal text-slate-900 sm:mt-1 sm:text-sm">{expiry}</p>
          </div>
        </div>
      </button>

      {!selectableOnly ? (
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
      ) : null}
    </div>
  );
}
