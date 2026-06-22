/**
 * Aplica migraciones SQL pendientes en Supabase.
 *
 * Opción A — con URL de Postgres (recomendado):
 *   Supabase Dashboard → Project Settings → Database → Connection string (URI)
 *   Agregá a .env.local: SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...
 *   node scripts/apply-pending-migrations.mjs
 *
 * Opción B — sin URL: imprime el SQL para pegarlo en SQL Editor del dashboard.
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const MIGRATION_FILES = [
  "20260523120000_rutas_operativo_campos.sql",
  "20260524120000_rutas_inicio_insumos.sql",
  "20260524130000_recoleccion_campo_campos.sql",
  "20260524140000_fix_missing_operativo_columns.sql",
  "20260525120000_sistema_parametros_precio.sql",
  "20260526120000_ruta_estado_suspendida.sql",
  "20260531120000_ruta_cierre_recolector_campos.sql",
  "20260601120000_ruta_estado_terminada.sql",
  "20260602120000_ruta_estado_terminada_a_cerrada.sql",
  "20260603120000_recoleccion_empresa_punto_campos.sql",
  "20260604120000_rutas_insumos_operario.sql",
  "20260606120000_recoleccion_observaciones_recolector.sql",
  "20260607120000_recoleccion_cesto_campo.sql",
];

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

function readMigrations() {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const parts = [];
  for (const file of MIGRATION_FILES) {
    const sql = readFileSync(join(dir, file), "utf8").trim();
    parts.push(`-- ${file}\n${sql}`);
  }
  return parts.join("\n\n");
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;
const sql = readMigrations();

if (!dbUrl) {
  console.log("No hay SUPABASE_DB_URL en .env.local.\n");
  console.log("Copiá y ejecutá este SQL en Supabase → SQL Editor:\n");
  console.log("---");
  console.log(sql);
  console.log("---\n");
  console.log(
    "O agregá SUPABASE_DB_URL (Connection string URI) a .env.local y volvé a correr este script.",
  );
  process.exit(0);
}

const { Client } = await import("pg");
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Conectado. Aplicando migraciones…");
  await client.query(sql);
  console.log("Migraciones aplicadas correctamente.");
} catch (err) {
  console.error("Error al aplicar migraciones:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
