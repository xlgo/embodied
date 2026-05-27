import React from 'react';

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

export default function PolygonTool({ onStart }) {
  return (
    <button onClick={onStart} style={btnStyle}>
      📍 绘制多边形
    </button>
  );
}
