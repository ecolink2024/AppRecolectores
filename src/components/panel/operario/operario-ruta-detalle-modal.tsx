"use client";

import { useEffect } from "react";

import { OperarioRutaDetalle } from "@/components/panel/operario/operario-ruta-detalle";
import type { RutaDetalleOperario } from "@/lib/domain/operario-dashboard";

type Props = {
  open: boolean;
  detalle: RutaDetalleOperario | null;
  operarioNombre: string;
  onClose: () => void;
};

export function OperarioRutaDetalleModal({
  open,
  detalle,
  operarioNombre,
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

  if (!open || !detalle) return null;

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
        aria-labelledby="ruta-detalle-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2
            id="ruta-detalle-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Detalle de ruta
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          <OperarioRutaDetalle detalle={detalle} operarioNombre={operarioNombre} />
        </div>
      </div>
    </div>
  );
}
