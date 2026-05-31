const DEFAULT_REGION = "Argentina";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

export function buildGeocodeQuery(parts: {
  direccion: string;
  barrio?: string | null;
  depto?: string | null;
}): string {
  const chunks = [parts.direccion.trim()];
  if (parts.depto?.trim()) chunks.push(`Depto ${parts.depto.trim()}`);
  if (parts.barrio?.trim()) chunks.push(parts.barrio.trim());
  chunks.push(DEFAULT_REGION);
  return chunks.filter(Boolean).join(", ");
}

export async function geocodeAddress(
  query: string,
  apiKey: string,
): Promise<GeocodeResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "ar");
  url.searchParams.set("language", "es");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return null;

  const body = (await response.json()) as {
    status: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (body.status !== "OK" || !body.results?.[0]) return null;

  const hit = body.results[0];
  return {
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
    formattedAddress: hit.formatted_address,
  };
}

export function latLngToDms(lat: number, lng: number): string {
  function part(value: number, pos: string, neg: string) {
    const abs = Math.abs(value);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = Math.round((mFloat - m) * 60);
    const hemi = value >= 0 ? pos : neg;
    return `${d}°${m}'${s}"${hemi}`;
  }
  return `${part(lat, "N", "S")} ${part(lng, "E", "W")}`;
}
