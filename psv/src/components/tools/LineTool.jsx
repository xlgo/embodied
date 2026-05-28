import React from 'react';

export default {
  id: 'line',
  name: '线段标绘',
  type: 'polyline',
  match: (m) => !!m.polyline && (m.id?.includes('line') || m.tooltip?.includes('线')),
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h7v6h6v6h4" />
      <polyline points="16 15 19 18 16 21" />
    </svg>
  ),
  defaultConfig: {
    strokeColor: '#00e5ff',
    strokeWidth: 3,
    tooltip: '新建线段',
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
          label="线段颜色"
          value={draftMarker?.strokeColor || '#00e5ff'}
          onChange={(val) => onUpdateDraft({ strokeColor: val })}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>线段粗细</span>
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
