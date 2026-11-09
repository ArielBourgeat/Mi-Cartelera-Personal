# Tickets de E2

Ninguno se implementa en el checkpoint de especificación. El orden de construcción es T1, T2 y T3 en paralelo después de T1 si hace falta la regla, luego T4, luego T5.

## T1 — Regla de dominio

Tipo: dominio.

Depende de: la spec de E2.

Definition of Done: existe una función pura, sin red ni base de datos, que recibe el tiempo, las duraciones y la pausa. Sus tests cubren el tiempo exacto, una sola película, una duración desconocida y un tiempo fuera de rango. Esos tests pasan.

## T2 — Almacén de sesiones

Tipo: datos.

Depende de: la spec de E2. No depende de T1.

Definition of Done: la migración descrita en la spec está escrita en el archivo de migración, con las restricciones y las políticas que impiden ver o modificar sesiones de otra persona. No se ejecuta sola desde la app.

## T3 — Duración del catálogo

Tipo: servicio.

Depende de: la spec de E2.

Definition of Done: un servicio obtiene la duración en minutos de una película del catálogo. Distingue duración conocida, duración desconocida y error de consulta. Los componentes no llaman al catálogo.

## T4 — Sesiones de la persona

Tipo: servicio.

Depende de: T1 y T2.

Definition of Done: un servicio lista, guarda, actualiza y abre las sesiones de la persona autenticada. Guardar y actualizar usan la función pura. No cambian el estado de las películas de la lista. Los componentes no llaman al almacén.

## T5 — Pantalla Noche de película

Tipo: interfaz.

Depende de: T1, T3 y T4.

Definition of Done: con sesión iniciada se llega a la pantalla desde la barra. Se cubren C1 a C18 en el recorrido de la pantalla, citando `DESIGN.md` sin copiar sus valores. Sin sesión, la pantalla no se abre.
