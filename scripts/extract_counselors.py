import fitz
import os
from PIL import Image

pdf_path = r"C:\Users\yochi\.gemini\antigravity-ide\brain\bc862a5f-fe93-4ce6-927d-8ed1c580e09f\.user_uploaded\media_1788672334888.pdf"
doc = fitz.open(pdf_path)

out_dir = "public/counselors/raw"
pages_dir = "public/counselors/pages"
os.makedirs(out_dir, exist_ok=True)
os.makedirs(pages_dir, exist_ok=True)

# 1. Render all 10 pages as high-res images (2x resolution = 1920x1080)
for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap(dpi=200)
    page_img_path = os.path.join(pages_dir, f"counselor_page_{i+1}.png")
    pix.save(page_img_path)
    print(f"Rendered Page {i+1} -> {page_img_path} ({pix.width}x{pix.height})")

# 2. Extract embedded images
for i, page in enumerate(doc):
    image_list = page.get_images(full=True)
    for img_idx, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        w = base_image["width"]
        h = base_image["height"]
        filename = f"page_{i+1}_img_{img_idx}_{w}x{h}.{ext}"
        path = os.path.join(out_dir, filename)
        with open(path, "wb") as f:
            f.write(image_bytes)
        print(f"Saved {path}")

print("Extraction completed!")
