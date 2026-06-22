import {
  calcPrecioTotalCobrarConReglas,
  isEmpresaPuntoCobro,
  normalizeTipoServicio,
  normalizeUnidad,
  type PrecioCobroInput,
} from "@/lib/domain/sistema-parametros";
import type { RecoleccionOperativaEstado, RutaEstado } from "@/types/database";

/** Estados en los que la recolección ya fue cargada por el recolector. */
export const RECOLECCION_ESTADOS_CERRADOS: RecoleccionOperativaEstado[] = [
  "visitada",
  "cancelada",
  "omitida",
];

export function recoleccionCerradaParaRecolector(
  estado: RecoleccionOperativaEstado,
): boolean {
  return RECOLECCION_ESTADOS_CERRADOS.includes(estado);
}

export function recolectorPuedeEditarRecoleccion(
  estadoRecoleccion: RecoleccionOperativaEstado,
  estadoRuta: RutaEstado,
): boolean {
  if (estadoRuta === "completada" || estadoRuta === "cerrada" || estadoRuta === "cancelada") return false;
  if (estadoRuta === "suspendida") return false;
  return !recoleccionCerradaParaRecolector(estadoRecoleccion);
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseOptionalCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseRequiredPayment(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parsePrecioRetiro(precio: string | null | undefined): number {
  if (!precio) return 0;
  const cleaned = precio.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function isHogarOrganico(
  unidad: string | null | undefined,
  tipoServicio: string | null | undefined,
): boolean {
  return (
    normalizeUnidad(unidad).toLowerCase() === "hogar" &&
    normalizeTipoServicio(tipoServicio).toLowerCase() === "organico"
  );
}

export function isTipoServicioReciclaje(tipoServicio: string | null | undefined): boolean {
  return normalizeTipoServicio(tipoServicio).toLowerCase() === "reciclaje";
}

export type RecoleccionCampoContadoresRules = {
  bolsasLlenasRequired: boolean;
  bolsasNuevasRequired: boolean;
  biotachosLlenosRequired: boolean;
  biotachosNuevosRequired: boolean;
};

export function getRecoleccionCampoContadoresRules(
  unidad: string | null | undefined,
  tipoServicio: string | null | undefined,
): RecoleccionCampoContadoresRules {
  const hogarOrganico = isHogarOrganico(unidad, tipoServicio);
  const reciclaje = isTipoServicioReciclaje(tipoServicio);

  return {
    bolsasLlenasRequired: !hogarOrganico,
    bolsasNuevasRequired: !hogarOrganico,
    biotachosLlenosRequired: !reciclaje,
    biotachosNuevosRequired: !reciclaje,
  };
}

export type RecoleccionCampoPayload = {
  motivo_cancelacion: string | null;
  observaciones_recolector: string | null;
  bolsas_llenas: number | null;
  bolsas_llenas_punto: number | null;
  bolsas_nuevas_vendidas: number | null;
  biotachos_llenos: number | null;
  bolsas_nuevas: number | null;
  biotachos_nuevos: number | null;
  cestos: number | null;
  precio_total: number;
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  monto_qr: number | null;
  nombre_firmante: string;
  firma_digital: string;
  cancelada: boolean;
};

export function parseRecoleccionCampoBody(
  body: Record<string, unknown>,
  precios: Omit<PrecioCobroInput, "bolsasLlenas" | "bolsasLlenasPunto" | "bolsasNuevasVendidas">,
): { ok: true; data: RecoleccionCampoPayload } | { ok: false; error: string } {
  const motivo_cancelacion = str(body.motivo_cancelacion) || null;
  const observaciones_recolector = str(body.observaciones_recolector) || null;
  const nombre_firmante = str(body.nombre_firmante);
  const firma_digital = str(body.firma_digital);
  const empresaPunto = isEmpresaPuntoCobro(precios.unidad, precios.tipoServicio);

  if (!nombre_firmante) {
    return { ok: false, error: "El nombre del firmante es obligatorio" };
  }

  if (!firma_digital) {
    return { ok: false, error: "Debés capturar la firma del cliente en el recuadro" };
  }

  if (motivo_cancelacion) {
    return {
      ok: true,
      data: {
        motivo_cancelacion,
        observaciones_recolector,
        bolsas_llenas: null,
        bolsas_llenas_punto: null,
        bolsas_nuevas_vendidas: null,
        biotachos_llenos: null,
        bolsas_nuevas: null,
        biotachos_nuevos: null,
        cestos: null,
        precio_total: precios.precioRetiro,
        monto_efectivo: null,
        monto_transferencia: null,
        monto_qr: null,
        nombre_firmante,
        firma_digital,
        cancelada: true,
      },
    };
  }

  const bolsas_llenas = parseOptionalCount(body.bolsas_llenas);
  const biotachos_llenos = parseOptionalCount(body.biotachos_llenos);
  const bolsas_nuevas = parseOptionalCount(body.bolsas_nuevas);
  const biotachos_nuevos = parseOptionalCount(body.biotachos_nuevos);
  const cestos = parseOptionalCount(body.cestos);
  const bolsas_llenas_punto = parseOptionalCount(body.bolsas_llenas_punto);
  const bolsas_nuevas_vendidas = parseOptionalCount(body.bolsas_nuevas_vendidas);

  const contadoresRules = getRecoleccionCampoContadoresRules(
    precios.unidad,
    precios.tipoServicio,
  );
  const faltantes: string[] = [];
  if (contadoresRules.bolsasLlenasRequired && bolsas_llenas === null) {
    faltantes.push("bolsas llenas");
  }
  if (contadoresRules.bolsasNuevasRequired && bolsas_nuevas === null) {
    faltantes.push("bolsas nuevas");
  }
  if (contadoresRules.biotachosLlenosRequired && biotachos_llenos === null) {
    faltantes.push("biotachos llenos");
  }
  if (contadoresRules.biotachosNuevosRequired && biotachos_nuevos === null) {
    faltantes.push("biotachos nuevos");
  }
  if (cestos === null) {
    faltantes.push("cestos");
  }

  if (faltantes.length > 0) {
    return {
      ok: false,
      error: `Completá ${faltantes.join(", ")} (podés poner 0)`,
    };
  }

  if (empresaPunto && (bolsas_llenas_punto === null || bolsas_nuevas_vendidas === null)) {
    return {
      ok: false,
      error: "Completá bolsas llenas punto y bolsas nuevas vendidas (podés poner 0)",
    };
  }

  const precio_total = calcPrecioTotalCobrarConReglas({
    ...precios,
    bolsasLlenas: bolsas_llenas ?? 0,
    bolsasLlenasPunto: bolsas_llenas_punto ?? 0,
    bolsasNuevasVendidas: bolsas_nuevas_vendidas ?? 0,
  });
  const monto_efectivo = parseRequiredPayment(body.monto_efectivo);
  const monto_transferencia = parseRequiredPayment(body.monto_transferencia);
  const monto_qr = parseRequiredPayment(body.monto_qr);

  if (monto_efectivo === null || monto_transferencia === null || monto_qr === null) {
    return {
      ok: false,
      error: "Completá efectivo, transferencia y QR (podés poner 0 en los que no apliquen)",
    };
  }

  const sumaPagos = monto_efectivo + monto_transferencia + monto_qr;

  if (sumaPagos + 0.01 < precio_total) {
    return {
      ok: false,
      error: `La suma de los pagos (${sumaPagos}) no puede ser menor al total a cobrar (${precio_total})`,
    };
  }

  return {
    ok: true,
    data: {
      motivo_cancelacion: null,
      observaciones_recolector,
      bolsas_llenas,
      bolsas_llenas_punto: empresaPunto ? bolsas_llenas_punto : null,
      bolsas_nuevas_vendidas: empresaPunto ? bolsas_nuevas_vendidas : null,
      biotachos_llenos,
      bolsas_nuevas,
      biotachos_nuevos,
      cestos,
      precio_total,
      monto_efectivo,
      monto_transferencia,
      monto_qr,
      nombre_firmante,
      firma_digital,
      cancelada: false,
    },
  };
}

export function formatPrecioDisplay(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
