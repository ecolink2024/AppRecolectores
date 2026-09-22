import { isIsoDate } from "@/lib/domain/operario-kpis";
import { normalizeArgPhone } from "@/lib/integrations/sheet-recoleccion-validation";

export const PUNTO_PAGO_SERVICIOS = [
  "bolsas_llenas_regalo",
  "bolsa_nueva",
  "propia_punto",
] as const;

export type PuntoPagoServicio = (typeof PUNTO_PAGO_SERVICIOS)[number];

export const PUNTO_PAGO_SERVICIO_LABELS: Record<PuntoPagoServicio, string> = {
  bolsas_llenas_regalo: "Bolsas llenas + nueva de regalo",
  bolsa_nueva: "Bolsa nueva",
  propia_punto: "Propia del punto",
};

export type PuntoPago = {
  id: string;
  fecha: string;
  nombre: string;
  celular: string;
  telefono_normalizado: string;
  servicio: PuntoPagoServicio;
  cantidad: number;
  monto: number;
  recoleccion_id: string | null;
  created_at: string;
};

export type PuntoPagoInput = {
  fecha: string;
  nombre: string;
  celular: string;
  telefono_normalizado: string;
  servicio: PuntoPagoServicio;
  cantidad: number;
  monto: number;
};

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseMonto(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function isPuntoPagoServicio(value: string): value is PuntoPagoServicio {
  return (PUNTO_PAGO_SERVICIOS as readonly string[]).includes(value);
}

export function parsePuntoPagoBody(
  body: Record<string, unknown>,
): { ok: true; data: PuntoPagoInput } | { ok: false; error: string } {
  const fecha = str(body.fecha);
  if (!fecha || !isIsoDate(fecha)) {
    return { ok: false, error: "Completá la fecha" };
  }

  const nombre = str(body.nombre);
  if (!nombre) {
    return { ok: false, error: "Completá el nombre" };
  }
  if (nombre.length > 150) {
    return { ok: false, error: "El nombre es demasiado largo" };
  }

  const celular = str(body.celular);
  if (!celular) {
    return { ok: false, error: "Completá el celular" };
  }
  const phone = normalizeArgPhone(celular);
  if (!phone.ok) {
    return { ok: false, error: phone.error };
  }

  const servicioRaw = str(body.servicio);
  if (!isPuntoPagoServicio(servicioRaw)) {
    return {
      ok: false,
      error: "Elegí el servicio (bolsas llenas + nueva de regalo, bolsa nueva o propia del punto)",
    };
  }

  const cantidad = parseCount(body.cantidad);
  if (cantidad === null) {
    return { ok: false, error: "Completá la cantidad (podés poner 0)" };
  }

  const monto = parseMonto(body.monto);
  if (monto === null) {
    return { ok: false, error: "Completá el monto (podés poner 0)" };
  }

  return {
    ok: true,
    data: {
      fecha,
      nombre,
      celular,
      telefono_normalizado: phone.value,
      servicio: servicioRaw,
      cantidad,
      monto,
    },
  };
}

export function toPuntoPago(row: {
  id: string;
  fecha: string;
  nombre: string;
  celular: string;
  telefono_normalizado: string;
  servicio: string;
  cantidad: number;
  monto: number | string;
  recoleccion_id: string | null;
  created_at: string;
}): PuntoPago | null {
  if (!isPuntoPagoServicio(row.servicio)) return null;
  const monto = typeof row.monto === "number" ? row.monto : Number(row.monto);
  if (!Number.isFinite(monto)) return null;
  return {
    id: row.id,
    fecha: String(row.fecha).slice(0, 10),
    nombre: row.nombre,
    celular: row.celular,
    telefono_normalizado: row.telefono_normalizado,
    servicio: row.servicio,
    cantidad: row.cantidad,
    monto,
    recoleccion_id: row.recoleccion_id,
    created_at: row.created_at,
  };
}
