-- Pegar en Supabase → SQL Editor (idempotente, seguro re-ejecutar)
-- Equivalente a: node scripts/apply-pending-migrations.mjs

-- 20260524140000_fix_missing_operativo_columns.sql
ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS km_recorridos NUMERIC,
ADD COLUMN IF NOT EXISTS inicio_jornada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_recolector_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_operario_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cierre_operario_por UUID REFERENCES public.profiles (id),
ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC,
ADD COLUMN IF NOT EXISTS monto_transferencia NUMERIC,
ADD COLUMN IF NOT EXISTS observaciones_operario TEXT;

ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS hora_real TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS precio_total NUMERIC,
ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC,
ADD COLUMN IF NOT EXISTS monto_transferencia NUMERIC,
ADD COLUMN IF NOT EXISTS detalle TEXT,
ADD COLUMN IF NOT EXISTS firma_digital TEXT,
ADD COLUMN IF NOT EXISTS nombre_firmante TEXT;

-- 20260524130000_recoleccion_campo_campos.sql
ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT,
ADD COLUMN IF NOT EXISTS bolsas_llenas INT,
ADD COLUMN IF NOT EXISTS biotachos_llenos INT,
ADD COLUMN IF NOT EXISTS bolsas_nuevas INT,
ADD COLUMN IF NOT EXISTS biotachos_nuevos INT,
ADD COLUMN IF NOT EXISTS monto_qr NUMERIC;

-- 20260603120000_recoleccion_empresa_punto_campos.sql
ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS bolsas_llenas_punto INTEGER,
ADD COLUMN IF NOT EXISTS bolsas_nuevas_vendidas INTEGER;

-- 20260604120000_rutas_insumos_operario.sql
ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS insumos_operario JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS insumos_operario_at TIMESTAMPTZ;

-- 20260606120000_recoleccion_observaciones_recolector.sql
ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS observaciones_recolector TEXT;

-- 20260607120000_recoleccion_cesto_campo.sql
ALTER TABLE public.ruta_recolecciones
ADD COLUMN IF NOT EXISTS cestos INT;

NOTIFY pgrst, 'reload schema';
