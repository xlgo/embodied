import React from 'react';

export default {
  id: 'arrow',
  name: '箭头标绘',
  type: 'polyline',
  match: (m) => !!m.polyline && (m.id?.includes('arrow') || m.tooltip?.includes('箭头')),
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="12 5 19 5 19 12" />
    </svg>
  ),
  defaultConfig: {
    strokeColor: '#00e5ff',
    strokeWidth: 2,
    fillColor: '#00e5ff',
    fillOpacity: 0.3,
    arrowHeadSize: 24, // 箭头头部大小
    arrowShaftWidth: 8, // 箭头箭身粗细
    arrowTailWidth: 8, // 箭头尾部粗细
    tooltip: '新建箭头',
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
          label="边框颜色"
          value={draftMarker?.strokeColor || '#00e5ff'}
          onChange={(val) => onUpdateDraft({ strokeColor: val })}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框粗细</span>
          <StepInput
            value={draftMarker?.strokeWidth || 2}
            onChange={(val) => onUpdateDraft({ strokeWidth: val })}
            min={1}
            max={10}
            step={1}
          />
        </div>

        <ColorInput
          label="填充颜色"
          value={draftMarker?.fillColor || '#00e5ff'}
          onChange={(val) => onUpdateDraft({ fillColor: val })}
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>填充不透明度</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.3}
              onChange={(e) => onUpdateDraft({ fillOpacity: parseFloat(e.target.value) })}
              style={{ flex: 1, cursor: 'pointer', height: '6px', background: '#2e354f', outline: 'none', borderRadius: '3px' }}
            />
            <span style={{ fontSize: '12px', color: '#a0aec0', fontFamily: 'monospace', width: '36px', textAlign: 'right' }}>
              {Math.round((draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.3) * 100)}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>头部大小</span>
          <StepInput
            value={draftMarker?.arrowHeadSize || 24}
            onChange={(val) => onUpdateDraft({ arrowHeadSize: val })}
            min={10}
            max={80}
            step={2}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>箭身粗细</span>
          <StepInput
            value={draftMarker?.arrowShaftWidth || 8}
            onChange={(val) => onUpdateDraft({ arrowShaftWidth: val })}
            min={2}
            max={40}
            step={1}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>箭尾粗细</span>
          <StepInput
            value={draftMarker?.arrowTailWidth || 8}
            onChange={(val) => onUpdateDraft({ arrowTailWidth: val })}
            min={2}
            max={40}
            step={1}
          />
        </div>
      </>
    );
  }
};
