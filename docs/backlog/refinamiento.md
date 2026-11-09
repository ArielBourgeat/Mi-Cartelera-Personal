# Refinamiento de E2

Casos borde propuestos al cerrar la ficha. Cada uno se acepta o se rechaza con una razón. Los aceptados ya están en el PRD o en los criterios.

## Aceptados

Tiempo de 30 minutos y tiempo de 600 minutos. Son los extremos que el cliente permitió. C2 y C1.

Tiempo de 29, de 601, vacío, con decimales o con texto. No es un entero dentro del rango. Se rechaza el uso y se explica. C2.

Una sola película. No hay pausa. Cabe si su duración es menor o igual que el tiempo. C6.

Dos o más películas. La pausa es 10 minutos por cada hueco, no por cada película. C7.

La suma exacta del tiempo disponible. El cliente dijo que sí cabe. C8.

Duración ausente o igual a cero. Se trata como desconocida. No se puede agregar y se explica. C3.

Una película más larga que el tiempo total. No aparece entre las que caben. No hace falta llamarla «sin duración»: la duración se conoce y no alcanza. Queda cubierta por C1, que solo muestra las que caben solas.

Agregar una que cabe sola pero no en el tiempo restante, contando la pausa. No se agrega y se explica. C9.

La misma película dos veces en la misma sesión. No se puede. Sería verla dos veces en una noche sin que la ficha lo pida. Queda en la spec como regla de la sesión.

Sesión sin películas, o nombre vacío o de más de 80 caracteres. No se guarda. C12.

Quitar una película del borrador. El total y el restante se recalculan. C10.

La consulta de la duración tarda o falla. Hay estado de carga y estado de error. Mientras tanto no se agrega. C4 y C5.

La película sigue por ver después de guardar. El cliente lo fijó. C13.

La película estaba en una sesión y luego se quita de la lista, o pasa a viendo o a vista. La sesión sobrevive, esa película deja de sumar y se marca como fuera del plan. C17.

La misma película en dos sesiones distintas. Aceptado en el PRD: guardar no consume el título.

Otra cuenta no ve ni edita mis sesiones. C18.

## Rechazados

Incluir series que estén por ver. El no-alcance las deja fuera. Mostrarlas «por si acaso» ensucia la decisión de la noche.

Pausa distinta de 10 minutos, o pausa antes de la primera o después de la última. El cliente ya lo decidió.

Compartir la sesión, invitar a otra persona o avisarle. Están en el no-alcance.

Ponerle a la sesión una fecha de proyección o un recordatorio. Eso es un calendario y una notificación.

Recomendar una película que no está en la lista, aunque quepa mejor. El no-alcance lo prohíbe.

Reordenar las películas dentro de la sesión. No cambia si cabe. Se deja el orden de agregado para no abrir otra interacción.

Cambiar el tiempo disponible de una sesión ya guardada. Si el rato es otro, corresponde otra sesión. El PRD lo deja fijo.

Marcar la noche como realizada y pasar las películas a vista. Contradice la regla de que guardar no cambia el estado. Queda como opcional fuera de E2.

Un botón que proponga solo una combinación, o un filtro por género. Son opcionales, no esta épica.

Impedir en el almacén una suma que no cabe, además de impedirlo en la pantalla. Es un opcional. E2 lo impide al armar y al guardar desde la app; no añade esa traba en el almacén.

Borrar toda la sesión cuando una de sus películas sale de la lista. Se pierde el resto del plan sin necesidad. C17 conserva la sesión.
