'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateQuotePayload } from '@/features/chat/api/chat.api';
import {
  fetchPublicProductListingById,
  resolveProductListingMediaUrl,
} from '@/features/product-listing/api/product-listing.api';

const schema = z.object({
  productListingId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  logisticsFee: z.number().min(0).optional(),
  currency: z.string().min(3).max(8),
  notes: z.string().max(500).optional(),
  expiresInHours: z.number().int().min(1).max(168),
});

type FormValues = z.infer<typeof schema>;

type QuoteOfferModalProps = {
  open: boolean;
  defaultProductListingId?: string | null;
  title?: string;
  submitLabel?: string;
  initialValues?: Partial<Pick<FormValues, 'quantity' | 'unitPrice' | 'logisticsFee' | 'currency' | 'notes' | 'expiresInHours'>>;
  onClose: () => void;
  onSubmit: (payload: CreateQuotePayload) => Promise<void>;
};

export function QuoteOfferModal({
  open,
  defaultProductListingId,
  title = 'Özel Teklif Gönder',
  submitLabel = 'Teklif Gönder',
  initialValues,
  onClose,
  onSubmit,
}: QuoteOfferModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productListingId: defaultProductListingId ?? '',
      quantity: initialValues?.quantity ?? 1,
      unitPrice: initialValues?.unitPrice ?? 1,
      logisticsFee: initialValues?.logisticsFee,
      currency: initialValues?.currency ?? 'TRY',
      notes: initialValues?.notes ?? '',
      expiresInHours: initialValues?.expiresInHours ?? 24,
    },
  });

  useEffect(() => {
    reset({
      productListingId: defaultProductListingId ?? '',
      quantity: initialValues?.quantity ?? 1,
      unitPrice: initialValues?.unitPrice ?? 1,
      logisticsFee: initialValues?.logisticsFee,
      currency: initialValues?.currency ?? 'TRY',
      notes: initialValues?.notes ?? '',
      expiresInHours: initialValues?.expiresInHours ?? 24,
    });
  }, [defaultProductListingId, initialValues, reset]);

  const productQuery = useQuery({
    queryKey: ['quote-modal-product', defaultProductListingId],
    queryFn: () => fetchPublicProductListingById(defaultProductListingId ?? ''),
    enabled: open && Boolean(defaultProductListingId),
  });

  const quantity = watch('quantity') || 0;
  const unitPrice = watch('unitPrice') || 0;
  const logisticsFee = watch('logisticsFee') || 0;
  const productTotal = quantity * unitPrice;
  const grandTotal = productTotal + logisticsFee;
  const product = productQuery.data;
  const productImage = product?.media.find((item) => item.mediaType === 'IMAGE');

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4'>
      <div className='max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl'>
        <h3 className='text-base font-bold text-slate-800'>{title}</h3>

        <form
          className='mt-4 space-y-3'
          onSubmit={handleSubmit(async (values: FormValues) => {
            await onSubmit({
              productListingId: values.productListingId,
              quantity: values.quantity,
              unitPrice: values.unitPrice,
              logisticsFee: values.logisticsFee,
              currency: values.currency,
              notes: values.notes,
              expiresInHours: values.expiresInHours,
            });
            onClose();
          })}
        >
          <input {...register('productListingId')} type='hidden' />
          {errors.productListingId ? <span className='text-xs text-red-600'>{String(errors.productListingId.message)}</span> : null}

          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-400'>
                {productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={product?.name ?? 'Ürün'}
                    className='h-full w-full object-cover'
                    src={resolveProductListingMediaUrl(productImage.id)}
                  />
                ) : (
                  <span className='material-symbols-outlined text-[20px]'>inventory_2</span>
                )}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-bold text-slate-800'>
                  {product?.name ?? 'Ürün'}
                </p>
                <p className='mt-0.5 text-[11px] font-medium text-slate-500'>
                  MSM: {product?.minOrderQuantity ?? '-'} · Stok: {product?.stock ?? '-'}
                </p>
              </div>
            </div>

            {product?.pricingTiers.length ? (
              <div className='mt-3 rounded-lg bg-white p-2'>
                <p className='text-[11px] font-bold text-slate-500'>Kademeli fiyatlandırma</p>
                <div className='mt-1 grid gap-1 text-[11px] text-slate-600'>
                  {product.pricingTiers.slice(0, 3).map((tier) => (
                    <div key={`${tier.minQuantity}-${tier.maxQuantity}`} className='flex justify-between gap-2'>
                      <span>{tier.minQuantity}-{tier.maxQuantity} adet</span>
                      <span className='font-semibold'>₺{tier.unitPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <label className='block'>
              <span className='mb-1 block text-xs font-semibold text-slate-600'>Adet</span>
              <input
                {...register('quantity', { valueAsNumber: true })}
                type='number'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
              />
            </label>
            <label className='block'>
              <span className='mb-1 block text-xs font-semibold text-slate-600'>Birim Fiyat</span>
              <input
                {...register('unitPrice', { valueAsNumber: true })}
                type='number'
                step='0.01'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
              />
            </label>
          </div>

          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Lojistik Ücreti (isteğe bağlı)</span>
            <input
              {...register('logisticsFee', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
              type='number'
              step='0.01'
              min='0'
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
              placeholder='0.00'
            />
            {errors.logisticsFee ? <span className='text-xs text-red-600'>{String(errors.logisticsFee.message)}</span> : null}
          </label>

          <div className='rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs text-slate-600'>
            <div className='flex justify-between'>
              <span>Ürün toplamı</span>
              <span className='font-bold'>₺{productTotal.toFixed(2)}</span>
            </div>
            <div className='mt-1 flex justify-between'>
              <span>Lojistik</span>
              <span className='font-bold'>₺{logisticsFee.toFixed(2)}</span>
            </div>
            <div className='mt-2 flex justify-between border-t border-primary/10 pt-2 text-sm text-slate-800'>
              <span className='font-bold'>Genel toplam</span>
              <span className='font-extrabold text-primary'>₺{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Geçerlilik (saat)</span>
            <select
              {...register('expiresInHours', { valueAsNumber: true })}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
            >
              <option value={24}>24 saat</option>
              <option value={48}>48 saat</option>
              <option value={72}>72 saat</option>
            </select>
          </label>

          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>Not</span>
            <textarea {...register('notes')} className='h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm' />
          </label>

          <div className='flex justify-end gap-2 pt-2'>
            <button type='button' onClick={onClose} className='rounded-lg border border-slate-300 px-3 py-2 text-sm'>
              Vazgeç
            </button>
            <button type='submit' disabled={isSubmitting} className='rounded-lg bg-[#FF5A1F] px-3 py-2 text-sm font-semibold text-white'>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
