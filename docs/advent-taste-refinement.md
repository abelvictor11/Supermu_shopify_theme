# Calendario: fidelidad del mosaico y activación

## Evidencia del 20 de noviembre de 2026

Se inspeccionó la página real de staging `/pages/calendario-de-adviento`, tema conectado a staging, tras el merge del PR #307. Rango real: 19 noviembre a 7 diciembre (19 días). El código limitaba el mosaico a exactamente 15, de modo que se veía la cuadrícula uniforme. La Constancia del 20 noviembre estaba habilitada, con 20% y destino /collections/aseo, pero condiciones vacías. Eso bloqueaba su publicación según la regla anterior. No era un error de eventos o caché.

El usuario confirmó explícitamente **hacer condiciones opcionales**. Fecha vigente, rango válido, promoción habilitada, marca, descuento y destino seguro siguen siendo obligatorios. No se habilitan ofertas incompletas ni se inventan restricciones. Los descuentos efectivos siguen siendo responsabilidad de Shopify.

## Lectura Taste

Landing de campaña para compradores de supermercado, navideña e ilustrada, evolución de marca y fidelidad al póster asimétrico aprobado. DESIGN_VARIANCE 8, MOTION_INTENSITY 6, VISUAL_DENSITY 6. Native Liquid/CSS/JS, no sistema UI nuevo ni React/GSAP. Se preservan tipografía Work Sans/Dry, fotografía aportada, rojo de campaña y verdes/crema/dorado de la referencia. Estas decisiones explícitas prevalecen sobre los defaults genéricos de paleta y colapso a una columna de Taste. El mosaico conserva tres columnas en móvil como composición editorial, no una lista de features.

Cabecera compacta, título e introducción de calendario alineados verticalmente, tarjetas con radio de papel de 5px y menor separación. Mantiene fechas y números reales. El patrón aprobado se repite por paneles de 15; un panel parcial se coloca en orden de lectura. Se calculan composiciones de cinco y tres columnas sin DOM global ni mediciones por scroll. Decoraciones ocultas a lectores de pantalla y nunca interactivas.

Movimiento: aparición breve de cabecera y giro suave al abrir la sorpresa. Ilustración activa con respuesta ligera al hover y al estado abierto; solo la tarjeta vigente se anima. Sin partículas, marquees, bucles, timers de animación o nuevas dependencias. Reduce Motion usa opacidad breve y cierre inmediato, sin inclinación.

## Ilustración

Generación con herramienta integrada, atlas transparente original de 15 ilustraciones de papel recortado: bastón, lazo, media, galleta, reno, campana, acebo, flor, gorro, regalo rayado, muñeco de nieve, regalo verde, bayas, estrella y árbol. Sin texto ni descuentos. PNG original conservado fuera del repositorio; WebP con alpha (410662 bytes) en `assets/advent-festive-atlas.webp`, compartido por todas las tarjetas. Portadas elegidas por el comerciante tienen prioridad.

Prompt final: «Single transparent PNG sprite atlas for a Christmas advent calendar UI. Exactly fifteen distinct Christmas illustrations on an invisible 5-column by 3-row uniform grid. Each object fully contained and centered, transparent padding, no overlaps. Candy cane, golden bow, green stocking, gingerbread person, reindeer face; bell, holly, poinsettia, Santa hat, striped present; snowman, green gift, winter berries, star cookie, decorated tree. Sophisticated joyful flat cut-paper, clean silhouettes, subtle paper texture, forest green, mint, ivory, festive red and golden yellow. No backgrounds, gridlines, numbers, text, logos or watermark.»

## Verificación y límites

Pruebas reproducen la regresión de 19 días y comprueban todas las duraciones 1-31 en cinco/tres columnas: cada fecha aparece, sus celdas forman un rectángulo, no hay fechas fuera de rango ni cambios de orden. Antes del cambio fallaron las regresiones de layout y el mensaje impreciso; las nuevas pruebas de condiciones opcionales también se observaron fallar antes de implementar la decisión.

La vista local está marcada como sintética y no programa promociones. Se comprobó diálogo nativo, apertura CSS 420ms, Escape y retorno de foco en navegador real. El caso de La Constancia con condiciones vacías abre y no tiene descripción accesible vacía; cabe en 320px. Sin desbordamiento ni etiquetas recortadas en 1440/390/320px. La revisión visual detectó pequeños residuos entre celdas del atlas: un recorte CSS interior evita mostrarlos sin modificar la imagen original.

Suite completa: 108 pruebas, sin fallos ni omitidas. Lighthouse no está instalado; no se afirman métricas LCP/INP/CLS medidas. Movimiento reducido tiene cobertura de las pruebas y CSS, sin cambiar la preferencia del sistema del usuario para simularla. No se modificaron ajustes comerciales del Admin, fechas guardadas, homepage, navegación ni main. La prueba local no equivale a validar header/footer completos tras el próximo merge de staging.
