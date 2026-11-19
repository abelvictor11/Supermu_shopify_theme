# Calendario de Navidad Supermú — diseño para aprobación

## Objetivo y alcance

Crear una landing independiente en el tema Shopify para una campaña de ofertas diarias. El usuario confirmó vigencia de una sola jornada por promoción, posibilidad de agregar las ofertas pendientes y edición de fechas. No se modifica el homepage ni se publica contenido en la tienda durante el desarrollo.

Campaña inicial propuesta: del 23 de noviembre al 7 de diciembre de 2026, ambos incluidos (15 días), zona horaria America/Bogota. El año se deduce de la campaña actual y permanece editable.

## Enfoque

Se recomendó una plantilla de página y una sección nativas de Shopify, con bloques editables por promoción; el usuario aceptó continuar con configuración editable. Reutilizar el tema evita una app adicional, suscripción o constructor externo. Una app permitiría administración avanzada de cupones, pero excede esta landing. Una página estática requeriría cambios de código por cada oferta y no cumple la necesidad de edición.

Archivos previstos: plantilla `page.advent-calendar.json`, sección del calendario, CSS y JavaScript dedicados y pruebas. Estilos y eventos aislados; sin dependencia de Slick, Swiper ni scripts de carruseles del homepage.

## Configuración del editor

- Fecha inicial y final de campaña en formato AAAA-MM-DD; textos de ayuda y validación explícita porque el schema del editor no aporta aquí un selector de fecha propio del tema.
- El calendario calcula los días incluidos a partir de esas fechas; el valor inicial es 15 días. No conservar un título fijo de 15 días si la duración cambia. Como límite técnico propuesto, admitir hasta 31 días y avisar en el editor si el rango no es válido.
- Título, introducción, condiciones y recursos gráficos editables.
- Bloques de promoción: habilitación, fecha concreta, marca/título, texto de descuento opcional, imagen opcional, colección o enlace, texto del botón y condiciones.
- La promoción ocupa un solo día: la fecha del bloque determina su inicio a las 00:00 y fin al comenzar el día siguiente. Las fechas globales no alargan su vigencia.
- Las fechas de bloques existentes no se desplazan silenciosamente al cambiar la campaña. Los bloques fuera del rango o duplicados generan un aviso en el editor y no publican una oferta ambigua.
- Modo de prueba con fecha simulada únicamente dentro del editor. Ningún parámetro público de URL habilita ofertas futuras.

## Contenido inicial

Precargar las diez marcas en el orden proporcionado como propuesta de agenda, del 23 de noviembre al 2 de diciembre; el comerciante podrá reasignar sus fechas. No asumir que estas asignaciones ya fueron aprobadas comercialmente.

1. Aromáticas Hindú — porcentaje pendiente.
2. La Constancia — porcentaje pendiente.
3. Ranchera — 20%.
4. Aguardiente Antioqueño — 30%.
5. Pietrán — 20%.
6. Colcafé y Chocolates Corona — 20%.
7. Zenú — 20%.
8. Saltín Noel–Ducales — porcentaje pendiente.
9. Galletas Navideñas Noel — 10%.
10. Juan Valdez — porcentaje pendiente.

Los cinco días restantes no reciben marcas ni descuentos ficticios. Los bloques sin promoción aprobada se mantienen sin habilitar y muestran una puerta neutral, sin porcentaje ni llamada a comprar. Una marca sin porcentaje puede conservarse como borrador; no se presenta como descuento confirmado. No inventar handles de colecciones, productos, cupones ni términos comerciales. La plantilla no se considera lista para publicar ofertas activas hasta completar su destino y condiciones.

## Comportamiento del visitante

- Antes de campaña: fechas y calendario cerrado.
- Día futuro: número y fecha visibles, sin interacción que prometa una oferta disponible.
- Día actual configurado y habilitado: apertura de la puerta y detalle de la promoción, con enlace a comprar.
- Día actual pendiente: estado neutral de contenido no disponible; sin descuento inventado.
- Día pasado: “Oferta finalizada”; sin botón de compra que sugiera vigencia.
- Después de campaña: mensaje de campaña finalizada; no se reinicia automáticamente el año siguiente.
- Recalcular el estado al recuperar visibilidad y al cambiar el día para no dejar promociones activas después de medianoche en una pestaña abierta.
- Sin JavaScript, conservar fechas y contenido informativo; no ofrecer una interacción rota ni enlaces activos que aparenten vigencia no verificada.

## Dirección visual y accesibilidad

Identidad de campaña tomada de las piezas del ZIP: rojo, fotografías de alimentos navideños y árbol gastronómico. Optimizar copias para web, conservar los originales y evitar incorporar los TIFF de impresión al tema. Las imágenes tendrán dimensiones reservadas, alternativas textuales pertinentes y configuración desde el editor.

Calendario responsive sin carrusel obligatorio; puertas de tamaño táctil legible, número y fecha reales. Controles nativos, foco visible, detalle accesible con cierre por Escape y devolución del foco, sin animaciones obligatorias para descubrir ofertas. Respetar movimiento reducido. Los estados no dependen solo del color.

Las dos referencias de Figma no pudieron verificarse mediante consulta web; no se promete una reproducción exacta de esos archivos. Se usan como referencias aportadas, no como prueba de un diseño inspeccionado.

## Descuentos reales y límites

La landing presenta promociones; no crea ni modifica descuentos, precios, stock o checkout. Cada descuento debe configurarse y programarse en Shopify para la fecha y productos aprobados. Ocultar o vencer una puerta no constituye control de precio ni seguridad: la validación comercial pertenece a Shopify, no al reloj del navegador.

No se publican precios o condiciones legales de alcohol inventados. La oferta de aguardiente conserva las restricciones y condiciones aprobadas de la tienda.

## Verificación y entrega

- Probar antes de campaña, primer día, medianoche, último día y campaña terminada en hora de Colombia, incluyendo cruce noviembre/diciembre.
- Probar fechas inválidas, invertidas, días sin oferta, duplicados y cambios de rango.
- Probar apertura/cierre por teclado, foco y movimiento reducido.
- Validar schema Liquid y JSON, ejecutar las pruebas del repo y revisar escritorio/móvil en una vista previa real.
- No afirmar que la campaña funciona en Shopify solo porque pasan pruebas estáticas; dejar explícita cualquier validación de tienda pendiente.
- Desarrollo aislado; la publicación, asignación de la plantilla a una página, descuentos reales y merge del PR requieren sus pasos autorizados correspondientes.

## Revisión de coherencia

Revisión local como implementador: la edición de fechas no rompe la regla de una sola jornada; las ofertas pendientes no generan porcentajes; el calendario no aplica descuentos; no hay dependencia del homepage. Pendientes comerciales no bloqueantes para construir: cinco promociones, porcentajes restantes, destinos, condiciones y validación final de la agenda propuesta.

Estado: diseño aprobado por el usuario el 17 de noviembre de 2026; implementación pendiente del plan de ejecución.
