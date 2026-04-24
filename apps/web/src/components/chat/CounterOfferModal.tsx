'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateQuotePayload } from '@/features/chat/api/chat.api';

const schema = z.object({
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  currency: z.string().min(3).max(8),
  notes: z.string().max(500).optional(),
  expiresInHours: z.number().int().min(1).max(168),
});

type FormValues = z.infer<typeof schema>;

type CounterOfferModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateQuotePayload) => Promise<void>;
};

export function CounterOfferModal({
  open,
  onClose,
  onSubmit,
}: CounterOfferModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
      unitPrice: 1,
      currency: 'TRY',
      notes: '',
      expiresInHours: 24,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-5 shadow-xl'>
        <h3 className='text-lg font-bold text-slate-800'>Karşı Teklif Gönder</h3>

        <form
          className='mt-4 space-y-3'
          onSubmit={handleSubmit(async (values: FormValues) => {
            await onSubmit({
              quantity: values.quantity,
              unitPrice: values.unitPrice,
              currency: values.currency,
              notes: values.notes,
              expiresInHours: values.expiresInHours,
            });
            onClose();
          })}
        >
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Adet</span>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type='number'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
            />
            {errors.quantity ? <span className='text-xs text-red-600'>{String(errors.quantity.message)}</span> : null}
          </label>

          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Birim Fiyat</span>
            <input
              {...register('unitPrice', { valueAsNumber: true })}
              type='number'
              step='0.01'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
            />
            {errors.unitPrice ? <span className='text-xs text-red-600'>{String(errors.unitPrice.message)}</span> : null}
          </label>

          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Not</span>
            <textarea {...register('notes')} className='h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm' />
          </label>

          <div className='flex justify-end gap-2 pt-2'>
            <button type='button' onClick={onClose} className='rounded-lg border border-slate-300 px-3 py-2 text-sm'>
              Vazgeç
            </button>
            <button type='submit' disabled={isSubmitting} className='rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white'>
              Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
