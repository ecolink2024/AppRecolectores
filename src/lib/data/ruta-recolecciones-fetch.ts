import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

const RECOLECCIONES_PAGE_SIZE = 1000;

/**
 * Supabase devuelve como máximo 1000 filas por consulta. Historial/KPIs pueden
 * superar ese tope al cargar paradas de muchas rutas a la vez.
 */
export async function fetchRecoleccionesForRutaIds(
  admin: SupabaseClient<Database>,
  rutaIds: string[],
): Promise<RecoleccionRow[]> {
  if (rutaIds.length === 0) return [];

  const all: RecoleccionRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await admin
      .from("ruta_recolecciones")
      .select("*")
      .in("ruta_id", rutaIds)
      .order("ruta_id", { ascending: true })
      .order("orden", { ascending: true })
      .range(from, from + RECOLECCIONES_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < RECOLECCIONES_PAGE_SIZE) break;
    from += RECOLECCIONES_PAGE_SIZE;
  }

  return all;
}
