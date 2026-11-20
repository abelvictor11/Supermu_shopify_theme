# Refinamiento del calendario: mosaico y portadas

Referencia aprobada por petición explícita del usuario: mosaico navideño asimétrico con tarjetas numeradas, piezas decorativas y portadas editables. Se conservan fechas, vigencia diaria, cierre a medianoche y validación de ofertas completas.

La composición de 15 días usa cinco columnas y seis filas, con fechas anchas/altas y ocho piezas decorativas. Bajo 799 px se reorganiza en tres columnas. El orden visual de fechas sigue el calendario; no se usa auto-flow dense que lo altere. Para campañas de otra duración se evita reservar huecos para días que no existen.

El fondo continúa el rojo de campaña. Las tarjetas alternan menta (#8bd0a0), pino (#007b44), papel y dorado existentes. Se eliminan bordes perforados y dimensiones uniformes. Los radios siguen siendo suaves (12px), el gap principal es 14px y el padding de tarjeta 16px.

La revisión de accesibilidad ajustó el rojo local a #d4070a y el estado pequeño a papel: contraste de 5.10:1 para texto auxiliar. El dorado se reserva para títulos grandes y elementos no textuales (3.73:1 sobre rojo), no para estado pequeño.

Cada bloque tiene una portada pública (`cover_image`) y ajuste (`cover_fit`: cover/contain), independientes de la foto del detalle de oferta (`image`). El motor entrega únicamente cover y coverFit en la presentación de días bloqueados; no entrega el objeto offer a su renderizador. Una portada no revela ni activa por sí sola una promoción.

Solo las tarjetas que son botones de oferta vigente tienen hover, cursor de acción y apertura. Las piezas decorativas no son controles, no reciben foco y están ocultas a tecnologías de asistencia. Los días futuros/vencidos/borradores permanecen informativos y no hacen nada al pulsarlos.

La prueba local utiliza algunas fotografías existentes como ejemplos de portada, sin convertirlos en valores de las promociones comerciales. Las portadas reales quedan a elección del comerciante desde el editor. No se crean promociones o porcentajes.

## Movimiento solicitado el 20 de noviembre

Momento focal: la sorpresa se presenta como una puerta de papel que se abre por su borde izquierdo (420ms, desaceleración exponencial). El cierre dura 140ms y revoca inmediatamente el enlace, sin esperar al final visual. Backdrop breve de 180ms. El foco del diálogo sigue siendo nativo y regresa a la tarjeta al cerrar.

Continuidad: los días bloqueados y las piezas decorativas no se animan ni reciben interacción; no se añaden entradas en cada sección ni partículas. Hover solo en puntero fino: inclinación leve de la puerta vigente, cover ampliado 2.5% solo si usa ajuste cover, y desplazamiento de la flecha. Las imágenes contain conservan su encuadre completo.

Presupuesto: CSS transform/opacity y una animación de salida cancelable, sin librerías, bucles, observadores globales o timers de animación nuevos. El temporizador de vigencia existente no reinicia animaciones de página. Caducidad y desmontaje cancelan el cierre visual y cierran inmediatamente.

Movimiento reducido: apertura solo de opacidad de 80ms, sin giro ni hover espacial; cierre inmediato. APIs de animación ausentes/fallidas vuelven al cierre nativo. Escape, repetición de cierre y reapertura rápida tienen pruebas de regresión.

La documentación global del diseño del primer calendario se envió en el PR #300; si aún no está integrado, este registro no lo sustituye ni modifica otros estilos del tema.
