## Objetivo

Construir con TypeScript y Node.js una aplicación de línea de comandos para Linux que registre sesiones de trabajo y muestre en tiempo real el importe acumulado según la tarifa del proyecto.

Este proyecto es la primera aplicación práctica de [[01 Proyectos/Crecimiento en TypeScript, infraestructura y cloud|Crecimiento en TypeScript, infraestructura y cloud]].

## Resultado del MVP

El MVP permitirá:

- Crear proyectos con tarifa por hora y moneda.
- Iniciar y finalizar una sesión.
- Consultar el tiempo y el importe acumulados.
- Observar el contador actualizándose cada segundo.
- Conservar las sesiones al cerrar el programa o reiniciar el equipo.
- Consultar tiempo e ingresos por proyecto para una fecha o rango de fechas.

El nombre del ejecutable es `rateclock`.

La versión `0.1.0` se distribuye en npm como `@pablovrl/rateclock`.

## Experiencia principal

```bash
rateclock project add cliente-a --rate 30 --currency USD
rateclock start cliente-a
rateclock status --watch
rateclock stop
rateclock report cliente-a --date 2026-09-23
```

Ejemplo de estado:

```text
Proyecto:     cliente-a
Estado:       trabajando
Tiempo:       01:23:42
Tarifa:       30,00 USD/h
Acumulado:    41,850000 USD
```

## Alcance funcional

### Proyectos

- [x] Crear un proyecto con nombre, tarifa por hora y moneda.
- [x] Listar los proyectos existentes.
- [x] Modificar la tarifa de un proyecto.
- [x] Archivar un proyecto sin borrar su historial.
- [x] Impedir nombres de proyecto duplicados.

Comandos previstos:

```bash
rateclock project add <nombre> --rate <tarifa> --currency <moneda>
rateclock project list
rateclock project update <nombre> --rate <tarifa>
rateclock project archive <nombre>
```

### Sesiones

- [x] Iniciar una sesión para un proyecto.
- [x] Finalizar la sesión.
- [x] Consultar la sesión activa.
- [x] Listar sesiones anteriores.
- [x] Conservar en cada sesión la tarifa y moneda existentes al iniciarla.

Comandos previstos:

```bash
rateclock start <proyecto>
rateclock status
rateclock status --watch
rateclock stop
rateclock sessions list
```

### Informes

- [x] Mostrar tiempo e importe para un proyecto en una fecha concreta.
- [x] Mostrar tiempo e importe para un proyecto en un rango inclusivo de fechas.
- [x] Recortar las sesiones que crucen los límites del período.

Comandos previstos:

```bash
rateclock report <nombre> --date <YYYY-MM-DD>
rateclock report <nombre> --from <YYYY-MM-DD> --to <YYYY-MM-DD>
```

## Reglas de negocio

- Solo puede existir una sesión sin finalizar a la vez.
- `start` debe fallar si ya existe una sesión sin finalizar.
- Una sesión siempre pertenece a un proyecto.
- `stop` cierra definitivamente la sesión.
- Cambiar la tarifa de un proyecto no modifica las sesiones anteriores.
- Los proyectos archivados conservan su historial, pero no admiten sesiones nuevas.
- Las operaciones inválidas deben fallar sin alterar los datos.
- Todos los errores deben producir un mensaje comprensible y un código de salida distinto de cero.

## Modelo de datos

Se utilizará SQLite y cada sesión representará un intervalo continuo entre `start` y `stop`.

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
- `started_at`
- `finished_at`

Ubicación prevista de la base de datos:

```text
~/.local/share/rateclock/rateclock.db
```

## Tiempo y dinero

### Medición del tiempo

- Guardar fechas persistentes para reconstruir una sesión después de cerrar el CLI.
- Centralizar el acceso al reloj para poder sustituirlo en las pruebas.
- Calcular la duración como la diferencia entre el inicio y el final de la sesión.
- Documentar el comportamiento ante cambios manuales del reloj del sistema.

### Precisión monetaria

- No almacenar ni calcular dinero con `number`.
- Representar tarifas e importes mediante microunidades enteras con `BigInt`.
- Mantener el cálculo preciso durante la sesión y redondear solo al presentar informes.
- Redondear a la microunidad más cercana con la regla half-up al presentar un importe.

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
- `sessions`: inicio, finalización y consulta de sesiones de trabajo.
- `money`: cálculos monetarios y redondeo.
- `clock`: acceso sustituible al reloj.
- `output`: presentación de resultados y errores.

## Desarrollo por etapas

### 1. Base del programa

- [x] Crear el proyecto TypeScript, su estructura y los scripts de desarrollo.
- [x] Interpretar comandos y mostrar ayuda.
- [x] Resolver la ubicación de datos según las convenciones de Linux.
- [x] Abrir SQLite y ejecutar la primera migración.

### 2. Gestión de proyectos

- [x] Implementar `project add`.
- [x] Implementar `project list`.
- [x] Implementar actualización y archivado.
- [x] Añadir validaciones y pruebas.

### 3. Temporizador

- [x] Implementar `start` y `stop`.
- [x] Impedir que exista más de una sesión sin finalizar.
- [x] Recuperar correctamente una sesión después de cerrar el CLI.

### 4. Estado e importe

- [x] Implementar `status`.
- [x] Implementar `status --watch`.
- [x] Mostrar duración, tarifa por hora e importe acumulado.
- [x] Verificar cálculos con sesiones largas y tarifas decimales.

### 5. Informes

- [x] Implementar informe por proyecto para una fecha.
- [x] Implementar informe por proyecto para un rango de fechas.
- [x] Añadir totales de tiempo e importe por moneda.

### 6. Calidad y documentación

- [x] Ejecutar type checking y lint sin errores.
- [x] Ejecutar pruebas unitarias y de integración.
- [x] Comprobar que `status --watch` no acumula listeners ni recursos.
- [ ] Probar entradas inválidas y fallos de SQLite.
- [ ] Documentar instalación, comandos, formato monetario y limitaciones.

## Pruebas esenciales

- [x] Crear y listar proyectos.
- [x] Rechazar nombres, monedas o tarifas inválidas.
- [x] Rechazar una segunda sesión activa.
- [x] Comprobar que una tarifa histórica no cambia al editar el proyecto.
- [x] Recuperar una sesión después de cerrar y volver a ejecutar el programa.
- [ ] Probar intervalos que crucen la medianoche y el cambio de semana.
- [x] Verificar cálculos monetarios y redondeo sin coma flotante.
- [x] Confirmar que las operaciones fallidas no dejan datos parciales.

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

- Pausar y reanudar sesiones mediante segmentos de trabajo.
- Exportar informes en CSV.
- Editar sesiones registradas incorrectamente.
- Detectar inactividad y suspensión del equipo.
- Relacionar repositorios Git con proyectos.
- Detectar automáticamente repositorio, rama y commit.
- Ejecutar el temporizador como daemon de usuario.
- Añadir interfaz web o nativa para Linux.

## Criterio de finalización

El MVP estará terminado cuando sea posible crear un proyecto, iniciar una sesión, observar el importe acumulado en tiempo real, finalizarla y consultar el historial después de reiniciar el programa, con las pruebas automatizadas aprobadas y sin pérdida de datos.

## Próxima acción

- [x] Elegir Commander.js como librería de CLI.
- [x] Elegir pnpm como gestor de paquetes.
- [x] Elegir `better-sqlite3` para acceder a SQLite.
- [x] Elegir Vitest como framework de pruebas.
- [x] Elegir `tsx`, ESLint y Prettier para el flujo de desarrollo.
- [x] Crear el repositorio e inicializar la estructura mínima del proyecto.
