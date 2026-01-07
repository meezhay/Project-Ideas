# Icon Setup Instructions

The extension requires icon files to load in Chrome. You have two options:

## Option 1: Generate Placeholder Icons (Quick Start)

Install PIL (Pillow) and run the icon generator:

```bash
pip install pillow
python3 generate_icons.py
```

This will create simple placeholder icons in the `icons/` directory.

## Option 2: Create Professional Icons

Create professional icons using design tools and place them in the `icons/` directory:

- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

## Option 3: Use Temporary Placeholders

For quick testing, you can use any square PNG images renamed to the required filenames. The extension will work with any images, though they may not look professional.

## Design Suggestions

- Use purple/blue gradient colors (#667eea to #764ba2)
- Include academic symbols (graduation cap, book, shield)
- Add a security/check element
- Keep design simple and recognizable at small sizes
