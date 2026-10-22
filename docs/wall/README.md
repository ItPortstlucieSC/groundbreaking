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
Web app desplegado el 22-oct-2026 (ya en `v2/config.js`):
`https://script.google.com/macros/s/AKfycbyLkNTj13PDbgY3wvYeAM1borHAGv9Rw2xZjQh-k7qZHuN42I0nONRiJLycNE1TVSio/exec`
Cambiarlo por otro (p. ej. uno de la cuenta del club, `press@portstluciesc.com`) es repetir el deploy en el Sheet
nuevo y pegar la URL nueva en `v2/config.js`. Los datos viejos se copian a mano (dos pestañas).

## Deploy (una vez, 5 minutos, desde el navegador)
1. Abrir el Sheet (o crear uno nuevo si se cambia de cuenta).
2. Extensiones → Apps Script. Borrar el contenido, pegar `Code.gs`, guardar.
3. En el editor, elegir la función `setup` y ejecutarla (crea las pestañas con los encabezados). Aceptar los
   permisos que pide.
4. Implementar → Nueva implementación → tipo **Aplicación web** → "Ejecutar como: yo" · "Quién tiene acceso:
   cualquier persona" → Implementar. Copiar la URL (`https://script.google.com/macros/s/…/exec`).
5. Pegar esa URL en `v2/config.js`: `window.GB_API = 'https://script.google.com/macros/s/…/exec';`.
6. Probar: dejar un mensaje desde el sitio, ver la fila en `messages`, poner `approved`, recargar el sitio.

Cada vez que se cambie `Code.gs` hay que hacer **Implementar → Administrar implementaciones → editar → nueva
versión**; si no, el sitio sigue hablando con la versión vieja.

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
