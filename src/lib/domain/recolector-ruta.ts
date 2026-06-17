import { formatInsumosResumen, insumosOperarioCompletados, parseInsumosFromJson, type InsumoInicio } from "@/lib/domain/ruta-insumos";
import {
  RECOLECCION_OPERATIVA_LABELS,
  RUTA_TURNO_LABELS,
} from "@/lib/domain/constants";
import { formatRutaFecha } from "@/lib/domain/rutas";
import { evaluarFinalizarRuta } from "@/lib/domain/recolector-finalizar-ruta";
import { recoleccionCerradaParaRecolector } from "@/lib/domain/recolector-recoleccion-campo";
import type { Database, RutaEstado, RutaTurno } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

/** Etiquetas de estado para el recolector en campo */
export const RECOLECTOR_RUTA_ESTADO_LABELS: Record<RutaEstado, string> = {
  borrador: "Pendiente",
  activa: "Pendiente",
  en_curso: "En proceso",
  completada: "Finalizada",
  cerrada: "Finalizada",
  cancelada: "Cancelada",
  suspendida: "Suspendida",
};

export type RecolectorRutaDetalle = {
  id: string;
  nombre: string;
  fecha: string;
  fechaLabel: string;
  turno: RutaTurno | null;
  turnoLabel: string;
  estado: RutaEstado;
  estadoLabel: string;
  inicioJornadaAt: string | null;
  kmInicial: number | null;
  insumosInicio: InsumoInicio[];
  insumosResumen: string;
  insumosOperario: InsumoInicio[];
  insumosOperarioResumen: string;
  preparacionInsumosCompleta: boolean;
  montoARecaudar: number;
  recaudadoEfectivo: number;
  recaudadoTransferencia: number;
  recaudadoQr: number;
  totalRecaudado: number;
  efectivoRecaudado: number;
  totalEfectivo: number | null;
  recoleccionesCount: number;
  puedeIniciar: boolean;
  rutaIniciada: boolean;
  rutaFinalizada: boolean;
  rutaSuspendida: boolean;
  puedeFinalizar: boolean;
  recoleccionesPendientes: number;
  mensajeFinalizar: string | null;
};

export type RecolectorRecoleccionPreview = {
  id: string;
  orden: number;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  hora: string;
  estadoLabel: string;
  estado: RecoleccionRow["estado_operativo"];
  zona: string | null;
};

export type RecolectorRecoleccionDetalle = RecolectorRecoleccionPreview & {
  barrio: string | null;
  depto: string | null;
  telefono: string | null;
  telefonoNormalizado: string | null;
  tipoServicio: string | null;
  unidad: string | null;
  frecuencia: string | null;
  precio: string | null;
  observaciones: string | null;
  notaEncargado: string | null;
  montoEfectivo: number | null;
  montoTransferencia: number | null;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value)} km`;
}

export function formatRecolectorMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInicioJornadaAt(ruta: Pick<RutaRow, "inicio_jornada_at" | "metadata">): string | null {
  if (ruta.inicio_jornada_at) return ruta.inicio_jornada_at;
  const meta = ruta.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const value = (meta as Record<string, unknown>).inicio_jornada_at;
    return typeof value === "string" ? value : null;
  }
  return null;
}

function sumRecaudoVisitadas(recolecciones: RecoleccionRow[]) {
  let efectivo = 0;
  let transferencia = 0;
  let qr = 0;
  let montoARecaudar = 0;

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    efectivo += num(item.monto_efectivo);
    transferencia += num(item.monto_transferencia);
    qr += num(item.monto_qr);
    if (item.precio_total != null) montoARecaudar += num(item.precio_total);
  }

  return {
    montoARecaudar,
    recaudadoEfectivo: efectivo,
    recaudadoTransferencia: transferencia,
    recaudadoQr: qr,
    totalRecaudado: efectivo + transferencia + qr,
  };
}

export function buildRecolectorRutaDetalle(
  ruta: RutaRow,
  recolecciones: RecoleccionRow[],
): RecolectorRutaDetalle {
  const recaudo = sumRecaudoVisitadas(recolecciones);
  const efectivoRecaudado = recaudo.recaudadoEfectivo;

  const totalEfectivo =
    ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : efectivoRecaudado > 0 ? efectivoRecaudado : null;

  const inicioJornadaAt = getInicioJornadaAt(ruta);
  const rutaIniciada = inicioJornadaAt != null || ruta.estado === "en_curso";
  const rutaSuspendida = ruta.estado === "suspendida";
  const preparacionInsumosCompleta = insumosOperarioCompletados(ruta.insumos_operario);
  const puedeIniciar =
    !rutaIniciada &&
    !rutaSuspendida &&
    ruta.estado !== "completada" &&
    ruta.estado !== "cerrada" &&
    ruta.estado !== "cancelada" &&
    preparacionInsumosCompleta;

  const insumosInicio = parseInsumosFromJson(ruta.insumos_inicio);
  const insumosOperario = parseInsumosFromJson(ruta.insumos_operario);
  const rutaFinalizada = ruta.estado === "completada" || ruta.estado === "cerrada";
  const finalizar = evaluarFinalizarRuta(recolecciones, ruta.estado, rutaIniciada);

  return {
    id: ruta.id,
    nombre: ruta.nombre,
    fecha: ruta.fecha,
    fechaLabel: formatRutaFecha(ruta.fecha),
    turno: ruta.turno,
    turnoLabel: ruta.turno ? RUTA_TURNO_LABELS[ruta.turno] : "—",
    estado: ruta.estado,
    estadoLabel: RECOLECTOR_RUTA_ESTADO_LABELS[ruta.estado],
    inicioJornadaAt,
    kmInicial: ruta.km_inicial != null ? num(ruta.km_inicial) : null,
    insumosInicio,
    insumosResumen: formatInsumosResumen(insumosInicio),
    insumosOperario,
    insumosOperarioResumen: formatInsumosResumen(insumosOperario),
    preparacionInsumosCompleta,
    montoARecaudar: recaudo.montoARecaudar,
    recaudadoEfectivo: recaudo.recaudadoEfectivo,
    recaudadoTransferencia: recaudo.recaudadoTransferencia,
    recaudadoQr: recaudo.recaudadoQr,
    totalRecaudado: recaudo.totalRecaudado,
    efectivoRecaudado,
    totalEfectivo,
    recoleccionesCount: recolecciones.length,
    puedeIniciar,
    rutaIniciada,
    rutaFinalizada,
    rutaSuspendida,
    puedeFinalizar: finalizar.puedeFinalizar,
    recoleccionesPendientes: finalizar.recoleccionesPendientes,
    mensajeFinalizar: finalizar.mensajeBloqueo,
  };
}

export function buildRecolectorRecoleccionPreview(
  item: RecoleccionRow,
): RecolectorRecoleccionPreview {
  return {
    id: item.id,
    orden: item.orden,
    nombre: item.nombre,
    direccion: item.direccion,
    latitud: item.latitud,
    longitud: item.longitud,
    hora: String(item.hora).slice(0, 5),
    estado: item.estado_operativo,
    estadoLabel: RECOLECCION_OPERATIVA_LABELS[item.estado_operativo],
    zona: item.zona,
  };
}

export function buildRecolectorRecoleccionDetalle(
  item: RecoleccionRow,
): RecolectorRecoleccionDetalle {
  return {
    ...buildRecolectorRecoleccionPreview(item),
    barrio: item.barrio,
    depto: item.depto,
    telefono: item.telefono,
    telefonoNormalizado: item.telefono_normalizado,
    tipoServicio: item.tipo_servicio,
    unidad: item.unidad,
    frecuencia: item.frecuencia,
    precio: item.precio,
    observaciones: item.observaciones,
    notaEncargado: item.nota_encargado,
    montoEfectivo: item.monto_efectivo != null ? num(item.monto_efectivo) : null,
    montoTransferencia:
      item.monto_transferencia != null ? num(item.monto_transferencia) : null,
  };
}

/**
 * Direcciones para el botón Maps de la ruta: todas las paradas abiertas (pendiente o en camino)
 * en el orden de la ruta, aunque haya paradas cerradas más adelante.
 */
export function buildDireccionesMapsActivas(
  recolecciones: Pick<RecoleccionRow, "direccion" | "estado_operativo">[],
): string[] {
  return recolecciones
    .filter((item) => !recoleccionCerradaParaRecolector(item.estado_operativo))
    .map((item) => item.direccion.trim())
    .filter(Boolean);
}

const MAPS_ORIGIN_CURRENT_LOCATION = "Current Location";

function buildGoogleMapsDirUrl(params: {
  destination: string;
  waypoints?: string[];
}): string {
  const search = new URLSearchParams({
    api: "1",
    origin: MAPS_ORIGIN_CURRENT_LOCATION,
    destination: params.destination,
    travelmode: "driving",
  });

  if (params.waypoints && params.waypoints.length > 0) {
    search.set("waypoints", params.waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${search.toString()}`;
}

export function buildGoogleMapsDirectionsUrl(addresses: string[]): string | null {
  const cleaned = addresses.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  if (cleaned.length === 1) {
    return buildGoogleMapsDirUrl({ destination: cleaned[0] });
  }

  return buildGoogleMapsDirUrl({
    destination: cleaned[cleaned.length - 1],
    waypoints: cleaned.slice(0, -1),
  });
}

/** Ubicación de una parada (navegación desde ubicación actual). */
export function buildGoogleMapsRecoleccionUrl(
  item: Pick<RecolectorRecoleccionPreview, "direccion" | "latitud" | "longitud">,
): string | null {
  if (item.latitud != null && item.longitud != null) {
    return buildGoogleMapsDirUrl({
      destination: `${item.latitud},${item.longitud}`,
    });
  }

  const direccion = item.direccion.trim();
  if (!direccion) return null;

  return buildGoogleMapsDirUrl({ destination: direccion });
}

export function formatInicioJornada(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  // Importante: fijar timezone para evitar hydration mismatch (Node vs navegador).
  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
