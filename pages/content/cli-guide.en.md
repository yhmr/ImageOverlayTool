---
title: 'Command Line (CLI) Integration Guide'
date: 2026-02-28T00:00:00+09:00
draft: false
layout: 'page'
---

# Command Line (CLI) Integration Guide

**ImageOverlayTool** features powerful command line (CLI) integration capabilities, allowing you to control the initial state from scripts or other applications, or send commands to a running application instance from the outside.

---

## 1. Overview and Routing Rules

CLI functions are mainly routed to two subcommands: **`startup`** and **`control`**.

- **`startup` command**:
  - Used to specify the initial state when **newly launching** the app.
  - Only valid when ImageOverlayTool is not already running.
- **`control` command**:
  - Used to perform external operations (like adding images or changing opacity) on an **already running** instance of ImageOverlayTool.
  - Results in an error if the app is not running.

---

## 2. Startup Options (`startup`)

You can specify the following options when launching the app.

```bash
ImageOverlayTool startup [options]
```

### Main Options

| Option | Argument | Description |
|---|---|---|
| `--scene` | `<path>` | Loads the specified `.scene.json` file and applies its initial state. This option is mutually exclusive with other image loading options. |
| `--images` | `<path1> <path2> ...` | Loads one or more image files. |
| `--opacity` | `<0-100>` | Sets the initial opacity (0-100%) of the loaded images. |
| `--position` | `<x,y>` | Specifies the initial display position of the window. |
| `--size` | `<w,h>` | Specifies the initial size of the window. |
| `--always-on-top` | (none) | Starts with "Always on Top" enabled. |
| `--click-through` | (none) | Starts with "Click-Through Mode" enabled (requires `--always-on-top`). |
| `--fullscreen` | (none) | Starts in fullscreen mode. |
| `--silent` | (none) | Skips displaying the splash screen. |
| `--minimize` | (none) | Starts minimized. |

---

## 3. External Control Commands (`control`)

You can send the following operations to an already running app instance.

```bash
ImageOverlayTool control [command]
```

### Available Commands

| Command | Argument | Description |
|---|---|---|
| `--add-image` | `<path>` | Adds the specified image file to the canvas. You can also use `--opacity <0-100>` together to specify the opacity. |
| `--set-opacity` | `<0-100>` | Changes the opacity of the currently selected image. |
| `--switch-scene` | `<path.scene.json>` | Discards the current project state and switches to the state of the specified Scene file. |
| `--capture-window` | `<path.png｜path.jpg>` | Captures the full current app window and saves it to the specified path. |
| `--save-stage` | `<path.png｜path.jpg>` | Saves the current stage-rendered image to the specified path. |

---

## 4. Help and Other Features

### Displaying Help

You can check detailed usage for each command with the `--help` option.

```bash
# General help
ImageOverlayTool --help

# Subcommand help
ImageOverlayTool startup --help
ImageOverlayTool control --help
```

### Helping Output in JSON Format

For integration with other tools, there is a feature to output help information in JSON format (`--format json`).

```bash
ImageOverlayTool --help startup --format json
```

### Scene Template and Validation

Auxiliary commands are also available to check the structure of Scene files and validate them.

- `--scene-template v1`: Outputs a JSON template for a v1 format Scene file.
- `--validate-scene <path>`: Validates whether the structure of the specified Scene file is correct (add `--format json` to output the result in JSON).

---

## 5. Examples

### Launching from a Batch File (with initial settings)

Example of launching with a frequently used reference image and layout set at once.

```bash
ImageOverlayTool startup --images "C:\assets\reference.png" --opacity 50 --always-on-top
```

### Transferring an Image from an External Tool

Example of throwing an image into the running canvas from "Open with External Tool" of another image viewer or editor.

```bash
ImageOverlayTool control --add-image "%1"
```

### Exporting State (Automation)

Example of exporting the current state to image files in the background.

```bash
ImageOverlayTool control --capture-window "C:\out\current-state.png"
ImageOverlayTool control --save-stage "C:\out\current-stage.png"
```
