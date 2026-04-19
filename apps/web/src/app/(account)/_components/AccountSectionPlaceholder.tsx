type AccountSectionPlaceholderProps = {
  text: string;
};

export function AccountSectionPlaceholder({
  text,
}: AccountSectionPlaceholderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {text}
    </div>
  );
}
