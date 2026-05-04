'use client';

import { useState } from 'react';
import {
  CreatePaymentCardInput,
  PaymentCardRecord,
  UpdatePaymentCardInput,
} from '@/features/payment-cards/api/payment-cards.api';
import PaymentCardPreview from './PaymentCardPreview';

interface PaymentCardFormProps {
  initialData?: PaymentCardRecord | null;
  onSubmit: (data: CreatePaymentCardInput | UpdatePaymentCardInput) => void;
  onClose: () => void;
  isLoading: boolean;
  errorMessage?: string;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100';

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function PaymentCardForm({
  initialData,
  onSubmit,
  onClose,
  isLoading,
  errorMessage,
}: PaymentCardFormProps) {
  const isEditing = Boolean(initialData);
  const [formData, setFormData] = useState<CreatePaymentCardInput>({
    cardNumber: initialData?.maskedNumber || '',
    expiry: initialData ? `${initialData.expiryMonth}/${initialData.expiryYear}` : '',
    cvv: '',
    cardHolderName: initialData?.cardHolderName || '',
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasStartedTyping = Object.values(formData).some((value) => value.trim());

  const updateField = (name: keyof CreatePaymentCardInput, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const cardDigits = formData.cardNumber.replace(/\D/g, '');
    const expiryMatch = formData.expiry.match(/^(\d{2})\/(\d{2})$/);

    if (!isEditing && cardDigits.length !== 16) nextErrors.cardNumber = 'Kart numarası 16 haneli olmalıdır';
    if (!expiryMatch) {
      nextErrors.expiry = 'AA/YY formatında girin';
    } else {
      const month = Number(expiryMatch[1]);
      if (month < 1 || month > 12) {
        nextErrors.expiry = 'Ay 01 ile 12 arasında olmalıdır';
      }
    }
    if (!isEditing && !/^\d{3,4}$/.test(formData.cvv)) nextErrors.cvv = 'CVV 3 veya 4 haneli olmalıdır';
    if (!formData.cardHolderName.trim()) nextErrors.cardHolderName = 'Kart sahibi gerekli';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (validateForm()) {
      if (isEditing) {
        onSubmit({
          expiry: formData.expiry,
          cardHolderName: formData.cardHolderName,
        });
        return;
      }

      onSubmit({
        ...formData,
        cardNumber: formData.cardNumber.replace(/\D/g, ''),
      });
    }
  };

  return (
    <div className="bg-slate-50">
      <div className="mb-2 flex items-center gap-3 sm:mb-3 sm:gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 sm:h-10 sm:w-10"
          aria-label="Kart listesine dön"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <h2 className="text-base font-medium tracking-tight text-slate-900 sm:text-xl">
            {isEditing ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {errorMessage ? (
          <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:mx-8">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-5 p-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-center min-[900px]:gap-8 min-[900px]:p-6">
          <div className="order-last w-full space-y-5 min-[900px]:order-first min-[900px]:w-[420px] min-[900px]:shrink-0">
            {!isEditing ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  16 haneli kart numarası
                </label>
                <input
                  value={formData.cardNumber}
                  onChange={(event) => updateField('cardNumber', formatCardNumber(event.target.value))}
                  onFocus={() => setFocusedField('cardNumber')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0000 0000 0000 0000"
                  className={inputClass}
                  inputMode="numeric"
                />
                {errors.cardNumber ? <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p> : null}
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Kart numarası</label>
                <input
                  value={formData.cardNumber}
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Son kullanma tarihi
                </label>
                <input
                  value={formData.expiry}
                  onChange={(event) => updateField('expiry', formatExpiry(event.target.value))}
                  onFocus={() => setFocusedField('expiry')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="AA/YY"
                  className={inputClass}
                  inputMode="numeric"
                />
                {errors.expiry ? <p className="mt-1 text-sm text-red-500">{errors.expiry}</p> : null}
              </div>

              {!isEditing ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">CVC / CVV</label>
                  <input
                    value={formData.cvv}
                    onChange={(event) => updateField('cvv', event.target.value.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setFocusedField('cvv')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="CVC"
                    className={inputClass}
                    inputMode="numeric"
                  />
                  {errors.cvv ? <p className="mt-1 text-sm text-red-500">{errors.cvv}</p> : null}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Kart sahibi</label>
              <input
                value={formData.cardHolderName}
                onChange={(event) => updateField('cardHolderName', event.target.value.toUpperCase())}
                onFocus={() => setFocusedField('cardHolderName')}
                onBlur={() => setFocusedField(null)}
                placeholder="AD SOYAD"
                className={inputClass}
              />
              {errors.cardHolderName ? (
                <p className="mt-1 text-sm text-red-500">{errors.cardHolderName}</p>
              ) : null}
            </div>
          </div>

          <div className="order-first w-full self-start min-[900px]:order-last min-[900px]:w-[360px] min-[900px]:shrink-0">
            <PaymentCardPreview
              cardNumber={isEditing ? '' : formData.cardNumber}
              expiry={formData.expiry}
              cvv={formData.cvv}
              cardHolderName={formData.cardHolderName}
              brand={initialData?.brand}
              isFlipped={focusedField === 'cvv'}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-4 border-t border-slate-200 bg-white px-6 py-4 md:flex-row md:justify-end md:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isLoading || !hasStartedTyping}
            className={`flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed ${
              hasStartedTyping
                ? 'bg-blue-700 hover:bg-blue-800 disabled:opacity-50'
                : 'bg-slate-300 text-slate-500'
            }`}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isLoading ? 'Kaydediliyor...' : isEditing ? 'Kartı Güncelle' : 'Kartı Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
