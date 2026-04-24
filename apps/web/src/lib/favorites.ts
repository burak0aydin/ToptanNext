export const FAVORITES_STORAGE_KEY = 'toptannext:favorites';
export const FAVORITES_UPDATED_EVENT = 'toptannext:favorites-updated';

export type FavoriteProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceLabel: string;
  minOrderQuantity: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  addedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function parseFavorites(raw: string | null): FavoriteProduct[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is FavoriteProduct => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Partial<FavoriteProduct>;
      return typeof candidate.id === 'string' && typeof candidate.name === 'string';
    });
  } catch {
    return [];
  }
}

export function listFavoriteProducts(): FavoriteProduct[] {
  if (!isBrowser()) {
    return [];
  }

  const favorites = parseFavorites(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
  return [...favorites].sort((left, right) => (
    new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime()
  ));
}

function writeFavoriteProducts(items: FavoriteProduct[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}

export function isFavoriteProduct(productId: string): boolean {
  return listFavoriteProducts().some((item) => item.id === productId);
}

export function addFavoriteProduct(item: Omit<FavoriteProduct, 'addedAt'>): void {
  const existing = listFavoriteProducts().filter((entry) => entry.id !== item.id);
  writeFavoriteProducts([
    {
      ...item,
      addedAt: new Date().toISOString(),
    },
    ...existing,
  ]);
}

export function removeFavoriteProduct(productId: string): void {
  const next = listFavoriteProducts().filter((item) => item.id !== productId);
  writeFavoriteProducts(next);
}

export function toggleFavoriteProduct(item: Omit<FavoriteProduct, 'addedAt'>): boolean {
  if (isFavoriteProduct(item.id)) {
    removeFavoriteProduct(item.id);
    return false;
  }

  addFavoriteProduct(item);
  return true;
}
