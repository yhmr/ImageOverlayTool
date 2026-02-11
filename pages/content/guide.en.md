---
title: 'User Guide'
date: 2026-02-11T00:00:00+09:00
draft: false
layout: 'page'
---

# User Guide

**ImageOverlayTool** is a desktop application for overlaying and comparing multiple images with precision.

## 1. Installation

### Download

Download the latest version from [GitHub Releases](https://github.com/yhmr/ImageOverlayTool/releases).

- **Windows**: `.exe` or `.zip` file
- **Linux**: `.AppImage` or `.deb` file

### System Requirements

- Windows 10 or later / Linux (Ubuntu 20.04+)

## 2. Basic Operations

### Loading Images

1. Select "Image Settings" from the menu, or press `Ctrl+I` (`Cmd+I` on macOS).
2. The Image Settings window will open. Click the "Add" button to select image files.
3. By loading multiple images, you can overlay and display them as layers.

### Manipulating Images

- **Move**: Drag an image to adjust its position.
- **Transform**: Drag the corner anchor points for perspective correction (free transform).
- **Zoom**: Use the mouse wheel to zoom in and out of the entire stage.

### Layer Management

- In the Image Settings window, you can view a list of images, reorder them by drag & drop, and adjust their opacity.
- Layer order changes are reflected in real-time on the main window.

## 3. Customization

### Changing Background Color

Right-click on the canvas to change the background color from the context menu.

### Persistent Settings

Window size, position, background color, and language settings are automatically saved and restored on next launch.

## 4. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+I` / `Cmd+I` | Open Image Settings window |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |

---

If you have any questions, please post them to [GitHub Issue](https://github.com/yhmr/ImageOverlayTool/issues).
