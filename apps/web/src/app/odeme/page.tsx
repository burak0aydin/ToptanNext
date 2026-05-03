'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAddress,
  CreateAddressInput,
  fetchUserAddresses,
  selectAddress,
} from '@/features/addresses/api/addresses.api';
import AddressForm from '@/features/addresses/components/AddressForm';
import { fetchCart } from '@/features/cart/api/cart.api';
import {
  fetchPaymentCards,
  selectPaymentCard,
} from '@/features/payment-cards/api/payment-cards.api';
import SavedPaymentCard from '@/features/payment-cards/components/SavedPaymentCard';
import { hasAccessToken } from '@/lib/auth-token';

function formatPrice(value: number | string | null | undefined, currency = 'TRY'): string {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export default function PaymentPage() {
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [acceptedContracts, setAcceptedContracts] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'card' | 'transfer'>('card');
  const [installment, setInstallment] = useState<'single' | 'three'>('single');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasAccessToken());
  }, []);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: isLoggedIn,
  });
  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchUserAddresses,
    enabled: isLoggedIn,
  });
  const paymentCardsQuery = useQuery({
    queryKey: ['payment-cards'],
    queryFn: fetchPaymentCards,
    enabled: isLoggedIn,
  });

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (address) => {
      setSelectedAddressId(address.id);
      setIsAddressFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const selectAddressMutation = useMutation({
    mutationFn: selectAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const selectPaymentCardMutation = useMutation({
    mutationFn: selectPaymentCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-cards'] });
    },
  });

  const cart = cartQuery.data;
  const addresses = addressesQuery.data ?? [];
  const paymentCards = paymentCardsQuery.data ?? [];
  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.find((address) => address.isSelected) ??
    addresses[0];
  const selectedPaymentCard =
    paymentCards.find((card) => card.id === selectedCardId) ??
    paymentCards.find((card) => card.isSelected) ??
    paymentCards[0];

  const totals = useMemo(() => {
    const grossTotal = Number(cart?.subtotal ?? 0);
    const netTotal = grossTotal / 1.2;
    const vatTotal = grossTotal - netTotal;
    const threeInstallmentTotal = grossTotal * 1.05;

    return {
      grossTotal,
      netTotal,
      vatTotal,
      threeInstallmentTotal,
      threeInstallmentMonthly: threeInstallmentTotal / 3,
    };
  }, [cart?.subtotal]);

  const canPay =
    isLoggedIn &&
    (cart?.items.length ?? 0) > 0 &&
    Boolean(selectedAddress) &&
    acceptedContracts &&
    (paymentTab === 'transfer' || Boolean(selectedPaymentCard));

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    selectAddressMutation.mutate(addressId);
  };

  const handleSelectPaymentCard = (cardId: string) => {
    setSelectedCardId(cardId);
    selectPaymentCardMutation.mutate(cardId);
  };

  const handleCreateAddress = (data: CreateAddressInput) => {
    createAddressMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low text-on-surface">
      <header className="sticky top-0 z-50 border-b border-surface-variant bg-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xl font-bold tracking-tight text-primary"
          >
            Toptan<span className="text-secondary-container">Next</span>
          </Link>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-green-600 [font-variation-settings:'FILL'_1]">
              lock
            </span>
            <span className="text-sm font-medium">Güvenli Ödeme Aşaması</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-10">
        {!isLoggedIn ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-white p-6">
            <p className="text-sm font-medium text-on-surface-variant">
              Ödemeye devam etmek için önce giriş yapmanız gerekiyor.
            </p>
            <Link
              href="/login?next=%2Fodeme"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Giriş Yap
            </Link>
          </div>
        ) : null}

        <div className="relative flex flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full flex-col gap-8 lg:w-8/12">
            <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
              <div className="border-b border-surface-variant bg-surface-bright p-6">
                <h2 className="text-xl font-semibold text-on-surface">
                  Teslimat ve Fatura Bilgileri
                </h2>
              </div>

              {isAddressFormOpen ? (
                <div className="p-6">
                  <AddressForm
                    onSubmit={handleCreateAddress}
                    onClose={() => setIsAddressFormOpen(false)}
                    isLoading={createAddressMutation.isPending}
                  />
                  {createAddressMutation.error ? (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {createAddressMutation.error.message}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">Teslimat Adresi</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Fatura bilgileri seçtiğiniz adres kaydından alınır.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(true)}
                      className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Yeni Adres Ekle
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {addresses.slice(0, 4).map((address) => {
                        const isSelected = selectedAddress?.id === address.id;

                        return (
                          <label key={address.id} className="relative cursor-pointer">
                            <input
                              checked={isSelected}
                              className="sr-only"
                              name="delivery_address"
                              type="radio"
                              onChange={() => handleSelectAddress(address.id)}
                            />
                            <div
                              className={`min-h-[178px] rounded-xl border-2 p-4 transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary-fixed/20'
                                  : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container'
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between">
                                <span
                                  className={`flex items-center gap-1 text-sm font-semibold ${
                                    isSelected ? 'text-primary' : 'text-on-surface-variant'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[18px] [font-variation-settings:'FILL'_1]">
                                    home
                                  </span>
                                  {address.title || 'Adres'}
                                </span>
                                {isSelected ? (
                                  <span className="material-symbols-outlined text-primary [font-variation-settings:'FILL'_1]">
                                    check_circle
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm font-medium text-on-surface">
                                {address.fullName}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                                {address.address}
                                <br />
                                {address.neighborhood} / {address.district} / {address.province}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    phone
                                  </span>
                                  {address.phoneNumber}
                                </span>
                                {address.invoiceType === 'corporate' && address.companyName ? (
                                  <span>{address.companyName}</span>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-5">
                      <p className="text-sm font-medium text-on-surface-variant">
                        Kayıtlı teslimat adresiniz yok.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddressFormOpen(true)}
                        className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        Adres Ekle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
              <div className="border-b border-surface-variant bg-surface-bright p-6">
                <h2 className="text-xl font-semibold text-on-surface">Ödeme Yöntemi</h2>
              </div>
              <div className="p-6">
                <div className="mb-6 flex border-b border-surface-variant">
                  <button
                    type="button"
                    onClick={() => setPaymentTab('card')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm ${
                      paymentTab === 'card'
                        ? 'border-primary font-semibold text-primary'
                        : 'border-transparent font-medium text-on-surface-variant transition-colors hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">credit_card</span>
                    Kredi/Banka Kartı
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab('transfer')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm ${
                      paymentTab === 'transfer'
                        ? 'border-primary font-semibold text-primary'
                        : 'border-transparent font-medium text-on-surface-variant transition-colors hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    Havale/EFT
                  </button>
                </div>

                {paymentTab === 'card' ? (
                  <div className="flex flex-col gap-8 lg:flex-row">
                    <div className="w-full lg:w-1/2">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-on-surface">Kayıtlı Kartlarım</h4>
                        <Link
                          href="/kayitli-kartlarim"
                          className="text-sm font-medium text-primary hover:text-primary-container"
                        >
                          Kartları Yönet
                        </Link>
                      </div>

                      {paymentCards.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {paymentCards.slice(0, 3).map((card) => (
                            <SavedPaymentCard
                              key={card.id}
                              card={{
                                ...card,
                                isSelected: selectedPaymentCard?.id === card.id,
                              }}
                              onSelect={() => handleSelectPaymentCard(card.id)}
                              isLoading={selectPaymentCardMutation.isPending}
                              selectableOnly
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-5">
                          <p className="text-sm font-medium text-on-surface-variant">
                            Kayıtlı kartınız yok. Kartınızı güvenli şekilde kaydettikten sonra
                            ödeme sırasında buradan seçebilirsiniz.
                          </p>
                          <Link
                            href="/kayitli-kartlarim"
                            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                          >
                            Kart Ekle
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-1/2">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
                        Kurumsal Taksit Seçenekleri
                        <span className="rounded bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant">
                          Ticari Kart
                        </span>
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-surface-variant">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                            <tr>
                              <th className="px-4 py-3 font-medium">Taksit</th>
                              <th className="px-4 py-3 text-right font-medium">Aylık Ödeme</th>
                              <th className="px-4 py-3 text-right font-medium">Toplam</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-variant">
                            <tr
                              onClick={() => setInstallment('single')}
                              className={`cursor-pointer transition-colors ${
                                installment === 'single'
                                  ? 'bg-primary-fixed/20 hover:bg-primary-fixed/30'
                                  : 'hover:bg-surface-container-low'
                              }`}
                            >
                              <td className="flex items-center gap-2 px-4 py-3">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                    installment === 'single'
                                      ? 'border-primary'
                                      : 'border-outline-variant'
                                  }`}
                                >
                                  {installment === 'single' ? (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  ) : null}
                                </span>
                                <span
                                  className={
                                    installment === 'single'
                                      ? 'font-semibold text-primary'
                                      : 'text-on-surface-variant'
                                  }
                                >
                                  Tek Çekim
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-on-surface">
                                {formatPrice(totals.grossTotal, cart?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-on-surface">
                                {formatPrice(totals.grossTotal, cart?.currency)}
                              </td>
                            </tr>
                            <tr
                              onClick={() => setInstallment('three')}
                              className={`cursor-pointer transition-colors ${
                                installment === 'three'
                                  ? 'bg-primary-fixed/20 hover:bg-primary-fixed/30'
                                  : 'hover:bg-surface-container-low'
                              }`}
                            >
                              <td className="flex items-center gap-2 px-4 py-3">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                    installment === 'three'
                                      ? 'border-primary'
                                      : 'border-outline-variant'
                                  }`}
                                >
                                  {installment === 'three' ? (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  ) : null}
                                </span>
                                <span
                                  className={
                                    installment === 'three'
                                      ? 'font-semibold text-primary'
                                      : 'text-on-surface-variant'
                                  }
                                >
                                  3 Taksit (%5 Vade)
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-on-surface">
                                {formatPrice(totals.threeInstallmentMonthly, cart?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right text-on-surface-variant">
                                {formatPrice(totals.threeInstallmentTotal, cart?.currency)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-5">
                    <h3 className="text-sm font-semibold text-on-surface">Havale/EFT</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Sipariş onayından sonra banka bilgileri ve ödeme referansı paylaşılacaktır.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="mb-12 overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_24px_rgba(25,28,30,0.04)] lg:mb-0">
              <div className="border-b border-surface-variant bg-surface-bright p-6">
                <h2 className="text-xl font-semibold text-on-surface">Sözleşmeler ve Formlar</h2>
              </div>
              <div className="flex flex-col gap-6 p-6">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">
                    Ön Bilgilendirme Formu
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Tüketici hakları ve sipariş detayları hakkında yasal ön bilgilendirme
                    metnidir. Sipariş öncesi müşteriye sunulması zorunludur.
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">
                    Mesafeli Satış Sözleşmesi
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Alıcı ve satıcı arasındaki mesafeli satış hükümlerini düzenleyen ana yasal
                    sözleşmedir.
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">Cayma Hakkı</h3>
                  <p className="text-xs text-on-surface-variant">
                    Tüketicinin sebep göstermeksizin siparişten vazgeçme ve iade etme haklarını
                    ve süreçlerini belirler.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="relative w-full lg:w-4/12">
            <div className="sticky top-24">
              <div className="flex flex-col gap-6 rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.06)]">
                <h3 className="border-b border-surface-variant pb-4 text-xl font-bold text-on-surface">
                  Sipariş Özeti
                </h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Ara Toplam (KDV Hariç)</span>
                    <span className="font-medium text-on-surface">
                      {formatPrice(totals.netTotal, cart?.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>KDV (%20)</span>
                    <span className="font-medium text-on-surface">
                      {formatPrice(totals.vatTotal, cart?.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Kargo/Navlun</span>
                    <span className="font-medium text-on-surface">Alıcı Ödemeli</span>
                  </div>
                </div>
                <div className="h-px w-full bg-surface-variant" />
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-on-surface-variant">Genel Toplam</span>
                  <span className="text-3xl font-bold tracking-tight text-primary">
                    {formatPrice(
                      installment === 'three' ? totals.threeInstallmentTotal : totals.grossTotal,
                      cart?.currency,
                    )}
                  </span>
                </div>
                <label className="group mt-2 flex cursor-pointer items-start gap-3">
                  <span className="relative mt-0.5 flex items-center">
                    <input
                      checked={acceptedContracts}
                      onChange={(event) => setAcceptedContracts(event.target.checked)}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-outline-variant transition-all checked:border-primary checked:bg-primary"
                      type="checkbox"
                    />
                    <span className="material-symbols-outlined pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] text-white opacity-0 peer-checked:opacity-100 [font-variation-settings:'FILL'_1]">
                      check
                    </span>
                  </span>
                  <span className="text-[13px] leading-tight text-on-surface-variant">
                    <a className="text-primary underline" href="#contracts">
                      Ön Bilgilendirme Formu
                    </a>
                    &apos;nu ve{' '}
                    <a className="text-primary underline" href="#contracts">
                      Mesafeli Satış Sözleşmesi
                    </a>
                    &apos;ni okudum, onaylıyorum.
                  </span>
                </label>
                <button
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-lg font-bold ${
                    canPay
                      ? 'bg-primary text-white hover:bg-primary-container'
                      : 'cursor-not-allowed bg-surface-variant text-on-surface-variant'
                  }`}
                  disabled={!canPay}
                  type="button"
                >
                  <span className="material-symbols-outlined">lock</span>
                  Siparişi Onayla ve Öde
                </button>
                <div className="mt-2 flex items-center justify-center gap-4 opacity-60">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                  <span className="text-xs font-medium">256-bit SSL Secure</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
