"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  KPI_PERIODO_LABELS,
  type KpiFiltroModo,
  type KpiPeriodo,
} from "@/lib/domain/operario-kpis";

type Props = {
  desde: string;
  hasta: string;
  modo: KpiFiltroModo;
  periodoPreset: KpiPeriodo | null;
  /** Ruta base del panel (default KPIs). */
  basePath?: string;
};

export function OperarioKpisFiltroFechas({
  desde,
  hasta,
  modo,
  periodoPreset,
  basePath = "/panel/kpis",
}: Props) {
  const router = useRouter();
  const [desdeInput, setDesdeInput] = useState(desde);
  const [hastaInput, setHastaInput] = useState(hasta);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDesdeInput(desde);
    setHastaInput(hasta);
  }, [desde, hasta]);

  function setPeriodo(p: KpiPeriodo) {
    setError(null);
    router.push(`${basePath}?periodo=${p}`);
  }

  function aplicarRango(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!desdeInput || !hastaInput) {
      setError("Completá fecha desde y fecha hasta.");
      return;
    }

    if (desdeInput > hastaInput) {
      setError("La fecha desde no puede ser posterior a la fecha hasta.");
      return;
    }

    const params = new URLSearchParams();
    params.set("desde", desdeInput);
    params.set("hasta", hastaInput);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-3xl space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={aplicarRango} className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Rango de fechas
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Desde
            </span>
            <input
              type="date"
              value={desdeInput}
              max={hastaInput || undefined}
              onChange={(e) => setDesdeInput(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Hasta
            </span>
            <input
              type="date"
              value={hastaInput}
              min={desdeInput || undefined}
              onChange={(e) => setHastaInput(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Aplicar
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {modo === "rango" && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Filtro activo: rango personalizado
          </p>
        )}
      </form>

      <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Atajos rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KPI_PERIODO_LABELS) as KpiPeriodo[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                modo === "preset" && periodoPreset === p
                  ? "bg-emerald-700 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {KPI_PERIODO_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
