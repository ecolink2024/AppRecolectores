/**
 * Categoría de parada: cliente (servicio/cobro) vs logística (Proveedor/Cooperativa).
 * Las logísticas aparecen en rutas pero no entran a KPIs ni agregados de servicios/recaudación.
 */

export const PARADA_CATEGORIAS = ["cliente", "logistica"] as const;
export type ParadaCategoria = (typeof PARADA_CATEGORIAS)[number];

export const RECOLECCION_TIPOS_LOGISTICA = ["Proveedor", "Cooperativa"] as const;
export type RecoleccionTipoLogistica = (typeof RECOLECCION_TIPOS_LOGISTICA)[number];

export function normalizeTipoServicioFold(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isTipoServicioLogistica(tipoServicio: string | null | undefined): boolean {
  const folded = normalizeTipoServicioFold(tipoServicio);
  return folded === "proveedor" || folded === "cooperativa";
}

export function categoriaFromTipoServicio(
  tipoServicio: string | null | undefined,
): ParadaCategoria {
  return isTipoServicioLogistica(tipoServicio) ? "logistica" : "cliente";
}

export function isParadaLogistica(rec: {
  categoria_parada?: string | null;
  tipo_servicio?: string | null;
}): boolean {
  if (rec.categoria_parada === "logistica") return true;
  if (rec.categoria_parada === "cliente") return false;
  return isTipoServicioLogistica(rec.tipo_servicio);
}

/** Paradas que cuentan para métricas de servicios / recaudación / KPIs. */
export function isParadaClienteMetricas(rec: {
  categoria_parada?: string | null;
  tipo_servicio?: string | null;
}): boolean {
  return !isParadaLogistica(rec);
}
