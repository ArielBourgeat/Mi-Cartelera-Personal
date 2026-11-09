# Criterios de E2

Sin detalle de implementación. Cada criterio se puede mostrar en la pantalla.

## H1

C1. DADO que tengo películas por ver y digo un tiempo entero entre 30 y 600 minutos, CUANDO pido ver qué cabe, ENTONCES veo esas películas que caben solas, cada una con su duración, de la más corta a la más larga.

C2. DADO que digo un tiempo vacío, no entero, menor que 30 o mayor que 600, CUANDO intento usarlo, ENTONCES no veo una lista de candidatas y se me explica que el tiempo no es válido.

C3. DADO que una película por ver no tiene duración conocida, CUANDO pido ver qué cabe, ENTONCES esa película aparece como no disponible y se me dice por qué.

C4. DADO que la duración todavía se está consultando, CUANDO miro la pantalla, ENTONCES veo que la consulta sigue en curso y no se me ofrece esa película para agregarla.

C5. DADO que la consulta de la duración falla, CUANDO miro la pantalla, ENTONCES veo el error y no puedo agregar esa película.

## H2

C6. DADO que armé una sesión con una sola película que cabe, CUANDO miro el resumen, ENTONCES la duración total es solo la de esa película y el tiempo restante es lo que sobra.

C7. DADO que agrego una segunda película, CUANDO miro el resumen, ENTONCES la duración total incluye 10 minutos de pausa entre las dos.

C8. DADO que la suma, con las pausas, es exactamente el tiempo disponible, CUANDO intento armar esa sesión, ENTONCES la app la acepta.

C9. DADO que una película cabe sola pero ya no cabe en lo que queda, CUANDO intento agregarla, ENTONCES no entra en la sesión y se me explica por qué.

C10. DADO que quito una película de la sesión que estoy armando, CUANDO miro el resumen, ENTONCES la duración total y el tiempo restante se recalculan sin ella.

## H3

C11. DADO que armé una sesión que cabe y le pongo un nombre, CUANDO la guardo, ENTONCES aparece entre mis sesiones guardadas y puedo abrir su detalle.

C12. DADO que intento guardar sin películas o sin un nombre usable, CUANDO confirmo, ENTONCES no se guarda y se me explica qué falta.

C13. DADO que guardé una sesión, CUANDO vuelvo a mi lista, ENTONCES esas películas siguen por ver.

C14. DADO que no he entrado a mi cuenta, CUANDO busco la noche de película, ENTONCES no puedo ver ni guardar sesiones.

## H4

C15. DADO que tengo una sesión guardada, CUANDO cambio el nombre o las películas y el resultado sigue cabiendo en el tiempo de esa sesión, ENTONCES veo el plan actualizado.

C16. DADO que el cambio ya no cabe en el tiempo guardado, CUANDO intento guardarlo, ENTONCES el plan anterior se mantiene y se me explica por qué.

C17. DADO que una película de una sesión guardada ya no está por ver en mi lista, CUANDO abro esa sesión, ENTONCES la veo marcada como fuera del plan y no suma a la duración.

C18. DADO que otra persona tiene sesiones en su cuenta, CUANDO yo miro las mías, ENTONCES no veo ni puedo cambiar las de ella.
