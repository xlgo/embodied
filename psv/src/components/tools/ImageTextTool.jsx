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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
      <path d="M13 13h4M13 17h4" />
    </svg>
  ),
  defaultConfig: {
    type: 'point',
    title: '新建图文标签',
    color: '#007aff',
    icon: '💬',
    iconSize: 28,
    showTitle: true,
    titleStyle: {
      color: '#ffffff',
      fontSize: 12,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: '#007aff',
      borderWidth: 1.5,
      padding: 5
    },
    category: 'none',
    layerFilter: 'always',
    coordType: 'fov',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: []
  },
  StylePanel: function StylePanel({ draftMarker, onUpdateDraft, StepInput, ColorInput }) {
    const [showIconList, setShowIconList] = useState(false);

    const handleSelectIcon = (iconItem) => {
      onUpdateDraft({
        icon: iconItem.icon,
        color: iconItem.color
      });
      setShowIconList(false);
    };

    return (
      <>
        {/* 图标样式 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', position: 'relative' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>图标样式</span>
          <div
            onClick={() => setShowIconList(!showIconList)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1.5px dashed #2e354f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            className="icon-preview-btn-wrapper"
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: draftMarker?.color || '#007aff',
              border: '1.5px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
            }}>
              {draftMarker?.icon || '💬'}
            </div>
          </div>

          {showIconList && (
            <div style={{
              position: 'absolute',
              top: '44px',
              left: '90px',
              backgroundColor: '#161922',
              border: '1px solid #2e354f',
              borderRadius: '8px',
              padding: '8px',
              zIndex: 9995,
              width: '180px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
            }}>
              {presetIcons.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectIcon(item)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    border: '1.5px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                  title={item.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* 图标大小 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>图标大小</span>
          <StepInput
            value={draftMarker?.iconSize || 28}
            onChange={(val) => onUpdateDraft({ iconSize: val })}
            min={16}
            max={64}
            step={2}
          />
        </div>

        {/* 显示标题 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>显示标题</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={draftMarker?.showTitle !== false}
              onChange={(e) => onUpdateDraft({ showTitle: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* 标题样式子面板 */}
        {draftMarker?.showTitle !== false && (
          <div style={{
            backgroundColor: 'rgba(28, 31, 46, 0.4)',
            border: '1px solid #1c1f2e',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '4px',
            marginBottom: '8px'
          }}>
            <ColorInput
              label="字体颜色"
              value={draftMarker?.titleStyle?.color || '#ffffff'}
              onChange={(val) => onUpdateDraft({
                titleStyle: { ...(draftMarker?.titleStyle || {}), color: val }
              })}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>字体大小</span>
              <StepInput
                value={draftMarker?.titleStyle?.fontSize || 12}
                onChange={(val) => onUpdateDraft({
                  titleStyle: { ...(draftMarker?.titleStyle || {}), fontSize: val }
                })}
                min={9}
                max={36}
                step={1}
              />
            </div>
            <ColorInput
              label="背景颜色"
              value={draftMarker?.titleStyle?.backgroundColor || 'rgba(0,0,0,0.8)'}
              onChange={(val) => onUpdateDraft({
                titleStyle: { ...(draftMarker?.titleStyle || {}), backgroundColor: val }
              })}
            />
            <ColorInput
              label="边框颜色"
              value={draftMarker?.titleStyle?.borderColor || '#007aff'}
              onChange={(val) => onUpdateDraft({
                titleStyle: { ...(draftMarker?.titleStyle || {}), borderColor: val }
              })}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框大小</span>
              <StepInput
                value={draftMarker?.titleStyle?.borderWidth || 1}
                onChange={(val) => onUpdateDraft({
                  titleStyle: { ...(draftMarker?.titleStyle || {}), borderWidth: val }
                })}
                min={0}
                max={10}
                step={1}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框距离</span>
              <StepInput
                value={draftMarker?.titleStyle?.padding || 4}
                onChange={(val) => onUpdateDraft({
                  titleStyle: { ...(draftMarker?.titleStyle || {}), padding: val }
                })}
                min={0}
                max={20}
                step={1}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框圆角</span>
              <StepInput
                value={draftMarker?.titleStyle?.borderRadius !== undefined ? draftMarker.titleStyle.borderRadius : 4}
                onChange={(val) => onUpdateDraft({
                  titleStyle: { ...(draftMarker?.titleStyle || {}), borderRadius: val }
                })}
                min={0}
                max={30}
                step={1}
              />
            </div>
          </div>
        )}
      </>
    );
  }
};
