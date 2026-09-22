import { isParadaLogistica } from "@/lib/domain/parada-categoria";
import { normalizeArgPhone } from "@/lib/integrations/sheet-recoleccion-validation";

export type RecoleccionDeudaSyncInput = {
  estado_operativo: string | null;
  deuda: string | number | null;
  monto_transferencia: number | string | null;
  monto_qr: number | string | null;
  telefono?: string | null;
  telefono_normalizado?: string | null;
  categoria_parada?: string | null;
  tipo_servicio?: string | null;
};

export type DeudaSheetItem = {
  telefono: string;
  telefono_normalizado: string;
  phone_key: string;
  deuda: number;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clave comparable: dígitos locales AR (sin 54 ni 9 de celular). */
export function phoneMatchKey(raw: string | null | undefined): string {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9") && digits.length >= 10) digits = digits.slice(1);
  return digits;
}

export function parseDeudaMonto(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  const s = String(value).trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Deuda a escribir en el ledger (otra planilla): deuda importada + transferencia + QR.
 * No incluye efectivo. No cambia lo que se muestra en la app.
 */
export function buildDeudaSheetItems(
  recolecciones: RecoleccionDeudaSyncInput[],
): DeudaSheetItem[] {
  const byKey = new Map<string, DeudaSheetItem>();

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    if (isParadaLogistica(item)) continue;

    const transferencia = Math.max(0, num(item.monto_transferencia));
    const qr = Math.max(0, num(item.monto_qr));
    const cobroDigital = roundMoney(transferencia + qr);
    if (cobroDigital <= 0) continue;

    const telefonoRaw =
      item.telefono_normalizado?.trim() || item.telefono?.trim() || "";
    const normalized = normalizeArgPhone(telefonoRaw);
    const telefono = normalized.ok ? normalized.value : telefonoRaw;
    const key = phoneMatchKey(telefono);
    if (!key) continue;

    const deuda = roundMoney(parseDeudaMonto(item.deuda) + cobroDigital);
    const existing = byKey.get(key);
    if (existing) {
      existing.deuda = roundMoney(existing.deuda + cobroDigital);
      continue;
    }

    byKey.set(key, {
      telefono,
      telefono_normalizado: normalized.ok ? normalized.value : telefono,
      phone_key: key,
      deuda,
    });
  }

  return [...byKey.values()];
}
