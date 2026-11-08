# Mi Cartelera Personal

Aplicación existente de React, TypeScript y Vite. No se reescribe.

## Regla

Ninguna funcionalidad sin spec. Antes de escribir código nuevo, la spec vive en `docs/specs/` y nombra el criterio que cubre. Un cambio de comportamiento sin esa spec no se implementa.

## Claves

- Nunca poner `service_role` ni una clave `sb_secret_` en el frontend ni en el repositorio.
- `.env` no se commitea. `.env.example` solo tiene marcadores.
- Las variables `VITE_*` se incluyen en el JavaScript del navegador. No son secretos. Solo la clave pública anon o publishable, y una clave de lectura de TMDB.

## Dónde está lo que ya existe

- Cliente y rechazo de claves privilegiadas: `src/lib/supabase.ts`
- CRUD de la colección: `src/services/collection.ts`
- Tabla, checks y RLS: `supabase/mi_lista.sql`
- Diseño: `DESIGN.md`. Las specs de interfaz lo citan por nombre y no copian sus valores.

## Límites

No corregir la deuda de `docs/ESTADO-INICIAL.md` salvo que una spec lo pida. No introducir Bootstrap ni otra librería de interfaz.
