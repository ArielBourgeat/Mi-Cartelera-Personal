# Estado inicial

Este documento describe Mi Cartelera Personal tal como está antes de la épica Noche de película. No propone cambios. La deuda de abajo se registra y no se corrige aquí.

## Qué hace:

Una persona crea una cuenta, busca películas y series en TMDB y guarda una colección propia. Cada título tiene estado Por ver, Viendo o Vista, una calificación personal del 1 al 5 o vacía, y un comentario opcional. La ficha separa los datos de TMDB (sinopsis, elenco, nota oficial, dónde verla) de lo que guarda el usuario.

Las rutas están en `src/App.tsx`:

- `/login` y `/registro` solo sin sesión (`GuestRoute`).
- `/`, `/mi-lista` y `/titulo/:tipo/:tmdbId` solo con sesión (`ProtectedRoute`).
- Cualquier otra ruta vuelve a `/`.

La portada muestra un fondo de fotogramas, el carrusel Latest films y el catálogo Check it all. La búsqueda de la barra superior sustituye esa portada por los resultados. Mi lista filtra por estado, ordena y resume pendientes, en progreso y vistas.

## Stack

React 19, TypeScript estricto y Vite. El enrutado es React Router. La sesión y la colección usan Supabase Auth y PostgreSQL. El catálogo usa la API de TMDB. Los estilos son CSS propio en `src/index.css`, con Archivo y Archivo Narrow. No hay Bootstrap, Vitest, Prettier aplicado al código existente, ni una carpeta `src/dominio/`. El lint es Oxlint. El build es `tsc -b` y después Vite.

Las claves viven en `.env`, que no está en el repositorio. El ejemplo solo tiene marcadores. El cliente de `src/lib/supabase.ts` rechaza `service_role` y `sb_secret_`.

## Mapa

- `src/context/AuthProvider.tsx` recupera la sesión, inicia, registra y cierra. El callback de `onAuthStateChange` solo guarda la sesión.
- `src/services/collection.ts` hace el CRUD de `mi_lista`. El update solo envía estado, calificación y comentario.
- `src/lib/validation.ts` repite en TypeScript los rangos de la base.
- `src/lib/tmdb.ts` busca, lista populares y estrenos, y pide el detalle. El detalle no lee `runtime`.
- `supabase/mi_lista.sql` crea la tabla, los `check`, el único `(user_id, tmdb_id)` y cuatro políticas RLS: select, insert, update y delete. Cada una exige `auth.uid() = user_id`. Insert y update tienen `with check`.

## Inconsistencias

El enunciado de Noche de película nombra Bootstrap como el sistema del Proyecto 3. Este repositorio no lo instala ni lo usa. La interfaz se construyó con clases propias.

Los rótulos de la portada y de la ficha mezclan inglés y español: Latest films, Check it all, Where to watch y Sinopsis conviven con el resto de la interfaz en español.

Hay dos validaciones de la colección, una en TypeScript y otra en SQL. Pueden desviarse si una cambia y la otra no.

TMDB reutiliza identificadores entre películas y series. La restricción única no incluye el tipo, así que el mismo número no puede guardarse dos veces aunque el tipo sea distinto.

El cliente de Supabase no tiene tipos generados. Las filas se interpretan a mano en `parseRow`.

## Riesgos

Las variables `VITE_*` quedan dentro del JavaScript que descarga el navegador. Ocultar una fila con un filtro en el cliente no protege los datos. La protección real es RLS, y esa política tiene que estar aplicada en el proyecto de Supabase. El código no puede crearla.

El commit `66de496` guardó en `.env.example` una URL real de Supabase, la clave anon y la clave de TMDB. Los commits posteriores las sustituyeron por marcadores, pero siguen en el historial. Rotarlas queda pendiente.

Confirmar el correo al registrarse no se decide en el código. Es un interruptor del panel de Supabase. Si está activo, el registro no devuelve sesión.

Una película puede no traer duración en TMDB. Hoy la app ni siquiera la pide. Noche de película no puede calcular si algo cabe hasta que esa duración exista, y una película sin ella no se podrá agregar.

## Deuda pendiente

No se corrige en este checkpoint.

1. No hay Bootstrap, aunque el enunciado lo da por existente.
2. No hay tests con Vitest ni una función pura de dominio.
3. El detalle de TMDB no guarda la duración (`runtime`).
4. La unicidad `(user_id, tmdb_id)` no distingue película de serie.
5. El cliente de Supabase no tiene tipos generados.
6. Las claves del primer commit siguen en el historial de git.
7. La interfaz mezcla inglés y español en los rótulos de sección.
8. Prettier queda instalado para el hook del agente. El código ya escrito no se reformatea.
9. El aviso de tamaño del bundle de Vite (Supabase y React en un solo archivo) no se trata.
