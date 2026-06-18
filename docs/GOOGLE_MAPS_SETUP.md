# Google Maps — Configuración paso a paso (App Recolectores)

Guía para activar el mapa del panel operario (**Ver mapa** en la tabla de rutas).

---

## Qué vas a obtener

| Variable | Dónde va | Para qué |
|----------|----------|----------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `.env.local` + Vercel | Mapa en el navegador |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | `.env.local` + Vercel (secreta) | Convertir dirección → lat/lng en el servidor |

**Recomendación:** usá **dos API keys distintas** (una pública, una de servidor).

---

## Parte 1 — Proyecto y facturación

### Paso 1. Entrar a Google Cloud

1. Abrí [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Iniciá sesión con la cuenta de Google de Ecolink (idealmente la misma que usa Sheets).

### Paso 2. Elegir o crear proyecto

1. Arriba, click en el selector de proyecto.
2. **Opción A:** reutilizá el proyecto donde ya tenés Sheets / Gmail.
3. **Opción B:** **Nuevo proyecto** → nombre: `App Recolectores` → **Crear**.

Anotá el nombre del proyecto; lo vas a usar para facturación y keys.

### Paso 3. Vincular facturación (obligatorio, pero no cobra solo por activar)

1. Menú ☰ → **Facturación** → [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. Si no hay cuenta de facturación:
   - **Crear cuenta de facturación**
   - Completá datos de la empresa y **tarjeta**
3. Volvé al proyecto y **vinculá** la cuenta de facturación al proyecto.

> **Importante:** tener tarjeta no implica cobro automático. Google factura solo si superás el uso gratis mensual (~10.000 mapas y ~10.000 geocodings/mes).

### Paso 4. Alertas de presupuesto (recomendado)

1. Menú ☰ → **Facturación** → **Presupuestos y alertas**
2. **Crear presupuesto**
3. Nombre: `App Recolectores Maps`
4. Proyectos: el que creaste/elegiste
5. Importe: **USD 5** (o USD 1 si querés ser más estricto)
6. Umbrales de alerta: **50 %, 90 %, 100 %**
7. Email: `somos@ecolink.com.ar`
8. **Finalizar**

Así recibís mail antes de cualquier cargo relevante.

---

## Parte 2 — Activar las APIs

### Paso 5. Maps JavaScript API

1. Menú ☰ → **APIs y servicios** → **Biblioteca**
2. Buscá: `Maps JavaScript API`
3. Abrila → **Habilitar**

### Paso 6. Geocoding API

1. En **Biblioteca**, buscá: `Geocoding API`
2. **Habilitar**

No hace falta activar Directions, Places ni otras por ahora.

---

## Parte 3 — Crear las API keys

Menú ☰ → **APIs y servicios** → **Credenciales**  
URL directa: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### Paso 7. Key del mapa (navegador / pública)

1. **+ Crear credenciales** → **Clave de API**
2. Se crea una key → click en el lápiz (**Editar clave**)
3. **Nombre:** `App Recolectores - Maps JS (browser)`
4. **Restricciones de aplicación** → **Referentes HTTP (sitios web)**
5. Agregá estos referentes (uno por línea):

```
http://localhost:3000/*
http://127.0.0.1:3000/*
https://app-recolectores.vercel.app/*
https://*.vercel.app/*
```

> **Importante:** estos referentes van en la key del **mapa** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`), no en la de geocoding. El `/*` al final es obligatorio para que funcione `/panel` y otras rutas.

6. **Restricciones de API** → **Restringir clave**
7. Marcá **solo:** `Maps JavaScript API`
8. **Guardar**
9. Copiá la key → será `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Paso 8. Key de geocoding (servidor / secreta)

1. **+ Crear credenciales** → **Clave de API**
2. **Editar clave**
3. **Nombre:** `App Recolectores - Geocoding (server)`
4. **Restricciones de aplicación:**
   - **Opción simple (desarrollo + Vercel):** dejá **Ninguna** temporalmente y restringí solo por API (paso 6). Cuando deployees, podés pasar a restricción por IP si Vercel te da IP fija (en serverless no suele haber IP fija; la restricción por API suele alcanzar).
   - **Opción más segura:** **Restricciones de API** estrictas (solo Geocoding) + la key **nunca** va al frontend (solo en Vercel env server-side).
5. **Restricciones de API** → **Restringir clave**
6. Marcá **solo:** `Geocoding API`
7. **Guardar**
8. Copiá la key → será `GOOGLE_MAPS_GEOCODING_API_KEY`

> **Nunca** subas esta key al repo ni la uses en código cliente.

---

## Parte 4 — Variables en la app

### Paso 9. Local (`.env.local`)

En la raíz del proyecto, agregá:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu_key_del_mapa
GOOGLE_MAPS_GEOCODING_API_KEY=AIza...tu_key_de_geocoding
```

Reiniciá el servidor de desarrollo:

```bash
npm run dev
```

### Paso 10. Producción (Vercel)

1. [https://vercel.com](https://vercel.com) → proyecto **App Recolectores**
2. **Settings** → **Environment Variables**
3. Agregá las dos variables (Production + Preview + Development):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | key del paso 7 |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | key del paso 8 |

4. **Save**
5. **Deployments** → último deploy → **⋯** → **Redeploy** (para que tome las variables)

---

## Parte 5 — Probar en la app

### Paso 11. Panel operario

1. Entrá como admin: `https://app-recolectores.vercel.app/panel` (o `http://localhost:3000/panel`)
2. En la tabla **Ruta** (scroll interno si hay muchas filas), el botón **Ver mapa** debe estar **habilitado** (azul, no gris).
3. Seleccioná una ruta y, si hace falta, desplazate dentro de la tabla para encontrarla.
4. Click en **Ver mapa** de una ruta que tenga recolecciones con dirección.

### Paso 12. Qué deberías ver

1. Popup **“Cargando mapa y ubicaciones…”**
2. El servidor geocodifica direcciones sin coordenadas (primera vez).
3. Mapa con **pins numerados** (color según zona).
4. Texto tipo: `3 punto(s) · 2 geocodificado(s) ahora`

### Paso 13. Si algo falla

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Botón **Ver mapa** gris | Falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Paso 9 / 10 |
| “Falta GOOGLE_MAPS_GEOCODING_API_KEY” | Falta key de servidor en Vercel | Paso 10 + redeploy |
| Mapa gris / “For development purposes only” | Facturación no vinculada | Paso 3 |
| Mapa gris / vacío con “1 punto(s)” arriba | **RefererNotAllowedMapError** — referentes HTTP mal configurados | Paso 7: agregá `http://localhost:3000/*` (con `/*`) a la key del mapa. Esperá 1–2 min y recargá con Ctrl+Shift+R |
| “This page can't load Google Maps correctly” | Key mal restringida | Revisá referentes HTTP (paso 7) |
| “REQUEST_DENIED” en geocoding | Geocoding API no habilitada o key restringida mal | Pasos 6 y 8 |
| “No hay puntos con ubicación” | Direcciones inválidas o geocoding falló | Revisá direcciones en la planilla |

### Paso 14. Ver uso en Google Cloud

1. **APIs y servicios** → **Panel**
2. Elegí **Maps JavaScript API** y **Geocoding API**
3. Mirá **Solicitudes** del mes → debería ser muy bajo con el botón bajo demanda.

---

## Resumen de costos (recordatorio)

| Servicio | Gratis / mes | Tu uso estimado |
|----------|--------------|-----------------|
| Dynamic Maps | 10.000 cargas | Decenas–cientos |
| Geocoding | 10.000 requests | Una vez por dirección nueva |

Con **Ver mapa** solo al click, lo normal es **USD 0/mes**.

---

## Checklist final

- [ ] Proyecto Google Cloud creado/elegido
- [ ] Facturación vinculada
- [ ] Presupuesto con alertas (USD 5)
- [ ] Maps JavaScript API habilitada
- [ ] Geocoding API habilitada
- [ ] Key browser (referentes HTTP + solo Maps JS)
- [ ] Key server (solo Geocoding)
- [ ] Variables en `.env.local`
- [ ] Variables en Vercel + redeploy
- [ ] Prueba: **Ver mapa** en `/panel`

Cuando completes un paso y quieras validar, decinos en cuál estás y lo revisamos juntos.
