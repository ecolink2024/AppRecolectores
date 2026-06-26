"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { FirmaCanvas, type FirmaCanvasRef } from "@/components/panel/firma-canvas";
import { FirmaDigitalImage } from "@/components/panel/firma-digital-image";
import { RecolectorParadaDatosClienteRows } from "@/components/panel/recolector/recolector-parada-datos-cliente";

import {
  type RecoleccionCampoFormData,
} from "@/lib/domain/recolector-recoleccion-form";
import { formatPrecioDisplay, getRecoleccionCampoContadoresRules } from "@/lib/domain/recolector-recoleccion-campo";
import {
  buildPrecioCobroDetalle,
  type PrecioCobroDetalle,
} from "@/lib/domain/sistema-parametros";
import { buildWhatsAppHrefRecoleccion } from "@/lib/whatsapp";

type Props = {
  data: RecoleccionCampoFormData;
  rutaNombre: string;
  recolectorNombre: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function RecolectorRecoleccionCampoForm({ data, rutaNombre, recolectorNombre }: Props) {
  const router = useRouter();
  const whatsappHref = useMemo(
    () => buildWhatsAppHrefRecoleccion(data.telefono, recolectorNombre),
    [data.telefono, recolectorNombre],
  );
  const soloLectura = data.soloLectura;
  const [motivoCancelacion, setMotivoCancelacion] = useState(data.motivoCancelacion);
  const [bolsasLlenas, setBolsasLlenas] = useState(data.bolsasLlenas);
  const [bolsasLlenasPunto, setBolsasLlenasPunto] = useState(data.bolsasLlenasPunto);
  const [bolsasNuevasVendidas, setBolsasNuevasVendidas] = useState(data.bolsasNuevasVendidas);
  const [biotachosLlenos, setBiotachosLlenos] = useState(data.biotachosLlenos);
  const [bolsasNuevas, setBolsasNuevas] = useState(data.bolsasNuevas);
  const [biotachosNuevos, setBiotachosNuevos] = useState(data.biotachosNuevos);
  const [cestos, setCestos] = useState(data.cestos);
  const [montoEfectivo, setMontoEfectivo] = useState(data.montoEfectivo);
  const [montoTransferencia, setMontoTransferencia] = useState(data.montoTransferencia);
  const [montoQr, setMontoQr] = useState(data.montoQr);
  const [nombreFirmante, setNombreFirmante] = useState(data.nombreFirmante);
  const [observacionesRecolector, setObservacionesRecolector] = useState(
    data.observacionesRecolector,
  );
  const firmaCanvasRef = useRef<FirmaCanvasRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const esCancelacion = motivoCancelacion.trim().length > 0;
  const contadoresRules = useMemo(
    () => getRecoleccionCampoContadoresRules(data.unidad, data.tipoServicio),
    [data.unidad, data.tipoServicio],
  );
  const parseCount = (value: string) =>
    value.trim() === "" ? 0 : Number.parseInt(value, 10) || 0;
  const bolsasLlenasNum = parseCount(bolsasLlenas);
  const bolsasLlenasPuntoNum = parseCount(bolsasLlenasPunto);
  const bolsasNuevasVendidasNum = parseCount(bolsasNuevasVendidas);
  const cobroDetalle = useMemo(
    () =>
      buildPrecioCobroDetalle({
        unidad: data.unidad,
        tipoServicio: data.tipoServicio,
        precioRetiro: data.precioRetiro,
        precioBolsaExtra: data.precioBolsaExtra,
        precioRetiroReciclableMixto: data.precioRetiroReciclableMixto,
        precioBolsaPunto: data.precioBolsaPunto,
        precioBolsaLlenaPunto: data.precioBolsaLlenaPunto,
        bolsasLlenas: bolsasLlenasNum,
        bolsasLlenasPunto: bolsasLlenasPuntoNum,
        bolsasNuevasVendidas: bolsasNuevasVendidasNum,
      }),
    [
      data.unidad,
      data.tipoServicio,
      data.precioRetiro,
      data.precioBolsaExtra,
      data.precioRetiroReciclableMixto,
      data.precioBolsaPunto,
      data.precioBolsaLlenaPunto,
      bolsasLlenasNum,
      bolsasLlenasPuntoNum,
      bolsasNuevasVendidasNum,
    ],
  );
  const precioRetiroLabel = useMemo(
    () => formatPrecioDisplay(data.precioRetiro),
    [data.precioRetiro],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (soloLectura) return;
    setSaving(true);
    setError(null);

    const montoEfectivoVal = parsePaymentValue(montoEfectivo);
    const montoTransferenciaVal = parsePaymentValue(montoTransferencia);
    const montoQrVal = parsePaymentValue(montoQr);

    if (
      montoEfectivoVal === null ||
      montoTransferenciaVal === null ||
      montoQrVal === null
    ) {
      setError("Efectivo, transferencia y QR deben ser números ≥ 0");
      setSaving(false);
      return;
    }

    if (!nombreFirmante.trim()) {
      setError("Completá el nombre del firmante");
      setSaving(false);
      return;
    }

    if (!firmaCanvasRef.current || firmaCanvasRef.current.isEmpty()) {
      setError("El cliente debe firmar en el recuadro");
      setSaving(false);
      return;
    }

    const firmaPng = firmaCanvasRef.current.toDataURL();

    try {
      const response = await fetch(
        `/api/recolector/rutas/${data.rutaId}/recolecciones/${data.id}/campo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivo_cancelacion: motivoCancelacion.trim() || null,
            bolsas_llenas: bolsasLlenas === "" ? null : Number.parseInt(bolsasLlenas, 10),
            bolsas_llenas_punto:
              bolsasLlenasPunto === "" ? null : Number.parseInt(bolsasLlenasPunto, 10),
            bolsas_nuevas_vendidas:
              bolsasNuevasVendidas === "" ? null : Number.parseInt(bolsasNuevasVendidas, 10),
            biotachos_llenos:
              biotachosLlenos === "" ? null : Number.parseInt(biotachosLlenos, 10),
            bolsas_nuevas: bolsasNuevas === "" ? null : Number.parseInt(bolsasNuevas, 10),
            biotachos_nuevos:
              biotachosNuevos === "" ? null : Number.parseInt(biotachosNuevos, 10),
            cestos: cestos === "" ? null : Number.parseInt(cestos, 10),
            monto_efectivo: montoEfectivoVal,
            monto_transferencia: montoTransferenciaVal,
            monto_qr: montoQrVal,
            nombre_firmante: nombreFirmante.trim(),
            observaciones_recolector: observacionesRecolector.trim() || null,
            firma_png: firmaPng,
          }),
        },
      );
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo guardar");
      }

      router.push(`/panel/mis-rutas/${data.rutaId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <Link
        href={`/panel/mis-rutas/${data.rutaId}`}
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver a la ruta
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Recolección #{data.orden} · {rutaNombre}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {soloLectura ? "Consulta de carga" : "Carga en campo"}
        </h1>
        {soloLectura && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {data.completada
              ? `Esta recolección ya fue guardada (${data.estadoLabel}). No podés modificar los datos.`
              : "La ruta está finalizada. Solo podés consultar la información."}
          </p>
        )}
      </div>

      {soloLectura ? (
        <RecoleccionCampoSoloLectura
          data={data}
          esCancelacion={esCancelacion}
          precioRetiroLabel={precioRetiroLabel}
          cobroDetalle={cobroDetalle}
          whatsappHref={whatsappHref}
        />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Datos del cliente
          </h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-900 dark:text-zinc-50">{data.nombre}</p>
          <RecolectorParadaDatosClienteRows
            datos={{
              direccion: data.direccion,
              depto: data.depto,
              barrio: data.barrio,
              zona: data.zona,
              horario: data.horaProgramada,
              servicio: data.tipoServicio,
              unidad: data.unidad,
              frecuencia: data.frecuencia,
              precio: data.precio,
              deuda: data.deuda,
              notaEncargado: data.notaEncargado,
              telefono: data.telefono,
            }}
            whatsappHref={whatsappHref}
          />
          <dl className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-700">
            <ReadOnlyRow label="Obs. operario" value={data.observaciones || "—"} />
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Motivo de cancelación
            </span>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Si completás esto, solo necesitás firmar (sin cargar bolsas ni pagos)"
              className={`${inputClass} min-h-[88px] resize-y`}
            />
          </label>
        </section>

        {!esCancelacion && (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Retiro
              </h2>
              {data.esEmpresaPunto && (
                <p className="mb-3 text-xs text-violet-800 dark:text-violet-300">
                  Empresa + Punto: el total automático usa bolsas llenas hogar y bolsas nuevas
                  vendidas (Parámetros). Bolsas llenas punto: solo cantidad; el monto en punto va
                  en los pagos.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={data.esEmpresaPunto ? "Bolsas llenas hogar" : "Bolsas llenas"}
                  value={bolsasLlenas}
                  onChange={setBolsasLlenas}
                  required={contadoresRules.bolsasLlenasRequired}
                />
                {data.esEmpresaPunto && (
                  <>
                    <Field
                      label="Bolsas llenas punto (solo cantidad)"
                      value={bolsasLlenasPunto}
                      onChange={setBolsasLlenasPunto}
                      required
                    />
                    <Field
                      label="Bolsas nuevas vendidas"
                      value={bolsasNuevasVendidas}
                      onChange={setBolsasNuevasVendidas}
                      required
                    />
                  </>
                )}
                <Field
                  label="Biotachos llenos"
                  value={biotachosLlenos}
                  onChange={setBiotachosLlenos}
                  required={contadoresRules.biotachosLlenosRequired}
                />
                <Field
                  label="Bolsas nuevas"
                  value={bolsasNuevas}
                  onChange={setBolsasNuevas}
                  required={contadoresRules.bolsasNuevasRequired}
                />
                <Field
                  label="Biotachos nuevos"
                  value={biotachosNuevos}
                  onChange={setBiotachosNuevos}
                  required={contadoresRules.biotachosNuevosRequired}
                />
                <Field label="Cestos" value={cestos} onChange={setCestos} required />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Cobro
              </h2>
              <CobroDetalleRows
                cobroDetalle={cobroDetalle}
                precioRetiroLabel={precioRetiroLabel}
                precioBolsaExtraLabel={data.precioBolsaExtraLabel}
                precioBolsaPuntoLabel={data.precioBolsaPuntoLabel}
                precioBolsaLlenaPuntoLabel={data.precioBolsaLlenaPuntoLabel}
              />
              <p className="mb-3 text-xs text-zinc-500">{cobroDetalle.ayudaCobro}</p>
              <p className="mb-3 text-xs text-zinc-500">
                Los tres montos son obligatorios (podés poner <strong>0</strong>). La suma no
                puede ser menor al total a cobrar (puede ser mayor).
              </p>
              <div className="space-y-3">
                <MoneyField
                  label="Monto efectivo *"
                  value={montoEfectivo}
                  onChange={setMontoEfectivo}
                />
                <MoneyField
                  label="Monto transferencia *"
                  value={montoTransferencia}
                  onChange={setMontoTransferencia}
                />
                <MoneyField label="Monto QR *" value={montoQr} onChange={setMontoQr} />
              </div>
            </section>
          </>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Tus observaciones <span className="font-normal text-zinc-500">(opcional)</span>
            </span>
            <textarea
              value={observacionesRecolector}
              onChange={(e) => setObservacionesRecolector(e.target.value)}
              placeholder="Ej. cliente no estaba, acceso por portón trasero…"
              className={`${inputClass} min-h-[72px] resize-y`}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Firma</h2>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Nombre del firmante *
            </span>
            <input
              className={inputClass}
              value={nombreFirmante}
              onChange={(e) => setNombreFirmante(e.target.value)}
              required
            />
          </label>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Firma del cliente *
              </span>
              <button
                type="button"
                onClick={() => firmaCanvasRef.current?.clear()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Limpiar
              </button>
            </div>
            <FirmaCanvas ref={firmaCanvasRef} className="h-36 w-full" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pedile al cliente que firme con el dedo dentro del recuadro.
            </p>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-emerald-700 text-base font-semibold text-white active:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? "Guardando…" : esCancelacion ? "Guardar cancelación" : "Guardar recolección"}
        </button>
      </form>
      )}
    </div>
  );
}

function RecoleccionCampoSoloLectura({
  data,
  esCancelacion,
  precioRetiroLabel,
  cobroDetalle,
  whatsappHref,
}: {
  data: RecoleccionCampoFormData;
  esCancelacion: boolean;
  precioRetiroLabel: string;
  cobroDetalle: ReturnType<typeof buildPrecioCobroDetalle>;
  whatsappHref: string;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Datos del cliente
        </h2>
        <p className="mt-0.5 text-xs font-medium text-zinc-900 dark:text-zinc-50">{data.nombre}</p>
        <RecolectorParadaDatosClienteRows
          datos={{
            direccion: data.direccion,
            depto: data.depto,
            barrio: data.barrio,
            zona: data.zona,
            horario: data.horaProgramada,
            servicio: data.tipoServicio,
            unidad: data.unidad,
            frecuencia: data.frecuencia,
            precio: data.precio,
            deuda: data.deuda,
            notaEncargado: data.notaEncargado,
            telefono: data.telefono,
          }}
          whatsappHref={whatsappHref}
        />
        <dl className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-700">
          <ReadOnlyRow label="Estado" value={data.estadoLabel} />
          <ReadOnlyRow label="Obs. operario" value={data.observaciones || "—"} />
        </dl>
      </section>

      {esCancelacion ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Cancelación
          </h2>
          <ReadOnlyRow label="Motivo" value={data.motivoCancelacion || "—"} />
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Retiro
            </h2>
            <dl className="space-y-2 text-sm">
              <ReadOnlyRow
                label={data.esEmpresaPunto ? "Bolsas llenas hogar" : "Bolsas llenas"}
                value={data.bolsasLlenas || "0"}
              />
              {data.esEmpresaPunto && (
                <>
                  <ReadOnlyRow label="Bolsas llenas punto" value={data.bolsasLlenasPunto || "0"} />
                  <ReadOnlyRow
                    label="Bolsas nuevas vendidas"
                    value={data.bolsasNuevasVendidas || "0"}
                  />
                </>
              )}
              <ReadOnlyRow label="Biotachos llenos" value={data.biotachosLlenos || "0"} />
              <ReadOnlyRow label="Bolsas nuevas" value={data.bolsasNuevas || "0"} />
              <ReadOnlyRow label="Biotachos nuevos" value={data.biotachosNuevos || "0"} />
              <ReadOnlyRow label="Cestos" value={data.cestos || "0"} />
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Cobro
            </h2>
            <CobroDetalleRows
              cobroDetalle={cobroDetalle}
              precioRetiroLabel={precioRetiroLabel}
              precioBolsaExtraLabel={data.precioBolsaExtraLabel}
              precioBolsaPuntoLabel={data.precioBolsaPuntoLabel}
              precioBolsaLlenaPuntoLabel={data.precioBolsaLlenaPuntoLabel}
            />
            <dl className="space-y-2 text-sm">
              <ReadOnlyRow label="Efectivo" value={data.montoEfectivo} />
              <ReadOnlyRow label="Transferencia" value={data.montoTransferencia} />
              <ReadOnlyRow label="QR" value={data.montoQr} />
            </dl>
          </section>
        </>
      )}

      {data.observacionesRecolector.trim() && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Observaciones del recolector
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{data.observacionesRecolector}</p>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Firma</h2>
        <dl className="space-y-2 text-sm">
          <ReadOnlyRow label="Firmante" value={data.nombreFirmante || "—"} />
        </dl>
        {data.firmaDigital && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Firma del cliente
            </p>
            <FirmaDigitalImage
              firmaRef={data.firmaDigital}
              alt={`Firma de ${data.nombreFirmante || data.nombre}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function CobroDetalleRows({
  cobroDetalle,
  precioRetiroLabel,
  precioBolsaExtraLabel,
  precioBolsaPuntoLabel,
  precioBolsaLlenaPuntoLabel,
}: {
  cobroDetalle: PrecioCobroDetalle;
  precioRetiroLabel: string;
  precioBolsaExtraLabel: string;
  precioBolsaPuntoLabel: string;
  precioBolsaLlenaPuntoLabel: string;
}) {
  return (
    <dl className="mb-4 space-y-2 text-sm">
      {cobroDetalle.regla === "empresa_punto" ? (
        <>
          <ReadOnlyRow
            label="Precio bolsa llena hogar"
            value={precioBolsaLlenaPuntoLabel}
          />
          {cobroDetalle.bolsaLlenaPuntoDetalleLabel && (
            <ReadOnlyRow
              label="Cargo bolsas llenas hogar"
              value={`${cobroDetalle.bolsaLlenaPuntoDetalleLabel} = ${cobroDetalle.montoBolsaLlenaPuntoLabel}`}
            />
          )}
          <ReadOnlyRow label="Precio bolsa punto" value={precioBolsaPuntoLabel} />
          {cobroDetalle.bolsaPuntoDetalleLabel && (
            <ReadOnlyRow
              label="Cargo bolsas nuevas vendidas"
              value={`${cobroDetalle.bolsaPuntoDetalleLabel} = ${cobroDetalle.montoBolsaPuntoLabel}`}
            />
          )}
        </>
      ) : cobroDetalle.regla === "empresa" ? (
        <ReadOnlyRow label="Precio de retiro (planilla)" value={precioRetiroLabel} />
      ) : cobroDetalle.regla === "mixto" ? (
        <>
          {cobroDetalle.bolsasLlenas === 0 ? (
            <ReadOnlyRow label="Precio de retiro (planilla)" value={precioRetiroLabel} />
          ) : (
            <>
              <ReadOnlyRow
                label="Retiro reciclable mixto"
                value={cobroDetalle.montoRetiroMixtoLabel}
              />
              <ReadOnlyRow
                label="Incluye"
                value="Hasta 2 bolsas llenas (mismo total con 1 o 2)"
              />
              {cobroDetalle.bolsasExtra > 0 && (
                <>
                  <ReadOnlyRow label="Bolsa extra" value={precioBolsaExtraLabel} />
                  <ReadOnlyRow
                    label="Cargo bolsa extra"
                    value={`${cobroDetalle.bolsaExtraDetalleLabel} = ${cobroDetalle.montoBolsaExtraLabel}`}
                  />
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <ReadOnlyRow label="Precio de retiro" value={precioRetiroLabel} />
          {cobroDetalle.bolsasExtra > 0 && (
            <>
              <ReadOnlyRow label="Bolsa extra" value={precioBolsaExtraLabel} />
              <ReadOnlyRow
                label="Cargo bolsa extra"
                value={`${cobroDetalle.bolsaExtraDetalleLabel} = ${cobroDetalle.montoBolsaExtraLabel}`}
              />
            </>
          )}
        </>
      )}
      <ReadOnlyRow label="Precio total a cobrar" value={cobroDetalle.precioTotalLabel} />
    </dl>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function parsePaymentValue(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="1"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (value.trim() === "") onChange("0");
        }}
        className={inputClass}
      />
    </label>
  );
}
