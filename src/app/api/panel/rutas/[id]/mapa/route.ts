import { NextResponse } from "next/server";

import {
  buildGeocodeQuery,
  geocodeAddress,
  latLngToDms,
} from "@/lib/integrations/google-geocoding";
import { requireStaff } from "@/lib/auth/session";
import { getGoogleGeocodingKey } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import type { MapaPunto } from "@/lib/domain/mapa-puntos";

export type { MapaPunto };

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const geocodingKey = getGoogleGeocodingKey();
  if (!geocodingKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falta GOOGLE_MAPS_GEOCODING_API_KEY en el servidor",
      },
      { status: 503 },
    );
  }

  const { id: rutaId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: recolecciones, error } = await admin
    .from("ruta_recolecciones")
    .select("id, orden, nombre, direccion, barrio, depto, zona, latitud, longitud")
    .eq("ruta_id", rutaId)
    .order("orden", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const puntos: MapaPunto[] = [];
  let geocodificados = 0;
  let fallidos = 0;

  for (const item of recolecciones ?? []) {
    if (item.latitud != null && item.longitud != null) {
      puntos.push({
        id: item.id,
        orden: item.orden,
        nombre: item.nombre,
        direccion: item.direccion,
        zona: item.zona,
        lat: item.latitud,
        lng: item.longitud,
      });
      continue;
    }

    const query = buildGeocodeQuery({
      direccion: item.direccion,
      barrio: item.barrio,
      depto: item.depto,
    });

    const hit = await geocodeAddress(query, geocodingKey);
    if (!hit) {
      fallidos += 1;
      continue;
    }

    await admin
      .from("ruta_recolecciones")
      .update({
        latitud: hit.lat,
        longitud: hit.lng,
        direccion_google: hit.formattedAddress,
        coordenadas_dms: latLngToDms(hit.lat, hit.lng),
      })
      .eq("id", item.id);

    geocodificados += 1;
    puntos.push({
      id: item.id,
      orden: item.orden,
      nombre: item.nombre,
      direccion: item.direccion,
      zona: item.zona,
      lat: hit.lat,
      lng: hit.lng,
    });
  }

  return NextResponse.json({
    ok: true,
    puntos,
    geocodificados,
    fallidos,
    total: (recolecciones ?? []).length,
  });
}
