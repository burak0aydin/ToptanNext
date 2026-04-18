import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}