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

### ptz-map-localizer

`ptz-map-localizer` is a PTZ camera click-to-map localization prototype built with React, Vite, TypeScript, and the TianDiTu JavaScript API.

Key capabilities:

- Logs into the reference panoramic platform and reads captcha/login/home data through the `/pano/*` HTTP APIs.
- Converts clicked image pixels, PTZ pan/tilt/FOV, camera height, and calibration offsets into WGS84 target coordinates.
- Displays camera and target positions on TianDiTu with a confidence state and error-radius overlay.
- Includes demo frame/PTZ data and unit tests for the core localization math.

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

Start the `ptz-map-localizer` development server:

```bash
cd ptz-map-localizer
npm install
npm run dev
```

Run its tests:

```bash
cd ptz-map-localizer
npm run test
```

## Repository Layout

```text
.
+-- psv/        # Panorama annotation application
+-- ptz-map-localizer/ # PTZ image-click to map-localization prototype
+-- birthday/   # Standalone visual page/demo
+-- README.md   # English documentation
`-- README.zh-CN.md # Chinese documentation
```
