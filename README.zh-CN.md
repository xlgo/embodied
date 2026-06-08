# Embodied

[English](README.md) | 简体中文

本仓库包含具身智能、仿真以及可视化标注流程相关的实验与辅助工具。

## 项目

### psv

`psv` 是一个基于 React、Vite、Photo Sphere Viewer、Ant Design 和 Three.js 构建的 360 度全景图标注与画板管理系统。

主要功能：

- 基于 `@photo-sphere-viewer/core` 的 360 度全景图浏览。
- 支持点位、图文标签、线段、箭头、贝塞尔曲线、多边形、圆形等标注工具。
- 支持图形几何编辑，包括拖动顶点、虚拟中点插入、以及图形专属编辑控制点。
- 提供解耦的绘制工具注册机制，可通过 `src/components/tools/*Tool.jsx` 扩展新工具。
- 提供浮动属性面板，用于配置样式、基础信息和关联动作。
- 提供标注列表与过滤工具，便于快速定位和管理标注。

## 开发

启动 `psv` 开发服务：

```bash
cd psv
npm install
npm run dev
```

构建项目：

```bash
cd psv
npm run build
```

## 仓库结构

```text
.
├── psv/              # 全景图标注应用
├── birthday/         # 独立视觉页面/演示
├── README.md         # 英文文档
└── README.zh-CN.md   # 中文文档
```
