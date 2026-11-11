# Homepage Loading Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar espacios vacíos, recortes y saltos de altura durante la carga del homepage sin cambiar su diseño ni su configuración editorial.

**Architecture:** La sección Liquid dejará de emitir carruseles sin productos y reservará dimensiones de imagen desde el HTML. El inicializador existente de Slick se activará por proximidad al viewport, mantendrá una altura estable y actualizará el scrollbar solamente ante eventos reales.

**Tech Stack:** Shopify Liquid, JavaScript ES6, jQuery/Slick existente, CSS, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-11-homepage-loading-stability-design.md`

## Global Constraints

- Conservar diseño, orden y configuración desde Shopify Theme Editor.
- No sustituir Slick ni Swiper.
- No mostrar espacio ni controles para una colección vacía o no configurada.
- Mantener responsive, autoplay, flechas, scrollbar y `prefers-reduced-motion`.
- Preparar el cambio contra `staging` antes de `main`.

## Review Focus

- Colección inexistente o vacía: la sección completa no debe renderizarse en storefront.
- Theme Editor con colección vacía: debe conservar una indicación editable sin crear un hueco publicado.
- Imagen sin `featured_image`: el HTML debe seguir siendo válido y la tarjeta no debe colapsar.
- Carrusel fuera del viewport: debe inicializarse al aproximarse sin esperar clic o scroll específico.
- Redimensionamiento/autoplay: scrollbar y altura deben actualizarse sin intervalos permanentes.

---

### Task 1: Contrato de renderizado estable

**Files:**
- Create: `tests/homepage-loading-stability.test.js`
- Modify: `sections/carousel-products.liquid`

**Interfaces:**
- Consumes: bloque principal de colección y `collection.products_count` de Shopify Liquid.
- Produces: un `<carousel-products>` únicamente cuando hay productos, imágenes con `src`, `srcset`, `width`, `height` y relación de aspecto reservada.

- [ ] **Step 1: Write the failing structural tests**

Añadir pruebas que exijan guard de colección con productos, fallback de editor y atributos intrínsecos de imagen.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: FAIL por ausencia del guard y de atributos de imagen.

- [ ] **Step 3: Implement the minimal Liquid markup**

Resolver la primera colección una sola vez, envolver la sección publicada en un guard de contenido y generar imágenes responsivas válidas con espacio reservado.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: PASS.

### Task 2: Inicialización y altura del carrusel

**Files:**
- Modify: `tests/homepage-loading-stability.test.js`
- Modify: `assets/section.carousel-products.js`

**Interfaces:**
- Consumes: custom element `<carousel-products>` y configuración `data-*` existente.
- Produces: carga por `IntersectionObserver` con fallback, Slick con `adaptiveHeight: false` y limpieza del observer al desconectar.

- [ ] **Step 1: Add failing behavior-contract tests**

Exigir `IntersectionObserver`, fallback directo, `adaptiveHeight: false` y desconexión del observer.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: FAIL por inicialización ligada únicamente a interacción y altura adaptativa activa.

- [ ] **Step 3: Implement viewport-proximity loading**

Observar con margen anticipado, proteger `load()` contra ejecuciones dobles y desconectar al iniciar o retirar el elemento.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: PASS.

### Task 3: Scrollbar sin polling y ritmo vertical

**Files:**
- Modify: `tests/homepage-loading-stability.test.js`
- Modify: `sections/carousel-products.liquid`

**Interfaces:**
- Consumes: eventos Slick `init`, `setPosition`, `beforeChange`, `afterChange` y `resize`.
- Produces: scrollbar sincronizado por eventos y CSS sin recorte vertical ni márgenes variables.

- [ ] **Step 1: Add failing regression tests**

Exigir ausencia de `setInterval`, listeners con namespace por sección y reglas de estabilidad/reduced motion.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: FAIL por polling de 100/200 ms y transiciones no condicionadas.

- [ ] **Step 3: Replace polling with event-driven synchronization**

Actualizar el drag desde el estado Slick en eventos y resize, y retirar listeners al descargar la sección en el editor.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/homepage-loading-stability.test.js`
Expected: PASS.

### Task 4: Validación Shopify y revisión final

**Files:**
- Modify: `docs/superpowers/specs/2026-11-11-homepage-loading-stability-design.md`
- Modify: `docs/superpowers/plans/2026-11-11-homepage-loading-stability.md`

**Interfaces:**
- Consumes: cambio completo y tema Shopify.
- Produces: evidencia de pruebas, Theme Check, revisión visual y PR a `staging`.

- [ ] **Step 1: Run focused and repository tests**

Run: `node --test tests/*.test.js`
Expected: PASS.

- [ ] **Step 2: Run Shopify validation**

Run: `shopify theme check`
Expected: sin errores nuevos en archivos modificados.

- [ ] **Step 3: Run frontend premium audit and inspect diff**

Run: `python /Users/usuario/.codex/plugins/cache/openai-curated-remote/frontend-design-premium/1.4.0/skills/frontend-design-premium/scripts/audit_project.py . --mode strict`
Expected: registrar y corregir hallazgos aplicables al alcance.

- [ ] **Step 4: Request independent code review**

Revisar guard Liquid, ciclo de vida JS, accesibilidad y ausencia de regresiones antes del commit final.

- [ ] **Step 5: Commit, push and open PR**

Crear un commit enfocado, publicar la rama y abrir PR con base `staging`.

## Resultado

- Pruebas enfocadas y suite del repositorio aprobadas.
- Archivos modificados sin errores de Theme Check.
- Carga por proximidad, altura estable, imágenes responsivas y scrollbar por eventos implementados.
- Pendiente únicamente revisión independiente, publicación de rama y apertura del PR a `staging`.

