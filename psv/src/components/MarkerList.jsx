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
  editingPolygonId,
  onGotoMarker,
  onToggleEdit,
  onDeleteMarker
}) {
  return (
    <div style={{ width: '300px', borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
      <h3>📝 标记列表</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {markers.map(m => (
          <li key={m.id} style={{ padding: '10px', border: '1px solid #eee', marginBottom: '10px', borderRadius: '6px', background: editingPolygonId === m.id ? '#fff3cd' : '#fafafa' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', wordBreak: 'break-all' }}>
              {m.id} {m.polygon ? '(多边形)' : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => onGotoMarker(m.id)} style={btnStyle}>🎯 转到</button>
              
              {m.polygon && (
                <button 
                  onClick={() => onToggleEdit(m.id)} 
                  style={{
                    ...btnStyle, 
                    background: editingPolygonId === m.id ? '#ffc107' : 'white', 
                    borderColor: editingPolygonId === m.id ? '#ffc107' : '#ccc'
                  }}
                >
                  {editingPolygonId === m.id ? '✅ 完成编辑' : '✏️ 编辑点'}
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
        ))}
        {markers.length === 0 && <p style={{ color: '#999' }}>暂无标记，请在左侧绘制</p>}
      </ul>
    </div>
  );
}
