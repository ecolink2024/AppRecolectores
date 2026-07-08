import { redirect } from "next/navigation";

import { OperarioDashboard } from "@/components/panel/operario/operario-dashboard";
import { fetchOperarioDashboardData } from "@/lib/data/operario-dashboard";
import {
  fetchPrecioBolsaExtraActivo,
  fetchPrecioBolsaLlenaPuntoActivo,
  fetchPrecioBolsaPuntoActivo,
  fetchPrecioRetiroReciclableMixtoActivo,
} from "@/lib/data/sistema-parametros";
import { requireAuth } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";
import { getGoogleMapsPublicKey, isSupabaseAdminConfigured } from "@/lib/env";

export default async function PanelHistorialPage() {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/historial");
  }

  if (!isStaffRole(auth.profile.role)) {
    redirect("/panel");
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar SUPABASE_SERVICE_ROLE_KEY para cargar el historial de rutas.
      </p>
    );
  }

  const { rutas, recolecciones, recolectores, error } =
    await fetchOperarioDashboardData("historial");
  const [bolsaExtra, retiroReciclableMixto, bolsaPunto, bolsaLlenaPunto] = await Promise.all([
    fetchPrecioBolsaExtraActivo(),
    fetchPrecioRetiroReciclableMixtoActivo(),
    fetchPrecioBolsaPuntoActivo(),
    fetchPrecioBolsaLlenaPuntoActivo(),
  ]);
  const operarioNombre =
    auth.profile.full_name || auth.profile.email || auth.user.email || "Operario";

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Error al cargar historial: {error}
        </p>
      )}
      <OperarioDashboard
        variant="historial"
        rutas={rutas}
        recolecciones={recolecciones}
        recolectores={recolectores}
        operarioNombre={operarioNombre}
        mapsApiKey={getGoogleMapsPublicKey() ?? null}
        preciosCampo={{ bolsaExtra, retiroReciclableMixto, bolsaPunto, bolsaLlenaPunto }}
      />
    </div>
  );
}
