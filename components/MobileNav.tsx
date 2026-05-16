"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, Radio, UserSquare2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/runs", icon: ScrollText, label: "Runs" },
  { href: "/sources", icon: Radio, label: "Sources" },
  { href: "/profiles", icon: UserSquare2, label: "Profiles" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px]",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
