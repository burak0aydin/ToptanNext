import { InputHTMLAttributes, forwardRef } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className = '', ...rest },
  ref,
) {
  const classes = [
    'h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-200',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <input ref={ref} type='checkbox' className={classes} {...rest} />;
});
