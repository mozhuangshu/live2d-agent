#!/usr/bin/env python3
"""Local raster puppet pack, not a Cubism model. Never performs network I/O."""
import argparse
import base64
import io
import json
import math
from pathlib import Path
import statistics
import warnings
from PIL import Image, ImageDraw, ImageOps

MAX_PIXELS = 16_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
DEFAULT = {
    'leftEye': [.32, .35, .13, .055], 'rightEye': [.55, .35, .13, .055],
    'leftBrow': [.32, .31, .13, .025], 'rightBrow': [.55, .31, .13, .025],
    'mouth': [.42, .48, .16, .05],
}

def regions(value):
    if not isinstance(value, dict) or set(value) != set(DEFAULT):
        raise ValueError('landmarks must contain exactly leftEye, rightEye, leftBrow, rightBrow, mouth')
    result = {}
    for key, box in value.items():
        if not isinstance(box, list) or len(box) != 4 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in box):
            raise ValueError(f'{key}: expected [x, y, width, height] normalized numbers')
        x, y, w, h = box
        if min(x, y) < 0 or min(w, h) < .005 or x+w > 1 or y+h > 1:
            raise ValueError(f'{key}: box must fit inside image with positive size')
        result[key] = box
    keys = list(result)
    for i, key in enumerate(keys):
        x,y,w,h = result[key]
        for other in keys[i+1:]:
            a,b,c,d = result[other]
            if max(x,a) < min(x+w,a+c) and max(y,b) < min(y+h,b+d):
                raise ValueError(f'{key} and {other}: feature boxes must not overlap')
    return result

def create(source, out, landmarks=None, name='My avatar'):
    if out.exists():
        raise ValueError('Output already exists; choose a new output directory (no overwrite).')
    if source.stat().st_size > 20*1024*1024:
        raise ValueError('Input exceeds 20 MiB')
    boxes = regions(DEFAULT if landmarks is None else landmarks)
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(source) as raw:
            if raw.format not in ('PNG', 'JPEG', 'WEBP') or getattr(raw, 'n_frames', 1) != 1:
                raise ValueError('Use one static PNG, JPEG or WebP image')
            if raw.width*raw.height > MAX_PIXELS or min(raw.size) < 64:
                raise ValueError('Image must be at least 64px per side and at most 16 million pixels')
            im = ImageOps.exif_transpose(raw).convert('RGBA')
            im.thumbnail((1536,1536), Image.Resampling.LANCZOS)
            if min(im.size) < 64:
                raise ValueError("Image aspect ratio is too extreme: resized sides must remain at least 64px")
    # New image drops EXIF, ICC and other source metadata.
    clean = Image.new('RGBA', im.size)
    clean.paste(im)
    buffer = io.BytesIO()
    clean.save(buffer, format='PNG')
    parts = {}
    for key, box in boxes.items():
        x,y,w,h = box
        px,py,pw,ph = x*im.width,y*im.height,w*im.width,h*im.height
        # Median of a narrow perimeter estimates skin; calibration is still necessary.
        samples=[]
        for i in range(32):
            for sx,sy in [(px+pw*i/31,py-2),(px+pw*i/31,py+ph+2)]:
                samples.append(im.getpixel((max(0,min(im.width-1,int(sx))),max(0,min(im.height-1,int(sy))))))
        color='#'+''.join(f'{int(statistics.median(p[c] for p in samples)):02x}' for c in range(3))
        parts[key]={'box':box, 'fill':color}
    pack={'version':1,'kind':'raster-puppet','name':str(name)[:80], 'width':im.width,'height':im.height,
          'image':'data:image/png;base64,'+base64.b64encode(buffer.getvalue()).decode(), 'features':parts}
    out.mkdir(parents=True, exist_ok=False)
    (out/'character.avatar.json').write_text(json.dumps(pack,ensure_ascii=False),encoding='utf-8')
    (out/'landmarks.json').write_text(json.dumps(boxes,indent=2),encoding='utf-8')
    preview=clean.convert('RGB'); draw=ImageDraw.Draw(preview)
    for key,(x,y,w,h) in boxes.items():
        rect=(int(x*im.width),int(y*im.height),int((x+w)*im.width),int((y+h)*im.height))
        draw.rectangle(rect,outline='#ff00ff',width=2);draw.text(rect[:2],key,fill='#ff00ff')
    preview.save(out/'calibration.png')
    return pack

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('image',type=Path);p.add_argument('--out',type=Path,required=True)
    p.add_argument('--landmarks',type=Path);p.add_argument('--name',default='My avatar')
    a=p.parse_args()
    try:
        create(a.image,a.out,json.loads(a.landmarks.read_text()) if a.landmarks else None,a.name)
    except (ValueError,OSError,Image.DecompressionBombError,Image.DecompressionBombWarning) as e:
        p.exit(1,f'Cannot create avatar: {e}\n')
    print(f'Created {a.out}/character.avatar.json (raster puppet, NOT Live2D Cubism). Inspect calibration.png before use.')
