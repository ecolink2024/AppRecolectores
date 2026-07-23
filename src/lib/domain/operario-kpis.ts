import { rutaEstadoOperarioLabel } from "@/lib/domain/constants";
import { calcDuracionJornadaMinutos } from "@/lib/domain/operario-historial-ruta";
import { getInicioJornadaAt } from "@/lib/domain/recolector-ruta";
import { rutaImpactaKpis } from "@/lib/domain/ruta-estado-transiciones";
import type { Database, RecoleccionOperativaEstado, RutaEstado } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type KpiPeriodo = "7d" | "30d" | "mes" | "90d";

const PERIODOS: KpiPeriodo[] = ["7d", "30d", "mes", "90d"];

/** Etiqueta de paradas en rutas (planilla / campo), distinto de recolecciones logísticas. */
export const KPI_LABEL_SERVICIOS = "Recolecciones (servicios)";

export const KPI_PERIODO_LABELS: Record<KpiPeriodo, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  mes: "Mes en curso",
  "90d": "Últimos 90 días",
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function todayIsoAr(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function firstDayOfMonthIso(iso: string): string {
  const [y, m] = iso.split("-");
  return `${y}-${m}-01`;
}

export function parseKpiPeriodo(value: string | undefined): KpiPeriodo {
  if (value && PERIODOS.includes(value as KpiPeriodo)) {
    return value as KpiPeriodo;
  }
  return "30d";
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type KpiFiltroModo = "preset" | "rango";

export type KpiFiltroFechas = {
  desde: string;
  hasta: string;
  etiqueta: string;
  modo: KpiFiltroModo;
  periodoPreset: KpiPeriodo | null;
};

export function resolveKpiFiltroFechas(params: {
  periodo?: string;
  desde?: string;
  hasta?: string;
}): KpiFiltroFechas {
  const desdeParam = params.desde?.trim();
  const hastaParam = params.hasta?.trim();
  const hoy = todayIsoAr();

  if (
    desdeParam &&
    hastaParam &&
    isIsoDate(desdeParam) &&
    isIsoDate(hastaParam)
  ) {
    let desde = desdeParam;
    let hasta = hastaParam;
    if (desde > hasta) {
      const tmp = desde;
      desde = hasta;
      hasta = tmp;
    }
    if (hasta > hoy) hasta = hoy;
    if (desde > hoy) desde = hoy;

    return {
      desde,
      hasta,
      etiqueta: "Rango personalizado",
      modo: "rango",
      periodoPreset: null,
    };
  }

  const periodoPreset = parseKpiPeriodo(params.periodo);
  const resolved = resolveKpiPeriodo(periodoPreset);
  return {
    ...resolved,
    modo: "preset",
    periodoPreset,
  };
}

export function resolveKpiPeriodo(periodo: KpiPeriodo): {
  desde: string;
  hasta: string;
  etiqueta: string;
} {
  const hasta = todayIsoAr();
  let desde: string;

  switch (periodo) {
    case "7d":
      desde = addDaysIso(hasta, -6);
      break;
    case "90d":
      desde = addDaysIso(hasta, -89);
      break;
    case "mes":
      desde = firstDayOfMonthIso(hasta);
      break;
    case "30d":
    default:
      desde = addDaysIso(hasta, -29);
      break;
  }

  return { desde, hasta, etiqueta: KPI_PERIODO_LABELS[periodo] };
}

export type KpiEstadoRuta = {
  estado: RutaEstado;
  label: string;
  count: number;
};

export type KpiDesgloseItem = {
  label: string;
  count: number;
};

export type KpiZonaRow = {
  zona: string;
  recolecciones: number;
  bolsas: number;
  efectivo: number;
  transferencia: number;
  qr: number;
  ingresoTotal: number;
  porTipoServicio: KpiDesgloseItem[];
  porFrecuencia: KpiDesgloseItem[];
};

type ZonaAccumulator = Omit<KpiZonaRow, "porTipoServicio" | "porFrecuencia"> & {
  tipoServicioMap: Map<string, number>;
  frecuenciaMap: Map<string, number>;
};

export type KpiRecolectorRow = {
  id: string;
  nombre: string;
  rutas: number;
  /** Paradas cargadas en rutas del recolector */
  agendadas: number;
  /** Paradas visitadas (exitosas) */
  realizadas: number;
  porcentajeExito: number | null;
  ingresos: number;
};

export type KpiSerieMes = {
  /** Año-mes calendario (YYYY-MM), zona Argentina */
  mes: string;
  rutas: number;
  /** Suma de pagos (efectivo + transferencia + QR) en visitadas */
  recaudado: number;
  /** Suma de precio_total en visitadas */
  totalPrecio: number;
};

/** Meses hacia atrás que se cargan para el gráfico (independiente del filtro KPI). */
export const KPI_RECAUDACION_MENSUAL_MESES_ATRAS = 48;

/** Meses visibles a la vez en el gráfico. */
export const KPI_RECAUDACION_MENSUAL_VENTANA = 12;

export type OperarioKpis = {
  periodo: { desde: string; hasta: string; etiqueta: string };
  rutas: {
    total: number;
    cerradas: number;
    realizadas: number;
    /** Realizado sin cierre operario (`completada`). */
    pendientesCierre: number;
    canceladas: number;
    porEstado: KpiEstadoRuta[];
  };
  recolecciones: {
    /** Total ingresadas en el período */
    ingresadas: number;
    /** Paradas con retiro exitoso (visitada) */
    exitosas: number;
    canceladas: number;
    omitidas: number;
    pendientes: number;
    /** Exitosas / ingresadas */
    indiceExitosas: number | null;
  };
  porZona: KpiZonaRow[];
  finanzas: {
    efectivo: number;
    transferencia: number;
    qr: number;
    /** Pagos cobrados en visitadas (efectivo + transferencia + QR) */
    total: number;
    /** Suma de precio_total en visitadas */
    totalPrecio: number;
    gastos: number;
    /** Recaudación total ÷ recolecciones exitosas (visitadas) */
    promedioPorRecoleccion: number | null;
  };
  materiales: {
    bolsas: number;
    biotachos: number;
  };
  operacion: {
    kmRecorridos: number;
    rutasFinalizadasRecolector: number;
    duracionPromedioMin: number | null;
  };
  porRecolector: KpiRecolectorRow[];
};

/** Montos cobrados en campo (mismo criterio que Total recaudado en KPIs). */
export function recaudadoPagosRecoleccion(r: RecoleccionRow): number {
  return num(r.monto_efectivo) + num(r.monto_transferencia) + num(r.monto_qr);
}

/** Precio calculado a cobrar en la parada (precio_total). */
export function totalPrecioRecoleccion(r: RecoleccionRow): number {
  if (r.precio_total == null) return 0;
  return num(r.precio_total);
}

function kmRuta(r: RutaRow): number {
  const ini = r.km_inicial != null ? num(r.km_inicial) : null;
  const fin = r.km_final != null ? num(r.km_final) : null;
  if (ini != null && fin != null && fin >= ini) return fin - ini;
  if (r.km_recorridos != null) return num(r.km_recorridos);
  return 0;
}

function tasaExitoPct(visitadas: number, denominador: number): number | null {
  if (denominador === 0) return null;
  return Math.round((visitadas / denominador) * 1000) / 10;
}

function zonaLabel(zona: string | null | undefined): string {
  const z = zona?.trim();
  return z ? z : "Sin zona";
}

function bolsasLlenasRecoleccion(rec: RecoleccionRow): number {
  return num(rec.bolsas_llenas);
}

function desgloseLabel(value: string | null | undefined): string {
  const v = value?.trim();
  return v ? v : "Sin dato";
}

function incrementDesglose(map: Map<string, number>, label: string) {
  map.set(label, (map.get(label) ?? 0) + 1);
}

function mapToDesglose(map: Map<string, number>): KpiDesgloseItem[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
}

function createZonaAccumulator(zona: string): ZonaAccumulator {
  return {
    zona,
    recolecciones: 0,
    bolsas: 0,
    efectivo: 0,
    transferencia: 0,
    qr: 0,
    ingresoTotal: 0,
    tipoServicioMap: new Map(),
    frecuenciaMap: new Map(),
  };
}

function finalizeZonaRow(acc: ZonaAccumulator): KpiZonaRow {
  return {
    zona: acc.zona,
    recolecciones: acc.recolecciones,
    bolsas: acc.bolsas,
    efectivo: acc.efectivo,
    transferencia: acc.transferencia,
    qr: acc.qr,
    ingresoTotal: acc.ingresoTotal,
    porTipoServicio: mapToDesglose(acc.tipoServicioMap),
    porFrecuencia: mapToDesglose(acc.frecuenciaMap),
  };
}

export function buildOperarioKpis(
  rutas: RutaRow[],
  recolecciones: RecoleccionRow[],
  recolectorNombres: Map<string, string>,
  periodo: { desde: string; hasta: string; etiqueta: string },
): OperarioKpis {

  const estadoCounts = new Map<RutaEstado, number>();

  let cerradas = 0;
  let realizadas = 0;
  let pendientesCierre = 0;
  let canceladas = 0;
  let kmRecorridos = 0;
  let rutasFinalizadasRecolector = 0;
  let gastos = 0;
  const duraciones: number[] = [];

  const rutaIds = new Set(rutas.map((r) => r.id));
  const rutasImpacto = rutas.filter((r) => rutaImpactaKpis(r.estado));
  const rutaIdsImpacto = new Set(rutasImpacto.map((r) => r.id));
  const recs = recolecciones.filter((r) => rutaIds.has(r.ruta_id));
  /** Paradas de rutas ya cerradas por operario (únicas que mueven montos/materiales/KPIs de impacto). */
  const recsImpacto = recs.filter((r) => rutaIdsImpacto.has(r.ruta_id));

  for (const ruta of rutas) {
    estadoCounts.set(ruta.estado, (estadoCounts.get(ruta.estado) ?? 0) + 1);

    if (ruta.estado === "cerrada") cerradas += 1;
    if (ruta.estado === "completada" || ruta.estado === "cerrada") realizadas += 1;
    if (ruta.estado === "completada") pendientesCierre += 1;
    if (ruta.estado === "cancelada") canceladas += 1;
  }

  for (const ruta of rutasImpacto) {
    kmRecorridos += kmRuta(ruta);

    if (ruta.cierre_recolector_at) {
      rutasFinalizadasRecolector += 1;
      const mins = calcDuracionJornadaMinutos(
        getInicioJornadaAt(ruta),
        ruta.cierre_recolector_at,
      );
      if (mins != null) duraciones.push(mins);
    }

    gastos += num(ruta.combustible) + num(ruta.descuento) + num(ruta.otros_gastos);
  }

  const porEstado: KpiEstadoRuta[] = Array.from(estadoCounts.entries())
    .map(([estado, count]) => ({
      estado,
      label: rutaEstadoOperarioLabel(estado),
      count,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  let exitosas = 0;
  let canceladasRec = 0;
  let omitidas = 0;
  let pendientes = 0;
  let efectivo = 0;
  let transferencia = 0;
  let qr = 0;
  let totalPrecio = 0;
  let bolsas = 0;
  let biotachos = 0;

  const recByRuta = new Map<string, RecoleccionRow[]>();
  const porZonaMap = new Map<string, ZonaAccumulator>();

  for (const rec of recsImpacto) {
    const list = recByRuta.get(rec.ruta_id) ?? [];
    list.push(rec);
    recByRuta.set(rec.ruta_id, list);

    const estado = rec.estado_operativo as RecoleccionOperativaEstado;
    if (estado === "visitada") exitosas += 1;
    else if (estado === "cancelada") canceladasRec += 1;
    else if (estado === "omitida") omitidas += 1;
    else pendientes += 1;

    const zonaKey = zonaLabel(rec.zona);
    let zonaRow = porZonaMap.get(zonaKey);
    if (!zonaRow) {
      zonaRow = createZonaAccumulator(zonaKey);
      porZonaMap.set(zonaKey, zonaRow);
    }
    zonaRow.recolecciones += 1;
    incrementDesglose(zonaRow.tipoServicioMap, desgloseLabel(rec.tipo_servicio));
    incrementDesglose(zonaRow.frecuenciaMap, desgloseLabel(rec.frecuencia));

    if (estado === "visitada") {
      const eff = num(rec.monto_efectivo);
      const trans = num(rec.monto_transferencia);
      const qrVal = num(rec.monto_qr);
      efectivo += eff;
      transferencia += trans;
      qr += qrVal;
      totalPrecio += totalPrecioRecoleccion(rec);
      bolsas += bolsasLlenasRecoleccion(rec);
      biotachos += num(rec.biotachos_llenos) + num(rec.biotachos_nuevos);

      zonaRow.bolsas += bolsasLlenasRecoleccion(rec);
      zonaRow.efectivo += eff;
      zonaRow.transferencia += trans;
      zonaRow.qr += qrVal;
      zonaRow.ingresoTotal += recaudadoPagosRecoleccion(rec);
    }
  }

  const porZona = [...porZonaMap.values()]
    .map(finalizeZonaRow)
    .sort(
      (a, b) => b.ingresoTotal - a.ingresoTotal || b.recolecciones - a.recolecciones,
    );

  const totalRecaudado = efectivo + transferencia + qr;
  const ingresadas = recsImpacto.length;

  const porRecolectorMap = new Map<string, KpiRecolectorRow>();

  for (const ruta of rutasImpacto) {
    const recolectorId = ruta.asignado_a ?? "__sin_asignar__";
    const nombre =
      ruta.asignado_a != null
        ? (recolectorNombres.get(ruta.asignado_a) ?? "Sin nombre")
        : "Sin asignar";

    let row = porRecolectorMap.get(recolectorId);
    if (!row) {
      row = {
        id: recolectorId,
        nombre,
        rutas: 0,
        agendadas: 0,
        realizadas: 0,
        porcentajeExito: null,
        ingresos: 0,
      };
      porRecolectorMap.set(recolectorId, row);
    }

    row.rutas += 1;
    const paradas = recByRuta.get(ruta.id) ?? [];
    row.agendadas += paradas.length;

    for (const p of paradas) {
      if (p.estado_operativo === "visitada") {
        row.realizadas += 1;
        row.ingresos += recaudadoPagosRecoleccion(p);
      }
    }
  }

  const porRecolector = [...porRecolectorMap.values()]
    .map((row) => ({
      ...row,
      porcentajeExito: tasaExitoPct(row.realizadas, row.agendadas),
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  const duracionPromedioMin =
    duraciones.length > 0
      ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length)
      : null;

  return {
    periodo,
    rutas: {
      total: rutas.length,
      cerradas,
      realizadas,
      pendientesCierre,
      canceladas,
      porEstado,
    },
    recolecciones: {
      ingresadas,
      exitosas,
      canceladas: canceladasRec,
      omitidas,
      pendientes,
      indiceExitosas: tasaExitoPct(exitosas, ingresadas),
    },
    porZona,
    finanzas: {
      efectivo,
      transferencia,
      qr,
      total: totalRecaudado,
      totalPrecio,
      gastos,
      promedioPorRecoleccion:
        exitosas > 0 ? Math.round(totalRecaudado / exitosas) : null,
    },
    materiales: { bolsas, biotachos },
    operacion: {
      kmRecorridos: Math.round(kmRecorridos * 10) / 10,
      rutasFinalizadasRecolector,
      duracionPromedioMin,
    },
    porRecolector,
  };
}

function monthKeyFromFecha(fecha: string): string {
  return fecha.slice(0, 7);
}

function addMonthsToMonthKey(mes: string, delta: number): string {
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKeyAr(): string {
  return todayIsoAr().slice(0, 7);
}

export function rangoMesesSerieRecaudacion(
  mesesAtras = KPI_RECAUDACION_MENSUAL_MESES_ATRAS,
): { desdeMes: string; hastaMes: string; desdeFecha: string; hastaFecha: string } {
  const hastaMes = currentMonthKeyAr();
  const desdeMes = addMonthsToMonthKey(hastaMes, -(mesesAtras - 1));
  const [y, m] = hastaMes.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    desdeMes,
    hastaMes,
    desdeFecha: `${desdeMes}-01`,
    hastaFecha: `${hastaMes}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function listMesesEnRango(desdeMes: string, hastaMes: string): string[] {
  const meses: string[] = [];
  let cursor = desdeMes;
  while (cursor <= hastaMes) {
    meses.push(cursor);
    cursor = addMonthsToMonthKey(cursor, 1);
  }
  return meses;
}

export function buildSerieMensualRecaudacion(
  rutas: RutaRow[],
  recolecciones: RecoleccionRow[],
  desdeMes: string,
  hastaMes: string,
): KpiSerieMes[] {
  const recByRuta = new Map<string, RecoleccionRow[]>();
  for (const rec of recolecciones) {
    const list = recByRuta.get(rec.ruta_id) ?? [];
    list.push(rec);
    recByRuta.set(rec.ruta_id, list);
  }

  const serieMap = new Map<string, { rutas: number; recaudado: number; totalPrecio: number }>();
  for (const mes of listMesesEnRango(desdeMes, hastaMes)) {
    serieMap.set(mes, { rutas: 0, recaudado: 0, totalPrecio: 0 });
  }

  for (const ruta of rutas) {
    if (!rutaImpactaKpis(ruta.estado)) continue;
    const mes = monthKeyFromFecha(ruta.fecha);
    const entry = serieMap.get(mes);
    if (!entry) continue;
    entry.rutas += 1;
    const paradas = recByRuta.get(ruta.id) ?? [];
    for (const p of paradas) {
      if (p.estado_operativo !== "visitada") continue;
      entry.recaudado += recaudadoPagosRecoleccion(p);
      entry.totalPrecio += totalPrecioRecoleccion(p);
    }
  }

  return listMesesEnRango(desdeMes, hastaMes).map((mes) => ({
    mes,
    rutas: serieMap.get(mes)!.rutas,
    recaudado: serieMap.get(mes)!.recaudado,
    totalPrecio: serieMap.get(mes)!.totalPrecio,
  }));
}

export function formatKpiMesLabel(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

export function formatKpiPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

export function formatKpiNumber(value: number): string {
  return value.toLocaleString("es-AR");
}

export function formatKpiDuracion(minutos: number | null): string {
  if (minutos === null) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
