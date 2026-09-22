# App Recolectores

Aplicación interna para intermediación logística entre generadores de materiales, cooperativas de transformación y operaciones de recolección.

## Stack

- **Frontend + API:** [Next.js](https://nextjs.org) 16, TypeScript, App Router
- **Base de datos:** PostgreSQL en [Supabase](https://supabase.com)
- **Deploy frontend/API:** [Vercel](https://vercel.com) (conectado vía GitHub)
- **Deploy datos:** proyecto Supabase en la nube

Documentación de arquitectura: [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md)

**Documentación principal:**

- [Guía para desarrolladores](./docs/GUIA_DESARROLLADORES.md) — onboarding técnico, APIs, migraciones, deploy
- [Manual de uso](./docs/MANUAL_USUARIO.md) — superadmin, operario y recolector (sin código)
- [Capacitación operario](./docs/CAPACITACION_OPERARIO.md) — día a día: planilla, Historial (Rutas y Puntos), pagos de punto, KPIs
- [Integración Google Sheets](./docs/SHEETS_INTEGRATION.md) — columnas, enums, Empresa + Punto

## Configuración local

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

En [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **Project Settings** → **API**:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (solo servidor, no commitear) |

### 2. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El panel **Estado de conexión** debe mostrar Supabase en verde cuando las variables son correctas.

### 3. Verificar API

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db/status
```

## Despliegue en Vercel

1. Subí el repo a GitHub.
2. En Vercel: **Add New Project** → importá el repo.
3. Framework: **Next.js** (detección automática).
4. **Environment Variables:** las mismas que en `.env.local` (incluí `SUPABASE_SERVICE_ROLE_KEY` solo para Production/Preview si la usás en API).
5. Deploy.

## Supabase CLI (opcional)

Para migraciones y tipos generados:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

## Estructura

```
src/
  app/api/          # Backend (Route Handlers)
  lib/supabase/     # Clientes Supabase
  types/            # domain + database
  components/
supabase/migrations/
```
