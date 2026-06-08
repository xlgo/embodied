# Embodied

English | [Chinese](README.zh-CN.md)

This repository contains experiments and supporting tools related to embodied intelligence, simulation, and visual annotation workflows.

## Projects

### psv

`psv` is a 360-degree panorama annotation and board-management application built with React, Vite, Photo Sphere Viewer, Ant Design, and Three.js.

Key capabilities:

- Interactive panorama viewing powered by `@photo-sphere-viewer/core`.
- Marker and annotation management for points, text/image labels, lines, arrows, Bezier curves, polygons, and circles.
- Editable shape geometry, including draggable vertices, virtual midpoint insertion handles, and shape-specific editing controls.
- A decoupled drawing-tool registry that lets new tools be added through `src/components/tools/*Tool.jsx`.
- Floating configuration panels for style, metadata, and linked actions.
- Marker list and filtering controls for navigating and managing annotations.

## Development

Start the `psv` development server:

```bash
cd psv
npm install
npm run dev
```

Build the project:

```bash
cd psv
npm run build
```

## Repository Layout

```text
.
+-- psv/        # Panorama annotation application
+-- birthday/   # Standalone visual page/demo
+-- README.md   # English documentation
`-- README.zh-CN.md # Chinese documentation
```
