import React from 'react';

export default {
  id: 'polygon',
  name: '多边形标绘',
  type: 'polygon',
  match: (m) => !!m.polygon,
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 22 10 18 21 6 21 2 10" />
    </svg>
  ),
  defaultConfig: {
    strokeColor: '#00ffcc',
    strokeWidth: 2.5,
    fillColor: '#00ffcc',
    fillOpacity: 0.25,
    fillStyle: 'solid',
    tooltip: '新建多边形区域',
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
          label="边框线条颜色"
          value={draftMarker?.strokeColor || '#00ffcc'}
          onChange={(val) => onUpdateDraft({ strokeColor: val })}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框线条粗细</span>
          <StepInput
            value={draftMarker?.strokeWidth || 2}
            onChange={(val) => onUpdateDraft({ strokeWidth: val })}
            min={1}
            max={10}
            step={1}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>填充方式</span>
          <select
            className="custom-select"
            value={draftMarker?.fillStyle || 'solid'}
            onChange={(e) => onUpdateDraft({ fillStyle: e.target.value })}
            style={{ flex: 1 }}
          >
            <option value="solid">实色填充</option>
            <option value="none">无填充 (仅保留边框)</option>
          </select>
        </div>

        {draftMarker?.fillStyle !== 'none' && (
          <>
            <ColorInput
              label="填充区域颜色"
              value={draftMarker?.fillColor || '#00ffcc'}
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
                  value={draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.25}
                  onChange={(e) => onUpdateDraft({ fillOpacity: parseFloat(e.target.value) })}
                  style={{ flex: 1, cursor: 'pointer', height: '6px', background: '#2e354f', outline: 'none', borderRadius: '3px' }}
                />
                <span style={{ fontSize: '12px', color: '#a0aec0', fontFamily: 'monospace', width: '36px', textAlign: 'right' }}>
                  {Math.round((draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.25) * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
};
