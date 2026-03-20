"""
Génère les images PNG pour Images Manager (icon, splash, favicon).
Lancé par le CI avant expo export.
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

os.makedirs("assets", exist_ok=True)

BLUE      = (37, 99, 235)
WHITE     = (255, 255, 255)
LIGHT     = (180, 210, 255)

def try_font(size, bold=False):
    candidates = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
        f"/usr/share/fonts/truetype/liberation/LiberationSans{'-Bold' if bold else '-Regular'}.ttf",
        f"/usr/share/fonts/truetype/ubuntu/Ubuntu{'-B' if bold else '-R'}.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_camera(draw, cx, cy, size):
    bw = int(size * 0.62)
    bh = int(size * 0.20)
    draw.rectangle([cx-bw//2, cy-bh//2, cx+bw//2, cy+bh//2], fill="white")
    for r, col in [(int(size*0.085), BLUE), (int(size*0.060), "white"), (int(size*0.035), BLUE)]:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=col)
    draw.rectangle([cx-int(size*0.09), cy-int(size*0.15),
                    cx+int(size*0.04), cy-int(size*0.09)], fill="white")

# ── icon.png 1024×1024 ────────────────────────────────────────────────────────
img = Image.new("RGB", (1024, 1024), BLUE)
d   = ImageDraw.Draw(img)
draw_camera(d, 512, 450, 1024)
d.text((512, 760), "Images", font=try_font(80, bold=True), fill="white", anchor="mm")
d.text((512, 858), "Manager", font=try_font(80, bold=True), fill="white", anchor="mm")
img.save("assets/icon.png")
img.save("assets/adaptive-icon.png")

# Versions PWA (à la racine du site après build)
img.save("assets/icon-512.png")
img.resize((192, 192), Image.LANCZOS).save("assets/icon-192.png")
print("icon.png OK (1024x1024)")

# ── splash.png 1242×2436 ──────────────────────────────────────────────────────
img2 = Image.new("RGB", (1242, 2436), BLUE)
d2   = ImageDraw.Draw(img2)
draw_camera(d2, 621, 940, 1100)
d2.text((621, 1160), "Images Manager", font=try_font(100, bold=True), fill="white", anchor="mm")
d2.text((621, 1270), "Gestion bijoux & WooCommerce", font=try_font(56), fill=LIGHT, anchor="mm")
img2.save("assets/splash.png")
print("splash.png OK (1242x2436)")

# ── favicon.png 64×64 ────────────────────────────────────────────────────────
img3 = Image.new("RGB", (64, 64), BLUE)
d3   = ImageDraw.Draw(img3)
d3.rectangle([4, 14, 60, 50], fill="white")
for r, col in [(12, BLUE), (8, "white"), (4, BLUE)]:
    d3.ellipse([32-r, 32-r, 32+r, 32+r], fill=col)
img3.save("assets/favicon.png")
print("favicon.png OK")

print("\nTous les assets generés dans assets/")
