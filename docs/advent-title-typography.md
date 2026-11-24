# Títulos configurables de Adviento

## Alcance y diseño

Controles por instancia para las cuatro secciones de la landing: banner superior, título/descripción, calendario y cierre. Se conserva la composición navideña, las fuentes Work Sans/Dry, los colores actuales y la jerarquía existente. No cambia el header, homepage, JSON del comerciante ni promociones, fechas o destinos.

Ambas funciones nuevas están apagadas por defecto: la solicitud es dar control, no imponer un rediseño. Sin personalización se conservan los line-height por rol: hero 1.08, encabezado/calendario 1.14, cierre/modal 1.15.

## Uso en el editor

En cada sección:

1. **Fuente de los títulos → Origen de la fuente**: Diseño actual, Biblioteca de Shopify o Archivo propio WOFF/WOFF2. Estos controles ya existían y siguen independientes. Si se elige Shopify aparece el selector; si se elige archivo propio, pegar la URL HTTPS de la fuente con licencia subida a Archivos y seleccionar su peso.
2. **Interlineado del título → Personalizar interlineado**: activa sliders independientes para escritorio y móvil (hasta 799px, breakpoint propio de la landing). Valores de 100% a 180%, en pasos de 1%; 120% equivale a `line-height: 1.2`, sin cambiar tamaño ni peso. Al apagarlo vuelve al diseño actual.
3. **Degradado del título → Usar degradado en el título**: activa el campo nativo de colores/dirección del degradado. Apagado usa los colores sólidos configurados, incluida la palabra destacada del banner. Vacío o no válido conserva el sólido.

El degradado se aplica al texto del título y a la palabra destacada, no a la caja completa, descripciones, botones o números de puertas. En el calendario también puede aplicarse al título de la oferta; su degradado inicial es oscuro porque el diálogo tiene fondo crema. Los otros módulos ofrecen un degradado claro para su fondo rojo. Cualquier color que el comerciante seleccione debe mantener contraste suficiente en toda la transición.

## Implementación y respaldo

La variable de interlineado es local a `[data-advent-style]` y solo se emite al activar el control. El valor se normaliza y acota a 1.0–1.8. No hay CSS global ni JavaScript adicional.

El texto se envuelve en `advent__title-ink`; el acento del hero usa su clase explícita para que no se aplique el estilo del acento a todos los spans. El hook que actualiza el título de la oferta está en su span persistente; el h2 conserva el ID usado por `aria-labelledby`.

El degradado se condiciona con `@supports` a un background válido y recorte de texto. Se rechazan valores vacíos, sólidos, URLs y delimitadores de CSS/HTML. Si el navegador no puede representarlo, conserva tinta sólida. Impresión y colores forzados restauran texto sólido visible. El padding del recorte evita cortar remates; las cajas no tienen ancho fijo ni impiden envolver texto. No se añaden fuentes ni descargas por activar estos controles.

Impeccable: el escaneo tipográfico previo no tenía hallazgos. La revisión independiente identificó el selector genérico de spans del hero, el hook dinámico del modal y la necesidad de preservar interlineados por rol. Esos tres riesgos están tratados. El escaneo final detectó únicamente `gradient-text`, una elección pedida expresamente por el usuario, no una regresión. La excepción está limitada a esa regla en `snippets/advent-section-styles.liquid`, documentada en `.impeccable/config.json`; no desactiva otros controles ni archivos.

## Verificación

- Pruebas nuevas observadas fallar antes de implementar: controles ausentes, variable de interlineado y spans del título. También se observó fallar el rechazo de una URL CSS en mayúsculas antes de normalizar la comprobación.
- Render Liquid: controles únicos, aislamiento por sección, modo apagado, móvil independiente, degradados inválidos, elección de fuente nativa en los cuatro módulos y configuración de ofertas idéntica antes/después.
- Chrome local: 1440px con hero Georgia de prueba, line-height 69px sobre fuente 60px (115%); móvil 390px con 50.4px sobre 36px (140%). A 320px no hay desbordamiento. Al desactivar opciones, vuelve a 38.88px/36px (1.08) y fondo de tinta `none`. Descripciones siguen con color sólido y sin degradado.
- Se abrió la oferta local de fecha simulada: título presente en su span, degradado oscuro, nombre accesible del diálogo y line-height 48px/32px (150% en móvil). Escape cierra y devuelve el foco a la puerta.
- Theme Check sin hallazgos en las cuatro secciones y el snippet. No se declara limpio todo el tema heredado.
- El escenario `?scenario=staging&style=typography` del preview es solo una demostración local; no se guardó en Shopify. Falta comprobar los controles del editor tras merge y sincronización, así como Safari/iPhone real y alto contraste/impresión en sus dispositivos; las reglas de respaldo están implementadas, no se presentan como pruebas en hardware real.

Referencias oficiales: [range, color_background y font_picker](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings), [fontes del tema](https://shopify.dev/docs/storefronts/themes/architecture/settings/fonts).
