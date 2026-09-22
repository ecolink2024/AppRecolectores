import { RecolectorShell } from "@/components/panel/recolector/recolector-shell";
import { PanelStaffNav } from "@/components/panel/panel-staff-nav";
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
          <PanelStaffNav canManageUsers={canManageUsers({ role })} />
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
