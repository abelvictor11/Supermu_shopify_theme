# 🐛 Problema: Precio en Carrito No Cambia

## 📋 Síntoma

- ✅ El precio **SÍ cambia visualmente** en la card/PDP al seleccionar Libra
- ❌ Al agregar al carrito, se agrega con el **precio original** (no el de Libra)
- ❌ El PUM no se actualizaba (YA CORREGIDO)

---

## 🔍 Causa Raíz

El producto está en **MODO FALLBACK**:
- Tiene metafield `custom.price_per_kilo`
- **NO tiene** opción "Presentación" con variants

### ¿Por qué no funciona el precio en carrito?

Shopify **NO permite cambiar el precio de un variant dinámicamente**. 

Cuando agregas al carrito:
- Se envía el `variant_id`
- Shopify busca ese variant en su base de datos
- Usa el **precio registrado** en ese variant
- Ignora cualquier precio enviado por JavaScript

**El único way es usar VARIANTS diferentes** para cada presentación.

---

## ✅ Solución: Usar MODO VARIANTS

### Paso 1: Configurar en Shopify Admin

1. **Ir al producto** que tiene el problema
2. **Agregar una nueva opción:**
   - Nombre: `Presentación`
   - Valores: `Kilo`, `Libra`, `Unidad`

Esto creará 3 variants automáticamente.

### Paso 2: Configurar precios de cada variant

Ejemplo: Si el precio base por kilo es **$7,500**:

| Variant | Precio | Cálculo |
|---------|--------|---------|
| **Kilo** | $7,500 | Precio base |
| **Libra** | $3,402 | $7,500 × 0.45359 |
| **Unidad** | $1,125 | $7,500 × 0.15 (peso promedio) |

**Calculadora:**
```
Libra = Precio_Kilo × 0.45359
Unidad = Precio_Kilo × Peso_Unidad_en_KG
```

### Paso 3: Configurar SKUs (opcional)

```
Kilo:   LIMON-001-KG
Libra:  LIMON-001-LB
Unidad: LIMON-001-UN
```

O puedes usar el mismo SKU para todos.

### Paso 4: SYNC en Shopify

1. Guardar producto
2. Hacer SYNC en Shopify Admin (Themes)
3. Recargar página de prueba

### Paso 5: Testear

1. Ir al producto
2. Seleccionar "Libra"
3. Verificar que precio cambia a $3,402
4. Agregar al carrito
5. **Verificar en carrito:**
   - ✅ Precio: $3,402
   - ✅ Cantidad: 1
   - ✅ Presentación: Libra

---

## 📊 Comparación de Modos

### MODO FALLBACK (actual - con metafield)
```
❌ Precio en carrito: INCORRECTO
✅ Selector visual: Funciona
✅ PUM: Se actualiza (después del fix)
⚠️  Propiedad "Presentación": Se envía pero precio no coincide
```

### MODO VARIANTS (recomendado)
```
✅ Precio en carrito: CORRECTO
✅ Selector visual: Funciona
✅ PUM: Se actualiza
✅ Propiedad "Presentación": Se envía y precio coincide
```

---

## 🔧 Migración de Productos Existentes

### Opción A: Migrar uno por uno
1. Seleccionar productos con `price_per_kilo`
2. Agregar opción "Presentación"
3. Configurar precios de variants
4. Testear

### Opción B: Mantener ambos (temporal)
- Productos viejos: Siguen con metafield (selector visual funciona)
- Productos nuevos: Usar variants (precio en carrito correcto)
- Ir migrando gradualmente

---

## ❓ FAQ

### ¿Puedo eliminar el metafield después de agregar variants?
✅ Sí, una vez que el producto tenga opción "Presentación", el metafield ya no es necesario.

### ¿Qué pasa si un producto tiene AMBOS (variants + metafield)?
El sistema prioriza los variants. El metafield será ignorado.

### ¿El PUM se actualiza ahora?
✅ Sí, después del fix el PUM se actualiza correctamente en ambos modos.

### ¿Por qué no simplemente enviar un precio custom al carrito?
Shopify no lo permite. El precio de un line item SIEMPRE es el del variant registrado en la base de datos. No hay workaround para esto.

### ¿Los clientes verán un error?
No. En MODO FALLBACK:
- El selector funciona visualmente
- El precio mostrado es el calculado
- Pero al agregar al carrito, Shopify usa el precio del variant principal
- El cliente verá un precio diferente en el carrito

Por eso es **crítico** migrar a MODO VARIANTS.

---

## 📝 Checklist de Migración

Para el producto de ejemplo (Limón):

- [ ] Crear opción "Presentación" con valores: Kilo, Libra, Unidad
- [ ] Configurar precios:
  - [ ] Kilo: $7,500
  - [ ] Libra: $3,402
  - [ ] Unidad: (calcular según peso)
- [ ] Configurar SKUs (opcional)
- [ ] Guardar producto
- [ ] SYNC en Shopify
- [ ] Testear en staging:
  - [ ] Seleccionar Libra en PDP
  - [ ] Verificar precio cambia a $3,402
  - [ ] Agregar al carrito
  - [ ] Verificar precio en carrito es $3,402
- [ ] Testear en cards de colección
- [ ] Si todo funciona, eliminar metafield `price_per_kilo` (opcional)

---

## 🎯 Resultado Esperado

Después de migrar a MODO VARIANTS:

```javascript
// Usuario selecciona "Libra"
variant_seleccionado = {
  id: 45678,
  title: "Libra",
  price: 340200 // $3,402 en centavos
}

// Se agrega al carrito
cart_item = {
  variant_id: 45678,
  quantity: 1,
  properties: {
    "Presentación": "Libra"
  }
}

// Shopify calcula el precio
line_item_price = variants[45678].price // = $3,402 ✅
```

---

**Fix aplicado:** Actualización de PUM en modo fallback  
**Próximo paso:** Migrar productos a MODO VARIANTS  
**Fecha:** Diciembre 2, 2024
