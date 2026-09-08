# Evaluación de app para bolsa plástica

Fecha de investigación: 2026-09-08. Alcance: selección de una app pública para una tienda Shopify Advanced, canal Online Store en COP. No se instaló ninguna app, no se creó/activó ninguna regla y no se contactó soporte; por tanto, una afirmación pública de capacidad no equivale a una observación en esta tienda.

## Regla que se debe demostrar

La línea obligatoria debe ser una única variante de `Bolsa plástica`, a COP 200 por unidad, cuya cantidad sea `ceil(subtotal elegible original / COP 40.000)`, con cero bolsas cuando el subtotal es cero. El subtotal excluye bolsa, descuentos, envío, impuestos y propinas. Los casos que deben observarse son 0, 1, 40.000, 40.001, 60.000, 80.000 y 80.001 COP; además de descuentos, manipulación de línea, `/checkout`, checkout normal y Shop Pay.

## Matriz de capacidad y prueba

`NOT_TESTED` significa que no se observó el comportamiento en una instalación/regla aislada. Los enlaces son evidencia de capacidad declarada, no sustituyen la prueba requerida.

| Criterio | VOL | Magical | Evidencia |
|---|---|---|---|
| Fórmula ilimitada ceil(subtotal / 40.000) | NOT_TESTED — la ficha sólo declara reglas fijas y porcentuales con condiciones; no documenta redondeo hacia arriba ni tramos ilimitados. | NOT_TESTED — sus guías documentan cargo fijo/porcentaje, no `ceil` ni tramos ilimitados. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge) (consultado 2026-09-08, “Fixed & Percentage fee rules”); [guía Magical](https://www.magicalapps.com/setup/how-to-setup-magical-fees) (consultada 2026-09-08, importe fijo o porcentaje). |
| Subtotal antes de descuentos | NOT_TESTED — la fuente pública no precisa el momento de cálculo del subtotal. | NOT_TESTED — Magical declara que su `Subtotal` se calcula antes de descuentos, impuestos y envío, pero falta observarlo con el descuento de 15.000 COP en la tienda aislada. | [Guía Magical, “Order Fee Options”](https://www.magicalapps.com/setup/how-to-setup-magical-fees) (consultada 2026-09-08). |
| Excluye la propia bolsa | NOT_TESTED — no hay documentación pública de la exclusión/anti-recursión de una variante de tarifa. | NOT_TESTED — no hay documentación pública de la exclusión/anti-recursión de una línea de tarifa en esta fórmula. | Ninguna fuente pública localizada que documente esta propiedad para la regla requerida; requiere inspección de configuración y prueba. |
| Cantidad dinámica en una sola línea | NOT_TESTED — la ficha no confirma actualización de cantidad de una misma línea según `ceil`. | NOT_TESTED — la guía describe cargos por producto/cantidad, no la consolidación dinámica en una sola línea para subtotal por bloques. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge); [guía Magical, “Product Fee Options”](https://www.magicalapps.com/setup/how-to-setup-magical-fees) (consultadas 2026-09-08). |
| Cargo obligatorio protegido por Shopify Function | NOT_TESTED — la ficha declara “Protect required fees with checkout validation” y acceso a cart/checkout validations, pero no se verificó una Function activa para esta regla. | NOT_TESTED — la guía declara `Function Method`, pero no se observó una validación activa que fuerce la fórmula exacta. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge) (consultado 2026-09-08); [guía Magical, “Fee Method”](https://www.magicalapps.com/setup/how-to-setup-magical-fees) (consultada 2026-09-08). Shopify confirma que las Functions de validación bloquean reglas no cumplidas en servidor: [Shopify dev](https://shopify.dev/docs/apps/build/checkout/cart-checkout-validation). |
| Checkout normal | NOT_TESTED — la ficha declara compatibilidad con Checkout, sin una ejecución observada de los casos exigidos. | NOT_TESTED — la ficha declara cargos visibles en checkout, sin ejecución observada de los casos exigidos. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge); [Magical App Store](https://apps.shopify.com/magical-mandatory-fees) (consultadas 2026-09-08). |
| Shop Pay/pagos acelerados | NOT_TESTED — Shopify Functions de validación soportan express checkout, incluido Shop Pay, pero falta confirmar que VOL instala/activa esa Function y observar los intentos reales. | NO_CUMPLE_PARA_ADVANCED — la propia guía reserva la UI de checkout que “works with Shop Pay” para “Plus / Shopify Plus”; la tienda es Advanced. | [API Shopify de validación](https://shopify.dev/docs/api/functions/latest/cart-and-checkout-validation) (consultada 2026-09-08); [guía Magical, “Enable the Checkout UI Extension”](https://www.magicalapps.com/setup/how-to-setup-magical-fees) (consultada 2026-09-08). |
| Identificador estable distinto del título | NOT_TESTED — la ficha no identifica el producto/variante, atributo o metafield que cree la app. | NOT_TESTED — la documentación revisada no identifica el producto/variante, atributo o metafield que cree la app. | Requiere inspeccionar la línea de carrito/pedido y obtener el ID de variante, atributo o metafield en la instalación aislada. |
| Prueba aislada del tema publicado | NOT_TESTED — la ficha ofrece prueba de 7 días, pero no documenta aislamiento por tema/regla. | NOT_TESTED — App Store ofrece plan gratuito con todas las funciones para development stores, pero no existe una tienda de desarrollo o clon accesible ni se confirmó aislamiento de la regla comercial. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge) (consultado 2026-09-08); [Magical App Store](https://apps.shopify.com/magical-mandatory-fees) (consultado 2026-09-08, “Development stores: all features unlocked”). |
| Línea visible en pedido y reembolso | NOT_TESTED — VOL declara visualización clara antes de checkout, no evidencia observada del pedido ni de reembolso. | NOT_TESTED — Magical declara visibilidad en carrito, checkout y recibos, no evidencia observada del pedido ni de reembolso. | [VOL App Store](https://apps.shopify.com/product-fees-surcharge); [Magical App Store](https://apps.shopify.com/magical-mandatory-fees) (consultadas 2026-09-08). |

## Decisión

- Estado: NO-GO
- App seleccionada: Ninguna hasta completar todos los criterios obligatorios.
- Método de identificación de línea: BLOCKED_UNTIL_OBSERVED — debe ser ID de variante y, si está disponible, atributo o metafield administrado por la app; nunca sólo el título.
- Entorno de prueba: BLOCKED_UNTIL_ISOLATION_CONFIRMED — development store o clon de pruebas, o una segmentación/modo prueba demostrado que no cambie el tema/regla publicada.

## Evidencia, interpretación y límites

1. La plataforma permite una solución pública basada en Shopify Functions en Advanced: Shopify indica que las apps públicas con Functions están disponibles desde Basic; las apps personalizadas con Functions son sólo Plus. Eso satisface la restricción de plataforma, pero no prueba que una de estas apps implemente la regla. Ver [disponibilidad de apps de checkout](https://help.shopify.com/en/manual/checkout-settings/checkout-customization) (consultada 2026-09-08).
2. Shopify indica que Cart and Checkout Validation es el mecanismo de servidor para bloquear el progreso y que incluye Shop Pay, PayPal, Google Pay y Apple Pay. Esa es evidencia de plataforma, no de que VOL o Magical hayan activado su validación para esta configuración. Ver [API de validación](https://shopify.dev/docs/api/functions/latest/cart-and-checkout-validation) (consultada 2026-09-08).
3. VOL es el primer candidato: su ficha actual declara cargos obligatorios con validación de checkout, condiciones de carrito y autorización para editar cart transforms y validaciones. Sin embargo, no expone públicamente la fórmula de bloques, el subtotal original, la exclusión de su propia línea, el identificador estable ni la ruta de prueba aislada.
4. Magical está descartada para este objetivo en Advanced por su documentación de Shop Pay: su integración nativa de checkout/Shop Pay se documenta como Plus/Shopify Plus. Además, su guía para fees de método de pago indica que acelerados no aplican en no-Plus y exige ocultar botones dinámicos; no es una garantía aceptable para la regla obligatoria.
5. Las fichas de App Store y guías son declaraciones de producto. La compuerta exige observar todos los casos y manipulación de línea; no se puede marcar `Cumple` por marketing, permisos solicitados o compatibilidad genérica de Shopify.

## Siguiente acción requerida del usuario/controlador

1. Instalar VOL únicamente en una tienda de desarrollo o clon de pruebas (o demostrar por escrito una segmentación que no afecte la regla/tema publicado), sin activar una regla global de la tienda comercial.
2. Enviar a soporte de VOL, sin modificarlo, el caso exacto del brief y registrar la respuesta, URL/captura y fecha:

```text
Shopify plan: Advanced; channel: Online Store; currency: COP.
We must add a mandatory product line priced at COP 200 with quantity:
eligible subtotal 0 => 0;
1..40,000 => 1;
40,001..80,000 => 2;
80,001..120,000 => 3;
and continue indefinitely using ceil(original merchandise subtotal / 40,000).
The subtotal must be before discounts and must exclude the fee product itself.
Can your app enforce the exact quantity with Shopify checkout validation,
including Shop Pay and direct checkout, on Shopify Advanced?
How can we test without affecting the published theme?
Which product/variant ID, line attribute, or metafield identifies the fee line?
```

3. Sólo si la respuesta es afirmativa y la instalación aislada existe, ejecutar los casos de frontera, el descuento, cambios/eliminación de línea, `/checkout`, checkout normal, Shop Pay, pedido y reembolso. Si VOL falla cualquiera, no sustituirla por Magical en Advanced para este requisito; su propia documentación no cumple Shop Pay en ese plan.
