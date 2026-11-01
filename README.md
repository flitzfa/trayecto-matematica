# Trayecto · Seguimiento académico

Aplicación web personal para seguir el **Profesorado de Matemática** de la Escuela Normal Superior N°32 «Gral. José de San Martín». Está pensada para usarse durante toda la carrera: estado de cada materia, fechas de cursada y aprobación, correlatividades, exámenes, notas y avance general.

No es un maquetado ni una landing page: todos los datos se guardan en el navegador y la app funciona sin conexión ni instalación.

## Versión online

La app está publicada gratis en GitHub Pages:

**https://flitzfa.github.io/trayecto-matematica/**

<img src="qr-trayecto.png" alt="Código QR para abrir Trayecto" width="220">

Ese es el enlace para compartir con Josef. Se puede abrir desde cualquier navegador, en computadora o celular, y también agregar a la pantalla de inicio como si fuera una app. El QR sirve para abrirla directamente desde el teléfono.

> La dirección es estable y el sitio queda publicado mientras exista el repositorio. Los datos académicos no viajan al servidor: se guardan en el navegador de cada dispositivo.

## Cómo abrirla

1. Abrí `index.html` con doble clic (Chrome, Edge o Firefox).
2. La primera vez arranca con las 40 unidades curriculares del plan oficial en estado **Pendiente**.

También se puede servir con cualquier servidor estático, por ejemplo:

```powershell
python -m http.server 8000
```

y entrar a `http://localhost:8000`.

> Los datos se guardan en `localStorage` bajo la clave `trayecto.academico.v1`. El almacenamiento está asociado al navegador y al origen desde el que se abre la app. La versión online y el archivo local no comparten datos, y tampoco se sincronizan automáticamente entre el celular y la computadora. Si abrís el archivo desde otra ruta, otro navegador o un servidor local distinto, vas a ver un estado vacío: usá **Ajustes → Descargar copia de seguridad** antes de cambiar de entorno.

## Qué incluye

- **Panel**: avance general, materias aprobadas / regulares / cursando / pendientes, próximos exámenes y accesos por año.
- **Plan de estudios**: las 40 unidades agrupadas por año, con búsqueda, filtros por estado, año y tipo, y cambio rápido de estado.
- **Ficha de cada materia**: estado, fechas de cursada y aprobación, nota, período, modalidad, observaciones personales y correlatividades.
- **Correlatividades**: se muestran las cuatro categorías del plan (cursar regular, cursar con promoción, rendir final regular y rendir final con promoción), con indicación de si la materia está habilitada.
- **Calendario**: parciales, finales, trabajos prácticos y otros eventos, con vista mensual, agenda y vínculo opcional a una materia.
- **Notas**: libreta general y observaciones por materia, con búsqueda.
- **Ajustes**: datos del perfil, año de inicio, materias personalizadas, copia de seguridad JSON, importación, exportación a calendario (`.ics`) y restauración del plan oficial.

## Estados

| Estado | Significado |
| --- | --- |
| **Pendiente** | Todavía no la cursaste. |
| **Cursando** | La estás cursando este período. |
| **Regular** | Aprobaste la cursada y te queda rendir el final. |
| **Aprobada** | Materia completa, con final aprobado o promoción. |

Al marcar una materia como **Cursando** se completa la fecha de inicio de cursada si estaba vacía; al marcarla como **Regular** o **Aprobada** se completa la fecha correspondiente. Las fechas se pueden editar o borrar a mano desde la ficha.

## Cálculo del avance

El porcentaje del panel es **materias aprobadas ÷ total de materias**. Es un cálculo por cantidad, no por carga horaria ni créditos, porque el plan oficial no informa horas por unidad curricular.

El total incluye las materias personalizadas que agregues. Las materias oficiales se identifican con los IDs `s01` a `s40`.

## Datos y alcance del plan

La fuente es el PDF incluido en el proyecto:

`PROFESORADO MATEMATICA - PLAN DE ESTUDIOS_261031_191846.pdf`

Datos tomados del documento:

- Carrera: **Profesorado de Matemática**.
- Institución: **Escuela Normal Superior N°32 «Gral. José de San Martín»**.
- Duración: **4 años**.
- **40** unidades curriculares: **27 materias**, **9 talleres** y **4 seminarios**.
- Denominación y año de cada unidad, y correlatividades de las cuatro categorías.

El PDF **no asigna materias a cuatrimestres** ni **informa carga horaria**. Por eso:

- El período de cada materia aparece como «Sin período» y es editable.
- No se muestran horas ni créditos, y el avance no se pondera por ellos.
- No se inventaron fechas, notas ni correlatividades faltantes.

## Copias de seguridad

En **Ajustes**:

- **Descargar copia de seguridad** genera un JSON con perfil, materias, eventos y notas.
- **Importar copia de seguridad** reemplaza el estado actual (pide confirmación y valida el archivo).
- **Exportar calendario** genera un `.ics` compatible con Google Calendar, Outlook y Apple Calendar.
- **Restaurar plan oficial** recupera las 40 materias y sus correlatividades del PDF, elimina las materias personalizadas y desvincula los eventos que apuntaban a ellas. Conserva tu perfil, tus eventos y tus notas, y mantiene estados, notas finales, fechas y períodos de las materias oficiales que ya existían.
- **Borrar todos los datos** deja la app como recién instalada.

Conviene descargar una copia antes de limpiar el navegador, cambiar de dispositivo o probar una importación.

## Estructura

```
index.html                  Estructura de la app y diálogos
assets/css/styles.css       Sistema visual y responsive
assets/fonts/               Newsreader, Manrope e IBM Plex Mono (locales)
assets/js/plan-data.js      Plan oficial y correlatividades
assets/js/app-core.js       Constantes y utilidades
assets/js/app-state.js      Estado, persistencia, estadísticas y correlatividades
assets/js/app-ui.js         Toasts, diálogos y exportación ICS
assets/js/app-render.js     Shell y panel
assets/js/app-plan.js       Plan de estudios
assets/js/app-calendar.js   Calendario
assets/js/app-notes.js      Notas
assets/js/app-settings.js   Ajustes e información del plan
assets/js/app-subject-dialog.js  Editor de materias
assets/js/app-event-dialog.js    Editor de eventos
assets/js/app-actions.js    Ruteo, eventos, filtros e import/export
```

Es HTML, CSS y JavaScript sin build ni dependencias externas. Los scripts son clásicos (no módulos ES), así que la app también funciona abriendo el archivo directamente.

## Privacidad

Todo queda en tu navegador. La app no envía datos a ningún servidor ni incluye analíticas.
