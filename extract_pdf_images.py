import fitz
from PIL import Image
import numpy as np

doc = fitz.open(r'C:\Users\pennw\Downloads\SAI Benefits Postcard (7x5) (7) (1) (3).pdf')
page = doc[0]

clip = fitz.Rect(100, 25, 410, 225)
mat = fitz.Matrix(8, 8)

# Suppress all raster images by hiding them before rendering
# Get all images on the page and make them invisible
page_xref = page.xref  

# Approach: use page.get_pixmap with 'no_image' via the internal render flags
# In PyMuPDF, passing flags to get_pixmap can suppress images
# Flag 8 = FZ_RENDER_NO_SPOT_COLORS, but we need image suppression

# Best approach in PyMuPDF 1.27: use page.get_drawings() to get only vector paths
# then reconstruct the logo as SVG/PNG

# Get all paths/drawings (vector content only)
paths = page.get_drawings()
print(f"Found {len(paths)} vector drawing paths")

# Get text blocks
text = page.get_text("dict", clip=clip)
print(f"Text blocks in clip: {len(text['blocks'])}")
for block in text['blocks']:
    if block['type'] == 0:  # text
        for line in block['lines']:
            for span in line['spans']:
                print(f"  Text: '{span['text']}' size={span['size']:.1f} color={span['color']}")

# Now render page but cover all images with white rectangles first
# Create a new page with images removed
import copy

# The trick: create a temporary PDF with images removed
new_doc = fitz.open()
new_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)

# Copy only vector/text content using page's display list but filtering images
# Use page.get_displaylist() and filter
dl = page.get_displaylist()

# Render to white background WITHOUT images by redacting image areas
# Get image bboxes on page
img_list = page.get_image_info()
print(f"\nImage locations on page:")
for img in img_list:
    print(f"  {img['bbox']} size={img['width']}x{img['height']}")

# Draw the page, then overlay white on image areas
pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False, colorspace=fitz.csRGB)
arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()

# For each image bbox, fill with mid-gray so we can threshold later
# Actually - just render and then isolate white text via threshold
img_full = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
arr = np.array(img_full, dtype=np.float32)

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

# White pixels in logo: R,G,B all > 200 AND they're close to each other (neutral)
# Background has varied colors
is_white = (r > 200) & (g > 200) & (b > 200)
# Also semi-white (the thinner strokes)
min_channel = np.minimum(np.minimum(r, g), b)
max_channel = np.maximum(np.maximum(r, g), b)
# Neutral = max-min < 30 (grayish/white)
is_neutral_bright = (min_channel > 160) & ((max_channel - min_channel) < 40)

logo_mask = is_white | is_neutral_bright

# Build RGBA: white logo on transparent
rgba = np.zeros((pix.height, pix.width, 4), dtype=np.uint8)
rgba[:,:,:3] = np.array(img_full)
rgba[:,:,3] = (logo_mask * 255).astype(np.uint8)

result = Image.fromarray(rgba, 'RGBA')
result.save(r'C:\Users\pennw\Downloads\SAI_logo_transparent_v2.png', 'PNG')
print(f"\nSaved: {result.width} x {result.height}")
