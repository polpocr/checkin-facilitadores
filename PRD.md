## Descripción de la aplicación

Esta aplicación se llama CheckIn Facilitadores y es una aplicación en la que individuos previamente registrados en una base de datos van a hacer un acto de checkin con el propósito de obtener datos sobre grupos de personas propuestos por ellos mismos. 

## Escenarios de uso

### Escenario 1: Checkin de un grupo de personas

1. El usuario llega a la zona de checkin y le dice al operador que lo busque.
2. El operador busca al usuario y en un input estilo buscador le muestra el usuario.
3. El operador confirma el nombre completo del usuario y marca el checkin.
4. Luego el sistema le pide al operador que cuantos grupos va a crear el usuario si 1 o 2. 
5. El operador selecciona la cantidad de grupos y el sistema le pide que ingrese el nombre del grupo (como opcional) pero lo que si es obligatorio es que ingrese el nombre de participantes de cada grupo, poniendo el nombre de el/la esposo/a como primera sugerencia.
6. El operador confirma la creación de 1 o 2 grupos y se guarda la información en la base de datos.

### Escenario 2: El usuario ya está registrado en un grupo y quiere hacer checkin

1. El usuario llega a la zona de checkin y le dice al operador que lo busque.
2. El operador busca al usuario y en un input estilo buscador le muestra el usuario.
3. El operador confirma el nombre completo del usuario y marca el checkin.
4. Luego el sistema muestra si ya está en otro grupo o no.
5. Si el usuario ya estaba en 1 grupo y eligió crear 2, entonces le muestra la opción de crear otro grupo e igual mete a los integrantes.

### Escenario 3: El usuario no aparece en la búsqueda

1. El operador busca al usuario por nombre, apellido o documento.
2. El sistema no encuentra coincidencias.
3. El operador puede intentar otra búsqueda o marcar el caso para revisión manual.

### Escenario 4: Existen varios usuarios con nombres similares

1. El operador busca al usuario y el sistema muestra varias coincidencias.
2. El operador valida datos adicionales antes de seleccionar a la persona correcta.
3. El checkin solo se habilita después de confirmar el usuario correcto.

### Escenario 5: El usuario ya hizo checkin previamente

1. El operador encuentra al usuario.
2. El sistema muestra que el checkin ya fue realizado.
3. El operador puede ver los grupos asociados, pero no duplicar el checkin.

### Escenario 6: El usuario quiere modificar los integrantes antes de guardar

1. El operador captura uno o dos grupos.
2. Antes de confirmar, el usuario pide corregir un nombre, quitar o agregar un integrante.
3. El operador actualiza los datos y luego confirma.

### Escenario 7: El usuario no quiere crear grupo en ese momento

1. El operador marca el checkin.
2. El sistema pregunta por los grupos.
3. El usuario decide no crear grupos todavía y el sistema guarda solo el checkin si esa regla se acepta.

### Escenario 8: El esposo/a sugerido no aplica o no participa

1. El sistema sugiere el/la esposo/a como primer integrante.
2. El operador puede aceptar la sugerencia, cambiarla o eliminarla.
3. El grupo se guarda con los integrantes confirmados por el usuario.

### Escenario 9: El operador cancela antes de confirmar

1. El operador inicia el checkin o creación de grupos.
2. Detecta que seleccionó al usuario equivocado o que faltan datos.
3. Cancela el flujo antes de guardar cambios en la base de datos.

### Escenario 10: Error al guardar la información

1. El operador confirma el checkin y los grupos.
2. La base de datos o conexión falla.
3. El sistema informa el error y mantiene los datos ingresados para reintentar sin volver a escribir todo.

### Escenario 11: Admin consulta el dashboard

1. El admin inicia sesión y ve los KPIs del evento en tiempo real.
2. Puede entrar a un listado filtrado desde cualquier métrica.

### Escenario 12: Admin corrige un grupo o integrante

1. El admin detecta un nombre mal capturado o un vínculo matrimonial incorrecto.
2. Edita el registro desde el panel y guarda los cambios.

### Escenario 13: Admin gestiona facilitadores

1. El admin crea, edita o elimina facilitadores pre-registrados.
2. Actualiza datos de esposo/a usados como sugerencia en checkin.

### Escenario 14: Admin resuelve casos de revisión manual

1. El admin revisa casos pendientes marcados por operadores.
2. Crea o vincula al facilitador correcto y marca el caso como resuelto.

## Entidades

### Facilitador

Persona previamente registrada en la base de datos. Es quien llega a la zona de checkin y propone sus grupos.

- Identificador único
- Nombre completo
- Documento u otro identificador para búsqueda
- Datos de contacto o referencia (opcional, según lo que ya exista en el registro)
- Nombre del/la esposo/a (opcional, usado como primera sugerencia al capturar integrantes)

### Operador

Persona del staff que usa la aplicación para buscar facilitadores, confirmar identidad y registrar el checkin. Solo accede al flujo de checkin; no tiene acceso al panel administrativo.

- Cuenta de acceso (Better Auth)
- Nombre (opcional)

### Admin

Persona con acceso al panel administrativo. Rol separado del operador de checkin.

- Identificador único
- Cuenta de acceso (Better Auth)
- Nombre (opcional)

### Checkin

Registro del acto de checkin de un facilitador en el evento.

- Facilitador asociado
- Fecha y hora
- Operador que lo registró
- Cantidad de grupos que el facilitador indicó crear (1 o 2)

Un facilitador solo puede tener un checkin activo; no se duplica si ya hizo checkin previamente.

### Grupo

Conjunto de personas propuesto por un facilitador durante su checkin.

- Identificador único
- Facilitador que lo creó
- Checkin asociado
- Nombre del grupo (opcional)
- Orden (1 o 2, cuando el facilitador crea más de un grupo)

Un facilitador puede tener hasta 2 grupos.

### Integrante

Persona incluida en un grupo. Se captura por nombre; no necesariamente corresponde a un facilitador registrado.

- Identificador único
- Grupo al que pertenece
- Nombre
- Orden dentro del grupo
- Conyuge (opcional): identificador de otro integrante ligado por matrimonio

Dos integrantes pueden referenciarse mutuamente como conyuges. Si existe el vínculo, el sistema puede usarlo para sugerir al esposo/a al capturar integrantes de un grupo.

### Caso de revisión manual

Registro cuando el operador no encuentra al facilitador en la búsqueda y marca el caso para seguimiento.

- Texto de búsqueda usado
- Fecha y hora
- Operador que lo registró
- Estado (pendiente, resuelto)

## Panel de administración

Acceso restringido a usuarios con rol Admin (Better Auth).

### Módulos y operaciones CRUD

| Módulo | Listar | Crear | Editar | Eliminar | Notas |
|--------|--------|-------|--------|----------|-------|
| Facilitadores | sí | sí | sí | sí | Incluye vínculo de esposo/a |
| Grupos | sí | sí | sí | sí | Filtro por facilitador, checkin, orden |
| Integrantes | sí | sí | sí | sí | Incluye vínculo matrimonial entre integrantes |
| Checkins | sí | no | sí | sí | Creación solo vía flujo operador; admin corrige o revierte |
| Casos de revisión manual | sí | no | sí | sí | Creación solo vía operador; admin resuelve |

### Funciones transversales

- Búsqueda y filtros en cada listado (nombre, documento, facilitador, estado, fecha)
- Vista de detalle con relaciones (facilitador → checkin → grupos → integrantes)

## KPIs del dashboard

Pantalla de entrada del admin. Cada KPI enlaza al listado filtrado correspondiente.

- **Total de facilitadores** registrados
- **Checkins realizados** (total y % sobre facilitadores registrados)
- **Facilitadores sin checkin** (pendientes)
- **Grupos creados** (total; desglose 1 vs 2 grupos por facilitador)
- **Integrantes capturados** (total y promedio por grupo)
- **Casos de revisión manual pendientes**
- **Checkins por operador** (actividad del staff en zona de checkin)
- **Checkins por hora/día** (ritmo del evento)

## Stack de tecnologías

- Next.js
- Shadcn UI
- Tailwind CSS
- TypeScript
- Convex
- Better Auth