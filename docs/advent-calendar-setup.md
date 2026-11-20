# Configurar el calendario de Navidad

## Qué incluye

Una plantilla `page.advent-calendar` y la sección **Calendario de Navidad**. No cambia el homepage, el carrito ni el checkout. Las fotografías de campaña optimizadas están incluidas; se pueden reemplazar desde el editor.

## Activar en staging después del merge

1. Confirmar que Shopify sincronizó el tema conectado a `staging` y que existe la plantilla `advent-calendar`.
2. En Páginas, crear o elegir la página de la campaña y asignar la plantilla `advent-calendar`. El código del PR no crea páginas ni cambia su visibilidad automáticamente.
3. Abrir esa página en el editor del tema. Revisar la sección **Calendario de Navidad**.
4. Verificar las fechas iniciales: **2026-11-23** y **2026-12-07**, ambos días incluidos. Se admiten entre 1 y 31 días.
5. Completar las promociones y probar antes de añadir un enlace a la campaña en el menú o el homepage.

## Control de módulos desde el editor

La plantilla está dividida en cuatro secciones nativas:

1. **Adviento: banner superior**: título principal, descripción, fotografía y botón. Cada elemento tiene su propio interruptor.
2. **Adviento: título y texto**: título e introducción del calendario, editables y ocultables por separado. Si ocultas el título del banner, puedes elegir H1 aquí para conservar un título principal.
3. **Adviento: calendario**: fechas, promociones, portadas, vigencia y tarjetas. La franja de fechas y la nota de vigencia también se pueden ocultar.
4. **Adviento: banner inferior**: imagen, título y descripción antes del footer, con interruptores independientes.

Usa el **icono del ojo** de cada sección para ocultarla o volver a mostrarla sin perder sus datos. Puedes arrastrarlas para cambiar el orden. Para una campaña que quieras recuperar después, ocultar es preferible a eliminar.

El calendario funciona solo: no depende del título ni de las fotografías. Si lo ocultas, el botón «Descubrir el calendario» se oculta automáticamente; vuelve a aparecer al recuperar el calendario. Su campo **ID del calendario de destino** debe coincidir con **ID de ancla del calendario** si agregas nuevos módulos manualmente.

La migración de staging conserva el ID `calendar`, sus diez bloques, fechas, activaciones, colecciones, portadas y fecha de prueba. Copia los textos/fotos existentes a los módulos nuevos; no restaura los borradores iniciales del repositorio. En modo independiente, los campos integrados antiguos no se muestran en el editor, pero conservan sus datos para compatibilidad.

**Atención a la fecha de prueba:** el valor guardado en staging se conserva. Si el editor muestra un día distinto de hoy, vacía **Fecha de prueba (solo editor)** o elige el día que quieras revisar. No cambia el comportamiento de los visitantes.

La plantilla JSON de este ajuste contiene la configuración leída de **staging**. No copiarla directamente a producción: una futura promoción a main debe partir de la configuración actual de esa tienda para no trasladar sus datos de prueba.

## Fechas editables

- Usar siempre `AAAA-MM-DD` (por ejemplo, `2026-11-25`).
- El inicio y fin globales determinan las puertas visibles. Los títulos no contienen un número fijo de días.
- Cada bloque tiene su propio **Día de la promoción**, con vigencia de 00:00 a 23:59:59, hora de Colombia (`America/Bogota`).
- Cambiar el rango global **no desplaza** las fechas de los bloques existentes. Ajustarlas manualmente.
- No repetir fechas. Una fecha duplicada bloquea la oferta ambigua y muestra una advertencia en el editor.
- Las fechas inválidas o fuera de campaña también generan advertencias; un rango inválido no activa ofertas.

## Completar y publicar una promoción

Los diez bloques precargados están **desactivados por seguridad editorial**: faltan destinos y algunos descuentos aprobados. El orden y fechas son una propuesta inicial editable, no un calendario comercial inalterable.

Cada bloque necesita:

1. Fecha concreta.
2. Marca o título.
3. Descuento confirmado.
4. Colección o enlace alternativo. El enlace tiene prioridad si se completan ambos.
5. Casilla **Publicar promoción** activada.

Las condiciones son **opcionales**, según la decisión confirmada el 20 de noviembre. Si se agregan, se muestran en el detalle; si están vacías, no bloquean la oferta ni dejan un espacio vacío. Esto no modifica las condiciones o la programación del descuento real en Shopify.

La imagen del bloque es opcional. Se admiten destinos locales (`/collections/...`) o HTTPS; no se permiten enlaces ejecutables.

### Portadas y mosaico navideño

Cada bloque dispone de **Portada de la tarjeta**, diferente de **Imagen dentro de la sorpresa**. La portada es arte público: se ve también en fechas futuras, vencidas y borradores. No poner ahí un descuento que quieras mantener oculto. El detalle de la oferta solo se abre cuando está vigente y completo.

**Ajuste de portada** permite rellenar la tarjeta (recorta sus bordes) o mostrar la imagen completa. Los números, fechas y estados se dibujan por encima con fondo legible. Si la imagen falla, permanece la tarjeta de color y su número, sin icono de imagen rota.

El mosaico utiliza tarjetas cuadradas, anchas y altas y piezas decorativas sin número. Estas últimas no son promociones y nunca tienen hover ni clic. Solo la tarjeta de la oferta vigente tiene movimiento hover y abre la sorpresa; las demás fechas siguen bloqueadas.

Para decorar un día pendiente, agrega un bloque con fecha y portada y déjalo desactivado; no hace falta inventar marca o descuento. Sin portada propia aparece una ilustración navideña de la colección incluida. Una portada propia tiene prioridad y, si falla, vuelve a la ilustración/número.

El mosaico ahora se adapta a **cualquier rango de 1 a 31 días**. Cambiar de 15 a 19 días ya no lo convierte en una rejilla uniforme. Se conserva el orden de fechas y se añaden solo adornos no interactivos en espacios libres, sin inventar ofertas o días. Las fechas de los bloques no se desplazan automáticamente.

### Animaciones y accesibilidad

La oferta se abre con un giro suave tipo puerta (420ms) y se cierra en 140ms. El enlace se retira desde el inicio del cierre, y la caducidad no espera una animación para bloquearlo. Escape y el botón de cierre devuelven el foco a la tarjeta.

Con **Reducir movimiento** activado en el sistema, la apertura usa solo una opacidad breve y el cierre es inmediato. No hay partículas, bucles ni librerías de animación adicionales. El hover solo se aplica a la puerta vigente con mouse; las portadas en modo imagen completa no se amplían ni se recortan.

Si falta cualquiera de los campos obligatorios, el día actual aparece como **Sin oferta publicada**, sin botón de compra. No se sustituyen descuentos o condiciones con textos ficticios.

**Si activaste «Publicar promoción» y hoy no abre:** revisa la fecha del bloque, que esté dentro del rango y no esté duplicada; completa título, descuento y colección/enlace HTTPS válido. El diagnóstico del editor indica exactamente los campos faltantes. Tener condiciones vacías ya no bloquea la apertura. La fecha de prueba solo afecta al editor, no al enlace público.

| Fecha propuesta | Marca | Descuento recibido |
| --- | --- | --- |
| 23 noviembre | Aromáticas Hindú | Pendiente |
| 24 noviembre | La Constancia | Pendiente |
| 25 noviembre | Ranchera | 20% |
| 26 noviembre | Aguardiente Antioqueño | 30% |
| 27 noviembre | Pietrán | 20% |
| 28 noviembre | Colcafé y Chocolates Corona | 20% |
| 29 noviembre | Zenú | 20% |
| 30 noviembre | Saltín Noel–Ducales | Pendiente |
| 1 diciembre | Galletas Navideñas Noel | 10% |
| 2 diciembre | Juan Valdez | Pendiente |
| 3–7 diciembre | Sin promoción asignada | Pendiente |

Agregar las cinco ofertas faltantes con **Agregar bloque → Promoción diaria**. No es necesario modificar código.

## Prueba desde el editor

El campo **Fecha de prueba (solo editor)** permite simular un día. Vacío usa la fecha actual. El valor no se envía a la configuración pública de la sección y una URL pública no habilita promociones futuras.

Pruebas recomendadas: 22 noviembre, 23 noviembre, 30 noviembre, 1 diciembre, 7 diciembre y 8 diciembre. Para abrir una puerta durante la prueba, completar y habilitar su bloque. Revisar móvil, teclado, cierre con Escape y retorno del foco.

Una puerta activa abre el detalle; las futuras no son botones y las pasadas indican que la oferta finalizó. Al cambiar de día, la página recalcula estados y retira el enlace de un detalle que haya vencido.

## Los descuentos reales se configuran en Shopify

Esta landing **no modifica precios ni aplica descuentos**. Crear/programar cada promoción real en Shopify para los productos, porcentaje y vigencia aprobados. Comprobar la zona horaria configurada en la tienda al programarlos; debe coincidir con el día de campaña de Colombia.

La disponibilidad visual usa el reloj del navegador y no es una barrera de seguridad. La restricción de precio, la vigencia real y las reglas de checkout las controla Shopify. Cambiar la fecha de una puerta no reprograma un descuento del Admin.

Para aguardiente, agregar únicamente las condiciones y restricciones aprobadas por la tienda; no se incluyen textos legales inventados.

## Verificación técnica

Instalar dependencias de desarrollo con `npm ci` y ejecutar `npm test`. No se agregan dependencias de runtime al storefront.

`npm run preview:advent` sirve una vista local en `http://127.0.0.1:4179`. La ruta `/?scenario=active` existe **solo en ese servidor local** y muestra una promoción sintética para probar el diálogo; no forma parte del tema desplegado.

Para usar otro puerto sin interrumpir una vista previa existente: `ADVENT_PREVIEW_PORT=4182 npm run preview:advent`.

Las pruebas de Liquidjs y DOM no sustituyen la prueba en Shopify: el helper simula filtros de imágenes y URLs de assets. La vista local tampoco carga el header y footer completos de Shella. Tras sincronizar staging, comprobar la plantilla en el editor y una vista previa real antes de publicar.

## Procedencia de imágenes

- `advent-christmas-tree.jpg`: copia web de `124/arbol_navideno_supermu_300dpi.tif` aportada por el usuario.
- `advent-bunuelos.jpg`: copia web de `124/bunuelos_fondo_rojo_300dpi.tif` aportada por el usuario.
- Los originales se conservan en el ZIP; no se suben TIFF de impresión al tema. Procedencia embebida también en los JPEG.
