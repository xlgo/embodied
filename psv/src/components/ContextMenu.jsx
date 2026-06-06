import React, { useEffect, useRef, useState } from 'react';

export default function ContextMenu({ x, y, visible, onClose, onAddTag, markerListVisible, onToggleMarkerList }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (visible) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [visible, onClose]);

  // Adjust position to keep menu within viewport using fixed positioning
  useEffect(() => {
    if (!visible || !menuRef.current) return;
    const menu = menuRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = menu.offsetWidth;
    const menuH = menu.offsetHeight;
    let ax = x;
    let ay = y;
    if (x + menuW > vw) ax = Math.max(0, x - menuW);
    if (y + menuH > vh) ay = Math.max(0, y - menuH);
    setPos({ x: ax, y: ay });
  }, [visible, x, y]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 9999,
        backgroundColor: 'rgba(24, 27, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
        padding: '6px 0',
        width: '160px',
        animation: 'fadeIn 0.15s ease-out',
        userSelect: 'none',
      }}
    >
      <style>{`
        .context-menu-item {
          padding: 8px 16px;
          color: #e2e8f0;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
        .context-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
        .context-menu-item.highlight {
          color: #00e5ff;
          font-weight: 500;
        }
        .context-menu-item.highlight:hover {
          background-color: rgba(0, 229, 255, 0.1);
        }
      `}</style>
      <div className="context-menu-item" onClick={onClose}>全屏</div>
      <div className="context-menu-item" onClick={onClose}>设为默认通道</div>
      <div 
        className="context-menu-item highlight" 
        onClick={() => {
          onAddTag();
          onClose();
        }}
      >
        添加标签
      </div>
      <div 
        className="context-menu-item highlight" 
        onClick={() => {
          onToggleMarkerList();
          onClose();
        }}
      >
        {markerListVisible ? '隐藏标注' : '显示标注'}
      </div>
      <div className="context-menu-item" onClick={onClose}>收藏该通道</div>
      <div className="context-menu-item" onClick={onClose}>通道历史</div>
      <div className="context-menu-item" onClick={onClose}>返回上一通道</div>
    </div>
  );
}
