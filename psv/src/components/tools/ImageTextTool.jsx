import React, { useState } from 'react';

const presetIcons = [
  { icon: '💬', color: '#007aff', label: '蓝色对话框' },
  { icon: '📍', color: '#ff3b30', label: '红色定位销' },
  { icon: '📍', color: '#007aff', label: '蓝色定位销' },
  { icon: '📍', color: '#34c759', label: '绿色定位销' },
  { icon: '📍', color: '#ffcc00', label: '黄色定位销' },
  { icon: '🚩', color: '#ff3b30', label: '红旗' },
  { icon: '🏠', color: '#5856d6', label: '房屋' },
  { icon: '⚠️', color: '#ff9500', label: '警示' },
];

export default {
  id: 'image_text',
  name: '图文标绘',
  type: 'point',
  match: (m) => m.type === 'point' && m.icon === '💬',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <line x1="12" y1="11" x2="12" y2="20" />
      <ellipse cx="12" cy="20" rx="4" ry="1.5" fill="currentColor" />
    </svg>
  ),
  defaultConfig: {
    type: 'point',
    title: '新建图文标签',
    color: '#007aff',
    icon: '💬',
    iconSize: 28,
    showTitle: true,
    leaderColor: '#00ffcc', // 线条与边框颜色
    textColor: '#ffffff', // 文本颜色
    textBg: 'rgba(22, 25, 34, 0.95)', // 文本背景颜色
    textPosition: 'top-right', // 文本位置: top-right, top-left, bottom-right, bottom-left
    category: 'none',
    layerFilter: 'always',
    coordType: 'fov',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: []
  },
  StylePanel: function StylePanel({ draftMarker, onUpdateDraft, StepInput, ColorInput }) {
    return (
      <>
        {/* 文本位置 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>文本位置</span>
          <select
            className="custom-select"
            value={draftMarker?.textPosition || 'top-right'}
            onChange={(e) => onUpdateDraft({ textPosition: e.target.value })}
            style={{ flex: 1 }}
          >
            <option value="top-right">右上</option>
            <option value="top-left">左上</option>
            <option value="bottom-right">右下</option>
            <option value="bottom-left">左下</option>
          </select>
        </div>

        {/* 线条颜色 */}
        <ColorInput
          label="线条颜色"
          value={draftMarker?.leaderColor || '#00ffcc'}
          onChange={(val) => onUpdateDraft({ leaderColor: val })}
        />

        {/* 文本颜色 */}
        <ColorInput
          label="文本颜色"
          value={draftMarker?.textColor || '#ffffff'}
          onChange={(val) => onUpdateDraft({ textColor: val })}
        />

        {/* 背景颜色 */}
        <ColorInput
          label="背景颜色"
          value={draftMarker?.textBg || 'rgba(22, 25, 34, 0.95)'}
          onChange={(val) => onUpdateDraft({ textBg: val })}
        />
      </>
    );
  }
};

