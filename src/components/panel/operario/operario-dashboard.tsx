"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OperarioHistorialRutasTable } from "@/components/panel/operario/operario-historial-rutas-table";
import { OperarioRutaPreparacionInsumosModal } from "@/components/panel/operario/operario-ruta-preparacion-insumos-modal";
import { OperarioRutaInsumosModal } from "@/components/panel/operario/operario-ruta-insumos-modal";
import { OperarioRecoleccionFormModal } from "@/components/panel/operario/operario-recoleccion-form-modal";
import { OperarioHistorialRecoleccionesTable } from "@/components/panel/operario/operario-historial-recolecciones-table";
import { OperarioRecoleccionesTable } from "@/components/panel/operario/operario-recolecciones-table";
import { OperarioConfirmDialog } from "@/components/panel/operario/operario-confirm-dialog";
import { OperarioRutaDetalleModal } from "@/components/panel/operario/operario-ruta-detalle-modal";
import { OperarioRutaFormModal } from "@/components/panel/operario/operario-ruta-form-modal";
import { OperarioRutaMapModal } from "@/components/panel/operario/operario-ruta-map-modal";
import { OperarioRutasTable } from "@/components/panel/operario/operario-rutas-table";
import {
  buildRutaDetalle,
  pickDefaultRutaId,
  type RecolectorOption,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { downloadHistorialCsv } from "@/lib/domain/operario-historial-export";


type Props = {
  rutas: RutaOperarioRow[];
  recolecciones: RecoleccionOperarioRow[];
  recolectores: RecolectorOption[];
  operarioNombre: string;
  mapsApiKey: string | null;
  variant?: "operativo" | "historial";
};

export function OperarioDashboard({
  rutas,
  recolecciones,
  recolectores,
  operarioNombre,
  mapsApiKey,
  variant = "operativo",
}: Props) {
  const isHistorial = variant === "historial";
  const router = useRouter();
  const defaultId = useMemo(() => pickDefaultRutaId(rutas), [rutas]);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(defaultId);
  const [detalleRutaId, setDetalleRutaId] = useState<string | null>(null);
  const [mapaRutaId, setMapaRutaId] = useState<string | null>(null);
  const [editRutaId, setEditRutaId] = useState<string | null>(null);
  const [editRecoleccionId, setEditRecoleccionId] = useState<string | null>(null);
  const [creatingRecoleccion, setCreatingRecoleccion] = useState(false);
  const [suspenderRutaId, setSuspenderRutaId] = useState<string | null>(null);
  const [reactivarRutaId, setReactivarRutaId] = useState<string | null>(null);
  const [insumosRutaId, setInsumosRutaId] = useState<string | null>(null);
  const [preparacionInsumosRutaId, setPreparacionInsumosRutaId] = useState<string | null>(null);
  const [cierreOperarioRutaId, setCierreOperarioRutaId] = useState<string | null>(null);
  const [cierreOperarioPaso, setCierreOperarioPaso] = useState<1 | 2>(1);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [reactivando, setReactivando] = useState(false);
  const [cerrandoOperario, setCerrandoOperario] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [descargandoHistorial, setDescargandoHistorial] = useState(false);

  const selectedRuta = rutas.find((r) => r.id === selectedRutaId) ?? null;
  const detalleRuta = rutas.find((r) => r.id === detalleRutaId) ?? null;
  const rutaASuspender = rutas.find((r) => r.id === suspenderRutaId) ?? null;
  const rutaAReactivar = rutas.find((r) => r.id === reactivarRutaId) ?? null;
  const rutaACierreOperario = rutas.find((r) => r.id === cierreOperarioRutaId) ?? null;
  const rutaInsumos = rutas.find((r) => r.id === insumosRutaId) ?? null;
  const rutaPreparacionInsumos = rutas.find((r) => r.id === preparacionInsumosRutaId) ?? null;
  const mapaRuta = rutas.find((r) => r.id === mapaRutaId) ?? null;
  const editRuta = rutas.find((r) => r.id === editRutaId) ?? null;
  const editRecoleccion = recolecciones.find((r) => r.id === editRecoleccionId) ?? null;
  const recoleccionesRuta = useMemo(
    () => recolecciones.filter((r) => r.ruta_id === selectedRutaId),
    [recolecciones, selectedRutaId],
  );
  const detalle = detalleRuta
    ? buildRutaDetalle(
        detalleRuta,
        recolecciones.filter((item) => item.ruta_id === detalleRuta.id),
      )
    : null;

  function refreshData() {
    router.refresh();
  }

  function handleRutaDeleted(rutaId: string) {
    if (selectedRutaId === rutaId) setSelectedRutaId(null);
    if (mapaRutaId === rutaId) setMapaRutaId(null);
    if (detalleRutaId === rutaId) setDetalleRutaId(null);
    refreshData();
  }

  async function handleConfirmReactivar() {
    if (!reactivarRutaId) return;

    setReactivando(true);
    setSuspendError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${reactivarRutaId}/suspender`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo reactivar la ruta");
      }

      setReactivarRutaId(null);
      refreshData();
    } catch (err) {
      setSuspendError(err instanceof Error ? err.message : "Error al reactivar la ruta");
    } finally {
      setReactivando(false);
    }
  }

  async function handleConfirmCierreOperario() {
    if (!cierreOperarioRutaId) return;

    setCerrandoOperario(true);
    setSuspendError(null);

    try {
      const response = await fetch(
        `/api/panel/rutas/${cierreOperarioRutaId}/cierre-operario`,
        { method: "POST" },
      );
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo registrar el cierre operario");
      }

      if (selectedRutaId === cierreOperarioRutaId) setSelectedRutaId(null);
      setCierreOperarioRutaId(null);
      setCierreOperarioPaso(1);
      refreshData();
    } catch (err) {
      setSuspendError(
        err instanceof Error ? err.message : "Error al registrar el cierre operario",
      );
    } finally {
      setCerrandoOperario(false);
    }
  }

  function abrirCierreOperario(rutaId: string) {
    setCierreOperarioRutaId(rutaId);
    setCierreOperarioPaso(1);
    setSuspendError(null);
  }

  async function handleConfirmSuspender() {
    if (!suspenderRutaId) return;

    setSuspendiendo(true);
    setSuspendError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${suspenderRutaId}/suspender`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo suspender la ruta");
      }

      setSuspenderRutaId(null);
      refreshData();
    } catch (err) {
      setSuspendError(err instanceof Error ? err.message : "Error al suspender la ruta");
    } finally {
      setSuspendiendo(false);
    }
  }

  function handleDescargarHistorial() {
    setDescargandoHistorial(true);
    try {
      downloadHistorialCsv(rutas, recolecciones);
    } finally {
      setDescargandoHistorial(false);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isHistorial ? "Historial" : "Panel operativo"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {isHistorial
              ? "Rutas cerradas (cierre operario) o canceladas. Solo consulta."
              : "Rutas activas, suspendidas y realizadas. En realizadas podés reactivar (vuelven a En proceso) o aplicar cierre operario."}
          </p>
        </div>
        {isHistorial && rutas.length > 0 && (
          <button
            type="button"
            onClick={handleDescargarHistorial}
            disabled={descargandoHistorial}
            className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {descargandoHistorial
              ? "Generando…"
              : "Descargar historial (CSV)"}
          </button>
        )}
      </div>

      <section className="space-y-3">
        <SectionTitle
          title="Ruta"
          subtitle={`${rutas.length} ruta${rutas.length === 1 ? "" : "s"} · Seleccioná una fila para ver sus recolecciones`}
        />
        {isHistorial ? (
          <OperarioHistorialRutasTable
            rutas={rutas}
            selectedRutaId={selectedRutaId}
            onSelect={setSelectedRutaId}
            onVerInsumos={setInsumosRutaId}
          />
        ) : (
          <OperarioRutasTable
            rutas={rutas}
            selectedRutaId={selectedRutaId}
            onSelect={setSelectedRutaId}
            onVerDetalle={setDetalleRutaId}
            onVerMapa={(id) => {
              setMapaRutaId(id);
              setSelectedRutaId(id);
            }}
            onVerInsumos={setInsumosRutaId}
            onPrepararInsumos={setPreparacionInsumosRutaId}
            onEditar={setEditRutaId}
            onSuspender={setSuspenderRutaId}
            onCierreOperario={abrirCierreOperario}
            onReactivar={setReactivarRutaId}
            mapsDisponible={!!mapsApiKey}
          />
        )}
      </section>

      {suspendError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {suspendError}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle
            title="Recolecciones"
            subtitle={
              selectedRuta
                ? `${selectedRuta.nombre} · ${recoleccionesRuta.length} parada(s)`
                : "Seleccioná una ruta"
            }
          />
          {selectedRuta && !isHistorial && (
            <button
              type="button"
              onClick={() => setCreatingRecoleccion(true)}
              disabled={
                selectedRuta.estado === "completada" ||
                selectedRuta.estado === "cerrada"
              }
              title={
                selectedRuta.estado === "completada" ||
                selectedRuta.estado === "cerrada"
                  ? "No se pueden agregar recolecciones a una ruta cerrada"
                  : undefined
              }
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Agregar recolección
            </button>
          )}
          {selectedRuta && isHistorial && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Vista de solo lectura para recolecciones en rutas del historial.
            </p>
          )}
        </div>
        {isHistorial ? (
          <OperarioHistorialRecoleccionesTable
            recolecciones={recoleccionesRuta}
            ruta={selectedRuta}
          />
        ) : (
          <OperarioRecoleccionesTable
            recolecciones={recoleccionesRuta}
            rutaSeleccionada={!!selectedRuta}
            ruta={selectedRuta}
            onEditar={setEditRecoleccionId}
          />
        )}
      </section>

      <OperarioRutaPreparacionInsumosModal
        open={preparacionInsumosRutaId !== null}
        ruta={rutaPreparacionInsumos}
        onClose={() => setPreparacionInsumosRutaId(null)}
        onSaved={refreshData}
      />

      <OperarioRutaInsumosModal
        open={insumosRutaId !== null}
        ruta={rutaInsumos}
        onClose={() => setInsumosRutaId(null)}
      />

      <OperarioRutaDetalleModal
        open={detalleRutaId !== null}
        detalle={detalle}
        operarioNombre={operarioNombre}
        onClose={() => setDetalleRutaId(null)}
        onUpdated={refreshData}
      />

      <OperarioRutaMapModal
        open={mapaRutaId !== null}
        rutaId={mapaRutaId}
        rutaNombre={mapaRuta?.nombre ?? null}
        mapsApiKey={mapsApiKey}
        onClose={() => setMapaRutaId(null)}
        onOrderChange={refreshData}
      />

      <OperarioRutaFormModal
        open={!isHistorial && editRutaId !== null}
        ruta={editRuta}
        recolectores={recolectores}
        onClose={() => setEditRutaId(null)}
        onSaved={refreshData}
        onDeleted={handleRutaDeleted}
      />

      <OperarioRecoleccionFormModal
        open={!isHistorial && creatingRecoleccion}
        mode="create"
        recoleccion={null}
        createTarget={
          selectedRuta
            ? { ruta: selectedRuta, nextOrden: recoleccionesRuta.length + 1 }
            : null
        }
        onClose={() => setCreatingRecoleccion(false)}
        onSaved={refreshData}
        onDeleted={refreshData}
      />

      <OperarioRecoleccionFormModal
        open={!isHistorial && editRecoleccionId !== null}
        mode="edit"
        recoleccion={editRecoleccion}
        createTarget={null}
        onClose={() => setEditRecoleccionId(null)}
        onSaved={refreshData}
        onDeleted={refreshData}
      />

      {!isHistorial && (
        <>
          <OperarioConfirmDialog
            open={cierreOperarioRutaId !== null && cierreOperarioPaso === 1}
            title="Cierre operario"
            message={
              rutaACierreOperario
                ? `¿Registrar cierre operario de "${rutaACierreOperario.nombre}"? La ruta está en estado Realizado.`
                : "¿Registrar cierre operario de esta ruta?"
            }
            confirmLabel="Continuar"
            loading={false}
            onConfirm={() => setCierreOperarioPaso(2)}
            onCancel={() => {
              setCierreOperarioRutaId(null);
              setCierreOperarioPaso(1);
              setSuspendError(null);
            }}
          />
          <OperarioConfirmDialog
            open={cierreOperarioRutaId !== null && cierreOperarioPaso === 2}
            title="Confirmar cierre operario"
            message={
              rutaACierreOperario
                ? `La ruta "${rutaACierreOperario.nombre}" pasará a estado Cerrada y se moverá al Historial. Esta acción confirma el cierre administrativo.`
                : "La ruta pasará a Cerrada y se moverá al Historial."
            }
            confirmLabel="Confirmar cierre"
            destructive
            loading={cerrandoOperario}
            onConfirm={() => void handleConfirmCierreOperario()}
            onCancel={() => {
              setCierreOperarioRutaId(null);
              setCierreOperarioPaso(1);
              setSuspendError(null);
            }}
          />
        </>
      )}

      {!isHistorial && (
        <OperarioConfirmDialog
          open={suspenderRutaId !== null}
          title="Suspender ruta"
          message={
            rutaASuspender
              ? `¿Suspender "${rutaASuspender.nombre}"? El recolector no podrá operarla hasta que la reactives.`
              : "¿Suspender esta ruta?"
          }
          confirmLabel="Suspender"
          destructive
          loading={suspendiendo}
          onConfirm={() => void handleConfirmSuspender()}
          onCancel={() => {
            setSuspenderRutaId(null);
            setSuspendError(null);
          }}
        />
      )}

      {!isHistorial && (
        <OperarioConfirmDialog
          open={reactivarRutaId !== null}
          title="Reactivar ruta"
          message={
            rutaAReactivar
              ? rutaAReactivar.estado === "completada"
                ? `¿Reactivar "${rutaAReactivar.nombre}"? Volverá a En proceso y el recolector podrá seguir operándola. Se borrarán los datos de cierre del recolector.`
                : `¿Reactivar "${rutaAReactivar.nombre}"? Volverá a En proceso en el panel operativo.`
              : "¿Reactivar esta ruta?"
          }
          confirmLabel="Reactivar"
          loading={reactivando}
          onConfirm={() => void handleConfirmReactivar()}
          onCancel={() => {
            setReactivarRutaId(null);
            setSuspendError(null);
          }}
        />
      )}

    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {subtitle && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
