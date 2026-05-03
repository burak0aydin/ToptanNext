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
    <div className={`[perspective:1400px] ${compact ? 'h-[186px]' : 'h-[240px]'}`}>
      <div
        className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 isolate flex flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_38%,#7c3aed_72%,#f97316_120%)] p-6 text-white shadow-2xl shadow-blue-900/25 [backface-visibility:hidden]">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl transition-transform duration-700" />
          <div className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl transition-transform duration-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_22%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.2),transparent_18%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="grid h-10 w-14 grid-cols-2 gap-1 rounded-lg bg-gradient-to-br from-amber-100 to-amber-300 p-2 shadow-inner">
              <span className="rounded-sm bg-amber-500/30" />
              <span className="rounded-sm bg-amber-500/20" />
              <span className="rounded-sm bg-amber-500/20" />
              <span className="rounded-sm bg-amber-500/30" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black tracking-[0.2em] backdrop-blur">
              {cardBrand}
            </span>
          </div>

          <div className="relative">
            <p
              className={`font-mono text-xl font-semibold tracking-[0.18em] transition-all duration-300 ${
                hasNumber ? 'text-white' : 'text-white/70'
              }`}
            >
              {formatCardNumber(cardNumber)}
            </p>
            <div className="mt-6 flex items-end justify-between gap-4 text-xs uppercase tracking-[0.12em] text-blue-100">
              <div className="min-w-0">
                <p>Kart Sahibi</p>
                <p className="mt-1 truncate text-sm font-bold text-white transition-all duration-300">
                  {cardHolderName || 'AD SOYAD'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p>SKT</p>
                <p className="mt-1 text-sm font-bold text-white transition-all duration-300">
                  {expiry || 'AA/YY'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#312e81_45%,#0f766e_110%)] p-6 text-white shadow-2xl shadow-slate-900/30 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative mt-5 h-11 rounded bg-slate-950" />
          <div className="relative mt-7 rounded bg-white p-3 text-right font-mono text-sm font-bold tracking-[0.2em] text-slate-900 shadow-lg">
            {cvv || 'CVV'}
          </div>
          <p className="relative mt-5 text-xs leading-relaxed text-slate-300">
            CVC/CVV yalnızca doğrulama sırasında kullanılır ve kaydedilmez.
          </p>
        </div>
      </div>
    </div>
  );
}
