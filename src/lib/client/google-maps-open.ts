"use client";

async function getCurrentPositionCoords(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

/** Abre Google Maps usando GPS del dispositivo como origen cuando está disponible. */
export async function openGoogleMapsUrl(
  buildUrl: (origin?: string) => string | null,
): Promise<boolean> {
  const fallbackUrl = buildUrl();
  if (!fallbackUrl) return false;

  const coords = await getCurrentPositionCoords();
  const url = coords ? (buildUrl(coords) ?? fallbackUrl) : fallbackUrl;

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
