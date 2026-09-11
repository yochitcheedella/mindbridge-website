from PIL import Image, ImageDraw
import os
import base64

src_img = r"C:\Users\yochi\.gemini\antigravity-ide\brain\bc862a5f-fe93-4ce6-927d-8ed1c580e09f\.user_uploaded\media_1788670834696.jpg"

if not os.path.exists(src_img):
    raise FileNotFoundError(f"Source image not found at {src_img}")

os.makedirs("public", exist_ok=True)
os.makedirs("src/assets", exist_ok=True)

# Open original
im = Image.open(src_img).convert("RGBA")
w, h = im.size

# Save raw original into public as well
im.convert("RGB").save("public/logo_original.jpg", quality=95)

# Center and radius for the circle
cx, cy = 382, 398
radius = 372

# Create a 4x supersampled mask for smooth anti-aliased circular edge
scale = 4
mask = Image.new("L", (w * scale, h * scale), 0)
draw = ImageDraw.Draw(mask)
draw.ellipse(
    [(cx - radius) * scale, (cy - radius) * scale, (cx + radius) * scale, (cy + radius) * scale],
    fill=255
)
mask = mask.resize((w, h), Image.Resampling.LANCZOS)

# Apply mask
circle_im = im.copy()
circle_im.putalpha(mask)

# Crop to the bounding box of the circle
box = (cx - radius, cy - radius, cx + radius, cy + radius)
cropped = circle_im.crop(box)

# Save as high-res logo.png and vishnu_logo.png
cropped.save("public/logo.png", "PNG")
cropped.save("public/vishnu_logo.png", "PNG")
cropped.save("src/assets/logo.png", "PNG")
cropped.save("src/assets/vishnu_logo.png", "PNG")
print("Saved public/logo.png, public/vishnu_logo.png, and src/assets/logo.png (size:", cropped.size, ")")

# Create PWA 512x512 and 192x192
pwa_512 = cropped.resize((512, 512), Image.Resampling.LANCZOS)
pwa_512.save("public/pwa-512x512.png", "PNG")

pwa_192 = cropped.resize((192, 192), Image.Resampling.LANCZOS)
pwa_192.save("public/pwa-192x192.png", "PNG")

# Favicon 32x32, 48x48, 64x64
fav_64 = cropped.resize((64, 64), Image.Resampling.LANCZOS)
fav_64.save("public/favicon.png", "PNG")
fav_64.save("public/favicon.ico", format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])

# Generate SVG favicon embedding
with open("public/favicon.png", "rb") as f:
    b64_png = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,{b64_png}" width="64" height="64"/>
</svg>'''

with open("public/favicon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

print("All logo assets created successfully!")
