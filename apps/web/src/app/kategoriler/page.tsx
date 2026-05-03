'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MainFooter } from '@/app/components/MainFooter';
import { MainHeader } from '@/app/components/MainHeader';
import { requestJson } from '@/lib/api';

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryNode[];
};

async function fetchCategoryTree(): Promise<CategoryNode[]> {
  return requestJson<CategoryNode[]>('/categories');
}

function flattenCategories(category: CategoryNode): CategoryNode[] {
  return [category, ...category.children.flatMap((child) => flattenCategories(child))];
}

function categoryMatches(category: CategoryNode, query: string): boolean {
  return flattenCategories(category).some((item) =>
    item.name.toLocaleLowerCase('tr-TR').includes(query),
  );
}

function formatCategoryName(name: string): string {
  return name
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

export default function CategoriesPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'mobile-directory'],
    queryFn: fetchCategoryTree,
    staleTime: 5 * 60_000,
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR');

  const rootCategories = useMemo(() => {
    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) => categoryMatches(category, normalizedSearch));
  }, [categories, normalizedSearch]);

  useEffect(() => {
    if (rootCategories.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    if (!activeCategoryId || !rootCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(rootCategories[0].id);
    }
  }, [activeCategoryId, rootCategories]);

  const activeCategory =
    rootCategories.find((category) => category.id === activeCategoryId) ?? rootCategories[0] ?? null;

  const visibleChildren = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    if (!normalizedSearch) {
      return activeCategory.children;
    }

    return activeCategory.children.filter((category) => categoryMatches(category, normalizedSearch));
  }, [activeCategory, normalizedSearch]);

  return (
    <div className='flex min-h-screen flex-col bg-slate-50 text-slate-900'>
      <MainHeader />

      <main className='flex-1 pb-28 lg:pb-10'>
        <section className='sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-2 sm:static sm:py-4'>
          <div className='mx-auto max-w-6xl'>
            <div className='flex items-end justify-between gap-4 sm:mb-3'>
              <div>
                <h1 className='text-base font-semibold tracking-tight text-slate-950 sm:text-xl'>
                  Kategoriler
                </h1>
                <p className='mt-1 hidden text-xs text-slate-500 sm:block'>
                  Ana kategori seçin, alt kategorileri sağdan inceleyin.
                </p>
              </div>
              <Link
                href='/'
                className='hidden text-xs font-medium text-[#003FB1] sm:inline-flex'
              >
                Ana sayfa
              </Link>
            </div>

            <div className='relative hidden sm:block'>
              <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400'>
                search
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className='h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100'
                placeholder='Kategori ara'
                type='search'
              />
            </div>
          </div>
        </section>

        <section className='mx-auto grid max-w-6xl grid-cols-[112px_minmax(0,1fr)] gap-0 px-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-4 sm:py-5'>
          <aside className='sticky top-[41px] h-[calc(100vh-121px)] overflow-y-auto border-r border-slate-200 bg-white sm:top-[73px] sm:h-[calc(100vh-160px)] sm:rounded-l-2xl sm:border sm:border-r-0'>
            {categoriesQuery.isLoading ? (
              <div className='space-y-2 p-2'>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className='h-11 rounded-lg bg-slate-100' />
                ))}
              </div>
            ) : null}

            {rootCategories.map((category) => {
              const isActive = activeCategory?.id === category.id;

              return (
                <button
                  key={category.id}
                  type='button'
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`flex min-h-[48px] w-full items-center border-l-4 px-2 py-2 text-left text-[12px] leading-snug transition sm:px-3 sm:text-sm ${
                    isActive
                      ? 'border-[#003FB1] bg-blue-50 text-[#003FB1]'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className='line-clamp-2 font-medium'>{formatCategoryName(category.name)}</span>
                </button>
              );
            })}
          </aside>

          <div className='min-h-[calc(100vh-121px)] bg-white sm:min-h-[calc(100vh-160px)] sm:rounded-r-2xl sm:border sm:border-l-0 sm:border-slate-200'>
            {categoriesQuery.isError ? (
              <div className='p-4 text-sm text-red-600'>Kategoriler yüklenirken hata oluştu.</div>
            ) : null}

            {!categoriesQuery.isLoading && !categoriesQuery.isError && activeCategory ? (
              <div className='p-4 sm:p-5'>
                {visibleChildren.length > 0 ? (
                  <div className='space-y-5'>
                    {visibleChildren.map((group) => (
                      <section key={group.id}>
                        <Link
                          href={`/kategori/${group.slug}`}
                          className='mb-2 flex items-center justify-between text-sm font-semibold text-slate-900'
                        >
                          <span>{formatCategoryName(group.name)}</span>
                          <span className='material-symbols-outlined text-[18px] text-slate-400'>
                            chevron_right
                          </span>
                        </Link>

                        {group.children.length > 0 ? (
                          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
                            {group.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/kategori/${child.slug}`}
                                className='min-h-[42px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium leading-snug text-slate-600 transition hover:border-[#003FB1] hover:bg-white hover:text-[#003FB1] sm:text-sm'
                              >
                                {formatCategoryName(child.name)}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                            href={`/kategori/${group.slug}`}
                            className='inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600'
                          >
                            Ürünleri gör
                          </Link>
                        )}
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500'>
                    Bu kategori altında gösterilecek alt kategori bulunamadı.
                  </div>
                )}
              </div>
            ) : null}

            {!categoriesQuery.isLoading &&
            !categoriesQuery.isError &&
            rootCategories.length === 0 ? (
              <div className='p-5 text-sm text-slate-500'>Aramanızla eşleşen kategori bulunamadı.</div>
            ) : null}
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
