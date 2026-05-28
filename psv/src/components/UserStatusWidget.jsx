import React, { useState, useEffect, useRef } from 'react';

export default function UserStatusWidget() {
  const [now, setNow] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const widgetRef = useRef(null);

  // 每秒更新时钟
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 点击外部自动收起下拉菜单
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // 格式化时间与日期
  const timeStr = now.toTimeString().split(' ')[0]; // "12:36:00"
  
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
  
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];

  const handleAction = (type) => {
    alert(`触发动作：${type}`);
    setDropdownOpen(false);
  };

  return (
    <div
      ref={widgetRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(22, 25, 34, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 229, 255, 0.15)',
        borderRadius: '8px',
        padding: '6px 12px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        gap: '12px',
        position: 'relative'
      }}
    >
      <style>{`
        .user-btn {
          background-color: #0c0d14;
          border: 1px solid #2e354f;
          color: #e2e8f0;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          height: 28px;
          box-sizing: border-box;
        }
        .user-btn:hover {
          border-color: #00dfb6;
          color: #ffffff;
          background-color: #12141f;
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 110px;
          background-color: rgba(22, 25, 34, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid #2e354f;
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 9995;
          display: flex;
          flex-direction: column;
          animation: menuFadeIn 0.15s ease-out;
        }
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dropdown-item {
          padding: 8px 12px;
          font-size: 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .dropdown-item.primary {
          color: #00dfb6;
        }
        .dropdown-item.default {
          color: #a0aec0;
        }
        .dropdown-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        .dropdown-item.default:hover {
          color: #ffffff;
        }
      `}</style>

      {/* 左侧：实时时钟和日期 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', lineHeight: 1.1, letterSpacing: '0.5px' }}>
          {timeStr}
        </span>
        <span style={{ fontSize: '10px', color: '#a0aec0', marginTop: '2px', lineHeight: 1.1 }}>
          {dateStr} <span style={{ opacity: 0.5 }}>|</span> {weekDay}
        </span>
      </div>

      {/* 分隔细灰线 */}
      <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

      {/* 右侧：用户信息按钮 */}
      <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
        {/* 用户头像 👤 */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span style={{ fontWeight: '500' }}>tower</span>
        {/* 下三角 ▼ */}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {/* 下拉菜单 */}
      {dropdownOpen && (
        <div className="dropdown-menu">
          <button className="dropdown-item primary" onClick={() => handleAction('修改信息')}>
            修改信息
          </button>
          <button className="dropdown-item default" onClick={() => handleAction('退出登录')}>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
