"use client";

import { useEffect } from "react";

import type { RutaOperarioRow } from "@/lib/domain/operario-dashboard";
import { INSUMO_TIPOS } from "@/lib/domain/ruta-insumos";

type Props = {
  open: boolean;
  ruta: RutaOperarioRow | null;
  onClose: () => void;
};

export function OperarioRutaInsumosModal({ open, ruta, onClose }: Props) {
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

  if (!open || !ruta) return null;

  const d = ruta.insumos_detalle;

  const rows: { label: string; value: string }[] = INSUMO_TIPOS.map((tipo) => ({
    label: tipo,
    value: String(d.insumosPorTipo[tipo] ?? 0),
  }));

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
        aria-labelledby="insumos-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="insumos-modal-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Insumos de inicio
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{ruta.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 px-5 py-3 text-sm"
            >
              <dt className="text-zinc-500">{row.label}</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
