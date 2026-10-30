import { isParadaLogistica } from "@/lib/domain/parada-categoria";
import { isTipoServicioMixto } from "@/lib/domain/sistema-parametros";
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
  /** Día de la recolección, `YYYY-MM-DD`. */
  dia?: string | null;
};

export type DeudaSheetItem = {
  telefono: string;
  telefono_normalizado: string;
  phone_key: string;
  deuda: number;
  /** Día de la recolección, `YYYY-MM-DD`, o null si no vino. */
  fecha: string | null;
};

/** Fecha de última recolección (columna P). Solo paradas visitadas. */
export type UltimaRecoleccionItem = {
  telefono: string;
  telefono_normalizado: string;
  phone_key: string;
  /** Día de la recolección, `YYYY-MM-DD`. */
  fecha: string;
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

/** Día de recolección en `YYYY-MM-DD`. Acepta un ISO con hora y se queda con la fecha. */
export function parseFechaRecoleccion(value: string | null | undefined): string | null {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Deuda importada con signo. Un negativo resta; vacío o inválido vale 0. */
export function parseDeudaMonto(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const s = String(value).trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function resolvePhone(item: RecoleccionDeudaSyncInput): {
  telefono: string;
  telefono_normalizado: string;
  phone_key: string;
} | null {
  const telefonoRaw = item.telefono_normalizado?.trim() || item.telefono?.trim() || "";
  const normalized = normalizeArgPhone(telefonoRaw);
  const telefono = normalized.ok ? normalized.value : telefonoRaw;
  const phone_key = phoneMatchKey(telefono);
  if (!phone_key) return null;
  return {
    telefono,
    telefono_normalizado: normalized.ok ? normalized.value : telefono,
    phone_key,
  };
}

/**
 * Deuda a escribir en el ledger (otra planilla): deuda importada + transferencia + QR.
 * Si la deuda importada es negativa, resta. No incluye efectivo. Mixto no se escribe.
 * No cambia lo que se muestra en la app.
 */
export function buildDeudaSheetItems(
  recolecciones: RecoleccionDeudaSyncInput[],
): DeudaSheetItem[] {
  const byKey = new Map<string, DeudaSheetItem>();

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    if (isParadaLogistica(item)) continue;
    if (isTipoServicioMixto(item.tipo_servicio)) continue;

    const transferencia = Math.max(0, num(item.monto_transferencia));
    const qr = Math.max(0, num(item.monto_qr));
    const cobroDigital = roundMoney(transferencia + qr);
    if (cobroDigital <= 0) continue;

    const phone = resolvePhone(item);
    if (!phone) continue;

    const deuda = roundMoney(parseDeudaMonto(item.deuda) + cobroDigital);
    const fecha = parseFechaRecoleccion(item.dia);
    const existing = byKey.get(phone.phone_key);
    if (existing) {
      existing.deuda = roundMoney(existing.deuda + cobroDigital);
      if (fecha && (!existing.fecha || fecha > existing.fecha)) {
        existing.fecha = fecha;
      }
      continue;
    }

    byKey.set(phone.phone_key, {
      telefono: phone.telefono,
      telefono_normalizado: phone.telefono_normalizado,
      phone_key: phone.phone_key,
      deuda,
      fecha,
    });
  }

  return [...byKey.values()];
}

/**
 * Columna P: día de cada parada visitada, también en efectivo y en Mixto.
 * No entran canceladas, omitidas, pendientes ni paradas logísticas.
 * Si el mismo teléfono se visitó más de una vez, queda la fecha más nueva.
 */
export function buildUltimaRecoleccionItems(
  recolecciones: RecoleccionDeudaSyncInput[],
): UltimaRecoleccionItem[] {
  const byKey = new Map<string, UltimaRecoleccionItem>();

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    if (isParadaLogistica(item)) continue;

    const fecha = parseFechaRecoleccion(item.dia);
    if (!fecha) continue;

    const phone = resolvePhone(item);
    if (!phone) continue;

    const existing = byKey.get(phone.phone_key);
    if (existing && existing.fecha >= fecha) continue;

    byKey.set(phone.phone_key, {
      telefono: phone.telefono,
      telefono_normalizado: phone.telefono_normalizado,
      phone_key: phone.phone_key,
      fecha,
    });
  }

  return [...byKey.values()];
}
