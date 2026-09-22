import type { DeudaSheetItem } from "@/lib/domain/deuda-sheet-sync";
import { getSheetsDeudaWebappUrl, getSheetsImportSecret } from "@/lib/env";

export type DeudaSheetSyncResult = {
  attempted: boolean;
  ok: boolean;
  actualizadas?: number;
  no_encontradas?: string[];
  error?: string;
};

/**
 * Escribe deudas en el ledger vía Apps Script (Web App).
 * No lanza: un fallo no debe bloquear el cierre de ruta.
 */
export async function syncDeudasLedger(
  items: DeudaSheetItem[],
): Promise<DeudaSheetSyncResult> {
  if (items.length === 0) {
    return { attempted: false, ok: true };
  }

  const url = getSheetsDeudaWebappUrl();
  const secret = getSheetsImportSecret();
  if (!url || !secret) {
    console.warn(
      "[deuda-sheet] Falta SHEETS_DEUDA_WEBAPP_URL o SHEETS_IMPORT_SECRET; no se escribió el ledger.",
    );
    return { attempted: false, ok: true };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret,
        action: "sync-deudas",
        items: items.map((item) => ({
          telefono: item.telefono,
          telefono_normalizado: item.telefono_normalizado,
          phone_key: item.phone_key,
          deuda: item.deuda,
        })),
      }),
      signal: AbortSignal.timeout(15000),
    });

    const text = await response.text();
    let body: {
      ok?: boolean;
      actualizadas?: number;
      no_encontradas?: string[];
      error?: string;
    } = {};
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      console.error("[deuda-sheet] Respuesta no JSON:", response.status, text.slice(0, 300));
      return {
        attempted: true,
        ok: false,
        error: `Respuesta inválida del script (${response.status})`,
      };
    }

    if (!response.ok || body.ok === false) {
      const error = body.error || `HTTP ${response.status}`;
      console.error("[deuda-sheet]", error, body);
      return { attempted: true, ok: false, error };
    }

    if (body.no_encontradas && body.no_encontradas.length > 0) {
      console.warn("[deuda-sheet] Teléfonos sin fila en el ledger:", body.no_encontradas);
    }

    return {
      attempted: true,
      ok: true,
      actualizadas: body.actualizadas,
      no_encontradas: body.no_encontradas,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error al escribir deudas";
    console.error("[deuda-sheet]", error);
    return { attempted: true, ok: false, error };
  }
}
