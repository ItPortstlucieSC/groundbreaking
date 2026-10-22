# Uso: python3 review.py <clip.mp4> <outdir> <anchor.png>
import sys, os, subprocess, glob
import numpy as np
from PIL import Image, ImageDraw, ImageChops, ImageStat
import imageio_ffmpeg
clip, out, anchor = sys.argv[1], sys.argv[2], sys.argv[3]
FF = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs(out, exist_ok=True)
for f in glob.glob(f"{out}/f*.png"): os.remove(f)
subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", clip, "-vf", "fps=4", f"{out}/f%03d.png"], check=True)
subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-sseof", "-0.05", "-i", clip, "-update", "1", "-frames:v", "1", f"{out}/last.png"], check=True)
fs = sorted(glob.glob(f"{out}/f*.png")); n = len(fs); dur = n / 4
print(f"cuadros a 4 fps: {n} (~{dur:.1f} s)")
A = [np.asarray(Image.open(f).convert("L"), dtype=np.float32) for f in fs]
acc = np.zeros_like(A[0])
for a, b in zip(A, A[1:]): acc += np.abs(b - a)
acc /= n - 1
heat = np.clip(acc / 6.0, 0, 1)
base = np.asarray(Image.open(fs[0]).convert("RGB"), dtype=np.float32)
over = base * (1 - 0.75 * heat[..., None]) + np.array([255, 40, 40], np.float32) * (0.75 * heat[..., None])
Image.fromarray(over.astype(np.uint8)).resize((1440, 810), Image.LANCZOS).save(f"{out}/heatmap.png")
zones = {"highway (arriba der)": (900, 0, 1920, 200), "cancha": (300, 150, 900, 500), "tribuna izq": (80, 250, 420, 650),
         "pantalla LED": (850, 150, 1060, 360), "plaza/fuente": (250, 550, 800, 1000), "parking/calle cercana": (1400, 600, 1920, 1080),
         "palmeras centro": (1050, 400, 1400, 800), "techos/edificios": (900, 350, 1500, 650)}
print("movimiento por zona (diff medio entre cuadros a 4 fps; v1 de referencia entre paréntesis)")
ref = {"highway (arriba der)": 1.47, "cancha": 0.76, "tribuna izq": 1.08, "pantalla LED": 7.85, "plaza/fuente": 1.53, "parking/calle cercana": 3.78, "palmeras centro": 0.70, "techos/edificios": 0.68}
for k, (x0, y0, x1, y1) in zones.items():
    z = acc[y0:y1, x0:x1]; print(f"  {k:24s} media {z.mean():5.2f} (v1 {ref[k]:4.2f})  % pixeles >3: {100*(z>3).mean():4.1f}")
# brillo por cuadro (flare)
br = [float(a.mean()) for a in A]
print("brillo medio por segundo:", " ".join(f"{br[i]:.1f}" for i in range(0, n, 4)), f"| min {min(br):.1f} max {max(br):.1f} en t={br.index(max(br))/4:.2f}s")
# tiras por zona
picks = [0, n // 3, 2 * n // 3, n - 1]
regions = {"calle-parking": (1380, 560, 1920, 1080), "highway": (1000, 0, 1920, 180), "cancha": (300, 130, 900, 480), "tribuna": (60, 240, 420, 640), "plaza": (240, 560, 800, 1000), "palmeras": (1020, 380, 1420, 820)}
for name, (x0, y0, x1, y1) in regions.items():
    w, h = x1 - x0, y1 - y0; scale = min(2.0, 900 / w); tiles = []
    for i in picks:
        im = Image.open(fs[i]).crop((x0, y0, x1, y1)).resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        d = ImageDraw.Draw(im); d.rectangle((0, 0, 70, 22), fill=(0, 0, 0)); d.text((4, 4), f"t={i/4:.2f}s", fill=(255, 255, 255)); tiles.append(im)
    cols = 2 if tiles[0].width > 700 else 4; rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tiles[0].width, rows * tiles[0].height))
    for k, t in enumerate(tiles): sheet.paste(t, ((k % cols) * t.width, (k // cols) * t.height))
    sheet.save(f"{out}/strip-{name}.png")
# juntura y anclaje (baja resolución, suprime ruido de compresión)
def small(p): return Image.open(p).convert("RGB").resize((480, 270), Image.BOX)
def d(a, b): return round(sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3, 2)
print("juntura (último vs primero, 480x270):", d(small(f"{out}/last.png"), small(fs[0])), " | consecutivos típicos:", d(small(fs[0]), small(fs[1])))
print("primer cuadro vs anclaje:", d(small(fs[0]), small(anchor)), " | anclaje vs último cuadro de la intro:", d(small(anchor), small("/private/tmp/claude-501/-Users-marianonoceti-Desktop-Antigravity-PSLSC-Website-portstlucie/33259494-3588-484c-b820-797b3beb50cc/scratchpad/frames/last-full.png")))
# hoja de contacto 1 fps
sec = [Image.open(fs[i]).resize((480, 270), Image.LANCZOS) for i in range(0, n, 4)]
cols = 5; rows = (len(sec) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 480, rows * 270))
for k, t in enumerate(sec): sheet.paste(t, ((k % cols) * 480, (k // cols) * 270))
sheet.save(f"{out}/contact.png")
print("listo:", out)
