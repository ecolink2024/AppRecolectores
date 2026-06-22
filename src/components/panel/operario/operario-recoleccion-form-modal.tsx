"use client";

import { useEffect, useState } from "react";

import {
  OperarioConfirmDialog,
  Field,
  inputClass,
} from "@/components/panel/operario/operario-confirm-dialog";
import {
  RECOLECCION_OPERATIVA_ESTADOS,
  RECOLECCION_OPERATIVA_LABELS,
  RECOLECCION_TIPOS_CLIENTE,
  RECOLECCION_TIPO_CLIENTE_LABELS,
} from "@/lib/domain/constants";
import { defaultHoraForTurno } from "@/lib/domain/ruta-turno";
import { parseTipoServicio } from "@/lib/integrations/sheet-recoleccion-validation";
import type { RecoleccionOperarioRow, RutaOperarioRow } from "@/lib/domain/operario-dashboard";

type CreateTarget = {
  ruta: RutaOperarioRow;
  nextOrden: number;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  recoleccion: RecoleccionOperarioRow | null;
  createTarget: CreateTarget | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

export function OperarioRecoleccionFormModal({
  open,
  mode,
  recoleccion,
  createTarget,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isCreate = mode === "create";

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoServicio, setTipoServicio] = useState("");
  const [unidad, setUnidad] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [precio, setPrecio] = useState("");
  const [deuda, setDeuda] = useState("");
  const [zona, setZona] = useState("");
  const [barrio, setBarrio] = useState("");
  const [depto, setDepto] = useState("");
  const [hora, setHora] = useState("");
  const [estadoOperativo, setEstadoOperativo] = useState("pendiente");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isCreate && createTarget) {
      setNombre("");
      setDireccion("");
      setTelefono("");
      setTipoServicio("");
      setUnidad("");
      setFrecuencia("");
      setPrecio("");
      setDeuda("");
      setZona("");
      setBarrio("");
      setDepto("");
      setHora(defaultHoraForTurno(createTarget.ruta.turno));
      setEstadoOperativo("pendiente");
      setObservaciones("");
      setError(null);
      setConfirmDelete(false);
      return;
    }

    if (!recoleccion) return;

    setNombre(recoleccion.nombre);
    setDireccion(recoleccion.direccion);
    setTelefono(recoleccion.telefono ?? "");
    setTipoServicio(parseTipoServicio(recoleccion.tipo_servicio ?? "") ?? "");
    setUnidad(recoleccion.unidad ?? "");
    setFrecuencia(recoleccion.frecuencia ?? "");
    setPrecio(recoleccion.precio_tarifa ?? "");
    setDeuda(recoleccion.deuda ?? "");
    setZona(recoleccion.zona ?? "");
    setBarrio(recoleccion.barrio ?? "");
    setDepto(recoleccion.depto ?? "");
    setHora(recoleccion.hora_programada);
    setEstadoOperativo(recoleccion.estado_operativo);
    setObservaciones(recoleccion.observaciones ?? "");
    setError(null);
    setConfirmDelete(false);
  }, [open, isCreate, createTarget, recoleccion]);

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

  const payload = {
    nombre,
    direccion,
    telefono,
    tipo_servicio: tipoServicio || null,
    unidad: unidad || null,
    frecuencia: frecuencia || null,
    precio: precio || null,
    deuda: deuda || null,
    zona: zona || null,
    barrio: barrio || null,
    depto: depto || null,
    hora,
    estado_operativo: estadoOperativo,
    observaciones: observaciones || null,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      if (isCreate) {
        if (!createTarget) throw new Error("Ruta no seleccionada");

        const response = await fetch(
          `/api/panel/rutas/${createTarget.ruta.id}/recolecciones`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const body = (await response.json()) as { ok?: boolean; error?: string };

        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "No se pudo crear la recolección");
        }
      } else {
        if (!recoleccion) return;

        const response = await fetch(
          `/api/panel/rutas/${recoleccion.ruta_id}/recolecciones/${recoleccion.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const body = (await response.json()) as { ok?: boolean; error?: string };

        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "No se pudo guardar la recolección");
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
    if (!recoleccion) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/panel/rutas/${recoleccion.ruta_id}/recolecciones/${recoleccion.id}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo eliminar la recolección");
      }

      onDeleted();
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;
  if (!isCreate && !recoleccion) return null;
  if (isCreate && !createTarget) return null;

  const title = isCreate ? "Nueva recolección" : "Editar recolección";
  const subtitle = isCreate
    ? `${createTarget!.ruta.nombre} · parada #${createTarget!.nextOrden}`
    : `Parada #${recoleccion!.orden}`;

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
          aria-labelledby="recoleccion-form-title"
          className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div>
              <h2
                id="recoleccion-form-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {title}
              </h2>
              <p className="text-sm text-zinc-500">{subtitle}</p>
            </div>
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

            <Field label="Dirección">
              <input
                className={inputClass}
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono">
                <input
                  className={inputClass}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />
              </Field>
              <Field label="Horario prog.">
                <input
                  type="time"
                  className={inputClass}
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de cliente">
                <select
                  className={inputClass}
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                >
                  <option value="">— Sin especificar —</option>
                  {RECOLECCION_TIPOS_CLIENTE.map((value) => (
                    <option key={value} value={value}>
                      {RECOLECCION_TIPO_CLIENTE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unidad">
                <input className={inputClass} value={unidad} onChange={(e) => setUnidad(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Frecuencia">
                <input className={inputClass} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} />
              </Field>
              <Field label="Precio">
                <input className={inputClass} value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </Field>
              <Field label="Deuda">
                <input className={inputClass} value={deuda} onChange={(e) => setDeuda(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Zona">
                <input className={inputClass} value={zona} onChange={(e) => setZona(e.target.value)} />
              </Field>
              <Field label="Barrio">
                <input className={inputClass} value={barrio} onChange={(e) => setBarrio(e.target.value)} />
              </Field>
              <Field label="Depto">
                <input className={inputClass} value={depto} onChange={(e) => setDepto(e.target.value)} />
              </Field>
            </div>

            <Field label="Estado">
              <select
                className={inputClass}
                value={estadoOperativo}
                onChange={(e) => setEstadoOperativo(e.target.value)}
              >
                {RECOLECCION_OPERATIVA_ESTADOS.map((value) => (
                  <option key={value} value={value}>
                    {RECOLECCION_OPERATIVA_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Observaciones">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </Field>

            {!isCreate && recoleccion && direccion !== recoleccion.direccion && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Al cambiar la dirección, el mapa volverá a geocodificar la ubicación.
              </p>
            )}

            {isCreate && (
              <p className="text-xs text-zinc-500">
                Se agregará al final del recorrido. Podés reordenarla después desde el mapa.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {!isCreate ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Eliminar
                </button>
              ) : (
                <span />
              )}
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
                  {saving ? "Guardando…" : isCreate ? "Crear recolección" : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {!isCreate && recoleccion && (
        <OperarioConfirmDialog
          open={confirmDelete}
          title="Eliminar recolección"
          message={`¿Eliminar la parada #${recoleccion.orden} (${recoleccion.nombre})? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          destructive
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
