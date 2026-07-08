"use client";

import { useEffect, useState } from "react";

import {
  OperarioConfirmDialog,
  Field,
  inputClass,
} from "@/components/panel/operario/operario-confirm-dialog";
import { InsumosListaEditor } from "@/components/panel/insumos-lista-editor";
import {
  RUTA_ESTADO_LABELS,
  RUTA_ESTADOS,
  RUTA_TURNO_LABELS,
  RUTA_TURNOS,
} from "@/lib/domain/constants";
import type { RecolectorOption, RutaOperarioRow } from "@/lib/domain/operario-dashboard";
import { puedeEditarCargaStaff } from "@/lib/domain/ruta-estado-transiciones";
import type { InsumoInicio } from "@/lib/domain/ruta-insumos";

type Props = {
  open: boolean;
  ruta: RutaOperarioRow | null;
  recolectores: RecolectorOption[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: (rutaId: string) => void;
};

export function OperarioRutaFormModal({
  open,
  ruta,
  recolectores,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState<string>("");
  const [estado, setEstado] = useState<string>("activa");
  const [asignadoA, setAsignadoA] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [kmRecorridos, setKmRecorridos] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [descarga, setDescarga] = useState(false);
  const [combustible, setCombustible] = useState("");
  const [otrosGastos, setOtrosGastos] = useState("");
  const [insumosInicio, setInsumosInicio] = useState<InsumoInicio[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editaJornada = ruta != null && puedeEditarCargaStaff(ruta.estado);

  useEffect(() => {
    if (!open || !ruta) return;
    setNombre(ruta.nombre);
    setFecha(ruta.fecha);
    setTurno(ruta.turno ?? "");
    setEstado(ruta.estado);
    setAsignadoA(ruta.asignado_a ?? "");
    setObservaciones(ruta.observaciones_operario ?? "");
    setKmRecorridos(ruta.km_recorridos != null ? String(ruta.km_recorridos) : "");
    setKmInicial(ruta.km_inicial != null ? String(ruta.km_inicial) : "");
    setKmFinal(ruta.km_final != null ? String(ruta.km_final) : "");
    setDescarga(Boolean(ruta.insumos_detalle?.descarga));
    setCombustible(
      ruta.insumos_detalle?.combustible ? String(ruta.insumos_detalle.combustible) : "",
    );
    setOtrosGastos(
      ruta.insumos_detalle?.otrosGastos ? String(ruta.insumos_detalle.otrosGastos) : "",
    );
    setInsumosInicio(ruta.insumos_inicio ?? []);
    setError(null);
    setConfirmDelete(false);
  }, [open, ruta]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !confirmDelete) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, confirmDelete]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ruta) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${ruta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          fecha,
          turno: turno || null,
          estado,
          asignado_a: asignadoA || null,
          observaciones_operario: observaciones || null,
          km_recorridos: kmRecorridos.trim() === "" ? null : Number(kmRecorridos),
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo guardar la ruta");
      }

      if (editaJornada) {
        const jornadaRes = await fetch(`/api/panel/rutas/${ruta.id}/jornada`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            km_inicial: kmInicial.trim() === "" ? null : Number(kmInicial),
            insumos: insumosInicio,
            km_final: kmFinal.trim() === "" ? null : Number(kmFinal),
            descarga,
            combustible: combustible.trim() === "" ? 0 : Number(combustible),
            otros_gastos: otrosGastos.trim() === "" ? 0 : Number(otrosGastos),
          }),
        });
        const jornadaBody = (await jornadaRes.json()) as { ok?: boolean; error?: string };
        if (!jornadaRes.ok || !jornadaBody.ok) {
          throw new Error(jornadaBody.error ?? "No se pudieron guardar los datos de la jornada");
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!ruta) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${ruta.id}`, { method: "DELETE" });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo eliminar la ruta");
      }

      onDeleted(ruta.id);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !ruta) return null;

  return (
    <>
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
          aria-labelledby="ruta-form-title"
          className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 id="ruta-form-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Editar ruta
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <Field label="Nombre">
              <input
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input
                  type="date"
                  className={inputClass}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </Field>
              <Field label="Turno">
                <select
                  className={inputClass}
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                >
                  <option value="">—</option>
                  {RUTA_TURNOS.map((value) => (
                    <option key={value} value={value}>
                      {RUTA_TURNO_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado">
                <select
                  className={inputClass}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  {RUTA_ESTADOS.map((value) => (
                    <option key={value} value={value}>
                      {RUTA_ESTADO_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Km recorridos">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClass}
                  value={kmRecorridos}
                  onChange={(e) => setKmRecorridos(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Recolector">
              <select
                className={inputClass}
                value={asignadoA}
                onChange={(e) => setAsignadoA(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {recolectores.map((recolector) => (
                  <option key={recolector.id} value={recolector.id}>
                    {recolector.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Observaciones operario">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </Field>

            {editaJornada && (
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Datos de la jornada del recolector
                </p>
                <p className="text-xs text-zinc-500">
                  Podés corregir la carga que hizo el recolector mientras la ruta esté Realizada
                  (antes del cierre operario). Al guardar se recalcula el total efectivo.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kilómetros iniciales *">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={kmInicial}
                      onChange={(e) => setKmInicial(e.target.value)}
                    />
                  </Field>
                  <Field label="Kilómetros finales *">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={kmFinal}
                      onChange={(e) => setKmFinal(e.target.value)}
                    />
                  </Field>
                </div>

                <InsumosListaEditor
                  insumos={insumosInicio}
                  onChange={setInsumosInicio}
                  variant="compact"
                  emptyMessage="El recolector no declaró insumos."
                />

                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    checked={descarga}
                    onChange={(e) => setDescarga(e.target.checked)}
                  />
                  Descarga realizada
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Combustible">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={combustible}
                      onChange={(e) => setCombustible(e.target.value)}
                    />
                  </Field>
                  <Field label="Otros gastos">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={otrosGastos}
                      onChange={(e) => setOtrosGastos(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Eliminar ruta
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <OperarioConfirmDialog
        open={confirmDelete}
        title="Eliminar ruta"
        message={`¿Eliminar "${ruta.nombre}"? Se borrarán también todas sus recolecciones. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
