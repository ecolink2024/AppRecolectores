"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { RecolectorRecoleccionSheet } from "@/components/panel/recolector/recolector-recoleccion-sheet";
import { openGoogleMapsUrl } from "@/lib/client/google-maps-open";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsRecoleccionUrl,
  formatInicioJornada,
  formatKm,
  formatRecolectorMoney,
  type RecolectorRecoleccionDetalle,
  type RecolectorRecoleccionPreview,
  type RecolectorRutaDetalle,
} from "@/lib/domain/recolector-ruta";
import { recoleccionCerradaParaRecolector } from "@/lib/domain/recolector-recoleccion-campo";
import { mensajeBloqueoSuspension } from "@/lib/domain/ruta-estado-transiciones";
import {
  buildWhatsAppAvisosRecolecciones,
  type WhatsAppAvisoRecoleccion,
} from "@/lib/whatsapp";

type Props = {
  ruta: RecolectorRutaDetalle;
  recolectorNombre: string;
  recoleccionesPreview: RecolectorRecoleccionPreview[];
  recoleccionesDetalle: RecolectorRecoleccionDetalle[];
  direccionesMaps: string[];
};

const ESTADO_BADGE: Record<string, string> = {
  Pendiente: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "En proceso": "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Finalizada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Cancelada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Suspendida: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300",
};

export function RecolectorRutaDetalle({
  ruta,
  recolectorNombre,
  recoleccionesPreview,
  recoleccionesDetalle,
  direccionesMaps,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [avisoWhatsapp, setAvisoWhatsapp] = useState<{
    items: WhatsAppAvisoRecoleccion[];
    index: number;
  } | null>(null);

  const mapsUrl = useMemo(
    () => buildGoogleMapsDirectionsUrl(direccionesMaps),
    [direccionesMaps],
  );

  const avisosWhatsapp = useMemo(
    () => buildWhatsAppAvisosRecolecciones(recoleccionesDetalle, recolectorNombre),
    [recoleccionesDetalle, recolectorNombre],
  );

  const selectedRecoleccion = recoleccionesDetalle.find((item) => item.id === selectedId) ?? null;

  const whatsappTodosDisabled =
    ruta.rutaSuspendida ||
    !ruta.rutaIniciada ||
    ruta.rutaFinalizada ||
    avisosWhatsapp.length === 0;

  const motivoWhatsappTodos = ruta.rutaSuspendida
    ? mensajeBloqueoSuspension()
    : !ruta.rutaIniciada
      ? "Iniciá la ruta para avisar a los clientes"
      : ruta.rutaFinalizada
        ? "La ruta ya está finalizada"
        : avisosWhatsapp.length === 0
          ? "Ninguna parada tiene teléfono cargado"
          : null;

  async function handleMaps() {
    setError(null);
    const opened = await openGoogleMapsUrl((origin) =>
      buildGoogleMapsDirectionsUrl(direccionesMaps, { origin }),
    );
    if (!opened) {
      setError("No hay paradas pendientes para abrir en Maps");
    }
  }

  function openWhatsAppAviso(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleWhatsAppTodos() {
    if (whatsappTodosDisabled) {
      setError(motivoWhatsappTodos ?? "No se puede avisar por WhatsApp");
      return;
    }

    setError(null);
    if (avisosWhatsapp.length === 1) {
      openWhatsAppAviso(avisosWhatsapp[0].url);
      return;
    }

    setAvisoWhatsapp({ items: avisosWhatsapp, index: 0 });
    openWhatsAppAviso(avisosWhatsapp[0].url);
  }

  function handleSiguienteAvisoWhatsapp() {
    if (!avisoWhatsapp) return;

    const nextIndex = avisoWhatsapp.index + 1;
    if (nextIndex >= avisoWhatsapp.items.length) {
      setAvisoWhatsapp(null);
      return;
    }

    const next = avisoWhatsapp.items[nextIndex];
    setAvisoWhatsapp({ items: avisoWhatsapp.items, index: nextIndex });
    openWhatsAppAviso(next.url);
  }

  function handleCancelarAvisoWhatsapp() {
    setAvisoWhatsapp(null);
  }

  async function handleFinalizarRuta() {
    if (!ruta.puedeFinalizar || finalizando) return;

    setFinalizando(true);
    setError(null);
    router.push(`/panel/mis-rutas/${ruta.id}/finalizar`);
  }

  const mostrarFinalizar = (ruta.rutaIniciada || ruta.rutaFinalizada) && !ruta.rutaSuspendida;
  const finalizarDisabled = !ruta.puedeFinalizar || finalizando;
  const motivoFinalizar =
    finalizando
      ? "Procesando…"
      : !ruta.puedeFinalizar
        ? (ruta.mensajeFinalizar ?? "No se puede finalizar la ruta")
        : null;

  return (
    <div className="space-y-5 pb-4">
      <Link
        href="/panel/mis-rutas"
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver a mis rutas
      </Link>

      {ruta.rutaFinalizada && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Ruta finalizada. Solo podés consultar recolecciones; no podés modificar datos.
        </p>
      )}

      {ruta.rutaSuspendida && (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
          {mensajeBloqueoSuspension()}
        </p>
      )}

      {!ruta.rutaIniciada && !ruta.rutaSuspendida && !ruta.preparacionInsumosCompleta && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          El operario debe completar la preparación de insumos antes de que puedas iniciar la ruta.
        </p>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Detalle de ruta
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {ruta.nombre}
        </h1>

        <dl className="mt-4 space-y-3 text-sm">
          <DetailRow label="Turno" value={ruta.turnoLabel} />
          <DetailRow label="Fecha" value={ruta.fechaLabel} />
          <div className="flex items-center justify-between gap-4">
            <dt className="text-zinc-500">Estado</dt>
            <dd>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  ESTADO_BADGE[ruta.estadoLabel] ?? ESTADO_BADGE.Pendiente
                }`}
              >
                {ruta.estadoLabel}
              </span>
            </dd>
          </div>
          {(ruta.rutaIniciada || ruta.rutaFinalizada) && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Recaudación
              </p>
              <div className="mt-2 space-y-3">
                <DetailRow
                  label="Monto a recaudar"
                  value={formatRecolectorMoney(ruta.montoARecaudar)}
                />
                <DetailRow
                  label="Recaudado en efectivo"
                  value={formatRecolectorMoney(ruta.recaudadoEfectivo)}
                />
                <DetailRow
                  label="Recaudado por transferencia"
                  value={formatRecolectorMoney(ruta.recaudadoTransferencia)}
                />
                <DetailRow
                  label="Recaudado por QR"
                  value={formatRecolectorMoney(ruta.recaudadoQr)}
                />
                <DetailRow
                  label="Total recaudado"
                  value={formatRecolectorMoney(ruta.totalRecaudado)}
                />
              </div>
            </>
          )}
          {ruta.rutaFinalizada && ruta.totalEfectivo != null && (
            <DetailRow
              label="Total efectivo (cierre)"
              value={formatRecolectorMoney(ruta.totalEfectivo)}
            />
          )}
          {ruta.preparacionInsumosCompleta && (
            <DetailRow label="Insumos asignados" value={ruta.insumosOperarioResumen} />
          )}
          {ruta.rutaIniciada && (
            <>
              <DetailRow
                label="Inicio jornada"
                value={formatInicioJornada(ruta.inicioJornadaAt)}
                suppressHydrationWarning
              />
              <DetailRow label="Km iniciales" value={formatKm(ruta.kmInicial)} />
              <DetailRow label="Insumos declarados" value={ruta.insumosResumen} />
            </>
          )}
        </dl>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {ruta.puedeIniciar ? (
          <Link
            href={`/panel/mis-rutas/${ruta.id}/iniciar`}
            className="col-span-2 flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl bg-emerald-700 px-3 text-center text-sm font-semibold text-white active:bg-emerald-800"
          >
            Inicio de ruta
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="col-span-2 flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl bg-emerald-700 px-3 text-center text-sm font-semibold text-white opacity-50"
          >
            {ruta.rutaSuspendida
              ? "Ruta suspendida"
              : !ruta.preparacionInsumosCompleta
                ? "Falta preparación"
              : ruta.rutaIniciada
                ? "Ruta iniciada"
                : "Inicio de ruta"}
          </button>
        )}
        <button
          type="button"
          onClick={handleMaps}
          disabled={!mapsUrl || ruta.rutaSuspendida}
          className="flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-3 text-center text-sm font-semibold text-blue-800 active:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:active:bg-blue-900"
        >
          Maps
        </button>
        <button
          type="button"
          onClick={handleWhatsAppTodos}
          disabled={whatsappTodosDisabled}
          title={motivoWhatsappTodos ?? `Avisar ${avisosWhatsapp.length} cliente(s) por WhatsApp`}
          className="flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl bg-[#25D366] px-3 text-center text-sm font-semibold text-white active:bg-[#1da851] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Avisar
        </button>
      </div>

      {avisoWhatsapp && (
        <div className="rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 p-4 dark:border-[#25D366]/30 dark:bg-[#25D366]/15">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Parada {avisoWhatsapp.index + 1} de {avisoWhatsapp.items.length}:{" "}
            {avisoWhatsapp.items[avisoWhatsapp.index].nombre}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Enviá el mensaje en WhatsApp y tocá Siguiente para la próxima parada.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancelarAvisoWhatsapp}
              className="min-h-[2.75rem] rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 active:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:active:bg-zinc-800"
            >
              Terminar
            </button>
            <button
              type="button"
              onClick={handleSiguienteAvisoWhatsapp}
              className="min-h-[2.75rem] rounded-xl bg-[#25D366] text-sm font-semibold text-white active:bg-[#1da851]"
            >
              {avisoWhatsapp.index + 1 >= avisoWhatsapp.items.length
                ? "Listo"
                : "Siguiente"}
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Recolecciones
          </h2>
          <span className="text-sm text-zinc-500">{recoleccionesPreview.length} parada(s)</span>
        </div>

        {recoleccionesPreview.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Todavía no hay recolecciones en esta ruta.
          </p>
        ) : (
          <ol className="space-y-3">
            {recoleccionesPreview.map((item) => {
              const recoleccionCerrada = recoleccionCerradaParaRecolector(item.estado);
              const puedeIrACarga =
                ruta.rutaIniciada &&
                !ruta.rutaSuspendida &&
                (ruta.rutaFinalizada || recoleccionCerrada || !recoleccionCerrada);
              const labelCarga = ruta.rutaFinalizada
                ? "Ver carga →"
                : recoleccionCerrada
                  ? "Ver carga →"
                  : "Cargar en campo →";
              const cardShellClass =
                "w-full rounded-2xl border border-zinc-200 bg-white text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
              const cardMain = (
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {item.orden}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.nombre}
                      </p>
                      <span className="shrink-0 text-xs text-zinc-500">{item.hora}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.direccion}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          recoleccionCerrada
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {item.estadoLabel}
                      </span>
                      {item.zona && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.zona}
                        </span>
                      )}
                      {puedeIrACarga ? (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {labelCarga}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-500">Ver detalle →</span>
                      )}
                    </div>
                  </div>
                </div>
              );

              if (puedeIrACarga) {
                return (
                  <li key={item.id}>
                    <div className={cardShellClass}>
                      <Link
                        href={`/panel/mis-rutas/${ruta.id}/recolecciones/${item.id}`}
                        className="block p-4 pb-2 active:scale-[0.99] active:bg-zinc-50 dark:active:bg-zinc-800"
                      >
                        {cardMain}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-[3.75rem]">
                        <RecoleccionMapsButton item={item} />
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className="inline-flex min-h-[1.75rem] items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-700 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:active:bg-zinc-700"
                        >
                          Info
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <div className={cardShellClass}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="block w-full p-4 pb-2 text-left active:scale-[0.99] active:bg-zinc-50 dark:active:bg-zinc-800"
                    >
                      {cardMain}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-[3.75rem]">
                      <RecoleccionMapsButton item={item} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {mostrarFinalizar && (
        <section className="space-y-2">
          {ruta.rutaFinalizada ? (
            <div className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-center text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Ruta finalizada
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleFinalizarRuta}
                disabled={finalizarDisabled}
                title={motivoFinalizar ?? undefined}
                className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 text-base font-semibold text-white active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:active:bg-zinc-200"
              >
                {finalizando ? "Finalizando ruta…" : "Finalizar ruta"}
              </button>
              {motivoFinalizar && (
                <p className="text-center text-xs text-zinc-500">{motivoFinalizar}</p>
              )}
            </>
          )}
        </section>
      )}

      <RecolectorRecoleccionSheet
        open={selectedId !== null}
        recoleccion={selectedRecoleccion}
        recolectorNombre={recolectorNombre}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function RecoleccionMapsButton({ item }: { item: RecolectorRecoleccionPreview }) {
  const hasDestination =
    (item.latitud != null && item.longitud != null) || item.direccion.trim().length > 0;

  if (!hasDestination) return null;

  async function handleClick() {
    await openGoogleMapsUrl((origin) => buildGoogleMapsRecoleccionUrl(item, { origin }));
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className="inline-flex min-h-[1.75rem] items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-800 active:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:active:bg-blue-900"
    >
      Maps
    </button>
  );
}

function DetailRow({
  label,
  value,
  suppressHydrationWarning = false,
}: {
  label: string;
  value: string;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd
        className="text-right font-medium text-zinc-900 dark:text-zinc-50"
        suppressHydrationWarning={suppressHydrationWarning}
      >
        {value}
      </dd>
    </div>
  );
}
