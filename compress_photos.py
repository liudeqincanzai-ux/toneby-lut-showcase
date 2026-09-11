# -*- coding: utf-8 -*-
"""批量压缩 photos/ 下的图片：长边限 1600px、JPEG q82（视觉无损级别）"""
import os, sys
from PIL import Image, ImageOps

PHOTOS = sys.argv[1]
MAX_EDGE = 1600
QUALITY = 82

total_before = total_after = 0
for name in sorted(os.listdir(PHOTOS)):
    path = os.path.join(PHOTOS, name)
    if not os.path.isfile(path):
        continue
    ext = name.lower().rsplit(".", 1)[-1]
    if ext not in ("jpg", "jpeg", "png", "webp"):
        continue
    before = os.path.getsize(path)
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)  # 先按 EXIF 摆正像素，再丢弃旋转标记
    im = im.convert("RGB") if ext in ("jpg", "jpeg") else im
    w, h = im.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    out = path if ext in ("jpg", "jpeg") else path  # 统一原地覆盖
    save_kw = {"quality": QUALITY, "optimize": True} if ext in ("jpg", "jpeg", "webp") else {"optimize": True}
    if ext == "png":
        im.save(out, optimize=True)
    else:
        if ext == "webp":
            im.save(out, "WEBP", **save_kw)
        else:
            im.save(out, "JPEG", **save_kw)
    after = os.path.getsize(path)
    total_before += before
    total_after += after
    print(f"{name}: {before/1024:.0f}KB -> {after/1024:.0f}KB  ({w}x{h} -> {im.size[0]}x{im.size[1]})")

print(f"TOTAL: {total_before/1024/1024:.1f}MB -> {total_after/1024/1024:.1f}MB")
