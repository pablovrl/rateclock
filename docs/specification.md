## Objetivo

Construir con TypeScript y Node.js una aplicación de línea de comandos para Linux que registre sesiones de trabajo y muestre en tiempo real el importe acumulado según la tarifa del proyecto.

Este proyecto es la primera aplicación práctica de [[01 Proyectos/Crecimiento en TypeScript, infraestructura y cloud|Crecimiento en TypeScript, infraestructura y cloud]].

## Resultado del MVP

El MVP permitirá:

- Crear proyectos con tarifa por hora y moneda.
- Iniciar, pausar, reanudar y finalizar una sesión.
- Consultar el tiempo y el importe acumulados.
- Observar el contador actualizándose cada segundo.
- Conservar las sesiones al cerrar el programa o reiniciar el equipo.
- Consultar informes diarios, semanales y por proyecto.

El nombre provisional del ejecutable es `worktime`.

## Experiencia principal

```bash
worktime project add cliente-a --rate 30 --currency EUR
worktime start cliente-a
worktime status --watch
worktime pause
worktime resume
worktime stop
worktime report today
```

Ejemplo de estado:

```text
Proyecto:     cliente-a
Estado:       trabajando
Tiempo:       01:23:42
Tarifa:       30,00 EUR/h
Por segundo:  0,008333 EUR
Acumulado:    41,850000 EUR
```

## Alcance funcional

### Proyectos

- [ ] Crear un proyecto con nombre, tarifa por hora y moneda.
- [ ] Listar los proyectos existentes.
- [ ] Modificar la tarifa de un proyecto.
- [ ] Archivar un proyecto sin borrar su historial.
- [ ] Impedir nombres de proyecto duplicados.

Comandos previstos:

```bash
worktime project add <nombre> --rate <tarifa> --currency <moneda>
worktime project list
worktime project update <nombre> --rate <tarifa>
worktime project archive <nombre>
```

### Sesiones

- [ ] Iniciar una sesión para un proyecto.
- [ ] Pausar la sesión activa.
- [ ] Reanudar una sesión pausada.
- [ ] Finalizar la sesión.
- [ ] Consultar la sesión activa.
- [ ] Listar sesiones anteriores.
- [ ] Conservar en cada sesión la tarifa y moneda existentes al iniciarla.

Comandos previstos:

```bash
worktime start <proyecto>
worktime status
worktime status --watch
worktime pause
worktime resume
worktime stop
worktime sessions list
```

### Informes

- [ ] Mostrar el tiempo e importe acumulados durante el día actual.
- [ ] Mostrar el resumen de la semana actual.
- [ ] Filtrar el historial por proyecto.
- [ ] Separar tiempo trabajado y tiempo pausado.

Comandos previstos:

```bash
worktime report today
worktime report week
worktime report project <nombre>
```

## Reglas de negocio

- Solo puede existir una sesión activa o pausada a la vez.
- `start` debe fallar si ya existe una sesión sin finalizar.
- Una sesión siempre pertenece a un proyecto.
- `pause` detiene la acumulación de tiempo e importe.
- `resume` comienza un nuevo segmento de trabajo.
- `stop` cierra definitivamente la sesión.
- Cambiar la tarifa de un proyecto no modifica las sesiones anteriores.
- Los proyectos archivados conservan su historial, pero no admiten sesiones nuevas.
- Las operaciones inválidas deben fallar sin alterar los datos.
- Todos los errores deben producir un mensaje comprensible y un código de salida distinto de cero.

## Modelo de datos

Se utilizará SQLite y se guardará una sesión como una colección de segmentos de trabajo. Cada reanudación creará un segmento nuevo.

### `projects`

- `id`
- `name`
- `rate_per_hour`
- `currency`
- `active`
- `created_at`

### `sessions`

- `id`
- `project_id`
- `rate_snapshot`
- `currency_snapshot`
- `status`
- `created_at`
- `finished_at`

### `segments`

- `id`
- `session_id`
- `started_at`
- `ended_at`

Ubicación prevista de la base de datos:

```text
~/.local/share/worktime/worktime.db
```

## Tiempo y dinero

### Medición del tiempo

- Guardar fechas persistentes para reconstruir una sesión después de cerrar el CLI.
- Centralizar el acceso al reloj para poder sustituirlo en las pruebas.
- Calcular la duración sumando únicamente los segmentos de trabajo.
- Documentar el comportamiento ante cambios manuales del reloj del sistema.

### Precisión monetaria

- No almacenar ni calcular dinero con `number`.
- Representar tarifas e importes mediante microunidades enteras con `BigInt`.
- Mantener el cálculo preciso durante la sesión y redondear solo al presentar informes.
- Definir y documentar una única regla de redondeo.

Fórmula conceptual:

```text
importe = tiempo_trabajado × tarifa_por_hora / 3600
```

## Diseño técnico

- Lenguaje: TypeScript.
- Runtime: una versión LTS de Node.js.
- Plataforma inicial: Linux.
- Gestor de paquetes: pnpm.
- Persistencia: SQLite mediante `better-sqlite3`.
- Comandos: Commander.js.
- Pruebas: Vitest.
- Ejecución durante el desarrollo: `tsx`.
- Calidad y formato: ESLint y Prettier.
- Automatización: scripts de pnpm.
- Interfaz: argumentos y salida de terminal.
- Actualización de `status --watch`: una vez por segundo.

Estructura prevista:

```text
src/
├── cli.ts
├── commands/
├── database/
├── projects/
├── sessions/
├── money/
├── clock/
└── output/

tests/
package.json
tsconfig.json
README.md
```

### Responsabilidades

- `commands`: interpretar y validar los argumentos.
- `database`: abrir SQLite, ejecutar migraciones y manejar transacciones.
- `projects`: operaciones y reglas relacionadas con proyectos.
- `sessions`: máquina de estados y segmentos de trabajo.
- `money`: cálculos monetarios y redondeo.
- `clock`: acceso sustituible al reloj.
- `output`: presentación de resultados y errores.

## Desarrollo por etapas

### 1. Base del programa

- [ ] Crear el proyecto TypeScript, su estructura y los scripts de desarrollo.
- [ ] Interpretar comandos y mostrar ayuda.
- [ ] Resolver la ubicación de datos según las convenciones de Linux.
- [ ] Abrir SQLite y ejecutar la primera migración.

### 2. Gestión de proyectos

- [ ] Implementar `project add`.
- [ ] Implementar `project list`.
- [ ] Implementar actualización y archivado.
- [ ] Añadir validaciones y pruebas.

### 3. Temporizador

- [ ] Implementar `start` y `stop`.
- [ ] Implementar `pause` y `resume`.
- [ ] Impedir transiciones de estado inválidas.
- [ ] Recuperar correctamente una sesión después de cerrar el CLI.

### 4. Estado e importe

- [ ] Implementar `status`.
- [ ] Implementar `status --watch`.
- [ ] Mostrar duración, tarifa por segundo e importe acumulado.
- [ ] Verificar cálculos con sesiones largas y tarifas decimales.

### 5. Informes

- [ ] Implementar informe diario.
- [ ] Implementar informe semanal.
- [ ] Implementar informe por proyecto.
- [ ] Añadir totales de tiempo e importe.

### 6. Calidad y documentación

- [ ] Ejecutar type checking y lint sin errores.
- [ ] Ejecutar pruebas unitarias y de integración.
- [ ] Comprobar que `status --watch` no acumula listeners ni recursos.
- [ ] Probar entradas inválidas y fallos de SQLite.
- [ ] Documentar instalación, comandos, formato monetario y limitaciones.

## Pruebas esenciales

- [ ] Crear y listar proyectos.
- [ ] Rechazar nombres, monedas o tarifas inválidas.
- [ ] Rechazar una segunda sesión activa.
- [ ] Verificar que una pausa no acumula tiempo ni dinero.
- [ ] Verificar varias pausas y reanudaciones.
- [ ] Comprobar que una tarifa histórica no cambia al editar el proyecto.
- [ ] Recuperar una sesión después de cerrar y volver a ejecutar el programa.
- [ ] Probar intervalos que crucen la medianoche y el cambio de semana.
- [ ] Verificar cálculos monetarios y redondeo sin coma flotante.
- [ ] Confirmar que las operaciones fallidas no dejan datos parciales.

## Fuera del MVP

- Interfaz gráfica o web.
- Daemon y servicio de `systemd`.
- Sincronización en la nube.
- Múltiples usuarios.
- Facturas, impuestos y pagos.
- Detección automática de inactividad.
- Múltiples sesiones simultáneas.
- Integración con Git, editores o gestores de tareas.
- Importación y exportación de datos.

## Mejoras posteriores

- Exportar informes en CSV.
- Editar sesiones registradas incorrectamente.
- Detectar inactividad y suspensión del equipo.
- Relacionar repositorios Git con proyectos.
- Detectar automáticamente repositorio, rama y commit.
- Ejecutar el temporizador como daemon de usuario.
- Añadir interfaz web o nativa para Linux.

## Criterio de finalización

El MVP estará terminado cuando sea posible crear un proyecto, iniciar una sesión, pausarla, reanudarla, observar el importe acumulado en tiempo real, finalizarla y consultar el historial después de reiniciar el programa, con las pruebas automatizadas aprobadas y sin pérdida de datos.

## Próxima acción

- [x] Elegir Commander.js como librería de CLI.
- [x] Elegir pnpm como gestor de paquetes.
- [x] Elegir `better-sqlite3` para acceder a SQLite.
- [x] Elegir Vitest como framework de pruebas.
- [x] Elegir `tsx`, ESLint y Prettier para el flujo de desarrollo.
- [ ] Crear el repositorio e inicializar la estructura mínima del proyecto.
