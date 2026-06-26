"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type FirmaCanvasRef = {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
};

type Props = {
  disabled?: boolean;
  className?: string;
};

function setupContext(ctx: CanvasRenderingContext2D, ratio: number) {
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
}

export const FirmaCanvas = forwardRef<FirmaCanvasRef, Props>(function FirmaCanvas(
  { disabled = false, className = "" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasStrokeRef.current,
    toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasStrokeRef.current = false;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.floor(rect.width * ratio);
      const nextHeight = Math.floor(rect.height * ratio);

      // Asignar width/height al canvas lo borra siempre: evitar si no cambió el tamaño.
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      const snapshot =
        hasStrokeRef.current && canvas.width > 0 && canvas.height > 0
          ? canvas.toDataURL("image/png")
          : null;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setupContext(ctx, ratio);

      if (!snapshot) return;

      const img = new Image();
      img.onload = () => {
        const ctxAfter = canvas.getContext("2d");
        if (!ctxAfter) return;
        setupContext(ctxAfter, ratio);
        ctxAfter.drawImage(img, 0, 0, rect.width, rect.height);
        hasStrokeRef.current = true;
      };
      img.src = snapshot;
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    e.preventDefault();
    drawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function continueStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokeRef.current = true;
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (canvasRef.current?.hasPointerCapture(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label="Área de firma del cliente"
      className={`touch-none rounded-xl border border-dashed border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"} ${className}`}
      onPointerDown={startStroke}
      onPointerMove={continueStroke}
      onPointerUp={endStroke}
      onPointerLeave={endStroke}
      onPointerCancel={endStroke}
    />
  );
});
