import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildSerieMensualRecaudacion,
  rangoMesesSerieRecaudacion,
  type KpiSerieMes,
} from "@/lib/domain/operario-kpis";
import { fetchRecoleccionesForRutaIds } from "@/lib/data/ruta-recolecciones-fetch";
import { RUTA_ESTADOS_KPI_IMPACTO } from "@/lib/domain/ruta-estado-transiciones";
import type { Database } from "@/types/database";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export async function fetchSerieMensualRecaudacion(
  admin: SupabaseClient<Database>,
): Promise<{ serie: KpiSerieMes[]; error: string | null }> {
  const { desdeMes, hastaMes, desdeFecha, hastaFecha } = rangoMesesSerieRecaudacion();

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
    .in("estado", RUTA_ESTADOS_KPI_IMPACTO)
    .gte("fecha", desdeFecha)
    .lte("fecha", hastaFecha)
    .order("fecha", { ascending: true })
    .limit(15000);

  if (rutasError) {
    return { serie: [], error: rutasError.message };
  }

  const rutasRows = rutas ?? [];
  const rutaIds = rutasRows.map((r) => r.id);
  let recolecciones: RecoleccionRow[] = [];

  if (rutaIds.length > 0) {
    try {
      recolecciones = await fetchRecoleccionesForRutaIds(admin, rutaIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar recolecciones";
      return { serie: [], error: message };
    }
  }

  return {
    serie: buildSerieMensualRecaudacion(rutasRows, recolecciones, desdeMes, hastaMes),
    error: null,
  };
}
