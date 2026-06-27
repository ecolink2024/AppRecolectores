import type { Database, RutaEstado } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

/** Rutas en Historial (finalizadas por recolector, cerradas operariamente o canceladas). */
export const RUTA_ESTADOS_HISTORIAL: RutaEstado[] = [
  "completada",
  "cerrada",
  "cancelada",
];

export function esRutaHistorial(estado: RutaEstado): boolean {
  return RUTA_ESTADOS_HISTORIAL.includes(estado);
}

export function esRutaOperativa(estado: RutaEstado): boolean {
  return !esRutaHistorial(estado);
}

/** Rutas en Historial que el operario puede reabrir (antes del cierre operario). */
export function puedeReactivarRuta(estado: RutaEstado): boolean {
  return estado === "completada";
}

/** Campos a limpiar al reactivar, según el estado previo. */
export function limpiezaTrasReactivar(estado: RutaEstado): RutaUpdate {
  const base = {
    cierre_operario_at: null,
    cierre_operario_por: null,
  };

  if (estado === "completada" || estado === "cerrada") {
    return {
      ...base,
      cierre_recolector_at: null,
      km_final: null,
      descarga: false,
      combustible: null,
      descuento: null,
      otros_gastos: null,
      total_efectivo: null,
      observaciones_recolector: null,
    };
  }

  return base;
}

export function puedeCierreOperario(estado: RutaEstado): boolean {
  return estado === "completada";
}

export function estadoTrasReactivar(): "en_curso" {
  return "en_curso";
}
