# Trayecto · Seguimiento académico

Aplicación web personal para seguir el **Profesorado de Matemática** de la Escuela Normal Superior N°32 «Gral. José de San Martín». Está pensada para usarse durante toda la carrera: estado de cada materia, fechas de cursada y aprobación, correlatividades, exámenes, notas y avance general.

No es un maquetado ni una landing page: la app funciona sin instalación, guarda los datos en el navegador y, si se activa la cuenta, los sincroniza entre dispositivos.

## Versión online

La app está publicada gratis en GitHub Pages:

**https://flitzfa.github.io/trayecto-matematica/**

<img src="qr-trayecto.png" alt="Código QR para abrir Trayecto" width="220">

Ese es el enlace para compartir con Josef. Se puede abrir desde cualquier navegador, en computadora o celular, y también agregar a la pantalla de inicio como si fuera una app. El QR sirve para abrirla directamente desde el teléfono.

> La dirección es estable y el sitio queda publicado mientras exista el repositorio. Sin cuenta, los datos académicos se guardan solo en el navegador; con la cuenta activada, se sincronizan de forma privada entre dispositivos.

## Cómo abrirla

1. Abrí `index.html` con doble clic (Chrome, Edge o Firefox).
2. La primera vez arranca con las 40 unidades curriculares del plan oficial en estado **Pendiente**.

También se puede servir con cualquier servidor estático, por ejemplo:

```powershell
python -m http.server 8000
```

y entrar a `http://localhost:8000`.

> Los datos se guardan en `localStorage` bajo la clave `trayecto.academico.v1`. El almacenamiento está asociado al navegador y al origen desde el que se abre la app. La versión online y el archivo local no comparten datos por sí solos: para eso está la cuenta, que sincroniza el mismo seguimiento en todos los dispositivos donde se inicie sesión. Si abrís el archivo desde otra ruta, otro navegador o un servidor local distinto, podés entrar con tu cuenta y recuperar tus datos, o usar **Ajustes → Descargar copia de seguridad** antes de cambiar de entorno.

## Cuenta y sincronización

La cuenta es **opcional**. Sin ella la app funciona igual que siempre y guarda todo en el navegador. Al crearla, el seguimiento se guarda también en la nube y aparece en cualquier dispositivo donde se inicie sesión.

- Se entra desde el botón **Activar sync** de la barra superior o desde **Ajustes → Tu cuenta**.
- Hay una sola cuenta por instalación. Se crea una vez con un **código de invitación** y queda reservada para Josef.
- El usuario y la contraseña son personales; la contraseña se guarda cifrada (scrypt) y la sesión dura 180 días.
- Si se olvida la contraseña, se puede recuperar con el mismo código de invitación.
- Los cambios se suben solos unos segundos después de editar. Al abrir la app, al volver a la pestaña y cada 45 segundos se buscan cambios de otros dispositivos.
- Si dos dispositivos editan a la vez, se combinan materia por materia y evento por evento, conservando la versión más reciente de cada cosa, incluidas las eliminaciones.
- Se puede cerrar sesión en un dispositivo sin borrar los datos locales.

El servicio de sincronización es un proyecto gratuito de Vercel (`trayecto-sync`) con almacenamiento privado en Vercel Blob. El código está en `trayecto-sync/api/auth.js` y `trayecto-sync/api/sync.js`.

## Qué incluye

- **Panel**: avance general, materias aprobadas / regulares / cursando / pendientes, próximos exámenes y accesos por año.
- **Plan de estudios**: las 40 unidades agrupadas por año, con búsqueda, filtros por estado, año y tipo, y cambio rápido de estado.
- **Ficha de cada materia**: estado, fechas de cursada y aprobación, nota, período, modalidad, observaciones personales y correlatividades.
- **Correlatividades**: se muestran las cuatro categorías del plan (cursar regular, cursar con promoción, rendir final regular y rendir final con promoción), con indicación de si la materia está habilitada.
- **Calendario**: parciales, finales, trabajos prácticos y otros eventos, con vista mensual, agenda y vínculo opcional a una materia.
- **Notas**: libreta general y observaciones por materia, con búsqueda.
- **Cuenta**: creación con código de invitación, inicio de sesión, recuperación y cambio de contraseña, con sincronización automática entre dispositivos.
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
assets/js/app-sync.js       Cuenta, sesión y sincronización
assets/js/app-actions.js    Ruteo, eventos, filtros e import/export
```

Es HTML, CSS y JavaScript sin build ni dependencias externas. Los scripts son clásicos (no módulos ES), así que la app también funciona abriendo el archivo directamente.

## Privacidad

Sin cuenta, todo queda en el navegador: la app no envía datos a ningún servidor ni incluye analíticas.

Con la cuenta activada, el perfil, las materias, las fechas y las notas se envían al servicio de sincronización (`trayecto-sync.vercel.app`) para poder mostrarlos en tus otros dispositivos. Ese almacenamiento es privado: solo se accede con la sesión de la cuenta, que se guarda en el navegador. No hay terceros, publicidad ni analíticas, y se puede dejar de sincronizar cerrando sesión o borrando los datos desde Ajustes.
