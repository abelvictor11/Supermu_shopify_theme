# 🔍 Análisis Completo del Selector de Unidades

## Estado Actual (Staging - PR #149 mergeado)

### ✅ Archivos en su lugar:
- `snippets/unit-selector.liquid` - Renderiza el selector
- `assets/unit-selector.js` - Lógica JavaScript v3.0
- `layout/theme.liquid` - Carga el script
- `snippets/product-collection.liquid` - Llama al selector en cards
- `snippets/product-page-get-info.liquid` - Llama al selector en PDP

### 📋 Cómo Funciona:

El selector tiene **DOS MODOS**:

#### 1. MODO VARIANTS (Recomendado) ✅
**Requisito:**
- El producto debe tener una opción llamada "Presentación" (o "Presentacion")
- Con valores: Kilo, Libra, Unidad (o kg, lb, un/und)

**Comportamiento:**
- Se renderizan botones para cada variant
- Al hacer clic, cambia el variant seleccionado
- El precio en carrito ES CORRECTO
- Usa `data-use-variants="true"`

**Ejemplo de producto:**
```
Producto: Limón
Opción: Presentación
Variants:
  - Kilo: $7,500
  - Libra: $3,402  
  - Unidad: $1,125
```

#### 2. MODO FALLBACK (Solo Visual) ⚠️
**Requisito:**
- El producto NO tiene opción "Presentación"
- PERO tiene metafield `custom.price_per_kilo`

**Comportamiento:**
- Se renderizan botones calculados desde price_per_kilo
- Al hacer clic, solo actualiza precio visual
- El precio en carrito NO cambia (limitación Shopify)
- Usa `data-use-variants="false"`

**Ejemplo de producto:**
```
Producto: Tomate
Metafields:
  - custom.price_per_kilo: 1000000 (=$10,000)
  - custom.unit_weight: 0.15
Cálculos:
  - Kilo: $10,000
  - Libra: $4,536 (×0.45359)
  - Unidad: $1,500 (×0.15)
```

---

## 🐛 Posibles Problemas y Soluciones

### Problema 1: El selector NO aparece

**Causa probable:**
El producto NO cumple ninguno de los requisitos:
- NO tiene opción "Presentación"
- NO tiene metafield `price_per_kilo`

**Solución:**
Agregar al menos uno de los dos requisitos al producto.

**Cómo verificar:**
1. Agregar `{% render 'unit-selector-debug', product: product, variant: current_variant %}` justo antes del unit-selector
2. Ver el diagnóstico en la página
3. Verificar qué requisitos faltan

---

### Problema 2: El selector aparece pero el precio en carrito es incorrecto

**Causa probable:**
El producto está en MODO FALLBACK (solo tiene metafield, no tiene variants)

**Solución:**
Convertir el producto a MODO VARIANTS:
1. Ir a Productos → Editar producto
2. Agregar opción "Presentación" con valores: Kilo, Libra, Unidad
3. Configurar precio de cada variant
4. Eliminar metafield `price_per_kilo` (opcional)

---

### Problema 3: El JavaScript no se carga

**Verificar:**
1. Abrir DevTools → Console
2. Buscar: `[Unit Selector v3] Loading...`
3. Si NO aparece, verificar que `theme.liquid` tenga:
   ```liquid
   <script src="{{ 'unit-selector.js' | asset_url }}" defer></script>
   ```

---

## 🧪 Testing Checklist

### Preparación:
- [ ] SYNC Shopify con GitHub staging
- [ ] Recargar página (Ctrl+F5 o Cmd+Shift+R)

### Test 1: Producto con VARIANTS
- [ ] Crear producto de prueba con opción "Presentación"
- [ ] Agregar 3 variants: Kilo ($7,500), Libra ($3,402), Unidad ($1,125)
- [ ] Ir a colección o PDP
- [ ] Verificar que aparece el selector con 3 botones
- [ ] Hacer clic en "Libra"
- [ ] Verificar que precio cambia a $3,402
- [ ] Agregar al carrito
- [ ] Verificar en carrito: Precio $3,402, Cantidad 1, Presentación: Libra ✅

### Test 2: Producto con METAFIELD (fallback)
- [ ] Crear producto sin opción "Presentación"
- [ ] Agregar metafield `custom.price_per_kilo` = 1000000
- [ ] Ir a colección o PDP
- [ ] Verificar que aparece el selector
- [ ] Hacer clic en "Libra"
- [ ] Verificar que precio visual cambia
- [ ] Agregar al carrito
- [ ] ⚠️ Verificar en carrito: Precio será del variant principal (NO $4,536)

### Test 3: Producto SIN requisitos
- [ ] Crear producto normal sin opción "Presentación" ni metafield
- [ ] Ir a colección o PDP
- [ ] Verificar que NO aparece el selector ✅

---

## 🔧 Debugging

### 1. Agregar diagnóstico temporal
```liquid
{%- comment -%} En product-collection.liquid, línea 247 {%- endcomment -%}
{% render 'unit-selector-debug', product: product, variant: current_variant %}
{% render 'unit-selector', product: product, variant: current_variant, context: 'collection' %}
```

### 2. Ver logs en consola
Abrir DevTools → Console y buscar:
```
[Unit Selector v3] Loading...
[Unit Selector v3] Initializing X selector(s)
[Unit Selector v3] Context: collection, UseVariants: true/false
[Unit Selector v3] Selected: Libra, Variant: 123456
```

### 3. Inspeccionar HTML
Buscar en el HTML:
```html
<div class="unit-selector" 
     data-product-id="..." 
     data-variant-id="..."
     data-use-variants="true/false">
```

---

## 📊 Resumen de Cambios (PR #147 y #149)

### PR #147: Sistema v3.0 con Variants
- ✅ Nuevo enfoque usando variants de Shopify
- ✅ Detecta automáticamente opción "Presentación"
- ✅ Cambia variant al seleccionar
- ✅ Precio correcto en carrito

### PR #149: Agregar Modo Fallback
- ✅ Soporta productos con metafield `price_per_kilo`
- ✅ Selector visual funciona
- ⚠️ Precio en carrito no se actualiza (limitación Shopify)

---

## 🎯 Recomendación

**Para productos nuevos:**
Usar MODO VARIANTS (opción "Presentación" con variants)

**Para productos existentes:**
- Si tienen `price_per_kilo`: El selector seguirá funcionando visualmente
- Para precio correcto en carrito: Migrar a variants

---

## 📞 Próximos Pasos

1. **SYNC en Shopify** después de mergear PR
2. **Testear** con productos de prueba
3. **Documentar** proceso de migración para productos existentes
4. **Configurar** productos de producción con variants

---

**Última actualización:** Diciembre 2, 2024  
**Versión:** 3.0 con Modo Fallback
