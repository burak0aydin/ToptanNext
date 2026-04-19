'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  fetchUserProfile,
  updateUserProfile,
  type UpdateUserProfilePayload,
  type UserProfile,
} from '@/features/profile/api/profile.api';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

const PHONE_PREFIX = '+90';

const EMPTY_FORM: ProfileFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

function mapProfileToForm(profile: UserProfile | null): ProfileFormState {
  if (!profile) {
    return EMPTY_FORM;
  }

  const normalizedPhoneNumber = profile.phoneNumber ?? '';
  const localPhoneNumber = normalizedPhoneNumber.startsWith(PHONE_PREFIX)
    ? normalizedPhoneNumber.slice(PHONE_PREFIX.length).trimStart()
    : normalizedPhoneNumber;

  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    phoneNumber: localPhoneNumber,
  };
}

export default function KullaniciBilgilerimPage() {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const profile = await fetchUserProfile();

        if (!isMounted) {
          return;
        }

        const mappedForm = mapProfileToForm(profile);
        setForm(mappedForm);
        setInitialForm(mappedForm);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Kullanıcı bilgileri alınamadı.';
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDirty = useMemo(() => {
    return (
      form.firstName !== initialForm.firstName ||
      form.lastName !== initialForm.lastName ||
      form.email !== initialForm.email ||
      form.phoneNumber !== initialForm.phoneNumber
    );
  }, [form, initialForm]);

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: UpdateUserProfilePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber.trim().length > 0 ? `${PHONE_PREFIX} ${form.phoneNumber.trim()}` : '',
      };

      const updatedProfile = await updateUserProfile(payload);
      const mappedForm = mapProfileToForm(updatedProfile);

      setForm(mappedForm);
      setInitialForm(mappedForm);
      setSuccessMessage('Bilgileriniz başarıyla güncellendi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilgileriniz güncellenemedi.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className='max-w-[860px] space-y-8' onSubmit={handleSubmit}>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <label className='space-y-2.5'>
          <span className='mb-2 block text-xs font-semibold uppercase tracking-tight text-outline'>Ad</span>
          <input
            className='w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 md:max-w-[400px]'
            type='text'
            value={form.firstName}
            onChange={(event) => handleFieldChange('firstName', event.target.value)}
            disabled={isLoading}
          />
        </label>

        <label className='space-y-2.5'>
          <span className='mb-2 block text-xs font-semibold uppercase tracking-tight text-outline'>Soyad</span>
          <input
            className='w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 md:max-w-[400px]'
            type='text'
            value={form.lastName}
            onChange={(event) => handleFieldChange('lastName', event.target.value)}
            disabled={isLoading}
          />
        </label>
      </div>

      <label className='block max-w-[620px] space-y-2.5'>
        <span className='mb-2 block text-xs font-semibold uppercase tracking-tight text-outline'>E-Posta Adresi</span>
        <div className='relative'>
          <span className='material-symbols-outlined absolute inset-y-0 left-4 flex items-center text-sm text-outline'>
            mail
          </span>
          <input
            className='w-full rounded-xl border border-outline-variant bg-white py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10'
            type='email'
            value={form.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            disabled={isLoading}
          />
        </div>
      </label>

      <label className='block max-w-[620px] space-y-2.5'>
        <span className='mb-2 block text-xs font-semibold uppercase tracking-tight text-outline'>Cep Telefonu</span>
        <div className='flex gap-3'>
          <input
            className='w-20 rounded-xl border border-outline-variant bg-slate-100 px-3 py-3 text-center text-sm font-semibold text-on-surface-variant'
            type='text'
            value={PHONE_PREFIX}
            disabled
            readOnly
          />

          <div className='relative flex-1'>
            <span className='material-symbols-outlined absolute inset-y-0 left-4 flex items-center text-sm text-outline'>
              phone_iphone
            </span>
            <input
              className='w-full rounded-xl border border-outline-variant bg-white py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10'
              type='tel'
              value={form.phoneNumber}
              onChange={(event) => handleFieldChange('phoneNumber', event.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </label>

      {errorMessage ? (
        <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className='rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
          {successMessage}
        </p>
      ) : null}

      <div className='flex justify-start pt-3'>
        <button
          className={`min-w-[240px] rounded-xl px-16 py-3.5 text-base font-semibold transition-all ${
            isDirty
              ? 'bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98]'
              : 'cursor-not-allowed bg-slate-200 text-slate-500'
          }`}
          type='submit'
          disabled={!isDirty || isSaving || isLoading}
        >
          {isSaving ? 'Güncelleniyor...' : 'Güncelle'}
        </button>
      </div>
    </form>
  );
}
