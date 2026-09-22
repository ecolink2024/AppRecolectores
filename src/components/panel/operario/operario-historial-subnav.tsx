"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/panel/historial", label: "Rutas", match: (path: string) => path === "/panel/historial" },
  {
    href: "/panel/historial/puntos",
    label: "Puntos",
    match: (path: string) => path.startsWith("/panel/historial/puntos"),
  },
] as const;

export function OperarioHistorialSubnav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  return (
    <nav
      aria-label="Secciones del historial"
      className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${suffix}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-700 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
