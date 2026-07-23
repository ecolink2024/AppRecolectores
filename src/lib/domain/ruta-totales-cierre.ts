import { calcTotalEfectivo } from "@/lib/domain/recolector-cierre-ruta";
import type { Database } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

export type RecoleccionMontoRow = {
  estado_operativo: string;
  monto_efectivo: number | string | null;
  monto_transferencia?: number | string | null;
  monto_qr?: number | string | null;
};

export type RutaGastosCierre = {
  combustible: number;
  descuento: number;
  otros_gastos: number;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Suma de pagos en paradas visitadas (mismo criterio que Historial / KPIs). */
export function sumMontosVisitadas(recolecciones: RecoleccionMontoRow[]) {
  let efectivo = 0;
  let transferencia = 0;
  let qr = 0;

  for (const item of recolecciones) {
    if (item.estado_operativo !== "visitada") continue;
    efectivo += num(item.monto_efectivo);
    transferencia += num(item.monto_transferencia);
    qr += num(item.monto_qr);
  }

  return { efectivo, transferencia, qr, total: efectivo + transferencia + qr };
}

/**
 * Totales de la ruta a persistir tras un cambio de carga o de gastos de jornada.
 * `monto_efectivo` / `monto_transferencia` se recalculan desde las paradas visitadas;
 * `total_efectivo` = efectivo − combustible − descuento − otros gastos.
 */
export function buildRutaTotalesCierreUpdate(
  recolecciones: RecoleccionMontoRow[],
  gastos: RutaGastosCierre,
):
  | { ok: true; data: Pick<RutaUpdate, "monto_efectivo" | "monto_transferencia" | "total_efectivo"> & { efectivo: number } }
  | { ok: false; error: string } {
  const { efectivo, transferencia } = sumMontosVisitadas(recolecciones);
  const combustible = Math.max(0, num(gastos.combustible));
  const descuento = Math.max(0, num(gastos.descuento));
  const otrosGastos = Math.max(0, num(gastos.otros_gastos));
  const totalGastos = combustible + descuento + otrosGastos;

  if (efectivo <= 0 && totalGastos > 0) {
    return {
      ok: false,
      error: "No podés cargar gastos si la ruta no recaudó efectivo",
    };
  }

  if (efectivo > 0 && totalGastos > efectivo) {
    return {
      ok: false,
      error: "Los gastos no pueden superar el efectivo recaudado",
    };
  }

  const totalEfectivo = calcTotalEfectivo(efectivo, combustible, descuento, otrosGastos);
  if (totalEfectivo < 0) {
    return { ok: false, error: "El total efectivo no puede ser negativo" };
  }

  return {
    ok: true,
    data: {
      efectivo,
      monto_efectivo: efectivo > 0 ? efectivo : null,
      monto_transferencia: transferencia > 0 ? transferencia : null,
      total_efectivo: totalEfectivo,
    },
  };
}
