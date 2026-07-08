import type { InsumoInicio, InsumoTipo } from "@/lib/domain/ruta-insumos";
import { INSUMO_TIPOS, parseInsumosFromJson } from "@/lib/domain/ruta-insumos";
import { calcTotalEfectivo } from "@/lib/domain/recolector-cierre-ruta";
import type { Database } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];

export type InsumosHistorialDetalle = {
  /** Cantidad de cada insumo declarado al iniciar, por tipo (ver INSUMO_TIPOS). */
  insumosPorTipo: Record<InsumoTipo, number>;
  descarga: boolean;
  combustible: number;
  descuento: number;
  otrosGastos: number;
  puntosRecoleccion: number;
  exitosos: number;
  pendientes: number;
  canceladas: number;
  kmRecorridos: number | null;
  totalRecaudadoBruto: number;
  recaudadoDespuesGastos: number;
  totalEfectivo: number | null;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseInsumosInicio(value: unknown): InsumoInicio[] {
  return parseInsumosFromJson(value);
}

export function contarInsumosInicio(insumos: InsumoInicio[]): Record<InsumoTipo, number> {
  const porTipo = Object.fromEntries(
    INSUMO_TIPOS.map((tipo) => [tipo, 0]),
  ) as Record<InsumoTipo, number>;

  for (const item of insumos) {
    if (item.tipo in porTipo) {
      porTipo[item.tipo] += item.cantidad;
    }
  }

  return porTipo;
}

export function calcDuracionJornadaMinutos(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): number | null {
  if (!inicio || !fin) return null;
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60_000);
}

export function formatDuracionRecoleccion(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): string | null {
  const totalMin = calcDuracionJornadaMinutos(inicio, fin);
  if (totalMin === null) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function buildInsumosHistorialDetalle(
  ruta: RutaRow,
  stats: {
    puntosRecoleccion: number;
    exitosos: number;
    pendientes: number;
    canceladas: number;
    efectivoRecolecciones: number;
  },
): InsumosHistorialDetalle {
  const insumosPorTipo = contarInsumosInicio(parseInsumosInicio(ruta.insumos_inicio));
  const kmInicial = ruta.km_inicial != null ? num(ruta.km_inicial) : null;
  const kmFinal = ruta.km_final != null ? num(ruta.km_final) : null;
  const kmRecorridos =
    kmInicial != null && kmFinal != null && kmFinal >= kmInicial
      ? Number((kmFinal - kmInicial).toFixed(1))
      : ruta.km_recorridos != null
        ? num(ruta.km_recorridos)
        : null;

  const combustible = num(ruta.combustible);
  const descuento = num(ruta.descuento);
  const otrosGastos = num(ruta.otros_gastos);

  const totalRecaudadoBruto =
    ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : stats.efectivoRecolecciones;

  const recaudadoDespuesGastos = calcTotalEfectivo(
    totalRecaudadoBruto,
    combustible,
    descuento,
    otrosGastos,
  );

  const totalEfectivo =
    ruta.total_efectivo != null ? num(ruta.total_efectivo) : recaudadoDespuesGastos;

  return {
    insumosPorTipo,
    descarga: Boolean(ruta.descarga),
    combustible,
    descuento,
    otrosGastos,
    puntosRecoleccion: stats.puntosRecoleccion,
    exitosos: stats.exitosos,
    pendientes: stats.pendientes,
    canceladas: stats.canceladas,
    kmRecorridos,
    totalRecaudadoBruto,
    recaudadoDespuesGastos,
    totalEfectivo: totalRecaudadoBruto > 0 || totalEfectivo !== 0 ? totalEfectivo : null,
  };
}

export function formatObservacionesHistorial(
  recolector: string | null,
  operario: string | null,
): string {
  const parts: string[] = [];
  if (recolector?.trim()) parts.push(recolector.trim());
  if (operario?.trim()) parts.push(operario.trim());
  return parts.length ? parts.join(" · ") : "—";
}
