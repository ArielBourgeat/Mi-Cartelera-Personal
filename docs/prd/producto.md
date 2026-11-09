# Producto — Mi Cartelera Personal

## Problema

Quien usa Mi Cartelera acumula películas por ver. Cuando tiene un rato libre no sabe cuáles puede terminar, empieza una que no le cabe y deja la noche a medias.

## Usuarios

La misma persona que ya tiene cuenta y lista en Mi Cartelera. Nadie más ve ni modifica sus planes. No hay un segundo rol.

## Alcance

### E1 — Cartelera personal

Ya está construida. La persona se registra, entra, busca películas y series, guarda las suyas, les pone estado, nota y comentario, y abre la ficha. Esa épica no se reescribe. Noche de película se apoya en ella: usa la misma cuenta y la misma lista.

### E2 — Noche de película

La persona dice cuántos minutos tiene. La app le muestra qué películas por ver caben en ese tiempo y cuáles no se pueden usar porque no se conoce su duración. Arma una sesión con una o varias, ve la duración total (con las pausas) y el tiempo que le queda, y guarda la sesión para consultarla después.

El éxito de E2 es que termine lo que empieza: la sesión guardada cabe en el tiempo que declaró.

## No-alcance

Series. Ver con amigos o compartir sesiones. Recordatorios y notificaciones. Sincronizar con plataformas de streaming o con calendarios. Recomendar películas que no están en su lista. Un botón que arme la noche solo. Filtrar por género. Marcar la sesión como realizada y pasar esas películas a vista. Impedir en el almacén, además de en la pantalla, que se guarde una suma que no cabe.

## Reglas de negocio

El tiempo disponible es un número entero de minutos, entre 30 y 600, inclusive.

En una sesión solo entran películas de la lista de esa persona que estén por ver.

Hay 10 minutos de pausa entre una película y la siguiente. No hay pausa antes de la primera ni después de la última.

Una sesión que ocupa exactamente el tiempo disponible sí cabe.

La duración se toma del catálogo. Si una película no tiene duración conocida, no se puede agregar, y la app explica por qué.

Guardar una sesión no cambia el estado de sus películas: siguen por ver.

Una película cabe sola cuando su duración es menor o igual que el tiempo disponible. Si ya hay otras en la sesión, además tiene que caber su duración más la pausa en lo que queda.

La suma que se compara con el tiempo es la de las duraciones más 10 minutos por cada hueco entre películas.

## Decisiones

Una película puede estar en dos sesiones guardadas. Guardar no la marca como vista, así que el plan no la consume. Impedir la repetición trataría la sesión como un compromiso exclusivo, y esta épica solo promete que el plan cabe en el tiempo.

Las películas que caben se muestran de la más corta a la más larga. Si duran lo mismo, se ordenan por título. Así aparecen primero las que más claramente se pueden terminar, y el orden no cambia de una visita a otra.

Una sesión guardada sí se puede modificar: el nombre y las películas, siempre que el conjunto nuevo siga cabiendo en el tiempo que ya se guardó. Ese tiempo no se edita. Si el rato libre es otro, se crea otra sesión. Ajustar la selección forma parte de armar el plan; cambiar el tiempo sería otra noche.

Si la persona quita de su lista una película que está en una sesión, o deja de estar por ver, la sesión no se borra. Esa película se muestra como fuera del plan y deja de sumar. El resto se conserva. Borrar la sesión entera castigaría un cambio de lista. Dejarla contando como si siguiera por ver sería falso.

La sesión tiene un nombre, escrito por quien la guarda, y la fecha en que se guardó. No tiene fecha de proyección. El nombre distingue un plan de otro. La fecha de guardado solo ordena el historial. Una fecha de «esta noche» sería un calendario, y los calendarios están fuera de alcance. El nombre no puede quedar vacío ni pasar de 80 caracteres.

## Supuestos

La duración del catálogo viene en minutos enteros. Un cero se trata como duración desconocida, igual que la ausencia de dato.

El orden dentro de una sesión es el orden en que se agregaron. Cambiar ese orden no altera si cabe, porque la pausa depende de cuántas películas hay, no de cuáles van primero. Esta épica no incluye reordenar.

Mientras se consulta la duración, la película no se ofrece como disponible ni como no disponible: está en carga. Si la consulta falla, se explica el fallo y no se puede agregar.

## Puntos abiertos

Ninguno. Los cinco puntos de la ficha quedaron decididos arriba. Los casos borde del refinamiento están aceptados o rechazados en `docs/backlog/refinamiento.md`. Lo opcional de la entrega no entra en E2.
