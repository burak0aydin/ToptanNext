'use client';

import { useState } from 'react';
import { AddressRecord, CreateAddressInput } from '@/features/addresses/api/addresses.api';

interface AddressFormProps {
  initialData?: AddressRecord | null;
  onSubmit: (data: CreateAddressInput) => void;
  onClose: () => void;
  isLoading: boolean;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-slate-50/40 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100';

function fieldClass(hasError?: boolean) {
  return hasError
    ? inputClass.replace('border-slate-300', 'border-red-500')
    : inputClass;
}

export default function AddressForm({
  initialData,
  onSubmit,
  onClose,
  isLoading,
}: AddressFormProps) {
  const [formData, setFormData] = useState<CreateAddressInput>({
    title: initialData?.title || '',
    fullName: initialData?.fullName || '',
    phoneNumber: initialData?.phoneNumber || '',
    province: initialData?.province || '',
    district: initialData?.district || '',
    neighborhood: initialData?.neighborhood || '',
    address: initialData?.address || '',
    postalCode: initialData?.postalCode || '',
    invoiceType: initialData?.invoiceType || 'corporate',
    taxId: initialData?.taxId || '',
    taxOffice: initialData?.taxOffice || '',
    companyName: initialData?.companyName || '',
    isETaxPayer: initialData?.isETaxPayer || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedTyping = [
    formData.title,
    formData.fullName,
    formData.phoneNumber,
    formData.province,
    formData.district,
    formData.neighborhood,
    formData.address,
    formData.postalCode,
    formData.companyName,
    formData.taxOffice,
    formData.taxId,
  ].some((value) => value?.trim());

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Adres başlığı gerekli';
    if (!formData.fullName.trim()) newErrors.fullName = 'Ad Soyad gerekli';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Telefon numarası gerekli';
    if (!formData.province) newErrors.province = 'İl seçimi gerekli';
    if (!formData.district) newErrors.district = 'İlçe seçimi gerekli';
    if (!formData.neighborhood) newErrors.neighborhood = 'Mahalle seçimi gerekli';
    if (!formData.address.trim()) newErrors.address = 'Adres gerekli';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Posta kodu gerekli';

    if (formData.invoiceType === 'corporate') {
      if (!formData.companyName?.trim()) newErrors.companyName = 'Firma adı gerekli';
      if (!formData.taxId?.trim()) newErrors.taxId = 'VKN/TCKN gerekli';
      if (!formData.taxOffice?.trim()) newErrors.taxOffice = 'Vergi dairesi gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        ...formData,
        title: formData.title?.trim() || formData.fullName.trim() || 'Adres',
      });
    }
  };

  return (
    <div className="bg-slate-50">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          aria-label="Adres listesine dön"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900">
            {initialData ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Teslimat ve fatura adreslerinizi detaylı olarak kaydedin.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="space-y-8 p-6 md:p-8">
          <section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Ad Soyad</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Örn: Ahmet Yılmaz"
                  className={fieldClass(Boolean(errors.fullName))}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Telefon</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="(5XX) XXX XX XX"
                  className={fieldClass(Boolean(errors.phoneNumber))}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">İl</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Örn: İstanbul"
                  className={fieldClass(Boolean(errors.province))}
                />
                {errors.province && <p className="mt-1 text-sm text-red-500">{errors.province}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">İlçe</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Örn: Kadıköy"
                  className={fieldClass(Boolean(errors.district))}
                />
                {errors.district && <p className="mt-1 text-sm text-red-500">{errors.district}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mahalle</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Örn: Caferağa"
                  className={fieldClass(Boolean(errors.neighborhood))}
                />
                {errors.neighborhood && (
                  <p className="mt-1 text-sm text-red-500">{errors.neighborhood}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Adres Detayı
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Cadde, mahalle, sokak ve diğer bilgileri giriniz..."
                  className={`${fieldClass(Boolean(errors.address))} min-h-[154px] resize-none`}
                  rows={5}
                />
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Örn: 34000"
                    className={fieldClass(Boolean(errors.postalCode))}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Adres Başlığı
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Örn: Merkez Depo"
                    className={fieldClass(Boolean(errors.title))}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="border-y border-slate-200 bg-slate-50 px-6 py-8 md:px-8">
          <div className="mb-8">
            <span className="mb-3 block text-sm font-medium text-slate-700">Fatura Türü</span>
            <div className="grid max-w-sm grid-cols-2 rounded-lg bg-slate-200 p-1">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, invoiceType: 'individual' }))}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  formData.invoiceType === 'individual'
                    ? 'bg-white text-[#003FB1] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bireysel
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, invoiceType: 'corporate' }))}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  formData.invoiceType === 'corporate'
                    ? 'bg-white text-[#003FB1] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kurumsal
              </button>
            </div>
          </div>

          {formData.invoiceType === 'corporate' ? (
            <div className="relative grid grid-cols-1 gap-6 overflow-hidden rounded-lg border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2">
              <div className="absolute left-0 top-0 h-full w-1 bg-[#003FB1]" />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Firma Adı</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleInputChange}
                  placeholder="Tam şirket unvanını giriniz"
                  className={fieldClass(Boolean(errors.companyName))}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Vergi Dairesi
                </label>
                <input
                  type="text"
                  name="taxOffice"
                  value={formData.taxOffice || ''}
                  onChange={handleInputChange}
                  placeholder="Örn: Zincirlikuyu VD"
                  className={fieldClass(Boolean(errors.taxOffice))}
                />
                {errors.taxOffice && (
                  <p className="mt-1 text-sm text-red-500">{errors.taxOffice}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">VKN/TCKN</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ''}
                  onChange={handleInputChange}
                  placeholder="10 veya 11 haneli numara"
                  className={fieldClass(Boolean(errors.taxId))}
                />
                {errors.taxId && <p className="mt-1 text-sm text-red-500">{errors.taxId}</p>}
              </div>

              <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  name="isETaxPayer"
                  checked={formData.isETaxPayer || false}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-slate-300 text-[#003FB1] focus:ring-[#003FB1]"
                />
                <span className="text-sm font-medium text-slate-700">E-fatura mükellefiyim</span>
              </label>
            </div>
          ) : null}
        </section>

        <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-4 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:justify-end md:px-8">
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
            {isLoading ? 'Kaydediliyor...' : 'Adresi Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
