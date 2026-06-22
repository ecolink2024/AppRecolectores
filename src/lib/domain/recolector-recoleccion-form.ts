import type { Database, RutaEstado } from "@/types/database";
import {
  formatPrecioDisplay,
  parsePrecioRetiro,
  recoleccionCerradaParaRecolector,
  recolectorPuedeEditarRecoleccion,
} from "@/lib/domain/recolector-recoleccion-campo";
import { RECOLECCION_OPERATIVA_LABELS } from "@/lib/domain/constants";
import {
  formatParametroMoney,
  isEmpresaPuntoCobro,
} from "@/lib/domain/sistema-parametros";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type RecoleccionCampoFormData = {
  id: string;
  rutaId: string;
  orden: number;
  direccion: string;
  nombre: string;
  unidad: string | null;
  tipoServicio: string | null;
  esEmpresaPunto: boolean;
  horaProgramada: string;
  observaciones: string | null;
  observacionesRecolector: string;
  precioRetiro: number;
  precioRetiroLabel: string;
  precioBolsaExtra: number;
  precioBolsaExtraLabel: string;
  precioRetiroReciclableMixto: number;
  precioRetiroReciclableMixtoLabel: string;
  precioBolsaPunto: number;
  precioBolsaPuntoLabel: string;
  precioBolsaLlenaPunto: number;
  precioBolsaLlenaPuntoLabel: string;
  estadoLabel: string;
  motivoCancelacion: string;
  bolsasLlenas: string;
  bolsasLlenasPunto: string;
  bolsasNuevasVendidas: string;
  biotachosLlenos: string;
  bolsasNuevas: string;
  biotachosNuevos: string;
  cestos: string;
  montoEfectivo: string;
  montoTransferencia: string;
  montoQr: string;
  nombreFirmante: string;
  firmaDigital: string | null;
  completada: boolean;
  soloLectura: boolean;
};

export function buildRecoleccionCampoFormData(
  rutaId: string,
  item: RecoleccionRow,
  precios: {
    bolsaExtra: number;
    retiroReciclableMixto: number;
    bolsaPunto: number;
    bolsaLlenaPunto: number;
  },
  estadoRuta: RutaEstado = "en_curso",
): RecoleccionCampoFormData {
  const precioRetiro = parsePrecioRetiro(item.precio);
  const completada = recoleccionCerradaParaRecolector(item.estado_operativo);
  const soloLectura = !recolectorPuedeEditarRecoleccion(item.estado_operativo, estadoRuta);
  const esEmpresaPunto = isEmpresaPuntoCobro(item.unidad, item.tipo_servicio);

  return {
    id: item.id,
    rutaId,
    orden: item.orden,
    direccion: item.direccion,
    nombre: item.nombre,
    unidad: item.unidad,
    tipoServicio: item.tipo_servicio,
    esEmpresaPunto,
    horaProgramada: String(item.hora).slice(0, 5),
    observaciones: item.observaciones,
    observacionesRecolector: item.observaciones_recolector ?? "",
    precioRetiro,
    precioRetiroLabel: formatPrecioDisplay(precioRetiro),
    precioBolsaExtra: precios.bolsaExtra,
    precioBolsaExtraLabel: formatParametroMoney(precios.bolsaExtra),
    precioRetiroReciclableMixto: precios.retiroReciclableMixto,
    precioRetiroReciclableMixtoLabel: formatParametroMoney(precios.retiroReciclableMixto),
    precioBolsaPunto: precios.bolsaPunto,
    precioBolsaPuntoLabel: formatParametroMoney(precios.bolsaPunto),
    precioBolsaLlenaPunto: precios.bolsaLlenaPunto,
    precioBolsaLlenaPuntoLabel: formatParametroMoney(precios.bolsaLlenaPunto),
    estadoLabel: RECOLECCION_OPERATIVA_LABELS[item.estado_operativo],
    motivoCancelacion: item.motivo_cancelacion ?? item.detalle ?? "",
    bolsasLlenas: item.bolsas_llenas != null ? String(item.bolsas_llenas) : "",
    bolsasLlenasPunto:
      item.bolsas_llenas_punto != null ? String(item.bolsas_llenas_punto) : "",
    bolsasNuevasVendidas:
      item.bolsas_nuevas_vendidas != null ? String(item.bolsas_nuevas_vendidas) : "",
    biotachosLlenos: item.biotachos_llenos != null ? String(item.biotachos_llenos) : "",
    bolsasNuevas: item.bolsas_nuevas != null ? String(item.bolsas_nuevas) : "",
    biotachosNuevos: item.biotachos_nuevos != null ? String(item.biotachos_nuevos) : "",
    cestos: item.cestos != null ? String(item.cestos) : "",
    montoEfectivo: paymentFieldToString(item.monto_efectivo),
    montoTransferencia: paymentFieldToString(item.monto_transferencia),
    montoQr: paymentFieldToString(item.monto_qr),
    nombreFirmante: item.nombre_firmante ?? "",
    firmaDigital: item.firma_digital,
    completada,
    soloLectura,
  };
}

function paymentFieldToString(value: number | null): string {
  if (value === null || value === undefined) return "0";
  return String(value);
}
