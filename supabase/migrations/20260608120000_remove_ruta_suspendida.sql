-- Normalizar rutas suspendidas (funcionalidad removida) antes de dejar de usarlas en la app.
UPDATE public.rutas
SET estado = CASE
  WHEN inicio_jornada_at IS NOT NULL THEN 'en_curso'::public.ruta_estado
  ELSE 'activa'::public.ruta_estado
END
WHERE estado = 'suspendida';
