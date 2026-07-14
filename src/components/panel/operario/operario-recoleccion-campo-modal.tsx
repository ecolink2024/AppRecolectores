"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FirmaCanvas, type FirmaCanvasRef } from "@/components/panel/firma-canvas";
import { FirmaDigitalImage } from "@/components/panel/firma-digital-image";
import type { RecoleccionOperarioRow } from "@/lib/domain/operario-dashboard";
import {
  getRecoleccionCampoContadoresRules,
  parsePrecioRetiro,
} from "@/lib/domain/recolector-recoleccion-campo";
import {
  buildPrecioCobroDetalle,
  formatParametroMoney,
  isEmpresaPuntoCobro,
} from "@/lib/domain/sistema-parametros";

export type PreciosCampoActivos = {
  bolsaExtra: number;
  retiroReciclableMixto: number;
  bolsaPunto: number;
  bolsaLlenaPunto: number;
};

type Props = {
  open: boolean;
  rutaId: string | null;
  recoleccion: RecoleccionOperarioRow | null;
  precios: PreciosCampoActivos;
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function countToString(value: number | null): string {
  return value != null ? String(value) : "";
}

function moneyToString(value: number | null): string {
  return value != null ? String(value) : "0";
}

export function OperarioRecoleccionCampoModal({
  open,
  rutaId,
  recoleccion,
  precios,
  onClose,
  onSaved,
}: Props) {
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [bolsasLlenas, setBolsasLlenas] = useState("");
  const [bolsasLlenasPunto, setBolsasLlenasPunto] = useState("");
  const [bolsasNuevasVendidas, setBolsasNuevasVendidas] = useState("");
  const [biotachosLlenos, setBiotachosLlenos] = useState("");
  const [bolsasNuevas, setBolsasNuevas] = useState("");
  const [biotachosNuevos, setBiotachosNuevos] = useState("");
  const [cestos, setCestos] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("0");
  const [montoTransferencia, setMontoTransferencia] = useState("0");
  const [montoQr, setMontoQr] = useState("0");
  const [nombreFirmante, setNombreFirmante] = useState("");
  const [observacionesRecolector, setObservacionesRecolector] = useState("");
  const [reemplazarFirma, setReemplazarFirma] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firmaCanvasRef = useRef<FirmaCanvasRef>(null);

  useEffect(() => {
    if (!open || !recoleccion) return;
    setMotivoCancelacion(recoleccion.motivo_cancelacion ?? recoleccion.detalle ?? "");
    setBolsasLlenas(countToString(recoleccion.bolsas_llenas));
    setBolsasLlenasPunto(countToString(recoleccion.bolsas_llenas_punto));
    setBolsasNuevasVendidas(countToString(recoleccion.bolsas_nuevas_vendidas));
    setBiotachosLlenos(countToString(recoleccion.biotachos_llenos));
    setBolsasNuevas(countToString(recoleccion.bolsas_nuevas));
    setBiotachosNuevos(countToString(recoleccion.biotachos_nuevos));
    setCestos(countToString(recoleccion.cestos));
    setMontoEfectivo(moneyToString(recoleccion.monto_efectivo));
    setMontoTransferencia(moneyToString(recoleccion.monto_transferencia));
    setMontoQr(moneyToString(recoleccion.monto_qr));
    setNombreFirmante(recoleccion.nombre_firmante ?? "");
    setObservacionesRecolector(recoleccion.observaciones_recolector ?? "");
    setReemplazarFirma(false);
    setError(null);
  }, [open, recoleccion]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const esEmpresaPunto = recoleccion
    ? isEmpresaPuntoCobro(recoleccion.unidad, recoleccion.tipo_servicio)
    : false;
  const esCancelacion = motivoCancelacion.trim().length > 0;
  const contadoresRules = useMemo(
    () =>
      getRecoleccionCampoContadoresRules(
        recoleccion?.unidad ?? null,
        recoleccion?.tipo_servicio ?? null,
      ),
    [recoleccion?.unidad, recoleccion?.tipo_servicio],
  );

  const parseCount = (value: string) =>
    value.trim() === "" ? 0 : Number.parseInt(value, 10) || 0;
  const precioRetiro = recoleccion ? parsePrecioRetiro(recoleccion.precio_tarifa) : 0;
  const cobroDetalle = useMemo(
    () =>
      buildPrecioCobroDetalle({
        unidad: recoleccion?.unidad ?? null,
        tipoServicio: recoleccion?.tipo_servicio ?? null,
        precioRetiro,
        precioBolsaExtra: precios.bolsaExtra,
        precioRetiroReciclableMixto: precios.retiroReciclableMixto,
        precioBolsaPunto: precios.bolsaPunto,
        precioBolsaLlenaPunto: precios.bolsaLlenaPunto,
        bolsasLlenas: parseCount(bolsasLlenas),
        bolsasLlenasPunto: parseCount(bolsasLlenasPunto),
        bolsasNuevasVendidas: parseCount(bolsasNuevasVendidas),
      }),
    [
      recoleccion?.unidad,
      recoleccion?.tipo_servicio,
      precioRetiro,
      precios,
      bolsasLlenas,
      bolsasLlenasPunto,
      bolsasNuevasVendidas,
    ],
  );

  const tieneFirmaExistente = !!recoleccion?.firma_digital;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recoleccion || !rutaId) return;

    setSaving(true);
    setError(null);

    let firmaPng: string | null = null;
    if (reemplazarFirma) {
      if (!firmaCanvasRef.current || firmaCanvasRef.current.isEmpty()) {
        setError("Dibujá la nueva firma o cancelá el reemplazo");
        setSaving(false);
        return;
      }
      firmaPng = firmaCanvasRef.current.toDataURL();
    } else if (!tieneFirmaExistente) {
      setError("Esta parada no tiene firma. Activá “Reemplazar firma” y dibujá una.");
      setSaving(false);
      return;
    }

    if (!nombreFirmante.trim()) {
      setError("Completá el nombre del firmante");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      motivo_cancelacion: motivoCancelacion.trim() || null,
      bolsas_llenas: bolsasLlenas === "" ? null : Number.parseInt(bolsasLlenas, 10),
      bolsas_llenas_punto:
        bolsasLlenasPunto === "" ? null : Number.parseInt(bolsasLlenasPunto, 10),
      bolsas_nuevas_vendidas:
        bolsasNuevasVendidas === "" ? null : Number.parseInt(bolsasNuevasVendidas, 10),
      biotachos_llenos: biotachosLlenos === "" ? null : Number.parseInt(biotachosLlenos, 10),
      bolsas_nuevas: bolsasNuevas === "" ? null : Number.parseInt(bolsasNuevas, 10),
      biotachos_nuevos: biotachosNuevos === "" ? null : Number.parseInt(biotachosNuevos, 10),
      cestos: cestos === "" ? null : Number.parseInt(cestos, 10),
      monto_efectivo: montoEfectivo.trim() === "" ? 0 : Number(montoEfectivo.replace(",", ".")),
      monto_transferencia:
        montoTransferencia.trim() === "" ? 0 : Number(montoTransferencia.replace(",", ".")),
      monto_qr: montoQr.trim() === "" ? 0 : Number(montoQr.replace(",", ".")),
      nombre_firmante: nombreFirmante.trim(),
      observaciones_recolector: observacionesRecolector.trim() || null,
    };
    if (firmaPng) payload.firma_png = firmaPng;

    try {
      const response = await fetch(
        `/api/panel/rutas/${rutaId}/recolecciones/${recoleccion.id}/campo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo guardar la carga");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la carga");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !recoleccion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Editar carga del recolector
            </h2>
            <p className="text-sm text-zinc-500">
              Parada #{recoleccion.orden} · {recoleccion.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Motivo de cancelación
            </span>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Si lo completás, la parada queda cancelada (sin retiro ni cobro)"
              className={`${inputClass} min-h-[64px] resize-y`}
            />
          </label>

          {!esCancelacion && (
            <>
              <fieldset className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Retiro
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {contadoresRules.bolsasLlenasRequired && (
                    <NumberField
                      label={esEmpresaPunto ? "Bolsas llenas hogar" : "Bolsas llenas"}
                      value={bolsasLlenas}
                      onChange={setBolsasLlenas}
                      required={contadoresRules.bolsasLlenasRequired}
                    />
                  )}
                  {esEmpresaPunto && (
                    <>
                      <NumberField
                        label="Bolsas llenas punto"
                        value={bolsasLlenasPunto}
                        onChange={setBolsasLlenasPunto}
                        required
                      />
                      <NumberField
                        label="Bolsas nuevas vendidas"
                        value={bolsasNuevasVendidas}
                        onChange={setBolsasNuevasVendidas}
                        required
                      />
                    </>
                  )}
                  {contadoresRules.biotachosLlenosRequired && (
                    <NumberField
                      label="Biotachos llenos"
                      value={biotachosLlenos}
                      onChange={setBiotachosLlenos}
                      required={contadoresRules.biotachosLlenosRequired}
                    />
                  )}
                  {contadoresRules.bolsasNuevasRequired && (
                    <NumberField
                      label="Bolsas nuevas"
                      value={bolsasNuevas}
                      onChange={setBolsasNuevas}
                      required={contadoresRules.bolsasNuevasRequired}
                    />
                  )}
                  {contadoresRules.biotachosNuevosRequired && (
                    <NumberField
                      label="Biotachos nuevos"
                      value={biotachosNuevos}
                      onChange={setBiotachosNuevos}
                      required={contadoresRules.biotachosNuevosRequired}
                    />
                  )}
                  {contadoresRules.cestosRequired && (
                    <NumberField label="Cestos" value={cestos} onChange={setCestos} required />
                  )}
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Cobro
                </legend>
                <p className="mb-2 flex justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Precio total a cobrar</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {cobroDetalle.precioTotalLabel}
                  </span>
                </p>
                <p className="mb-3 text-xs text-zinc-500">
                  La suma de los tres montos no puede ser menor al total (puede ser mayor).
                  Referencia: Precio bolsa extra - Hogar {formatParametroMoney(precios.bolsaExtra)}.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <NumberField label="Efectivo" value={montoEfectivo} onChange={setMontoEfectivo} money />
                  <NumberField
                    label="Transferencia"
                    value={montoTransferencia}
                    onChange={setMontoTransferencia}
                    money
                  />
                  <NumberField label="QR" value={montoQr} onChange={setMontoQr} money />
                </div>
              </fieldset>
            </>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Observaciones del recolector
            </span>
            <textarea
              value={observacionesRecolector}
              onChange={(e) => setObservacionesRecolector(e.target.value)}
              className={`${inputClass} min-h-[56px] resize-y`}
            />
          </label>

          <div className="space-y-2">
            <label className="block space-y-1.5">
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

            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Firma</span>
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={reemplazarFirma}
                    onChange={(e) => setReemplazarFirma(e.target.checked)}
                  />
                  Reemplazar firma
                </label>
              </div>
              {reemplazarFirma ? (
                <div className="mt-2 space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => firmaCanvasRef.current?.clear()}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Limpiar
                    </button>
                  </div>
                  <FirmaCanvas ref={firmaCanvasRef} className="h-32 w-full" />
                </div>
              ) : tieneFirmaExistente ? (
                <div className="mt-2">
                  <FirmaDigitalImage
                    firmaRef={recoleccion.firma_digital}
                    alt={`Firma de ${recoleccion.nombre_firmante ?? recoleccion.nombre}`}
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Sin firma cargada. Activá “Reemplazar firma” para dibujar una.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar carga"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required = false,
  money = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  money?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="number"
        inputMode={money ? "decimal" : "numeric"}
        min="0"
        step="1"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (money && value.trim() === "") onChange("0");
        }}
        className={inputClass}
      />
    </label>
  );
}
