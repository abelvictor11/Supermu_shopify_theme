# Cobro obligatorio de bolsa plástica — Diseño

## Objetivo

Aplicar en el canal de venta online de Supermu un cobro obligatorio de 200 COP por cada bloque de hasta 40.000 COP del subtotal de productos, calculado antes de descuentos. El cobro debe aparecer como una línea identificable en carrito, checkout y pedido, y no debe poder omitirse mediante checkout directo o acelerado.

## Alcance

- Repositorio: `abelvictor11/Supermu_shopify_theme`.
- Rama inicial de despliegue: `staging`.
- Canal incluido: Online Store, incluidos checkout normal y pagos acelerados soportados por la app elegida.
- Canales excluidos por ahora: Shopify POS, pedidos creados directamente en Admin/API, suscripciones y edición posterior de pedidos.
- Este diseño cubre selección/configuración de la app, configuración comercial y adaptación visual del tema. La publicación en producción requiere una aprobación posterior.

## Regla de negocio

La cantidad requerida se calcula así:

```text
subtotal_elegible = suma de precios originales de las líneas de productos,
                    sin descuentos, sin la bolsa, sin envío,
                    sin impuestos y sin propinas

si subtotal_elegible = 0:
  bolsas_requeridas = 0
si subtotal_elegible > 0:
  bolsas_requeridas = ceil(subtotal_elegible / 40.000)

cobro_bolsas = bolsas_requeridas * 200 COP
```

La propia bolsa se excluye siempre del subtotal elegible para evitar recursión. Las promociones y códigos de descuento no reducen el número requerido de bolsas.

### Casos de frontera

| Subtotal elegible | Bolsas | Cobro |
|---:|---:|---:|
| 0 COP | 0 | 0 COP |
| 1 COP | 1 | 200 COP |
| 40.000 COP | 1 | 200 COP |
| 40.001 COP | 2 | 400 COP |
| 60.000 COP | 2 | 400 COP |
| 80.000 COP | 2 | 400 COP |
| 80.001 COP | 3 | 600 COP |

## Restricción de plataforma

La tienda usa Shopify Advanced. En este plan, una app personalizada de distribución privada no puede aportar Shopify Functions; la garantía en servidor debe provenir de una app pública instalada desde Shopify App Store. El tema por sí solo puede sincronizar una línea mediante Ajax, pero no puede garantizar que el comprador no eluda la regla.

## Arquitectura aprobada

### 1. Aplicación pública como autoridad

Se evaluará primero `VOL Product Fees & Surcharges`, y como alternativa `Magical Fees & Tariffs`. La selección no se basará solo en la descripción comercial: durante el periodo de prueba, la app debe demostrar que puede:

1. Representar exactamente `ceil(subtotal_elegible / 40.000)` sin un límite artificial de tramos.
2. Usar el subtotal anterior a descuentos.
3. Excluir la línea de bolsa del cálculo.
4. Mantener una cantidad dinámica de bolsas al añadir, quitar o cambiar productos.
5. Proteger el cargo mediante validación del lado de Shopify.
6. Cubrir checkout estándar y pagos acelerados usados por la tienda.
7. Exponer el cargo como línea clara en carrito, checkout, pedido, reembolsos e informes.

Si VOL no cumple todas las condiciones, se probará Magical. Si ninguna cumple, se detiene el despliegue y se presenta evidencia antes de considerar otra app o una solución exclusiva de tema con garantías reducidas.

### 2. Producto de bolsa

La app utilizará una variante dedicada con estas propiedades:

- Título visible: `Bolsa plástica`.
- Precio unitario: 200 COP.
- No publicada en navegación, búsqueda, colecciones, recomendaciones ni venta rápida.
- No elegible para descuentos.
- Inventario no rastreado o con política de continuar vendiendo, para que una falta de inventario administrativo no bloquee pedidos.
- Configuración tributaria confirmada por el responsable contable de Supermu antes de producción.
- Identificación estable por ID de variante y, si la app lo permite, por metafield o atributo administrado por la app; nunca únicamente por el texto del título.

### 3. Tema como capa de presentación

El tema no calculará una segunda fuente de verdad ni añadirá una bolsa paralela. Sus responsabilidades serán:

- Renderizar la línea como `Bolsa plástica obligatoria`.
- Mostrar `1 bolsa por cada $40.000 o fracción`.
- Ocultar controles de cantidad y eliminación únicamente para la variante identificada de la bolsa.
- Mostrar el subtotal de la línea (`cantidad × 200 COP`).
- Reflejar los cambios tanto en `snippets/cart.liquid` como en `snippets/popup-cart.liquid` y sus fragmentos Ajax relacionados.
- Evitar que la bolsa infle el contador del encabezado; el contador representará unidades de productos comprados.
- Bloquear temporalmente los botones de checkout mientras la app indique o el carrito evidencie una sincronización pendiente.
- Usar URLs Ajax sensibles al locale mediante `window.Shopify.routes.root`.
- Mantener accesibilidad: estado de actualización anunciado con `aria-live`, controles realmente deshabilitados y mensajes comprensibles sin depender solo del color.

No se ocultará el costo: la bolsa permanecerá visible en carrito, checkout y pedido.

## Flujo de datos

1. El comprador modifica productos en el carrito.
2. La app recalcula el subtotal elegible antes de descuentos.
3. La app crea o actualiza una única línea de bolsa con la cantidad requerida.
4. Shopify devuelve el carrito actualizado.
5. El tema vuelve a renderizar carrito principal, carrito lateral, totales y contador de productos.
6. Al iniciar o completar checkout, la validación de la app comprueba nuevamente la regla.
7. Si la cantidad no coincide, Shopify bloquea el avance y muestra un mensaje accionable.

## Estados y errores

- **Sin productos:** no existe línea de bolsa.
- **Sincronizando:** checkout deshabilitado y texto `Actualizando…`.
- **Sincronización correcta:** se muestra una sola línea con cantidad exacta.
- **Líneas duplicadas:** la app debe consolidarlas o rechazar checkout hasta corregirlas.
- **Bolsa eliminada/manipulada:** la app la restaura o la validación bloquea checkout.
- **Error recuperable:** `No pudimos actualizar el valor de las bolsas. Intenta nuevamente.` y botón para reintentar.
- **Regla desactivada o no verificable durante pruebas:** no se habilita el despliegue. En operación, se monitorean pedidos para detectar cualquier ausencia o cantidad incorrecta; no se confiará en que el tema pueda detectar por sí solo una Function desactivada.
- **Moneda distinta de COP:** fuera de alcance; la regla debe activarse únicamente en COP salvo aprobación futura.

## Configuración y operación

Las reglas de una app pueden ser globales para la tienda y no necesariamente pueden limitarse a un tema de staging. Antes de activar una regla en la tienda comercial se debe confirmar que la app ofrece modo de prueba, segmentación segura o previsualización sin afectar el tema publicado. Si no existe aislamiento fiable, la prueba funcional inicial se hará en una tienda de desarrollo o clon de pruebas; la regla no se activará en la tienda comercial hasta que la adaptación del tema esté lista y exista una ventana de despliegue coordinada.

La configuración debe registrar:

- ID de variante de la bolsa.
- Precio esperado: 200 COP.
- Tamaño del bloque: 40.000 COP.
- Moneda: COP.
- Canal: Online Store.
- Estado de la regla.

Se documentará cómo pausar la regla, revisar pedidos con bolsa y detectar discrepancias entre subtotal elegible y cantidad cobrada.

## Validación

### Pruebas funcionales mínimas

- Todos los casos de frontera de la tabla.
- Descuento de productos: 50.000 COP originales y 15.000 COP de descuento deben conservar 2 bolsas.
- Cambio de 40.001 a 40.000 COP debe reducir de 2 a 1.
- Cambio de 80.000 a 80.001 COP debe aumentar de 2 a 3.
- Eliminar todos los productos debe eliminar la bolsa.
- Intentar eliminar o cambiar manualmente la bolsa.
- Recargar la página durante una actualización.
- Carrito principal, carrito lateral y navegación móvil.
- Checkout normal, Shop Pay y los demás métodos acelerados habilitados.
- Acceso directo a `/checkout` con bolsa ausente o incorrecta.
- Aplicación de códigos y descuentos automáticos.
- Pedido final, correo de confirmación, reembolso e informes.

### Criterios de aceptación

- Cero pedidos online pueden completarse con cantidad de bolsas inferior o superior a la fórmula.
- El valor unitario es siempre 200 COP.
- Los descuentos no alteran la cantidad calculada ni descuentan la bolsa.
- La línea es visible y comprensible antes del pago.
- El comprador no puede editarla desde las interfaces del tema.
- No hay bucles Ajax, líneas duplicadas ni saltos incorrectos en el contador.
- La desinstalación o indisponibilidad de la app tiene un procedimiento de contingencia documentado.

## Despliegue

1. Instalar la app sin activar una regla global y configurar la variante de bolsa.
2. Confirmar cómo aísla las pruebas. Si no puede aislarlas del tema publicado, ejecutar la prueba de capacidad en una tienda de desarrollo o clon de pruebas.
3. Descartar la app si falla cualquiera de las condiciones obligatorias.
4. Adaptar el tema en una rama derivada de `staging` solo después de seleccionar la app.
5. Publicar en el tema de staging y completar la matriz de pruebas con la regla aislada.
6. Revisar con operaciones y contabilidad.
7. Coordinar la activación global de la regla y la publicación del tema para evitar periodos con cobro sin presentación o presentación sin validación.
8. Solicitar aprobación explícita antes de promover a producción.

## Fuera de alcance

- POS y pedidos creados directamente en Admin/API.
- Construcción/publicación de una app pública propia.
- Modificación de tarifas de envío.
- Cobro porcentual en lugar de cantidades enteras de bolsa.
- Inventario de bolsas por ubicación.
- Despliegue directo en producción.
