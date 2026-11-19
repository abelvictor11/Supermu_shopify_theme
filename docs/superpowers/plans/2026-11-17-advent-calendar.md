# Calendario de Navidad Supermú Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implementar una landing nativa y editable con promociones válidas por una jornada y una campaña inicial de 15 días.

**Architecture:** Una plantilla JSON monta una sección Liquid con configuración y bloques de promoción. Un módulo JavaScript sin dependencias calcula fechas y estados; un componente de la página consume ese módulo para pintar puertas y abrir un diálogo accesible. Las fotografías optimizadas y el CSS están aislados de los carruseles del tema.

**Tech Stack:** Shopify Liquid y schema, JSON, CSS, JavaScript nativo, pruebas con node:test.

**Spec:** `docs/superpowers/specs/2026-11-17-advent-calendar-design.md` (aprobado).

## Global Constraints

- Campaña inicial: 2026-11-23 a 2026-12-07 inclusive, zona America/Bogota; fechas editables, intervalo válido de 1 a 31 días.
- Una promoción vence al comenzar el siguiente día de Colombia; no se acumula vigencia.
- No inventar marcas, porcentajes, destinos, cupones ni condiciones; no publicar bloques incompletos como ofertas disponibles.
- Sin cambios al homepage, carrito, checkout o descuentos de Shopify; no publicar recursos remotos ni crear una página en Admin sin autorización.
- Vista previa de fechas exclusiva de request.design_mode; no usar parámetros de URL como mecanismo de habilitación.
- Preservar el ZIP y sus originales; solamente versiones web optimizadas en assets.
- No depender de Slick, Swiper, jQuery o APIs externas para el calendario.

## Review Focus

1. Pestaña abierta al vencer el día: cerrar detalle y quitar destino antes de permitir una compra de oferta vencida; prueba de actualización del componente.
2. Cambio de campaña con bloques fuera de rango, duplicados o fechas imposibles: avisar en el editor y bloquear únicamente ofertas ambiguas; pruebas del motor.
3. Bloques incompletos: ni porcentajes fabricados ni botones de compra; pruebas de completitud y del template.
4. Editor, reconexión de sección y fallo de JavaScript: limpiar listeners y temporizadores, no duplicar diálogos y conservar información sin controles rotos; pruebas del ciclo de vida y comprobación real.
5. Móvil, teclado y recursos pesados: sin desplazamiento horizontal, diálogo con foco y cierre correctos, geometría de imágenes reservada y recursos web; verificación en navegador.

## File Structure

- Create `assets/advent-calendar-state.js`: funciones puras compartidas entre navegador y Node.
- Create `assets/advent-calendar.js`: componente, reloj, estados y diálogo.
- Create `assets/advent-calendar.css`: presentación responsive aislada bajo prefijo advent.
- Create `sections/advent-calendar.liquid`: configuración, datos escapados, estructura y schema.
- Create `templates/page.advent-calendar.json`: agenda inicial, porcentajes conocidos y borradores deshabilitados.
- Create `assets/advent-christmas-tree.jpg` y `assets/advent-bunuelos.jpg`: copias web optimizadas del ZIP, sin TIFF en Git.
- Create `tests/advent-calendar-state.test.js`: reglas de fecha, intervalos y promociones.
- Create `tests/advent-calendar-ui.test.js`: regresión del ciclo de vida, plantilla y schema.
- Create `docs/advent-calendar-setup.md`: configuración, agenda y lista de verificación comercial para publicar.

### Task 1: Motor de fechas y disponibilidad

**Interfaces:** `parseDay(value: string): number|null` devuelve el ordinal UTC de una fecha AAAA-MM-DD estricta. `colombiaDay(now: Date): string` devuelve la fecha de Colombia. `buildCalendar({start, end, today, offers}): {valid, phase, days, issues}` devuelve estados sin DOM. Cada oferta contiene `id, date, enabled, title, discount, url, terms`; cada día contiene `date, number, state, offer|null`. Estados: future, active, pending, expired. Fases: before, active, ended, invalid.

- [ ] Escribir pruebas de 15 días (primer día 2026-11-23 y último 2026-12-07), fecha inválida 2026-02-30, intervalo invertido, intervalo de 32 días y cambio de mes.
- [ ] Añadir pruebas con 2026-11-23T04:59:59Z => 2026-11-22 y 2026-11-23T05:00:00Z => 2026-11-23; una oferta del 23 está expired el 24.
- [ ] Añadir pruebas para marcas sin porcentaje, oferta deshabilitada, destino ausente, condiciones ausentes, fecha duplicada y oferta fuera de rango: nunca devolver active con datos incompletos o ambiguos.
- [ ] Ejecutar `node --test tests/advent-calendar-state.test.js` y observar fallo antes de implementar.
- [ ] Implementar el módulo sin DOM, con exportación compatible con Node y navegador; no usar interpretación permisiva de Date para fechas de editor.
- [ ] Ejecutar prueba enfocada y suite completa `node --test tests/*.test.js`; registrar resultados y commit enfocado.

### Task 2: Sección editable y agenda

**Consumes:** contrato de buildCalendar de Task 1. **Produces:** custom element `advent-calendar` con JSON local seguro y datos `start, end, offers, designMode, previewDate`; un máximo de 31 bloques. JSON de configuración escapado para evitar cerrar un script mediante texto del editor. Template inicial con 10 borradores deshabilitados: no hay destinos ni condiciones aprobados.

- [ ] Escribir pruebas de schema: IDs únicos, tipos permitidos y plantilla con fechas iniciales. Los cuatro porcentajes pendientes (Hindú, La Constancia, Saltín Noel–Ducales y Juan Valdez) permanecen vacíos. Comprobar Ranchera 20%, Aguardiente Antioqueño 30%, Pietrán 20%, Colcafé y Chocolates Corona 20%, Zenú 20% y Galletas Navideñas Noel 10%.
- [ ] Comprobar en pruebas que las 10 marcas coinciden con la spec, que no existen marcas para los cinco días pendientes y que ningún borrador contiene enlaces inventados.
- [ ] Escribir prueba de previewDate condicionado a request.design_mode y de datos con caracteres HTML; observar fallos.
- [ ] Crear la sección y plantilla; mostrar fechas y mensaje informativo sin JavaScript, y ocultar las puertas interactivas hasta que el componente esté preparado.
- [ ] Incluir campos de campaña y promoción, estado habilitado explícito y advertencias visibles solo en el editor; no mover fechas de bloques al editar el rango.
- [ ] Ejecutar pruebas, validar template JSON y schema Liquid con herramientas Shopify disponibles; documentar limitaciones del validador y commit enfocado.

### Task 3: Interacción y diseño de campaña

**Consumes:** JSON de Task 2 y buildCalendar de Task 1. **Produces:** componente autónomo que recalcula en conexión, cada 30 segundos y visibilitychange; limpia recursos al desconectar; actualiza un detalle abierto al cambiar el estado. Solo el día active genera acción de compra. Los valores del editor se insertan como texto o atributos validados, no como HTML arbitrario.

- [ ] Crear pruebas del ciclo de vida y transición active -> expired con dependencias de reloj controladas; confirmar fallo antes de implementar.
- [ ] Implementar render de fechas, puertas, mensajes y advertencias; la fecha simulada se acepta solo con designMode verdadero.
- [ ] Implementar diálogo nativo con nombre y descripción, showModal, cierre con Escape, botón de cierre y devolución de foco; fallback informativo si el navegador no soporta la interacción.
- [ ] Preparar imágenes web desde el ZIP, con medidas y tamaños comprobados; permitir sustituirlas mediante image_picker en el editor.
- [ ] Diseñar hero rojo con fotografía de campaña y calendario editorial de puertas numeradas, sin carrusel ni decoración que oculte ofertas o condicione la interacción a animaciones.
- [ ] Incluir foco visible, botones táctiles, estados con texto y reduced-motion; imágenes con proporción reservada.
- [ ] Probar escritorio y móvil y corregir en un lote cualquier fallo observado; documentar si la vista previa usa datos de prueba o Shopify real.
- [ ] Ejecutar suite completa, `node --check` de ambos scripts y `git diff --check`; commit enfocado.

### Task 4: Revisión y entrega

- [ ] Revisar el diff contra cada sección de la spec, incluyendo cierre de un detalle a medianoche y edición de fechas sin desplazar ofertas.
- [ ] Añadir guía de configuración: asignación manual de plantilla, fechas de cada promoción, completar descuentos y condiciones, y programación real de descuentos en Shopify.
- [ ] Ejecutar de nuevo todas las pruebas y validación Liquid/JSON; no silenciar fallos ajenos sin reportarlos.
- [ ] Verificar que los únicos archivos de producto cambiados pertenecen al calendario y que no se modificó templates/index.json ni la configuración global.
- [ ] Entregar resumen con archivos, comprobaciones y pendientes comerciales. No merge ni publicación; creación de PR y base según autorización del usuario.

## Self-review

El plan cubre fechas, datos incompletos, aislamiento, interacción, recursos, vista previa y validación de tienda. Las fechas exactas y marcas iniciales son editables; no se presupone un destino. La implementación no promete validez de descuentos basada en el reloj del cliente. Los cinco puntos de Review Focus tienen prueba o revisión asignada.
