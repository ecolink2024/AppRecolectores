"use client";

import { useState } from "react";

import { OperarioClienteDetalleModal } from "@/components/panel/operario/operario-cliente-detalle-modal";
import {
  OPERARIO_SCROLL_HISTORIAL_RECOLECCIONES,
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import {
  RecoleccionEstadoBadge,
  ZonaBadge,
} from "@/components/panel/operario/operario-badges";
import {
  esFirmaDigitalImagen,
  formatCantidadBiotachos,
  formatCantidadBolsas,
  formatMoney,
  formatRutaHorario,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { formatTipoClienteLabel } from "@/lib/domain/constants";
import { puedeEditarCargaStaff } from "@/lib/domain/ruta-estado-transiciones";

type Props = {
  recolecciones: RecoleccionOperarioRow[];
  ruta: RutaOperarioRow | null;
  onEditarCarga?: (id: string) => void;
};

const TH = "whitespace-nowrap px-3 py-3 font-medium";
const TD = "whitespace-nowrap px-3 py-2.5";

function ClienteCell({
  item,
  onVerCliente,
}: {
  item: RecoleccionOperarioRow;
  onVerCliente: () => void;
}) {
  return (
    <div className="flex max-w-[200px] items-center gap-1.5">
      <button
        type="button"
        onClick={onVerCliente}
        className="truncate text-left font-medium text-violet-800 underline decoration-violet-300 underline-offset-2 hover:text-violet-950 dark:text-violet-300 dark:decoration-violet-700 dark:hover:text-violet-100"
        title={item.nombre}
      >
        {item.nombre}
      </button>
      <button
        type="button"
        onClick={onVerCliente}
        aria-label={`Ver datos del cliente ${item.nombre}`}
        className="shrink-0 rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300"
      >
        Info
      </button>
    </div>
  );
}

function TextCell({
  value,
  maxWidth = "140px",
}: {
  value: string | null | undefined;
  maxWidth?: string;
}) {
  const text = value?.trim() || "—";
  return (
    <td
      className="truncate px-3 py-2.5 text-zinc-600 dark:text-zinc-400"
      style={{ maxWidth }}
      title={text !== "—" ? text : undefined}
    >
      {text}
    </td>
  );
}

export function OperarioHistorialRecoleccionesTable({
  recolecciones,
  ruta,
  onEditarCarga,
}: Props) {
  const [clienteRecoleccionId, setClienteRecoleccionId] = useState<string | null>(null);

  const clienteRecoleccion =
    recolecciones.find((r) => r.id === clienteRecoleccionId) ?? null;
  const editableCarga = !!onEditarCarga && !!ruta && puedeEditarCargaStaff(ruta.estado);

  if (!ruta) {
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

  const horarioRuta = formatRutaHorario(ruta.fecha, ruta.turno);
  const recolector = ruta.recolector_nombre ?? "—";

  return (
    <>
      <OperarioScrollableTable
        maxHeight={OPERARIO_SCROLL_HISTORIAL_RECOLECCIONES}
        footer={
          recolecciones.length > 10
            ? `${recolecciones.length} paradas · Desplazá para ver más`
            : `${recolecciones.length} parada${recolecciones.length === 1 ? "" : "s"}`
        }
      >
        <table className="min-w-[2100px] w-full text-left text-sm">
          <thead className={OPERARIO_TABLE_HEAD_STICKY}>
            <tr>
              <th className={TH}>Horario</th>
              <th className={TH}>Recolector</th>
              <th className={TH}>Nombre cliente</th>
              <th className={TH}>Zona</th>
              <th className={`${TH} text-center`}>Biotachos llenos</th>
              <th className={`${TH} text-center`}>Bolsas llenas</th>
              <th className={`${TH} text-right`}>Precio total</th>
              <th className={`${TH} text-right`}>Monto efectivo</th>
              <th className={`${TH} text-right`}>Monto transferencia</th>
              <th className={`${TH} text-right`}>Monto QR</th>
              <th className={TH}>Estado</th>
              <th className={TH}>Motivo cancelación</th>
              <th className={TH}>Observaciones</th>
              <th className={TH}>Detalle</th>
              <th className={TH}>Firma digital</th>
              <th className={TH}>Nombre firmante</th>
              <th className={TH}>Unidad</th>
              <th className={TH}>Tipo de cliente</th>
              {editableCarga && (
                <th
                  className={`${TH} sticky right-0 z-20 bg-zinc-50 text-center dark:bg-zinc-950`}
                >
                  Editar carga
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {recolecciones.map((item) => {
              const cancelada = item.estado_operativo === "cancelada";
              const rowClass = cancelada
                ? "border-b border-red-100 bg-red-50 last:border-0 dark:border-red-950 dark:bg-red-950/40"
                : "border-b border-zinc-100 last:border-0 dark:border-zinc-800";
              const stickyBg = cancelada
                ? "bg-red-50 dark:bg-red-950/40"
                : "bg-white dark:bg-zinc-900";

              return (
                <tr key={item.id} className={rowClass}>
                  <td className={`${TD} text-zinc-600`}>{horarioRuta}</td>
                  <td className={TD}>{recolector}</td>
                  <td className={TD}>
                    <ClienteCell
                      item={item}
                      onVerCliente={() => setClienteRecoleccionId(item.id)}
                    />
                  </td>
                  <td className={TD}>
                    <button
                      type="button"
                      onClick={() => setClienteRecoleccionId(item.id)}
                      className="inline-flex"
                    >
                      <ZonaBadge zona={item.zona} />
                    </button>
                  </td>
                  <td className={`${TD} text-center`}>
                    {formatCantidadBiotachos(item)}
                  </td>
                  <td className={`${TD} text-center`}>
                    {formatCantidadBolsas(item)}
                  </td>
                  <td className={`${TD} text-right`}>
                    {formatMoney(
                      item.precio_total ??
                        (item.precio_tarifa ? Number(item.precio_tarifa) || null : null),
                    )}
                  </td>
                  <td className={`${TD} text-right`}>{formatMoney(item.monto_efectivo)}</td>
                  <td className={`${TD} text-right`}>
                    {formatMoney(item.monto_transferencia)}
                  </td>
                  <td className={`${TD} text-right`}>{formatMoney(item.monto_qr)}</td>
                  <td className={TD}>
                    <RecoleccionEstadoBadge estado={item.estado_operativo} />
                  </td>
                  <TextCell value={item.motivo_cancelacion} maxWidth="160px" />
                  <TextCell value={item.observaciones} maxWidth="140px" />
                  <TextCell value={item.detalle} maxWidth="120px" />
                  <td className={TD}>
                    {item.firma_digital ? (
                      esFirmaDigitalImagen(item.firma_digital) ? (
                        <button
                          type="button"
                          onClick={() => setClienteRecoleccionId(item.id)}
                          className="text-xs font-medium text-violet-800 underline dark:text-violet-300"
                        >
                          Ver firma
                        </button>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400">Confirmada</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={TD}>{item.nombre_firmante || "—"}</td>
                  <TextCell value={item.unidad} maxWidth="100px" />
                  <TextCell value={formatTipoClienteLabel(item.tipo_servicio)} maxWidth="120px" />
                  {editableCarga && (
                    <td
                      className={`${TD} sticky right-0 z-10 text-center ${stickyBg}`}
                    >
                      <button
                        type="button"
                        onClick={() => onEditarCarga?.(item.id)}
                        className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                      >
                        Editar carga
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </OperarioScrollableTable>

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
