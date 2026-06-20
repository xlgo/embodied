import React, { useState, useRef, useEffect } from 'react';
import { registeredTools, findToolForMarker } from './tools/registry';
export { registeredTools } from './tools/registry';

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

import { ConfigProvider, ColorPicker } from 'antd';

// 颜色输入组件，使用 antd 的 ColorPicker 并自定义触发外观
function ColorInput({ label, value, onChange }) {
  // 将颜色值转换为 antd 兼容的格式，并确保能正确处理 rgba/rgb/hex 等格式
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', position: 'relative' }}>
      <span style={{ fontSize: '12px', color: '#a0aec0' }}>{label}</span>
      
      {/* 使用 ConfigProvider 强制将弹窗挂载到 document.body，并通过 theme.token.zIndexPopupBase 强制提升外部 Portal 容器的 z-index，彻底避免被面板遮挡或裁剪 */}
      <ConfigProvider
        getPopupContainer={() => document.body}
        theme={{
          token: {
            zIndexPopupBase: 100000
          }
        }}
      >
        <ColorPicker
          value={value}
          onChange={(color) => {
            // 获取 rgba 字符串格式，确保包含透明度
            onChange(color.toRgbString());
          }}
          trigger="click"
        >
          {/* 彩色矩形选择条触发器 */}
          <div
            className="color-input-trigger"
            style={{
              width: '180px',
              height: '28px',
              borderRadius: '4px',
              border: '1px solid #2e354f',
              backgroundColor: value,
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'all 0.2s',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </ColorPicker>
      </ConfigProvider>
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
    if (e.button !== 0 || !panelRef.current?.contains(e.target)) {
      return;
    }

    // Only allow dragging on the top toolbar background or drag bar, not buttons
    if (
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('select') ||
      e.target.closest('textarea') ||
      e.target.closest('.resize-handle') ||
      e.target.closest('.image-item-del') ||
      e.target.closest('.icon-preview-btn') ||
      e.target.closest('.tab-btn') ||
      e.target.closest('.color-input-trigger') ||
      e.target.closest('.ant-color-picker') ||
      e.target.closest('.ant-color-picker-trigger') ||
      e.target.closest('.ant-popover') ||
      e.target.closest('.ant-slider') ||
      e.target.closest('[role="slider"]')
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

  const activeTool = draftMarker ? findToolForMarker(draftMarker) : null;
  const isPoint = activeTool ? activeTool.type === 'point' : (draftMarker?.type === 'point');
  const showConfigDetails = draftMarker !== null;
  const isMinimized = panelHeight < 240;

  return (
    <div
      ref={panelRef}
      onPointerDown={startDrag}
      style={{
        position: 'absolute',
        left: `${panelPos.x}px`,
        top: `${panelPos.y}px`,
        zIndex: 9991,
        width: showConfigDetails ? '320px' : 'fit-content',
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
          padding: 6px 0;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #ffffff;
        }
        .tab-btn.active {
          color: #00dfb6; /* 翠绿色/青色文字 */
          background-color: #12141c; /* 暗色背景 */
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
          border: 1px solid #2e354f;
          background-color: #1c1f2e;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .save-btn:hover {
          background-color: #2e354f;
          color: #ffffff;
          border-color: #00e5ff;
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

          {registeredTools.map((tool) => (
            <button
              key={tool.id}
              className={`tb-btn ${drawingMode === tool.id ? 'active' : ''}`}
              title={tool.name}
              onClick={() => onSelectTool(tool.id)}
            >
              {tool.icon}
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#2e354f', margin: '0 2px' }} />
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
              {activeTool ? `配置【${activeTool.name}】样式属性` : (isPoint ? '配置点标签属性' : '配置区域样式属性')}
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>{isPoint ? '标题' : '提示文本'}</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入"
                  value={draftMarker?.title || draftMarker?.tooltip || ''}
                  onChange={(e) => onUpdateDraft(isPoint ? { title: e.target.value } : { tooltip: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>业务分类</span>
                <select
                  className="custom-select"
                  value={draftMarker?.category || 'none'}
                  onChange={(e) => onUpdateDraft({ category: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="none">未分类</option>
                  <option value="biz_a">业务分类A</option>
                  <option value="biz_b">业务分类B</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '4px' }}>
                <button className="save-btn" onClick={() => onSave(draftMarker?.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  保存
                </button>
              </div>
            </div>
          ) : (
            // FULL TABBED LAYOUT (Tabs at the top of configuration area)
            <>
              {/* 页签选项头部：改用圆角胶囊背景样式 */}
              <div style={{
                display: 'flex',
                background: '#1d2030',
                borderRadius: '6px',
                padding: '3px',
                margin: '10px 16px 6px 16px',
                border: '1px solid #2e354f'
              }}>
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>{isPoint ? '标题' : '提示文本'}</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="请输入"
                        value={draftMarker?.title || draftMarker?.tooltip || ''}
                        onChange={(e) => onUpdateDraft(isPoint ? { title: e.target.value } : { tooltip: e.target.value })}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>业务分类</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.category || 'none'}
                        onChange={(e) => onUpdateDraft({ category: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="none">未分类</option>
                        <option value="biz_a">业务分类A</option>
                        <option value="biz_b">业务分类B</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>图层过滤</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.layerFilter || 'always'}
                        onChange={(e) => onUpdateDraft({ layerFilter: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="always">一直显示</option>
                        <option value="panorama">仅全景显示</option>
                        <option value="none">不显示</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>坐标类型</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.coordType || 'fov'}
                        onChange={(e) => onUpdateDraft({ coordType: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="fov">视野坐标</option>
                        <option value="global">全球坐标</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'style' && activeTool?.StylePanel && (
                  <activeTool.StylePanel
                    draftMarker={draftMarker}
                    onUpdateDraft={onUpdateDraft}
                    StepInput={StepInput}
                    ColorInput={ColorInput}
                  />
                )}

                {activeTab === 'action' && (
                  // Tab 3: Link Actions
                  <>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>关联动作</span>
                      <select
                        className="custom-select"
                        value={draftMarker?.linkAction || 'none'}
                        onChange={(e) => onUpdateDraft({ linkAction: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="none">无</option>
                        <option value="text">文本内容</option>
                        <option value="image">图片展示</option>
                        <option value="video">视频播放</option>
                        <option value="audio">音频播放</option>
                        <option value="flat_map">平面地图</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>窗口宽度</span>
                      <StepInput
                        value={draftMarker?.windowWidth || 800}
                        onChange={(val) => onUpdateDraft({ windowWidth: val })}
                        min={200}
                        max={1920}
                        step={50}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>窗口高度</span>
                      <StepInput
                        value={draftMarker?.windowHeight || 600}
                        onChange={(val) => onUpdateDraft({ windowHeight: val })}
                        min={150}
                        max={1080}
                        step={50}
                      />
                    </div>

                    {/* Text Action Specific Inputs */}
                    {draftMarker?.linkAction === 'text' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0', textAlign: 'left' }}>文本内容</span>
                        <textarea
                          className="form-input"
                          style={{ height: '80px', resize: 'vertical', padding: '6px' }}
                          placeholder="请输入关联动作展示的文本内容..."
                          value={draftMarker?.linkText || ''}
                          onChange={(e) => onUpdateDraft({ linkText: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Video Action Specific Inputs */}
                    {draftMarker?.linkAction === 'video' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#a0aec0' }}>视频地址</span>
                          <button
                            type="button"
                            onClick={() => onUpdateDraft({ linkVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' })}
                            style={{ fontSize: '11px', background: '#1c1f2e', border: '1px solid #2e354f', color: '#00dfb6', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            使用演示视频
                          </button>
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="请输入 MP4/Embed 视频链接..."
                          value={draftMarker?.linkVideoUrl || ''}
                          onChange={(e) => onUpdateDraft({ linkVideoUrl: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Audio Action Specific Inputs */}
                    {draftMarker?.linkAction === 'audio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#a0aec0' }}>音频地址</span>
                          <button
                            type="button"
                            onClick={() => onUpdateDraft({ linkAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' })}
                            style={{ fontSize: '11px', background: '#1c1f2e', border: '1px solid #2e354f', color: '#00dfb6', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            使用演示音频
                          </button>
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="请输入 MP3 音频链接..."
                          value={draftMarker?.linkAudioUrl || ''}
                          onChange={(e) => onUpdateDraft({ linkAudioUrl: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Images Selection grid */}
                    {draftMarker?.linkAction === 'image' && (
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left', marginTop: '4px' }}>关联图片</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
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
                    )}
                  </>
                )}
              </div>

              {/* Bottom save/cancel buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(46,53,79,0.4)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <button className="cancel-btn" onClick={onCancel}>取消</button>
                <button className="save-btn" onClick={() => onSave(draftMarker?.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  保存
                </button>
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
