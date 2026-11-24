# Header móvil en dos filas

Decisión aprobada: menú, logo, el mismo icono de Mi cuenta y carrito en la primera fila; buscador completo en la segunda.

## Implementación acotada

- Solo header tipo 6, hasta 1024px. El escritorio y los otros seis tipos no reciben reglas de layout nuevas.
- La omisión original estaba en el markup: el bloque móvil renderizaba solo `btn_cart_html`. Ahora también renderiza `btn_user_html`, sin copiar ni modificar su SVG morado, URL, tooltip, texto o flag de visibilidad.
- Las acciones móviles se sitúan antes del buscador en el DOM. Así el orden del teclado coincide con las filas, mientras que las acciones de escritorio permanecen después del buscador y el bloque móvil se oculta allí.
- Un único formulario de búsqueda conserva acción, query, prefijo, reset, contenedores de resultados y alternancia de predictive-search/search-form.
- Acciones táctiles de al menos 44px; búsqueda de 52px, texto de 16px para evitar el zoom automático de iOS y espacio reservado al botón. Se mantienen hooks del menú, carrito y sticky. No hay JavaScript, listeners, observers o timers nuevos.
- El contenedor del trigger de sidebar, ya vacío en móvil porque su botón es exclusivo de escritorio, deja de ocupar un hueco en la fila. El menú móvil nativo no se sustituye por otro menú.

No se cambian configuraciones del comerciante, iconos, logos, destinos, autenticación, popups ni carrito.

## Evidencia y límites

El fixture renderiza el branch tipo 6 y los captures reales del archivo Liquid, con los CSS base y utilidades reales de Shella, los CSS mobile/desktop, skin 7 y custom.css. Representa el estado normal tras la carga (`content-loaded`, `css-theme-loaded`, `font-base-loaded`, `css-full-loaded`). No es un clon del sitio completo: usa un logo de texto, configuración de prueba y no carga JavaScript de popups o resultados. La clase de carga no modifica la producción.

Se observó fallar la prueba de acciones móviles antes del ajuste. Después se verificaron URL/tooltip personalizados, SVG original, configuración apagada, URL por defecto, carrito desactivado y ambos modos de búsqueda. Suite completa: 127 pruebas sin fallos.

Chrome local: 320, 390, 768 y 1024px, una cuenta visible, búsqueda a ancho completo y scrollWidth igual al viewport. A 1025px las acciones móviles se ocultan y queda una sola cuenta visible. Se comprobó escritura en el input y que desactivar Mi cuenta elimina el enlace sin duplicar el formulario. Captura local: `header-two-rows-mobile.jpg` (fuera del repositorio).

Tras merge a staging, verificar con su configuración real: abrir menú y carrito, seguir la URL de cuenta configurada, respuesta de búsqueda predictiva, logo real, sticky al hacer scroll y retorno atrás/adelante. Esas integraciones no se declaran verificadas a partir de un fixture sin el JavaScript completo del tema. No se despliega directo ni se envía a main.

Theme Check no tiene hallazgos en los cuatro módulos de adviento ni el snippet de estilos. En el header informa 32 errores y 73 advertencias sobre líneas ya presentes en el commit anterior; no hay hallazgos sobre líneas añadidas/cambiadas. No se silenciaron ni se corrigieron indiscriminadamente, y no se declara limpio el tema entero.
