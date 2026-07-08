/**
 * Inspecciona los nombres de insumos guardados en las rutas existentes.
 * Uso: node scripts/inspect-insumos.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
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
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NUEVOS = new Set([
  "Bolsa Nueva",
  "Cesto",
  "Biotacho",
  "Bolsa de Punto",
  "Planilla Empresas",
  "Planilla de Punto",
  "Cartel Empresa",
]);

function tally(rows, col, counter) {
  for (const r of rows) {
    const arr = r[col];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const tipo = item && typeof item === "object" ? item.tipo : undefined;
      if (typeof tipo !== "string") continue;
      counter.set(tipo, (counter.get(tipo) ?? 0) + 1);
    }
  }
}

async function main() {
  const { data, error } = await admin
    .from("rutas")
    .select("id, insumos_inicio, insumos_operario");
  if (error) throw new Error(error.message);

  const inicio = new Map();
  const operario = new Map();
  tally(data, "insumos_inicio", inicio);
  tally(data, "insumos_operario", operario);

  const print = (label, counter) => {
    console.log(`\n== ${label} ==`);
    if (counter.size === 0) {
      console.log("(sin datos)");
      return;
    }
    for (const [tipo, n] of [...counter.entries()].sort((a, b) => b[1] - a[1])) {
      const ok = NUEVOS.has(tipo) ? "OK" : "NO COINCIDE";
      console.log(`  ${tipo.padEnd(22)} x${n}  -> ${ok}`);
    }
  };

  console.log(`Rutas totales: ${data.length}`);
  print("insumos_inicio (recolector)", inicio);
  print("insumos_operario (preparación)", operario);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
