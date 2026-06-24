import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildSerieMensualRecaudacion,
  rangoMesesSerieRecaudacion,
  type KpiSerieMes,
} from "@/lib/domain/operario-kpis";
import type { Database } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export async function fetchSerieMensualRecaudacion(
  admin: SupabaseClient<Database>,
): Promise<{ serie: KpiSerieMes[]; error: string | null }> {
  const { desdeMes, hastaMes, desdeFecha, hastaFecha } = rangoMesesSerieRecaudacion();

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
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
    const { data, error: recError } = await admin
      .from("ruta_recolecciones")
      .select("*")
      .in("ruta_id", rutaIds);

    if (recError) {
      return { serie: [], error: recError.message };
    }
    recolecciones = data ?? [];
  }

  return {
    serie: buildSerieMensualRecaudacion(rutasRows, recolecciones, desdeMes, hastaMes),
    error: null,
  };
}
