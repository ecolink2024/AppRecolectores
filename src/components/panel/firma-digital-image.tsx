"use client";

import { useEffect, useState } from "react";

import {
  esFirmaDigitalImagen,
  isLegacyFirmaPlaceholder,
} from "@/lib/domain/firma-digital";

type Props = {
  firmaRef: string | null | undefined;
  alt: string;
  className?: string;
};

export function FirmaDigitalImage({ firmaRef, alt, className = "" }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!firmaRef || !esFirmaDigitalImagen(firmaRef)) {
      setSrc(null);
      setError(false);
      return;
    }

    if (firmaRef.startsWith("data:image") || firmaRef.startsWith("http")) {
      setSrc(firmaRef);
      setError(false);
      return;
    }

    let cancelled = false;
    setSrc(null);
    setError(false);

    fetch(`/api/firmas/signed-url?ref=${encodeURIComponent(firmaRef)}`)
      .then(async (res) => {
        const body = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !body.url) {
          throw new Error(body.error ?? "No se pudo cargar la firma");
        }
        if (!cancelled) setSrc(body.url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [firmaRef]);

  if (!firmaRef) return null;

  if (isLegacyFirmaPlaceholder(firmaRef)) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        Firma confirmada (sin imagen)
      </p>
    );
  }

  if (!esFirmaDigitalImagen(firmaRef)) return null;

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        No se pudo cargar la imagen de la firma.
      </p>
    );
  }

  if (!src) {
    return (
      <div
        className={`h-32 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`max-h-40 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 ${className}`}
    />
  );
}
