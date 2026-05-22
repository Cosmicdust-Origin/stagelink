import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border border-dashed border-zinc-700 p-6 text-center", className)}>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
    </div>
  );
}
