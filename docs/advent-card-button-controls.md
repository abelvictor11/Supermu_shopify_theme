# Controles de interlineado, botones y tarjetas

## Alcance

Ampliación de la landing de Adviento. No cambia el header, homepage, JSON del comerciante, promociones, fechas ni destinos. Los defaults conservan el aspecto anterior: sin ajuste negativo, acento separado 14px, CTA de radio 6px sin borde y tarjetas con sus tamaños/fuentes actuales.

## Títulos: compactar y usar negativos

CSS no admite un `line-height` negativo. La [especificación CSS](https://drafts.csswg.org/css-inline-3/#propdef-line-height) lo descarta; por eso no se ofrece un valor que el navegador ignoraría.

En las cuatro secciones, **Personalizar interlineado** permite 80–180%, más **Ajuste del interlineado** de -20 a 20px, independiente en escritorio/móvil. El valor final es `max(0.65em, ratio * 1em + ajuste)`: los negativos compactan y los positivos separan, manteniendo una altura válida. Se aplica explícitamente al acento con su propio tamaño para no heredar una longitud calculada para una fuente menor. Al apagar la personalización, no se emite esa fórmula y vuelven las alturas anteriores por rol.

El banner superior también ofrece **Separación de palabra destacada** de -40 a 40px, escritorio/móvil. Este margen sí puede ser negativo y acerca o superpone la palabra destacada al título principal. Conserva 14px por defecto. El calendario integrado antiguo tiene el mismo control, oculto cuando se usa el modo de secciones separadas. Valores muy negativos pueden superponer texto: previsualizar con la fuente real y en móvil.

## Botones CTA

En banner superior y calendario: **Forma y borde del botón**.

- Radio: 0–60px. Cero crea esquinas rectas; valores altos producen una forma de píldora.
- Grosor: 0–4px. Cero mantiene el botón sin borde.
- Color del borde, conservando los controles existentes de fondo, texto y hover.

Son independientes por sección. En el calendario separado afectan al CTA del diálogo, no a las puertas ni al botón de cerrar. No reducen el área táctil mínima ni cambian enlaces, estados o foco.

## Tipografía de tarjetas

En **Adviento: calendario → Tipografía de tarjetas**:

- Origen de fuente: diseño actual, biblioteca nativa de Shopify o archivo WOFF/WOFF2 propio. La fuente propia necesita URL HTTPS, licencia y peso correctos.
- Fuente/peso/estilo independientes del título. Se aplican a números, fechas y estados, tanto a la puerta activa (`button`) como a las bloqueadas (`div`). Las imágenes de portada no se modifican.
- **Personalizar tamaños de tarjetas** activa máximos responsivos del número para escritorio/móvil y tamaños de fechas/estados por dispositivo. El número se adapta al ancho: un máximo no es un tamaño fijo garantizado.
- Con fuente o tamaños personalizados, las filas del mosaico pueden crecer si el contenido lo requiere. Se mantienen áreas, orden, proporciones por spans, portadas, contraste por superficie y comportamiento de las puertas. Sin personalización se conservan las filas y todos los tamaños anteriores, incluidos los de tarjetas con portada.

La carga de fuentes comparte el snippet `advent-font-styles`: conserva validación de URL y `swap`, con familias distintas `AdventHeading-<id>`/`AdventCard-<id>`. Un archivo inválido o no disponible conserva texto de respaldo visible. Solo descarga fuentes seleccionadas. El fixture local no implementa el filtro propietario `font_face` de Shopify: los metadatos se prueban con fuentes del sistema y su render real no-sistema queda para QA de Shopify.

## Verificación

- Suite completa: 144 pruebas, sin fallos ni omisiones. Pruebas nuevas observadas fallar antes de implementar. Hay cobertura de ajustes negativos, límites, radio cero, bordes independientes, fuentes de título/tarjetas sin colisión, URL insegura, tamaños/filas y configuración comercial idéntica antes/después. Se actualizó deliberadamente el mínimo anterior de 100% a 80%.
- Chrome local: escritorio 1440px, móvil/tablet 768/390/320px. Hero de 60px: ratio .95 y -6px producen 51px; acento de 81px produce 70.95px con margen -6px. Móvil de 36px: 1.05 y -2px producen 35.8px, con margen -4px.
- CTA superior: radio 32px y borde 2px; CTA del diálogo: radio cero. Ambas puertas activas e inactivas usan Georgia en el escenario de prueba. La oferta abre, conserva su título y cierra por Escape.
- Tamaños máximos de número y etiquetas probados a 320/390/768/1440px con 19 puertas, algunas con portada: ningún texto sale de su tarjeta ni hay desbordamiento horizontal. Las filas se mantienen en `minmax(...,auto)`.
- Defaults comprobados a 320px: line-height 38.88px sobre 36px (1.08), acento 52.488px, separación 14px, CTA radio 6px/borde 0, fuente Work Sans, números con portada 38px y filas 144px.
- Detector Impeccable sin hallazgos nuevos. Se conserva únicamente la excepción de degradado solicitado en la PR anterior, sin nuevas supresiones.
- Theme Check: cero errores en los módulos/snippets modificados y una advertencia `ExcessiveSettingsCount` en calendario (47 ajustes, umbral recomendado 40). Se conserva sin silenciarla: cuenta también controles legacy y alternativas de fuente condicionalmente ocultos. Los grupos y `visible_if` mantienen separados los controles; no se elimina compatibilidad ni se altera el modelo de ofertas solo para reducir ese conteo.

Tras merge, verificar todos los controles en el editor, una fuente real no-sistema, Safari/iPhone, portadas y apertura de la oferta vigente. El preview usa promoción y fecha simuladas, claramente marcadas; no publica ni altera promociones reales.
