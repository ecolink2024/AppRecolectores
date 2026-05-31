import Link from "next/link";

import { OperarioDashboard } from "@/components/panel/operario/operario-dashboard";
import { MisRutasCards } from "@/components/panel/recolector/mis-rutas-cards";
import { canManageUsers } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { fetchOperarioDashboardData } from "@/lib/data/operario-dashboard";
import { formatRutaFecha } from "@/lib/domain/rutas";
import { isStaffRole } from "@/lib/domain/constants";
import { getGoogleMapsPublicKey, isSupabaseAdminConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function PanelHomePage() {
  const { user, profile } = await getSessionUser();
  const staff = profile && isStaffRole(profile.role);
  const isRecolector = profile?.role === "recolector";

  let rutasRecolector: Awaited<
    ReturnType<typeof fetchRutasRecolector>
  > = [];

  if (isRecolector && user) {
    rutasRecolector = await fetchRutasRecolector(user.id);
  }

  const rutasHoy = rutasRecolector.filter((r) => r.fecha === todayIso());

  if (isRecolector) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Hola, {profile?.full_name?.split(" ")[0] ?? "recolector"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rutasHoy.length > 0
              ? `Tenés ${rutasHoy.length} ruta(s) para hoy.`
              : "Revisá tus rutas asignadas."}
          </p>
        </div>

        {rutasHoy.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Hoy · {formatRutaFecha(todayIso())}
            </h2>
            <MisRutasCards rutas={rutasHoy} compact />
          </section>
        )}

        <Link
          href="/panel/mis-rutas"
          className="flex min-h-[3.25rem] items-center justify-center rounded-2xl bg-emerald-700 px-4 text-base font-semibold text-white active:bg-emerald-800"
        >
          Ver todas mis rutas
        </Link>

        {rutasRecolector.length > rutasHoy.length && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Próximas / anteriores
            </h2>
            <MisRutasCards
              rutas={rutasRecolector.filter((r) => r.fecha !== todayIso()).slice(0, 3)}
              compact
            />
          </section>
        )}
      </div>
    );
  }

  if (staff && isSupabaseAdminConfigured()) {
    const { rutas, recolecciones, error } = await fetchOperarioDashboardData();
    const operarioNombre = profile?.full_name || profile?.email || user?.email || "Operario";

    return (
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error al cargar rutas: {error}. ¿Aplicaste las migraciones de rutas?
          </p>
        )}
        <OperarioDashboard
          rutas={rutas}
          recolecciones={recolecciones}
          operarioNombre={operarioNombre}
          mapsApiKey={getGoogleMapsPublicKey() ?? null}
        />
        {profile && canManageUsers(profile) && (
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Link
              href="/panel/usuarios"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
            >
              Gestionar usuarios →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Panel operativo
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Bienvenido a App Recolectores.
        </p>
      </div>
      {!isSupabaseAdminConfigured() && staff && (
        <p className="text-sm text-red-600">
          Falta configurar SUPABASE_SERVICE_ROLE_KEY para cargar el panel operativo.
        </p>
      )}
    </div>
  );
}

async function fetchRutasRecolector(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rutas")
    .select("*")
    .eq("asignado_a", userId)
    .order("fecha", { ascending: false })
    .limit(20);
  return data ?? [];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
