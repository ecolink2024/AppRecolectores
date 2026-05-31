import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { RecolectorShell } from "@/components/panel/recolector/recolector-shell";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/constants";
import { canManageUsers } from "@/lib/auth/permissions";
import { isStaffRole } from "@/lib/domain/constants";

type Props = {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
};

export function PanelShell({ children, role, userName }: Props) {
  if (role === "recolector") {
    return <RecolectorShell userName={userName}>{children}</RecolectorShell>;
  }

  const links = [{ href: "/panel", label: isStaffRole(role) ? "Operativo" : "Inicio" }];

  if (canManageUsers({ role })) {
    links.push({ href: "/panel/usuarios", label: "Usuarios" });
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
              App Recolectores
            </p>
            <p className="text-sm text-zinc-600">
              {userName} · {ROLE_LABELS[role]}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-700 hover:text-emerald-800 dark:text-zinc-300"
              >
                {link.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-zinc-500 underline hover:text-zinc-800"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
