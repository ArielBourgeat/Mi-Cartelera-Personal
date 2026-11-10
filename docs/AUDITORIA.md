# Auditoría de Noche de película

Segunda pasada el 9 de noviembre de 2026, con la tabla ya creada en Supabase. `npm test` sigue en 9 de 9. `docs/VERIFICACION.md` es la pasada anterior, cuando la tabla todavía no existía. Aquí se repitió el guardado.

La cuenta del recorrido es `noche-verificacion-1794275008560@example.com`. Una segunda cuenta, con correo que empieza por `noche-otra-` y termina en `@example.com`, solo se usó para C18.

## Lo que se corrigió

La lista de candidatas seguía visible si, después de consultar, el tiempo pasaba a ser inválido. C2 lo prohíbe. `NochePage` ahora muestra esa lista solo cuando el tiempo escrito es el que se acaba de consultar. En el navegador, con 200 minutos se veían Toy Story, Coco y El caballero oscuro. Al cambiar el campo a 29, los botones Agregar desaparecieron antes de pulsar. Al pulsar, el texto fue «El tiempo debe estar entre 30 y 600 minutos.» y no volvió la lista.

Al actualizar, el servicio cambiaba el nombre y después borraba las películas para volver a insertarlas. Si el insert fallaba, la sesión podía quedar sin películas. Ahora primero reemplaza las películas y, si el insert falla, vuelve a escribir las filas anteriores. El nombre se actualiza solo después. No se forzó un fallo de red en ese insert. El recorrido sí mostró que un guardado rechazado no toca el plan ya abierto.

## Pendiente

C3, el recorrido en pantalla con una película real sin duración. En la lista de prueba las tres películas tenían duración. No se inventa un título en TMDB para provocar el caso. La prueba de `cabe` con duración ausente o cero pasa, y `ListaNoDisponible` muestra «No tiene duración conocida.» cuando el servicio devuelve duración desconocida.

## Criterios

| Criterio | Estado        | Evidencia                                                                                                                                                                                                                                                          |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1       | cumple        | Con 200 minutos: Toy Story 77, Coco 109, El caballero oscuro 152, en ese orden. Breaking Bad, por ver y serie, no aparece.                                                                                                                                         |
| C2       | cumple        | Tras la corrección, 29 no deja la lista anterior. El mensaje de rango aparece al consultar. Vacío, 30.5, 601 y los tests de `validarTiempo` están en `docs/VERIFICACION.md` y en `noche.test.ts`.                                                                  |
| C3       | sin verificar | No hubo en pantalla una película sin duración. Ver el pendiente de arriba. `cabe(100, [null])` y `cabe(100, [0])` fallan en el test, y `cabeAgregar` responde «No tiene duración conocida.»                                                                        |
| C4       | cumple        | Mientras consulta, el botón dice «Consultando…» y no hay Agregar. En la pasada anterior también se leyó «Consultando duraciones…».                                                                                                                                 |
| C5       | cumple        | En la pasada anterior, con la consulta de duración fallida, cada película mostró «No se pudo conectar con TMDB. Revisa tu conexión.» y no hubo Agregar.                                                                                                            |
| C6       | cumple        | Solo Toy Story: total 77 min. Con 200 minutos libres quedan 123. El test de una duración no suma pausa.                                                                                                                                                            |
| C7       | cumple        | Toy Story y Coco suman 196 (77 + 10 + 109). Quedan 4. El test con 50 y 60 da 120.                                                                                                                                                                                  |
| C8       | cumple        | En la pasada anterior, 77 minutos y Toy Story dejaron total 77 y restante 0. `cabe(120, [50, 60])` es verdadero.                                                                                                                                                   |
| C9       | cumple        | «Quedan 4 minutos y harían falta 162.» El total siguió en 196. El caballero oscuro no entró.                                                                                                                                                                       |
| C10      | cumple        | Al quitar Coco del borrador el total pasó de 196 a 77.                                                                                                                                                                                                             |
| C11      | cumple        | «Noche de auditoría» apareció en guardadas y el detalle mostró las dos películas, 196 min y 200 min de tiempo.                                                                                                                                                     |
| C12      | cumple        | Nombre vacío al editar: «Escribe un nombre de hasta 80 caracteres.» El detalle siguió siendo «Noche de auditoría» con las dos películas. En la pasada anterior, guardar sin películas dijo «Agrega al menos una película.»                                         |
| C13      | cumple        | Después de guardar, Mi lista seguía en 4 pendientes, 0 en progreso y 0 vistas. Las cuatro seguían Por ver.                                                                                                                                                         |
| C14      | cumple        | Sin cuenta, `/noche` y el enlace Noche terminan en Iniciar sesión. Esta pasada arrancó en esa pantalla.                                                                                                                                                            |
| C15      | cumple        | El tiempo quedó bloqueado en 200. El nombre pasó a «Noche editada» y el detalle conservó las dos películas y los 200 min.                                                                                                                                          |
| C16      | cumple        | Con el plan guardado, agregar El caballero oscuro mostró el mismo aviso de minutos y el detalle siguió en 196 min. El guardado con nombre vacío tampoco lo cambió. `actualizarSesion` llama a `cabe` antes de escribir.                                            |
| C17      | cumple        | Tras eliminar Coco de Mi lista, la sesión sigue. El detalle dice «Ya no está por ver. Fuera del plan, no suma.» La duración que cuenta bajó a 77.                                                                                                                  |
| C18      | cumple        | La segunda cuenta pidió `noche_sesion` sin filtrar por usuario: 0 filas y no vio «Noche editada». El rol anónimo recibe permiso denegado (42501). Las políticas de `supabase/noche_de_pelicula.sql` exigen `auth.uid() = user_id` y no hay políticas para anónimo. |
