"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OperarioHistorialRutasTable } from "@/components/panel/operario/operario-historial-rutas-table";
import { OperarioKpisFiltroFechas } from "@/components/panel/operario/operario-kpis-filtro-fechas";
import { OperarioRutaPreparacionInsumosModal } from "@/components/panel/operario/operario-ruta-preparacion-insumos-modal";
import { OperarioRutaInsumosModal } from "@/components/panel/operario/operario-ruta-insumos-modal";
import { OperarioRecoleccionFormModal } from "@/components/panel/operario/operario-recoleccion-form-modal";
import {
  OperarioRecoleccionCampoModal,
  type PreciosCampoActivos,
} from "@/components/panel/operario/operario-recoleccion-campo-modal";
import { OperarioHistorialRecoleccionesTable } from "@/components/panel/operario/operario-historial-recolecciones-table";
import { OperarioRecoleccionesTable } from "@/components/panel/operario/operario-recolecciones-table";
import { OperarioConfirmDialog } from "@/components/panel/operario/operario-confirm-dialog";
import { OperarioRutaDetalleModal } from "@/components/panel/operario/operario-ruta-detalle-modal";
import { OperarioRutaFormModal } from "@/components/panel/operario/operario-ruta-form-modal";
import { OperarioRutaMapModal } from "@/components/panel/operario/operario-ruta-map-modal";
import { OperarioRutasTable } from "@/components/panel/operario/operario-rutas-table";
import {
  buildRutaDetalle,
  formatRutaFecha,
  pickDefaultRutaId,
  type RecolectorOption,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";
import { downloadHistorialCsv } from "@/lib/domain/operario-historial-export";
import type { KpiFiltroFechas } from "@/lib/domain/operario-kpis";


type Props = {
  rutas: RutaOperarioRow[];
  recolecciones: RecoleccionOperarioRow[];
  recolectores: RecolectorOption[];
  operarioNombre: string;
  mapsApiKey: string | null;
  variant?: "operativo" | "historial";
  preciosCampo?: PreciosCampoActivos;
  filtroFechas?: KpiFiltroFechas | null;
};

export function OperarioDashboard({
  rutas,
  recolecciones,
  recolectores,
  operarioNombre,
  mapsApiKey,
  variant = "operativo",
  preciosCampo,
  filtroFechas = null,
}: Props) {
  const isHistorial = variant === "historial";
  const router = useRouter();
  const rutasVisibles = useMemo(() => {
    if (!isHistorial) return rutas;
    return [...rutas].sort((a, b) => {
      const aPendiente = a.estado === "completada" ? 0 : 1;
      const bPendiente = b.estado === "completada" ? 0 : 1;
      if (aPendiente !== bPendiente) return aPendiente - bPendiente;
      if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
      return (a.nombre ?? "").localeCompare(b.nombre ?? "");
    });
  }, [rutas, isHistorial]);
  const defaultId = useMemo(() => pickDefaultRutaId(rutasVisibles), [rutasVisibles]);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(defaultId);
  const [detalleRutaId, setDetalleRutaId] = useState<string | null>(null);
  const [mapaRutaId, setMapaRutaId] = useState<string | null>(null);
  const [editRutaId, setEditRutaId] = useState<string | null>(null);
  const [editRecoleccionId, setEditRecoleccionId] = useState<string | null>(null);
  const [editCargaRecoleccionId, setEditCargaRecoleccionId] = useState<string | null>(null);
  const [creatingRecoleccion, setCreatingRecoleccion] = useState(false);
  const [reactivarRutaId, setReactivarRutaId] = useState<string | null>(null);
  const [insumosRutaId, setInsumosRutaId] = useState<string | null>(null);
  const [preparacionInsumosRutaId, setPreparacionInsumosRutaId] = useState<string | null>(null);
  const [cierreOperarioRutaId, setCierreOperarioRutaId] = useState<string | null>(null);
  const [cierreOperarioPaso, setCierreOperarioPaso] = useState<1 | 2>(1);
  const [reactivando, setReactivando] = useState(false);
  const [cerrandoOperario, setCerrandoOperario] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [descargandoHistorial, setDescargandoHistorial] = useState(false);

  const selectedRuta = rutasVisibles.find((r) => r.id === selectedRutaId) ?? null;
  const detalleRuta = rutasVisibles.find((r) => r.id === detalleRutaId) ?? null;
  const rutaAReactivar = rutasVisibles.find((r) => r.id === reactivarRutaId) ?? null;
  const rutaACierreOperario = rutasVisibles.find((r) => r.id === cierreOperarioRutaId) ?? null;
  const rutaInsumos = rutasVisibles.find((r) => r.id === insumosRutaId) ?? null;
  const rutaPreparacionInsumos = rutasVisibles.find((r) => r.id === preparacionInsumosRutaId) ?? null;
  const mapaRuta = rutasVisibles.find((r) => r.id === mapaRutaId) ?? null;
  const editRuta = rutasVisibles.find((r) => r.id === editRutaId) ?? null;
  const editRecoleccion = recolecciones.find((r) => r.id === editRecoleccionId) ?? null;
  const editCargaRecoleccion =
    recolecciones.find((r) => r.id === editCargaRecoleccionId) ?? null;
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
    setActionError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${reactivarRutaId}/reactivar`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo reactivar la ruta");
      }

      setReactivarRutaId(null);
      if (selectedRutaId === reactivarRutaId) setSelectedRutaId(null);
      refreshData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al reactivar la ruta");
    } finally {
      setReactivando(false);
    }
  }

  async function handleConfirmCierreOperario() {
    if (!cierreOperarioRutaId) return;

    setCerrandoOperario(true);
    setActionError(null);

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
      setActionError(
        err instanceof Error ? err.message : "Error al registrar el cierre operario",
      );
    } finally {
      setCerrandoOperario(false);
    }
  }

  function abrirCierreOperario(rutaId: string) {
    setCierreOperarioRutaId(rutaId);
    setCierreOperarioPaso(1);
    setActionError(null);
  }

  function handleDescargarHistorial() {
    setDescargandoHistorial(true);
    try {
      downloadHistorialCsv(rutasVisibles, recolecciones);
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
              ? filtroFechas
                ? `${filtroFechas.etiqueta} · ${formatRutaFecha(filtroFechas.desde)} — ${formatRutaFecha(filtroFechas.hasta)}. Rutas finalizadas, cerradas o canceladas.`
                : "Rutas finalizadas por el recolector, cerradas operariamente o canceladas. En Realizado podés editar, reactivar o aplicar cierre operario."
              : "Rutas pendientes o en proceso. Prepará insumos, editá paradas y seguí el avance del recolector."}
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

      {isHistorial && filtroFechas && (
        <OperarioKpisFiltroFechas
          desde={filtroFechas.desde}
          hasta={filtroFechas.hasta}
          modo={filtroFechas.modo}
          periodoPreset={filtroFechas.periodoPreset}
          basePath="/panel/historial"
        />
      )}

      <section className="space-y-3">
        <SectionTitle
          title="Ruta"
          subtitle={`${rutasVisibles.length} ruta${rutasVisibles.length === 1 ? "" : "s"} · Seleccioná una fila para ver sus recolecciones`}
        />
        {isHistorial ? (
          <OperarioHistorialRutasTable
            rutas={rutasVisibles}
            selectedRutaId={selectedRutaId}
            onSelect={setSelectedRutaId}
            onVerInsumos={setInsumosRutaId}
            onEditar={setEditRutaId}
            onCierreOperario={abrirCierreOperario}
            onReactivar={setReactivarRutaId}
          />
        ) : (
          <OperarioRutasTable
            rutas={rutasVisibles}
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
            mapsDisponible={!!mapsApiKey}
          />
        )}
      </section>

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
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
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              + Agregar recolección
            </button>
          )}
          {selectedRuta && isHistorial && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedRuta.estado === "completada"
                ? "Editá la carga del recolector de cada parada. Para agregar o quitar paradas, reactivá la ruta desde Operativo."
                : "Vista de solo lectura para recolecciones en rutas del historial."}
            </p>
          )}
        </div>
        {isHistorial ? (
          <OperarioHistorialRecoleccionesTable
            recolecciones={recoleccionesRuta}
            ruta={selectedRuta}
            onEditarCarga={preciosCampo ? setEditCargaRecoleccionId : undefined}
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
        open={editRutaId !== null}
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

      {preciosCampo && (
        <OperarioRecoleccionCampoModal
          open={editCargaRecoleccionId !== null}
          rutaId={editCargaRecoleccion?.ruta_id ?? null}
          recoleccion={editCargaRecoleccion}
          precios={preciosCampo}
          onClose={() => setEditCargaRecoleccionId(null)}
          onSaved={refreshData}
        />
      )}

      {isHistorial && (
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
              setActionError(null);
            }}
          />
          <OperarioConfirmDialog
            open={cierreOperarioRutaId !== null && cierreOperarioPaso === 2}
            title="Confirmar cierre operario"
            message={
              rutaACierreOperario
                ? `La ruta "${rutaACierreOperario.nombre}" pasará a estado Cerrada. Esta acción confirma el cierre administrativo.`
                : "La ruta pasará a Cerrada."
            }
            confirmLabel="Confirmar cierre"
            destructive
            loading={cerrandoOperario}
            onConfirm={() => void handleConfirmCierreOperario()}
            onCancel={() => {
              setCierreOperarioRutaId(null);
              setCierreOperarioPaso(1);
              setActionError(null);
            }}
          />
        </>
      )}

      {isHistorial && (
        <OperarioConfirmDialog
          open={reactivarRutaId !== null}
          title="Reactivar ruta"
          message={
            rutaAReactivar
              ? `¿Reactivar "${rutaAReactivar.nombre}"? Volverá a En proceso en el panel operativo y el recolector podrá seguir operándola. Se borrarán los datos de cierre del recolector.`
              : "¿Reactivar esta ruta?"
          }
          confirmLabel="Reactivar"
          loading={reactivando}
          onConfirm={() => void handleConfirmReactivar()}
          onCancel={() => {
            setReactivarRutaId(null);
            setActionError(null);
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
