import React, { useState } from 'react';

// SVG 路径图标库 (微调至精致的 20x20 大小)
const ICONS = {
  camera: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  playback: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0-.57-8.38l5.67-5.67" />
      <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
    </svg>
  ),
  inspection: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  ),
  related: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  linkage: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="21" y1="9" x2="3" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
};

// 预设默认的 6 个核心工具
const DEFAULT_TOOLS = [
  { id: 'screenshot', name: '截屏', icon: ICONS.camera },
  { id: 'screenrecord', name: '录屏', icon: ICONS.video },
  { id: 'playback', name: '录像回放', icon: ICONS.playback },
  { id: 'inspect', name: '巡检', icon: ICONS.inspection },
  { id: 'videos', name: '相关视频', icon: ICONS.related },
  { id: 'linkage', name: '联动屏', icon: ICONS.linkage }
];

export default function BottomToolbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState('screenshot');
  const [currentPage, setCurrentPage] = useState(0);
  const [mockItemCount, setMockItemCount] = useState(6);

  // 动态生成展示的工具列表以支持“未来拓展规则”测试
  const getToolsList = () => {
    const list = [...DEFAULT_TOOLS];
    if (mockItemCount > 6) {
      // 拓展到 8 个
      list.push(
        { id: 'linkage-2', name: '联动屏', icon: ICONS.linkage },
        { id: 'linkage-3', name: '联动屏', icon: ICONS.linkage }
      );
    }
    if (mockItemCount > 8) {
      // 拓展到 10 个 (超过8个)
      list.push(
        { id: 'other-1', name: '其他', icon: ICONS.video },
        { id: 'other-2', name: '其他', icon: ICONS.playback }
      );
    }
    if (mockItemCount > 10) {
      // 拓展到 16 个 (超过15个左右切换)
      for (let i = 3; i <= 8; i++) {
        list.push({ id: `other-mock-${i}`, name: '联动屏', icon: ICONS.linkage });
      }
    }
    return list.slice(0, mockItemCount);
  };

  const tools = getToolsList();
  const totalItems = tools.length;

  let totalPages = 1;
  if (totalItems > 8) {
    const pages = [];
    let tempItems = [...tools];
    
    pages.push(tempItems.splice(0, 7));
    
    while (tempItems.length > 0) {
      if (tempItems.length <= 8) {
        pages.push(tempItems.splice(0, 8));
      } else {
        pages.push(tempItems.splice(0, 7));
      }
    }
    totalPages = pages.length;
  }

  // 获取当前页展示的信息
  const getPageConfig = () => {
    if (totalItems <= 8) {
      return { displayItems: tools, showPrev: false, showNext: false };
    }

    const pages = [];
    let tempItems = [...tools];
    pages.push(tempItems.splice(0, 7));
    while (tempItems.length > 0) {
      if (tempItems.length <= 8) {
        pages.push(tempItems.splice(0, 8));
      } else {
        pages.push(tempItems.splice(0, 7));
      }
    }

    const pageIndex = Math.min(currentPage, pages.length - 1);
    const displayItems = pages[pageIndex] || [];
    const showPrev = pageIndex > 0;
    const showNext = pageIndex < pages.length - 1;

    return { displayItems, showPrev, showNext };
  };

  const { displayItems, showPrev, showNext } = getPageConfig();

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemCountChange = (count) => {
    setMockItemCount(count);
    setCurrentPage(0);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: collapsed ? '0' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9995,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'auto',
      width: '25%', // 宽度占 1/4 (25%)
      minWidth: '280px' // 设定一个最小保护宽度，防止极窄屏下重叠
    }}>
      {/* 模拟器控制栏 */}
      {!collapsed && (
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '2px 8px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <span>测试项数:</span>
          {[6, 8, 10, 16].map(count => (
            <span
              key={count}
              onClick={() => handleItemCountChange(count)}
              style={{
                cursor: 'pointer',
                color: mockItemCount === count ? '#00dfb6' : 'inherit',
                fontWeight: mockItemCount === count ? 'bold' : 'normal',
                padding: '0 4px',
                transition: 'color 0.2s'
              }}
            >
              {count}个
            </span>
          ))}
        </div>
      )}

      {/* 主工具栏面板 */}
      <div style={{
        background: 'rgba(22, 25, 34, 0.88)',
        backdropFilter: 'blur(15px)',
        border: '1.2px solid rgba(0, 223, 182, 0.35)',
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 223, 182, 0.05)',
        display: 'flex',
        alignItems: 'center',
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? 'translateY(100px) scale(0.9)' : 'translateY(0) scale(1)',
        pointerEvents: collapsed ? 'none' : 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%', // 宽度占满父级的 25%
        boxSizing: 'border-box',
        justifyContent: 'center'
      }}>
        {/* 左切换按钮 */}
        {showPrev && (
          <button
            onClick={handlePrev}
            style={{
              background: 'none',
              border: 'none',
              color: '#00dfb6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'all 0.2s',
              marginRight: '2px',
              flexShrink: 0
            }}
            title="前一页"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* 工具列表 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // 均匀分布
          width: '100%',
          gap: '8px'
        }}>
          {displayItems.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 2px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(0, 223, 182, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 223, 182, 0.45)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 10px rgba(0, 223, 182, 0.2)' : 'none',
                  color: isActive ? '#00dfb6' : 'rgba(255, 255, 255, 0.75)',
                  flex: 1,
                  minWidth: 0,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* 图标 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(0, 223, 182, 0.6))' : 'none',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}>
                  {tool.icon}
                </div>
                {/* 文本 */}
                <span style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '600' : '500',
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}>
                  {tool.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* 右切换按钮 */}
        {showNext && (
          <button
            onClick={handleNext}
            style={{
              background: 'none',
              border: 'none',
              color: '#00dfb6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'all 0.2s',
              marginLeft: '2px',
              flexShrink: 0
            }}
            title="后一页"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* 收起 / 展开双箭头按钮 ︾ ︽ */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'rgba(22, 25, 34, 0.82)',
          backdropFilter: 'blur(10px)',
          border: '1.2px solid rgba(0, 223, 182, 0.28)',
          color: '#00dfb6',
          width: '34px',
          height: '20px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
          padding: 0,
          transform: collapsed ? 'translateY(-2px)' : 'translateY(0)'
        }}
        title={collapsed ? "展开工具栏" : "收起工具栏"}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
