import { normalizeArgPhone, parseTipoServicio } from "@/lib/integrations/sheet-recoleccion-validation";
import {
  RECOLECCION_OPERATIVA_ESTADOS,
  RUTA_ESTADOS,
  RUTA_TURNOS,
  type RutaEstado,
} from "@/lib/domain/constants";
import type { RecoleccionOperativaEstado, RutaTurno } from "@/types/database";

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function optionalStr(value: unknown): string | null {
  const s = str(value);
  return s || null;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export type RutaUpdatePayload = {
  nombre: string;
  fecha: string;
  turno: RutaTurno | null;
  estado: RutaEstado;
  asignado_a: string | null;
  observaciones_operario: string | null;
  km_recorridos: number | null;
};

export type RecoleccionFieldsPayload = {
  nombre: string;
  direccion: string;
  telefono: string;
  telefono_normalizado: string;
  unidad: string | null;
  tipo_servicio: string | null;
  frecuencia: string | null;
  precio: string | null;
  deuda: string | null;
  zona: string | null;
  barrio: string | null;
  depto: string | null;
  hora: string;
  estado_operativo: RecoleccionOperativaEstado;
  observaciones: string | null;
};

export type RecoleccionUpdatePayload = RecoleccionFieldsPayload & {
  clearGeocoding: boolean;
};

export function parseRutaUpdate(body: Record<string, unknown>):
  | { ok: true; data: RutaUpdatePayload }
  | { ok: false; error: string } {
  const nombre = str(body.nombre);
  const fecha = str(body.fecha);

  if (!nombre) return { ok: false, error: "El nombre es obligatorio" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: "Fecha inválida (usá AAAA-MM-DD)" };
  }

  const turnoRaw = optionalStr(body.turno);
  const turno =
    turnoRaw === null ? null : RUTA_TURNOS.includes(turnoRaw as RutaTurno) ? (turnoRaw as RutaTurno) : null;
  if (turnoRaw && !turno) return { ok: false, error: "Turno inválido" };

  const estado = str(body.estado) as RutaEstado;
  if (!RUTA_ESTADOS.includes(estado)) return { ok: false, error: "Estado inválido" };

  const asignado_a = optionalStr(body.asignado_a);

  return {
    ok: true,
    data: {
      nombre,
      fecha,
      turno,
      estado,
      asignado_a,
      observaciones_operario: optionalStr(body.observaciones_operario),
      km_recorridos: parseOptionalNumber(body.km_recorridos),
    },
  };
}

export function parseRecoleccionFields(body: Record<string, unknown>):
  | { ok: true; data: RecoleccionFieldsPayload }
  | { ok: false; error: string } {
  const nombre = str(body.nombre);
  const direccion = str(body.direccion);
  const telefono = str(body.telefono);
  const hora = str(body.hora);

  if (!nombre) return { ok: false, error: "El nombre es obligatorio" };
  if (!direccion) return { ok: false, error: "La dirección es obligatoria" };
  if (!telefono) return { ok: false, error: "El teléfono es obligatorio" };
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
    return { ok: false, error: "Horario inválido (usá HH:MM)" };
  }

  const phone = normalizeArgPhone(telefono);
  if (!phone.ok) return { ok: false, error: phone.error };

  const estado_operativo = str(body.estado_operativo) as RecoleccionOperativaEstado;
  if (!RECOLECCION_OPERATIVA_ESTADOS.includes(estado_operativo)) {
    return { ok: false, error: "Estado inválido" };
  }

  const horaNormalized = hora.length === 5 ? `${hora}:00` : hora;

  const tipoRaw = optionalStr(body.tipo_servicio);
  let tipo_servicio: string | null = null;
  if (tipoRaw) {
    const matched = parseTipoServicio(tipoRaw);
    if (!matched) {
      return {
        ok: false,
        error: "Tipo de cliente inválido (use Reciclaje, Mixto, Orgánico o Punto)",
      };
    }
    tipo_servicio = matched;
  }

  return {
    ok: true,
    data: {
      nombre,
      direccion,
      telefono,
      telefono_normalizado: phone.value,
      unidad: optionalStr(body.unidad),
      tipo_servicio,
      frecuencia: optionalStr(body.frecuencia),
      precio: optionalStr(body.precio),
      deuda: optionalStr(body.deuda),
      zona: optionalStr(body.zona),
      barrio: optionalStr(body.barrio),
      depto: optionalStr(body.depto),
      hora: horaNormalized,
      estado_operativo,
      observaciones: optionalStr(body.observaciones),
    },
  };
}

export function parseRecoleccionUpdate(
  body: Record<string, unknown>,
  currentDireccion: string,
): { ok: true; data: RecoleccionUpdatePayload } | { ok: false; error: string } {
  const parsed = parseRecoleccionFields(body);
  if (!parsed.ok) return parsed;

  return {
    ok: true,
    data: {
      ...parsed.data,
      clearGeocoding: parsed.data.direccion.trim() !== currentDireccion.trim(),
    },
  };
}
