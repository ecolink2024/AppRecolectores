import { esFirmaDigitalImagen as esFirmaDigitalImagenFromDomain } from "@/lib/domain/firma-digital";
import { horaInicioTurnoForSort } from "@/lib/domain/ruta-turno";
import type { Database, RecoleccionOperativaEstado, RutaEstado, RutaTurno } from "@/types/database";
import {
  rutaEstadoOperarioLabel,
  RUTA_TURNO_LABELS,
} from "@/lib/domain/constants";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

import {
  buildInsumosHistorialDetalle,
  formatDuracionRecoleccion,
  type InsumosHistorialDetalle,
} from "@/lib/domain/operario-historial-ruta";
import { getInicioJornadaAt } from "@/lib/domain/recolector-ruta";
import {
  insumosOperarioCompletados,
  parseInsumosFromJson,
  type InsumoInicio,
} from "@/lib/domain/ruta-insumos";
import { formatRutaEstado, formatRutaFecha } from "@/lib/domain/rutas";

export type RecolectorOption = {
  id: string;
  nombre: string;
};

export type RutaOperarioRow = {
  id: string;
  fecha: string;
  turno: RutaTurno | null;
  estado: RutaEstado;
  nombre: string;
  asignado_a: string | null;
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
  monto_a_recaudar: number;
  recaudado_efectivo: number;
  recaudado_transferencia: number;
  recaudado_qr: number;
  total_recaudado: number;
  observaciones_operario: string | null;
  /** Campos usados en la tabla Historial */
  duracion_recoleccion: string | null;
  operario_nombre: string | null;
  km_inicial: number | null;
  km_final: number | null;
  observaciones_recolector: string | null;
  insumos_detalle: InsumosHistorialDetalle;
  bolsas_recolectadas: number;
  biotachos_recolectados: number;
  bolsas_recolectadas_detalle: string | null;
  biotachos_recolectados_detalle: string | null;
  insumos_operario: InsumoInicio[];
  insumos_operario_completado: boolean;
  insumos_operario_at: string | null;
  puede_editar_insumos_operario: boolean;
  /** Insumos declarados por el recolector al iniciar la jornada */
  insumos_inicio: InsumoInicio[];
};

export type RecoleccionOperarioRow = {
  id: string;
  ruta_id: string;
  orden: number;
  zona: string | null;
  estado_operativo: RecoleccionOperativaEstado;
  direccion: string;
  barrio: string | null;
  depto: string | null;
  unidad: string | null;
  tipo_servicio: string | null;
  frecuencia: string | null;
  telefono: string | null;
  hora_programada: string;
  nombre: string;
  hora_real: string | null;
  precio_total: number | null;
  precio_tarifa: string | null;
  deuda: string | null;
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  observaciones: string | null;
  observaciones_recolector: string | null;
  detalle: string | null;
  firma_digital: string | null;
  nombre_firmante: string | null;
  monto_qr: number | null;
  motivo_cancelacion: string | null;
  bolsas_llenas: number | null;
  bolsas_llenas_punto: number | null;
  bolsas_nuevas_vendidas: number | null;
  biotachos_llenos: number | null;
  bolsas_nuevas: number | null;
  biotachos_nuevos: number | null;
  cestos: number | null;
  nota_encargado: string | null;
  dia: string | null;
  latitud: number | null;
  longitud: number | null;
  direccion_google: string | null;
  coordenadas_dms: string | null;
};

export type RecoleccionesPorUnidadTipo = {
  unidad: string;
  tipo_cliente: string;
  cantidad: number;
};

export type RutaDetalleOperario = {
  id: string;
  fecha: string;
  turno: RutaTurno | null;
  estado: RutaEstado;
  estado_label: string;
  recolector_nombre: string | null;
  recolecciones_exitosas: number;
  exitosas_por_unidad_tipo: RecoleccionesPorUnidadTipo[];
  recolecciones_pendientes: number;
  pendientes_por_unidad_tipo: RecoleccionesPorUnidadTipo[];
  recolecciones_canceladas: number;
  canceladas_por_unidad_tipo: RecoleccionesPorUnidadTipo[];
  monto_a_recaudar: number;
  recaudado_efectivo: number;
  recaudado_transferencia: number;
  recaudado_qr: number;
  total_recaudado: number;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Pagos por medio en paradas visitadas. */
function sumRecaudadoPorMedioVisitadas(recolecciones: RecoleccionRow[]) {
  let efectivo = 0;
  let transferencia = 0;
  let qr = 0;

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    efectivo += num(item.monto_efectivo);
    transferencia += num(item.monto_transferencia);
    qr += num(item.monto_qr);
  }

  return {
    efectivo,
    transferencia,
    qr,
    total: efectivo + transferencia + qr,
  };
}

/** Suma de precio_total cargado en paradas visitadas. */
function sumMontoARecaudarRuta(recolecciones: RecoleccionRow[]): number {
  let total = 0;
  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    if (item.precio_total != null) total += num(item.precio_total);
  }
  return total;
}

function sumMaterialesVisitadas(recolecciones: RecoleccionRow[]) {
  let bolsasLlenas = 0;
  let bolsasNuevas = 0;
  let biotachosLlenos = 0;
  let biotachosNuevos = 0;

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    bolsasLlenas += num(item.bolsas_llenas);
    bolsasNuevas += num(item.bolsas_nuevas);
    biotachosLlenos += num(item.biotachos_llenos);
    biotachosNuevos += num(item.biotachos_nuevos);
  }

  return { bolsasLlenas, bolsasNuevas, biotachosLlenos, biotachosNuevos };
}

export function formatMaterialesRecolectadosDisplay(total: number): string {
  return total === 0 ? "—" : String(total);
}

export function formatMaterialesRecolectadosDetalle(
  llenas: number,
  nuevas: number,
): string | null {
  if (llenas === 0 && nuevas === 0) return null;
  const parts: string[] = [];
  if (llenas > 0) parts.push(`${llenas} llena(s)`);
  if (nuevas > 0) parts.push(`${nuevas} nueva(s)`);
  return parts.join(", ");
}

export function buildRutaOperarioRows(
  rutas: RutaRow[],
  recolecciones: RecoleccionRow[],
  recolectores: Pick<ProfileRow, "id" | "full_name" | "email">[],
  operarios: Pick<ProfileRow, "id" | "full_name" | "email">[] = [],
): RutaOperarioRow[] {
  const recMap = new Map(
    recolectores.map((r) => [r.id, r.full_name || r.email]),
  );
  const operarioMap = new Map(
    operarios.map((r) => [r.id, r.full_name || r.email || null]),
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

    const efectivoRecolecciones = items.reduce(
      (acc, item) => acc + num(item.monto_efectivo),
      0,
    );
    const efectivoRuta = ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : null;
    const transferenciaRuta =
      ruta.monto_transferencia != null ? num(ruta.monto_transferencia) : null;
    const monto_a_recaudar = sumMontoARecaudarRuta(items);
    const recaudado = sumRecaudadoPorMedioVisitadas(items);

    const insumos_detalle = buildInsumosHistorialDetalle(ruta, {
      puntosRecoleccion: items.length,
      exitosos: exitosas,
      pendientes,
      canceladas,
      efectivoRecolecciones,
    });

    const materiales = sumMaterialesVisitadas(items);
    const bolsas_recolectadas = materiales.bolsasLlenas + materiales.bolsasNuevas;
    const biotachos_recolectados =
      materiales.biotachosLlenos + materiales.biotachosNuevos;

    const inicioJornadaAt = getInicioJornadaAt(ruta);
    const rutaIniciada = inicioJornadaAt != null || ruta.estado === "en_curso";
    const insumos_operario = parseInsumosFromJson(ruta.insumos_operario);

    return {
      id: ruta.id,
      fecha: ruta.fecha,
      turno: ruta.turno,
      estado: ruta.estado,
      nombre: ruta.nombre,
      asignado_a: ruta.asignado_a,
      recolector_nombre: ruta.asignado_a
        ? (recMap.get(ruta.asignado_a) ?? null)
        : null,
      puntos_recoleccion: items.length,
      recolecciones_exitosas: exitosas,
      recolecciones_pendientes: pendientes,
      recolecciones_canceladas: canceladas,
      km_recorridos: ruta.km_recorridos != null ? num(ruta.km_recorridos) : null,
      inicio_jornada_at: inicioJornadaAt,
      cierre_recolector_at: ruta.cierre_recolector_at,
      cierre_operario_at: ruta.cierre_operario_at,
      monto_efectivo: efectivoRuta,
      monto_transferencia: transferenciaRuta,
      monto_a_recaudar,
      recaudado_efectivo: recaudado.efectivo,
      recaudado_transferencia: recaudado.transferencia,
      recaudado_qr: recaudado.qr,
      total_recaudado: recaudado.total,
      observaciones_operario: ruta.observaciones_operario,
      duracion_recoleccion: formatDuracionRecoleccion(
        inicioJornadaAt,
        ruta.cierre_recolector_at,
      ),
      operario_nombre: ruta.cierre_operario_por
        ? (operarioMap.get(ruta.cierre_operario_por) ?? null)
        : null,
      km_inicial: ruta.km_inicial != null ? num(ruta.km_inicial) : null,
      km_final: ruta.km_final != null ? num(ruta.km_final) : null,
      observaciones_recolector: ruta.observaciones_recolector,
      insumos_detalle,
      bolsas_recolectadas,
      biotachos_recolectados,
      bolsas_recolectadas_detalle: formatMaterialesRecolectadosDetalle(
        materiales.bolsasLlenas,
        materiales.bolsasNuevas,
      ),
      biotachos_recolectados_detalle: formatMaterialesRecolectadosDetalle(
        materiales.biotachosLlenos,
        materiales.biotachosNuevos,
      ),
      insumos_operario,
      insumos_operario_completado: insumosOperarioCompletados(ruta.insumos_operario),
      insumos_operario_at: ruta.insumos_operario_at,
      puede_editar_insumos_operario:
        !rutaIniciada &&
        ruta.estado !== "completada" &&
        ruta.estado !== "cerrada" &&
        ruta.estado !== "cancelada",
      insumos_inicio: parseInsumosFromJson(ruta.insumos_inicio),
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
      barrio: item.barrio,
      depto: item.depto,
      unidad: item.unidad,
      tipo_servicio: item.tipo_servicio,
      frecuencia: item.frecuencia,
      telefono: item.telefono,
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
      deuda: item.deuda,
      monto_efectivo: item.monto_efectivo != null ? num(item.monto_efectivo) : null,
      monto_transferencia:
        item.monto_transferencia != null ? num(item.monto_transferencia) : null,
      observaciones: item.observaciones,
      observaciones_recolector: item.observaciones_recolector,
      detalle: item.detalle,
      firma_digital: item.firma_digital,
      nombre_firmante: item.nombre_firmante,
      monto_qr: item.monto_qr != null ? num(item.monto_qr) : null,
      motivo_cancelacion: item.motivo_cancelacion,
      bolsas_llenas: item.bolsas_llenas,
      bolsas_llenas_punto: item.bolsas_llenas_punto,
      bolsas_nuevas_vendidas: item.bolsas_nuevas_vendidas,
      biotachos_llenos: item.biotachos_llenos,
      bolsas_nuevas: item.bolsas_nuevas,
      biotachos_nuevos: item.biotachos_nuevos,
      cestos: item.cestos,
      nota_encargado: item.nota_encargado,
      dia: item.dia || null,
      latitud: item.latitud,
      longitud: item.longitud,
      direccion_google: item.direccion_google,
      coordenadas_dms: item.coordenadas_dms,
    }));
}

export function formatRutaHorario(fecha: string, turno: RutaTurno | null): string {
  return `${formatRutaFecha(fecha)} · ${formatTurno(turno)}`;
}

export function formatCantidadBolsas(item: Pick<
  RecoleccionOperarioRow,
  "bolsas_llenas"
>): string {
  const llenas = item.bolsas_llenas ?? 0;
  if (llenas === 0) return "—";
  return String(llenas);
}

export function formatCantidadBolsasDetalle(item: Pick<
  RecoleccionOperarioRow,
  "bolsas_llenas"
>): string | undefined {
  const llenas = item.bolsas_llenas ?? 0;
  if (llenas === 0) return undefined;
  return `${llenas} llena(s)`;
}

export function formatCantidadBolsasNuevas(item: Pick<
  RecoleccionOperarioRow,
  "bolsas_nuevas"
>): string {
  const nuevas = item.bolsas_nuevas ?? 0;
  if (nuevas === 0) return "—";
  return String(nuevas);
}

export function formatCantidadBiotachos(item: Pick<
  RecoleccionOperarioRow,
  "biotachos_llenos"
>): string {
  const llenos = item.biotachos_llenos ?? 0;
  if (llenos === 0) return "—";
  return String(llenos);
}

export function formatCantidadBiotachosDetalle(item: Pick<
  RecoleccionOperarioRow,
  "biotachos_llenos"
>): string | undefined {
  const llenos = item.biotachos_llenos ?? 0;
  if (llenos === 0) return undefined;
  return `${llenos} lleno(s)`;
}

export type RecoleccionOperarioDetalleCarga = {
  tieneCarga: boolean;
  bolsas: string | null;
  biotachos: string | null;
  cestos: string | null;
  efectivo: string | null;
  transferencia: string | null;
  qr: string | null;
  cancelacion: string | null;
};

/** Retiro y cobro de una parada para la columna Detalle (Operativo). */
export function buildRecoleccionOperarioDetalleCarga(
  item: RecoleccionOperarioRow,
): RecoleccionOperarioDetalleCarga {
  const visitada = item.estado_operativo === "visitada";
  const cancelada = item.estado_operativo === "cancelada";

  const cancelacion =
    cancelada && (item.motivo_cancelacion?.trim() || item.detalle?.trim())
      ? item.motivo_cancelacion?.trim() || item.detalle?.trim() || null
      : null;

  if (cancelada) {
    return {
      tieneCarga: Boolean(cancelacion),
      bolsas: null,
      biotachos: null,
      cestos: null,
      efectivo: null,
      transferencia: null,
      qr: null,
      cancelacion,
    };
  }

  if (!visitada) {
    return {
      tieneCarga: false,
      bolsas: null,
      biotachos: null,
      cestos: null,
      efectivo: null,
      transferencia: null,
      qr: null,
      cancelacion: null,
    };
  }

  return {
    tieneCarga: true,
    bolsas: formatCantidadBolsasDetalle(item) ?? "0",
    biotachos: formatCantidadBiotachosDetalle(item) ?? "0",
    cestos: String(item.cestos ?? 0),
    efectivo: formatMoney(item.monto_efectivo ?? 0),
    transferencia: formatMoney(item.monto_transferencia ?? 0),
    qr: formatMoney(item.monto_qr ?? 0),
    cancelacion: null,
  };
}

export function esFirmaDigitalImagen(firma: string | null): boolean {
  return esFirmaDigitalImagenFromDomain(firma);
}

function labelUnidadTipo(value: string | null | undefined, fallback: string): string {
  const text = value?.trim();
  return text || fallback;
}

type RecoleccionUnidadTipoInput = Pick<
  RecoleccionOperarioRow,
  "estado_operativo" | "unidad" | "tipo_servicio"
>;

function esRecoleccionExitosa(estado: RecoleccionOperativaEstado): boolean {
  return estado === "visitada";
}

function esRecoleccionPendiente(estado: RecoleccionOperativaEstado): boolean {
  return estado === "pendiente" || estado === "en_camino";
}

function esRecoleccionCancelada(estado: RecoleccionOperativaEstado): boolean {
  return estado === "cancelada" || estado === "omitida";
}

function buildRecoleccionesPorUnidadTipo(
  recolecciones: RecoleccionUnidadTipoInput[],
  matches: (estado: RecoleccionOperativaEstado) => boolean,
): RecoleccionesPorUnidadTipo[] {
  const map = new Map<string, RecoleccionesPorUnidadTipo>();

  for (const item of recolecciones) {
    if (!matches(item.estado_operativo)) continue;

    const unidad = labelUnidadTipo(item.unidad, "Sin unidad");
    const tipoCliente = labelUnidadTipo(item.tipo_servicio, "Sin tipo");
    const key = `${unidad}\0${tipoCliente}`;
    const current = map.get(key);

    if (current) {
      current.cantidad += 1;
    } else {
      map.set(key, { unidad, tipo_cliente: tipoCliente, cantidad: 1 });
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      b.cantidad - a.cantidad ||
      a.unidad.localeCompare(b.unidad, "es") ||
      a.tipo_cliente.localeCompare(b.tipo_cliente, "es"),
  );
}

/** Exitosas (visitadas) agrupadas por unidad y tipo de cliente. */
export function buildExitosasPorUnidadTipo(
  recolecciones: RecoleccionUnidadTipoInput[],
): RecoleccionesPorUnidadTipo[] {
  return buildRecoleccionesPorUnidadTipo(recolecciones, esRecoleccionExitosa);
}

export function buildPendientesPorUnidadTipo(
  recolecciones: RecoleccionUnidadTipoInput[],
): RecoleccionesPorUnidadTipo[] {
  return buildRecoleccionesPorUnidadTipo(recolecciones, esRecoleccionPendiente);
}

export function buildCanceladasPorUnidadTipo(
  recolecciones: RecoleccionUnidadTipoInput[],
): RecoleccionesPorUnidadTipo[] {
  return buildRecoleccionesPorUnidadTipo(recolecciones, esRecoleccionCancelada);
}

export function buildRutaDetalle(
  ruta: RutaOperarioRow,
  recolecciones: RecoleccionUnidadTipoInput[] = [],
): RutaDetalleOperario {
  return {
    id: ruta.id,
    fecha: ruta.fecha,
    turno: ruta.turno,
    estado: ruta.estado,
    estado_label: rutaEstadoOperarioLabel(ruta.estado),
    recolector_nombre: ruta.recolector_nombre,
    recolecciones_exitosas: ruta.recolecciones_exitosas,
    exitosas_por_unidad_tipo: buildExitosasPorUnidadTipo(recolecciones),
    recolecciones_pendientes: ruta.recolecciones_pendientes,
    pendientes_por_unidad_tipo: buildPendientesPorUnidadTipo(recolecciones),
    recolecciones_canceladas: ruta.recolecciones_canceladas,
    canceladas_por_unidad_tipo: buildCanceladasPorUnidadTipo(recolecciones),
    monto_a_recaudar: ruta.monto_a_recaudar,
    recaudado_efectivo: ruta.recaudado_efectivo,
    recaudado_transferencia: ruta.recaudado_transferencia,
    recaudado_qr: ruta.recaudado_qr,
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
    const horaInicio = horaInicioTurnoForSort(ruta.turno);
    const ts = new Date(`${ruta.fecha}T${horaInicio}:00`).getTime();
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

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value);
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
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatHoraReal(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export { formatRutaFecha, formatRutaEstado };
