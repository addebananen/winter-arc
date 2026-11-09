"""Builds the Beyond Self app icons from assets/beyond-self-logo.png.

Requires Pillow (pip install pillow). The source is the logo on a white canvas;
the black square is detected, its rounded corners are filled black so iOS and
Android can apply their own mask, and each size is resampled with Lanczos.
Run: python scripts/make-icons.py
"""
import base64, io
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'assets' / 'beyond-self-logo.png').convert('RGB')
px = source.load()
w, h = source.size
dark = lambda x, y: sum(px[x, y]) < 200
xs = [x for x in range(w) if any(dark(x, y) for y in range(0, h, 2))]
ys = [y for y in range(h) if any(dark(x, y) for x in range(0, w, 2))]
square = source.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
side = max(square.size)
logo = Image.new('RGB', (side, side), 'black')
logo.paste(square, ((side - square.width) // 2, (side - square.height) // 2))
# Paint everything outside an inset rounded rectangle black, so no white corners remain.
mask = Image.new('L', logo.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((2, 2, side - 3, side - 3), radius=side // 12, fill=255)
logo = Image.composite(logo, Image.new('RGB', logo.size, 'black'), mask)

def render(size, content=1.0):
    canvas = Image.new('RGB', (size, size), 'black')
    inner = round(size * content)
    canvas.paste(logo.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2, (size - inner) // 2))
    return canvas

# 512 doubles as a maskable icon: keep the text inside the 80 % safe circle.
render(512, 0.86).save(root / 'src' / 'icon-512.png', optimize=True)
render(192, 0.86).save(root / 'src' / 'icon-192.png', optimize=True)
render(180).save(root / 'src' / 'apple-touch-icon.png', optimize=True)
buf = io.BytesIO(); render(128).save(buf, 'PNG', optimize=True)
data = base64.b64encode(buf.getvalue()).decode()
(root / 'src' / 'icon.svg').write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#000"/>'
    f'<image width="128" height="128" href="data:image/png;base64,{data}"/></svg>\n')
print('Icons written from', side, 'px source')
