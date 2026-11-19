# Verificación del calendario — 19 noviembre 2026

## Resultado

- Suite completa: **64 pruebas aprobadas**, sin fallos ni pruebas omitidas.
- Ambos scripts de runtime pasan `node --check`.
- `git diff --check origin/staging...HEAD` sin incidencias.
- Theme Check: **cero incidencias en los dos archivos Liquid/JSON nuevos**. El análisis global del tema conserva errores heredados en otros archivos; no se declara limpio el tema completo.
- Auditoría npm de las dependencias de desarrollo: cero vulnerabilidades reportadas.
- IDs de configuración únicos comprobados por pruebas del schema. El script opcional del plugin de Shopify no está instalado; no se presenta como una comprobación ejecutada.

## Comportamiento probado

- Fechas estrictas, años bisiestos e intervalo de 1 a 31 días.
- Calendario inclusivo de 15 días cruzando noviembre/diciembre.
- Medianoche colombiana: 05:00 UTC.
- Estados antes/durante/después de campaña, sin acumular vigencia.
- Datos incompletos, borradores, fechas duplicadas, inválidas y fuera de rango.
- Destinos seguros y textos que intentan cerrar etiquetas de script.
- Fecha simulada disponible únicamente en configuración del editor.
- Render Liquid real en Liquidjs y montaje del componente en jsdom.
- Apertura, cierre, restitución de foco, temporizador de medianoche y limpieza/reconexión de sección.
- Click normal y botón central del mouse no conservan una oferta que acaba de vencer.

## Navegador real: vista previa local

Capturas locales en `.impeccable/review/desktop.jpg` (1440 px), `mobile.jpg` (390 px), `offer-mobile.jpg` y `user-width.jpg`.

- Ambas fotografías cargadas y 15 puertas visibles.
- Sin desbordamiento horizontal en 1440 px y 390 px.
- Promoción de prueba local abierta con detalle, texto y destino sintéticos claramente identificados.
- Tab llegó al enlace de productos; Escape cerró el diálogo nativo y devolvió foco a la puerta.
- Consola local sin errores ni advertencias.
- Segunda captura confirmó los SVG finales y que no hay imágenes sin origen.

No se enviaron datos ni se compraron productos durante las pruebas. El servidor de fixtures no forma parte de los assets del tema.

## Revisión independiente

El revisor examinó código y cuatro capturas. Detectó navegación auxiliar sin revalidación de vencimiento e iconos basados en glifos. Ambos se corrigieron; la regresión funcional se observó fallar antes del ajuste y pasar después. La revisión de correcciones devolvió **ship**, limitada a esos dos hallazgos. No quedan hallazgos menores aplazados.

## Decisiones registradas

- Reutilizar el worktree aislado del host con una rama nueva desde staging, sin merge ni publicación; no se crea otro checkout.
- Ejecutar directamente el diseño ya aprobado con fotografías aportadas, sin otra ronda creativa ni preferencias permanentes de herramientas.
- Añadir Liquidjs y jsdom solamente para desarrollo: `npm ci` es necesario para ejecutar pruebas; no se cargan en la tienda.
- Guardar JSON en un atributo HTML escapado para evitar diferencias de escape entre motores Liquid. El código fuente del navegador no es una barrera de seguridad.
- Corregir la navegación auxiliar como parte material de la promesa de vigencia diaria y los SVG como parte de la calidad visual solicitada.
- Mantener fuera de la validación local la integración y los descuentos reales de Shopify: la campaña no queda lista para vender hasta completar configuración comercial y probar una página real.

## Pendiente antes de publicar

1. Integrar el PR y confirmar la sincronización del tema de staging.
2. Asignar `page.advent-calendar` a una página y verificarla con header/footer reales de Shella y en el editor.
3. Confirmar agenda y completar destinos, condiciones, cuatro porcentajes y las cinco promociones adicionales.
4. Programar los descuentos efectivos en Shopify, comprobando su zona horaria.
5. Habilitar únicamente promociones aprobadas. Todas se entregan como borradores seguros.
