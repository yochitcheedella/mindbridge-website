import os
from PIL import Image, ImageDraw

LOGO_PATH = 'public/logo.png'
RES_PATH = 'android/app/src/main/res'

DENSITIES = {
    'mipmap-mdpi': (48, 108),
    'mipmap-hdpi': (72, 162),
    'mipmap-xhdpi': (96, 216),
    'mipmap-xxhdpi': (144, 324),
    'mipmap-xxxhdpi': (192, 432),
}

BG_COLOR = (18, 18, 30, 255) # #12121e dark theme

def generate_icons():
    base_logo = Image.open(LOGO_PATH).convert('RGBA')
    
    for density, (icon_size, fg_size) in DENSITIES.items():
        folder = os.path.join(RES_PATH, density)
        os.makedirs(folder, exist_ok=True)
        
        # 1. Generate ic_launcher_foreground.png (108dp canvas, safe zone ~68%)
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        logo_scale = int(fg_size * 0.70)
        resized_logo_fg = base_logo.resize((logo_scale, logo_scale), Image.Resampling.LANCZOS)
        offset_fg = ( (fg_size - logo_scale) // 2, (fg_size - logo_scale) // 2 )
        fg_canvas.paste(resized_logo_fg, offset_fg, resized_logo_fg)
        fg_canvas.save(os.path.join(folder, 'ic_launcher_foreground.png'), 'PNG')
        
        # 2. Generate standard ic_launcher.png (square with subtle rounded background)
        icon_canvas = Image.new('RGBA', (icon_size, icon_size), BG_COLOR)
        logo_scale_icon = int(icon_size * 0.82)
        resized_logo_icon = base_logo.resize((logo_scale_icon, logo_scale_icon), Image.Resampling.LANCZOS)
        offset_icon = ( (icon_size - logo_scale_icon) // 2, (icon_size - logo_scale_icon) // 2 )
        icon_canvas.paste(resized_logo_icon, offset_icon, resized_logo_icon)
        icon_canvas.save(os.path.join(folder, 'ic_launcher.png'), 'PNG')
        
        # 3. Generate ic_launcher_round.png (circular mask)
        round_canvas = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
        mask = Image.new('L', (icon_size, icon_size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, icon_size, icon_size), fill=255)
        
        round_canvas.paste(icon_canvas, (0, 0), mask)
        round_canvas.save(os.path.join(folder, 'ic_launcher_round.png'), 'PNG')
        
        print(f"Generated icons for {density}: launcher={icon_size}x{icon_size}, fg={fg_size}x{fg_size}")

if __name__ == '__main__':
    generate_icons()
