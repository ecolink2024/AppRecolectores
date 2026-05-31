const optionalServerEnv = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SHEETS_IMPORT_SECRET",
] as const;

export type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Clave pública: anon (legacy) o publishable (dashboard nuevo de Supabase). */
export function getSupabasePublicKey(): string | undefined {
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function getSupabaseUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/** Clave secreta de servidor: service_role (legacy) o secret (dashboard nuevo). */
export function getSupabaseSecretKey(): string | undefined {
  const value =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? readEnv("SUPABASE_SECRET_KEY");
  if (!value || value === "tu_service_role_key") return undefined;
  return value;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(getSupabaseSecretKey());
}

export function getServerEnv(): ServerEnv {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabasePublicKey();
  const supabaseServiceRoleKey = getSupabaseSecretKey();

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(", ")}. Copiá .env.example a .env.local y completá los valores desde el dashboard de Supabase.`,
    );
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    supabaseServiceRoleKey,
  };
}

export function getOptionalEnvKeys(): readonly string[] {
  return optionalServerEnv;
}

/** Secreto compartido con Google Apps Script para importar rutas desde Sheets. */
export function getSheetsImportSecret(): string | undefined {
  const value = readEnv("SHEETS_IMPORT_SECRET");
  if (!value || value === "genera_un_secreto_largo") return undefined;
  return value;
}

export function isSheetsImportConfigured(): boolean {
  return isSupabaseAdminConfigured() && Boolean(getSheetsImportSecret());
}

/** Maps JavaScript API — solo cliente (restringir por dominio en Google Cloud). */
export function getGoogleMapsPublicKey(): string | undefined {
  return readEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
}

/** Geocoding API — solo servidor (restringir por IP o usar key separada). */
export function getGoogleGeocodingKey(): string | undefined {
  return (
    readEnv("GOOGLE_MAPS_GEOCODING_API_KEY") ??
    readEnv("GOOGLE_MAPS_SERVER_API_KEY")
  );
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(getGoogleMapsPublicKey());
}

export function isGoogleGeocodingConfigured(): boolean {
  return Boolean(getGoogleGeocodingKey());
}
