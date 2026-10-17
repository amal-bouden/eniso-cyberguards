import os
from PIL import Image

# Use image.png if present, otherwise fall back to digital_noise.png
image_file = "image.png" if os.path.exists("image.png") else "digital_noise.png"
img = Image.open(image_file).convert("RGB")
w, h = img.size

# red-channel LSBs, row by row (xy order)
bits = [img.getpixel((x, y))[0] & 1 for y in range(h) for x in range(w)]

def to_bytes(b):
    return bytes(int("".join(map(str, b[i:i+8])), 2) for i in range(0, len(b) - 7, 8))

length = int("".join(map(str, bits[:32])), 2)       # 31
data = to_bytes(bits[32:32 + length * 8])

print(data)
print(bytes(c ^ 0x2A for c in data).decode())
