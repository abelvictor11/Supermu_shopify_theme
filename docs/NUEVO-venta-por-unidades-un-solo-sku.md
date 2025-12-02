# 🎯 Sistema de Venta por Presentaciones v3.0

## ⚠️ IMPORTANTE: Cambio de Enfoque

**Shopify NO soporta cantidades decimales** - redondea todo a enteros.
Por lo tanto, el enfoque de "convertir a kilos" (0.45359 kg para libra) **NO funciona**.

## ✅ Solución: Usar VARIANTS por Presentación

En lugar de un solo SKU con cantidades decimales, usamos **variants separados** para cada presentación.

---

## 📋 Configuración en Shopify Admin

### Paso 1: Crear la Opción "Presentación"

1. Ir a **Productos** → Seleccionar producto
2. En **Opciones** → Click "Agregar opciones"
3. Nombre de opción: `Presentación`
4. Valores: `Kilo`, `Libra`, `Unidad`

### Paso 2: Configurar Precios de Variants

| Variant | Precio | Cálculo |
|---------|--------|---------|
| **Kilo** | $7,500 | Precio base |
| **Libra** | $3,402 | $7,500 × 0.45359 |
| **Unidad** | $1,125 | $7,500 × 0.15 (peso promedio) |

### Paso 3: Configurar SKUs

Puedes usar el mismo SKU base con sufijo:
- Kilo: `LIMON-001-KG`
- Libra: `LIMON-001-LB`
- Unidad: `LIMON-001-UN`

---

## 🔧 Cómo Funciona el Código

### `snippets/unit-selector.liquid`

1. **Detecta** si el producto tiene opción "Presentación"
2. **Mapea** cada valor a su variant correspondiente
3. **Renderiza** botones con el precio de cada variant

### `assets/unit-selector.js` (v3.0)

1. **Al hacer clic** en una presentación:
   - Cambia el variant seleccionado
   - Actualiza el precio mostrado
   - Actualiza el `data-variant-id` en `.acciones`
2. **Al agregar al carrito**:
   - Se usa el variant correcto con su precio
   - Se agrega propiedad "Presentación" para referencia

---

## 🧪 Testing

1. Crear un producto de prueba con opción "Presentación"
2. Agregar variants: Kilo ($7,500), Libra ($3,402), Unidad ($1,125)
3. Ir a la página del producto o colección
4. Seleccionar "Libra"
5. Agregar al carrito
6. Verificar en carrito:
   - Precio: $3,402 ✅
   - Cantidad: 1 ✅
   - Presentación: Libra ✅

---

## 📝 Notas Técnicas

- El selector solo aparece si el producto tiene opción "Presentación"
- Soporta variaciones del nombre: "Presentación", "Presentacion"
- Soporta variaciones de valores: "Kilo/kg", "Libra/lb", "Unidad/un/und"
- Los variants no disponibles se muestran deshabilitados

---

# ~~Sistema Anterior (DEPRECADO)~~ 

> El sistema anterior intentaba usar cantidades decimales, pero Shopify las redondea a enteros.
> Se mantiene la documentación abajo solo como referencia histórica.

---

# ~~Sistema de Venta por Unidades - UN SOLO SKU~~ (NO FUNCIONA)

## ~~IMPORTANTE: Sistema Actualizado~~

~~Esta es la implementación correcta para integración con SIESA. **NO usar variantes de Shopify**.~~

---

## 🔧 Cómo Funciona

### El Problema
SIESA necesita que todos los productos lleguen en **kilos**, sin importar cómo los compre el cliente.

### La Solución
- ✅ **Un solo SKU** (el del kilo)
- ✅ **Selector de unidades** dinámico (no variantes)
- ✅ **Conversión automática** a kilos al agregar al carrito
- ✅ **Precio calculado** dinámicamente según la unidad

### Ejemplo Práctico

**Cliente selecciona:**
- Tomate → 1 Libra → Cantidad: 2

**Lo que se envía al carrito:**
```javascript
{
  variant_id: 123456789,  // SKU del kilo
  quantity: 0.90718,      // 2 × 0.45359 kg
  properties: {
    _unit: "lb",
    _multiplier: "0.45359"
  }
}
```

**Lo que ve SIESA:**
- Producto: Tomate (SKU-001)
- Cantidad: 0.90718 kg
- Precio unitario: $10.000/kg
- Total: $9.072

---

## 📋 Configuración del Producto en Shopify

### Paso 1: Crear el Producto Base

```
Nombre: Tomate Rojo
SKU: TOM-001
Precio: $10.000 (precio por kilo)
Inventario: 100 (kilos disponibles)
```

**NO crear variantes**. Solo la variante por defecto (Default Title).

### Paso 2: Configurar Metafields

Ir a **Productos** → Tu producto → Sección de **Metafields**:

#### Metafield 1: Habilitar Selector de Unidades
```
Namespace/Key: custom.allow_unit_selection
Type: Boolean
Value: TRUE
```

#### Metafield 2: Precio por Kilo
```
Namespace/Key: custom.price_per_kilo
Type: Number (integer)
Value: 1000000  (Precio en centavos: $10.000 = 1.000.000 centavos)
```

#### Metafield 3: Peso Promedio por Unidad
```
Namespace/Key: custom.unit_weight
Type: Number (decimal)
Value: 0.15  (Un tomate = 150g = 0.15 kg)
```

---

## 🧮 Cálculos Automáticos

### Conversión a Kilos

| Unidad | Multiplicador | Ejemplo | Resultado |
|--------|---------------|---------|-----------|
| **1 Kilo** | 1.0 | 2 kilos | 2.0 kg |
| **1 Libra** | 0.45359 | 2 libras | 0.90718 kg |
| **1 Unidad** | 0.15* | 2 unidades | 0.30 kg |

*Peso configurado en `custom.unit_weight`

### Cálculo de Precios

```javascript
Precio mostrado = precio_por_kilo × multiplicador

Ejemplos:
- Por Kilo:   $10.000 × 1.0     = $10.000
- Por Libra:  $10.000 × 0.45359 = $4.536
- Por Unidad: $10.000 × 0.15    = $1.500
```

---

## 🎨 Vista en la Tienda

### Tarjeta de Producto (Colección)

```
┌─────────────────────────────┐
│  [Imagen del Tomate]        │
│                             │
│  Tomate Rojo                │
│  $10.000                    │
│                             │
│  Presentación:              │
│  ┌─────────────────────────┐│
│  │ ■ Por Kilo    $10.000   ││
│  │ □ Por Libra    $4.536   ││
│  │ □ Por Unidad   $1.500   ││
│  └─────────────────────────┘│
│                             │
│  🛒 $10.000/kg              │
│                             │
│  [+ Agregar]                │
└─────────────────────────────┘
```

Cuando el usuario selecciona "Por Libra":
- El precio cambia a $4.536
- El botón "Agregar" añade 0.45359 kg al carrito
- SIESA recibe la cantidad en kilos

---

## 🔍 Crear Definiciones de Metafields

### Una sola vez en Shopify Admin

**Settings → Metafields → Products**

#### 1. Allow Unit Selection
```
Name: Permitir Selector de Unidades
Namespace and key: custom.allow_unit_selection
Type: Boolean
Description: Habilita el selector de kilo/libra/unidad para este producto
```

#### 2. Price Per Kilo
```
Name: Precio por Kilo
Namespace and key: custom.price_per_kilo
Type: Number - Integer
Description: Precio base por kilogramo en centavos (ej: 1000000 = $10.000)
```

#### 3. Unit Weight
```
Name: Peso por Unidad
Namespace and key: custom.unit_weight
Type: Number - Decimal
Description: Peso promedio de 1 unidad en kilogramos (ej: 0.15 = 150g)
```

---

## ✅ Configuración Paso a Paso

### Para Tomate Rojo

1. **Crear producto:**
   - Nombre: Tomate Rojo
   - SKU: TOM-001
   - Precio: $10.000
   - NO crear variantes adicionales

2. **Configurar metafields:**
   ```
   allow_unit_selection = TRUE
   price_per_kilo = 1000000  (10.000 × 100)
   unit_weight = 0.15  (150 gramos)
   ```

3. **Guardar y probar:**
   - Ver el producto en la tienda
   - Verificar que aparece el selector de unidades
   - Seleccionar "Por Libra" y agregar 1 al carrito
   - Verificar que se agregó 0.45359 kg

---

## 📊 Ejemplos de Configuración

### Ejemplo 1: Cebolla Blanca

```
Producto:
  Nombre: Cebolla Blanca
  SKU: CEB-001
  Precio: $8.000/kg

Metafields:
  allow_unit_selection: TRUE
  price_per_kilo: 800000
  unit_weight: 0.10  (100g por cebolla)

Resultado:
  Por Kilo:   $8.000
  Por Libra:  $3.629
  Por Unidad: $800
```

### Ejemplo 2: Zanahoria

```
Producto:
  Nombre: Zanahoria
  SKU: ZAN-001
  Precio: $5.000/kg

Metafields:
  allow_unit_selection: TRUE
  price_per_kilo: 500000
  unit_weight: 0.12  (120g por zanahoria)

Resultado:
  Por Kilo:   $5.000
  Por Libra:  $2.268
  Por Unidad: $600
```

---

## 🔧 Archivos del Sistema

| Archivo | Función |
|---------|---------|
| `snippets/unit-selector.liquid` | Renderiza el selector de unidades |
| `assets/unit-selector.js` | Lógica de conversión y precio dinámico |
| `layout/theme.liquid` | Carga el script |
| `snippets/product-collection.liquid` | Integra el selector en tarjetas |

---

## 🚨 Solución de Problemas

### El selector no aparece
**Causa**: Metafield `allow_unit_selection` no está en `TRUE`
**Solución**: Verificar que el metafield esté configurado como boolean TRUE

### El precio no cambia al seleccionar unidad
**Causa**: El script `unit-selector.js` no se cargó
**Solución**: 
1. Verificar consola del navegador
2. Limpiar caché
3. Verificar que el script esté en `assets/`

### Se agrega la cantidad incorrecta al carrito
**Causa**: El multiplicador no está correcto
**Solución**: Verificar en consola del navegador:
```javascript
[Unit Selector] Converting 1 → 0.45359 kg
```

### El peso por unidad está mal
**Causa**: Metafield `unit_weight` incorrecto
**Solución**: 
- Pesar el producto promedio en gramos
- Dividir por 1000 para obtener kg
- Ejemplo: 150g = 0.15 kg

---

## 🎓 Ventajas de Este Sistema

### Para SIESA
- ✅ Todo llega en kilos
- ✅ Un solo SKU por producto
- ✅ Inventario unificado
- ✅ Sin conversiones manuales

### Para el Cliente
- ✅ Puede elegir cómo comprar (kilo/libra/unidad)
- ✅ Ve el precio claro por cada opción
- ✅ Transparencia total

### Para Shopify
- ✅ Sin variantes innecesarias
- ✅ Inventario simple
- ✅ SEO optimizado (un solo producto)
- ✅ Fácil de mantener

---

## 📝 Checklist de Implementación

### Setup Inicial (una vez)
- [ ] Crear definiciones de metafields en Shopify Admin
- [ ] Verificar que los archivos estén subidos al tema
- [ ] Probar en staging antes de producción

### Por Cada Producto
- [ ] Crear producto con precio por kilo
- [ ] NO crear variantes adicionales
- [ ] Configurar metafield `allow_unit_selection = TRUE`
- [ ] Configurar metafield `price_per_kilo` (en centavos)
- [ ] Configurar metafield `unit_weight` (en kg)
- [ ] Probar en la tienda
- [ ] Verificar que la cantidad en carrito está en kilos

---

## 🔄 Flujo Completo

```
1. Cliente ve producto:
   - Tomate Rojo - $10.000

2. Cliente selecciona "Por Libra":
   - Precio cambia a $4.536
   - Selector marca "Por Libra" como activo

3. Cliente agrega 2 unidades:
   - JavaScript calcula: 2 × 0.45359 = 0.90718
   - Se envía al carrito: 0.90718 kg del SKU TOM-001

4. En el carrito:
   - Tomate Rojo (TOM-001)
   - Cantidad: 0.90718 kg
   - Precio: $9.072

5. En SIESA:
   - SKU: TOM-001
   - Cantidad: 0.90718 kg
   - Precio unitario: $10.000/kg
   - Total: $9.072
```

---

## 📞 Soporte

**Archivos del sistema:**
- Snippet: `snippets/unit-selector.liquid`
- JavaScript: `assets/unit-selector.js`
- Integración: `snippets/product-collection.liquid`

**Logs de debugging:**
Abrir consola del navegador (F12) y buscar:
```
[Unit Selector] Initializing...
[Unit Selector] Ready
[Unit Selector] Selected: lb (×0.45359)
[Unit Selector] Converting 2 → 0.90718 kg
```

---

**Desarrollado para**: Integración con SIESA  
**Fecha**: Diciembre 2024  
**Versión**: 2.0 - Un solo SKU
