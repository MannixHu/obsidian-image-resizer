# Image Resizer for Obsidian

**English | [中文](./README.md)**

A lightweight Obsidian plugin that allows you to resize images by dragging from the corner.

## Features

- **Drag to Resize** - Resize images by dragging from the bottom-right corner
- **Visual Feedback** - Cursor changes to resize indicator when hovering over the corner
- **Auto-save** - Automatically updates the image size in your Markdown source
- **Supports Multiple Formats** - Works with both Wiki links (`![[image.png]]`) and Markdown links (`![](image.png)`)
- **Performance Optimized** - Uses throttling (~60fps) to ensure smooth resizing

## Usage

1. Hover your mouse over any image in your note
2. Move to the bottom-right corner - the cursor will change to a resize indicator
3. Click and drag to resize the image
4. Release to confirm the new size

## How It Works

When you resize an image, the plugin:

1. Detects mouse position relative to the image corner (16px detection zone)
2. Shows resize cursor when in the corner zone
3. On drag, calculates new width based on mouse movement
4. On release, updates the Markdown source with the new size

**Wiki links:** `![[image.png]]` → `![[image.png|300]]`

**Markdown links:** `![alt](image.png)` → `![alt|300](image.png)`

## Installation

### Manual Installation

1. Download `main.js` and `manifest.json` from the releases
2. Create a folder `image-resizer` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian settings

### Build from Source

```bash
# Clone the repository
git clone https://github.com/anthropics/obsidian-image-resizer.git

# Install dependencies
npm install

# Build
npm run build

# Copy to your vault
cp main.js manifest.json /path/to/vault/.obsidian/plugins/image-resizer/
```

## Technical Details

| Parameter | Value |
|-----------|-------|
| Corner Detection Zone | 16px × 16px from bottom-right |
| Minimum Width | 50px |
| Throttle Interval | 16ms (~60fps) |
| Aspect Ratio | Preserved (height set to `auto`) |

## License

MIT License

## Author

Mannix
