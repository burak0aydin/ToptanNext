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
    <div className={selectableOnly ? 'h-[218px]' : 'h-[257px]'}>
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className={`h-[218px] w-full overflow-hidden rounded-lg border-2 p-5 text-left transition ${
          card.isSelected
            ? 'border-blue-700 bg-blue-50'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              {card.brand}
            </p>
            <p className="mt-2 font-mono text-lg font-bold tracking-[0.08em] text-slate-900">
              {card.maskedNumber}
            </p>
          </div>

          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            {card.isSelected ? (
              <span className="material-symbols-outlined text-[28px] leading-none text-blue-700">
                check_circle
              </span>
            ) : (
              <span className="h-7 w-7 rounded-full border-2 border-slate-300" />
            )}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-xs uppercase tracking-[0.12em] text-slate-500">
          <div className="min-w-0">
            <p>Kart Sahibi</p>
            <p className="mt-1 truncate text-sm font-bold normal-case tracking-normal text-slate-900">
              {card.cardHolderName}
            </p>
          </div>
          <div className="text-right">
            <p>SKT</p>
            <p className="mt-1 text-sm font-bold tracking-normal text-slate-900">{expiry}</p>
          </div>
        </div>
      </button>

      {!selectableOnly ? (
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
      ) : null}
    </div>
  );
}
