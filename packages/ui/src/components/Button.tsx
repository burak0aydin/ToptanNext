import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-[0_8px_24px_-12px_rgba(26,86,219,0.7)]',
  secondary:
    'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', type = 'button', ...rest },
  ref,
) {
  const classes = [
    'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-200',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button ref={ref} type={type} className={classes} {...rest} />;
});
