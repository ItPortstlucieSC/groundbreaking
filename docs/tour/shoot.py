# Chequeo headless del tour de v2: salta la intro (Escape), recorre las paradas y saca capturas (escritorio y móvil).
# Requiere el servidor local en el 4321 (npx -y http-server . -p 4321 -c-1) y Playwright para Python con el Chrome instalado.
import sys, time
from playwright.sync_api import sync_playwright
URL = "http://localhost:4321/v2/"
OUT = "docs/tour/shots"  # correr desde la raíz del repo; las capturas quedan ahí (ignoradas por git)
errors = []
def run(p, name, w, h, mobile=False):
    kw = dict(viewport={"width": w, "height": h})
    if mobile: kw.update(device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx = p.chromium.launch(channel="chrome", headless=True).new_context(**kw)
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(f"[{name}] console.{m.type}: {m.text}") if m.type in ("error","warning") else None)
    page.on("pageerror", lambda e: errors.append(f"[{name}] pageerror: {e}"))
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(800)
    page.keyboard.press("Escape")          # salta la intro
    page.wait_for_timeout(1400)
    page.evaluate("document.querySelector('#tour').scrollIntoView({block:'start'})")
    page.wait_for_timeout(1300)
    page.screenshot(path=f"{OUT}/{name}-1-typing.png")
    page.wait_for_timeout(3500)
    page.screenshot(path=f"{OUT}/{name}-2-done.png")
    page.click("#tour .sc-next"); page.wait_for_timeout(4200)
    page.screenshot(path=f"{OUT}/{name}-3-line2.png")
    page.click("#tour .dir-row >> nth=3"); page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/{name}-4-pitch-start.png")
    page.wait_for_timeout(3200)
    # hasta el final: parada 6, tres líneas y el cierre
    page.click("#tour .dir-row >> nth=5"); page.wait_for_timeout(4200)
    for i in range(3):
        page.click("#tour .sc-next"); page.wait_for_timeout(4200)
    page.screenshot(path=f"{OUT}/{name}-5-end.png")
    # estado del DOM al final
    print(name, page.evaluate("({dlg: document.querySelector('#tour .sc-dlg').id, end: !!document.querySelector('#tour-end'), foot: !!document.querySelector('#tour-foot'), done: document.documentElement.classList.contains('tour-done')})"))
    ctx.close()
with sync_playwright() as p:
    run(p, "desk", 1440, 1000)
    run(p, "mob", 390, 844, mobile=True)
print("\n".join(errors) if errors else "no console errors")
