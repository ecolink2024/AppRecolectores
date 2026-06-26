import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RecolectorRecoleccionCampoForm } from "@/components/panel/recolector/recolector-recoleccion-campo-form";
import { requireAuth } from "@/lib/auth/session";
import {
  fetchPrecioBolsaExtraActivo,
  fetchPrecioBolsaLlenaPuntoActivo,
  fetchPrecioBolsaPuntoActivo,
  fetchPrecioRetiroReciclableMixtoActivo,
} from "@/lib/data/sistema-parametros";
import { buildRecoleccionCampoFormData } from "@/lib/domain/recolector-recoleccion-form";
import { getInicioJornadaAt } from "@/lib/domain/recolector-ruta";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; recoleccionId: string }> };

export default async function RecolectorRecoleccionCampoPage({ params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const { id: rutaId, recoleccionId } = await params;
  const supabase = await createClient();

  const { data: ruta } = await supabase
    .from("rutas")
    .select("id, nombre, asignado_a, estado, inicio_jornada_at, metadata")
    .eq("id", rutaId)
    .eq("asignado_a", auth.user.id)
    .maybeSingle();

  if (!ruta) notFound();

  if (ruta.estado === "completada" || ruta.estado === "cerrada" || ruta.estado === "cancelada") {
    // Solo consulta: la ruta ya está cerrada
  } else if (ruta.estado === "suspendida") {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
          Esta ruta está suspendida. Contactá al operario.
        </p>
        <Link
          href={`/panel/mis-rutas/${rutaId}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver a la ruta
        </Link>
      </div>
    );
  }

  const inicioJornadaAt = getInicioJornadaAt(ruta);
  const rutaIniciada = ruta.estado === "en_curso" || inicioJornadaAt != null;

  if (!rutaIniciada) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Iniciá la ruta antes de cargar recolecciones.
        </p>
        <Link
          href={`/panel/mis-rutas/${rutaId}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver a la ruta
        </Link>
      </div>
    );
  }

  const { data: recoleccion } = await supabase
    .from("ruta_recolecciones")
    .select("*")
    .eq("id", recoleccionId)
    .eq("ruta_id", rutaId)
    .maybeSingle();

  if (!recoleccion) notFound();

  const [precioBolsaExtra, precioRetiroReciclableMixto, precioBolsaPunto, precioBolsaLlenaPunto] =
    await Promise.all([
      fetchPrecioBolsaExtraActivo(),
      fetchPrecioRetiroReciclableMixtoActivo(),
      fetchPrecioBolsaPuntoActivo(),
      fetchPrecioBolsaLlenaPuntoActivo(),
    ]);
  const formData = buildRecoleccionCampoFormData(
    rutaId,
    recoleccion,
    {
      bolsaExtra: precioBolsaExtra,
      retiroReciclableMixto: precioRetiroReciclableMixto,
      bolsaPunto: precioBolsaPunto,
      bolsaLlenaPunto: precioBolsaLlenaPunto,
    },
    ruta.estado,
  );

  return (
    <RecolectorRecoleccionCampoForm
      data={formData}
      rutaNombre={ruta.nombre}
      recolectorNombre={auth.profile.full_name ?? ""}
    />
  );
}
