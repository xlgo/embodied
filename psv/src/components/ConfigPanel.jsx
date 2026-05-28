import React, { useState, useRef } from 'react';

// Numeric input with plus/minus buttons
function StepInput({ value, onChange, min = 1, max = 2000, step = 1 }) {
  const parseVal = (v) => {
    const num = parseInt(v, 10);
    return isNaN(num) ? min : num;
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#1c1f2e', borderRadius: '4px', border: '1px solid #2e354f', overflow: 'hidden', height: '28px' }}>
      <button
        onClick={() => onChange(Math.max(min, parseVal(value) - step))}
        style={{
          border: 'none',
          background: 'none',
          color: '#a0aec0',
          width: '28px',
          height: '100%',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="step-btn"
      >
        -
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          if (val === '') onChange(min);
          else onChange(Math.min(max, Math.max(min, parseInt(val, 10))));
        }}
        style={{
          width: '40px',
          border: 'none',
          background: 'none',
          color: '#ffffff',
          textAlign: 'center',
          fontSize: '12px',
          outline: 'none',
          padding: 0
        }}
      />
      <button
        onClick={() => onChange(Math.min(max, parseVal(value) + step))}
        style={{
          border: 'none',
          background: 'none',
          color: '#a0aec0',
          width: '28px',
          height: '100%',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="step-btn"
      >
        +
      </button>
    </div>
  );
}

// Color picker row
function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', color: '#a0aec0' }}>{label}</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{
          width: '54px',
          height: '24px',
          borderRadius: '4px',
          border: '1px solid #2e354f',
          backgroundColor: value,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ConfigPanel({
  panelPos,
  setPanelPos,
  panelHeight,
  setPanelHeight,
  drawingMode,
  onSelectTool,
  onAction,
  draftMarker,
  onUpdateDraft,
  onSave,
  onCancel
}) {
  const panelRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'style' | 'action'
  const [showIconList, setShowIconList] = useState(false);

  const startDrag = (e) => {
    // Only allow dragging on the top toolbar background or drag bar, not buttons
    if (
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('select') ||
      e.target.closest('.resize-handle') ||
      e.target.closest('.image-item-del') ||
      e.target.closest('.icon-preview-btn') ||
      e.target.closest('.tab-btn')
    ) {
      return;
    }

    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = panelPos.x;
    const initialTop = panelPos.y;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const deltaY = moveEvent.clientY - initialY;
      setPanelPos({
        x: initialLeft + deltaX,
        y: initialTop + deltaY
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const initialY = e.clientY;
    const initialHeight = panelHeight;

    const handlePointerMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - initialY;
      // Height bounds: minimum 200px (or smaller if just toolbar), maximum 580px
      const newHeight = Math.max(140, Math.min(580, initialHeight + deltaY));
      setPanelHeight(newHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const addMockImage = () => {
    const urls = [
      'https://picsum.photos/id/10/80/80',
      'https://picsum.photos/id/15/80/80',
      'https://picsum.photos/id/20/80/80',
      'https://picsum.photos/id/29/80/80'
    ];
    const randUrl = urls[Math.floor(Math.random() * urls.length)];
    const currentImages = draftMarker?.images || [];
    onUpdateDraft({
      images: [...currentImages, randUrl]
    });
  };

  const removeImage = (idx) => {
    const currentImages = draftMarker?.images || [];
    onUpdateDraft({
      images: currentImages.filter((_, i) => i !== idx)
    });
  };

  const isPoint = draftMarker?.type === 'point';
  const showConfigDetails = draftMarker !== null;
  const isMinimized = panelHeight < 240;

  const presetIcons = [
    { icon: '📍', color: '#ff3b30', label: '红色定位销' },
    { icon: '📍', color: '#007aff', label: '蓝色定位销' },
    { icon: '📍', color: '#34c759', label: '绿色定位销' },
    { icon: '📍', color: '#ffcc00', label: '黄色定位销' },
    { icon: '🚩', color: '#ff3b30', label: '红旗' },
    { icon: '🏠', color: '#5856d6', label: '房屋' },
    { icon: '⚠️', color: '#ff9500', label: '警示' },
    { icon: '💬', color: '#007aff', label: '对话' },
  ];

  const handleSelectIcon = (iconItem) => {
    onUpdateDraft({
      icon: iconItem.icon,
      color: iconItem.color
    });
    setShowIconList(false);
  };

  return (
    <div
      ref={panelRef}
      onPointerDown={startDrag}
      style={{
        position: 'absolute',
        left: `${panelPos.x}px`,
        top: `${panelPos.y}px`,
        zIndex: 9991,
        width: '320px',
        height: showConfigDetails ? `${panelHeight}px` : '46px',
        backgroundColor: 'rgba(22, 25, 34, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(46, 53, 79, 0.8)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'height 0.25s ease-out'
      }}
    >
      <style>{`
        .tb-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: none;
          color: #a0aec0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .tb-btn:hover {
          background-color: rgba(255, 255, 255, 0.04);
          color: #ffffff;
        }
        .tb-btn.active {
          background-color: rgba(255, 255, 255, 0.08);
          color: #00dfb6;
        }
        .tb-drag-bar {
          width: 6px;
          height: 16px;
          margin-right: 4px;
        }
        .tab-btn {
          flex: 1;
          padding: 8px 0;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #ffffff;
        }
        .tab-btn.active {
          color: #00e5ff;
          border-bottom-color: #00e5ff;
        }
        .form-label {
          font-size: 11px;
          color: #a0aec0;
          margin-bottom: 5px;
        }
        .form-input {
          width: 100%;
          background-color: #1c1f2e;
          border: 1px solid #2e354f;
          border-radius: 6px;
          color: #ffffff;
          padding: 6px 10px;
          font-size: 12px;
          outline: none;
          box-sizing: border-box;
          height: 28px;
        }
        .form-input::placeholder {
          color: #4a5568;
        }
        .form-input:focus {
          border-color: #00e5ff;
        }
        .custom-select {
          width: 100%;
          background-color: #1c1f2e;
          border: 1px solid #2e354f;
          border-radius: 6px;
          color: #ffffff;
          padding: 5px 10px;
          font-size: 12px;
          outline: none;
          cursor: pointer;
          height: 28px;
          box-sizing: border-box;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 20px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #2e354f;
          transition: .3s;
          border-radius: 20px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #00e5ff;
        }
        input:checked + .slider:before {
          transform: translateX(18px);
        }
        .save-btn {
          background: linear-gradient(135deg, #00f5d4 0%, #00e5ff 100%);
          border: none;
          color: #0d0f14;
          font-weight: bold;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(0, 229, 255, 0.2);
          transition: all 0.2s;
        }
        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 229, 255, 0.35);
        }
        .cancel-btn {
          border: 1px solid #2e354f;
          background: none;
          color: #a0aec0;
          font-size: 12px;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-btn:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .image-add-box {
          width: 44px;
          height: 44px;
          border: 1.5px dashed #2e354f;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 18px;
          color: #a0aec0;
          cursor: pointer;
          background-color: #1c1f2e;
          transition: all 0.2s;
        }
        .image-add-box:hover {
          border-color: #00e5ff;
          color: #00e5ff;
        }
        .close-edit-btn:hover {
          background-color: rgba(255, 59, 48, 0.15);
          color: #ff4d4d !important;
        }
      `}</style>

      {/* 头部区域：未编辑时显示工具栏，编辑时只显示属性配置的标题头 */}
      {!showConfigDetails ? (
        /* Part 1: Top Floating Toolbar */
        <div style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'move',
          height: '46px',
          boxSizing: 'border-box'
        }}>
          {/* Drag handle icon */}
          <svg width="12" height="16" viewBox="0 0 12 16" fill="#4a5568" style={{ marginRight: '6px' }}>
            <circle cx="3" cy="3" r="1.2" />
            <circle cx="3" cy="8" r="1.2" />
            <circle cx="3" cy="13" r="1.2" />
            <circle cx="9" cy="3" r="1.2" />
            <circle cx="9" cy="8" r="1.2" />
            <circle cx="9" cy="13" r="1.2" />
          </svg>

          <button 
            className={`tb-btn ${drawingMode === 'point' ? 'active' : ''}`} 
            title="点位标绘" 
            onClick={() => onSelectTool('point')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="2.5" fill="currentColor" />
              <path d="M7 22c0-1.1 2.24-2 5-2s5 .9 5 2" />
            </svg>
          </button>

          <button 
            className={`tb-btn ${drawingMode === 'image_text' ? 'active' : ''}`} 
            title="图文标绘" 
            onClick={() => onSelectTool('image_text')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
              <path d="M13 13h4M13 17h4" />
            </svg>
          </button>

          <button 
            className={`tb-btn ${drawingMode === 'polygon' ? 'active' : ''}`} 
            title="多边形标绘" 
            onClick={() => onSelectTool('polygon')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 3 22 10 18 21 6 21 2 10" />
            </svg>
          </button>

          <button 
            className={`tb-btn ${drawingMode === 'line' ? 'active' : ''}`} 
            title="线段标绘" 
            onClick={() => onSelectTool('line')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h7v6h6v6h4" />
              <polyline points="16 15 19 18 16 21" />
            </svg>
          </button>

          <button 
            className={`tb-btn ${drawingMode === 'bezier' ? 'active' : ''}`} 
            title="贝塞尔曲线标绘" 
            onClick={() => onSelectTool('bezier')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17c5 0 5-10 10-10s5 10 8 10" />
              <circle cx="3" cy="17" r="2" fill="currentColor" />
              <circle cx="21" cy="17" r="2" fill="currentColor" />
              <circle cx="8" cy="7" r="1.2" fill="currentColor" />
              <circle cx="13" cy="7" r="1.2" fill="currentColor" />
            </svg>
          </button>

          <button 
            className="tb-btn" 
            title="删除" 
            onClick={() => onAction('delete')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20h4" />
              <path d="M15 3.5l5.5 5.5-12 12H3v-5.5l12-12z" />
              <path d="M12 6.5l5.5 5.5" />
              <path d="M3 20c3.5-1 7 1 10.5-1" />
            </svg>
          </button>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#2e354f', margin: '0 2px', marginLeft: 'auto' }} />
          <button
            onClick={onCancel}
            title="关闭工具栏"
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            className="close-edit-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        /* Part 1 Alternative: Top Editor Title Bar */
        <div style={{
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(46, 53, 79, 0.4)',
          cursor: 'move',
          height: '46px',
          boxSizing: 'border-box',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>{isPoint ? '📍' : '⬡'}</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
              {isPoint ? '配置点标签属性' : '配置区域样式属性'}
            </span>
          </div>
          <button
            onClick={onCancel}
            title="关闭编辑"
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            className="close-edit-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Part 2: Middle Tabs & Configuration Form (Expanded when draftMarker is active) */}
      {showConfigDetails && (
        <>
          {isMinimized ? (
            // COMPACT / MINIMIZED LAYOUT (Slide 6)
            <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="form-label">{isPoint ? '标题' : '提示文本'}</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入"
                  value={draftMarker?.title || draftMarker?.tooltip || ''}
                  onChange={(e) => onUpdateDraft(isPoint ? { title: e.target.value } : { tooltip: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="form-label">业务分类</span>
                <select
                  className="custom-select"
                  value={draftMarker?.category || 'none'}
                  onChange={(e) => onUpdateDraft({ category: e.target.value })}
                >
                  <option value="none">未分类</option>
                  <option value="biz_a">业务分类A</option>
                  <option value="biz_b">业务分类B</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '4px' }}>
                <button className="save-btn" onClick={() => onSave(draftMarker?.id)}>💾 保存</button>
              </div>
            </div>
          ) : (
            // FULL TABBED LAYOUT (Tabs at the top of configuration area)
            <>
              {/* Tab options headers */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(46, 53, 79, 0.4)', padding: '0 8px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <button
                  className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  基本信息
                </button>
                <button
                  className={`tab-btn ${activeTab === 'style' ? 'active' : ''}`}
                  onClick={() => setActiveTab('style')}
                >
                  样式配置
                </button>
                <button
                  className={`tab-btn ${activeTab === 'action' ? 'active' : ''}`}
                  onClick={() => setActiveTab('action')}
                >
                  关联动作
                </button>
              </div>

              {/* Configurations input forms */}
              <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {activeTab === 'basic' && (
                  // Tab 1: Basic Info
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">{isPoint ? '标题' : '提示文本'}</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="请输入"
                        value={draftMarker?.title || draftMarker?.tooltip || ''}
                        onChange={(e) => onUpdateDraft(isPoint ? { title: e.target.value } : { tooltip: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">业务分类</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.category || 'none'}
                        onChange={(e) => onUpdateDraft({ category: e.target.value })}
                      >
                        <option value="none">未分类</option>
                        <option value="biz_a">业务分类A</option>
                        <option value="biz_b">业务分类B</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">图层过滤</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.layerFilter || 'always'}
                        onChange={(e) => onUpdateDraft({ layerFilter: e.target.value })}
                      >
                        <option value="always">一直显示</option>
                        <option value="panorama">仅全景显示</option>
                        <option value="none">不显示</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">坐标类型</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.coordType || 'fov'}
                        onChange={(e) => onUpdateDraft({ coordType: e.target.value })}
                      >
                        <option value="fov">视野坐标</option>
                        <option value="global">全球坐标</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'style' && (
                  // Tab 2: Style Settings
                  isPoint ? (
                    // POINT STYLE SETTINGS
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>图标样式</span>
                        <div
                          onClick={() => setShowIconList(!showIconList)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: draftMarker?.color || '#ff3b30',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '15px',
                            cursor: 'pointer'
                          }}
                          className="icon-preview-btn"
                        >
                          {draftMarker?.icon || '📍'}
                        </div>

                        {showIconList && (
                          <div style={{
                            position: 'absolute',
                            top: '36px',
                            right: '0',
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>图标大小</span>
                        <StepInput
                          value={draftMarker?.iconSize || 28}
                          onChange={(val) => onUpdateDraft({ iconSize: val })}
                          min={16}
                          max={64}
                          step={2}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>显示标题</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={draftMarker?.showTitle !== false}
                            onChange={(e) => onUpdateDraft({ showTitle: e.target.checked })}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>

                      {draftMarker?.showTitle !== false && (
                        <div style={{
                          backgroundColor: 'rgba(28, 31, 46, 0.4)',
                          border: '1px solid #1c1f2e',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginTop: '4px'
                        }}>
                          <ColorInput
                            label="字体颜色"
                            value={draftMarker?.titleStyle?.color || '#ffffff'}
                            onChange={(val) => onUpdateDraft({
                              titleStyle: { ...(draftMarker?.titleStyle || {}), color: val }
                            })}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#a0aec0' }}>字体大小</span>
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
                            value={draftMarker?.titleStyle?.borderColor || '#ffffff'}
                            onChange={(val) => onUpdateDraft({
                              titleStyle: { ...(draftMarker?.titleStyle || {}), borderColor: val }
                            })}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#a0aec0' }}>边框大小</span>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#a0aec0' }}>边框距离</span>
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
                        </div>
                      )}
                    </>
                  ) : (
                    // POLYGON STYLE SETTINGS
                    <>
                      <ColorInput
                        label="边框线条颜色"
                        value={draftMarker?.strokeColor || '#00ffcc'}
                        onChange={(val) => onUpdateDraft({ strokeColor: val })}
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>边框线条粗细</span>
                        <StepInput
                          value={draftMarker?.strokeWidth || 2}
                          onChange={(val) => onUpdateDraft({ strokeWidth: val })}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="form-label">填充方式</span>
                        <select
                          className="custom-select"
                          value={draftMarker?.fillStyle || 'solid'}
                          onChange={(e) => onUpdateDraft({ fillStyle: e.target.value })}
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
                          
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>
                              <span>填充不透明度</span>
                              <span style={{ fontFamily: 'monospace' }}>{Math.round((draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.25) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.25}
                              onChange={(e) => onUpdateDraft({ fillOpacity: parseFloat(e.target.value) })}
                              style={{ width: '100%', cursor: 'pointer', height: '6px', background: '#2e354f', outline: 'none', borderRadius: '3px' }}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )
                )}

                {activeTab === 'action' && (
                  // Tab 3: Link Actions
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">关联动作</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.linkAction || 'none'}
                        onChange={(e) => onUpdateDraft({ linkAction: e.target.value })}
                      >
                        <option value="none">无</option>
                        <option value="flat_map">平面地图</option>
                        <option value="video">视频监控</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="form-label">窗口宽度</span>
                        <StepInput
                          value={draftMarker?.windowWidth || 800}
                          onChange={(val) => onUpdateDraft({ windowWidth: val })}
                          min={200}
                          max={1920}
                          step={50}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="form-label">窗口高度</span>
                        <StepInput
                          value={draftMarker?.windowHeight || 600}
                          onChange={(val) => onUpdateDraft({ windowHeight: val })}
                          min={150}
                          max={1080}
                          step={50}
                        />
                      </div>
                    </div>

                    {/* Images Selection grid */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="form-label">添加图片</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {draftMarker?.images?.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '6px', border: '1px solid #2e354f', overflow: 'hidden' }}>
                            <img src={img} alt="linkage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              className="image-item-del"
                              onClick={() => removeImage(idx)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: 'rgba(255, 59, 48, 0.8)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '9px',
                                width: '14px',
                                height: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0 0 0 4px',
                                padding: 0
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <div className="image-add-box" onClick={addMockImage}>+</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom save/cancel buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(46,53,79,0.4)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <button className="cancel-btn" onClick={onCancel}>取消</button>
                <button className="save-btn" onClick={() => onSave(draftMarker?.id)}>💾 保存</button>
              </div>
            </>
          )}

          {/* Bottom resize handle */}
          <div
            className="resize-handle"
            onPointerDown={startResize}
            style={{
              height: '8px',
              width: '100%',
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(46, 53, 79, 0.2)',
              borderTop: '1px solid rgba(46, 53, 79, 0.3)'
            }}
          >
            <div style={{ width: '20px', height: '2px', borderRadius: '1px', backgroundColor: '#4a5568' }} />
          </div>
        </>
      )}
    </div>
  );
}
