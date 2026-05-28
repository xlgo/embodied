// 预设图标列表，采用 SVG 路径并定义预设颜色以匹配设计图
const presetIcons = [
  {
    id: 'camera',
    label: '监控摄像头',
    color: '#ff3b30',
    icon: `<path d="M16 10.375V8.5C16 7.675 15.325 7 14.5 7H3.5C2.675 7 2 7.675 2 8.5V15.5C2 16.325 2.675 17 3.5 17H14.5C15.325 17 16 16.325 16 15.5V13.625L20 17.625V6.375L16 10.375Z" />`
  },
  {
    id: 'pin',
    label: '定位点',
    color: '#007aff',
    icon: `<circle cx="12" cy="12" r="5" />`
  },
  {
    id: 'warning',
    label: '警示',
    color: '#ff9500',
    icon: `<path d="M12 2L2 22H22L12 2ZM12 18C11.4 18 11 17.6 11 17C11 16.4 11.4 16 12 16C12.6 16 13 16.4 13 17C13 17.6 12.6 18 12 18ZM12 14C11.4 14 11 13.6 11 13V9C11 8.4 11.4 8 12 8C12.6 8 13 8.4 13 9V13C13 13.6 12.6 14 12 14Z" />`
  },
  {
    id: 'home',
    label: '房屋',
    color: '#34c759',
    icon: `<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />`
  },
  {
    id: 'flag',
    label: '旗帜',
    color: '#ffcc00',
    icon: `<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />`
  }
];

export default {
  id: 'point',
  name: '点位标绘',
  type: 'point',
  match: (m) => m.type === 'point' && m.icon !== '💬',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
      <path d="M7 22c0-1.1 2.24-2 5-2s5 .9 5 2" />
    </svg>
  ),
  defaultConfig: {
    type: 'point',
    title: '新建标签',
    color: '#ff3b30',
    icon: `<path d="M16 10.375V8.5C16 7.675 15.325 7 14.5 7H3.5C2.675 7 2 7.675 2 8.5V15.5C2 16.325 2.675 17 3.5 17H14.5C15.325 17 16 16.325 16 15.5V13.625L20 17.625V6.375L16 10.375Z" />`, // 默认为监控摄像头
    iconSize: 24,
    showTitle: true,
    category: 'none',
    layerFilter: 'always',
    coordType: 'fov',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: []
  },
  // 属性配置面板组件
  StylePanel: function StylePanel({ draftMarker, onUpdateDraft, StepInput, ColorInput }) {
    const [showIconList, setShowIconList] = useState(false);

    const handleSelectIcon = (iconItem) => {
      onUpdateDraft({
        icon: iconItem.icon,
        color: iconItem.color
      });
      setShowIconList(false);
    };

    const currentIcon = draftMarker?.icon || '';
    const isSvgIcon = currentIcon.includes('<path') || currentIcon.includes('<circle');
    const color = draftMarker?.color || '#ff3b30';

    return (
      <>
        {/* 图标样式 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', position: 'relative' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>图标样式</span>
          <div
            onClick={() => setShowIconList(!showIconList)}
            style={{
              width: '60px',
              height: '60px',
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
            {/* 地图针图标预览，完全匹配设计图效果 */}
            <div style={{ position: 'relative', width: '36px', height: '45px', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
              <svg viewBox="0 0 24 30" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                <path d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 30 12 30 C12 30 24 21 24 12 C24 5.37 18.63 0 12 0 Z" fill={color} />
              </svg>
              <div style={{ position: 'absolute', top: '5.5px', left: '8px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {isSvgIcon ? (
                  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" dangerouslySetInnerHTML={{ __html: currentIcon }} />
                ) : (
                  <span style={{ fontSize: '12px' }}>{currentIcon}</span>
                )}
              </div>
            </div>
          </div>

          {showIconList && (
            <div style={{
              position: 'absolute',
              top: '64px',
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
                    height: '40px',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={item.label}
                >
                  <svg viewBox="0 0 24 30" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                    <path d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 30 12 30 C12 30 24 21 24 12 C24 5.37 18.63 0 12 0 Z" fill={item.color} />
                  </svg>
                  <div style={{ position: 'absolute', top: '5px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" dangerouslySetInnerHTML={{ __html: item.icon }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 图标大小 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>图标大小</span>
          <StepInput
            value={draftMarker?.iconSize || 24}
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
      </>
    );
  }
};
