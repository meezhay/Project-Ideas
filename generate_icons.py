#!/usr/bin/env python3
"""
Generate placeholder icons for the Academic Conference Check extension.
This creates simple placeholder PNG files with the required sizes.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple icon with gradient background and text."""
    # Create image with gradient-like purple color
    img = Image.new('RGB', (size, size), color='#764ba2')
    draw = ImageDraw.Draw(img)

    # Add a lighter purple circle
    circle_margin = size // 8
    draw.ellipse(
        [circle_margin, circle_margin, size - circle_margin, size - circle_margin],
        fill='#667eea'
    )

    # Add text if icon is large enough
    if size >= 48:
        try:
            # Try to use a default font
            font_size = size // 3
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()

        text = "AC"
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Center the text
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - bbox[1]

        draw.text((x, y), text, fill='white', font=font)

    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate all required icon sizes."""
    icons_dir = 'icons'

    # Ensure icons directory exists
    os.makedirs(icons_dir, exist_ok=True)

    # Generate icons
    sizes = [
        (16, 'icon16.png'),
        (48, 'icon48.png'),
        (128, 'icon128.png')
    ]

    for size, filename in sizes:
        filepath = os.path.join(icons_dir, filename)
        create_icon(size, filepath)

    print("\n✓ All placeholder icons created successfully!")
    print("Note: These are simple placeholders. Replace them with professional icons before publishing.")

if __name__ == '__main__':
    main()
