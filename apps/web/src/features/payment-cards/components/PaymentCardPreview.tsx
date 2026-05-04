type PaymentCardPreviewProps = {
  cardNumber: string;
  expiry: string;
  cvv?: string;
  cardHolderName: string;
  brand?: string;
  isFlipped?: boolean;
  compact?: boolean;
};

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const padded = digits.padEnd(16, '•');

  return padded.replace(/(.{4})/g, '$1 ').trim();
}

function detectBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  return 'CARD';
}

export default function PaymentCardPreview({
  cardNumber,
  expiry,
  cvv = '',
  cardHolderName,
  brand,
  isFlipped = false,
  compact = false,
}: PaymentCardPreviewProps) {
  const cardBrand = brand?.toUpperCase() || detectBrand(cardNumber);
  const hasNumber = cardNumber.replace(/\D/g, '').length > 0;

  return (
    <div className={`[perspective:1400px] ${compact ? 'h-[176px] sm:h-[186px]' : 'h-[190px] sm:h-[240px]'}`}>
      <div
        className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 isolate flex flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_38%,#7c3aed_72%,#f97316_120%)] p-4 text-white shadow-2xl shadow-blue-900/25 [backface-visibility:hidden] sm:p-6">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl transition-transform duration-700" />
          <div className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl transition-transform duration-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_22%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.2),transparent_18%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="grid h-8 w-11 grid-cols-2 gap-1 rounded-lg bg-gradient-to-br from-amber-100 to-amber-300 p-1.5 shadow-inner sm:h-10 sm:w-14 sm:p-2">
              <span className="rounded-sm bg-amber-500/30" />
              <span className="rounded-sm bg-amber-500/20" />
              <span className="rounded-sm bg-amber-500/20" />
              <span className="rounded-sm bg-amber-500/30" />
            </div>
            <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium tracking-[0.16em] backdrop-blur sm:px-3 sm:text-xs sm:tracking-[0.2em]">
              {cardBrand}
            </span>
          </div>

          <div className="relative">
            <p
              className={`font-mono text-base font-medium tracking-[0.12em] transition-all duration-300 sm:text-xl sm:tracking-[0.18em] ${
                hasNumber ? 'text-white' : 'text-white/70'
              }`}
            >
              {formatCardNumber(cardNumber)}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4 text-[10px] uppercase tracking-[0.1em] text-blue-100 sm:mt-6 sm:text-xs sm:tracking-[0.12em]">
              <div className="min-w-0">
                <p>Kart Sahibi</p>
                <p className="mt-1 truncate text-xs font-medium text-white transition-all duration-300 sm:text-sm">
                  {cardHolderName || 'AD SOYAD'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p>SKT</p>
                <p className="mt-1 text-xs font-medium text-white transition-all duration-300 sm:text-sm">
                  {expiry || 'AA/YY'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#312e81_45%,#0f766e_110%)] p-4 text-white shadow-2xl shadow-slate-900/30 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative mt-4 h-9 rounded bg-slate-950 sm:mt-5 sm:h-11" />
          <div className="relative mt-5 rounded bg-white p-3 text-right font-mono text-sm font-medium tracking-[0.2em] text-slate-900 shadow-lg sm:mt-7">
            {cvv || 'CVV'}
          </div>
          <p className="relative mt-4 text-[10px] leading-relaxed text-slate-300 sm:mt-5 sm:text-xs">
            CVC/CVV yalnızca doğrulama sırasında kullanılır ve kaydedilmez.
          </p>
        </div>
      </div>
    </div>
  );
}
