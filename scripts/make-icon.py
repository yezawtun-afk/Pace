from PIL import Image, ImageDraw

SIZE = 1024
CREAM = (251, 251, 248, 255)
SAGE = (107, 127, 94, 255)
SAGE_DARK = (90, 107, 78, 255)

def make_icon(path):
    img = Image.new('RGBA', (SIZE, SIZE), CREAM)
    d = ImageDraw.Draw(img)

    # Soft sage rounded square in the centre (squircle-ish via rounded rect)
    pad = 120
    d.rounded_rectangle(
        (pad, pad, SIZE - pad, SIZE - pad),
        radius=220,
        fill=SAGE,
    )

    # Leaf: a vertical ellipse tilted, drawn as a polygon approximation
    import math
    cx, cy = SIZE // 2, SIZE // 2
    # leaf body
    leaf = []
    for i in range(40):
        t = i / 39.0
        # parametric leaf: x = sin(t*pi)*width, y from top to bottom
        x = cx + int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
        y = cy - 260 + int(t * 520)
        leaf.append((x, y))
    # mirror back
    for i in range(39, -1, -1):
        t = i / 39.0
        x = cx - int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
        y = cy - 260 + int(t * 520)
        leaf.append((x, y))
    d.polygon(leaf, fill=(255, 255, 255, 235))

    # stem
    d.line([(cx, cy - 260), (cx, cy + 260)], fill=SAGE_DARK, width=8)

    # centre vein
    d.line([(cx, cy - 220), (cx, cy + 220)], fill=(107, 127, 94, 120), width=3)

    img.save(path)
    print('saved', path)

make_icon(r'C:\Users\Lenovo\Desktop\Pace\assets\images\icon.png')
make_icon(r'C:\Users\Lenovo\Desktop\Pace\assets\images\splash-icon.png')
make_icon(r'C:\Users\Lenovo\Desktop\Pace\assets\images\favicon.png')

# Android adaptive foreground: leaf on transparent
fg = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
fd = ImageDraw.Draw(fg)
import math
cx, cy = SIZE // 2, SIZE // 2
leaf = []
for i in range(40):
    t = i / 39.0
    x = cx + int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
    y = cy - 260 + int(t * 520)
    leaf.append((x, y))
for i in range(39, -1, -1):
    t = i / 39.0
    x = cx - int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
    y = cy - 260 + int(t * 520)
    leaf.append((x, y))
fd.polygon(leaf, fill=(255, 255, 255, 255))
fd.line([(cx, cy - 260), (cx, cy + 260)], fill=(255, 255, 255, 255), width=10)
fg.save(r'C:\Users\Lenovo\Desktop\Pace\assets\images\android-icon-foreground.png')
print('saved foreground')

# background for adaptive icon
bg = Image.new('RGBA', (SIZE, SIZE), (233, 240, 230, 255))
bg.save(r'C:\Users\Lenovo\Desktop\Pace\assets\images\android-icon-background.png')
print('saved background')

# monochrome
mono = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
md = ImageDraw.Draw(mono)
leaf = []
for i in range(40):
    t = i / 39.0
    x = cx + int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
    y = cy - 260 + int(t * 520)
    leaf.append((x, y))
for i in range(39, -1, -1):
    t = i / 39.0
    x = cx - int(math.sin(t * math.pi) * 150 * (1 - abs(t - 0.5) * 0.6))
    y = cy - 260 + int(t * 520)
    leaf.append((x, y))
md.polygon(leaf, fill=(0, 0, 0, 255))
md.line([(cx, cy - 260), (cx, cy + 260)], fill=(0, 0, 0, 255), width=10)
mono.save(r'C:\Users\Lenovo\Desktop\Pace\assets\images\android-icon-monochrome.png')
print('saved monochrome')
