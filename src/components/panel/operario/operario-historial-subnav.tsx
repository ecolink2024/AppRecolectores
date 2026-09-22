"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav
      aria-label="Secciones del historial"
      className="flex flex-wrap gap-2"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-emerald-700 text-white"
                : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
