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
| [[#Convert]] | Batch: sample face colors, match an existing palette, snap face UVs, assign Palette material |
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
1. Set a **Palette material** (and Detect grid if Columns/Rows look wrong).
2. Select a textured mesh with an active UV layer.
3. N-Panel → PolyPaletter → Convert.
4. Use Pick color to fix individual faces; use Adjust to nudge shade/hue on the palette grid.
## Palette
Scene sources for Convert, Detect grid, and Pick fallback.
- **Palette material** - Convert assigns this material. The image comes from Principled Base Color, else the first Image Texture.
- **Palette image** - used for matching when set; wins over the palette material image if both are set.
- **Columns / Rows** - shared grid size (columns = shade, rows = hue for Adjust).
### Detect grid
Estimates columns and rows from the palette image (dominant color-block size along mid-lines).
- **Detect grid** - run detection now; also runs when you change Palette image or Palette material.
- If detection fails, set Columns and Rows yourself.
## Convert
Batch-sample face colors, match the scene palette, snap face UVs, assign the Palette material.
1. Set **Palette material** (required). Optional Palette image wins for matching if both are set.
2. Select mesh object(s) with an active UV layer.
3. N-Panel → PolyPaletter → Convert → **Convert**.
Convert always assigns the Palette material (it clears other material slots on the object).
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
## Mesh-face picking
- The **current selection** is the destination. Keep the faces that you want to change selected before you start Pick.
- The **clicked visible face** is the source. It can belong to another visible mesh and does not need to be selected.
- Pick uses the face shown in the 3D View, then reads the source mesh face for its palette cell or colour. Modifiers and quad-view panes are supported.
- A click on empty space passes through. Pick does not select destination faces for you.
### Select color
Expands the Edit Mode selection to all faces whose UVs fall in the same palette cell(s) as the currently selected faces.
### Adjust
In Edit Mode with a palette resolved, nudge each selected face by one cell. Materials are never changed. Clamps at grid edges (no wrap). Off-grid UVs are skipped. When STEP detect succeeds on the resolved image, Adjust writes Columns and Rows.

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
PolyPaletter operators are the public script API. An agent in a running Blender (for example MCP `execute_python`) can call them like the N-panel buttons.

List every operator:
```python
dir(bpy.ops.polypaletter)
# or
bpy.ops.polypaletter.help()
```

Typical calls:
```python
bpy.ops.polypaletter.convert()
bpy.ops.polypaletter.detect_grid()
bpy.ops.polypaletter.snap_uvs(cell_x=2, cell_y=0)
bpy.ops.polypaletter.darken()
bpy.ops.polypaletter.brighten()
bpy.ops.polypaletter.hue_up()
bpy.ops.polypaletter.hue_down()
bpy.ops.polypaletter.select_same_color()
```

Mouse **Pick** needs a click. For scripts, list palette HEX values, then snap:
```python
bpy.ops.polypaletter.list_colors()          # reports: 0,0 #AABBCC | 1,0 #112233 | …
bpy.ops.polypaletter.snap_color(hex="#AABBCC")  # exact HEX, else nearest swatch
```

`list_colors` uses the same palette resolve as Pick (active object first). `snap_color` does not change materials.
## Pick display
Edit → Preferences → Extensions → PolyPaletter

| Setting | Behaviour |
| --- | --- |
| Pie menu | Keymap row in Preferences. Default is Alt+P. Click the shortcut block to assign a new key. |
| Pick display | Viewport overlay (default) or Image Editor |
| Overlay position X/Y | Place the swatch HUD in the 3D View (higher Y moves it down) |
| Overlay scale | Size multiplier for the overlay |

| Mode | Behaviour |
| --- | --- |
| Viewport overlay | Swatch grid in the 3D View; works in fullscreen (Ctrl+Space) |
| Image Editor | Real palette texture in an Image Editor (may split the 3D View) |
## Pie menu
Press **Alt+P** in the 3D View (default). Rebind it in Preferences. Same actions as the N-panel, no Pie Menu Editor required.

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
- Convert is greyed out / reports no Palette Material?
  - Set **Palette material** in the Palette panel. Convert always assigns that material.
- Convert only affected some faces in Object Mode?
  - Object Mode always processes the whole mesh. Switch to Edit Mode to limit to a selection.
- Pick ignores my object's material?
  - Pick prefers the active object's palette when present; scene Palette image/material are fallbacks.
- Pick does not snap after I click a mesh face?
  - Keep the destination faces selected, click a visible mesh face outside the overlay, and check the status text. Empty-space clicks pass through; Pick does not select the destination faces automatically.
- Overlay sits under Blender UI?
  - Move Overlay position in Preferences; raise Y to move the HUD down.
- Adjust moved the wrong cells?
  - Adjust runs STEP detect and may rewrite Columns and Rows. Set them yourself if detect is wrong.
- Alt+P does nothing / conflicts with another binding?
  - Edit → Preferences → Extensions → PolyPaletter → under **Keymap**, click the shortcut block and press a new key. Uncheck the row to disable it.
## Limits
- Does not generate a palette from the mesh. Supply a palette grid (columns = shade, rows = hue).
- Does not generate meshes from images (that is PolyVec).
- Does not export SVG (use PolyVec Export SVG with Face Color → UV Palette).
- No UV inset tooling.
## Support
[contact@polytigr.com](mailto:contact@polytigr.com)
Target reply: within 72 hours.
