import { redirect } from "next/navigation";

import { OperarioKpisDashboard } from "@/components/panel/operario/operario-kpis-dashboard";
import { fetchOperarioKpisData } from "@/lib/data/operario-kpis";
import { requireAuth } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";
import { isSupabaseAdminConfigured } from "@/lib/env";

type Props = {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
};

export default async function PanelKpisPage({ searchParams }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/kpis");
  }

  if (!isStaffRole(auth.profile.role)) {
    redirect("/panel");
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar SUPABASE_SERVICE_ROLE_KEY para cargar los KPIs.
      </p>
    );
  }

  const params = await searchParams;
  const { kpis, serieMensual, filtro, error } = await fetchOperarioKpisData({
    periodo: params.periodo,
    desde: params.desde,
    hasta: params.hasta,
  });

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Error al cargar KPIs: {error}
        </p>
      )}
      <OperarioKpisDashboard
        kpis={kpis}
        serieMensual={serieMensual}
        filtroModo={filtro.modo}
        periodoPreset={filtro.periodoPreset}
      />
    </div>
  );
}
