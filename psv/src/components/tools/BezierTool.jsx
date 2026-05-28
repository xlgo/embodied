import React from 'react';

export default {
  id: 'bezier',
  name: '贝塞尔曲线标绘',
  type: 'polyline',
  match: (m) => !!m.polyline && (m.id?.includes('bezier') || m.tooltip?.includes('贝塞尔')),
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17c5 0 5-10 10-10s5 10 8 10" />
      <circle cx="3" cy="17" r="2" fill="currentColor" />
      <circle cx="21" cy="17" r="2" fill="currentColor" />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" />
      <circle cx="13" cy="7" r="1.2" fill="currentColor" />
    </svg>
  ),
  defaultConfig: {
    strokeColor: '#ff9500',
    strokeWidth: 3,
    tooltip: '新建贝塞尔曲线',
    category: 'none',
    layerFilter: 'always',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: []
  },
  StylePanel: function StylePanel({ draftMarker, onUpdateDraft, StepInput, ColorInput }) {
    return (
      <>
        <ColorInput
          label="曲线颜色"
          value={draftMarker?.strokeColor || '#ff9500'}
          onChange={(val) => onUpdateDraft({ strokeColor: val })}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>曲线粗细</span>
          <StepInput
            value={draftMarker?.strokeWidth || 3}
            onChange={(val) => onUpdateDraft({ strokeWidth: val })}
            min={1}
            max={10}
            step={1}
          />
        </div>
      </>
    );
  }
};
