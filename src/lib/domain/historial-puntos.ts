import { isEmpresaPuntoCobro } from "@/lib/domain/sistema-parametros";
import { formatMoney, type RecoleccionOperarioRow } from "@/lib/domain/operario-dashboard";
import { formatRutaFecha } from "@/lib/domain/rutas";
import type { RecoleccionOperativaEstado } from "@/types/database";

export type HistorialPuntoRow = {
  id: string;
  fecha: string;
  fechaLabel: string;
  punto: string;
  bolsasClientesLlenas: number | null;
  bolsasNuevasVendidas: number | null;
  bolsasLlenasPunto: number | null;
  bolsasNuevas: number | null;
  monto: number | null;
  formaPago: string;
  observaciones: string | null;
  estadoOperativo: RecoleccionOperativaEstado;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatFormaPagoPunto(item: {
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  monto_qr: number | null;
}): string {
  const parts: string[] = [];
  if (num(item.monto_efectivo) > 0) {
    parts.push(`Efectivo ${formatMoney(item.monto_efectivo)}`);
  }
  if (num(item.monto_transferencia) > 0) {
    parts.push(`Transferencia ${formatMoney(item.monto_transferencia)}`);
  }
  if (num(item.monto_qr) > 0) {
    parts.push(`QR ${formatMoney(item.monto_qr)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function pickObservaciones(item: RecoleccionOperarioRow): string | null {
  const recolector = item.observaciones_recolector?.trim() || "";
  const operario = item.observaciones?.trim() || "";
  if (recolector && operario) return `${recolector} · ${operario}`;
  return recolector || operario || null;
}

export function buildHistorialPuntosRows(
  rutas: { id: string; fecha: string }[],
  recolecciones: RecoleccionOperarioRow[],
): HistorialPuntoRow[] {
  const fechaPorRuta = new Map(rutas.map((ruta) => [ruta.id, ruta.fecha]));

  return recolecciones
    .filter((item) => isEmpresaPuntoCobro(item.unidad, item.tipo_servicio))
    .map((item) => {
      const fecha = fechaPorRuta.get(item.ruta_id) || item.dia || "";
      const visitada = item.estado_operativo === "visitada";
      return {
        id: item.id,
        fecha,
        fechaLabel: fecha ? formatRutaFecha(fecha) : "—",
        punto: item.nombre?.trim() || "—",
        bolsasClientesLlenas: visitada ? item.bolsas_llenas : null,
        bolsasNuevasVendidas: visitada ? item.bolsas_nuevas_vendidas : null,
        bolsasLlenasPunto: visitada ? item.bolsas_llenas_punto : null,
        bolsasNuevas: visitada ? item.bolsas_nuevas : null,
        monto: visitada ? item.precio_total : null,
        formaPago: visitada ? formatFormaPagoPunto(item) : "—",
        observaciones: pickObservaciones(item),
        estadoOperativo: item.estado_operativo,
      };
    })
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
      return a.punto.localeCompare(b.punto, "es");
    });
}
