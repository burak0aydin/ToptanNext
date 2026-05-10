import Link from 'next/link';

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-5 py-16">
      <section className="mx-auto flex max-w-xl flex-col items-center rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
          OK
        </div>

        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Siparişiniz alındı</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
          Ürünü teslim aldıktan sonra ürün sayfasından değerlendirme ve puanlama yapabilirsiniz.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/kesfet"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </section>
    </main>
  );
}
