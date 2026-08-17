---
title: PolyPaletter
type: plugin
status: public
price: "$19"
paid: true
software:
  - Blender
tags:
  - software/blender
cssclasses:
  - prose
aliases:
  - plugins/polypaletter
  - tools/polypaletter
  - plugins/polypalette
  - tools/polypalette
  - PolyPalette
---
# PolyPaletter
Blender 4.2+ extension. Snap mesh face UVs to a color palette for flat-color and low-poly work.

Convert batches a mesh onto an existing palette, Pick fixes faces by clicking swatches or mesh faces, and Adjust nudges shade and hue one cell at a time. Materials rewrite only on Convert; Pick and Adjust change UVs only.
## Features
- Convert: match an existing palette grid, snap every face UV, assign the Palette material
- Pick: viewport overlay palette (fullscreen-friendly) or Image Editor mode
- Click a mesh face in Pick to match the selection to that face's swatch, including faces on objects that are not selected
- Adjust: darken/brighten and hue shift on the palette grid
- Lab / RGB / weighted color matching and texture blur sampling
- Install from Disk as a Blender extension
## Requirements
- Blender 4.2+ (dev target 4.5 LTS)
- OS: Windows primarily tested; extension is not platform-locked
## Documentation
Full workflow reference: [[polypaletter/docs|PolyPaletter Docs]]
## Support
[contact@polytigr.com](mailto:contact@polytigr.com)
Target reply: within 72 hours.
