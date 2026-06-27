import type { RecoleccionOperativaEstado } from "@/types/database";

const ESTADOS_CIERRE_VALIDOS: RecoleccionOperativaEstado[] = ["visitada", "cancelada"];

export type FinalizarRutaCheck = {
  puedeFinalizar: boolean;
  recoleccionesPendientes: number;
  recoleccionesTotal: number;
  mensajeBloqueo: string | null;
};

export function evaluarFinalizarRuta(
  recolecciones: { estado_operativo: RecoleccionOperativaEstado }[],
  rutaEstado: string,
  rutaIniciada: boolean,
): FinalizarRutaCheck {
  const recoleccionesTotal = recolecciones.length;
  const recoleccionesPendientes = recolecciones.filter(
    (item) => !ESTADOS_CIERRE_VALIDOS.includes(item.estado_operativo),
  ).length;

  if (rutaEstado === "completada") {
    return {
      puedeFinalizar: false,
      recoleccionesPendientes,
      recoleccionesTotal,
      mensajeBloqueo: "La ruta ya fue finalizada",
    };
  }

  if (rutaEstado === "cancelada") {
    return {
      puedeFinalizar: false,
      recoleccionesPendientes,
      recoleccionesTotal,
      mensajeBloqueo: "La ruta está cancelada",
    };
  }

  if (!rutaIniciada || rutaEstado !== "en_curso") {
    return {
      puedeFinalizar: false,
      recoleccionesPendientes,
      recoleccionesTotal,
      mensajeBloqueo: "Iniciá la ruta antes de finalizarla",
    };
  }

  if (recoleccionesPendientes > 0) {
    return {
      puedeFinalizar: false,
      recoleccionesPendientes,
      recoleccionesTotal,
      mensajeBloqueo: `Faltan ${recoleccionesPendientes} recolección(es) por visitar o cancelar`,
    };
  }

  return {
    puedeFinalizar: true,
    recoleccionesPendientes: 0,
    recoleccionesTotal,
    mensajeBloqueo: null,
  };
}

export function validarFinalizarRutaEnServidor(
  recolecciones: { estado_operativo: RecoleccionOperativaEstado }[],
): { ok: true } | { ok: false; error: string } {
  const pendientes = recolecciones.filter(
    (item) => !ESTADOS_CIERRE_VALIDOS.includes(item.estado_operativo),
  );

  if (pendientes.length > 0) {
    return {
      ok: false,
      error: `Todas las recolecciones deben estar visitadas o canceladas (faltan ${pendientes.length})`,
    };
  }

  return { ok: true };
}
