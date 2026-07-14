import { formatInsumosResumen, insumosOperarioCompletados, parseInsumosFromJson, type InsumoInicio } from "@/lib/domain/ruta-insumos";
import {
  RECOLECCION_OPERATIVA_LABELS,
  RUTA_TURNO_LABELS,
  formatTipoClienteLabel,
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
  barrio: string | null;
  /** `tipo_servicio` (Reciclaje, Mixto, etc.) */
  tipoCliente: string | null;
  /** `unidad` (Hogar, Empresa, Puntos) — etiqueta «Tipo de servicio» en cards */
  unidad: string | null;
};

export type RecolectorRecoleccionDetalle = RecolectorRecoleccionPreview & {
  zona: string | null;
  depto: string | null;
  telefono: string | null;
  telefonoNormalizado: string | null;
  /** Valor crudo de `tipo_servicio` (p. ej. cobro, sheet Info) */
  tipoServicio: string | null;
  frecuencia: string | null;
  precio: string | null;
  deuda: string | null;
  notaEncargado: string | null;
  observaciones: string | null;
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
  const preparacionInsumosCompleta = insumosOperarioCompletados(ruta.insumos_operario);
  const puedeIniciar =
    !rutaIniciada &&
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
    barrio: item.barrio,
    tipoCliente: item.tipo_servicio ? formatTipoClienteLabel(item.tipo_servicio) : null,
    unidad: item.unidad,
  };
}

export function buildRecolectorRecoleccionDetalle(
  item: RecoleccionRow,
): RecolectorRecoleccionDetalle {
  return {
    ...buildRecolectorRecoleccionPreview(item),
    zona: item.zona,
    depto: item.depto,
    telefono: item.telefono,
    telefonoNormalizado: item.telefono_normalizado,
    tipoServicio: item.tipo_servicio,
    frecuencia: item.frecuencia,
    precio: item.precio,
    deuda: item.deuda,
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

/**
 * Tope por enlace de Maps URLs (`api=1`): en mobile los waypoints extras se ignoran
 * (docs: hasta 3 en browser mobile, máx. 9 en otros). Usamos 8 paradas por tramo
 * (7 waypoints + destino) para que no se salteen direcciones del medio.
 */
export const MAPS_MAX_PARADAS_POR_TRAMO = 8;

/** Parte la lista de direcciones en tramos que Google Maps puede mostrar completos. */
export function chunkDireccionesForMaps(
  addresses: string[],
  maxParadas = MAPS_MAX_PARADAS_POR_TRAMO,
): string[][] {
  const cleaned = addresses.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  const size = Math.max(1, maxParadas);
  const chunks: string[][] = [];
  for (let i = 0; i < cleaned.length; i += size) {
    chunks.push(cleaned.slice(i, i + size));
  }
  return chunks;
}

function buildGoogleMapsDirUrl(params: {
  destination: string;
  waypoints?: string[];
  /** Coordenadas `lat,lng` del recolector. Si se omite, Maps usa la ubicación del dispositivo. */
  origin?: string;
  /** Navegación turn-by-turn (parada individual en mobile). */
  navigate?: boolean;
}): string {
  const search = new URLSearchParams({
    api: "1",
    destination: params.destination,
    travelmode: "driving",
  });

  if (params.origin) {
    search.set("origin", params.origin);
  }

  if (params.waypoints && params.waypoints.length > 0) {
    search.set("waypoints", params.waypoints.join("|"));
  }

  if (params.navigate) {
    search.set("dir_action", "navigate");
  }

  return `https://www.google.com/maps/dir/?${search.toString()}`;
}

export function buildGoogleMapsDirectionsUrl(
  addresses: string[],
  options?: { origin?: string },
): string | null {
  const cleaned = addresses.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  if (cleaned.length === 1) {
    return buildGoogleMapsDirUrl({ destination: cleaned[0], origin: options?.origin });
  }

  return buildGoogleMapsDirUrl({
    destination: cleaned[cleaned.length - 1],
    waypoints: cleaned.slice(0, -1),
    origin: options?.origin,
  });
}

/** Ubicación de una parada (navegación desde ubicación actual del recolector). */
export function buildGoogleMapsRecoleccionUrl(
  item: Pick<RecolectorRecoleccionPreview, "direccion" | "latitud" | "longitud">,
  options?: { origin?: string },
): string | null {
  if (item.latitud != null && item.longitud != null) {
    return buildGoogleMapsDirUrl({
      destination: `${item.latitud},${item.longitud}`,
      origin: options?.origin,
      navigate: true,
    });
  }

  const direccion = item.direccion.trim();
  if (!direccion) return null;

  return buildGoogleMapsDirUrl({
    destination: direccion,
    origin: options?.origin,
    navigate: true,
  });
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
