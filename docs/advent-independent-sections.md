# Módulos independientes del calendario

## Alcance

Solicitud: separar banners, título/descripción y calendario para controlar visibilidad y orden desde Shopify. No cambia el mosaico, animaciones, descuentos, condiciones opcionales, fechas de vigencia ni lógica del carrito.

Cuatro secciones nativas: `advent-hero`, `advent-heading`, `advent-calendar`, `advent-closing`. Sus controles del ojo y orden son los del editor. Banners y encabezado tienen interruptores de título, descripción e imagen según corresponda; el banner superior también puede ocultar el botón.

El calendario independiente conserva su región accesible aunque no exista el encabezado, sus diálogos y datos. Banner sin imagen o sin texto no reserva una columna vacía. Las secciones cargan sus estilos en páginas independientes. En esta landing, los assets se cargan una sola vez desde `advent-assets`, referenciado con una única línea en el layout y condicionado al template `page.advent-calendar`. Eso permite recuperar un calendario inicialmente oculto desde el editor sin depender de scripts dentro del HTML insertado. No añade assets al homepage.

Un enlace de banner se oculta cuando no existe su ancla, también durante eventos de carga/descarga del editor. Sin MutationObserver, loops o timers nuevos. La nota de vigencia y la franja de fechas son opcionales, sin romper la inicialización.

## Configuración y migración

La conexión **Staging Supermu** fue verificada como `lavaquita33.myshopify.com`, tema `Supermu_shopify_theme/staging` (154139164923). Se leyó exclusivamente `templates/page.advent-calendar.json` mediante Admin GraphQL. Shopify CLI no tenía sesión iniciada; no se abrió un login ni se modificaron credenciales.

Snapshot de origen: checksum MD5 `221af347cb551eef0a92b4d623fbae50`. Copia anterior conservada localmente en el directorio de evidencia de esta tarea. Rango leído: 19 noviembre a 7 diciembre 2026; fecha de prueba del editor: 18 noviembre. Se conservan estas fechas, los diez bloques y todas sus propiedades, orden, activación, colecciones y posibles portadas. La Constancia conserva 20% y colección aseo. Es una copia de datos existentes, no una promoción creada por este ajuste.

`scripts/split-advent-sections.js` es una migración local: recibe JSON, clona sin mutar el origen, añade las tres secciones y preserva el calendario y sus valores antiguos. Es idempotente, evita colisiones de IDs, conserva campañas ocultas y se detiene si se superarían 25 secciones. No llama a Shopify ni escribe archivos: su CLI imprime JSON por stdout. Las escrituras del proyecto se aplicaron con patch.

El flag `separate_sections` activa el modo de módulos, pero su valor por defecto es false para que otras instancias antiguas conserven el formato integrado. Los nuevos presets de calendario usan modo independiente. Los campos integrados antiguos se conservan pero se ocultan mediante `visible_if` en ese modo.

**No promover este JSON de staging a main sin leer y migrar por separado el template actual de producción.** Contiene la configuración del entorno de prueba, no unos defaults comerciales universales. Evitar editar esta plantilla en Shopify entre la lectura final y el merge; si cambia, regenerar desde la versión más reciente.

La suite conserva su configuración inicial en un fixture estático separado: las pruebas unitarias no dependen de que el comerciante deje desactivadas sus promociones reales. Hay pruebas nuevas de la migración, preservación y render de módulos que no sustituyen las de vigencia.

## Verificación

- Suite completa: 118 pruebas, sin fallos ni omitidas.
- Se observaron fallar las pruebas nuevas antes de añadir la separación; también se corrigió un caso de migración que encendía módulos de una campaña oculta.
- Las 16 combinaciones de visibilidad se renderizan sin duplicaciones. Se probaron controles internos, assets por módulo, claves únicas, modo legado, anclas, carga inicial con módulos ocultos y calendario sin franja ni nota.
- Navegador local real: cuatro módulos en escritorio (1440px), un único CSS y tres scripts; botón al ancla correcto y apertura de La Constancia. Móvil 390px con solo calendario: 19 puertas, oferta abre, Escape devuelve foco, sin desbordamiento ni etiquetas recortadas. Ocultando calendario: banners y textos siguen, CTA oculta.
- Evidencia local: `all-modules.jpg`, `calendar-alone-mobile.jpg`, `calendar-hidden-mobile.jpg`. Es una vista de prueba, sin header/footer completos de Shella ni cambios de Admin.
- Theme Check: los módulos del calendario se revisan por separado. El layout conserva un error heredado de estructura body/compound; la única modificación es insertar el render del bootstrap dentro del head. No se declara limpio todo el tema.

Falta verificar el editor y la página real después del merge y sincronización de Shopify. No se hizo despliegue directo ni merge a main.

Referencias oficiales: [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates), [secciones y editor](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks), [visibilidad condicional de settings](https://shopify.dev/docs/storefronts/themes/architecture/settings).
