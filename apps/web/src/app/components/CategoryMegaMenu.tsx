'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

export type CategoryMegaMenuItem = {
  id: string;
  name: string;
  href: string;
};

export type CategoryMegaMenuGroup = {
  id: string;
  title: string;
  href: string;
  items: CategoryMegaMenuItem[];
};

export type CategoryMegaMenuCategory = {
  id: string;
  name: string;
  href: string;
  groups: CategoryMegaMenuGroup[];
};

type CategoryMegaMenuProps = {
  categories: CategoryMegaMenuCategory[];
  isLoading: boolean;
  isError: boolean;
};

const VISIBLE_CATEGORY_COUNT = 7;
const CATEGORY_ROW_HEIGHT = 64;
const MENU_HEIGHT = VISIBLE_CATEGORY_COUNT * CATEGORY_ROW_HEIGHT;

function toDisplayLabel(value: string): string {
  const words = value
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .filter(Boolean);

  return words
    .map((word) => `${word.charAt(0).toLocaleUpperCase('tr-TR')}${word.slice(1)}`)
    .join(' ');
}

export function CategoryMegaMenu({
  categories,
  isLoading,
  isError,
}: CategoryMegaMenuProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!categories.length) {
      setActiveCategoryId(null);
      return;
    }

    setActiveCategoryId((prev) => {
      if (prev && categories.some((category) => category.id === prev)) {
        return prev;
      }

      return categories[0].id;
    });
  }, [categories]);

  const activeCategory = useMemo(() => {
    if (!categories.length) {
      return null;
    }

    if (!activeCategoryId) {
      return categories[0];
    }

    return categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  }, [activeCategoryId, categories]);

  const handleRightPanelScroll = () => {
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;

    if (!leftPanel || !rightPanel) {
      return;
    }

    const rightMax = rightPanel.scrollHeight - rightPanel.clientHeight;
    const leftMax = leftPanel.scrollHeight - leftPanel.clientHeight;

    if (rightMax <= 0 || leftMax <= 0) {
      return;
    }

    const scrollRatio = rightPanel.scrollTop / rightMax;
    leftPanel.scrollTop = scrollRatio * leftMax;
  };

  return (
    <div className='w-full overflow-hidden border-b border-slate-200 bg-white shadow-xl' style={{ height: MENU_HEIGHT }}>
      <div className='flex h-full'>
        <aside className='h-full w-64 shrink-0 border-r border-slate-200 bg-slate-50'>
          <div ref={leftPanelRef} className='h-full overflow-y-auto'>
            {isLoading ? (
              <p className='px-4 py-4 text-sm text-slate-500'>Kategoriler yükleniyor...</p>
            ) : null}

            {isError ? (
              <p className='px-4 py-4 text-sm text-red-600'>Kategoriler yüklenirken hata oluştu.</p>
            ) : null}

            {!isLoading && !isError && !categories.length ? (
              <p className='px-4 py-4 text-sm text-slate-500'>Gösterilecek kategori bulunamadı.</p>
            ) : null}

            {!isLoading && !isError ? (
              <ul>
                {categories.map((category) => {
                  const isActive = activeCategory?.id === category.id;

                  return (
                    <li key={category.id}>
                      <Link
                        className={`flex h-16 items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-white text-primary'
                            : 'text-slate-700 hover:bg-white hover:text-primary'
                        }`}
                        href={category.href}
                        onMouseEnter={() => {
                          setActiveCategoryId(category.id);

                          if (rightPanelRef.current) {
                            rightPanelRef.current.scrollTop = 0;
                          }
                        }}
                      >
                        <span>{toDisplayLabel(category.name)}</span>
                        <span className='material-symbols-outlined text-base'>chevron_right</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </aside>

        <section
          ref={rightPanelRef}
          className='h-full flex-1 overflow-y-auto bg-white p-6'
          onScroll={handleRightPanelScroll}
        >
          {isLoading ? <p className='text-sm text-slate-500'>Alt kategoriler hazırlanıyor...</p> : null}
          {isError ? <p className='text-sm text-red-600'>Alt kategori listesi yüklenemedi.</p> : null}

          {!isLoading && !isError && activeCategory ? (
            <div className='space-y-5'>
              <Link
                className='inline-flex items-center gap-1 text-base font-bold text-primary hover:underline'
                href={activeCategory.href}
              >
                {toDisplayLabel(activeCategory.name)}
                <span className='material-symbols-outlined text-base'>chevron_right</span>
              </Link>

              {activeCategory.groups.length ? (
                <div className='grid grid-cols-3 gap-8 xl:grid-cols-4'>
                  {activeCategory.groups.map((group) => (
                    <div key={group.id} className='space-y-3'>
                      <Link
                        className='inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline'
                        href={group.href}
                      >
                        {toDisplayLabel(group.title)}
                        <span className='material-symbols-outlined text-sm'>chevron_right</span>
                      </Link>

                      <div className='flex flex-col space-y-2'>
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            className='text-sm text-slate-600 transition-colors hover:text-primary hover:underline'
                            href={item.href}
                          >
                            {toDisplayLabel(item.name)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-slate-500'>Bu kategori altında henüz alt başlık bulunmuyor.</p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
