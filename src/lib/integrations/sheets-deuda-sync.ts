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
 * No lanza. Si falta la URL, el cierre se rechaza antes de marcar la ruta.
 * Si Google falla después del cierre, el resultado vuelve en la respuesta.
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
    const error =
      "El servidor no tiene conectada la planilla de deudas (SHEETS_DEUDA_WEBAPP_URL). Las transferencias y QR no se anotaron.";
    console.error("[deuda-sheet]", error);
    return { attempted: false, ok: false, error };
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
          fecha: item.fecha,
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

/** Texto para el operario. Null si no hay nada que avisar. */
export function avisoPlanillaDeudas(
  result: DeudaSheetSyncResult,
  options?: { rutaCerrada?: boolean },
): string | null {
  const noEncontradas = result.no_encontradas?.filter(Boolean) ?? [];
  if (!result.ok) {
    const detalle = result.error ?? "No se pudo escribir la planilla de deudas.";
    if (options?.rutaCerrada) {
      return `La ruta quedó cerrada, pero la planilla de deudas no se actualizó. ${detalle}`;
    }
    return detalle;
  }
  if (noEncontradas.length > 0) {
    const lista = noEncontradas.join(", ");
    const detalle = `Estos teléfonos no están en la planilla de deudas: ${lista}.`;
    if (options?.rutaCerrada) {
      return `La ruta quedó cerrada. ${detalle}`;
    }
    return detalle;
  }
  return null;
}
