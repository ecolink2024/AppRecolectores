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

-- 20260818120000_ruta_descarga_detalle.sql
ALTER TABLE public.rutas
ADD COLUMN IF NOT EXISTS descarga_detalle TEXT;

-- 20260915140000_ruta_recoleccion_logistica.sql
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

UPDATE public.ruta_recolecciones
SET categoria_parada = 'logistica'
WHERE lower(trim(tipo_servicio)) IN ('proveedor', 'cooperativa');

-- 20260922120000_punto_pagos.sql
CREATE TABLE IF NOT EXISTS public.punto_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL,
  telefono_normalizado TEXT NOT NULL,
  servicio TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
  monto NUMERIC NOT NULL CHECK (monto >= 0),
  recoleccion_id UUID REFERENCES public.ruta_recolecciones (id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.punto_pagos
DROP CONSTRAINT IF EXISTS punto_pagos_servicio_check;

ALTER TABLE public.punto_pagos
ADD CONSTRAINT punto_pagos_servicio_check
CHECK (servicio IN ('bolsas_llenas_regalo', 'bolsa_nueva', 'propia_punto'));

CREATE INDEX IF NOT EXISTS punto_pagos_fecha_idx ON public.punto_pagos (fecha DESC);
CREATE INDEX IF NOT EXISTS punto_pagos_telefono_idx ON public.punto_pagos (telefono_normalizado);

ALTER TABLE public.punto_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS punto_pagos_staff_select ON public.punto_pagos;
CREATE POLICY punto_pagos_staff_select ON public.punto_pagos
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS punto_pagos_staff_insert ON public.punto_pagos;
CREATE POLICY punto_pagos_staff_insert ON public.punto_pagos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

NOTIFY pgrst, 'reload schema';
