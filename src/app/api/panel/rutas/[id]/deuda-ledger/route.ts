import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { escribirDeudasDeRuta } from "@/lib/data/deuda-ledger-ruta";
import { DEUDA_LEDGER_HABILITADO } from "@/lib/domain/deuda-ledger-flag";
import { avisoPlanillaDeudas } from "@/lib/integrations/sheets-deuda-sync";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ id: string }> };

/** Reintenta la planilla de deudas de una ruta ya cerrada, sin volver a cerrarla. */
export async function POST(_request: Request, { params }: Props) {
  if (!DEUDA_LEDGER_HABILITADO) {
    return NextResponse.json(
      { ok: false, error: "La planilla de deudas está en pausa." },
      { status: 503 },
    );
  }

  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: fetchError } = await admin
    .from("rutas")
    .select("id, estado")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }
  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }
  if (ruta.estado !== "cerrada") {
    return NextResponse.json(
      { ok: false, error: "Solo se reenvían deudas de una ruta Cerrada." },
      { status: 400 },
    );
  }

  const deudaSync = await escribirDeudasDeRuta(admin, rutaId);
  const deudaAviso = avisoPlanillaDeudas(deudaSync);

  if (!deudaSync.ok) {
    return NextResponse.json(
      { ok: false, error: deudaAviso ?? deudaSync.error, deuda_sync: deudaSync },
      { status: 502 },
    );
  }

  revalidatePath("/panel/historial");

  return NextResponse.json({
    ok: true,
    deuda_sync: deudaSync,
    deuda_aviso: deudaAviso,
    message: deudaAviso
      ? deudaAviso
      : deudaSync.attempted
        ? `Planilla actualizada (${deudaSync.actualizadas ?? 0} fila${deudaSync.actualizadas === 1 ? "" : "s"}).`
        : "Esta ruta no tiene transferencias ni QR para anotar en la planilla.",
  });
}
