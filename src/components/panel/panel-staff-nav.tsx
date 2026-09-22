"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/login/actions";

type NavLink = {
  href: string;
  label: string;
  match?: (path: string) => boolean;
};

const STAFF_LINKS: NavLink[] = [
  { href: "/panel", label: "Operativo", match: (path) => path === "/panel" },
  { href: "/panel/kpis", label: "KPIs" },
  { href: "/panel/historial", label: "Historial", match: (path) => path === "/panel/historial" },
  {
    href: "/panel/historial/puntos",
    label: "Puntos",
    match: (path) => path.startsWith("/panel/historial/puntos"),
  },
  { href: "/panel/parametros", label: "Parámetros" },
];

type Props = {
  canManageUsers: boolean;
};

export function PanelStaffNav({ canManageUsers }: Props) {
  const pathname = usePathname();
  const links: NavLink[] = [
    ...STAFF_LINKS,
    ...(canManageUsers ? [{ href: "/panel/usuarios", label: "Usuarios" }] : []),
  ];

  return (
    <nav className="flex flex-wrap items-center gap-4">
      {links.map((link) => {
        const active = link.match ? link.match(pathname) : pathname === link.href;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`text-sm font-medium ${
              active
                ? "text-emerald-800 underline decoration-emerald-400 underline-offset-4 dark:text-emerald-300"
                : "text-zinc-700 hover:text-emerald-800 dark:text-zinc-300"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm text-zinc-500 underline hover:text-zinc-800"
        >
          Salir
        </button>
      </form>
    </nav>
  );
}
