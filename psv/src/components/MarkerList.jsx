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

const inputStyle = {
  width: '100%',
  padding: '6px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '13px',
  boxSizing: 'border-box',
  marginBottom: '8px'
};

const emojiBtnStyle = {
  padding: '4px 8px',
  fontSize: '16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: '#f8f9fa',
  cursor: 'pointer'
};

const PRESET_EMOJIS = ['📍', '🚩', '🏠', '⚠️', 'ℹ️', '⭐', '🔥', '💬', '👀', '🎯'];

export default function MarkerList({
  markers,
  editingPolygonId,
  editingPointId,
  onGotoMarker,
  onToggleEdit,
  onToggleEditPoint,
  onDeleteMarker,
  onUpdatePoint
}) {
  return (
    <div style={{ width: '320px', borderLeft: '1px solid #ddd', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
      <h3>📝 标记列表</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {markers.map(m => {
          const isEditingPolygon = editingPolygonId === m.id;
          const isEditingPoint = editingPointId === m.id;
          const isPoint = m.type === 'point';

          return (
            <li 
              key={m.id} 
              style={{ 
                padding: '12px', 
                border: '1px solid #eee', 
                marginBottom: '12px', 
                borderRadius: '8px', 
                background: (isEditingPolygon || isEditingPoint) ? '#fff3cd' : '#fafafa',
                boxShadow: (isEditingPolygon || isEditingPoint) ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', wordBreak: 'break-all', color: '#333' }}>
                  {isPoint ? `${m.icon || '📍'} ${m.title || '未命名点'}` : `⬡ ${m.id.substring(0, 10)}... (多边形)`}
                </span>
              </div>

              {/* Position Info */}
              {m.position && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                  坐标: ({m.position.yaw.toFixed(2)}, {m.position.pitch.toFixed(2)})
                </div>
              )}

              {/* Point Marker Edit Form */}
              {isPoint && isEditingPoint && (
                <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '10px', marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>标题:</label>
                  <input 
                    type="text" 
                    value={m.title || ''} 
                    onChange={(e) => onUpdatePoint(m.id, { title: e.target.value })}
                    style={inputStyle}
                    placeholder="例如: 某关键物料"
                  />

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>标记颜色:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input 
                      type="color" 
                      value={m.color || '#ff0000'} 
                      onChange={(e) => onUpdatePoint(m.id, { color: e.target.value })}
                      style={{ border: 'none', width: '36px', height: '28px', cursor: 'pointer', padding: 0 }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>{m.color || '#ff0000'}</span>
                  </div>

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>图标 (Emoji/字):</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {PRESET_EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        type="button" 
                        onClick={() => onUpdatePoint(m.id, { icon: emoji })}
                        style={{
                          ...emojiBtnStyle,
                          borderColor: m.icon === emoji ? '#007bff' : '#ddd',
                          background: m.icon === emoji ? '#e7f1ff' : '#f8f9fa'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={m.icon || ''} 
                    onChange={(e) => onUpdatePoint(m.id, { icon: e.target.value })}
                    style={{...inputStyle, width: '80px'}}
                    placeholder="或自定义"
                  />

                  <div style={{ fontSize: '11px', color: '#28a745', backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px', marginBottom: '10px' }}>
                    💡 提示：在全景图上直接拖动该标记可以修改其位置。
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f3f5', paddingTop: '8px', marginTop: '4px' }}>
                <button onClick={() => onGotoMarker(m.id)} style={btnStyle}>🎯 定位</button>
                
                {isPoint ? (
                  <button 
                    onClick={() => onToggleEditPoint(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPoint ? '#ffc107' : 'white', 
                      borderColor: isEditingPoint ? '#ffc107' : '#ccc'
                    }}
                  >
                    {isEditingPoint ? '✅ 完成' : '✏️ 编辑'}
                  </button>
                ) : (
                  <button 
                    onClick={() => onToggleEdit(m.id)} 
                    style={{
                      ...btnStyle, 
                      background: isEditingPolygon ? '#ffc107' : 'white', 
                      borderColor: isEditingPolygon ? '#ffc107' : '#ccc'
                    }}
                  >
                    {isEditingPolygon ? '✅ 完成' : '✏️ 编辑'}
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
