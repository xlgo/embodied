# Embodied

本仓库包含具身智能与仿真相关的实验及辅助工具。

## psv (Photo Sphere Viewer - 画板管理台)

`psv` 是一个基于 React + TypeScript/JavaScript + Vite 构建的 360 度全景图（Photo Sphere Viewer）标注与画板管理系统。

### 主要功能
- **全景展示**：基于 `@photo-sphere-viewer/core` 和 Three.js 实现流畅的 360 度全景图浏览。
- **多边形标注与编辑**：
  - 支持交互式绘制多边形（Polygon）。
  - 支持拖动多边形顶点以修改形状。
  - 支持点击顶点上的 `×` 按钮删除特定点。
  - 在多边形编辑状态下，双击多边形边缘线条可插入新的控制点。
- **多样化标记（Markers）**：
  - 支持普通点标注、自定义 HTML 气泡框、文本标记等。
- **标注管理侧边栏**：提供标注列表展示，支持快速定位视角、开启/关闭多边形编辑模式以及删除标注。

### 开发启动
进入项目目录并启动开发服务：
```bash
cd psv
npm install
npm run dev
```