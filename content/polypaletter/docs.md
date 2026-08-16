---
title: PolyPaletter Docs
cssclasses:
  - prose
aliases:
  - plugins/polypaletter/docs
  - polypaletter/polypaletter-docs
  - plugins/polypalette/docs
  - polypalette/polypalette-docs
  - polypalette/docs
---
# PolyPaletter Docs
Blender 4.2+ extension for low-poly / flat-color art. Snap mesh face UVs to a color palette.

| Workflow | Use when |
| --- | --- |
| [[#Convert]] | Batch: sample face colors, cluster or match a palette, snap face UVs, update materials |
| [[#Pick color]] | Manual: click a swatch (viewport overlay by default) or a mesh face to snap selected faces |
| [[#Adjust]] | Edit Mode: nudge selected faces ±1 shade or hue on the palette grid |
**License:** GPL-3.0-or-later · **Author:** PolyTigr · **Target:** Blender 4.5 LTS · **Minimum:** 4.2
Product page: [[PolyPaletter]] · Store hub: [[Store]]
## Install
1. Download the extension zip (must contain `blender_manifest.toml` and `__init__.py`).
2. Blender → Edit → Preferences → Extensions → Install from Disk.
3. Enable PolyPaletter.
### Dev install
Junction/symlink the package to:
```
%APPDATA%\Blender Foundation\Blender\4.5\extensions\user_default\polypaletter
```
Use `user_default`, not `blender_org`. Reload by disable → enable (do not `importlib.reload`).
## Quick start
1. Select a textured mesh with an active UV layer.
2. N-Panel → PolyPaletter → Convert → Auto generate → Convert.
3. Use Pick color to fix individual faces; use Adjust to nudge shade/hue on the palette grid.
## Palette
Scene sources for Convert (existing), Detect grid, and Pick fallback.
- **Palette material** - material whose first Image Texture supplies the palette.
- **Palette image** - used when no palette material is set (image wins if both are set).
- **Columns / Rows** - shared grid size (columns = shade, rows = hue for Adjust).
### Detect grid
Estimates columns and rows from the palette image.
- **Grid detect** - Step (default, more reliable) or Transitions (Lab).
- **Detect grid** - run detection now; also runs when you change Palette image or Palette material.
- Methods never fall back to each other.
## Convert
Batch-sample face colors, match a palette, snap face UVs, update materials.
1. Select mesh object(s) with an active UV layer.
2. N-Panel → PolyPaletter → Convert.
3. Choose **Auto generate** or **Use existing**.
4. Click **Convert**.

| Mode | Palette | Materials |
| --- | --- | --- |
| Auto generate | Clusters face colors into a new square palette | Always replaces with a new palette material |
| Use existing | Matches to scene Palette image / material grid | Always assigns the Palette material |
- Object Mode: whole mesh (ignores leftover Edit face selection).
- Edit Mode: selected faces, or all faces if none selected.
- Multi-object selection reports `Processed N/M`.
### Color matching
How Convert matches sampled face colors to palette swatches: RGB / Weighted RGB / Lab (default).
### Texture blur
Sample radius (0-20) when reading textured materials. `0` = single pixel.
Flat materials (no albedo texture) use Principled Base Color; values are converted from Blender linear color to sRGB before matching so dark greys do not collapse to black.
## Pick color
Manual swatch or mesh-face matching. Materials are never changed.
1. Select a mesh whose material has a palette Image Texture (or set scene Palette image / material as fallback).
2. Edit Mode → select faces (or Object Mode with meshes selected).
3. Click **Pick color** → click a swatch, or click a visible mesh face (including objects that are not selected) to match the current selection to that face's colour.
4. UVs snap; materials stay as they are. The sampled object is not edited.
Pick prefers the active object's palette for that session. Scene Palette image / material are used when the object has none. Cols/rows are auto-detected for the image in use when possible.
**ESC** / **RMB** / **Stop pick** cancels.
Status while Pick is on: `LMB palette: Snap  |  LMB mesh: Match any face  |  ESC / RMB: Cancel`.
### Select color
Expands the Edit Mode selection to all faces whose UVs fall in the same palette cell(s) as the currently selected faces.
### Adjust
In Edit Mode with a palette resolved, nudge each selected face by one cell. Materials are never changed. Clamps at grid edges (no wrap). Off-grid UVs are skipped.

| Axis | Meaning | Buttons |
| --- | --- | --- |
| Columns | Shade | Darken (−1) / Brighten (+1) |
| Rows | Hue | Hue ↑ (−1) / Hue ↓ (+1) |
### Darken
Move selected faces one column left (darker shade).
### Brighten
Move selected faces one column right (brighter shade).
### Hue up
Move selected faces one row up (hue).
### Hue down
Move selected faces one row down (hue).
## Scripts and agents
PolyPaletter operators are the public script API. An agent in a running Blender (for example MCP) can call them like the N-panel buttons.

List every operator:
```python
dir(bpy.ops.polypaletter)
# or
bpy.ops.polypaletter.help()
```

Typical calls:
```python
bpy.ops.polypaletter.convert()
bpy.ops.polypaletter.list_colors()
bpy.ops.polypaletter.snap_color(hex="#AABBCC")
```

Mouse Pick needs a click. `list_colors` reports `cx,cy #RRGGBB`. `snap_color` uses exact HEX first, else the nearest swatch.
## Pick display
Edit → Preferences → Extensions → PolyPaletter

| Setting | Behaviour |
| --- | --- |
| Pie menu hotkey (Alt+P) | Bind Alt+P in the 3D View to the PolyPaletter pie (on by default) |
| Pick display | Viewport overlay (default) or Image Editor |
| Overlay position X/Y | Place the swatch HUD in the 3D View (higher Y moves it down) |
| Overlay scale | Size multiplier for the overlay |

| Mode | Behaviour |
| --- | --- |
| Viewport overlay | Swatch grid in the 3D View; works in fullscreen (Ctrl+Space) |
| Image Editor | Real palette texture in an Image Editor (may split the 3D View) |
## Pie menu
Press **Alt+P** in the 3D View (when the hotkey pref is on). Same actions as the N-panel, no Pie Menu Editor required.

| Direction | Action |
| --- | --- |
| West | Darken |
| East | Brighten |
| South | Hue ↓ |
| North | Hue ↑ |
| North-West | Convert |
| South-West | Select color |
| South-East | Pick color |
## Undo
Convert, Pick snap, and Adjust shifts are undoable. The Pick modal itself is not, until a snap runs. Loading a `.blend` clears a stuck pick flag.
## FAQ
- Generated palette disappeared after closing Blender?
  - Auto Convert writes a PNG under `polypaletter_generated/` next to the blend file (or in temp if the blend is unsaved). Pack the image or keep that folder.
- Convert only affected some faces in Object Mode?
  - Object Mode always processes the whole mesh. Switch to Edit Mode to limit to a selection.
- Pick ignores my object's material?
  - Pick prefers the active object's palette when present; scene Palette image/material are fallbacks.
- Overlay sits under Blender UI?
  - Move Overlay position in Preferences; raise Y to move the HUD down.
- Alt+P does nothing / conflicts with another binding?
  - Edit → Preferences → Extensions → PolyPaletter → turn **Pie menu hotkey (Alt+P)** off, or free Alt+P in the other add-on.
## Support
[contact@polytigr.com](mailto:contact@polytigr.com)
