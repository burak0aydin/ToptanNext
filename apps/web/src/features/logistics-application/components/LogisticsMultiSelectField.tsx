'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Option<TValue extends string> = {
  value: TValue;
  label: string;
};

type LogisticsMultiSelectFieldProps<TValue extends string> = {
  label: string;
  placeholder: string;
  options: ReadonlyArray<Option<TValue>>;
  value: TValue[];
  onChange: (nextValue: TValue[]) => void;
  errorMessage?: string;
};

export function LogisticsMultiSelectField<TValue extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  errorMessage,
}: LogisticsMultiSelectFieldProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const selectedLabels = useMemo(() => {
    const selectedValues = new Set(value);
    return options.filter((option) => selectedValues.has(option.value)).map((option) => option.label);
  }, [options, value]);

  const toggleValue = (nextValue: TValue) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <div ref={rootRef} className='relative'>
      <span className='mb-2 block px-1 text-sm font-semibold text-on-surface'>{label}</span>
      <button
        className='flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-left shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={selectedLabels.length > 0 ? 'text-on-surface' : 'text-on-surface-variant'}>
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        <span className='material-symbols-outlined text-outline'>expand_more</span>
      </button>

      {isOpen ? (
        <div className='absolute z-20 mt-2 w-full rounded-xl border border-outline-variant/30 bg-white p-3 shadow-lg'>
          <div className='max-h-60 space-y-2 overflow-auto'>
            {options.map((option) => (
              <label key={option.value} className='flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-on-surface hover:bg-surface-container-low'>
                <input
                  className='h-4 w-4 accent-primary'
                  checked={value.includes(option.value)}
                  type='checkbox'
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className='mt-1 px-1 text-xs text-red-600'>{errorMessage}</p> : null}
    </div>
  );
}
