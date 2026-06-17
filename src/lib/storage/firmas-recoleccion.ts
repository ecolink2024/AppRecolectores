import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildFirmaRecoleccionStorageRef,
  FIRMAS_RECOLECCION_BUCKET,
  parseFirmaStorageRef,
} from "@/lib/domain/firma-digital";
import type { Database } from "@/types/database";

const MAX_FIRMA_BYTES = 512 * 1024;
const SIGNED_URL_TTL_SEC = 3600;

function parsePngDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const trimmed = dataUrl.trim();
  const match = trimmed.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/i);
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0 || buffer.length > MAX_FIRMA_BYTES) return null;
    return { buffer, mime: match[1].toLowerCase() };
  } catch {
    return null;
  }
}

export async function uploadFirmaRecoleccionPng(
  admin: SupabaseClient<Database>,
  rutaId: string,
  recoleccionId: string,
  dataUrl: string,
): Promise<{ ok: true; storageRef: string } | { ok: false; error: string }> {
  const parsed = parsePngDataUrl(dataUrl);
  if (!parsed) {
    return { ok: false, error: "Imagen de firma inválida o demasiado grande (máx. 512 KB)" };
  }

  const objectPath = `${rutaId}/${recoleccionId}.png`;
  const { error } = await admin.storage
    .from(FIRMAS_RECOLECCION_BUCKET)
    .upload(objectPath, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true,
    });

  if (error) {
    const hint = error.message.includes("Bucket not found")
      ? " Creá el bucket ejecutando la migración 20260605120000_firmas_recoleccion_storage.sql en Supabase."
      : "";
    return { ok: false, error: `${error.message}${hint}` };
  }

  return {
    ok: true,
    storageRef: buildFirmaRecoleccionStorageRef(rutaId, recoleccionId),
  };
}

export async function createFirmaRecoleccionSignedUrl(
  admin: SupabaseClient<Database>,
  storageRef: string,
): Promise<string | null> {
  const parsed = parseFirmaStorageRef(storageRef);
  if (!parsed) return null;

  const { data, error } = await admin.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.objectPath, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
