import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "warn" | "danger";
}) {
  const toneRing = {
    default: "ring-border",
    accent: "ring-accent/40",
    warn: "ring-amber-500/40",
    danger: "ring-destructive/40",
  }[tone];
  const toneIcon = {
    default: "bg-secondary text-muted-foreground",
    accent: "bg-accent/15 text-accent",
    warn: "bg-amber-500/15 text-amber-400",
    danger: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <div className={cn("rounded-lg border bg-card p-4 ring-1", toneRing)}>
      <div className="flex items-center gap-3">
        <div className={cn("grid h-9 w-9 place-items-center rounded-md", toneIcon)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight mono">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
