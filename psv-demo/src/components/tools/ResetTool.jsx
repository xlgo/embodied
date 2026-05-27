import React from 'react';

const btnStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  background: '#f8f9fa',
  color: '#dc3545',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.2s',
  border: '1px solid #dc3545'
};

export default function ResetTool({ onReset }) {
  return (
    <button onClick={onReset} style={btnStyle}>
      🗑️ 恢复默认
    </button>
  );
}
