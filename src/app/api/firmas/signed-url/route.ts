import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/domain/constants";
import { parseFirmaStorageRef } from "@/lib/domain/firma-digital";
import { createFirmaRecoleccionSignedUrl } from "@/lib/storage/firmas-recoleccion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const ref = new URL(request.url).searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json({ ok: false, error: "Falta ref" }, { status: 400 });
  }

  const parsed = parseFirmaStorageRef(ref);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "Referencia de firma inválida" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  if (!isStaffRole(auth.profile.role)) {
    if (auth.profile.role !== "recolector") {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    const { data: ruta } = await admin
      .from("rutas")
      .select("asignado_a")
      .eq("id", parsed.rutaId)
      .maybeSingle();

    if (!ruta || ruta.asignado_a !== auth.user.id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }
  }

  const url = await createFirmaRecoleccionSignedUrl(admin, ref);
  if (!url) {
    return NextResponse.json({ ok: false, error: "Firma no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, url });
}
