# 🎯 Sistema de Venta por Múltiples Unidades - IMPLEMENTADO

## ✅ Estado: LISTO PARA USAR

El sistema ya está completamente implementado en tu tema. Solo necesitas configurar los productos en Shopify Admin.

---

## 📦 Archivos Modificados

### 1. `snippets/calculate-pum.liquid`
**Mejora aplicada**: Ahora soporta metafields a nivel de variante (prioridad) o producto (fallback).

```liquid
{%- comment -%}
Antes: Solo leía metafields del producto
Ahora: Lee metafields de la variante primero, luego del producto
{%- endcomment -%}

{%- assign variant_factor = current_variant.metafields.custom.factor_unidad_de_medida.value -%}
{%- assign variant_unidad = current_variant.metafields.custom.unidad_de_medida_pum -%}
```

### 2. Archivos de Documentación Creados

| Archivo | Descripción |
|---------|-------------|
| `docs/guia-venta-por-unidades.md` | Guía completa paso a paso |
| `docs/metafields-setup-ejemplo.json` | Ejemplos de configuración JSON |
| `docs/calculadora-precios.html` | Calculadora interactiva |
| `docs/README-venta-por-unidades.md` | Este archivo |

---

## 🚀 Cómo Usar (Resumen Rápido)

### Para crear un producto con múltiples presentaciones:

**1️⃣ En Shopify Admin:**
```
Productos → Nuevo Producto
Nombre: "Tomate Rojo"
Agregar opción: "Presentación"
Valores: "1 Kilo", "1 Libra", "1 Unidad"
```

**2️⃣ Configurar precios de variantes:**
```
Variante "1 Kilo"   → $10.00
Variante "1 Libra"  → $4.54 (calculado: 10.00 × 0.45359)
Variante "1 Unidad" → $1.50 (precio fijo)
```

**3️⃣ Configurar metafields en cada variante:**

**Variante: 1 Kilo**
```
custom.factor_unidad_de_medida = "1,0"
custom.unidad_de_medida_pum = "kg"
```

**Variante: 1 Libra**
```
custom.factor_unidad_de_medida = "0,45359"
custom.unidad_de_medida_pum = "lb"
```

**Variante: 1 Unidad**
```
custom.factor_unidad_de_medida = "1,0"
custom.unidad_de_medida_pum = "unidad"
```

**4️⃣ Resultado en la tienda:**
- Selector con 3 opciones: "1 Kilo", "1 Libra", "1 Unidad"
- Precio cambia automáticamente al seleccionar
- PUM se calcula y muestra correctamente
- Los descuentos (rojo/verde) se aplican correctamente

---

## 🎨 Vista Previa del Resultado

### En la Página de Producto (PDP):

```
┌─────────────────────────────────────────┐
│  [Imagen del Producto]                  │
│                                         │
│  TOMATE ROJO                           │
│                                         │
│  Presentación:                         │
│  ┌─────────┬─────────┬─────────┐      │
│  │ 1 Kilo  │ 1 Libra │ 1 Unidad│      │
│  └─────────┴─────────┴─────────┘      │
│                                         │
│  $10.00                                │
│  🛒 $10.00/kg                          │
│                                         │
│  [- 1 +]  [Agregar al Carrito]        │
└─────────────────────────────────────────┘
```

### En Tarjetas de Colección:

```
┌──────────────────────┐
│  [Imagen]            │
│                      │
│  Tomate Rojo         │
│  $10.00              │
│  🛒 $10.00/kg        │
│                      │
│  [+ Agregar]         │
└──────────────────────┘
```

---

## 🧮 Usar la Calculadora de Precios

Abre el archivo `docs/calculadora-precios.html` en tu navegador:

```bash
open docs/calculadora-precios.html
```

O desde VS Code:
1. Click derecho en `calculadora-precios.html`
2. "Open with Live Server" o "Open in Browser"

La calculadora te ayudará a:
- Calcular automáticamente precios por libra
- Generar los valores de metafields
- Ver el resultado esperado del PUM

---

## 📊 Ejemplos Completos

### Ejemplo 1: Tomate (con precio fijo por unidad)

| Variante | Precio | Factor | Unidad | PUM sin Descuento |
|----------|--------|--------|--------|-------------------|
| 1 Kilo | $10.00 | 1,0 | kg | $10.00/kg |
| 1 Libra | $4.54 | 0,45359 | lb | $10.01/lb |
| 1 Unidad | $1.50 | 1,0 | unidad | $1.50/unidad |

### Ejemplo 2: Cebolla (con precio proporcional)

| Variante | Precio | Factor | Unidad | PUM sin Descuento |
|----------|--------|--------|--------|-------------------|
| 1 Kilo | $8.00 | 1,0 | kg | $8.00/kg |
| 1 Libra | $3.63 | 0,45359 | lb | $8.00/lb |
| 1 Unidad | $0.80 | 1,0 | unidad | $0.80/unidad |

---

## 🔧 Factores de Conversión Comunes

```javascript
// Copiar estos valores para metafield factor_unidad_de_medida

1 kilogramo = "1,0"
1 libra     = "0,45359"
1 onza      = "0,02835"
1 gramo     = "0,001"
```

**⚠️ IMPORTANTE:** Usar **COMA** como separador decimal, no punto.
- ✅ Correcto: `"0,45359"`
- ❌ Incorrecto: `"0.45359"`

---

## 🎯 Ventajas de Este Sistema

### ✅ Ventajas Técnicas
- Compatible con carrito nativo de Shopify
- Funciona con tu sistema de descuentos actual
- Inventario separado por variante
- SKUs únicos por presentación
- No requiere JavaScript adicional

### ✅ Ventajas de Negocio
- El cliente ve claramente el precio por unidad
- Puede elegir la presentación que prefiere
- El PUM se calcula automáticamente con descuentos
- Transparencia en los precios

### ✅ Ventajas de Mantenimiento
- Fácil de configurar
- Escalable a cientos de productos
- Documentación completa incluida
- Calculadora para facilitar el trabajo

---

## 📝 Checklist de Implementación

### Configuración de Metafields (Una sola vez)
- [ ] Ir a Shopify Admin → Settings → Metafields → Variants
- [ ] Crear definición: `custom.factor_unidad_de_medida` (Single line text)
- [ ] Crear definición: `custom.unidad_de_medida_pum` (Single line text)

### Por Cada Producto
- [ ] Crear producto en Shopify
- [ ] Agregar opción "Presentación" con valores
- [ ] Calcular y asignar precios a cada variante
- [ ] Configurar metafields en cada variante
- [ ] Probar en preview/staging
- [ ] Publicar

---

## 🚨 Solución de Problemas Comunes

### El PUM no se muestra
**Causa**: Metafields no configurados o en el lugar incorrecto
**Solución**: Verificar que los metafields estén en la **variante**, no en el producto

### El precio no cambia al seleccionar variante
**Causa**: Variantes con el mismo precio o JavaScript no cargado
**Solución**: Verificar precios diferentes y limpiar caché del navegador

### El selector no aparece
**Causa**: Producto con solo una variante o "Default Title"
**Solución**: Crear múltiples variantes con nombres descriptivos

### Error de formato en metafield
**Causa**: Usar punto en vez de coma como decimal
**Solución**: Cambiar `0.45359` por `0,45359`

---

## 📞 Soporte

### Archivos de Referencia
- **Guía completa**: `docs/guia-venta-por-unidades.md`
- **Ejemplos JSON**: `docs/metafields-setup-ejemplo.json`
- **Calculadora**: `docs/calculadora-precios.html`

### Archivos del Tema Involucrados
- `snippets/calculate-pum.liquid` - Calcula y muestra PUM
- `snippets/product-get-options.liquid` - Selector de variantes
- `snippets/product-res-variables.liquid` - Variables del producto
- `snippets/both-discount-labels.liquid` - Sistema de descuentos

---

## 🎓 Próximos Pasos Recomendados

1. **Crear definiciones de metafields** en Shopify Admin (10 min)
2. **Probar con 1 producto de ejemplo** usando la calculadora (15 min)
3. **Verificar funcionamiento** en staging (5 min)
4. **Configurar productos restantes** en batch (según cantidad)
5. **Sincronizar a producción** cuando esté listo

---

## 📈 Ejemplo de Workflow Diario

```bash
# Cuando agregas un nuevo producto:

1. Abrir calculadora-precios.html
2. Ingresar nombre y precio base por kilo
3. Copiar valores calculados
4. Crear producto en Shopify con esos datos
5. ✅ Listo!
```

---

**Desarrollado para**: Supermu Theme 2.4  
**Fecha**: Diciembre 2024  
**Estado**: ✅ Producción Ready
