import {
  buildRutaTotalesCierreUpdate,
  type RecoleccionMontoRow,
  type RutaGastosCierre,
} from "@/lib/domain/ruta-totales-cierre";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

function numGastos(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Recalcula y persiste `monto_efectivo`, `monto_transferencia` y `total_efectivo`
 * de la ruta a partir de las paradas visitadas y los gastos de cierre.
 */
export async function persistRutaTotalesCierre(
  admin: AdminClient,
  rutaId: string,
  options?: {
    /** Si se pasan, se usan estos gastos en lugar de leerlos de la ruta. */
    gastos?: Partial<RutaGastosCierre>;
    /** Si se pasan, se usan estas recolecciones en lugar de leerlas de la DB. */
    recolecciones?: RecoleccionMontoRow[];
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: ruta, error: rutaError } = await admin
    .from("rutas")
    .select("combustible, descuento, otros_gastos")
    .eq("id", rutaId)
    .maybeSingle();

  if (rutaError) return { ok: false, error: rutaError.message };
  if (!ruta) return { ok: false, error: "Ruta no encontrada" };

  const gastos: RutaGastosCierre = {
    combustible: options?.gastos?.combustible ?? numGastos(ruta.combustible),
    descuento: options?.gastos?.descuento ?? numGastos(ruta.descuento),
    otros_gastos: options?.gastos?.otros_gastos ?? numGastos(ruta.otros_gastos),
  };

  let recolecciones = options?.recolecciones;
  if (!recolecciones) {
    const { data: recs, error: recsError } = await admin
      .from("ruta_recolecciones")
      .select("estado_operativo, monto_efectivo, monto_transferencia, monto_qr")
      .eq("ruta_id", rutaId);

    if (recsError) return { ok: false, error: recsError.message };
    recolecciones = recs ?? [];
  }

  const built = buildRutaTotalesCierreUpdate(recolecciones, gastos);
  if (!built.ok) return built;

  const { error: updateError } = await admin
    .from("rutas")
    .update({
      monto_efectivo: built.data.monto_efectivo,
      monto_transferencia: built.data.monto_transferencia,
      total_efectivo: built.data.total_efectivo,
    })
    .eq("id", rutaId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}
