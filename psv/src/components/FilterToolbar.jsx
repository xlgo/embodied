import React from 'react';

// 左侧垂直悬浮功能过滤器工具栏组件
export default function FilterToolbar({ activeFilters, onChange }) {
  const toggleFilter = (key) => {
    if (onChange) {
      onChange({
        ...activeFilters,
        [key]: !activeFilters[key]
      });
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 9980,
      background: 'rgba(22, 25, 34, 0.85)',
      backdropFilter: 'blur(8px)',
      border: '1.2px solid rgba(0, 223, 182, 0.3)',
      borderRadius: '12px',
      padding: '12px 6px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      width: '52px',
      boxSizing: 'border-box'
    }}>
      {/* 告警 */}
      <button
        onClick={() => toggleFilter('alarm')}
        style={{
          background: 'none',
          border: 'none',
          color: activeFilters.alarm ? '#00dfb6' : '#a0aec0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          padding: '2px 0',
          transition: 'all 0.2s',
          outline: 'none',
          position: 'relative'
        }}
        title="切换告警点位可见性"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 警示灯 SVG 图标 (18x18) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 20h14" />
            <path d="M17 20v-5a5 5 0 0 0-10 0v5" strokeLinejoin="round" />
            <path d="M12 11v4M12 7V5" />
            <path d="M7.5 10L6 8.5" />
            <path d="M16.5 10l1.5-1.5" />
          </svg>
          {/* 右上角红色通知点 */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            right: '-3px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#ff3b30',
            boxShadow: '0 0 4px #ff3b30'
          }} />
        </div>
        <span style={{ fontSize: '9.5px', fontWeight: 'bold', letterSpacing: '0.3px' }}>告警</span>
      </button>

      {/* 微弱水平分割线 */}
      <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

      {/* 通道 */}
      <button
        onClick={() => toggleFilter('channel')}
        style={{
          background: 'none',
          border: 'none',
          color: activeFilters.channel ? '#00dfb6' : '#a0aec0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          padding: '2px 0',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        title="切换通道点位可见性"
      >
        {/* 卡片定位针 SVG 图标 (18x18) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="16" rx="2.5" />
          <circle cx="12" cy="11" r="2" />
          <path d="M12 8c-2 0-3.5 1.5-3.5 3.5 0 2.2 3.5 6 3.5 6s3.5-3.8 3.5-6c0-2-1.5-3.5-3.5-3.5z" />
        </svg>
        <span style={{ fontSize: '9.5px', fontWeight: 'bold', letterSpacing: '0.3px' }}>通道</span>
      </button>

      {/* 微弱水平分割线 */}
      <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

      {/* 标签 */}
      <button
        onClick={() => toggleFilter('label')}
        style={{
          background: 'none',
          border: 'none',
          color: activeFilters.label ? '#00dfb6' : '#a0aec0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          padding: '2px 0',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        title="切换其它标签可见性"
      >
        {/* 丝带标签带星 SVG 图标 (18x18) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          <polygon points="12 11.5 14.5 13 13.8 10 16 8 13 7.8 12 5 11 7.8 8 8 10.2 10 9.5 13" fill="currentColor" />
        </svg>
        <span style={{ fontSize: '9.5px', fontWeight: 'bold', letterSpacing: '0.3px' }}>标签</span>
      </button>
    </div>
  );
}
