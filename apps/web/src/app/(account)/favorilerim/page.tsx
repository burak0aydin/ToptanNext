'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/app/components/ProductCard';
import {
  FAVORITES_UPDATED_EVENT,
  listFavoriteProducts,
  removeFavoriteProduct,
  type FavoriteProduct,
} from '@/lib/favorites';

export default function FavorilerimPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  useEffect(() => {
    const syncFavorites = () => {
      setFavorites(listFavoriteProducts());
    };

    syncFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    window.addEventListener('storage', syncFavorites);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
      window.removeEventListener('storage', syncFavorites);
    };
  }, []);

  if (favorites.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center'>
        <span className='material-symbols-outlined text-4xl text-slate-400'>favorite</span>
        <h2 className='mt-3 text-xl font-bold text-on-surface'>Henüz favori ürününüz yok</h2>
        <p className='mt-2 text-sm text-on-surface-variant'>
          Ürün detayındaki kalp butonuna basarak favori listesi oluşturabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      {favorites.map((item) => (
        <article key={item.id} className='overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-sm'>
          <ProductCard
            href={`/urun/${item.id}`}
            imageUrl={item.imageUrl}
            minOrderQuantity={item.minOrderQuantity}
            priceLabel={item.priceLabel}
            title={item.name}
          />

          <div className='flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3'>
            <Link href={`/urun/${item.id}`} className='text-sm font-semibold text-primary hover:underline'>
              Ürüne Git
            </Link>
            <button
              className='inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50'
              type='button'
              onClick={() => {
                removeFavoriteProduct(item.id);
                setFavorites(listFavoriteProducts());
              }}
            >
              <span className='material-symbols-outlined text-base'>favorite</span>
              Favoriden Kaldır
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
