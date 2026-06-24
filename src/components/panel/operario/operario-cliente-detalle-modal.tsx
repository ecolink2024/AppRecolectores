"use client";

import { useEffect } from "react";

import { FirmaDigitalImage } from "@/components/panel/firma-digital-image";
import {
  esFirmaDigitalImagen,
  formatCantidadBiotachos,
  formatCantidadBolsas,
  formatCantidadBolsasNuevas,
  formatHoraReal,
  formatMoney,
  formatRutaHorario,
  type RecoleccionOperarioRow,
} from "@/lib/domain/operario-dashboard";
import type { RutaTurno } from "@/types/database";

type RutaContext = {
  fecha: string;
  turno: RutaTurno | null;
  recolector_nombre: string | null;
  nombre_ruta?: string;
};

type Props = {
  open: boolean;
  recoleccion: RecoleccionOperarioRow | null;
  rutaContext: RutaContext | null;
  onClose: () => void;
};

function Row({
  label,
  value,
  suppressHydrationWarning,
}: {
  label: string;
  value: string;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd
        className="text-sm text-zinc-900 dark:text-zinc-100"
        suppressHydrationWarning={suppressHydrationWarning}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

export function OperarioClienteDetalleModal({
  open,
  recoleccion,
  rutaContext,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !recoleccion) return null;

  const mapsUrl =
    recoleccion.latitud != null && recoleccion.longitud != null
      ? `https://www.google.com/maps?q=${recoleccion.latitud},${recoleccion.longitud}`
      : recoleccion.direccion_google || null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-detalle-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2
            id="cliente-detalle-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Cliente — {recoleccion.nombre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {rutaContext && (
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              {rutaContext.nombre_ruta ? `${rutaContext.nombre_ruta} · ` : ""}
              {formatRutaHorario(rutaContext.fecha, rutaContext.turno)}
              {rutaContext.recolector_nombre
                ? ` · ${rutaContext.recolector_nombre}`
                : ""}
            </p>
          )}

          <section className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Info
            </h3>
            <dl className="mt-3 space-y-3">
              <Row label="Horario programado" value={recoleccion.hora_programada} />
              <Row
                label="Hora real"
                value={formatHoraReal(recoleccion.hora_real)}
                suppressHydrationWarning
              />
              <Row label="Bolsas nuevas" value={formatCantidadBolsasNuevas(recoleccion)} />
            </dl>
          </section>

          <dl className="space-y-3">
            <Row label="Nombre" value={recoleccion.nombre} />
            <Row label="Dirección" value={recoleccion.direccion} />
            <Row label="Barrio" value={recoleccion.barrio ?? ""} />
            <Row label="Depto" value={recoleccion.depto ?? ""} />
            <Row label="Unidad" value={recoleccion.unidad ?? ""} />
            <Row label="Zona" value={recoleccion.zona ?? ""} />
            <Row label="Teléfono" value={recoleccion.telefono ?? ""} />
            <Row label="Tipo de servicio" value={recoleccion.tipo_servicio ?? ""} />
            <Row label="Frecuencia" value={recoleccion.frecuencia ?? ""} />
            <Row label="Día" value={recoleccion.dia ?? ""} />
            <Row label="Precio planilla" value={recoleccion.precio_tarifa ?? ""} />
            <Row label="Deuda" value={recoleccion.deuda ?? ""} />
            <Row label="Nota encargado" value={recoleccion.nota_encargado ?? ""} />
              <Row label="Observaciones planilla" value={recoleccion.observaciones ?? ""} />
              {recoleccion.motivo_cancelacion && (
                <Row label="Motivo cancelación" value={recoleccion.motivo_cancelacion} />
              )}
            {recoleccion.coordenadas_dms && (
              <Row label="Coordenadas" value={recoleccion.coordenadas_dms} />
            )}
          </dl>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              Ver en mapa
            </a>
          )}

          <section className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Carga en campo
            </h3>
            <dl className="mt-3 space-y-3">
              <Row label="Bolsas llenas" value={formatCantidadBolsas(recoleccion)} />
              <Row label="Biotachos llenos" value={formatCantidadBiotachos(recoleccion)} />
              <Row
                label="Precio total"
                value={formatMoney(
                  recoleccion.precio_total ??
                    (recoleccion.precio_tarifa ? Number(recoleccion.precio_tarifa) || 0 : null),
                )}
              />
              <Row label="Efectivo" value={formatMoney(recoleccion.monto_efectivo)} />
              <Row label="Transferencia" value={formatMoney(recoleccion.monto_transferencia)} />
              <Row label="QR" value={formatMoney(recoleccion.monto_qr)} />
              <Row label="Detalle cobro" value={recoleccion.detalle ?? ""} />
              <Row label="Firmante" value={recoleccion.nombre_firmante ?? ""} />
            </dl>
            {recoleccion.firma_digital && esFirmaDigitalImagen(recoleccion.firma_digital) && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Firma digital
                </p>
                <FirmaDigitalImage
                  firmaRef={recoleccion.firma_digital}
                  alt={`Firma de ${recoleccion.nombre_firmante ?? recoleccion.nombre}`}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
