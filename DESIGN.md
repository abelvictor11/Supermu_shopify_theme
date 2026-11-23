---
name: Supermú — campaña de Navidad
description: Registro visual de la landing de calendario; no redefine el tema global de tienda.
colors:
  campaign-red: "#ed080b"
  wine: "#501526"
  deep-wine: "#36111d"
  paper: "#fff5ef"
  gold: "#f7cf90"
  ink: "#451021"
typography:
  display:
    fontFamily: "Work Sans, sans-serif"
    fontSize: "clamp(44px, 5.2vw, 76px)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.04em"
  accent:
    fontFamily: "Advent Dry, Work Sans, sans-serif"
    fontSize: "1.35em"
    fontWeight: 400
    lineHeight: 1.03
  body:
    fontFamily: "Work Sans, sans-serif"
    fontSize: "18px"
    lineHeight: 1.65
rounded:
  control: "6px"
  door: "14px"
  dialog: "16px"
spacing:
  door-gap: "18px"
  door-padding: "20px"
  section-top: "84px"
components:
  campaign-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 24px"
  active-door:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.door}"
---

# Design System: Supermú — campaña de Navidad

## Overview

**Creative North Star: "Una Navidad que se comparte en la mesa"**

Este registro describe exclusivamente la nueva landing del calendario. Hereda el nombre y la fotografía de campaña de Supermú; no autoriza aplicar sus estilos a páginas existentes ni cambiar header, footer o carrito.

**Key Characteristics:**
- Fotografía real de alimentos compartidos.
- Rojo de campaña a escala de página y vino para el calendario.
- Fechas visibles y numeración de una secuencia real.
- Disponibilidad explícita, nunca comunicada solo por color.

## Colors

El rojo corresponde a hero y cierre; el vino contiene el calendario. Papel y dorado separan información y día actual del fondo oscuro. Tinta se usa sobre superficies claras. Las fotografías conservan su color propio.

**The Scoped Tokens Rule.** La fuente ejecutable es `assets/advent-calendar.css`, variables `--advent-*` bajo `.advent`; este documento refleja sus valores. No crear variables globales del tema para esta campaña.

## Typography

La familia de cuerpo es Work Sans, ya utilizada por el tema. El acento utiliza el recurso existente `assets/Dry.woff` mediante el nombre local Advent Dry; no se añade un proveedor de fuentes externo. Las puertas usan cifras tabulares. Los títulos se equilibran y pueden romper líneas en móvil.

## Layout

Hero con texto y árbol gastronómico; calendario de cinco columnas, tres bajo 1050 px y dos bajo 799 px. Bajo 479 px, el hero se apila. Contenedores fluidos con ancho de contenido de 1280 px y márgenes mínimos; imágenes con geometría reservada. El documento conserva el scroll natural.

## Elevation & Depth

Puertas planas con borde y perforación interior. Sombra únicamente en el diálogo elevado: `0 24px 80px #24071366`. Fondo modal oscuro con transparencia. No se añaden halos ni sombras a cada puerta.

## Shapes

Controles suavemente redondeados, puertas con radio mayor y diálogo de esquinas suaves. Los símbolos son SVG pequeños y consistentes, no ilustraciones ni iconos de texto.

## Components

Las puertas futuras y vencidas son informativas; solo una promoción completa y vigente ofrece botón. La puerta actual usa dorado y texto de estado. El detalle es un diálogo nativo con cierre, navegación por teclado, foco de retorno y enlace retirado al vencer.

El único gesto de apertura es una rotación breve del detalle; movimiento reducido la elimina sin perder contenido o interacción. El foco visible no depende del hover. Las acciones tienen estados hover y active y mínimo táctil suficiente.

## Do's and Don'ts

- **Do** conservar fotografías de campaña optimizadas y su procedencia.
- **Do** mostrar fecha, estado y condiciones en texto.
- **Do** mantener todos los estilos y listeners limitados a la landing.
- **Don't** publicar un borrador como oferta activa ni completar datos comerciales ficticios.
- **Don't** usar el bloqueo visual como sustituto de la programación de descuentos en Shopify.
