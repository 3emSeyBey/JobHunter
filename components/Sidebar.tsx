"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, Radio, UserSquare2, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: ScrollText },
  { href: "/sources", label: "Sources", icon: Radio },
  { href: "/profiles", label: "Profiles", icon: UserSquare2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card/40 backdrop-blur">
      <div className="px-5 py-5 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-foreground">
            <Search className="h-4 w-4" />
          </span>
          JobHunter
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          dev · psych
        </p>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-5 py-3 text-[11px] text-muted-foreground">
        <span className="mono">v0.1 · supabase + GH actions</span>
      </div>
    </aside>
  );
}
