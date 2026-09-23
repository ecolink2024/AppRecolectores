import { buildDeudaSheetItems, type DeudaSheetItem } from "@/lib/domain/deuda-sheet-sync";
import { isSheetsDeudaSyncConfigured } from "@/lib/env";
import {
  syncDeudasLedger,
  type DeudaSheetSyncResult,
} from "@/lib/integrations/sheets-deuda-sync";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const RECOLECCIONES_DEUDA_SELECT =
  "estado_operativo, monto_transferencia, monto_qr, deuda, telefono, telefono_normalizado, categoria_parada, tipo_servicio, dia";

export const DEUDA_SYNC_NO_CONFIGURADA =
  "No se cerró la ruta: el servidor no tiene conectada la planilla de deudas (SHEETS_DEUDA_WEBAPP_URL). Las transferencias y QR no se anotarían.";

export async function cargarItemsDeudaRuta(
  admin: AdminClient,
  rutaId: string,
): Promise<{ ok: true; items: DeudaSheetItem[] } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("ruta_recolecciones")
    .select(RECOLECCIONES_DEUDA_SELECT)
    .eq("ruta_id", rutaId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, items: buildDeudaSheetItems(data ?? []) };
}

/** Hay deudas para anotar y el servidor no puede escribir la planilla. */
export function deudaSyncBloqueaCierre(items: DeudaSheetItem[]): boolean {
  return items.length > 0 && !isSheetsDeudaSyncConfigured();
}

export async function escribirDeudasDeRuta(
  admin: AdminClient,
  rutaId: string,
): Promise<DeudaSheetSyncResult | { ok: false; error: string; attempted: false }> {
  const loaded = await cargarItemsDeudaRuta(admin, rutaId);
  if (!loaded.ok) return { attempted: false, ok: false, error: loaded.error };
  return syncDeudasLedger(loaded.items);
}
