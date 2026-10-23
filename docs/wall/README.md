# Muro y registro · backend en Google Sheets

La v2 guarda los mensajes del muro ("I'm building this home for…") y los registros de postales en un Google Sheet,
a través de un web app de Apps Script (`Code.gs`). Sin servidores, sin cuentas nuevas: el Sheet es la base y el
panel de moderación a la vez.

## Cómo funciona
- **Mensajes** → pestaña `messages`. Salen al muro al instante (`status = approved`). El sitio solo muestra los
  `approved`: para sacar uno (ofensivo, spam), en la columna `status` elegir `hidden` y desaparece en la próxima
  carga. La política se cambia en la pestaña `config` (`auto_approve` FALSE = entran como `pending` y se publican
  al poner `approved`), sin volver a desplegar.
- **Registros de postales** → pestaña `registrations` (postal elegida, nombre, email, domicilio o "solo digital").
- Protecciones: honeypot, largo máximo (140 caracteres el mensaje), un envío por email por minuto, bloqueo
  contra escrituras simultáneas. El email nunca sale del Sheet.
- Solo adultos: el formulario exige el check "I'm 18 or older" (columna `is_adult`). Si un menor quiere dejar un
  mensaje, lo deja un adulto por él.

## El Sheet actual
**Groundbreaking · muro y registros** (creado el 22-oct-2026 en el Drive de Mariano, para arrancar):
https://docs.google.com/spreadsheets/d/158ywNxMUd1Ubt7RAEFI6A4qUPAGmgsLlBPdxokqGZxA/edit
Web app (ya en `v2/config.js`), versión 3 desde el 23-oct-2026:
`https://script.google.com/macros/s/AKfycbyLkNTj13PDbgY3wvYeAM1borHAGv9Rw2xZjQh-k7qZHuN42I0nONRiJLycNE1TVSio/exec`
Cambiarlo por otro (p. ej. uno de la cuenta del club, `press@portstluciesc.com`) es repetir el deploy en el Sheet
nuevo y pegar la URL nueva en `v2/config.js`. Los datos viejos se copian a mano (dos pestañas).

## Actualizar el script (desde la terminal, sin abrir el editor)
`docs/wall/` es el proyecto de Apps Script (`.clasp.json` apunta al script del Sheet; `.claspignore` deja subir solo
`Code.gs` y `appsscript.json`). La implementación pública es `AKfycbyLkNTj13PD…` y no cambia de URL entre versiones.

```bash
cd docs/wall
npx -y @google/clasp push --force                                  # sube Code.gs (no toca lo publicado)
npx -y @google/clasp create-version "qué cambió"                  # devuelve el número N
npx -y @google/clasp update-deployment AKfycbyLkNTj13PDbgY3wvYeAM1borHAGv9Rw2xZjQh-k7qZHuN42I0nONRiJLycNE1TVSio -V N
```
Requiere `npx -y @google/clasp login` con la cuenta dueña del Sheet y el interruptor "Google Apps Script API" en On
(https://script.google.com/home/usersettings). Si alguien edita el código en el editor web, hacer `clasp pull` antes
de tocar nada acá para no pisarlo.

## Deploy inicial (si se cambia de Sheet)
1. En el Sheet nuevo: Extensiones → Apps Script. Pegar `Code.gs`, guardar.
2. Implementar → Nueva implementación → Aplicación web → "Ejecutar como: yo" · "Acceso: cualquier persona".
3. Pegar la URL `/exec` en `v2/config.js` y el ID del script (Configuración del proyecto) en `docs/wall/.clasp.json`.
   No hace falta correr `setup`: el primer envío crea la pestaña `config` y el desplegable de status.

## Probar en local sin deploy
```bash
node docs/wall/mock-server.mjs          # imita el web app en http://localhost:4322 (aprueba todo)
# abrir http://localhost:4321/v2/?api=http://localhost:4322
```
Sin `?api=` y con `GB_API` vacío en `config.js`, los formularios corren en modo demo: no guardan nada y lo avisan en
consola. Con `?auto=0` el mock deja los mensajes en `pending`, como el Sheet real con moderación.

## Límites a tener en cuenta
- Apps Script tarda 1–3 s por pedido; está bien para un formulario, no para algo en tiempo real.
- Cupo diario amplio para este uso (miles de envíos), pero si el muro explota, la migración natural es Supabase
  con el mismo contrato (`GET messages`, `POST message|register`): el sitio no cambia.
- El muro muestra solo nombre, insignia, sticker y mensaje; el resto queda en el Sheet.
