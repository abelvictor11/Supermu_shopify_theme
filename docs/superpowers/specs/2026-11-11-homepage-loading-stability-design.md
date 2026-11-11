# Estabilidad de carga del homepage

## Intención

Mejorar la carga visual del homepage de Supermú sin rediseñarlo. La portada debe conservar su identidad, orden y configuración desde el editor de Shopify, pero no debe mostrar franjas blancas, recortar tarjetas ni cambiar bruscamente de altura mientras cargan imágenes y carruseles.

## Objetivos

- No renderizar carruseles de productos cuando la colección configurada no existe o no contiene productos.
- Reservar una geometría estable para imágenes y tarjetas antes de que terminen de cargar.
- Evitar que la altura del carrusel cambie según la tarjeta activa.
- Inicializar los carruseles cuando estén próximos al viewport, sin exigir una interacción del usuario.
- Eliminar observación y actualización continua innecesaria del scrollbar personalizado.
- Mantener funcionamiento responsive, navegación, autoplay y configuración del editor.

## No objetivos

- Rediseñar la portada, tarjetas, banners o navegación.
- Cambiar colecciones, promociones o contenido administrado por la tienda.
- Sustituir Slick o Swiper en este ajuste.
- Modificar páginas distintas del homepage salvo código compartido estrictamente necesario.

## Restricciones

- El cambio se prepara contra `staging` para pruebas antes de `main`.
- Las secciones deben seguir siendo configurables desde Shopify Theme Editor.
- Una colección temporalmente vacía no debe dejar espacio reservado ni un título aislado dentro del mismo carrusel.
- Debe respetarse `prefers-reduced-motion` y conservar controles accesibles.

## Enfoques considerados

1. **Estabilización estructural — seleccionado.** Corregir renderizado vacío, geometría, inicialización y ciclos de actualización dentro de las secciones existentes. Es el menor cambio que resuelve las causas y conserva el editor.
2. **Limpieza de `templates/index.json`.** Desactivar manualmente secciones obsoletas. Es rápida, pero el problema reaparece cuando otra colección queda vacía.
3. **Reconstrucción completa del homepage.** Unificar componentes y reemplazar los carruseles heredados. Tiene mayor alcance y riesgo visual del necesario para este incidente.

## Diseño de la solución

- Liquid comprobará que el bloque tenga una colección válida y con productos antes de emitir el componente completo.
- Las imágenes de producto incluirán una fuente válida, dimensiones y relación de aspecto para reservar espacio; la primera imagen visible tendrá prioridad superior y las demás mantendrán carga diferida.
- Slick usará una altura estable en lugar de `adaptiveHeight` para carruseles con varias tarjetas.
- La activación diferida se apoyará en proximidad al viewport, con fallback inmediato cuando la API no exista y compatibilidad con el editor de Shopify.
- El scrollbar personalizado reaccionará a eventos reales del carrusel y redimensionamiento, sin intervalos permanentes.
- CSS limitará el espaciado vertical al módulo y evitará recortes sin ocultar contenido vertical.

## Verificación

- Theme Check y validación de sintaxis Liquid/JSON.
- Prueba del homepage con colecciones con productos, vacías y no configuradas.
- Prueba visual en escritorio y móvil: carga inicial, scroll, autoplay, flechas y cambio de viewport.
- Comprobación de ausencia de errores nuevos en consola y de secciones vacías ocupando espacio.
- Comparación antes/después de la continuidad vertical y estabilidad de tarjetas.

## Evidencia de implementación

- `node --test tests/*.test.js`: 38 pruebas aprobadas inicialmente; 39 tras añadir la regresión de Theme Check.
- `shopify theme check --output json`: cero errores en los archivos modificados; el repositorio conserva errores heredados fuera del alcance.
- Auditoría Frontend Design Premium: dos hallazgos heredados fuera del alcance (`assets/theme.js` y scrollbar global en `assets/theme-m.css`).
- El validador empaquetado de Shopify no pudo ejecutarse porque su instalación no incluye `@shopify/theme-check-common`; se utilizó Shopify CLI Theme Check como validación local.

