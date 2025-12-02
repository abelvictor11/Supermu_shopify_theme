# 📦 Guía: Venta de Productos por Múltiples Unidades de Medida

## 🎯 Objetivo
Permitir vender verduras y otros productos con diferentes presentaciones (kilo, libra, unidad) usando variantes de Shopify.

---

## 📋 Paso 1: Crear Variantes en Shopify

### Ejemplo: Tomate

1. Ve a **Productos** → **Tomate** (o crea uno nuevo)
2. En la sección **Variantes**, haz clic en **Agregar opción**
3. Configura:
   - **Nombre de opción**: `Presentación`
   - **Valores**: `1 Kilo`, `1 Libra`, `1 Unidad`
4. Guarda el producto

Shopify creará automáticamente 3 variantes.

---

## 💰 Paso 2: Configurar Precios

### Cálculo de Precios por Unidad

Si el precio base de **1 Kilo = $10.00**:

| Variante | Precio | Cálculo |
|----------|--------|---------|
| **1 Kilo** | $10.00 | Precio base |
| **1 Libra** | $4.54 | `10.00 × 0.45359` (factor kg→lb) |
| **1 Unidad** | $1.50 | Precio fijo según tamaño promedio |

### Factores de Conversión Comunes

```
1 libra (lb) = 0.45359 kg
1 onza (oz) = 0.02835 kg
1 gramo (g) = 0.001 kg
```

---

## 🏷️ Paso 3: Configurar Metafields para PUM

El PUM (Precio por Unidad de Medida) se calcula automáticamente usando metafields.

### Metafields Necesarios

Configura estos metafields **EN CADA VARIANTE**:

#### Variante: "1 Kilo"
- **Namespace/Key**: `custom.factor_unidad_de_medida`
  - **Tipo**: Single line text
  - **Valor**: `1,0` (usa coma como decimal)
  
- **Namespace/Key**: `custom.unidad_de_medida_pum`
  - **Tipo**: Single line text
  - **Valor**: `kg`

#### Variante: "1 Libra"
- **Namespace/Key**: `custom.factor_unidad_de_medida`
  - **Tipo**: Single line text
  - **Valor**: `0,45359`
  
- **Namespace/Key**: `custom.unidad_de_medida_pum`
  - **Tipo**: Single line text
  - **Valor**: `lb`

#### Variante: "1 Unidad"
- **Namespace/Key**: `custom.factor_unidad_de_medida`
  - **Tipo**: Single line text
  - **Valor**: `1,0`
  
- **Namespace/Key**: `custom.unidad_de_medida_pum`
  - **Tipo**: Single line text
  - **Valor**: `unidad`

### Cómo Agregar Metafields en Shopify

1. Ve a **Configuración** → **Metafields** → **Variantes**
2. Crea las definiciones si no existen:
   - `custom.factor_unidad_de_medida` (Single line text)
   - `custom.unidad_de_medida_pum` (Single line text)
3. Ve al producto → Selecciona una variante → Edita los metafields
4. Repite para cada variante

---

## 🧮 Paso 4: Cómo Funciona el Cálculo de PUM

El snippet `calculate-pum.liquid` hace lo siguiente:

1. **Detecta descuentos activos** (rojo/verde)
2. **Calcula el precio final** (con descuento si aplica)
3. **Obtiene los metafields** de la variante seleccionada
4. **Calcula el PUM**: `precio_final ÷ factor`

### Ejemplo Real

**Producto**: Tomate - Variante "1 Kilo"
- Precio original: $10.00
- Descuento activo: 25% (verde)
- Factor: 1,0
- Unidad: kg

**Cálculo**:
```
1. Precio con descuento = 10.00 × (1 - 0.25) = $7.50
2. PUM = 7.50 ÷ 1.0 = $7.50/kg
```

**Producto**: Tomate - Variante "1 Libra"
- Precio original: $4.54
- Descuento activo: 25% (verde)
- Factor: 0,45359
- Unidad: lb

**Cálculo**:
```
1. Precio con descuento = 4.54 × (1 - 0.25) = $3.41
2. PUM = 3.41 ÷ 0.45359 = $7.52/lb
```

---

## ✅ Paso 5: Verificar Funcionamiento

### En el Tema
1. Abre el producto en la tienda
2. Verifica que aparezcan las 3 variantes en el selector
3. Cambia entre variantes
4. El precio debe actualizarse automáticamente
5. El PUM debe mostrarse correctamente bajo el precio

### Checklist
- [ ] Variantes creadas y con precios correctos
- [ ] Metafields configurados en cada variante
- [ ] Selector de variantes visible en PDP
- [ ] Precio cambia al seleccionar variante
- [ ] PUM se actualiza correctamente
- [ ] Descuentos se aplican correctamente
- [ ] Funciona en tarjetas de colección

---

## 🔧 Archivos del Tema Involucrados

| Archivo | Propósito |
|---------|-----------|
| `snippets/calculate-pum.liquid` | Calcula y renderiza el PUM |
| `snippets/product-get-options.liquid` | Muestra el selector de variantes |
| `snippets/product-get-variants.liquid` | Select oculto para el formulario |
| `snippets/product-res-variables.liquid` | Define `current_variant` |
| `snippets/product-collection.liquid` | Tarjeta de producto en colección |
| `snippets/product-page-get-info.liquid` | Página de producto (PDP) |

---

## 🎨 Personalización del Selector

Por defecto, las variantes se muestran como botones o dropdown según la configuración del tema.

### Cambiar Estilo del Selector

En **Configuración del Tema** → **Opciones de Producto**, puedes configurar:
- Botones con texto (por defecto)
- Dropdown/Select
- Botones grandes
- Círculos de color/imagen

Para la opción "Presentación", recomendamos **botones con texto** o **dropdown**.

---

## 🚨 Troubleshooting

### El PUM no se muestra
- ✅ Verifica que los metafields estén en la **variante**, no en el producto
- ✅ Verifica que uses **coma** como separador decimal: `0,45359` no `0.45359`

### El precio no cambia al seleccionar variante
- ✅ Verifica que las variantes tengan precios diferentes
- ✅ Limpia el caché del navegador

### El selector no aparece
- ✅ Verifica que el producto tenga más de una variante
- ✅ Verifica que las variantes no se llamen "Default Title"

---

## 📊 Ejemplo Completo: Cebolla

### Configuración del Producto

**Producto**: Cebolla Blanca
**SKU Base**: CEBO-001

| Variante | SKU | Precio | Factor | Unidad |
|----------|-----|--------|--------|--------|
| 1 Kilo | CEBO-001-KG | $8.00 | 1,0 | kg |
| 1 Libra | CEBO-001-LB | $3.63 | 0,45359 | lb |
| 1 Unidad | CEBO-001-UN | $0.80 | 1,0 | unidad |

### Resultados Esperados

**Sin descuento**:
- 1 Kilo: $8.00 → PUM: $8.00/kg
- 1 Libra: $3.63 → PUM: $8.00/lb
- 1 Unidad: $0.80 → PUM: $0.80/unidad

**Con 25% descuento**:
- 1 Kilo: $6.00 → PUM: $6.00/kg
- 1 Libra: $2.72 → PUM: $6.00/lb
- 1 Unidad: $0.60 → PUM: $0.60/unidad

---

## 💡 Consejos

### Para Inventario
- Mantén inventarios separados por variante
- Usa SKUs distintos para cada presentación

### Para Imágenes
- Asigna imágenes específicas a cada variante si es necesario
- Ejemplo: foto con balanza para "1 Kilo", foto con unidad para "1 Unidad"

### Para SEO
- Usa títulos descriptivos: "Tomate Rojo - 1 Kilo" en vez de solo "1 Kilo"
- El título del producto puede ser simplemente "Tomate Rojo"

---

## 🔄 Workflow de Actualización

### Al agregar un nuevo producto:
1. Crear producto base
2. Agregar variantes de presentación
3. Calcular y asignar precios
4. Configurar metafields PUM en cada variante
5. Probar en staging
6. Sincronizar a producción

---

## 📞 Soporte Técnico

Si encuentras problemas con la implementación, revisa:
1. Esta guía
2. Los archivos en `snippets/calculate-pum.liquid`
3. La consola del navegador para errores de JavaScript

**Desarrollado para**: Supermu Theme 2.4
**Última actualización**: Diciembre 2024
