# Guía para desarrolladores — App Recolectores

Documentación de onboarding técnico para quien se sume al proyecto. Cubre stack, entorno local, base de datos, arquitectura, APIs y despliegue.

**Producción:** https://app-recolectores.vercel.app  
**Manual de uso (no técnico):** [MANUAL_USUARIO.md](./MANUAL_USUARIO.md)

**Cambios recientes (jun 2026):** **Operativo vs Historial** (`completada` en historial al finalizar recolector); **reactivar** (`DELETE .../reactivar`) y **cierre operario** solo en Historial; **editar carga del recolector** desde el panel en rutas Realizadas (`PATCH .../campo`, `puedeEditarCargaStaff`); eliminación de **suspendida** (`20260608120000`); KPIs **solo historial** (`RUTA_ESTADOS_HISTORIAL`, `pendientesCierre`); **Preparación de insumos**; tablas operario con scroll; **Ver detalle**; **Obs. recolector** y **cestos**; tipo **Punto**; Maps con GPS; firmas en Storage; WhatsApp **Avisar**; **dos montos** en rutas/KPIs; gráfico mensual dual; `force-dynamic` en `/panel/kpis`; `revalidatePath` al eliminar ruta.

---

## 1. Qué es esta app

App interna de **Ecolink** para operaciones de recolección en campo:

- Importar rutas y paradas desde **Google Sheets**
- Gestionar rutas y recolecciones desde el **panel operario** (admin / superadmin)
- Ejecutar la jornada desde el **panel recolector** (mobile-first): inicio de ruta, navegación, carga por parada

### Stack

| Capa | Tecnología |
|------|------------|
| Frontend + API | Next.js 16, React 19, TypeScript, App Router, Tailwind CSS 4 |
| Base de datos + Auth | Supabase (PostgreSQL + Auth) |
| Deploy app | Vercel (conectado a GitHub) |
| Planillas | Google Sheets + Apps Script |
| Mapas (operario) | Google Maps JavaScript API + Geocoding API |

---

## 2. Primeros pasos (15 minutos)

### Clonar e instalar

```bash
git clone https://github.com/ecolink2024/AppRecolectores.git
cd AppRecolectores
cp .env.example .env.local
npm install
npm run dev
```

Abrí http://localhost:3000. La home muestra el **estado de conexión** con Supabase.

### Verificar que todo responde

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db/status
```

### Variables de entorno obligatorias

En `.env.local` (ver `.env.example`):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de servidor — **nunca commitear** |
| `NEXT_PUBLIC_SITE_URL` | URL base para enlaces de auth (`http://localhost:3000` en local) |

### Variables opcionales (según feature)

| Variable | Para qué |
|----------|----------|
| `SHEETS_IMPORT_SECRET` | Importación desde Google Sheets |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa en panel operario (navegador) |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Geocodificación en servidor |
| `GMAIL_*` o `SMTP_*` | Envío de correos (invitaciones, reset de contraseña) |
| `SUPABASE_DB_URL` | Script `scripts/apply-pending-migrations.mjs` |

Guías detalladas:

- Auth: [SETUP_AUTH.md](./SETUP_AUTH.md)
- Email: [SETUP_EMAIL.md](./SETUP_EMAIL.md)
- Sheets: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)
- Maps: [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

---

## 3. Base de datos y migraciones

### Modelo principal (operativo actual)

```
rutas
  └── ruta_recolecciones (paradas / clientes)
profiles (usuarios con rol)
sistema_precio_historial (parámetros de precio con vigencia)
```

Una **ruta** se agrupa por `(fecha, turno, recolector)`. Cada fila de la planilla es una **recolección**, única por teléfono normalizado dentro de la ruta.

**Turnos** (derivados de la columna `Hora` en planilla): **mañana** 8:30–13:30, **tarde** 14:30–20:30. Lógica centralizada en `src/lib/domain/ruta-turno.ts` (`turnoFromHoraParts`, `parseHora` en validación de import).

Tablas legacy (`organizaciones`, `recolecciones`) existen en migraciones tempranas pero el flujo operativo actual usa `rutas` + `ruta_recolecciones`.

### Almacenamiento en `ruta_recolecciones`

No hay tabla separada por tipo de cliente ni enum PostgreSQL para Unidad/Tipo: todo va en **columnas `TEXT` / `INT` / `NUMERIC`** de `ruta_recolecciones`. La regla de cobro (estándar, mixto, empresa, empresa_punto) se **resuelve en código** leyendo `unidad` + `tipo_servicio` (`resolvePrecioCobroRegla` en `sistema-parametros.ts`).

#### Origen de los datos

| Origen | Qué escribe | Validación |
|--------|-------------|------------|
| Google Sheets → import | `unidad`, `tipo_servicio`, `precio`, etc. | `sheet-recoleccion-validation.ts` → valores canónicos |
| Panel operario (alta/edición) | Mismas columnas | `operario-crud.ts` + `parseTipoServicio()` |
| Recolector (carga en campo) | Contadores retiro, pagos, firma, obs. recolector | `parseRecoleccionCampoBody()` → `PATCH .../campo` |

Valores canónicos guardados (texto exacto):

| Concepto | Columna DB | Valores válidos (código) |
|----------|------------|---------------------------|
| Unidad | `unidad` | `Hogar`, `Empresa`, `Puntos` |
| Tipo de cliente | `tipo_servicio` | `Reciclaje`, `Mixto`, `Organico`, `Punto` |

`parseTipoServicio()` normaliza alias (`punto`, `puntos`, acentos) → **`Punto`** al importar o editar.

> **No confundir:** Unidad **`Puntos`** (plural) ≠ tipo **`Punto`** (singular). Empresa + Punto = `unidad = 'Empresa'` **y** `tipo_servicio = 'Punto'`.

#### Columnas por fase (resumen)

**Planilla / operario (identificación del cliente):**

| Columna | Tipo | Ejemplo Empresa + Punto |
|---------|------|-------------------------|
| `unidad` | TEXT | `Empresa` |
| `tipo_servicio` | TEXT | `Punto` |
| `precio` | TEXT | `15000` (retiro planilla; **no** entra al total automático en regla `empresa_punto`) |
| `observaciones` | TEXT | Notas de planilla / operario |
| `nombre`, `direccion`, `telefono`, `hora`, … | — | Datos del cliente |

**Recolector (después de visitar, `estado_operativo = visitada`):**

| Columna | Tipo | Rol Empresa + Punto |
|---------|------|---------------------|
| `bolsas_llenas` | INT | Bolsas llenas **hogar** → **sí** entra al `precio_total` |
| `bolsas_llenas_punto` | INT | Bolsas llenas **punto** → solo registro; **no** suma al total automático |
| `bolsas_nuevas_vendidas` | INT | Bolsas nuevas vendidas → **sí** entra al `precio_total` |
| `bolsas_nuevas`, `biotachos_llenos`, `biotachos_nuevos`, `cestos` | INT | Retiro general (como otras unidades) |
| `precio_total` | NUMERIC | Calculado al guardar campo |
| `monto_efectivo`, `monto_transferencia`, `monto_qr` | NUMERIC | Recaudación declarada |
| `observaciones_recolector` | TEXT | Notas del recolector (≠ `observaciones`) |
| `firma_digital`, `nombre_firmante`, `hora_real` | — | Cierre de la parada |

**Precios unitarios (no van en la parada):** tabla `sistema_precio_historial`, claves `bolsa_llena_punto` y `bolsa_punto` (vigencia activa = `vigencia_hasta IS NULL`).

Fórmula `empresa_punto` al guardar:

```
precio_total = bolsas_llenas × bolsa_llena_punto + bolsas_nuevas_vendidas × bolsa_punto
```

Consulta SQL de ejemplo:

```sql
SELECT id, nombre, unidad, tipo_servicio, precio,
       bolsas_llenas, bolsas_llenas_punto, bolsas_nuevas_vendidas,
       precio_total, monto_efectivo, monto_transferencia, monto_qr
FROM ruta_recolecciones
WHERE unidad = 'Empresa'
  AND lower(trim(tipo_servicio)) IN ('punto', 'puntos');
```

Implementación: `isEmpresaPuntoCobro()`, `calcPrecioEmpresaPunto()` en `src/lib/domain/sistema-parametros.ts`.

### Aplicar migraciones

**Opción A — Supabase CLI (recomendada):**

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

**Opción B — Script del repo:**

```bash
# Agregar SUPABASE_DB_URL en .env.local (Connection string URI del dashboard)
node scripts/apply-pending-migrations.mjs
```

**Opción C — SQL Editor:** copiar el SQL que imprime el script anterior, o ejecutar archivos de `supabase/migrations/` en orden.

### Migraciones (orden cronológico)

| Archivo | Qué hace |
|---------|----------|
| `20260519150000_auth_roles.sql` | Roles, perfiles, trigger de auth |
| `20260519160000_auth_roles_idempotent.sql` | Versión idempotente del anterior |
| `20260520120000_domain_recolecciones.sql` | Tablas legacy organizaciones/recolecciones |
| `20260521120000_rutas_sheets_import.sql` | Tabla `rutas` + import Sheets |
| `20260522120000_rutas_recolecciones_full.sql` | `ruta_recolecciones` completa, turnos, estados operativos |
| `20260522130000_rutas_recolecciones_telefono_not_null.sql` | Teléfono obligatorio |
| `20260523120000_rutas_operativo_campos.sql` | Cierre jornada, km, cobros, firma |
| `20260524120000_rutas_inicio_insumos.sql` | Km inicial + insumos al iniciar ruta |
| `20260524130000_recoleccion_campo_campos.sql` | Bolsas, biotachos, QR, cancelación |
| `20260524140000_fix_missing_operativo_columns.sql` | Reparación idempotente + reload schema PostgREST |
| `20260525120000_sistema_parametros_precio.sql` | Tabla `sistema_precio_historial` (precio bolsa extra vigente) |
| `20260526120000_ruta_estado_suspendida.sql` | Estado `suspendida` en enum (legacy; normalizado por `20260608120000`) |
| `20260531120000_ruta_cierre_recolector_campos.sql` | Campos de cierre: km final, descarga, gastos, total efectivo, observaciones recolector |
| `20260601120000_ruta_estado_terminada.sql` | Estado `cerrada` en enum `ruta_estado` (cierre operario → Historial) |
| `20260602120000_ruta_estado_terminada_a_cerrada.sql` | Renombra `terminada` → `cerrada` si existía; idempotente |
| `20260603120000_recoleccion_empresa_punto_campos.sql` | `bolsas_llenas_punto`, `bolsas_nuevas_vendidas` (Empresa + Punto) |
| `20260604120000_rutas_insumos_operario.sql` | `insumos_operario`, `insumos_operario_at` (preparación operario) |
| `20260606120000_recoleccion_observaciones_recolector.sql` | `observaciones_recolector` en `ruta_recolecciones` (notas del recolector al cargar parada) |
| `20260607120000_recoleccion_cesto_campo.sql` | `cestos` en `ruta_recolecciones` (cantidad retirada en campo) |
| `20260608120000_remove_ruta_suspendida.sql` | Normaliza rutas `suspendida` → `activa`/`en_curso`; funcionalidad suspendida removida de UI/API |

Columnas de **cierre operario** en `rutas` (desde `20260523120000` / `20260524140000`): `cierre_operario_at`, `cierre_operario_por`.

**SQL rápido (SQL Editor):** `supabase/apply-pending-operativo.sql` agrupa migraciones operativas pendientes (idempotente). Equivalente a `node scripts/apply-pending-migrations.mjs` cuando hay `SUPABASE_DB_URL`.

> **Importante:** si aparece `Could not find the '...' column in the schema cache`, ejecutá la migración faltante y/o el `NOTIFY pgrst, 'reload schema'` del archivo `20260524140000`.

### Primer superadmin

1. Crear usuario `somos@ecolink.com.ar` en Supabase Auth
2. El trigger crea el perfil con rol `superadmin`
3. Desactivar registro público en Supabase

Ver [SETUP_AUTH.md](./SETUP_AUTH.md).

---

## 4. Estructura del código

```
src/
  app/
    api/                    # Route Handlers (backend)
    auth/                   # Callback, confirmar invitación, cambiar contraseña
    login/
    panel/                  # UI autenticada
      historial/            # Rutas completada / cerrada / cancelada (staff)
      kpis/                 # Indicadores agregados (staff)
      mis-rutas/            # Recolector
      parametros/           # Parámetros de sistema (staff)
      usuarios/             # Gestión de usuarios
  components/
    admin/                  # Panel de usuarios
    auth/                   # Login, formularios auth
    panel/
      insumos-lista-editor.tsx   # Editor compartido de insumos (operario + recolector)
      operario/             # Dashboard staff (admin/superadmin)
      recolector/           # UI mobile campo
  lib/
    auth/                   # Sesión, permisos, constantes de rol
    data/                   # Fetchers server-side
    domain/                 # Lógica de negocio, validaciones, formatters
    integrations/           # Sheets, geocoding
    supabase/               # Clientes browser, server, admin, middleware
  types/
    database.ts             # Tipos generados de Supabase
supabase/migrations/
scripts/
docs/
```

### Convenciones

- **Lógica de negocio** en `src/lib/domain/` — validaciones, parsers, builders de DTOs
- **APIs privilegiadas** usan `createAdminClient()` (service role) con verificación de rol en código
- **UI operario** = desktop/tablet; **UI recolector** = mobile (`max-w-lg`, bottom nav, safe areas)
- Cambios mínimos y focalizados; seguir patrones existentes en cada carpeta

---

## 5. Roles y permisos

| Rol | Email típico | Panel principal |
|-----|--------------|-----------------|
| `superadmin` | `somos@ecolink.com.ar` (fijo) | Operativo + usuarios (admin y recolector) |
| `admin` | Cualquier interno | Operativo + usuarios (solo recolectores) |
| `recolector` | Email del campo | `/panel/mis-rutas` (mobile) |

Matriz resumida (`src/lib/auth/permissions.ts`):

| Acción | superadmin | admin | recolector |
|--------|:----------:|:-----:|:----------:|
| Panel operario (Operativo, Historial, KPIs) | ✅ | ✅ | ❌ |
| Crear admin | ✅ | ❌ | ❌ |
| Crear recolector | ✅ | ✅ | ❌ |
| Reset password admin | ✅ | ❌ | ❌ |
| Reset password recolector | ✅ | ✅ | ❌ |
| Iniciar ruta / carga en campo | ❌ | ❌ | ✅ (propias rutas) |

**Middleware** (`src/middleware.ts` → `src/lib/supabase/middleware.ts`): protege `/panel/*`, redirige recolectores logueados a `/panel/mis-rutas`.

---

## 6. Rutas de la aplicación

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/login` | Público | Inicio de sesión |
| `/panel` | Todos | Staff → dashboard operario. Recolector → home (Hoy / Última jornada) |
| `/panel` | superadmin, admin | **Operativo:** `borrador`, `activa`, `en_curso` |
| `/panel/historial` | superadmin, admin | **Historial:** `completada`, `cerrada`, `cancelada`; tablas ampliadas + export CSV; cierre operario / reactivar |
| `/panel/kpis` | superadmin, admin | KPIs por período (solo rutas historial; presets o `?desde=&hasta=`) + export CSV |
| `/panel/parametros` | superadmin, admin | Cuatro precios con historial (`operario-parametros-sistema.tsx`) |
| `/panel/usuarios` | superadmin, admin | Alta y gestión de usuarios |
| `/panel/mis-rutas` | recolector | Rutas asignadas (Activas / Completadas) |
| `/panel/mis-rutas/[id]` | recolector | Detalle de ruta + lista de paradas + botón **Finalizar ruta** |
| `/panel/mis-rutas/[id]/iniciar` | recolector | Formulario km + insumos |
| `/panel/mis-rutas/[id]/finalizar` | recolector | Formulario de cierre de ruta (km finales, gastos, observaciones) |
| `/panel/mis-rutas/[id]/recolecciones/[recoleccionId]` | recolector | Carga en campo por parada |

Aliases que redirigen: `/panel/rutas`, `/panel/recolecciones`, `/admin/usuarios` → rutas actuales.

---

## 7. APIs

### Salud y auth

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | Público |
| GET | `/api/db/status` | Público |
| POST | `/api/auth/session` | Público (tokens de invitación) |

### Admin / usuarios

| Método | Endpoint | Auth |
|--------|----------|------|
| GET/POST | `/api/admin/users` | superadmin, admin |
| POST | `/api/admin/users/[id]/reset-password` | según permisos |

### Panel operario (staff)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PATCH | `/api/panel/rutas/[id]` | Editar ruta |
| DELETE | `/api/panel/rutas/[id]` | Eliminar ruta (`revalidatePath` en `/panel`, `/panel/historial`, `/panel/kpis`) |
| DELETE | `/api/panel/rutas/[id]/reactivar` | Reactivar (`completada` → `en_curso`; limpia cierre recolector vía `limpiezaTrasReactivar()`) |
| POST | `/api/panel/rutas/[id]/cierre-operario` | Cierre operario (`completada` → `cerrada`; setea `cierre_operario_at` / `cierre_operario_por`) |
| PATCH | `/api/panel/rutas/[id]/recolecciones/[recoleccionId]/campo` | Staff edita la carga de campo del recolector; solo `completada` (`puedeEditarCargaStaff`); reutiliza `parseRecoleccionCampoBody`; conserva firma salvo `firma_png` nuevo; `revalidatePath` panel/historial/kpis |
| POST | `/api/panel/rutas/[id]/recolecciones` | Agregar parada (bloqueado si ruta `completada` o `cerrada`) |
| PATCH | `/api/panel/rutas/[id]/recolecciones/[recoleccionId]` | Editar parada |
| DELETE | `/api/panel/rutas/[id]/recolecciones/[recoleccionId]` | Eliminar parada |
| PATCH | `/api/panel/rutas/[id]/recolecciones/reorden` | Reordenar (`{ orden: string[] }`) |
| GET | `/api/panel/rutas/[id]/mapa` | Paradas geocodificadas + `horaProgramada` para lista lateral |
| POST | `/api/panel/rutas/[id]/insumos-operario` | Guardar preparación de insumos (`{ insumos[] }`; bloqueado si ruta ya inició) |
| GET/POST | `/api/panel/parametros/[clave]` | Historial y alta de precio (`bolsa-extra`, `retiro-reciclable-mixto`, `bolsa-punto`, `bolsa-llena-punto`) |

### Recolector

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| POST | `/api/recolector/rutas/[id]/iniciar` | `{ km_inicial, insumos[] }` | Pasa ruta a `en_curso`; requiere `insumos_operario` completado |
| POST | `/api/recolector/rutas/[id]/finalizar` | ver cierre abajo | Cierra ruta (`completada`) si cumple condiciones |
| PATCH | `/api/recolector/rutas/[id]/recolecciones/[recoleccionId]/campo` | ver dominio | Carga retiro/cobro/firma |

Validación de carga en campo: `src/lib/domain/recolector-recoleccion-campo.ts`  
Validación inicio de ruta: `src/lib/domain/ruta-insumos.ts`  
Validación finalizar ruta: `src/lib/domain/recolector-finalizar-ruta.ts`  
Validación cierre de ruta: `src/lib/domain/recolector-cierre-ruta.ts`  
Precio total a cobrar (reglas Empresa / Mixto / estándar): `src/lib/domain/sistema-parametros.ts` (`calcPrecioTotalCobrarConReglas`, `buildPrecioCobroDetalle`)

### Integración Sheets

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/integrations/sheets/import-recolecciones` | `Bearer SHEETS_IMPORT_SECRET` |
| POST | `/api/integrations/sheets/import-recolecciones` | idem |

Script Apps Script: `scripts/google-apps-script/ImportarRuta.gs`  
Doc: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)

---

## 8. Flujos técnicos clave

### Importación Sheets → Supabase

1. Operario completa planilla Google Sheets (columnas documentadas en SHEETS_INTEGRATION)
2. Apps Script valida filas y POST a `/api/integrations/sheets/import-recolecciones`
3. API agrupa filas en rutas por `(Dia, turno derivado de Hora, email Recolector)`
4. Cada fila → `ruta_recolecciones` (única por teléfono normalizado)

### Panel operario

**Operativo** (`/panel`) y **Historial** (`/panel/historial`) comparten `operario-dashboard.tsx` con distinto conjunto de rutas:

- Operativo: `esRutaOperativa(estado)` — `borrador`, `activa`, `en_curso`
- Historial: `RUTA_ESTADOS_HISTORIAL` = `completada`, `cerrada`, `cancelada` (`ruta-estado-transiciones.ts`)

Componentes en `src/components/panel/operario/`:

| Componente | Función |
|------------|---------|
| `operario-dashboard.tsx` | Orquestador Operativo / Historial; cierre operario, export historial; subtítulo de sección Ruta con conteo |
| `operario-scrollable-table.tsx` | Contenedor reutilizable: `max-h` + `overflow-auto`, thead sticky (`OPERARIO_TABLE_HEAD_STICKY`), pie opcional con conteo de filas |
| `operario-rutas-table.tsx` | Tabla Operativo: recolecciones, exitosas, bolsas/biotachos, montos, insumos, **Ver detalle** |
| `operario-historial-rutas-table.tsx` | Tabla Historial: columnas ampliadas, insumos, **Editar / Reactivar / Cierre operario**; primeras columnas sticky en scroll horizontal |
| `operario-ruta-preparacion-insumos-modal.tsx` | Formulario obligatorio de insumos del operario (bloquea inicio del recolector) |
| `insumos-lista-editor.tsx` | Editor reutilizable de lista de insumos (operario + recolector) |
| `operario-ruta-detalle.tsx` | Contenido del modal de ruta (recaudación + desglose por unidad/tipo) |
| `operario-recolecciones-table.tsx` | Paradas en Operativo; botón **Ver detalle** por fila; scroll vertical acotado |
| `operario-recoleccion-detalle-modal.tsx` | Popup retiro (bolsas/biotachos) + recaudación (efectivo/transferencia/QR) |
| `operario-historial-recolecciones-table.tsx` | Paradas en Historial (columnas ampliadas; botón **Editar carga** en rutas Realizadas; scroll acotado) |
| `operario-recoleccion-campo-modal.tsx` | Modal staff para editar la carga del recolector (retiro/cobro/cancelación/firma) en rutas Realizadas |
| `operario-cliente-detalle-modal.tsx` | Popup datos del cliente desde Historial |
| `operario-ruta-map-modal.tsx` | Mapa + drag-and-drop reorder |
| `operario-mapa-recolecciones-list.tsx` | Lista lateral reordenable; muestra **hora programada** por parada |
| `operario-ruta-detalle-modal.tsx` | Detalle de ruta (solo consulta; acciones en tabla Historial) |
| `operario-kpis-dashboard.tsx` | Secciones KPI + gráfico recaudación |
| `operario-kpis-filtro-fechas.tsx` | Presets y rango `desde`/`hasta` → `/panel/kpis?...` |
| `operario-kpi-recaudacion-chart.tsx` | Gráfico barras **mensuales** (total precio + recaudado; ventana 12 meses) |
| `operario-kpi-por-zona-table.tsx` | Desglose por zona |
| Modales de edición de ruta y recolección | |
| `operario-parametros-sistema.tsx` | Orquesta secciones de precios (`PARAMETRO_PRECIO_ORDEN`) |
| `operario-parametro-precio-section.tsx` | Bloque reutilizable por parámetro (form + historial) |

Datos:

- `src/lib/data/operario-dashboard.ts` — Operativo / Historial (~200 rutas por vista)
- `src/lib/domain/operario-dashboard.ts` — filas de tabla, agregados de ruta y helpers de detalle:
  - `buildRutaOperarioRows()` — suma bolsas/biotachos visitadas, `monto_a_recaudar`, `total_recaudado` (efectivo + transferencia + QR)
  - `buildRutaDetalle()` + `buildRecoleccionesPorUnidadTipo()` — desglose exitosas / pendientes / canceladas por `(unidad, tipo_servicio)`
  - `buildRecoleccionOperarioDetalleCarga()` — retiro y cobro para modal de parada
  - `parseInsumosFromJson()`, `insumosOperarioCompletados()` — preparación operario (`ruta-insumos.ts`)
- `src/lib/domain/mapa-puntos.ts` — `MapaRecoleccionItem.horaProgramada`, `formatHoraProgramadaMapa()`
- `src/lib/data/operario-kpis.ts` — KPIs del período: rutas `.in("estado", RUTA_ESTADOS_HISTORIAL)` por `fecha` en rango, `.limit(5000)` + recolecciones
- `src/lib/data/operario-kpis-serie-mensual.ts` — serie mensual 48 meses (fetch independiente del filtro de fechas)

Dominio KPI: `src/lib/domain/operario-kpis.ts` (`resolveKpiFiltroFechas`, `buildOperarioKpis`, `buildSerieMensualRecaudacion`, `recaudadoPagosRecoleccion`, `totalPrecioRecoleccion`, constante `KPI_LABEL_SERVICIOS` = `"Recolecciones (servicios)"`).

Exportación CSV (cliente):

- `src/lib/domain/csv-download.ts` — `downloadCsvFile()` (UTF-8 BOM, `;` separador)
- `src/lib/domain/operario-kpis-export.ts` — filas del dashboard KPI
- `src/lib/domain/operario-historial-export.ts` — rutas + recolecciones del historial

Navegación staff: `panel-shell.tsx` — enlaces Operativo, KPIs, Historial, Parámetros, Usuarios. Middleware permite `/panel/historial` y `/panel/kpis` solo a staff.

#### Tablas con scroll (Operativo e Historial)

Objetivo: evitar que `/panel` y `/panel/historial` crezcan en altura sin límite cuando hay muchas rutas o paradas; mantener rutas arriba y recolecciones abajo visibles a la vez.

Implementación en `operario-scrollable-table.tsx`:

| Constante | Valor Tailwind | Uso |
|-----------|----------------|-----|
| `OPERARIO_SCROLL_RUTAS` | `max-h-[min(36vh,24rem)]` | Tablas de rutas (Operativo + Historial) |
| `OPERARIO_SCROLL_RECOLECCIONES` | `max-h-[min(44vh,28rem)]` | Tablas de paradas de la ruta seleccionada |
| `OPERARIO_TABLE_HEAD_STICKY` | `sticky top-0 z-10` + fondo | Encabezado visible al scroll vertical |

Consumidores: `operario-rutas-table.tsx`, `operario-recolecciones-table.tsx`, `operario-historial-rutas-table.tsx`, `operario-historial-recolecciones-table.tsx`. Pie de tabla: texto tipo `N rutas` o `N paradas · Desplazá para ver más` cuando hay más de ~10 filas.

Historial mantiene columnas sticky en horizontal (`operario-historial-rutas-table.tsx`: Fecha / Recolector / Turno) con `z-index` coordinado respecto al thead sticky.

#### Detalle de ruta (modal **Ver detalle**)

Archivos: `operario-ruta-detalle-modal.tsx` → `operario-ruta-detalle.tsx`; datos vía `buildRutaDetalle(ruta, recoleccionesDeLaRuta)`.

Secciones del popup:

1. Datos generales (fecha, turno, recolector, estado)
2. **Recolecciones exitosas** — total + filas `Unidad · Tipo de cliente → cantidad` (solo `visitada`)
3. **Recolecciones pendientes** — idem (`pendiente`, `en_camino`)
4. **Recolecciones canceladas** — idem (`cancelada`, `omitida`)
5. **Recaudación** — monto a recaudar, efectivo, transferencia, QR, total

Agrupación: `buildRecoleccionesPorUnidadTipo()` con clave `(unidad.trim() || "Sin unidad", tipo_servicio.trim() || "Sin tipo")`. Orden: mayor cantidad primero.

El modal es **solo consulta**; **Reactivar** y **Cierre operario** están en `operario-historial-rutas-table.tsx`.

#### Detalle de recolección (modal **Ver detalle** en tabla de paradas)

Solo en **Operativo** (`operario-recolecciones-table.tsx`). Estado local del modal en la tabla; no pasa por `operario-dashboard.tsx`.

- Botón habilitado si la parada está **visitada** o **cancelada** (`buildRecoleccionOperarioDetalleCarga().tieneCarga`)
- **Visitada:** bloques **Retiro** (bolsas llenas/nuevas, biotachos llenos/nuevos, **cestos**) y **Recaudación** (efectivo, transferencia, QR)
- **Cancelada:** motivo de cancelación
- **Pendiente / en camino:** botón deshabilitado

Helpers de formato: `formatCantidadBolsasDetalle`, `formatCantidadBiotachosDetalle`, `formatMoney`.

Helpers de formato: `formatCantidadBolsasDetalle`, `formatCantidadBiotachosDetalle`, `formatMoney`. Campo `cestos` como entero en el bloque Retiro.

#### Carga en campo (recolector)

`PATCH /api/recolector/rutas/[id]/recolecciones/[recoleccionId]/campo` — parser `parseRecoleccionCampoBody` en `recolector-recoleccion-campo.ts`.

| Campo body / DB | Notas |
|-----------------|-------|
| `bolsas_llenas`, `biotachos_llenos`, `bolsas_nuevas`, `biotachos_nuevos` | Contadores retiro; reglas según unidad/tipo |
| `bolsas_llenas_punto`, `bolsas_nuevas_vendidas` | Solo Empresa + Punto |
| `cestos` | Cantidad de cestos retirados (obligatorio al guardar visita; puede ser 0) |
| `observaciones_recolector` | Texto opcional del recolector (distinto de `observaciones` de planilla) |
| `monto_efectivo`, `monto_transferencia`, `monto_qr` | Recaudación |
| `firma_png` → `firma_digital` | Canvas → upload Storage `firmas-recoleccion` |

UI: `recolector-recoleccion-campo-form.tsx`. Tabla Operativo: columnas **Obs. recolector** y **Obs. operario** (`operario-recolecciones-table.tsx`).

#### Tipos de cliente (planilla y panel)

Constantes: `RECOLECCION_TIPOS_CLIENTE` y `RECOLECCION_TIPO_CLIENTE_LABELS` en `constants.ts` (reexportadas como `TIPOS_SERVICIO` en `sheet-recoleccion-validation.ts`).

Valores: Reciclaje, Mixto, Organico, **Punto**. Desplegable operario: `operario-recoleccion-form-modal.tsx`. Sheets: menú **Actualizar desplegable tipos de cliente** en `ImportarRuta.gs`.

#### Preparación de insumos (operario → recolector)

Columnas en `rutas`: `insumos_operario` (JSONB), `insumos_operario_at`.

- **API:** `POST /api/panel/rutas/[id]/insumos-operario` — staff; valida con `parseInsumosOperarioBody`; no editable si la ruta ya inició
- **Bloqueo recolector:** `insumosOperarioCompletados()` en `buildRecolectorRutaDetalle`, página `/iniciar` y `POST .../iniciar`
- **UI operario:** columna **Preparación** en `operario-rutas-table.tsx` → `operario-ruta-preparacion-insumos-modal.tsx`
- **UI recolector:** `Insumos asignados` en `recolector-ruta-detalle.tsx` cuando hay preparación guardada

Mismos tipos que inicio de jornada: `INSUMO_TIPOS` en `ruta-insumos.ts`. Editor compartido: `insumos-lista-editor.tsx`. Solo bloquea **Inicio de ruta** del recolector (Maps y detalle de ruta siguen disponibles).

#### Mapa operario (reorden de paradas)

- Modal **Ver mapa** → geocodifica vía `GET /api/panel/rutas/[id]/mapa`
- Lista lateral (`operario-mapa-recolecciones-list.tsx`): cada ticket muestra **hora programada** (`HH:MM`) junto al nombre — útil para ordenar la ruta
- Al soltar una fila, `PATCH .../recolecciones/reorden` persiste el nuevo orden

#### Columnas agregadas en tabla de rutas (Operativo e Historial)

Calculadas en `buildRutaOperarioRows()` desde paradas **visitadas**:

| Columna UI | Campo / lógica |
|------------|----------------|
| Recolecciones | Cantidad total de paradas de la ruta |
| Bolsas recolectadas | Suma `bolsas_llenas + bolsas_nuevas`; tooltip con detalle llenas/nuevas |
| Biotachos | Suma `biotachos_llenos + biotachos_nuevos`; tooltip |
| Monto a recaudar | `monto_a_recaudar` — Σ `precio_total` visitadas (= **monto total por servicios prestados** en KPIs) |
| Total recaudado | `total_recaudado` — Σ efectivo + transferencia + QR visitadas (= **monto real recaudado**; no solo efectivo de cierre de ruta) |
| Ver insumos | Declaración del recolector al **iniciar** jornada (`insumos_inicio` → `insumos_detalle`) |
| Preparación | `insumos_operario` — formulario obligatorio del operario antes del inicio |

Historial (`operario-historial-rutas-table.tsx`) incluye las mismas columnas de montos antes de «Después de gastos» / «Total efectivo». Export: `operario-historial-export.ts`.

### Parámetros de sistema

Ruta `/panel/parametros` (staff). Tabla `sistema_precio_historial` (migración `20260525120000`); una fila activa por `clave` (`vigencia_hasta IS NULL`).

| Slug API | Clave DB | Uso en app |
|----------|----------|------------|
| `bolsa-extra` | `bolsa_extra` | Cobro estándar y Mixto 3+ bolsas |
| `retiro-reciclable-mixto` | `retiro_reciclable_mixto` | Cobro Mixto (1–2 bolsas incluidas en un solo monto) |
| `bolsa-punto` | `bolsa_punto` | Cobro **Empresa + Punto**: × `bolsas_nuevas_vendidas` |
| `bolsa-llena-punto` | `bolsa_llena_punto` | Cobro **Empresa + Punto**: × `bolsas_llenas` (hogar) |

Constantes y UI: `PARAMETRO_PRECIO_SLUGS`, `PARAMETRO_PRECIO_ORDEN`, `PARAMETRO_PRECIO_UI` en `sistema-parametros.ts`.

- Alta: `POST /api/panel/parametros/[clave]` con `{ precio }` — cierra vigente anterior e inserta nueva fila
- Lectura activa: `fetchPrecioActivoByClave(clave)` o helpers (`fetchPrecioBolsaExtraActivo`, etc.)
- Página: `src/app/panel/parametros/page.tsx` carga historial de las cuatro claves en paralelo

### Reglas de cobro en campo (recolector)

Entrada: `PrecioCobroInput` (`unidad`, `tipoServicio`, `precioRetiro` de planilla, `precioBolsaExtra`, `precioRetiroReciclableMixto`, `bolsasLlenas`).

Resolución de regla (`resolvePrecioCobroRegla`): **Empresa** gana sobre Mixto si ambos aplican.

| Regla | Condición | Total |
|-------|-----------|-------|
| `empresa_punto` | `unidad === "Empresa"` y `tipo_servicio` Punto/Puntos | `bolsasLlenas × precioBolsaLlenaPunto + bolsasNuevasVendidas × precioBolsaPunto` (`bolsasLlenasPunto` no entra al total) |
| `empresa` | `unidad === "Empresa"` (sin Punto) | `precioRetiro` |
| `mixto` | `tipo_servicio === "Mixto"` | `0 bolsas` → `precioRetiro`; `1–2` → `precioRetiroReciclableMixto`; `3+` → mixto + `bolsaExtra × (bolsas−2)` |
| `estandar` | resto | `precioRetiro + bolsaExtra × max(0, bolsas−2)` |

Columnas DB (`20260603120000_recoleccion_empresa_punto_campos.sql`): `bolsas_llenas_punto` (solo registro), `bolsas_nuevas_vendidas`. Cobro automático usa `bolsas_llenas` (hogar).

Implementación: `calcPrecioTotalCobrarConReglas`, `buildPrecioCobroDetalle` en `sistema-parametros.ts`.

Consumidores:

- UI: `recolector-recoleccion-campo-form.tsx` (desglose y `ayudaCobro`)
- API: `parseRecoleccionCampoBody` en `recolector-recoleccion-campo.ts` — valida suma de pagos ≥ total
- Página: `mis-rutas/.../recoleccionId/page.tsx` — fetch `fetchPrecioBolsaExtraActivo` + `fetchPrecioRetiroReciclableMixtoActivo`
- PATCH: `api/recolector/.../campo/route.ts` — mismos precios en servidor

Enums de planilla (`sheet-recoleccion-validation.ts` / `constants.ts`): `UNIDADES` = Hogar, Empresa, Puntos; `RECOLECCION_TIPOS_CLIENTE` = Reciclaje, Mixto, Organico, Punto. `parseTipoServicio` acepta alias `Puntos` → Punto.

### Panel recolector

Componentes en `src/components/panel/recolector/`:

| Componente | Función |
|------------|---------|
| `recolector-shell.tsx` | Layout mobile + header + bottom nav |
| `mis-rutas-cards.tsx` | Listado agrupado por categoría (Activas / Completadas) |
| `recolector-ruta-detalle.tsx` | Detalle, **Maps** (ruta + por parada), **Avisar** (WhatsApp), lista de paradas, botón **Finalizar ruta** |
| `recolector-finalizar-ruta-form.tsx` | Formulario de cierre antes de finalizar |
| `recolector-inicio-ruta-form.tsx` | Km + insumos |
| `recolector-recoleccion-campo-form.tsx` | Carga por parada (desglose según regla empresa/mixto/estándar) |
| `recolector-recoleccion-sheet.tsx` | Preview read-only (ruta no iniciada); enlace **WhatsApp** por parada |

Dominio: `src/lib/domain/recolector-ruta.ts`, `recolector-recoleccion-form.ts`, `recolector-rutas-list.ts`, `ruta-estado-transiciones.ts`

**Estados de ruta:** `borrador`, `activa`, `en_curso`, `completada` (UI: Realizado), `cerrada`, `cancelada`

```
Operativo                          Historial
─────────                          ─────────
borrador, activa, en_curso         completada (recolector finaliza → historial)
                                   cerrada (POST cierre-operario)
                                   cancelada
         ↑ reactivar (DELETE .../reactivar) desde completada
```

Transiciones staff: `src/lib/domain/ruta-estado-transiciones.ts` (`esRutaOperativa`, `RUTA_ESTADOS_HISTORIAL`, `puedeReactivarRuta`, `puedeCierreOperario`, `limpiezaTrasReactivar`).

**Estados de parada:** `pendiente`, `en_camino`, `visitada`, `omitida`, `cancelada`

**Bloqueos recolector:** no editar carga si parada ya `visitada`/`cancelada`; no PATCH campo si ruta `completada`, `cerrada` o `cancelada` (API + UI read-only).

#### Finalizar ruta (recolector)

Condiciones previas (cliente y servidor en `recolector-finalizar-ruta.ts`):

1. Ruta en estado `en_curso` (o con `inicio_jornada_at` en columna o `metadata`)
2. Todas las paradas en `visitada` o `cancelada` (pendientes u omitidas bloquean)

Flujo:

1. Botón **Finalizar ruta** en detalle → navega a `/panel/mis-rutas/[id]/finalizar`
2. Formulario de cierre (`recolector-finalizar-ruta-form.tsx`)
3. `POST /api/recolector/rutas/[id]/finalizar` con body de cierre
4. Ruta pasa a `completada`, se guarda `cierre_recolector_at` y datos de cierre
5. UI redirige a `/panel`
6. Ruta visible en **Historial** del staff; **Cierre operario** → `cerrada` o **Reactivar** → `en_curso` (Operativo)

Body de cierre (`recolector-cierre-ruta.ts`):

```json
{
  "km_final": 45200,
  "descarga": true,
  "combustible": 0,
  "descuento": 0,
  "otros_gastos": 0,
  "total_efectivo": 15000,
  "observaciones_recolector": "Opcional"
}
```

Validaciones de cierre:

- `km_final` obligatorio; **≥ km_inicial**
- `combustible`, `descuento`, `otros_gastos`: ≥ 0
- Si **efectivo recaudado = 0**, no se permiten gastos
- Gastos no pueden superar el efectivo recaudado
- `total_efectivo = efectivo recaudado − combustible − descuento − otros_gastos`

Columnas en `rutas` (migración `20260531120000`): `km_final`, `descarga`, `combustible`, `descuento`, `otros_gastos`, `total_efectivo`, `observaciones_recolector`

#### Ruta iniciada (detección unificada)

Función `getInicioJornadaAt()` en `recolector-ruta.ts`:

- Lee `inicio_jornada_at` de columna **o** de `metadata.inicio_jornada_at`
- Una ruta se considera iniciada si `estado === "en_curso"` **o** existe inicio de jornada

Usada en detalle recolector, formulario de campo, API PATCH de carga y evaluación de finalizar.

#### Maps y WhatsApp (recolector)

| Archivo | Función |
|---------|---------|
| `src/lib/whatsapp.ts` | Mensaje de aviso, URL `wa.me`, lista de paradas con teléfono (`buildWhatsAppAvisosRecolecciones`) |
| `recolector-ruta.ts` | `buildDireccionesMapsActivas`, `buildGoogleMapsRecoleccionUrl`, `buildGoogleMapsDirectionsUrl` |
| `google-maps-open.ts` | `openGoogleMapsUrl` — pide GPS y arma `origin=lat,lng` |

**Maps (ruta):** `buildDireccionesMapsActivas` incluye todas las paradas abiertas (`pendiente`, `en_camino`) en orden de ruta. `buildGoogleMapsDirectionsUrl` arma la URL sin origen fijo; al abrir, `openGoogleMapsUrl` pide GPS del dispositivo y lo pasa como `origin=lat,lng` (si el usuario lo permite; si no, Maps usa la ubicación del dispositivo por defecto).

**Maps (parada):** `buildGoogleMapsRecoleccionUrl` — navegación a esa parada (`dir_action=navigate`) con el mismo flujo de GPS vía `openGoogleMapsUrl` en `recolector-ruta-detalle.tsx`.

**WhatsApp:** el botón **Avisar** abre chats en secuencia (WhatsApp no permite envío masivo real desde el navegador). Requiere ruta iniciada y teléfono en parada.

#### Reactivar y cierre operario (staff, Historial)

- **Reactivar:** `DELETE /api/panel/rutas/[id]/reactivar` desde `completada` → `en_curso`; aplica `limpiezaTrasReactivar()` (borra cierre recolector y gastos)
- **Cierre operario:** `POST .../cierre-operario` desde `completada` → `cerrada`; botón en `operario-historial-rutas-table.tsx`
- **Editar carga (staff):** `PATCH .../recolecciones/[recoleccionId]/campo` desde `completada` (`puedeEditarCargaStaff`); UI en `operario-recoleccion-campo-modal.tsx`, botón **Editar carga** por parada en `operario-historial-recolecciones-table.tsx`. Precios activos pasados desde `/panel/historial` → `OperarioDashboard preciosCampo`. Reutiliza `parseRecoleccionCampoBody`/`buildPrecioCobroDetalle`; la firma se conserva salvo que se envíe `firma_png` nuevo
- Recolector bloqueado en `completada`, `cerrada`, `cancelada`

#### KPIs (staff)

- Página: `src/app/panel/kpis/page.tsx` — `export const dynamic = "force-dynamic"`; query `periodo` | `desde` + `hasta`
- Fetch: `fetchOperarioKpisData()` — rutas `.in("estado", RUTA_ESTADOS_HISTORIAL)` filtradas por `rutas.fecha` en el período
- Filtro período: `resolveKpiFiltroFechas()` — presets `7d`, `30d`, `mes`, `90d` o rango `desde`/`hasta`
- Agregación: `buildOperarioKpis()` sobre esas rutas y sus `ruta_recolecciones`
- Serie mensual: `fetchSerieMensualRecaudacion()` — **48 meses**, mismo filtro historial; agrupado por mes de `rutas.fecha`; **no** usa el filtro Desde/Hasta del dashboard

**Dos montos** (solo paradas `visitada`):

| UI / CSV | Campo dominio | Helper |
|----------|---------------|--------|
| Monto total por servicios prestados | `finanzas.totalPrecio`, `monto_a_recaudar`, `KpiSerieMes.totalPrecio` | `totalPrecioRecoleccion()` |
| Monto real recaudado | `finanzas.total`, `total_recaudado`, `KpiSerieMes.recaudado` | `recaudadoPagosRecoleccion()` |

Otros criterios:

- **Rutas del período:** solo estados historial (`completada`, `cerrada`, `cancelada`)
- **Pendiente cierre:** cuenta `completada` (`rutas.pendientesCierre`; CSV: «Pendiente cierre operario»)
- **Rutas realizadas:** cuenta `completada` **y** `cerrada`
- **Ingresadas (recolecciones):** todas las paradas de esas rutas (cualquier estado de parada)
- **Bolsas por zona:** solo `bolsas_llenas` (no suma `bolsas_nuevas`)
- **Promedio por recolección:** `totalRecaudado ÷ exitosas`
- Gráfico: `operario-kpi-recaudacion-chart.tsx` — barras agrupadas azul/verde, ventana `KPI_RECAUDACION_MENSUAL_VENTANA` (12) con offset
- Invalidación: `DELETE /api/panel/rutas/[id]` hace `revalidatePath` de `/panel`, `/panel/historial`, `/panel/kpis`

Export: `operario-kpis-export.ts` — resumen del período + sección mensual con ambos montos.

#### Validación de pagos en campo

En `recolector-recoleccion-campo.ts`:

- Efectivo, transferencia y QR: obligatorios, mínimo 0 (default `"0"` en el form)
- Suma de los tres montos **≥ total a cobrar** (puede ser mayor, no menor)

#### Recolecciones manuales (operario)

Al crear/editar parada desde el panel (`operario-recoleccion-form-modal.tsx`), campos adicionales:

- `precio`, `deuda`, `frecuencia`, `tipo_servicio`, `unidad`

Parser: `parseRecoleccionFields()` en `operario-crud.ts`.

**Restricción:** no se puede **agregar** parada en ruta `completada` o `cerrada` (409 en API; botón deshabilitado en UI). La edición de datos de planilla de la parada (`PATCH .../recolecciones/[recoleccionId]`) no bloquea por estado. La **carga de campo** de una ruta `completada` se edita con `PATCH .../campo` (staff) o botón **Editar carga** en Historial; para agregar/quitar paradas de una `completada`, reactivar la ruta primero. En `cerrada`/`cancelada` la carga queda inmutable.

#### UX: botones deshabilitados

Cuando una acción está bloqueada, la UI debe mostrar **el motivo visible** (texto debajo del botón o recuadro informativo), no solo `disabled` o `title`. Ejemplos:

- Inicio de ruta sin preparación de insumos del operario
- Finalizar ruta sin km finales
- Gastos sin efectivo recaudado
- Agregar recolección en ruta finalizada

#### Fechas y timezone

Formateo de fechas/horas usa `timeZone: "America/Argentina/Buenos_Aires"` en:

- `formatInicioJornada()` (recolector)
- `formatDateTime()` / `formatHoraReal()` (operario)

El home del recolector (`/panel`) calcula “hoy” con timezone Argentina y muestra **Última jornada** si no hay rutas de hoy.

---

## 9. Scripts de mantenimiento

| Script | Uso |
|--------|-----|
| `scripts/apply-pending-migrations.mjs` | Aplicar migraciones operativas/recolector (requiere `SUPABASE_DB_URL`) |
| `supabase/apply-pending-operativo.sql` | Mismo contenido operativo para pegar en Supabase SQL Editor |
| `scripts/clear-rutas-recolecciones.mjs` | Borrar **todas** las rutas y recolecciones (`DELETE` en `rutas`; CASCADE en paradas). **No** toca usuarios, `profiles` ni `sistema_precio_historial`. Requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`. Las firmas PNG en Storage (`firmas-recoleccion`) **no** se borran solas: vaciá el bucket en Supabase → Storage si querés empezar de cero sin archivos huérfanos |
| `scripts/reset-superadmin-password.mjs` | Reset de contraseña del superadmin vía API |
| `scripts/reset-users-except-superadmin.mjs` | Borrar usuarios Auth (y perfiles en cascada) excepto `somos@ecolink.com.ar` |
| `scripts/google-apps-script/ImportarRuta.gs` | Menú en Google Sheets |

**Arranque operativo en blanco** (típico antes de producción): `node scripts/clear-rutas-recolecciones.mjs` + vaciar bucket `firmas-recoleccion` si hubo pruebas con firmas.

---

## 10. Despliegue

### Vercel

1. Push a GitHub → deploy automático
2. Configurar **las mismas variables** que `.env.local` en Vercel → Settings → Environment Variables
3. Incluir `SUPABASE_SERVICE_ROLE_KEY` en Production (y Preview si aplica)

### Supabase (post-deploy)

- **Authentication → URL Configuration:** agregar `https://app-recolectores.vercel.app/auth/callback` y `/auth/confirmar`
- Aplicar migraciones si el entorno remoto está desactualizado
- Verificar que el schema cache de PostgREST esté al día

### Google Cloud (mapas)

- Restricciones HTTP referrer para la key pública (localhost + dominio Vercel)
- Geocoding key restringida por IP del servidor
- Ver [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

---

## 11. Comandos útiles

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción (correr antes de PR)
npm run lint     # ESLint
npm run start    # Servidor de producción local
```

---

## 12. Checklist para un PR

- [ ] `npm run build` pasa sin errores
- [ ] Si hay cambios de schema: migración SQL en `supabase/migrations/` + tipos en `src/types/database.ts`
- [ ] Variables nuevas documentadas en `.env.example`
- [ ] Permisos verificados por rol (no confiar solo en ocultar botones en UI)
- [ ] Flujo recolector probado en viewport mobile (~390px)

---

## 13. Referencias rápidas

| Tema | Archivo |
|------|---------|
| Arquitectura general | [ARQUITECTURA.md](./ARQUITECTURA.md) |
| Manual de usuarios | [MANUAL_USUARIO.md](./MANUAL_USUARIO.md) |
| Tipos de DB | `src/types/database.ts` |
| Constantes de dominio | `src/lib/domain/constants.ts` |
| Finalizar ruta (dominio) | `src/lib/domain/recolector-finalizar-ruta.ts` |
| Cierre de ruta (dominio) | `src/lib/domain/recolector-cierre-ruta.ts` |
| Formulario cierre recolector | `src/components/panel/recolector/recolector-finalizar-ruta-form.tsx` |
| Estados ruta / historial / reactivar / editar carga | `src/lib/domain/ruta-estado-transiciones.ts` (`puedeEditarCargaStaff`) |
| Editar carga staff (API / modal) | `src/app/api/panel/rutas/[id]/recolecciones/[recoleccionId]/campo/route.ts`, `operario-recoleccion-campo-modal.tsx` |
| KPIs y filtros de fecha | `src/lib/domain/operario-kpis.ts` |
| Fetch KPIs (período) | `src/lib/data/operario-kpis.ts` |
| Serie mensual KPIs | `src/lib/data/operario-kpis-serie-mensual.ts` |
| Export CSV KPIs / Historial | `operario-kpis-export.ts`, `operario-historial-export.ts`, `csv-download.ts` |
| Cierre operario API | `src/app/api/panel/rutas/[id]/cierre-operario/route.ts` |
| Reactivar ruta API | `src/app/api/panel/rutas/[id]/reactivar/route.ts` |
| Tablas operario (scroll, thead sticky) | `src/components/panel/operario/operario-scrollable-table.tsx` |
| Carga campo recolector (dominio) | `src/lib/domain/recolector-recoleccion-campo.ts` |
| Tipos de cliente | `RECOLECCION_TIPOS_CLIENTE` en `src/lib/domain/constants.ts` |
| Listado recolector por categoría | `src/lib/domain/recolector-rutas-list.ts` |
| Precios de sistema (claves, slugs API) | `src/lib/domain/sistema-parametros.ts` |
| Fetch precio activo / historial | `src/lib/data/sistema-parametros.ts` |
| Cobro en campo (parse + reglas) | `src/lib/domain/recolector-recoleccion-campo.ts` |
| Empresa + Punto (reglas y precios) | `src/lib/domain/sistema-parametros.ts` (`isEmpresaPuntoCobro`, `calcPrecioEmpresaPunto`) |
| Formulario campo recolector | `src/lib/domain/recolector-recoleccion-form.ts` |
| Permisos | `src/lib/auth/permissions.ts` |

Si algo no está documentado aquí, buscá en `docs/` o en el código bajo `src/lib/domain/` — ahí vive la lógica de negocio explícita.
