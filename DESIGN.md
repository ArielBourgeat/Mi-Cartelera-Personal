# Diseño

Este archivo es la fuente del sistema visual de Mi Cartelera Personal. Una spec de interfaz lo cita por nombre y no copia sus valores.

Bootstrap no está instalado. La interfaz usa CSS propio en `src/index.css`. Introducir Bootstrap u otra librería de interfaz queda prohibido hasta que una spec lo pida y se retire esta prohibición.

## Criterios

- `D-color-tinta`: el fondo de la barra y el texto principal usan la tinta.
- `D-color-azul`: los rótulos de sección y el título de la sinopsis usan el azul.
- `D-color-amarillo`: el botón primario y la cinta del menú usan el amarillo.
- `D-tipo-display`: los títulos usan Archivo Narrow.
- `D-tipo-texto`: el texto corrido usa Archivo.
- `D-boton-primario`: el botón primario es amarillo con texto en tinta y borde en tinta.
- `D-boton-peligro`: el botón de eliminar es tinta con texto amarillo.
- `D-poster`: el póster conserva proporción 2:3 y borde en tinta.
- `D-ficha`: la ficha de un título es una hoja blanca con borde en tinta.

## Color

| Token      | Valor     | Uso                     |
| ---------- | --------- | ----------------------- |
| tinta      | `#0a0a0a` | Barra, texto, bordes    |
| fondo      | `#f7f7f4` | Página                  |
| superficie | `#ffffff` | Hojas, tarjetas, campos |
| azul       | `#2f5bff` | Rótulos y «Sinopsis»    |
| amarillo   | `#ffe14a` | Acción primaria y cinta |
| apagado    | `#4d4d4d` | Texto secundario        |
| peligro    | `#9d1c2c` | Error de formulario     |

No se agregan colores fuera de esta tabla.

## Tipografía

Archivo para el texto. Archivo Narrow para títulos, logo y rótulos. Los títulos van en mayúsculas cuando ya lo hace la pantalla actual. No se carga otra familia.

## Componentes que ya existen

- Barra negra fija. Búsqueda a la izquierda, logo al centro, enlaces a la derecha. Al pasar el cursor, el enlace se vuelve una cinta amarilla.
- Botón primario, botón secundario (blanco con borde en tinta) y botón de peligro.
- Póster con proporción 2:3. En el catálogo, la imagen empieza apagada y recupera el color al pasar el cursor, con un degradado oscuro abajo para el título.
- Ficha: póster, sinopsis y una banda inferior con la valoración.
- Campos con borde en tinta y altura mínima de 44 px.
- Tarjeta de la lista con borde en tinta.

## Prohibido

- Copiar un valor de este archivo dentro de una spec de interfaz.
- Inventar un color, una fuente o un botón que no esté descrito aquí.
- Instalar Bootstrap u otra librería de interfaz.
- Sustituir el CSS actual por un framework en un cambio que no tenga spec.
