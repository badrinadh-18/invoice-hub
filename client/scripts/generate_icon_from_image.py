import os
from PIL import Image, ImageDraw

# Path to the user‑uploaded image (the new icon design)
src_path = r'C:\Users\badri\.gemini\antigravity\brain\9e42e929-a153-49db-89ac-1f9d3fc82a82\.user_uploaded\media_1795274919411_9554a4d1.jpg'
src = Image.open(src_path).convert('RGBA')

# Destination root for Android mipmap resources
res_root = r'e:\InvoiceHub\client\android\app\src\main\res'

# Configuration: (folder, launcher size, adaptive foreground canvas size)
configs = [
    ('mipmap-mdpi', 48, 108),
    ('mipmap-hdpi', 72, 162),
    ('mipmap-xhdpi', 96, 216),
    ('mipmap-xxhdpi', 144, 324),
    ('mipmap-xxxhdpi', 192, 432),
]

for folder, icon_sz, fg_sz in configs:
    target_dir = os.path.join(res_root, folder)
    os.makedirs(target_dir, exist_ok=True)

    # 1️⃣ Standard square launcher icon
    icon = src.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
    icon.save(os.path.join(target_dir, 'ic_launcher.png'), format='PNG')

    # 2️⃣ Rounded launcher icon (masked circle)
    mask = Image.new('L', (icon_sz, icon_sz), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, icon_sz, icon_sz), fill=255)
    round_icon = Image.new('RGBA', (icon_sz, icon_sz), (0, 0, 0, 0))
    round_icon.paste(icon, (0, 0), mask)
    round_icon.save(os.path.join(target_dir, 'ic_launcher_round.png'), format='PNG')

    # 3️⃣ Adaptive foreground (larger canvas, centered icon)
    fg = Image.new('RGBA', (fg_sz, fg_sz), (0, 0, 0, 0))
    inner_sz = int(fg_sz * 0.76)  # 76 % of canvas fits safely inside adaptive mask
    inner_icon = src.resize((inner_sz, inner_sz), Image.Resampling.LANCZOS)
    offset = (fg_sz - inner_sz) // 2
    fg.paste(inner_icon, (offset, offset))
    fg.save(os.path.join(target_dir, 'ic_launcher_foreground.png'), format='PNG')
    print(f'Generated icons for {folder}: {icon_sz}×{icon_sz} (foreground {fg_sz}×{fg_sz})')

# Also generate a web‑friendly logo for the website (512 × 512 PNG)
web_logo_path = r'e:\InvoiceHub\client\public\app-logo.png'
src.resize((512, 512), Image.Resampling.LANCZOS).save(web_logo_path, format='PNG')
print('Web logo saved at', web_logo_path)
