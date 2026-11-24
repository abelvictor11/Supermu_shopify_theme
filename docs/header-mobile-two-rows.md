# Header móvil en dos filas

Referencia final del usuario (24 de noviembre): menú y logo a la izquierda; registro, favoritos, Mi cuenta y carrito a la derecha; buscador completo en la segunda fila. Se mantienen los iconos, destinos, comportamientos y controles existentes.

## Implementación acotada

- Solo header tipo 6, hasta 1024px. El escritorio y los otros seis tipos no reciben reglas de layout nuevas.
- La omisión original estaba en el markup: el bloque móvil renderizaba solo `btn_cart_html`. Ahora reutiliza `btn_registro_html`, `btn_wishlist_html`, `btn_user_html` y `btn_cart_html` en ese orden. No copia ni modifica sus SVG, URL, tooltip, texto, apertura en otra pestaña, popup o flag de visibilidad. Un acceso apagado sigue apagado.
- Las acciones móviles se sitúan antes del buscador en el DOM. Así el orden del teclado coincide con las filas, mientras que las acciones de escritorio permanecen después del buscador y el bloque móvil se oculta allí.
- Un único formulario de búsqueda conserva acción, query, prefijo, reset, contenedores de resultados y alternancia de predictive-search/search-form.
- Acciones táctiles de al menos 44px; búsqueda de 52px, texto de 16px para evitar el zoom automático de iOS y espacio reservado al botón. Se mantienen hooks del menú, carrito y sticky. No hay JavaScript, listeners, observers o timers nuevos.
- El contenedor del trigger de sidebar, ya vacío en móvil porque su botón es exclusivo de escritorio, deja de ocupar un hueco en la fila. El menú móvil nativo no se sustituye por otro menú.

No se cambian configuraciones del comerciante, iconos, logos, destinos, autenticación, popups ni carrito.

## Evidencia y límites

El fixture renderiza el branch tipo 6 y los captures reales del archivo Liquid, con los CSS base y utilidades reales de Shella, los CSS mobile/desktop, skin 7 y custom.css. Representa el estado normal tras la carga (`content-loaded`, `css-theme-loaded`, `font-base-loaded`, `css-full-loaded`). No es un clon del sitio completo: usa un logo de texto, configuración de prueba y no carga JavaScript de popups o resultados. La clase de carga no modifica la producción.

Se observaron fallar las pruebas de acciones móviles y del orden de los cuatro accesos antes de sus respectivos ajustes. Después se verificaron URL/tooltip personalizados, SVG original, registro en otra pestaña, popup de favoritos, configuración apagada, URL por defecto, carrito desactivado y ambos modos de búsqueda. Suite completa: 129 pruebas sin fallos.

La referencia de cuatro accesos exige reservar 248px al dimensionar el logo y eliminar su margen derecho móvil heredado. Así caben cuatro áreas de 44px con separación de 4px, menú de 44px y logo de 52px en los 300px interiores de una pantalla de 320px. Registro conserva su fondo e ilustración originales, con padding móvil de 4px en vez de su padding asimétrico de escritorio.

Chrome local: 320, 390, 768 y 1024px, una cuenta visible, búsqueda a ancho completo y scrollWidth igual al viewport. A 1025px las acciones móviles se ocultan y queda una sola cuenta visible. Se comprobó escritura en el input y que desactivar Mi cuenta elimina el enlace sin duplicar el formulario. Captura local: `header-two-rows-mobile.jpg` (fuera del repositorio).

La comprobación de la referencia final conserva cuatro accesos en la misma fila a 320/390/768/1024px, todos de 44x44px, sin desbordamiento; a 1025px se oculta el bloque móvil. Se comprobó escritura en el único buscador. Captura: `header-four-actions-mobile.jpg` fuera del repositorio. La vista local sigue usando un logo de texto y configuración de carrito de prueba; no pretende reproducir esos datos de la tienda. No se cambia el calendario.

Detector Impeccable: un hallazgo `side-tab` en custom.css:1393 (`border-left: 3px solid #FF0000`), ya existente y ajeno al header. Se deja en pie, sin suprimirlo ni ampliar esta tarea. Ningún hallazgo en las líneas nuevas del ajuste.

Tras merge a staging, verificar con su configuración real: abrir menú y carrito, seguir la URL de cuenta configurada, respuesta de búsqueda predictiva, logo real, sticky al hacer scroll y retorno atrás/adelante. Esas integraciones no se declaran verificadas a partir de un fixture sin el JavaScript completo del tema. No se despliega directo ni se envía a main.

Theme Check no tiene hallazgos en los cuatro módulos de adviento ni el snippet de estilos. En el header informa 32 errores y 73 advertencias sobre líneas ya presentes en el commit anterior; no hay hallazgos sobre líneas añadidas/cambiadas. No se silenciaron ni se corrigieron indiscriminadamente, y no se declara limpio el tema entero.
