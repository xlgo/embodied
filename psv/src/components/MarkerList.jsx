import React from 'react';

const btnStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  background: 'white',
  fontSize: '12px',
  fontWeight: 'bold',
  transition: 'all 0.2s'
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
  onDeleteMarker
}) {
  return (
    <div style={{ width: '320px', borderLeft: '1px solid #ddd', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
      <h3>📝 标记列表</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {markers.map(m => {
          const isSelected = selectedMarkerId === m.id;
          const isEditingPolygon = editingPolygonId === m.id;
          const isEditingPoint = editingPointId === m.id;
          const isEditing = isEditingPolygon || isEditingPoint;
          const isPoint = m.type === 'point';

          return (
            <li 
              key={m.id} 
              onClick={() => onSelectMarker(m.id)}
              style={{ 
                padding: '12px', 
                border: isSelected ? '1px solid #007bff' : '1px solid #eee', 
                marginBottom: '12px', 
                borderRadius: '8px', 
                background: isEditing ? '#fff3cd' : (isSelected ? '#e8f4fd' : '#fafafa'),
                boxShadow: (isEditing || isSelected) ? '0 2px 8px rgba(0,123,255,0.08)' : 'none',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', wordBreak: 'break-all', color: '#333' }}>
                  {isPoint ? `${m.icon || '📍'} ${m.title || '未命名点'}` : `⬡ ${m.id.substring(0, 10)}... (多边形)`}
                </span>
                {isSelected && <span style={{ fontSize: '11px', color: '#007bff', fontWeight: 'bold' }}>● {isEditing ? '编辑中' : '已选中'}</span>}
              </div>

              {/* Position Info */}
              {m.position && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                  坐标: ({m.position.yaw.toFixed(2)}, {m.position.pitch.toFixed(2)})
                </div>
              )}

              {/* Action Buttons */}
              <div 
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f3f5', paddingTop: '8px', marginTop: '4px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => { onGotoMarker(m.id); onSelectMarker(m.id); }} 
                  style={btnStyle}
                >
                  🎯 定位
                </button>
                
                {isPoint ? (
                  <button 
                    onClick={() => onToggleEditPoint(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPoint ? '#ffc107' : 'white', 
                      borderColor: isEditingPoint ? '#ffc107' : '#ccc',
                      cursor: 'pointer'
                    }}
                    title="编辑属性"
                  >
                    {isEditingPoint ? '✅ 正在编辑' : '✏️ 编辑'}
                  </button>
                ) : (
                  <button 
                    onClick={() => onToggleEdit(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPolygon ? '#ffc107' : 'white', 
                      borderColor: isEditingPolygon ? '#ffc107' : '#ccc',
                      cursor: 'pointer'
                    }}
                    title="编辑多边形顶点与样式"
                  >
                    {isEditingPolygon ? '✅ 正在编辑' : '✏️ 编辑'}
                  </button>
                )}
                
                <button 
                  onClick={() => onDeleteMarker(m.id)} 
                  style={{...btnStyle, color: 'red'}}
                >
                  删除
                </button>
              </div>
            </li>
          );
        })}
        {markers.length === 0 && <p style={{ color: '#999' }}>暂无标记，请在左侧绘制</p>}
      </ul>
    </div>
  );
}
