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
    <div className={selectableOnly ? 'min-h-[178px] sm:h-[218px]' : 'min-h-[206px] sm:h-[257px]'}>
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className={`min-h-[178px] w-full overflow-hidden rounded-lg border-2 p-3 text-left transition sm:h-[218px] sm:p-5 ${
          card.isSelected
            ? 'border-blue-700 bg-blue-50'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 sm:text-xs sm:tracking-[0.18em]">
              {card.brand}
            </p>
            <p className="mt-2 font-mono text-sm font-bold tracking-[0.06em] text-slate-900 sm:text-lg sm:tracking-[0.08em]">
              {card.maskedNumber}
            </p>
          </div>

          <span className="flex h-6 w-6 shrink-0 items-center justify-center sm:h-7 sm:w-7">
            {card.isSelected ? (
              <span className="material-symbols-outlined text-[24px] leading-none text-blue-700 sm:text-[28px]">
                check_circle
              </span>
            ) : (
              <span className="h-6 w-6 rounded-full border-2 border-slate-300 sm:h-7 sm:w-7" />
            )}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 text-[10px] uppercase tracking-[0.1em] text-slate-500 min-[420px]:grid-cols-2 sm:mt-6 sm:gap-4 sm:text-xs sm:tracking-[0.12em]">
          <div className="min-w-0">
            <p>Kart Sahibi</p>
            <p className="mt-1 truncate text-xs font-bold normal-case tracking-normal text-slate-900 sm:text-sm">
              {card.cardHolderName}
            </p>
          </div>
          <div className="min-[420px]:text-right">
            <p>SKT</p>
            <p className="mt-1 text-xs font-bold tracking-normal text-slate-900 sm:text-sm">{expiry}</p>
          </div>
        </div>
      </button>

      {!selectableOnly ? (
        <div className="mt-2 flex items-center gap-3 text-xs sm:mt-3 sm:text-sm">
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
      ) : null}
    </div>
  );
}
