# Manual de uso — App Recolectores

Guía para usuarios de la app **sin conocimientos de programación**. Explica qué puede hacer cada rol y cómo usar las pantallas del día a día.

**App en producción:** https://app-recolectores.vercel.app

---

## Índice

1. [Acceso a la app](#1-acceso-a-la-app)
2. [Roles: quién puede hacer qué](#2-roles-quién-puede-hacer-qué)
3. [Superadmin](#3-superadmin)
4. [Operario (admin)](#4-operario-admin)
5. [Recolector](#5-recolector)
6. [Planilla Google Sheets](#6-planilla-google-sheets)
7. [Problemas frecuentes](#7-problemas-frecuentes)

**Novedades recientes:** formulario de cierre al finalizar ruta, campos extra al agregar recolecciones, bloqueo en rutas finalizadas, mensajes visibles cuando una acción está deshabilitada.

---

## 1. Acceso a la app

### Ingresar

1. Abrí https://app-recolectores.vercel.app (o la URL que te haya dado el equipo)
2. Tocá **Iniciar sesión** o andá directo a `/login`
3. Escribí tu **correo** y **contraseña**
4. Al entrar, la app te lleva automáticamente a tu panel según tu rol:
   - **Recolector** → pantalla de rutas (mobile)
   - **Operario o Superadmin** → panel operativo (escritorio)

### Cambiar contraseña

- Si te crearon la cuenta con contraseña inicial, el superadmin puede enviarte un correo para cambiarla desde **Usuarios**
- El superadmin principal (`somos@ecolink.com.ar`) usa el flujo normal de “olvidé mi contraseña” de Supabase

### Salir

- En cualquier pantalla hay un botón **Salir** (arriba a la derecha)

---

## 2. Roles: quién puede hacer qué

| Función | Superadmin | Operario (admin) | Recolector |
|---------|:----------:|:----------------:|:----------:|
| Ver panel operativo (rutas, mapas, recolecciones) | ✅ | ✅ | ❌ |
| Configurar **precio de bolsa extra** | ✅ | ✅ | ❌ |
| Suspender / reactivar rutas | ✅ | ✅ | ❌ |
| Crear usuarios **operario** | ✅ | ❌ | ❌ |
| Crear usuarios **recolector** | ✅ | ✅ | ❌ |
| Cambiar contraseña de operarios | ✅ | ❌ | ❌ |
| Cambiar contraseña de recolectores | ✅ | ✅ | ❌ |
| Ver y ejecutar **mis rutas** en el celular | ❌ | ❌ | ✅ |
| Iniciar ruta, cargar paradas, cobrar, finalizar ruta | ❌ | ❌ | ✅ |

**Operario** y **Superadmin** comparten el mismo panel de seguimiento. La diferencia principal está en la **gestión de usuarios**.

---

## 3. Superadmin

El superadmin es la cuenta principal de administración (`somos@ecolink.com.ar`). Configura la app, crea operarios y recolectores, y supervisa todo el operativo.

### 3.1 Panel operativo

Al ingresar llegás a **Panel operativo** con dos secciones:

#### Tabla **Ruta**

Lista todas las rutas importadas o creadas. Cada fila muestra, entre otros datos:

- Fecha y turno (Mañana / Tarde)
- Recolector asignado
- Estado (Pendiente, En proceso, Realizado, Suspendida…)
- Cantidad de paradas
- Kilómetros, inicio/cierre de jornada, total recaudado

**Acciones por ruta:**

| Botón | Qué hace |
|-------|----------|
| Seleccionar fila | Muestra sus recolecciones abajo |
| **Ver detalle** | Resumen completo de la ruta (incluye **Suspender** o **Reactivar** según el estado) |
| **Ver mapa** | Mapa con direcciones geocodificadas |
| **Editar** | Cambiar nombre, fecha, turno, estado, recolector, observaciones |
| **Suspender** | Pausa la ruta: el recolector no puede operarla hasta reactivarla |
| **Eliminar** | Borra la ruta y todas sus paradas (acción irreversible) |

#### Tabla **Recolecciones**

Muestra las paradas de la **ruta seleccionada** arriba.

| Acción | Qué hace |
|--------|----------|
| **Editar** | Modificar datos de la parada (dirección, hora, precio, etc.) |
| **+ Agregar recolección** | Agregar una parada manual a la ruta (no disponible si la ruta ya está finalizada) |
| **Eliminar** | Quitar una parada |

### 3.2 Mapa y reorden de paradas

1. Seleccioná una ruta
2. Tocá **Ver mapa**
3. La app geocodifica direcciones que aún no tienen coordenadas (puede tardar unos segundos)
4. En el panel lateral podés **arrastrar** las paradas para cambiar el orden de visita
5. Al soltar, el nuevo orden se **guarda automáticamente**

Los marcadores se colorean por **zona** cuando está disponible.

### 3.4 Suspender y reactivar una ruta

Usá **Suspender** cuando una ruta no debe ejecutarse temporalmente (clima, vehículo, cambio de planificación, etc.).

**Suspender:**

1. En la tabla de rutas, tocá **Suspender** (solo visible si la ruta está pendiente o en proceso)
2. O abrí **Ver detalle** y tocá **Suspender ruta**
3. Confirmá la acción

**Qué pasa al suspender:**

- La ruta pasa a estado **Suspendida**
- El recolector la ve en la sección **Suspendidas** de Mis rutas
- No puede iniciarla, abrir Maps, cargar paradas ni finalizarla

**Reactivar:**

1. Abrí **Ver detalle** de una ruta suspendida
2. Tocá **Reactivar ruta** y confirmá
3. Vuelve a estar disponible para el recolector (como pendiente o en proceso, según si ya había iniciado la jornada)

### 3.5 Parámetros de sistema

Menú **Parámetros** (arriba) → `/panel/parametros`

Desde acá configurás el **precio de bolsa extra**, que usa el recolector al calcular cuánto cobrar en cada parada.

- Las **2 primeras bolsas llenas** están incluidas en el precio de retiro de la planilla
- A partir de la **3.ª bolsa llena**, se suma el precio de bolsa extra por cada una adicional
- Solo podés **agregar un precio nuevo** (no editar los anteriores); queda historial con fecha de vigencia
- El precio vigente se aplica automáticamente en la app del recolector

### 3.6 Gestión de usuarios

Menú **Usuarios** (arriba) → `/panel/usuarios`

**Crear un usuario:**

1. Completá correo, nombre, rol (Operario o Recolector) y contraseña inicial
2. Guardá
3. Compartí las credenciales de forma segura con la persona

**Cambiar contraseña de otro usuario:**

1. En la tabla de usuarios, tocá **Enviar correo para cambiar contraseña**
2. La persona recibe un enlace (si el correo está configurado) o copiá el enlace que muestra la app

**Límites del superadmin:**

- Puede crear operarios y recolectores
- Puede resetear contraseña de operarios y recolectores
- **No** puede cambiar la contraseña del superadmin desde este panel (usa recuperación por correo)

### 3.7 Tareas de configuración (una vez)

Estas tareas las hace normalmente el superadmin o alguien técnico al inicio:

| Tarea | Dónde |
|-------|-------|
| Crear cuenta superadmin en Supabase | Dashboard Supabase |
| Configurar planilla Google Sheets | Ver sección 6 |
| Configurar mapas de Google | Documentación técnica interna |
| Crear operarios y recolectores | Usuarios en la app |
| Definir precio de bolsa extra | Parámetros en la app |

---

## 4. Operario (admin)

El operario usa el **mismo panel operativo** que el superadmin para seguir rutas, editar paradas y ver mapas.

### 4.1 Día a día

1. **Ingresá** al panel operativo
2. Revisá la tabla de **Rutas** — filtrá mentalmente por fecha/recolector
3. **Seleccioná una ruta** para ver sus recolecciones
4. Si hace falta corregir datos → **Editar** ruta o recolección
5. Para planificar el recorrido → **Ver mapa** y reordenar paradas
6. Seguí el avance: estados de ruta y de cada parada se actualizan cuando el recolector carga en campo
7. Si hace falta pausar una jornada → **Suspender** la ruta
8. Revisá **Parámetros** cuando cambie el precio de bolsa extra

### 4.2 Suspender una ruta

Mismo flujo que superadmin (sección 3.4): botón **Suspender** en la tabla o en **Ver detalle**. Solo disponible en rutas pendientes o en proceso.

### 4.3 Parámetros de precio

Menú **Parámetros** → agregar nuevo **precio de bolsa extra** cuando el valor cambie. El historial queda registrado con fechas de vigencia.

### 4.4 Editar una ruta

Desde **Editar** en la tabla de rutas podés modificar:

- Nombre de la ruta
- Fecha
- Turno (Mañana / Tarde)
- Estado
- Recolector asignado
- Observaciones del operario
- Kilómetros recorridos (cuando corresponda)

También podés cambiar el estado manualmente desde **Editar** (incluido **Suspendida**), aunque lo recomendado es usar el botón **Suspender** / **Reactivar**.

### 4.5 Editar o agregar una recolección

Desde la tabla de recolecciones:

- **Editar:** cambiar dirección, cliente, hora, observaciones, teléfono, etc.
- **Agregar:** crear una parada nueva en la ruta seleccionada
- **Eliminar:** quitar una parada incorrecta

Al **crear** o **editar** una recolección manual, además de los datos básicos podés completar:

| Campo | Descripción |
|-------|-------------|
| **Tipo de servicio** | Tipo de retiro/servicio del cliente |
| **Unidad** | Unidad del servicio |
| **Frecuencia** | Frecuencia del servicio |
| **Precio** | Precio de retiro (base para el cobro en campo) |
| **Deuda** | Deuda pendiente del cliente, si aplica |

> **Rutas finalizadas:** no se pueden agregar recolecciones nuevas. El botón **+ Agregar recolección** queda deshabilitado y muestra el motivo.

### 4.6 Gestión de usuarios (solo recolectores)

El operario puede:

- ✅ Crear cuentas de **recolector**
- ✅ Enviar reset de contraseña a recolectores
- ❌ **No** puede crear otros operarios
- ❌ **No** puede resetear contraseñas de operarios

Menú **Usuarios** → mismo flujo que superadmin pero con rol Recolector únicamente.

---

## 5. Recolector

La interfaz del recolector está pensada para el **celular**: pantalla angosta, botones grandes, navegación inferior.

### 5.1 Navegación

Barra inferior con dos pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Inicio** | Saludo + rutas de **hoy** (Activas / Completadas / Suspendidas) o, si no hay de hoy, la **Última jornada** |
| **Mis rutas** | Todas tus rutas, agrupadas en **Activas**, **Completadas** y **Suspendidas** |

Dentro de cada sección, las rutas se ordenan por fecha (más recientes arriba). En cada tarjeta ves fecha, turno y estado.

### 5.2 Ver una ruta

1. Tocá una tarjeta de ruta
2. Entrás al **Detalle de ruta** con:
   - Turno, fecha, estado
   - Efectivo recaudado (si hay cargas)
   - Km iniciales e insumos (después de iniciar)
   - Lista de **recolecciones** en orden

Si la ruta está **Suspendida**, verás un aviso y no podrás operarla hasta que el operario la reactive.

### 5.3 Iniciar la ruta (obligatorio antes de cargar paradas)

1. En el detalle, tocá **Inicio de ruta**
2. Completá:
   - **Kilómetros iniciales** del odómetro (número mayor a 0)
   - **Insumos** que llevás (al menos uno):
     - Tipos disponibles: Cesto, Biotacho, KitPuntos, Ropa, Celular, Bolsa punto, Bolsa nueva, Biotachos nuevos
     - Elegí tipo + cantidad → **Agregar** (podés agregar hasta 20 ítems)
3. Tocá **Confirmar inicio de ruta**
4. Volvés al detalle con la ruta en estado **En proceso**

> Hasta que no iniciés la ruta, las paradas solo se pueden **ver** (preview), no cargar.

### 5.4 Abrir Maps (navegación)

En el detalle de ruta, tocá **Maps**. Se abre Google Maps con las direcciones de las paradas **pendientes** (las ya visitadas o canceladas no se incluyen), en el orden de la ruta.

No necesitás configurar nada: usa la app de Maps del teléfono.

### 5.5 Cargar una recolección (parada)

Con la ruta **iniciada**, tocá una parada de la lista → **Cargar en campo**.

#### Datos que no se pueden modificar (solo lectura)

- Dirección del cliente
- Cliente (nombre)
- Hora programada
- Observaciones

#### Dos caminos posibles

**A) Cancelación**

Si la parada no se pudo hacer:

1. Escribí el **Motivo de cancelación**
2. Completá **Nombre del firmante**
3. Marcá la casilla de **confirmación de firma**
4. Guardá → la parada queda como **Cancelada**

No hace falta completar bolsas ni pagos.

**B) Recolección normal**

1. Completá los cuatro contadores (podés poner **0**):
   - Bolsas llenas
   - Biotachos llenos
   - Bolsas nuevas
   - Biotachos nuevos
2. Revisá el **Precio de retiro** y el **Precio total a cobrar**:
   - El retiro viene de la planilla (precio base del servicio)
   - Si cargás **más de 2 bolsas llenas**, se suma el **precio de bolsa extra** por cada bolsa adicional (el valor lo define el operario en Parámetros)
   - El desglose se actualiza al cambiar la cantidad de bolsas llenas
3. Completá los **tres montos** (todos obligatorios; efectivo, transferencia y QR pueden ser **0**):
   - Monto efectivo
   - Monto transferencia
   - Monto QR
   - **La suma de los tres no puede ser menor al total a cobrar** (puede ser mayor)
4. **Nombre del firmante** (obligatorio)
5. Marcá **Confirmo la firma del cliente**
6. Tocá **Guardar recolección** → la parada queda como **Visitada**

#### Editar una parada ya cargada

Las paradas visitadas o canceladas muestran **Editar carga →**. Podés volver a entrar y actualizar los datos mientras la ruta siga en proceso y no esté suspendida.

### 5.6 Finalizar la ruta

Cuando terminaste todas las paradas del día:

1. Volvé al **Detalle de ruta**
2. Verificá que **todas** las recolecciones estén **Visitadas** o **Canceladas**
3. Tocá **Finalizar ruta** (si falta algo, el botón queda deshabilitado y aparece el **motivo** debajo)
4. Completá el **formulario de cierre**:
   - **Kilómetros finales** (obligatorio; deben ser **menores o iguales** a los km iniciales)
   - **Descarga realizada** (casilla)
   - **Combustible**, **Descuento**, **Otros gastos** (opcionales; solo si hubo **efectivo recaudado**)
   - **Total efectivo** (se calcula automáticamente: efectivo recaudado − gastos)
   - **Observaciones** (opcional)
5. Tocá **Finalizar ruta** en el formulario

**Reglas del cierre:**

- Si la ruta **no recaudó efectivo**, no podés cargar gastos (combustible, descuento, otros)
- Los gastos **no pueden superar** el efectivo recaudado
- El **total efectivo** nunca puede quedar negativo

**Qué pasa al finalizar:**

- La ruta pasa a **Completada**
- Ya no podés cargar ni editar paradas
- La app te lleva al **Inicio** (dashboard)
- La ruta aparece en la sección **Completadas** de Mis rutas

### 5.7 Resumen del flujo del recolector

```
Login
  → Mis rutas (Activas / Completadas / Suspendidas)
    → Detalle de ruta
      → Inicio de ruta (km + insumos)     ← una vez por jornada
      → Maps (navegación a paradas pendientes)
      → Por cada parada:
          → Cargar en campo (retiro + cobro + firma)
          → o Cancelar con motivo
      → Finalizar ruta                    ← formulario de cierre
        → Vuelta al Inicio
```

---

## 6. Planilla Google Sheets

Las rutas y paradas se cargan masivamente desde una planilla de Google. Esto lo usa normalmente el operario o superadmin, no el recolector en campo.

### Columnas principales (hoja `Rutas`)

Cada fila = una parada/cliente. Campos obligatorios:

- **Nombre**, **Direccion**, **Telefono**, **Dia** (fecha), **Hora**, **Recolector** (email del recolector en la app)

### Cómo se arma una ruta

La app agrupa filas automáticamente cuando comparten:

- Misma **fecha** (columna Dia)
- Mismo **turno** (Mañana si Hora &lt; 12:00, Tarde si Hora ≥ 12:00)
- Mismo **recolector** (email)

Si cambiás fecha, turno o recolector → es **otra ruta**.

### Estados en la planilla (automáticos)

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Lista para enviar a la app |
| **Incompleto** | Faltan datos obligatorios |
| **Error** | Algún dato inválido |
| **Enviada** | Ya importada (fondo verde, no se reimporta) |

### Menú en Google Sheets

Desde el menú del script (instalado una vez):

1. **Configurar integración** — URL de la app + secreto compartido
2. **Actualizar desplegable recolectores** — trae emails desde la base
3. **Validar todas las filas** — revisa antes de enviar
4. **Enviar pendientes a la app** — importa filas Pendiente

> El recolector **no** necesita usar la planilla: solo ve en la app lo que ya fue importado y asignado a su email.

Documentación técnica de la integración: [SHEETS_INTEGRATION.md](./SHEETS_INTEGRATION.md)

---

## 7. Problemas frecuentes

### No puedo iniciar sesión

- Verificá correo y contraseña (mayúsculas/minúsculas)
- Pedile al superadmin un **reset de contraseña**
- Si es cuenta nueva, puede que necesites confirmar el correo primero

### Soy recolector y no veo rutas

- Las rutas deben estar **asignadas a tu email** en la planilla (columna Recolector) o en el panel operario
- Verificá la **fecha** — en Inicio solo aparecen las **activas de hoy**; en Mis rutas están todas (Activas, Completadas, Suspendidas)

### Mi ruta aparece como Suspendida

- El operario la pausó desde el panel. No podés iniciarla ni cargar paradas
- Contactá al operario para que la reactive desde Ver detalle

### No aparece el botón Finalizar ruta / no puedo apretarlo

- Todas las paradas deben estar **Visitadas** o **Canceladas**
- La ruta debe estar **iniciada** (en proceso)
- Si está **suspendida**, primero tiene que reactivarla el operario
- Si el botón está deshabilitado, leé el **mensaje debajo** (ej: faltan paradas, ruta no iniciada)

### No puedo cargar gastos al finalizar

- Si la ruta **no recaudó efectivo**, los campos de gastos quedan bloqueados
- Los gastos no pueden superar el efectivo recaudado

### Kilómetros finales no me deja finalizar

- Son **obligatorios**
- Deben ser **menores o iguales** a los km iniciales de la ruta

### No puedo agregar recolección (operario)

- Si la ruta ya está **finalizada (Completada)**, no se pueden agregar paradas nuevas
- El botón **+ Agregar recolección** queda deshabilitado con el motivo visible

### “Inicio de ruta” no guarda / error de columnas

- Avisá al equipo técnico: puede faltar actualizar la base de datos (migraciones)
- Mientras tanto, probá cerrar sesión, volver a entrar y reintentar

### No puedo cargar una parada

- ¿Iniciaste la ruta? Sin inicio de ruta solo podés **ver** el detalle, no cargar
- ¿La ruta está **suspendida**? Avisá al operario
- Revisá que la suma de pagos **no sea menor** al total (puede ser mayor)
- Si cancelás, solo necesitás motivo + firmante + firma

### El mapa del operario no carga

- Puede faltar configuración de Google Maps (tarea del equipo técnico)
- Sin mapa igual podés ver y editar recolecciones en las tablas

### La planilla no importa filas

- Ejecutá **Validar todas las filas** y corregí errores en rojo
- Verificá que el email del Recolector exista en la app
- Las filas **Enviada** (verde) no se reimportan — creá fila nueva si hace falta

### Maps del recolector no abre direcciones

- Verificá que las paradas tengan **dirección** cargada
- Probá con conexión a internet activa

---

## Glosario rápido

| Término | Significado |
|---------|-------------|
| **Ruta** | Jornada de un recolector en una fecha y turno, con N paradas |
| **Recolección / parada** | Visita a un cliente (dirección, hora, precio) |
| **Turno** | Mañana (antes de 12:00) o Tarde (desde 12:00) |
| **Inicio de ruta** | Registro de km y insumos al comenzar la jornada |
| **Finalizar ruta** | Cierre de la jornada con formulario (km finales, gastos, observaciones) |
| **Cierre de ruta** | Datos que el recolector completa al finalizar (km finales, descarga, gastos) |
| **Ruta suspendida** | Pausada por el operario; el recolector no puede operarla |
| **Bolsa extra** | Cobro adicional por cada bolsa llena por encima de las 2 incluidas en el retiro |
| **Carga en campo** | Datos que el recolector carga en cada parada |
| **Operario** | Persona de backoffice que supervisa y edita rutas |
| **Superadmin** | Administrador principal con acceso total |

---

*Manual actualizado con las funcionalidades disponibles a junio 2026 (cierre de ruta, campos extra en recolecciones, bloqueos con mensajes visibles). Para detalles técnicos de instalación y desarrollo, ver [GUIA_DESARROLLADORES.md](./GUIA_DESARROLLADORES.md).*
