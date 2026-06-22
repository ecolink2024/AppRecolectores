"use client";

import { useEffect } from "react";

import { FirmaDigitalImage } from "@/components/panel/firma-digital-image";
import {
  buildRecoleccionOperarioDetalleCarga,
  esFirmaDigitalImagen,
  type RecoleccionOperarioRow,
} from "@/lib/domain/operario-dashboard";

type Props = {
  open: boolean;
  recoleccion: RecoleccionOperarioRow | null;
  onClose: () => void;
};

export function OperarioRecoleccionDetalleModal({
  open,
  recoleccion,
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

  const detalle = buildRecoleccionOperarioDetalleCarga(recoleccion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recoleccion-detalle-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="recoleccion-detalle-modal-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Detalle de recolección
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              #{recoleccion.orden} · {recoleccion.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          {!detalle.tieneCarga ? (
            <p className="text-zinc-500">
              Esta parada aún no fue visitada ni cancelada. El detalle aparecerá cuando el
              recolector registre la recolección.
            </p>
          ) : detalle.cancelacion ? (
            <div>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">Cancelación</p>
              <p className="mt-1 text-orange-800 dark:text-orange-300">{detalle.cancelacion}</p>
            </div>
          ) : (
            <>
              <div>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Retiro</p>
                <dl className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between gap-4">
                    <dt>Bolsas</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.bolsas}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Biotachos</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.biotachos}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Cestos</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.cestos}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Recaudación</p>
                <dl className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between gap-4">
                    <dt>Efectivo</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.efectivo}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Transferencia</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.transferencia}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>QR</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {detalle.qr}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          {(recoleccion.nombre_firmante || recoleccion.firma_digital) && (
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">Firma</p>
              {recoleccion.nombre_firmante && (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Firmante:{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {recoleccion.nombre_firmante}
                  </span>
                </p>
              )}
              {recoleccion.firma_digital && esFirmaDigitalImagen(recoleccion.firma_digital) && (
                <div className="mt-3">
                  <FirmaDigitalImage
                    firmaRef={recoleccion.firma_digital}
                    alt={`Firma de ${recoleccion.nombre_firmante ?? recoleccion.nombre}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
