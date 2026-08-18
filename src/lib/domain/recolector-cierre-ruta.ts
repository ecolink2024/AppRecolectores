export type RecolectorCierreRutaPayload = {
  km_final: number;
  descarga: boolean;
  descarga_detalle: string | null;
  combustible: number;
  descuento: number;
  otros_gastos: number;
  total_efectivo: number;
  observaciones_recolector: string | null;
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

const DESCARGA_DETALLE_MAX = 500;

export function parseDescargaDetalle(
  descarga: boolean,
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const detalleRaw = str(value);
  if (detalleRaw.length > DESCARGA_DETALLE_MAX) {
    return { ok: false, error: "El detalle de descarga no puede superar 500 caracteres" };
  }
  return { ok: true, value: descarga && detalleRaw ? detalleRaw : null };
}

export function calcTotalEfectivo(
  efectivoRecaudado: number,
  combustible: number,
  descuento: number,
  otrosGastos: number,
): number {
  const total = efectivoRecaudado - combustible - descuento - otrosGastos;
  return Number.isFinite(total) ? total : 0;
}

export function parseRecolectorCierreRutaBody(
  body: Record<string, unknown>,
  ctx: { kmInicial: number | null; efectivoRecaudado: number },
): { ok: true; data: RecolectorCierreRutaPayload } | { ok: false; error: string } {
  const km_final_raw = asNumber(body.km_final);
  if (km_final_raw === null) return { ok: false, error: "Kilómetros finales inválidos" };
  if (km_final_raw < 0) return { ok: false, error: "Kilómetros finales inválidos" };
  if (ctx.kmInicial != null && km_final_raw < ctx.kmInicial) {
    return { ok: false, error: "Los kilómetros finales no pueden ser menores a los iniciales" };
  }

  const descarga = Boolean(body.descarga);

  const combustible = asNumber(body.combustible) ?? 0;
  const descuento = asNumber(body.descuento) ?? 0;
  const otros_gastos = asNumber(body.otros_gastos) ?? 0;

  if (combustible < 0 || descuento < 0 || otros_gastos < 0) {
    return { ok: false, error: "Los gastos no pueden ser negativos" };
  }

  const efectivo = Number.isFinite(ctx.efectivoRecaudado) ? ctx.efectivoRecaudado : 0;
  const gastos = combustible + descuento + otros_gastos;

  if (efectivo <= 0 && gastos > 0) {
    return {
      ok: false,
      error: "No podés cargar gastos si la ruta no recaudó efectivo",
    };
  }

  if (efectivo > 0 && gastos > efectivo) {
    return {
      ok: false,
      error: "Los gastos no pueden superar el efectivo recaudado",
    };
  }

  const totalCalculado = calcTotalEfectivo(ctx.efectivoRecaudado, combustible, descuento, otros_gastos);
  const totalBody = asNumber(body.total_efectivo);
  const total_efectivo = totalBody ?? totalCalculado;

  if (total_efectivo < 0) {
    return { ok: false, error: "El total efectivo no puede ser negativo" };
  }

  const observacionesRaw = str(body.observaciones_recolector);
  const observaciones_recolector = observacionesRaw ? observacionesRaw : null;

  const detalleParsed = parseDescargaDetalle(descarga, body.descarga_detalle);
  if (!detalleParsed.ok) return detalleParsed;
  const descarga_detalle = detalleParsed.value;

  return {
    ok: true,
    data: {
      km_final: km_final_raw,
      descarga,
      descarga_detalle,
      combustible,
      descuento,
      otros_gastos,
      total_efectivo,
      observaciones_recolector,
    },
  };
}

