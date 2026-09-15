-- Paradas logísticas (Proveedor / Cooperativa): categoría + cantidades dejó/retiró.
-- No hay cobro; firma/cancelación siguen en columnas existentes.

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS categoria_parada TEXT NOT NULL DEFAULT 'cliente',
ADD COLUMN IF NOT EXISTS cestos_dejo INT,
ADD COLUMN IF NOT EXISTS cestos_retiro INT,
ADD COLUMN IF NOT EXISTS biotachos_dejo INT,
ADD COLUMN IF NOT EXISTS biotachos_retiro INT;

ALTER TABLE public.ruta_recolecciones
DROP CONSTRAINT IF EXISTS ruta_recolecciones_categoria_parada_check;

ALTER TABLE public.ruta_recolecciones
ADD CONSTRAINT ruta_recolecciones_categoria_parada_check
CHECK (categoria_parada IN ('cliente', 'logistica'));

-- Backfill por tipo de planilla (por si ya hubiera filas con esos valores).
UPDATE public.ruta_recolecciones
SET categoria_parada = 'logistica'
WHERE lower(trim(tipo_servicio)) IN ('proveedor', 'cooperativa');

NOTIFY pgrst, 'reload schema';
