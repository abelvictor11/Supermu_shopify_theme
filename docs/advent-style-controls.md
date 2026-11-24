# Colores y fuentes del calendario

## Decisión visual

Refinamiento de la campaña existente para compradores de supermercado. Se conserva el mosaico, fotografías, portadas y movimiento. Taste: variación 8, movimiento 6 y densidad 6, heredados del diseño aprobado; no se añade una librería ni se rediseña la tienda. El rojo pedido por el usuario es exactamente `#ff0303`.

Los controles pertenecen solo a las cuatro secciones de adviento: banner superior, título/descripción, calendario y banner de cierre. No modifican el header ni las fuentes generales. No se modifica ningún JSON del comerciante, fecha, promoción, descuento o destino.

## Uso en el editor

En cada sección están **Colores de esta sección** y **Fuente de los títulos**. Se pueden cambiar fondo, títulos y descripciones. El banner superior permite cambiar la palabra destacada; banner superior y calendario permiten cambiar el fondo, texto y hover de sus botones.

Origen de fuente:

- **Diseño actual**: conserva Work Sans y el acento Dry del diseño.
- **Biblioteca de Shopify**: usa el selector nativo y los metadatos de familia, peso y estilo. Las fuentes del sistema no descargan un archivo.
- **Archivo propio WOFF/WOFF2**: subir un archivo con licencia a Contenido → Archivos, pegar su URL HTTPS y seleccionar el peso real del archivo. No pegar CSS ni una página de Google Fonts. Un archivo por sección; no carga pesos que no se hayan proporcionado.

La fuente propia tiene un nombre único por instancia y `font-display: swap`. Una URL inválida o un archivo que no carga mantiene una fuente de respaldo visible. Solo se admiten URLs HTTPS con extensión WOFF/WOFF2; se rechazan URLs ejecutables y delimitadores que puedan romper el bloque de estilos. Verificar CORS y licencia si se usa otro proveedor.

Los valores son locales a cada instancia, incluidas dos instancias del mismo tipo. Los colores de los textos pequeños sobre tarjetas, la franja clara y el contenido del modal conservan su contraste propio; no se hereda un texto claro sobre otra superficie clara. El color de títulos del calendario también controla el título del modal, sobre fondo crema.

## Legibilidad

Sobre `#ff0303`, blanco tiene 3.99:1 y crema 3.71:1: sirven para títulos grandes, no para texto pequeño AA. Por eso las descripciones y notas usan por defecto `#19080d` (4.87:1). El título pequeño de condiciones usa el color de texto. Los indicadores de foco pasan de dorado a crema para distinguirse del rojo. Los controles permiten combinaciones arbitrarias: quien los cambie debe mantener el contraste, especialmente el título del modal y sus botones.

## Verificación

- Pruebas de render Liquid real: independencia de estilos, fuente del sistema, fuentes propias por instancia, rechazo de URL insegura y configuración comercial idéntica antes/después.
- Suite completa y Theme Check de los cuatro módulos y el snippet, sin cambiar ni silenciar los hallazgos heredados del resto del tema.
- Chrome local: 320px, 390px, 768px y escritorio; sin desbordamiento horizontal. Se comprobó la URL de fuente del CDN de staging en el inventario de recursos, metadatos CSS, paleta independiente verde/rojo, fuente de sistema Georgia, texto visible al fallar el archivo y apertura/cierre por Escape con retorno del foco.
- La oferta utilizada para abrir el modal fue un escenario local con fecha simulada explícitamente identificado. No se activó una oferta real ni se alteró el calendario de staging.
- Falta comprobar los nuevos controles en el editor y el render de fuentes no-sistema de la biblioteca en Shopify después del merge. LiquidJS no implementa el filtro propietario `font_face`; el fixture deja esa frontera a Shopify, no inventa una descarga.

Fuentes oficiales: [fontes del tema y selector nativo](https://shopify.dev/docs/storefronts/themes/architecture/settings/fonts), [font_face y font_display](https://shopify.dev/docs/api/liquid/filters/font_face), [metadatos del objeto font](https://shopify.dev/docs/api/liquid/objects/font).
