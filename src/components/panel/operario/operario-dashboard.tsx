"use client";

import { useMemo, useState } from "react";

import { OperarioRecoleccionesTable } from "@/components/panel/operario/operario-recolecciones-table";
import { OperarioRutaDetalleModal } from "@/components/panel/operario/operario-ruta-detalle-modal";
import { OperarioRutaMapModal } from "@/components/panel/operario/operario-ruta-map-modal";
import { OperarioRutasTable } from "@/components/panel/operario/operario-rutas-table";
import {
  buildRutaDetalle,
  pickDefaultRutaId,
  type RecoleccionOperarioRow,
  type RutaOperarioRow,
} from "@/lib/domain/operario-dashboard";

type Props = {
  rutas: RutaOperarioRow[];
  recolecciones: RecoleccionOperarioRow[];
  operarioNombre: string;
  mapsApiKey: string | null;
};

export function OperarioDashboard({
  rutas,
  recolecciones,
  operarioNombre,
  mapsApiKey,
}: Props) {
  const defaultId = useMemo(() => pickDefaultRutaId(rutas), [rutas]);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(defaultId);
  const [detalleRutaId, setDetalleRutaId] = useState<string | null>(null);
  const [mapaRutaId, setMapaRutaId] = useState<string | null>(null);

  const selectedRuta = rutas.find((r) => r.id === selectedRutaId) ?? null;
  const detalleRuta = rutas.find((r) => r.id === detalleRutaId) ?? null;
  const mapaRuta = rutas.find((r) => r.id === mapaRutaId) ?? null;
  const recoleccionesRuta = useMemo(
    () => recolecciones.filter((r) => r.ruta_id === selectedRutaId),
    [recolecciones, selectedRutaId],
  );
  const detalle = detalleRuta ? buildRutaDetalle(detalleRuta) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Panel operativo
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Seguimiento de rutas, recolecciones y cierre de jornada.
        </p>
      </div>

      <section className="space-y-3">
        <SectionTitle title="Ruta" subtitle="Seleccioná una fila para ver sus recolecciones" />
        <OperarioRutasTable
          rutas={rutas}
          selectedRutaId={selectedRutaId}
          onSelect={setSelectedRutaId}
          onVerDetalle={setDetalleRutaId}
          onVerMapa={setMapaRutaId}
          mapsDisponible={!!mapsApiKey}
        />
      </section>

      <section className="space-y-3">
        <SectionTitle
          title="Recolecciones"
          subtitle={
            selectedRuta
              ? `${selectedRuta.nombre} · ${recoleccionesRuta.length} parada(s)`
              : "Seleccioná una ruta"
          }
        />
        <OperarioRecoleccionesTable
          recolecciones={recoleccionesRuta}
          rutaSeleccionada={!!selectedRuta}
        />
      </section>

      <OperarioRutaDetalleModal
        open={detalleRutaId !== null}
        detalle={detalle}
        operarioNombre={operarioNombre}
        onClose={() => setDetalleRutaId(null)}
      />

      <OperarioRutaMapModal
        open={mapaRutaId !== null}
        rutaId={mapaRutaId}
        rutaNombre={mapaRuta?.nombre ?? null}
        mapsApiKey={mapsApiKey}
        onClose={() => setMapaRutaId(null)}
      />
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
