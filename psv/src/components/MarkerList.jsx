import React from 'react';

const btnStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #2e354f',
  cursor: 'pointer',
  background: '#1c1f2e',
  color: '#a0aec0',
  fontSize: '12px',
  fontWeight: 'bold',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
};

export default function MarkerList({
  markers,
  selectedMarkerId,
  editingPolygonId,
  editingPointId,
  onGotoMarker,
  onSelectMarker,
  onToggleEdit,
  onToggleEditPoint,
  onDeleteMarker,
  style
}) {
  return (
    <div style={{
      width: '280px',
      borderLeft: '1px solid #1c1f2e',
      paddingLeft: '24px',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      ...style
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📝 标中标注列表
      </h3>
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        overflowY: 'auto', 
        maxHeight: style ? 'none' : '580px', 
        flex: style ? 1 : 'none' 
      }}>
        {markers.map(m => {
          const isSelected = selectedMarkerId === m.id;
          const isEditingPolygon = editingPolygonId === m.id;
          const isEditingPoint = editingPointId === m.id;
          const isEditing = isEditingPolygon || isEditingPoint;
          const isPoint = m.type === 'point';

          let itemBg = '#161922';
          let itemBorder = '1px solid #2e354f';
          let titleColor = '#e2e8f0';

          if (isEditing) {
            itemBg = 'rgba(255, 149, 0, 0.06)';
            itemBorder = '1px solid rgba(255, 149, 0, 0.4)';
            titleColor = '#ff9500';
          } else if (isSelected) {
            itemBg = 'rgba(0, 229, 255, 0.06)';
            itemBorder = '1px solid rgba(0, 229, 255, 0.4)';
            titleColor = '#00e5ff';
          }

          return (
            <li 
              key={m.id} 
              onClick={() => onSelectMarker(m.id)}
              style={{ 
                padding: '14px', 
                border: itemBorder, 
                borderRadius: '10px', 
                background: itemBg,
                boxShadow: (isEditing || isSelected) ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', wordBreak: 'break-all', color: titleColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPoint ? (
                    <>
                      {/* 如果是 SVG 图标路径，则通过 inline SVG 进行渲染以防显示出原始 HTML 文本 */}
                      {typeof m.icon === 'string' && (m.icon.includes('<path') || m.icon.includes('<circle')) ? (
                        <svg 
                          viewBox="0 0 24 24" 
                          width="14" 
                          height="14" 
                          fill="currentColor" 
                          style={{ flexShrink: 0 }}
                          dangerouslySetInnerHTML={{ __html: m.icon }} 
                        />
                      ) : (
                        <span>{m.icon || '📍'}</span>
                      )}
                      <span>{m.title || '未命名'}</span>
                    </>
                  ) : (
                    <span>⬡ 多边形区域</span>
                  )}
                </span>
                {isSelected && (
                  <span style={{ fontSize: '10px', color: isEditing ? '#ff9500' : '#00e5ff', fontWeight: 'bold' }}>
                    ● {isEditing ? '编辑中' : '选中'}
                  </span>
                )}
              </div>

              {/* Position Info */}
              {m.position && (
                <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'monospace' }}>
                  坐标: {m.position.yaw.toFixed(2)}, {m.position.pitch.toFixed(2)}
                </div>
              )}

              {/* Action Buttons */}
              <div 
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  borderTop: '1px solid rgba(46, 53, 79, 0.3)',
                  paddingTop: '10px',
                  marginTop: '2px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => { onGotoMarker(m.id); onSelectMarker(m.id); }} 
                  style={{
                    ...btnStyle,
                    borderColor: '#2e354f'
                  }}
                  className="step-btn"
                  title="定位视角"
                >
                  🎯 定位
                </button>
                
                {isPoint ? (
                  <button 
                    onClick={() => onToggleEditPoint(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPoint ? 'rgba(0, 229, 255, 0.15)' : '#1c1f2e', 
                      borderColor: isEditingPoint ? '#00e5ff' : '#2e354f',
                      color: isEditingPoint ? '#00e5ff' : '#a0aec0'
                    }}
                    className="step-btn"
                  >
                    ✏️ 编辑
                  </button>
                ) : (
                  <button 
                    onClick={() => onToggleEdit(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPolygon ? 'rgba(0, 229, 255, 0.15)' : '#1c1f2e', 
                      borderColor: isEditingPolygon ? '#00e5ff' : '#2e354f',
                      color: isEditingPolygon ? '#00e5ff' : '#a0aec0'
                    }}
                    className="step-btn"
                  >
                    ✏️ 编辑
                  </button>
                )}
                
                <button 
                  onClick={() => onDeleteMarker(m.id)} 
                  style={{
                    ...btnStyle,
                    color: '#ff3b30',
                    borderColor: 'rgba(255, 59, 48, 0.2)'
                  }}
                  className="step-btn"
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
        {markers.length === 0 && (
          <p style={{ color: '#718096', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
            暂无标注数据，请右键全景图唤出菜单进行添加。
          </p>
        )}
      </ul>
    </div>
  );
}
