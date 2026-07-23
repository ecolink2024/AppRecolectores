"use client";

import { useState } from "react";

import {
  RecoleccionEstadoBadge,
  ZonaBadge,
} from "@/components/panel/operario/operario-badges";
import {
  OPERARIO_SCROLL_RECOLECCIONES,
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import { OperarioClienteDetalleModal } from "@/components/panel/operario/operario-cliente-detalle-modal";
import { OperarioRecoleccionDetalleModal } from "@/components/panel/operario/operario-recoleccion-detalle-modal";
import {
  buildRecoleccionOperarioDetalleCarga,
  esFirmaDigitalImagen,
  formatCantidadCestos,
  formatHoraReal,
  formatMoney,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { formatTipoClienteLabel } from "@/lib/domain/constants";
import { isLegacyFirmaPlaceholder } from "@/lib/domain/firma-digital";

type Props = {
  recolecciones: RecoleccionOperarioRow[];
  rutaSeleccionada: boolean;
  ruta?: Pick<RutaOperarioRow, "fecha" | "turno" | "recolector_nombre" | "nombre"> | null;
  onEditar?: (id: string) => void;
};

export function OperarioRecoleccionesTable({
  recolecciones,
  rutaSeleccionada,
  ruta = null,
  onEditar,
}: Props) {
  const [detalleRecoleccionId, setDetalleRecoleccionId] = useState<string | null>(null);
  const [clienteRecoleccionId, setClienteRecoleccionId] = useState<string | null>(null);
  const recoleccionDetalle =
    recolecciones.find((item) => item.id === detalleRecoleccionId) ?? null;
  const clienteRecoleccion =
    recolecciones.find((item) => item.id === clienteRecoleccionId) ?? null;

  if (!rutaSeleccionada) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Seleccioná una ruta en la tabla superior.
      </div>
    );
  }

  if (recolecciones.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Esta ruta no tiene recolecciones cargadas.
      </div>
    );
  }

  return (
    <>
      <OperarioScrollableTable
        maxHeight={OPERARIO_SCROLL_RECOLECCIONES}
        footer={
          recolecciones.length > 10
            ? `${recolecciones.length} paradas · Desplazá para ver más`
            : `${recolecciones.length} parada${recolecciones.length === 1 ? "" : "s"}`
        }
      >
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className={OPERARIO_TABLE_HEAD_STICKY}>
            <tr>
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Estado</th>
              <th className="px-3 py-3 font-medium text-center">Detalle</th>
              <th className="px-3 py-3 font-medium">Zona</th>
              <th className="px-3 py-3 font-medium">Dirección</th>
              <th className="px-3 py-3 font-medium">Horario prog.</th>
              <th className="px-3 py-3 font-medium">Nombre</th>
              <th className="px-3 py-3 font-medium">Hora real</th>
              <th className="px-3 py-3 font-medium">Unidad</th>
              <th className="px-3 py-3 font-medium">Tipo de cliente</th>
              <th
                className="px-3 py-3 font-medium text-center"
                title="Cestos entregados en campo"
              >
                Cesto
              </th>
              <th className="px-3 py-3 font-medium text-right">Precio total</th>
              <th
                className="w-[5.5rem] max-w-[5.5rem] px-2 py-3 font-medium"
                title="Observaciones del recolector en campo"
              >
                Obs. recolector
              </th>
              <th
                className="w-[5.5rem] max-w-[5.5rem] px-2 py-3 font-medium"
                title="Observaciones de planilla u operario"
              >
                Obs. operario
              </th>
              <th className="px-3 py-3 font-medium">Firma</th>
              <th className="px-3 py-3 font-medium">Firmante</th>
              {onEditar && (
                <th className="px-3 py-3 font-medium text-center">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {recolecciones.map((item) => {
              const tieneDetalle = buildRecoleccionOperarioDetalleCarga(item).tieneCarga;
              const cancelada = item.estado_operativo === "cancelada";

              return (
                <tr
                  key={item.id}
                  className={
                    cancelada
                      ? "border-b border-red-100 bg-red-50 last:border-0 dark:border-red-950 dark:bg-red-950/40"
                      : "border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-zinc-700 dark:text-zinc-200">
                    {item.orden}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <RecoleccionEstadoBadge estado={item.estado_operativo} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setDetalleRecoleccionId(item.id)}
                      disabled={!tieneDetalle}
                      title={
                        tieneDetalle
                          ? "Ver retiro y recaudación"
                          : "Sin datos hasta visitar o cancelar la parada"
                      }
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 dark:disabled:border-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                    >
                      Ver detalle
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <ZonaBadge zona={item.zona} />
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2.5" title={item.direccion}>
                    {item.direccion}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{item.hora_programada}</td>
                  <td className="px-3 py-2.5 font-medium">{item.nombre}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span suppressHydrationWarning>{formatHoraReal(item.hora_real)}</span>
                  </td>
                  <td
                    className="max-w-[100px] truncate px-3 py-2.5 text-zinc-600 dark:text-zinc-400"
                    title={item.unidad ?? undefined}
                  >
                    {item.unidad?.trim() || "—"}
                  </td>
                  <td
                    className="max-w-[120px] truncate px-3 py-2.5 text-zinc-600 dark:text-zinc-400"
                    title={item.tipo_servicio ?? undefined}
                  >
                    {formatTipoClienteLabel(item.tipo_servicio)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    {formatCantidadCestos(item)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    {formatMoney(
                      item.precio_total ??
                        (item.precio_tarifa ? Number(item.precio_tarifa) || null : null),
                    )}
                  </td>
                  <td
                    className="max-w-[5.5rem] truncate px-2 py-2.5 text-zinc-600"
                    title={item.observaciones_recolector ?? undefined}
                  >
                    {item.observaciones_recolector || "—"}
                  </td>
                  <td
                    className="max-w-[5.5rem] truncate px-2 py-2.5 text-zinc-600"
                    title={item.observaciones ?? undefined}
                  >
                    {item.observaciones || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.firma_digital ? (
                      esFirmaDigitalImagen(item.firma_digital) ? (
                        <button
                          type="button"
                          onClick={() => setClienteRecoleccionId(item.id)}
                          className="text-xs font-medium text-violet-800 underline dark:text-violet-300"
                        >
                          Ver firma
                        </button>
                      ) : isLegacyFirmaPlaceholder(item.firma_digital) ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Confirmada</span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400">Sí</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">{item.nombre_firmante || "—"}</td>
                  {onEditar && (
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onEditar(item.id)}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </OperarioScrollableTable>

      <OperarioRecoleccionDetalleModal
        open={detalleRecoleccionId !== null}
        recoleccion={recoleccionDetalle}
        onClose={() => setDetalleRecoleccionId(null)}
      />

      <OperarioClienteDetalleModal
        open={clienteRecoleccionId !== null}
        recoleccion={clienteRecoleccion}
        rutaContext={
          ruta
            ? {
                fecha: ruta.fecha,
                turno: ruta.turno,
                recolector_nombre: ruta.recolector_nombre,
                nombre_ruta: ruta.nombre,
              }
            : null
        }
        onClose={() => setClienteRecoleccionId(null)}
      />
    </>
  );
}
