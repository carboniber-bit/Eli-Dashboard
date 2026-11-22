import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-[#a34f4f]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-taupe">{hint}</span>
      ) : null}
    </label>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-serif text-2xl font-semibold text-cacau">{title}</p>
      <p className="max-w-sm text-sm text-taupe">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
