import { redirect } from "next/navigation";

import { OperarioHistorialPuntosTable } from "@/components/panel/operario/operario-historial-puntos-table";
import { OperarioHistorialSubnav } from "@/components/panel/operario/operario-historial-subnav";
import { OperarioKpisFiltroFechas } from "@/components/panel/operario/operario-kpis-filtro-fechas";
import { OperarioPuntoPagosPanel } from "@/components/panel/operario/operario-punto-pagos-panel";
import { fetchOperarioDashboardData } from "@/lib/data/operario-dashboard";
import { fetchPuntoPagos } from "@/lib/data/punto-pagos";
import { requireAuth } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";
import { buildHistorialPuntosRows } from "@/lib/domain/historial-puntos";
import { resolveKpiFiltroFechas } from "@/lib/domain/operario-kpis";
import { formatRutaFecha } from "@/lib/domain/rutas";
import { isSupabaseAdminConfigured } from "@/lib/env";

/** Filtro por query (`periodo` | `desde`+`hasta`): datos frescos. */
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
};

export default async function PanelHistorialPuntosPage({ searchParams }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/historial/puntos");
  }

  if (!isStaffRole(auth.profile.role)) {
    redirect("/panel");
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar SUPABASE_SERVICE_ROLE_KEY para cargar el historial de puntos.
      </p>
    );
  }

  const params = await searchParams;
  const filtroFechas = resolveKpiFiltroFechas(params);

  const { rutas, recolecciones, error } = await fetchOperarioDashboardData("historial", {
    fechas: { desde: filtroFechas.desde, hasta: filtroFechas.hasta },
  });
  const { items: pagos, error: pagosError } = await fetchPuntoPagos({
    desde: filtroFechas.desde,
    hasta: filtroFechas.hasta,
  });
  const rows = buildHistorialPuntosRows(rutas, recolecciones);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error al cargar historial: {error}
        </p>
      )}
      {pagosError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error al cargar pagos de punto: {pagosError}. Si falta la tabla, ejecutá
          supabase/apply-pending-operativo.sql en Supabase → SQL Editor.
        </p>
      )}
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Historial</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {filtroFechas.etiqueta} · {formatRutaFecha(filtroFechas.desde)} —{" "}
            {formatRutaFecha(filtroFechas.hasta)}. Recolecciones Empresa + Punto.
          </p>
        </div>
        <OperarioHistorialSubnav />
        <OperarioKpisFiltroFechas
          desde={filtroFechas.desde}
          hasta={filtroFechas.hasta}
          modo={filtroFechas.modo}
          periodoPreset={filtroFechas.periodoPreset}
          basePath="/panel/historial/puntos"
        />
        <OperarioPuntoPagosPanel initialPagos={pagos} />
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Recolecciones</h2>
            <p className="text-sm text-zinc-500">
              Una fila por recolección Empresa + Punto, ordenadas por fecha (más reciente primero).
            </p>
          </div>
          <OperarioHistorialPuntosTable rows={rows} />
        </section>
      </div>
    </div>
  );
}
