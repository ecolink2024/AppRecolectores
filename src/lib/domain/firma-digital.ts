/** Referencia guardada en `ruta_recolecciones.firma_digital` para archivos en Storage. */
export const FIRMAS_RECOLECCION_BUCKET = "firmas-recoleccion";

export function buildFirmaRecoleccionStorageRef(
  rutaId: string,
  recoleccionId: string,
): string {
  return `${FIRMAS_RECOLECCION_BUCKET}/${rutaId}/${recoleccionId}.png`;
}

export function isFirmaStorageRef(firma: string | null | undefined): boolean {
  if (!firma) return false;
  return firma.startsWith(`${FIRMAS_RECOLECCION_BUCKET}/`);
}

export function parseFirmaStorageRef(firma: string): {
  bucket: string;
  objectPath: string;
  rutaId: string;
  recoleccionId: string;
} | null {
  if (!isFirmaStorageRef(firma)) return null;
  const objectPath = firma.slice(FIRMAS_RECOLECCION_BUCKET.length + 1);
  const match = objectPath.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.png$/i,
  );
  if (!match) return null;
  return {
    bucket: FIRMAS_RECOLECCION_BUCKET,
    objectPath,
    rutaId: match[1],
    recoleccionId: match[2],
  };
}

/** Firma visual guardada (Storage, URL o legacy base64). */
export function esFirmaDigitalImagen(firma: string | null | undefined): boolean {
  if (!firma) return false;
  if (firma.startsWith("data:image") || firma.startsWith("http")) return true;
  return isFirmaStorageRef(firma);
}

export function isLegacyFirmaPlaceholder(firma: string | null | undefined): boolean {
  if (!firma) return false;
  return firma.startsWith("confirmada-");
}
