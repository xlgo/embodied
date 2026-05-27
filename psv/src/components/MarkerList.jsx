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
  selectedMarkerId,
  editingPolygonId,
  editingPointId,
  draftMarker,
  onGotoMarker,
  onSelectMarker,
  onToggleEdit,
  onToggleEditPoint,
  onDeleteMarker,
  onUpdateDraft,
  onSaveEdit,
  onCancelEdit
}) {
  return (
    <div style={{ width: '320px', borderLeft: '1px solid #ddd', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
      <h3>📝 标记列表</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {markers.map(m => {
          const isSelected = selectedMarkerId === m.id;
          const isEditingPolygon = editingPolygonId === m.id;
          const isEditingPoint = editingPointId === m.id;
          const isPoint = m.type === 'point';
          
          // Use draftMarker values when editing to support live preview with cancel option
          const displayData = (isEditingPolygon || isEditingPoint) && draftMarker ? draftMarker : m;

          return (
            <li 
              key={m.id} 
              onClick={() => onSelectMarker(m.id)}
              style={{ 
                padding: '12px', 
                border: isSelected ? '1px solid #007bff' : '1px solid #eee', 
                marginBottom: '12px', 
                borderRadius: '8px', 
                background: (isEditingPolygon || isEditingPoint) ? '#fff3cd' : (isSelected ? '#e8f4fd' : '#fafafa'),
                boxShadow: (isEditingPolygon || isEditingPoint || isSelected) ? '0 2px 8px rgba(0,123,255,0.08)' : 'none',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', wordBreak: 'break-all', color: '#333' }}>
                  {isPoint ? `${displayData.icon || '📍'} ${displayData.title || '未命名点'}` : `⬡ ${displayData.id.substring(0, 10)}... (多边形)`}
                </span>
                {isSelected && <span style={{ fontSize: '11px', color: '#007bff', fontWeight: 'bold' }}>● 已选中</span>}
              </div>

              {/* Position Info */}
              {displayData.position && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                  坐标: ({displayData.position.yaw.toFixed(2)}, {displayData.position.pitch.toFixed(2)})
                </div>
              )}

              {/* Point Marker Edit Form */}
              {isPoint && isEditingPoint && (
                <div 
                  style={{ borderTop: '1px solid #e9ecef', paddingTop: '10px', marginTop: '10px' }}
                  onClick={(e) => e.stopPropagation()} // Stop selection toggle when clicking form fields
                >
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>标题:</label>
                  <input 
                    type="text" 
                    value={displayData.title || ''} 
                    onChange={(e) => onUpdateDraft({ title: e.target.value })}
                    style={inputStyle}
                    placeholder="例如: 某关键物料"
                  />

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>标记颜色:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input 
                      type="color" 
                      value={displayData.color || '#ff0000'} 
                      onChange={(e) => onUpdateDraft({ color: e.target.value })}
                      style={{ border: 'none', width: '36px', height: '28px', cursor: 'pointer', padding: 0 }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>{displayData.color || '#ff0000'}</span>
                  </div>

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>图标 (Emoji/字):</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {PRESET_EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        type="button" 
                        onClick={() => onUpdateDraft({ icon: emoji })}
                        style={{
                          ...emojiBtnStyle,
                          borderColor: displayData.icon === emoji ? '#007bff' : '#ddd',
                          background: displayData.icon === emoji ? '#e7f1ff' : '#f8f9fa'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={displayData.icon || ''} 
                    onChange={(e) => onUpdateDraft({ icon: e.target.value })}
                    style={{...inputStyle, width: '80px'}}
                    placeholder="或自定义"
                  />

                  <div style={{ fontSize: '11px', color: '#28a745', backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px', marginBottom: '10px' }}>
                    💡 提示：在全景图上直接拖动该标记可以修改其位置。
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button 
                      onClick={() => onSaveEdit(m.id)}
                      style={{ ...btnStyle, background: '#28a745', color: 'white', borderColor: '#28a745', flex: 1, padding: '6px' }}
                    >
                      💾 保存
                    </button>
                    <button 
                      onClick={onCancelEdit}
                      style={{ ...btnStyle, background: '#dc3545', color: 'white', borderColor: '#dc3545', flex: 1, padding: '6px' }}
                    >
                      ❌ 取消
                    </button>
                  </div>
                </div>
              )}

              {/* Polygon Marker Edit Form */}
              {!isPoint && isEditingPolygon && (
                <div 
                  style={{ borderTop: '1px solid #e9ecef', paddingTop: '10px', marginTop: '10px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>边框颜色:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input 
                      type="color" 
                      value={displayData.strokeColor || '#ff0000'} 
                      onChange={(e) => onUpdateDraft({ strokeColor: e.target.value })}
                      style={{ border: 'none', width: '36px', height: '28px', cursor: 'pointer', padding: 0 }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>{displayData.strokeColor || '#ff0000'}</span>
                  </div>

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>边框粗细 ({displayData.strokeWidth || 2}px):</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={displayData.strokeWidth || 2} 
                    onChange={(e) => onUpdateDraft({ strokeWidth: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />

                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>填充方式:</label>
                  <select 
                    value={displayData.fillStyle || 'solid'} 
                    onChange={(e) => onUpdateDraft({ fillStyle: e.target.value })}
                    style={{ ...inputStyle, marginBottom: '8px' }}
                  >
                    <option value="solid">实色填充</option>
                    <option value="none">无填充 (仅边框)</option>
                  </select>

                  {displayData.fillStyle !== 'none' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>填充颜色:</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <input 
                          type="color" 
                          value={displayData.fillColor || '#ff0000'} 
                          onChange={(e) => onUpdateDraft({ fillColor: e.target.value })}
                          style={{ border: 'none', width: '36px', height: '28px', cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ fontSize: '12px', color: '#666' }}>{displayData.fillColor || '#ff0000'}</span>
                      </div>

                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>填充透明度 ({Math.round((displayData.fillOpacity !== undefined ? displayData.fillOpacity : 0.2) * 100)}%):</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={displayData.fillOpacity !== undefined ? displayData.fillOpacity : 0.2} 
                        onChange={(e) => onUpdateDraft({ fillOpacity: parseFloat(e.target.value) })}
                        style={{ width: '100%', marginBottom: '8px' }}
                      />
                    </>
                  )}
                  <div style={{ fontSize: '11px', color: '#28a745', backgroundColor: '#e8f5e9', padding: '6px', borderRadius: '4px', marginBottom: '10px' }}>
                    💡 提示：在全景图上可以拖动顶点、删除顶点，以及在多边形边框双击增加控制点。
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button 
                      onClick={() => onSaveEdit(m.id)}
                      style={{ ...btnStyle, background: '#28a745', color: 'white', borderColor: '#28a745', flex: 1, padding: '6px' }}
                    >
                      💾 保存
                    </button>
                    <button 
                      onClick={onCancelEdit}
                      style={{ ...btnStyle, background: '#dc3545', color: 'white', borderColor: '#dc3545', flex: 1, padding: '6px' }}
                    >
                      ❌ 取消
                    </button>
                  </div>
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
                    title="开始编辑属性"
                  >
                    {isEditingPoint ? '✅ 完成' : '✏️ 编辑'}
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
                    title="开始编辑多边形顶点与样式"
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
