# Mi Cartelera Personal

Aplicación web para buscar películas y series reales en TMDB y guardar una colección personal por usuario. El acceso usa Supabase Auth y los títulos se guardan en PostgreSQL con Row Level Security.

## Tecnologías

- React 19 y TypeScript, empaquetados con Vite
- React Router para las pantallas y la protección de rutas
- Supabase Auth y PostgreSQL
- API de TMDB para búsqueda, pósteres, sinopsis, elenco y calificación oficial
- CSS propio, sin framework de interfaz

## Requisitos previos

- Node.js 20 o superior y npm
- Un proyecto de Supabase
- Una cuenta de TMDB con una clave de lectura

La aplicación no incluye credenciales. Hay que crearlas y pegarlas en un archivo `.env` local.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar Supabase

Estos pasos son manuales. El código no puede crear el proyecto ni ejecutar el SQL en tu cuenta.

1. Crea un proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. En **Authentication → Sign In / Providers**, deja activado el proveedor Email.
3. En **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Añade `http://localhost:5173` a las Redirect URLs.
4. Si quieres entrar justo después de registrarte, en **Authentication → Sign In / Providers → Email** desactiva **Confirm email**. Si la dejas activa, la aplicación pide confirmar el correo antes de iniciar sesión.
5. En **Project Settings → API** copia:
   - Project URL
   - la clave **anon** pública (JWT con `role: "anon"`) o la clave **publishable** (`sb_publishable_...`)
6. No copies la clave **service_role** ni una clave `sb_secret_`. El cliente la rechaza y no debe estar en el frontend.

### Ejecutar el SQL

1. Abre **SQL Editor → New query**.
2. Pega el contenido de [`supabase/mi_lista.sql`](supabase/mi_lista.sql).
3. Pulsa **Run**.
4. Comprueba en **Table Editor** que existe `public.mi_lista` y que **RLS** está activado.
5. Deben existir cuatro políticas para el rol `authenticated`:
   - `mi_lista_select_propios`
   - `mi_lista_insert_propios`
   - `mi_lista_update_propios`
   - `mi_lista_delete_propios`

Cada política exige `auth.uid() = user_id`. En `INSERT` y `UPDATE`, `WITH CHECK` impide crear o ceder filas a otro usuario. No hay políticas para `anon`, así que sin sesión la base rechaza el acceso. La restricción `mi_lista_usuario_tmdb_unico` impide que la misma cuenta guarde dos veces el mismo `tmdb_id`.

Si la API responde que no encuentra la tabla, espera unos segundos a que se actualice la caché del esquema y vuelve a intentarlo. Para recrear la tabla desde cero, descomenta el `drop table` del inicio del SQL, ejecútalo y vuelve a correr el archivo. Eso borra los datos de la colección.

## 3. Obtener la clave de TMDB

1. Crea una cuenta en [themoviedb.org](https://www.themoviedb.org/).
2. En **Settings → API** solicita una clave de API.
3. Usa la **API Key** (v3) o el **API Read Access Token**.
4. No actives permisos de escritura. La aplicación solo lee el catálogo público.

## 4. Variables de entorno

```bash
# En Windows PowerShell también puedes copiar el archivo así:
copy .env.example .env
```

Edita `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon_o_publishable
VITE_TMDB_API_KEY=tu_api_key_de_tmdb
```

`.env` está en `.gitignore`. No lo subas al repositorio.

Las variables `VITE_*` se incorporan al JavaScript del navegador. No ocultan la clave: cualquiera puede verlas en el código descargado y en las peticiones. Por eso solo deben contener la clave pública de Supabase y una clave de lectura de TMDB. Una variable de Vite no convierte una clave en un secreto.

Opcionalmente puedes definir `VITE_TMDB_BASE_URL` y `VITE_TMDB_IMAGE_BASE`. Si no están, se usan `https://api.themoviedb.org/3` y `https://image.tmdb.org/t/p`.

Reinicia `npm run dev` después de cambiar `.env`.

## 5. Arrancar la aplicación

```bash
npm run dev
```

Abre la URL que muestra Vite, normalmente `http://localhost:5173`.

- `/login` y `/registro` son públicas.
- `/`, `/mi-lista` y `/titulo/:tipo/:tmdbId` exigen una sesión.
- Dentro de la aplicación, el botón **Cerrar sesión** permanece visible.

Si faltan variables, la pantalla correspondiente explica qué completar. No se muestran películas ni listas inventadas.

## Verificaciones

```bash
npm run lint
npm run build
```

`npm run build` ejecuta el comprobador de TypeScript (`tsc -b`) y después el build de producción. `npm run lint` ejecuta Oxlint.

Para previsualizar el build:

```bash
npm run preview
```

## Qué hace cada pantalla

- **Registro e inicio de sesión:** crean y recuperan la sesión con Supabase Auth. La sesión se guarda en el navegador y se refresca sola.
- **Buscar:** consulta `/search/multi` de TMDB y muestra póster, título y año cuando existe.
- **Detalle:** carga ficha, sinopsis, elenco y calificación oficial. Si el título no está en tu lista, puedes agregarlo. Si ya está, puedes editar estado, calificación personal (1 a 5 o vacía) y comentario, o eliminarlo después de confirmar.
- **Mi lista:** lee solo las filas del usuario autenticado y permite abrir, editar y eliminar.

Los estados válidos son exactamente **Por ver**, **Viendo** y **Vista** (`por_ver`, `viendo`, `vista`). Esas reglas están en TypeScript y en los `CHECK` de PostgreSQL.

## Seguridad

- El frontend usa únicamente la clave pública de Supabase. Si detecta `service_role` o `sb_secret_`, no crea el cliente.
- Las consultas filtran por `user_id`, y además RLS debe estar aplicado en el proyecto. El filtro del navegador no sustituye a las políticas.
- Las actualizaciones solo envían estado, calificación y comentario. No envían un `user_id` distinto.
- Antes de insertar, el código valida tipo, estado, nota y póster. La base vuelve a validarlos.
- La calificación oficial de TMDB y la valoración personal se muestran en bloques separados.

TMDB reutiliza números entre películas y series. La restricción pedida es única por `user_id` y `tmdb_id`, sin incluir el tipo. Si un identificador ya está en la cuenta, el otro tipo no se puede guardar y la ficha lo explica.

## Estructura

```text
src/components   Interfaz reutilizable, sesión y rutas
src/pages        Login, registro, búsqueda, lista y detalle
src/context      Estado de autenticación
src/services     CRUD de mi_lista
src/lib          Clientes de Supabase y TMDB, validación
src/types        Tipos de la colección y de TMDB
supabase/mi_lista.sql
.env.example
```

## Atribución

Los datos de películas y series provienen de TMDB. Esta aplicación no está avalada ni certificada por TMDB.
