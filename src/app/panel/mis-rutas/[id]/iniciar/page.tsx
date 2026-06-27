import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RecolectorInicioRutaForm } from "@/components/panel/recolector/recolector-inicio-ruta-form";
import { requireAuth } from "@/lib/auth/session";
import { insumosOperarioCompletados } from "@/lib/domain/ruta-insumos";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function IniciarRutaPage({ params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: ruta, error } = await supabase
    .from("rutas")
    .select("id, nombre, estado, insumos_operario")
    .eq("id", id)
    .eq("asignado_a", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("[iniciar-ruta] error al cargar ruta:", error.message);
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          No se pudo cargar la ruta: {error.message}
        </p>
        <Link
          href={`/panel/mis-rutas/${id}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver al detalle
        </Link>
      </div>
    );
  }

  if (!ruta) {
    notFound();
  }

  if (ruta.estado === "en_curso") {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Esta ruta ya fue iniciada.
        </p>
        <Link
          href={`/panel/mis-rutas/${id}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver al detalle
        </Link>
      </div>
    );
  }

  if (ruta.estado === "completada" || ruta.estado === "cerrada" || ruta.estado === "cancelada") {
    redirect(`/panel/mis-rutas/${id}`);
  }

  if (!insumosOperarioCompletados(ruta.insumos_operario)) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          El operario debe completar la preparación de insumos antes de que puedas iniciar esta ruta.
        </p>
        <Link
          href={`/panel/mis-rutas/${id}`}
          className="inline-flex min-h-[3rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Volver al detalle
        </Link>
      </div>
    );
  }

  return <RecolectorInicioRutaForm rutaId={ruta.id} rutaNombre={ruta.nombre} />;
}
