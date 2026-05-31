import type { Database, RecoleccionOperativaEstado, RutaTurno } from "@/types/database";
import {
  RUTA_ESTADO_OPERARIO_LABELS,
  RUTA_TURNO_LABELS,
  type RutaEstado,
} from "@/lib/domain/constants";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type RutaOperarioRow = {
  id: string;
  fecha: string;
  turno: RutaTurno | null;
  estado: RutaEstado;
  nombre: string;
  recolector_nombre: string | null;
  puntos_recoleccion: number;
  recolecciones_exitosas: number;
  recolecciones_pendientes: number;
  recolecciones_canceladas: number;
  km_recorridos: number | null;
  inicio_jornada_at: string | null;
  cierre_recolector_at: string | null;
  cierre_operario_at: string | null;
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  total_recaudado: number;
  observaciones_operario: string | null;
};

export type RecoleccionOperarioRow = {
  id: string;
  ruta_id: string;
  orden: number;
  zona: string | null;
  estado_operativo: RecoleccionOperativaEstado;
  direccion: string;
  hora_programada: string;
  nombre: string;
  hora_real: string | null;
  precio_total: number | null;
  precio_tarifa: string | null;
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  observaciones: string | null;
  detalle: string | null;
  firma_digital: string | null;
  nombre_firmante: string | null;
};

export type RutaDetalleOperario = {
  id: string;
  fecha: string;
  turno: RutaTurno | null;
  estado: RutaEstado;
  estado_label: string;
  recolector_nombre: string | null;
  recolecciones_exitosas: number;
  recolecciones_pendientes: number;
  recolecciones_canceladas: number;
  total_recaudado: number;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sumRecaudado(recolecciones: RecoleccionRow[]): number {
  return recolecciones.reduce((acc, r) => {
    const total =
      r.precio_total != null
        ? num(r.precio_total)
        : num(r.monto_efectivo) + num(r.monto_transferencia);
    return acc + total;
  }, 0);
}

export function buildRutaOperarioRows(
  rutas: RutaRow[],
  recolecciones: RecoleccionRow[],
  recolectores: Pick<ProfileRow, "id" | "full_name" | "email">[],
): RutaOperarioRow[] {
  const recMap = new Map(
    recolectores.map((r) => [r.id, r.full_name || r.email]),
  );
  const byRuta = new Map<string, RecoleccionRow[]>();
  for (const item of recolecciones) {
    const list = byRuta.get(item.ruta_id) ?? [];
    list.push(item);
    byRuta.set(item.ruta_id, list);
  }

  return rutas.map((ruta) => {
    const items = byRuta.get(ruta.id) ?? [];
    const exitosas = items.filter((i) => i.estado_operativo === "visitada").length;
    const pendientes = items.filter((i) =>
      ["pendiente", "en_camino"].includes(i.estado_operativo),
    ).length;
    const canceladas = items.filter((i) =>
      ["cancelada", "omitida"].includes(i.estado_operativo),
    ).length;

    const recaudadoRecolecciones = sumRecaudado(items);
    const efectivoRuta = ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : null;
    const transferenciaRuta =
      ruta.monto_transferencia != null ? num(ruta.monto_transferencia) : null;
    const total_recaudado =
      efectivoRuta != null || transferenciaRuta != null
        ? num(efectivoRuta) + num(transferenciaRuta)
        : recaudadoRecolecciones;

    return {
      id: ruta.id,
      fecha: ruta.fecha,
      turno: ruta.turno,
      estado: ruta.estado,
      nombre: ruta.nombre,
      recolector_nombre: ruta.asignado_a
        ? (recMap.get(ruta.asignado_a) ?? null)
        : null,
      puntos_recoleccion: items.length,
      recolecciones_exitosas: exitosas,
      recolecciones_pendientes: pendientes,
      recolecciones_canceladas: canceladas,
      km_recorridos: ruta.km_recorridos != null ? num(ruta.km_recorridos) : null,
      inicio_jornada_at: ruta.inicio_jornada_at,
      cierre_recolector_at: ruta.cierre_recolector_at,
      cierre_operario_at: ruta.cierre_operario_at,
      monto_efectivo: efectivoRuta,
      monto_transferencia: transferenciaRuta,
      total_recaudado,
      observaciones_operario: ruta.observaciones_operario,
    };
  });
}

export function buildRecoleccionOperarioRows(
  recolecciones: RecoleccionRow[],
): RecoleccionOperarioRow[] {
  return recolecciones
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((item) => ({
      id: item.id,
      ruta_id: item.ruta_id,
      orden: item.orden,
      zona: item.zona,
      estado_operativo: item.estado_operativo,
      direccion: item.direccion,
      hora_programada: String(item.hora).slice(0, 5),
      nombre: item.nombre,
      hora_real: item.hora_real,
      precio_total:
        item.precio_total != null
          ? num(item.precio_total)
          : num(item.monto_efectivo) + num(item.monto_transferencia) > 0
            ? num(item.monto_efectivo) + num(item.monto_transferencia)
            : null,
      precio_tarifa: item.precio,
      monto_efectivo: item.monto_efectivo != null ? num(item.monto_efectivo) : null,
      monto_transferencia:
        item.monto_transferencia != null ? num(item.monto_transferencia) : null,
      observaciones: item.observaciones,
      detalle: item.detalle,
      firma_digital: item.firma_digital,
      nombre_firmante: item.nombre_firmante,
    }));
}

export function buildRutaDetalle(
  ruta: RutaOperarioRow,
): RutaDetalleOperario {
  return {
    id: ruta.id,
    fecha: ruta.fecha,
    turno: ruta.turno,
    estado: ruta.estado,
    estado_label: RUTA_ESTADO_OPERARIO_LABELS[ruta.estado],
    recolector_nombre: ruta.recolector_nombre,
    recolecciones_exitosas: ruta.recolecciones_exitosas,
    recolecciones_pendientes: ruta.recolecciones_pendientes,
    recolecciones_canceladas: ruta.recolecciones_canceladas,
    total_recaudado: ruta.total_recaudado,
  };
}

/** Ruta más próxima a ocurrir (fecha + turno). */
export function pickDefaultRutaId(rutas: RutaOperarioRow[]): string | null {
  if (rutas.length === 0) return null;

  const now = Date.now();
  let bestFuture: { id: string; diff: number } | null = null;
  let bestPast: { id: string; diff: number } | null = null;

  for (const ruta of rutas) {
    const hour = ruta.turno === "tarde" ? 14 : 8;
    const ts = new Date(`${ruta.fecha}T${String(hour).padStart(2, "0")}:00:00`).getTime();
    const diff = ts - now;
    if (diff >= 0) {
      if (!bestFuture || diff < bestFuture.diff) {
        bestFuture = { id: ruta.id, diff };
      }
    } else if (!bestPast || diff > bestPast.diff) {
      bestPast = { id: ruta.id, diff };
    }
  }

  return bestFuture?.id ?? bestPast?.id ?? rutas[0]?.id ?? null;
}

export function formatTurno(turno: RutaTurno | null): string {
  if (!turno) return "—";
  return RUTA_TURNO_LABELS[turno];
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHoraReal(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export { formatRutaFecha, formatRutaEstado } from "@/lib/domain/rutas";
