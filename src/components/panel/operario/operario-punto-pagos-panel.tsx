"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Field, inputClass } from "@/components/panel/operario/operario-confirm-dialog";
import {
  OPERARIO_TABLE_HEAD_STICKY,
  OperarioScrollableTable,
} from "@/components/panel/operario/operario-scrollable-table";
import { formatMoney } from "@/lib/domain/operario-dashboard";
import {
  PUNTO_PAGO_SERVICIO_LABELS,
  PUNTO_PAGO_SERVICIOS,
  type PuntoPago,
  type PuntoPagoServicio,
} from "@/lib/domain/punto-pagos";
import { formatRutaFecha } from "@/lib/domain/rutas";

type Props = {
  initialPagos: PuntoPago[];
};

const TH = "whitespace-nowrap px-3 py-3 font-medium";
const TD = "whitespace-nowrap px-3 py-2.5";

export function OperarioPuntoPagosPanel({ initialPagos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pagos, setPagos] = useState(initialPagos);
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [servicio, setServicio] = useState<PuntoPagoServicio | "">("");
  const [cantidad, setCantidad] = useState("");
  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPagos(initialPagos);
  }, [initialPagos]);

  const sorted = useMemo(
    () =>
      [...pagos].sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.created_at.localeCompare(a.created_at);
      }),
    [pagos],
  );

  function resetForm() {
    setFecha("");
    setNombre("");
    setCelular("");
    setServicio("");
    setCantidad("");
    setMonto("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/panel/punto-pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha,
        nombre,
        celular,
        servicio: servicio || null,
        cantidad: cantidad === "" ? null : Number.parseInt(cantidad, 10),
        monto: monto === "" ? null : Number(monto.replace(",", ".")),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; item: PuntoPago }
      | { ok: false; error?: string }
      | null;

    setSaving(false);

    if (!payload || payload.ok !== true) {
      setError(payload && "error" in payload ? payload.error ?? "No se pudo guardar" : "No se pudo guardar");
      return;
    }

    setPagos((prev) => [payload.item, ...prev]);
    resetForm();
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pagos de punto</h2>
          <p className="text-sm text-zinc-500">
            Cargá pagos de tipo Punto. El empareje por celular se habilita más adelante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {open ? "Cerrar formulario" : "Agregar pago"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Fecha *">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Nombre *">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Celular *">
              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                className={inputClass}
                placeholder="+54 9 …"
                required
              />
            </Field>
            <Field label="Servicio *">
              <select
                value={servicio}
                onChange={(e) => setServicio(e.target.value as PuntoPagoServicio | "")}
                className={inputClass}
                required
              >
                <option value="">Elegí un servicio</option>
                {PUNTO_PAGO_SERVICIOS.map((value) => (
                  <option key={value} value={value}>
                    {PUNTO_PAGO_SERVICIO_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad *">
              <input
                type="number"
                min={0}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Monto *">
              <input
                type="number"
                min={0}
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar pago"}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          Todavía no hay pagos de punto en este rango de fechas.
        </div>
      ) : (
        <OperarioScrollableTable
          maxHeightClass="max-h-[min(40vh,24rem)]"
          footer={`${sorted.length} pago${sorted.length === 1 ? "" : "s"}`}
        >
          <table className="min-w-full text-left text-sm">
            <thead className={OPERARIO_TABLE_HEAD_STICKY}>
              <tr>
                <th className={TH}>Fecha</th>
                <th className={TH}>Nombre</th>
                <th className={TH}>Celular</th>
                <th className={TH}>Servicio</th>
                <th className={`${TH} text-right`}>Cantidad</th>
                <th className={`${TH} text-right`}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pago) => (
                <tr key={pago.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className={`${TD} font-medium text-zinc-800 dark:text-zinc-200`}>
                    {formatRutaFecha(pago.fecha)}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-zinc-900 dark:text-zinc-50" title={pago.nombre}>
                    {pago.nombre}
                  </td>
                  <td className={`${TD} text-zinc-700 dark:text-zinc-300`}>{pago.celular}</td>
                  <td className={`${TD} text-zinc-700 dark:text-zinc-300`}>
                    {PUNTO_PAGO_SERVICIO_LABELS[pago.servicio]}
                  </td>
                  <td className={`${TD} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                    {pago.cantidad}
                  </td>
                  <td className={`${TD} text-right tabular-nums font-medium text-zinc-800 dark:text-zinc-200`}>
                    {formatMoney(pago.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OperarioScrollableTable>
      )}
    </section>
  );
}
