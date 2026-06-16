import { NextResponse } from "next/server";

import {
  fetchRecolectoresEmails,
  importRecoleccionesFromSheets,
  type ImportRecoleccionPayload,
} from "@/lib/integrations/sheets-import-recolecciones";
import {
  buildRecolectoresLookup,
  validateRecoleccionRow,
  type RecoleccionSheetRow,
} from "@/lib/integrations/sheet-recoleccion-validation";
import {
  verifySheetsImportSecret,
} from "@/lib/integrations/sheets-import";
import {
  getSheetsImportSecret,
  isSheetsImportConfigured,
} from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

function extractSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return request.headers.get("x-api-key")?.trim() ?? null;
}

export async function POST(request: Request) {
  if (!isSheetsImportConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Integración no configurada en el servidor" },
      { status: 503 },
    );
  }

  const secret = getSheetsImportSecret()!;
  if (!verifySheetsImportSecret(extractSecret(request), secret)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const spreadsheet_id = String(raw.spreadsheet_id ?? "").trim();
  if (!spreadsheet_id) {
    return NextResponse.json(
      { ok: false, error: "Falta spreadsheet_id" },
      { status: 400 },
    );
  }

  const filas = raw.recolecciones;
  if (!Array.isArray(filas) || filas.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay recolecciones para importar" },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const recolectores = await fetchRecolectoresEmails(admin);
  const recolectoresLookup = buildRecolectoresLookup(recolectores);

  const validated = [];
  const rejections: string[] = [];

  for (const fila of filas) {
    const result = validateRecoleccionRow(fila as RecoleccionSheetRow, recolectoresLookup);
    if (result.estado !== "Pendiente" || !result.data) {
      rejections.push(
        `Fila ${(fila as RecoleccionSheetRow).fila ?? "?"}: ${result.mensaje || result.estado}`,
      );
      continue;
    }
    validated.push(result.data);
  }

  if (validated.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Ninguna fila válida", details: rejections },
      { status: 400 },
    );
  }

  const payload: ImportRecoleccionPayload = {
    spreadsheet_id,
    spreadsheet_url: String(raw.spreadsheet_url ?? "").trim() || undefined,
    sheet_name: String(raw.sheet_name ?? "").trim() || undefined,
    recolecciones: validated,
  };

  const result = await importRecoleccionesFromSheets(admin, payload);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(
    { ...result, rejected: rejections },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  if (!isSheetsImportConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Integración no configurada" },
      { status: 503 },
    );
  }

  const secret = getSheetsImportSecret()!;
  if (!verifySheetsImportSecret(extractSecret(request), secret)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const recolectores = await fetchRecolectoresEmails(admin);
  const lookup = buildRecolectoresLookup(recolectores);
  return NextResponse.json({
    recolectores: recolectores.map((r, i) => ({
      email: r.email,
      nombre: r.nombre,
      label: lookup.labels[i],
    })),
  });
}
