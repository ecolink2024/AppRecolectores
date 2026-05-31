"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useRef, useState } from "react";

import { getZonaMarkerColor } from "@/components/panel/operario/operario-badges";
import type { MapaPunto } from "@/lib/domain/mapa-puntos";

type Props = {
  open: boolean;
  rutaId: string | null;
  rutaNombre: string | null;
  mapsApiKey: string | null;
  onClose: () => void;
};

type MapaResponse = {
  ok: boolean;
  puntos?: MapaPunto[];
  geocodificados?: number;
  fallidos?: number;
  total?: number;
  error?: string;
};

const CORDOBA_CENTER = { lat: -31.4201, lng: -64.1888 };

export function OperarioRutaMapModal({
  open,
  rutaId,
  rutaNombre,
  mapsApiKey,
  onClose,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ geocodificados: number; fallidos: number; total: number } | null>(null);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = [];
  }, []);

  const renderMap = useCallback(
    async (puntos: MapaPunto[]) => {
      if (!mapsApiKey || !mapContainerRef.current) return;

      setOptions({ key: mapsApiKey, v: "weekly", language: "es", region: "AR" });
      const { Map } = await importLibrary("maps");
      const { LatLngBounds } = await importLibrary("core");

      if (!mapRef.current) {
        mapRef.current = new Map(mapContainerRef.current, {
          center: CORDOBA_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      clearMarkers();

      if (puntos.length === 0) return;

      const bounds = new LatLngBounds();

      for (const punto of puntos) {
        const position = { lat: punto.lat, lng: punto.lng };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          map: mapRef.current,
          position,
          title: `${punto.orden}. ${punto.nombre}`,
          label: {
            text: String(punto.orden),
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "11px",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: getZonaMarkerColor(punto.zona),
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const info = new google.maps.InfoWindow({
          content: `<div style="max-width:220px;font-family:system-ui,sans-serif">
            <strong>${punto.orden}. ${escapeHtml(punto.nombre)}</strong><br/>
            <span style="color:#52525b">${escapeHtml(punto.direccion)}</span>
            ${punto.zona ? `<br/><span style="color:#71717a">Zona: ${escapeHtml(punto.zona)}</span>` : ""}
          </div>`,
        });

        marker.addListener("click", () => info.open({ map: mapRef.current!, anchor: marker }));
        markersRef.current.push(marker);
      }

      mapRef.current.fitBounds(bounds, 48);
    },
    [clearMarkers, mapsApiKey],
  );

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

  useEffect(() => {
    if (!open || !rutaId) return;

    let cancelled = false;

    async function loadMapData() {
      setLoading(true);
      setError(null);
      setMeta(null);
      clearMarkers();

      if (!mapsApiKey) {
        setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el entorno.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/panel/rutas/${rutaId}/mapa`, {
          cache: "no-store",
        });
        const body = (await response.json()) as MapaResponse;

        if (cancelled) return;

        if (!response.ok || !body.ok) {
          setError(body.error ?? "No se pudo cargar el mapa");
          setLoading(false);
          return;
        }

        const puntos = body.puntos ?? [];
        setMeta({
          geocodificados: body.geocodificados ?? 0,
          fallidos: body.fallidos ?? 0,
          total: body.total ?? puntos.length,
        });

        await renderMap(puntos);

        if (puntos.length === 0) {
          setError("No hay puntos con ubicación para esta ruta.");
        }
      } catch {
        if (!cancelled) setError("Error de red al cargar el mapa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMapData();

    return () => {
      cancelled = true;
    };
  }, [open, rutaId, mapsApiKey, clearMarkers, renderMap]);

  useEffect(() => {
    if (!open) {
      clearMarkers();
      setError(null);
      setMeta(null);
      setLoading(false);
    }
  }, [open, clearMarkers]);

  if (!open || !rutaId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar mapa"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ruta-mapa-title"
        className="relative z-10 flex h-[min(85vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="ruta-mapa-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Mapa de ruta
            </h2>
            <p className="text-sm text-zinc-500">{rutaNombre ?? "Ruta seleccionada"}</p>
            {meta && !loading && !error && (
              <p className="mt-1 text-xs text-zinc-500">
                {meta.total} punto(s)
                {meta.geocodificados > 0 ? ` · ${meta.geocodificados} geocodificado(s) ahora` : ""}
                {meta.fallidos > 0 ? ` · ${meta.fallidos} sin ubicación` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-zinc-600 dark:bg-zinc-900/80">
              Cargando mapa y ubicaciones…
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <div ref={mapContainerRef} className="h-full w-full min-h-[360px]" />
        </div>
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
