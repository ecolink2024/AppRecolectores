"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { calcTotalEfectivo } from "@/lib/domain/recolector-cierre-ruta";
import { formatRecolectorMoney, formatKm } from "@/lib/domain/recolector-ruta";

type Props = {
  rutaId: string;
  rutaNombre: string;
  kmInicial: number | null;
  efectivoRecaudado: number;
};

export function RecolectorFinalizarRutaForm({
  rutaId,
  rutaNombre,
  kmInicial,
  efectivoRecaudado,
}: Props) {
  const router = useRouter();

  const [kmFinal, setKmFinal] = useState("");
  const [descarga, setDescarga] = useState(false);
  const [descargaDetalle, setDescargaDetalle] = useState("");
  const [combustible, setCombustible] = useState("0");
  const [descuento, setDescuento] = useState("0");
  const [otrosGastos, setOtrosGastos] = useState("0");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kmFinalValue = useMemo(() => {
    const trimmed = kmFinal.trim();
    if (!trimmed) return null;
    const km = Number(trimmed.replace(",", "."));
    return Number.isFinite(km) ? km : null;
  }, [kmFinal]);

  const totalEfectivo = useMemo(() => {
    const c = Number(combustible.replace(",", ".")) || 0;
    const d = Number(descuento.replace(",", ".")) || 0;
    const o = Number(otrosGastos.replace(",", ".")) || 0;
    return calcTotalEfectivo(efectivoRecaudado, c, d, o);
  }, [efectivoRecaudado, combustible, descuento, otrosGastos]);

  const puedeCargarGastos = efectivoRecaudado > 0;
  const puedeFinalizar = kmFinalValue !== null && !saving;

  useEffect(() => {
    if (puedeCargarGastos) return;
    setCombustible("0");
    setDescuento("0");
    setOtrosGastos("0");
  }, [puedeCargarGastos]);

  const motivoBloqueoFinalizar = useMemo(() => {
    if (saving) return null;
    if (kmFinal.trim() === "") return "Completá los kilómetros finales para poder finalizar.";
    if (kmFinalValue === null) return "Los kilómetros finales deben ser un número válido.";
    if (kmFinalValue < 0) return "Los kilómetros finales no pueden ser negativos.";
    if (kmInicial != null && kmFinalValue < kmInicial) {
      return "Los kilómetros finales no pueden ser menores a los iniciales.";
    }
    return null;
  }, [saving, kmFinal, kmFinalValue, kmInicial]);

  const motivoBloqueoGastos = useMemo(() => {
    if (puedeCargarGastos) return null;
    return "No podés cargar gastos porque la ruta no recaudó efectivo.";
  }, [puedeCargarGastos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const km = kmFinalValue;
    if (km === null) {
      setError("Los kilómetros finales deben ser un número válido");
      return;
    }
    if (!Number.isFinite(km) || km < 0) {
      setError("Los kilómetros finales deben ser un número válido");
      return;
    }
    if (kmInicial != null && km < kmInicial) {
      setError("Los kilómetros finales no pueden ser menores a los iniciales");
      return;
    }

    const combustibleN = Number(combustible.replace(",", ".")) || 0;
    const descuentoN = Number(descuento.replace(",", ".")) || 0;
    const otrosGastosN = Number(otrosGastos.replace(",", ".")) || 0;

    if (combustibleN < 0 || descuentoN < 0 || otrosGastosN < 0) {
      setError("Los gastos no pueden ser negativos");
      return;
    }

    const gastos = combustibleN + descuentoN + otrosGastosN;
    if (!puedeCargarGastos && gastos > 0) {
      setError("No podés cargar gastos si la ruta no recaudó efectivo");
      return;
    }
    if (puedeCargarGastos && gastos > efectivoRecaudado) {
      setError("Los gastos no pueden superar el efectivo recaudado");
      return;
    }
    if (totalEfectivo < 0) {
      setError("El total efectivo no puede ser negativo");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/recolector/rutas/${rutaId}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          km_final: km,
          descarga,
          descarga_detalle: descarga ? descargaDetalle.trim() || null : null,
          combustible: combustibleN,
          descuento: descuentoN,
          otros_gastos: otrosGastosN,
          total_efectivo: totalEfectivo,
          observaciones_recolector: observaciones || null,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo finalizar la ruta");
      }

      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al finalizar la ruta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <Link
        href={`/panel/mis-rutas/${rutaId}`}
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver al detalle
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Cierre de ruta
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {rutaNombre}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Completá estos datos antes de finalizar la ruta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Km iniciales</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatKm(kmInicial)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Efectivo recaudado</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatRecolectorMoney(efectivoRecaudado)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Total efectivo</dt>
              <dd className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                {formatRecolectorMoney(totalEfectivo)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Kilómetros finales *
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              required
              value={kmFinal}
              onChange={(e) => setKmFinal(e.target.value)}
              placeholder="Ej: 45410.2"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          {motivoBloqueoFinalizar && (
            <p className="mt-2 text-xs text-zinc-500">{motivoBloqueoFinalizar}</p>
          )}

          <label className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-50">
            <input
              type="checkbox"
              checked={descarga}
              onChange={(e) => {
                const checked = e.target.checked;
                setDescarga(checked);
                if (!checked) setDescargaDetalle("");
              }}
              className="h-4 w-4"
            />
            Descarga realizada
          </label>
          {descarga && (
            <label className="mt-3 block space-y-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Detalle de descarga
              </span>
              <textarea
                value={descargaDetalle}
                onChange={(e) => setDescargaDetalle(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Lugar u observaciones de la descarga (opcional)"
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MoneyField
              label="Combustible"
              value={combustible}
              onChange={setCombustible}
              disabled={!puedeCargarGastos}
            />
            <MoneyField
              label="Descuento"
              value={descuento}
              onChange={setDescuento}
              disabled={!puedeCargarGastos}
            />
            <MoneyField
              label="Otros gastos"
              value={otrosGastos}
              onChange={setOtrosGastos}
              disabled={!puedeCargarGastos}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            El total efectivo se calcula como: efectivo recaudado − gastos.
          </p>
          {motivoBloqueoGastos && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {motivoBloqueoGastos}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Observaciones
            </span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Opcional"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!puedeFinalizar}
          className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 text-base font-semibold text-white active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:active:bg-zinc-200"
        >
          {saving ? "Finalizando ruta…" : "Finalizar ruta"}
        </button>
        {!puedeFinalizar && !error && motivoBloqueoFinalizar && (
          <p className="text-center text-xs text-zinc-500">{motivoBloqueoFinalizar}</p>
        )}
      </form>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
    </label>
  );
}

