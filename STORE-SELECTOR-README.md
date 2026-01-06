# Selector de Tienda con Geolocalización

Sistema de selección de tienda inspirado en Walmart que permite al usuario elegir su tienda preferida con geolocalización automática y persistencia de la selección.

## 🎯 Características

- ✅ Modal de selección de tienda al entrar por primera vez
- 📍 Geolocalización para sugerir tienda más cercana
- 💾 Guarda la selección en localStorage (no pregunta siempre)
- 🔍 Búsqueda de tiendas por nombre, dirección o zona
- 🔄 Botón en el header para cambiar tienda cuando quiera
- 📱 Diseño responsive (móvil y desktop)
- 🎨 Estilos consistentes con Walmart/mejores prácticas

## 📁 Archivos Creados

### Assets
- `assets/store-selector.css` - Estilos del modal y componentes
- `assets/store-selector.js` - Lógica de geolocalización y persistencia

### Snippets
- `snippets/store-selector.liquid` - Modal de selección
- `snippets/store-selector-button.liquid` - Botón para el header

### Modificado
- `layout/theme.liquid` - Incluye CSS, JS y snippet del modal

## 🚀 Cómo Usar

### 1. El modal ya está integrado
El modal se muestra automáticamente la primera vez que un usuario visita el sitio (después de 1 segundo).

### 2. Agregar botón en el header

Para agregar el botón que permite cambiar de tienda en el header, agrega este código en `sections/header.liquid` donde quieras que aparezca:

```liquid
{% include 'store-selector-button' %}
```

**Ubicaciones sugeridas:**
- Junto al logo
- En la barra de navegación superior
- En el menú de utilidades (cuenta, carrito, etc.)

### 3. Configurar las tiendas

Las tiendas se obtienen automáticamente desde la página `/pages/tiendas` que usa la sección `store-directory`.

Asegúrate de tener configuradas las tiendas en:
- **Shopify Admin** → **Online Store** → **Pages** → **Tiendas**
- Cada tienda debe tener:
  - Nombre
  - Dirección
  - Zona (norte, sur, este, oeste, centro)
  - Latitud y Longitud (para geolocalización)
  - Logo (opcional)

## 🎨 Personalización

### Cambiar colores
Edita `assets/store-selector.css`:

```css
/* Color primario del botón "Usar mi ubicación" */
.btn-use-location {
  background: #0071dc; /* Cambiar aquí */
}

/* Color del botón "Seleccionar" */
.btn-select-store {
  background: #dd0a0a; /* Cambiar aquí */
}
```

### Cambiar tiempo de espera antes de mostrar
Edita `assets/store-selector.js` línea 33:

```javascript
setTimeout(() => {
  this.showModal();
}, 1000); // Cambiar tiempo en milisegundos
```

### Cambiar URL de tiendas
Edita `snippets/store-selector.liquid` línea 57:

```javascript
window.STORE_DIRECTORY_URL = '/pages/tu-pagina-de-tiendas';
```

## 📱 Comportamiento

1. **Primera visita**: Modal se muestra automáticamente
2. **Geolocalización**: Usuario puede dar permiso para encontrar tienda cercana
3. **Selección manual**: Usuario busca y selecciona tienda
4. **Persistencia**: Selección se guarda en localStorage
5. **Cambio**: Usuario puede cambiar tienda en cualquier momento clickeando el botón

## 🔧 localStorage

La tienda seleccionada se guarda como:

```javascript
{
  "id": "0",
  "name": "Intermedia",
  "zone": "norte",
  "address": "Cra. 27 #Sur-195 La Frontera, Envigado.",
  "latitude": "6.17591",
  "longitude": "-75.59174"
}
```

**Key**: `selected_store`

## 🌐 Eventos JavaScript

El sistema dispara un evento cuando se selecciona una tienda:

```javascript
window.addEventListener('storeSelected', (event) => {
  const store = event.detail;
  console.log('Tienda seleccionada:', store);
  // Tu código aquí
});
```

Esto permite integrar la selección con otros sistemas (envíos, disponibilidad, etc.)

## 🐛 Troubleshooting

### El modal no aparece
- Verifica que `/pages/tiendas` existe y tiene tiendas configuradas
- Revisa la consola del navegador para errores
- Asegúrate que `store-selector.js` se está cargando

### La geolocalización no funciona
- El usuario debe dar permiso de ubicación en el navegador
- HTTPS es requerido para geolocalización (funciona en desarrollo local)

### Las tiendas no se cargan
- Verifica que la página de tiendas tiene la sección `store-directory` configurada
- Cada tienda debe tener al menos nombre y dirección

## 📊 Próximas Mejoras Sugeridas

- [ ] Filtro por servicios disponibles (delivery, pickup, etc.)
- [ ] Mostrar horarios de la tienda seleccionada
- [ ] Integrar con sistema de inventario
- [ ] Alertas de disponibilidad por tienda
- [ ] Tracking analytics de tiendas más seleccionadas

## 🤝 Soporte

Para modificaciones o problemas, contacta al equipo de desarrollo.
