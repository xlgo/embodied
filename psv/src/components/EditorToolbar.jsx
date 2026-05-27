import React from 'react';
import PolygonTool from './tools/PolygonTool';
import PointTool from './tools/PointTool';
import ResetTool from './tools/ResetTool';

const btnStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  background: 'white',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.2s'
};

export default function EditorToolbar({
  drawingMode,
  onStartPolygon,
  onStartPoint,
  onRestoreDefault,
  onFinishPolygon,
  onCancelDrawing
}) {
  return (
    <div style={{ marginBottom: '15px', padding: '15px', background: '#eef', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <strong>🖌️ 绘制：</strong>
      {drawingMode === 'none' ? (
        <>
          <PolygonTool onStart={onStartPolygon} />
          <PointTool onStart={onStartPoint} />
          <ResetTool onReset={onRestoreDefault} />
        </>
      ) : (
        <>
          <span style={{ color: 'blue', fontWeight: 'bold' }}>
            当前处于 【{drawingMode === 'polygon' ? '多边形' : '点标记'}】 绘制模式...
          </span>
          {drawingMode === 'polygon' && (
            <button onClick={onFinishPolygon} style={{...btnStyle, background: '#28a745', color: 'white', border: '1px solid #28a745'}}>✅ 完成 (或双击)</button>
          )}
          <button onClick={onCancelDrawing} style={{...btnStyle, background: '#dc3545', color: 'white', border: '1px solid #dc3545'}}>❌ 取消</button>
        </>
      )}
    </div>
  );
}
