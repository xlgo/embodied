import React, { useState, useMemo, useRef, useEffect } from 'react';
import PhotoSphereComponent from './PhotoSphereComponent';
import MarkerList from './components/MarkerList';
import ContextMenu from './components/ContextMenu';
import ConfigPanel, { registeredTools } from './components/ConfigPanel';
import UserStatusWidget from './components/UserStatusWidget';

const INITIAL_MARKERS = [
  {
    id: 'point-1',
    type: 'point',
    title: '设备位置 A',
    color: '#ff3b30',
    icon: '📍',
    iconSize: 28,
    showTitle: true,
    titleStyle: {
      color: '#ffffff',
      fontSize: 12,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: '#ff3b30',
      borderWidth: 1.5,
      padding: 5
    },
    category: 'none',
    layerFilter: 'always',
    coordType: 'fov',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: ['https://picsum.photos/id/10/80/80'],
    position: { pitch: 0.05, yaw: 1.2 }
  },
  {
    id: 'polygon-1',
    polygon: [
      [6.2208, 0.0906],
      [0.0443, 0.1028],
      [0.2322, 0.0849],
      [0.4531, 0.0387],
      [0.5022, -0.0056],
      [0.4587, -0.0396],
      [0.2520, -0.0453],
      [0.0434, -0.0575],
      [6.1302, -0.0623],
      [6.0094, -0.0169],
      [6.0207, 0.0387],
    ],
    strokeColor: '#00ffcc',
    strokeWidth: 2.5,
    fillColor: '#00ffcc',
    fillOpacity: 0.25,
    fillStyle: 'solid',
    tooltip: '这是一个多边形标注区域',
    category: 'none',
    layerFilter: 'always',
    linkAction: 'none',
    windowWidth: 800,
    windowHeight: 600,
    images: []
  }
];

function getBezierPoints(points, steps = 100) {
  if (!points || points.length < 2) return points || [];
  const n = points.length - 1;
  const curvePoints = [];
  
  const binomial = (n, k) => {
    let coeff = 1;
    for (let i = 1; i <= k; i++) {
      coeff = coeff * (n - i + 1) / i;
    }
    return coeff;
  };
  
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    let yaw = 0;
    let pitch = 0;
    for (let i = 0; i <= n; i++) {
      const coeff = binomial(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
      yaw += coeff * points[i][0];
      pitch += coeff * points[i][1];
    }
    curvePoints.push([yaw, pitch]);
  }
  return curvePoints;
}

function getDistanceToSegment(C, A, B) {
  let ay = A[0];
  let by = B[0];
  const cy = C[0];

  while (ay - cy > Math.PI) ay -= 2 * Math.PI;
  while (ay - cy < -Math.PI) ay += 2 * Math.PI;
  while (by - cy > Math.PI) by -= 2 * Math.PI;
  while (by - cy < -Math.PI) by += 2 * Math.PI;

  const ax = ay;
  const ap = A[1];
  const bx = by;
  const bp = B[1];
  const cx = cy;
  const cp = C[1];

  const dx = bx - ax;
  const dp = bp - ap;

  if (dx === 0 && dp === 0) {
    return Math.sqrt((cx - ax) ** 2 + (cp - ap) ** 2);
  }

  let t = ((cx - ax) * dx + (cp - ap) * dp) / (dx * dx + dp * dp);
  t = Math.max(0, Math.min(1, t)); // clamp to segment

  const projX = ax + t * dx;
  const projP = ap + t * dp;

  return Math.sqrt((cx - projX) ** 2 + (cp - projP) ** 2);
}

const DEFAULT_POINT_CONFIG = {
  type: 'point',
  title: '新建标签',
  color: '#ff3b30',
  icon: '📍',
  iconSize: 28,
  showTitle: true,
  titleStyle: {
    color: '#ffffff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderColor: '#ff3b30',
    borderWidth: 1.5,
    padding: 5
  },
  category: 'none',
  layerFilter: 'always',
  coordType: 'fov',
  linkAction: 'none',
  windowWidth: 800,
  windowHeight: 600,
  images: []
};

const DEFAULT_POLYGON_CONFIG = {
  strokeColor: '#00ffcc',
  strokeWidth: 2.5,
  fillColor: '#00ffcc',
  fillOpacity: 0.25,
  fillStyle: 'solid',
  tooltip: '新建多边形区域',
  category: 'none',
  layerFilter: 'always',
  linkAction: 'none',
  windowWidth: 800,
  windowHeight: 600,
  images: []
};

function App() {
  const psvRef = useRef(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  // Load initial markers from LocalStorage if available
  const [markers, setMarkers] = useState(() => {
    try {
      const saved = localStorage.getItem('psv_markers');
      return saved ? JSON.parse(saved) : INITIAL_MARKERS;
    } catch (e) {
      console.error("Failed to load markers from localStorage:", e);
      return INITIAL_MARKERS;
    }
  });

  // Save markers to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('psv_markers', JSON.stringify(markers));
    } catch (e) {
      console.error("Failed to save markers to localStorage:", e);
    }
  }, [markers]);

  // Drawing & Editing state
  const [drawingMode, setDrawingMode] = useState('none'); // 'none', 'polygon', 'point'
  const [draftPoints, setDraftPoints] = useState([]); // array of [yaw, pitch]
  const [editingPolygonId, setEditingPolygonId] = useState(null);
  const [editingPointId, setEditingPointId] = useState(null);

  // Draft state representing the marker currently under active edit/creation (before hitting Save)
  const [draftMarker, setDraftMarker] = useState(null);

  // Floating Context Menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Floating Editor Panel Visibility, Positions & Dimension
  const [editorVisible, setEditorVisible] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 30, y: 30 });
  const [panelHeight, setPanelHeight] = useState(385);

  const panoramaUrl = '/sphere.jpg';
  const lastMarkerClickRef = useRef({ id: null, time: 0 });

  // Toggles workspace editor panel visibility when user clicks edit
  const handleStartEditToolbar = () => {
    setEditorVisible(true);
    setPanelPos({ x: 30, y: 30 });
  };

  const handleMarkerClick = (marker) => {
    if (editingPolygonId) {
      if (marker.id.startsWith('delete-handle-')) {
        const pointIndex = parseInt(marker.id.split('-').pop(), 10);
        setDraftMarker(prev => {
          const key = prev?.polygon ? 'polygon' : prev?.polyline ? 'polyline' : null;
          if (prev && key) {
            const newPoints = [...prev[key]];
            newPoints.splice(pointIndex, 1);
            return { ...prev, [key]: newPoints };
          }
          return prev;
        });
        return;
      }
      if (marker.id.startsWith('edit-handle-')) {
        return;
      }
    }

    if (drawingMode !== 'none') return;

    // Double click detection to select/edit marker
    const now = Date.now();
    const lastClick = lastMarkerClickRef.current;
    
    if (lastClick.id === marker.id && (now - lastClick.time) < 300) {
      const targetMarker = markers.find(m => m.id === marker.id);
      if (targetMarker) {
        if (editingPolygonId || editingPointId) {
          setEditingPolygonId(null);
          setEditingPointId(null);
          setDraftMarker(null);
        }
        setSelectedMarkerId(marker.id);
        setDraftMarker(JSON.parse(JSON.stringify(targetMarker)));
        setEditorVisible(true);

        if (targetMarker.type === 'point') {
          setEditingPointId(marker.id);
          setEditingPolygonId(null);
        } else {
          setEditingPolygonId(marker.id);
          setEditingPointId(null);
        }
        setPanelPos({ x: 30, y: 30 });
        setPanelHeight(385);
      }
      lastMarkerClickRef.current = { id: null, time: 0 };
    } else {
      lastMarkerClickRef.current = { id: marker.id, time: now };
    }
  };

  const handleViewerClick = (data) => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    if (drawingMode === 'none') return;
    
    const { pitch, yaw } = data;
    
    const selectedTool = registeredTools.find(t => t.id === drawingMode);
    if (!selectedTool) return;

    if (selectedTool.type === 'point') {
      const finalId = `point-${Date.now()}`;
      // Create point using current draft styling attributes
      const newMarker = {
        ...selectedTool.defaultConfig,
        ...(draftMarker || {}),
        id: finalId,
        position: { pitch, yaw }
      };

      setMarkers(prev => [...prev, newMarker]);
      setDrawingMode('none');
      setSelectedMarkerId(finalId);
      setEditingPointId(finalId);
      setDraftMarker(JSON.parse(JSON.stringify(newMarker)));
      setEditorVisible(true);
    } else if (selectedTool.type === 'polygon' || selectedTool.type === 'polyline') {
      setDraftPoints(prev => [...prev, [yaw, pitch]]);
    }
  };

  const finishDrawing = () => {
    setDraftPoints(currentPoints => {
      const cleaned = [];
      for (let i = 0; i < currentPoints.length; i++) {
        if (i > 0) {
          const prev = currentPoints[i-1];
          const curr = currentPoints[i];
          const dist = Math.sqrt(Math.pow(prev[0] - curr[0], 2) + Math.pow(prev[1] - curr[1], 2));
          if (dist < 0.01) {
            continue;
          }
        }
        cleaned.push(currentPoints[i]);
      }

      const selectedTool = registeredTools.find(t => t.id === drawingMode);
      if (!selectedTool) return [];

      const isPolygon = selectedTool.type === 'polygon';
      const minPoints = isPolygon ? 3 : 2;

      if (cleaned.length >= minPoints) {
        const finalId = `${selectedTool.id}-${Date.now()}`;
        const newShape = {
          ...selectedTool.defaultConfig,
          ...(draftMarker || {}),
          id: finalId,
          ...(isPolygon ? { polygon: cleaned } : { polyline: cleaned })
        };
        setMarkers(prev => [...prev, newShape]);
        setSelectedMarkerId(finalId);
        setEditingPolygonId(finalId);
        setDraftMarker(JSON.parse(JSON.stringify(newShape)));
        setEditorVisible(true);
      } else {
        alert(isPolygon ? '多边形至少需要3个点！' : '线段至少需要2个点！');
      }
      return [];
    });
    setDrawingMode('none');
  };

  const cancelDrawing = () => {
    setDraftPoints([]);
    setDrawingMode('none');
    setEditorVisible(true);
  };

  const gotoMarker = (id) => {
    if (psvRef.current) {
      psvRef.current.gotoMarker(id);
    }
  };

  const handleSelectMarker = (id) => {
    if (editingPolygonId || editingPointId) {
      setEditingPolygonId(null);
      setEditingPointId(null);
      setDraftMarker(null);
    }
    setSelectedMarkerId(id);
    setEditorVisible(true);

    const targetMarker = markers.find(m => m.id === id);
    if (targetMarker) {
      setDraftMarker(JSON.parse(JSON.stringify(targetMarker)));
      if (targetMarker.type === 'point') {
        setEditingPointId(id);
        setEditingPolygonId(null);
      } else {
        setEditingPolygonId(id);
        setEditingPointId(null);
      }
      setPanelPos({ x: 30, y: 30 });
      setPanelHeight(385);
    }
  };

  const handleToggleEdit = (id) => {
    if (editingPolygonId !== id) {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并切换吗？");
        if (!confirmDiscard) return;
      }
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target)));
      setEditingPolygonId(id);
      setEditingPointId(null);
      setSelectedMarkerId(id);
      setEditorVisible(true);
      setPanelPos({ x: 30, y: 30 });
      setPanelHeight(385);
    } else {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要关闭编辑并放弃修改吗？");
        if (!confirmDiscard) return;
      }
      setEditingPolygonId(null);
      setDraftMarker(null);
      setSelectedMarkerId(null);
    }
  };

  const handleToggleEditPoint = (id) => {
    if (editingPointId !== id) {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并切换吗？");
        if (!confirmDiscard) return;
      }
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target)));
      setEditingPointId(id);
      setEditingPolygonId(null);
      setSelectedMarkerId(id);
      setEditorVisible(true);
      setPanelPos({ x: 30, y: 30 });
      setPanelHeight(385);
    } else {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要关闭编辑并放弃修改吗？");
        if (!confirmDiscard) return;
      }
      setEditingPointId(null);
      setDraftMarker(null);
      setSelectedMarkerId(null);
    }
  };

  const handleUpdateDraft = (updates) => {
    setDraftMarker(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const handleSaveEdit = (id) => {
    if (!draftMarker) return;

    // Check for link action validations
    const hasLinkedData = (draftMarker.images && draftMarker.images.length > 0) || 
                          (draftMarker.windowWidth && draftMarker.windowWidth !== 800) || 
                          (draftMarker.windowHeight && draftMarker.windowHeight !== 600);
    const noLinkAction = draftMarker.linkAction === 'none';

    if (hasLinkedData && noLinkAction) {
      const confirmSave = window.confirm("检测到您添加了关联图片或调整了窗口大小，但【关联动作】仍为【无】。确定要直接保存吗？");
      if (!confirmSave) return;
    }

    const isExisting = markers.some(m => m.id === id);
    if (isExisting) {
      setMarkers(prev => prev.map(m => m.id === id ? draftMarker : m));
    } else {
      setMarkers(prev => [...prev, { ...draftMarker, id }]);
    }
    
    setEditingPointId(null);
    setEditingPolygonId(null);
    setDraftMarker(null);
    setSelectedMarkerId(null);
  };

  const handleCancelEdit = () => {
    if (draftMarker) {
      const confirmDiscard = window.confirm("确定要取消并放弃此次修改吗？");
      if (!confirmDiscard) return;
    } else {
      setEditorVisible(false);
    }
    setEditingPointId(null);
    setEditingPolygonId(null);
    setDraftMarker(null);
    setSelectedMarkerId(null);
  };

  const handlePointDrag = (id, yaw, pitch) => {
    setDraftMarker(prev => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          position: { yaw, pitch }
        };
      }
      return prev;
    });
  };

  const handleMarkerResize = (id, newSize) => {
    setDraftMarker(prev => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          iconSize: newSize
        };
      }
      return prev;
    });
  };

  const handleDeleteMarker = (id) => {
    if (editingPolygonId === id) setEditingPolygonId(null);
    if (editingPointId === id) setEditingPointId(null);
    if (selectedMarkerId === id) setSelectedMarkerId(null);
    if (draftMarker && draftMarker.id === id) setDraftMarker(null);
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  const handleAction = (action) => {
    if (action === 'delete') {
      if (selectedMarkerId) {
        handleDeleteMarker(selectedMarkerId);
      } else if (draftMarker) {
        handleCancelEdit();
      }
    } else if (action === 'reset') {
      if (draftMarker) {
        const selectedTool = registeredTools.find(t => t.match && t.match(draftMarker));
        if (selectedTool) {
          if (selectedTool.type === 'point') {
            setDraftMarker({ ...selectedTool.defaultConfig, id: draftMarker.id, position: draftMarker.position });
          } else {
            const shapeKey = draftMarker.polygon ? 'polygon' : 'polyline';
            setDraftMarker({ ...selectedTool.defaultConfig, id: draftMarker.id, [shapeKey]: draftMarker[shapeKey] });
          }
        }
      }
    }
  };

  const handleSelectTool = (toolId) => {
    const selectedTool = registeredTools.find(t => t.id === toolId);
    if (selectedTool) {
      setDrawingMode(toolId);
      const isPointType = selectedTool.type === 'point';
      const draftId = `${selectedTool.type}-${Date.now()}`;
      
      setDraftMarker({
        ...selectedTool.defaultConfig,
        id: draftId
      });

      if (isPointType) {
        setEditingPointId('new-point');
        setEditingPolygonId(null);
      } else {
        setEditingPolygonId('new-polygon');
        setEditingPointId(null);
        setDraftPoints([]);
      }
      setEditorVisible(false); // Hide toolbar and configs while drawing
    } else {
      setDraftMarker(null);
      setEditingPointId(null);
      setEditingPolygonId(null);
      setEditorVisible(true);
    }
  };

  const handleEditPointDrag = (pointIndex, yaw, pitch) => {
    setDraftMarker(prev => {
      const key = prev?.polygon ? 'polygon' : prev?.polyline ? 'polyline' : null;
      if (prev && key) {
        const newPoints = [...prev[key]];
        newPoints[pointIndex] = [yaw, pitch];
        return { ...prev, [key]: newPoints };
      }
      return prev;
    });
  };

  const handleEditPointAdd = (insertIndex, yaw, pitch) => {
    setDraftMarker(prev => {
      const key = prev?.polygon ? 'polygon' : prev?.polyline ? 'polyline' : null;
      if (prev && key) {
        const newPoints = [...prev[key]];
        newPoints.splice(insertIndex, 0, [yaw, pitch]);
        return { ...prev, [key]: newPoints };
      }
      return prev;
    });
  };

  const handleViewerDblClick = (data) => {
    if (drawingMode === 'polygon' || drawingMode === 'line' || drawingMode === 'bezier') {
      finishDrawing();
    }
  };

  const handleEditPointDelete = (pointIndex) => {
    setDraftMarker(prev => {
      const key = prev?.polygon ? 'polygon' : prev?.polyline ? 'polyline' : null;
      if (prev && key) {
        const newPoints = [...prev[key]];
        newPoints.splice(pointIndex, 1);
        return { ...prev, [key]: newPoints };
      }
      return prev;
    });
  };

  const handleContextMenu = (coords) => {
    setContextMenu({
      visible: true,
      x: coords.x,
      y: coords.y
    });
  };

  // Compile active point and polygon visual configurations to viewer
  const displayMarkers = useMemo(() => {
    const list = markers.map(m => {
      const isEditingThis = draftMarker && draftMarker.id === m.id;
      const currentMarker = isEditingThis ? draftMarker : m;

      const isSelected = selectedMarkerId === currentMarker.id;
      const isEditing = (editingPointId === currentMarker.id || editingPolygonId === currentMarker.id);

      if (currentMarker.type === 'point') {
        const isImageText = currentMarker.icon === '💬';
        
        if (isImageText) {
          const leaderColor = currentMarker.leaderColor || currentMarker.titleStyle?.borderColor || '#00ffcc';
          const textColor = currentMarker.textColor || currentMarker.titleStyle?.color || '#ffffff';
          const textBg = currentMarker.textBg || currentMarker.titleStyle?.backgroundColor || 'rgba(22, 25, 34, 0.9)';
          const textPosition = currentMarker.textPosition || 'top-right';
          const showTitle = currentMarker.showTitle !== false;
          
          let lineSvg = '';
          let boxStyle = '';
          
          if (textPosition === 'top-right') {
            lineSvg = `<svg style="position: absolute; overflow: visible; left: 0; top: -25px; width: 30px; height: 25px; pointer-events: none;"><path d="M 0 25 L 0 0 L 30 0" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; left: 30px; top: -25px; transform: translateY(-50%);`;
          } else if (textPosition === 'top-left') {
            lineSvg = `<svg style="position: absolute; overflow: visible; right: 0; top: -25px; width: 30px; height: 25px; pointer-events: none;"><path d="M 30 25 L 30 0 L 0 0" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; right: 30px; top: -25px; transform: translateY(-50%);`;
          } else if (textPosition === 'bottom-right') {
            lineSvg = `<svg style="position: absolute; overflow: visible; left: 0; top: 0; width: 30px; height: 25px; pointer-events: none;"><path d="M 0 0 L 0 25 L 30 25" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; left: 30px; top: 25px; transform: translateY(-50%);`;
          } else if (textPosition === 'bottom-left') {
            lineSvg = `<svg style="position: absolute; overflow: visible; right: 0; top: 0; width: 30px; height: 25px; pointer-events: none;"><path d="M 30 0 L 30 25 L 0 25" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; right: 30px; top: 25px; transform: translateY(-50%);`;
          }

          return {
            ...currentMarker,
            html: `
              <div class="draggable-point-marker" data-marker-id="${currentMarker.id}" style="position: relative; width: 0; height: 0; cursor: ${isEditing ? 'grab' : 'pointer'}; user-select: none;">
                <!-- 地面小锚点 -->
                <div style="position: absolute; left: -6px; top: -3px; width: 12px; height: 6px; border-radius: 50%; background: ${leaderColor}; box-shadow: 0 0 8px ${leaderColor};"></div>
                
                <!-- 指引线 -->
                ${lineSvg}
                
                <!-- 文本框 -->
                ${showTitle ? `
                  <div class="${isEditing ? 'selected-bounding-box' : ''}" style="${boxStyle} white-space: nowrap; pointer-events: auto;">
                    <div style="background: ${leaderColor}; padding: 1.5px; clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));">
                      <div style="background: ${textBg}; color: ${textColor}; padding: 4px 10px; clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px)); font-size: 13px; font-weight: bold;">
                        ${currentMarker.title || '未命名'}
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            `,
            anchor: 'center'
          };
        }

        const size = currentMarker.iconSize || 28;
        const titleColor = currentMarker.titleStyle?.color || '#ffffff';
        const titleBg = currentMarker.titleStyle?.backgroundColor || 'rgba(0,0,0,0.8)';
        const titleBorderColor = currentMarker.titleStyle?.borderColor || '#ffffff';
        const titleBorderWidth = currentMarker.titleStyle?.borderWidth || 1;
        const titlePadding = currentMarker.titleStyle?.padding || 4;
        const titleFontSize = currentMarker.titleStyle?.fontSize || 12;
        const showTitle = currentMarker.showTitle !== false;

        const titleRadius = currentMarker.titleStyle?.borderRadius !== undefined ? `${currentMarker.titleStyle.borderRadius}px` : '4px';

        return {
          ...currentMarker,
          html: `
            <div class="draggable-point-marker" data-marker-id="${currentMarker.id}" style="display: flex; flex-direction: column; align-items: center; cursor: ${isEditing ? 'grab' : 'pointer'}; user-select: none;">
              <div class="${isEditing ? 'selected-bounding-box' : ''}" style="display: flex; align-items: center; justify-content: center;">
                <div class="marker-icon-wrapper" style="background: ${currentMarker.color || '#ff3b30'}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: ${size * 0.5}px; color: white;">
                  ${currentMarker.icon || '📍'}
                </div>
                ${isEditing ? `<div class="resize-corner-handle" data-marker-id="${currentMarker.id}"></div>` : ''}
              </div>
              ${showTitle ? `
                <div class="marker-title" style="background: ${titleBg}; color: ${titleColor}; padding: ${titlePadding}px ${titlePadding * 2}px; border: ${titleBorderWidth}px solid ${titleBorderColor}; border-radius: ${titleRadius}; font-size: ${titleFontSize}px; font-weight: bold; margin-top: 6px; white-space: nowrap; pointer-events: none; max-width: 120px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                  ${currentMarker.title || '未命名'}
                </div>
              ` : ''}
            </div>
          `,
          anchor: 'bottom center'
        };
      } else if (currentMarker.polygon || currentMarker.polyline) {
        const strokeColor = currentMarker.strokeColor || '#00ffcc';
        const strokeWidth = `${currentMarker.strokeWidth || 2.5}px`;
        const fillColor = currentMarker.fillColor || '#00ffcc';
        const fillOpacity = currentMarker.fillOpacity !== undefined ? currentMarker.fillOpacity : 0.25;
        const fillStyle = currentMarker.fillStyle || 'solid';

        const hexToRgba = (hex, alpha) => {
          if (!hex) return 'transparent';
          if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
          let c = hex.substring(1);
          if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
          }
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const stroke = hexToRgba(strokeColor, 1);
        const fill = currentMarker.polyline ? 'none' : (fillStyle === 'none' ? 'none' : hexToRgba(fillColor, fillOpacity));

        let renderedMarker = { ...currentMarker };
        if (currentMarker.polyline && currentMarker.id.includes('bezier')) {
          renderedMarker.polyline = getBezierPoints(currentMarker.polyline);
        }

        return {
          ...renderedMarker,
          svgStyle: {
            fill: fill,
            stroke: stroke,
            strokeWidth: strokeWidth
          }
        };
      }
      return currentMarker;
    });
    
    // Inject drafting markers for polygon/line/bezier creation
    if ((drawingMode === 'polygon' || drawingMode === 'line' || drawingMode === 'bezier') && draftPoints.length > 0) {
      draftPoints.forEach((pt, index) => {
        list.push({
          id: `draft-pt-${index}`,
          position: { yaw: pt[0], pitch: pt[1] },
          circle: 5,
          svgStyle: { fill: '#00e5ff', stroke: 'white', strokeWidth: '2px', pointerEvents: 'none' }
        });
      });
      
      if (drawingMode === 'polygon' && draftPoints.length >= 3) {
        list.push({
          id: 'draft-polygon',
          polygon: draftPoints,
          svgStyle: {
            fill: 'rgba(0, 229, 255, 0.2)',
            stroke: '#00e5ff',
            strokeWidth: '3px',
            strokeLinejoin: 'round',
            pointerEvents: 'none'
          }
        });
      } else if (draftPoints.length >= 2) {
        list.push({
          id: 'draft-polyline',
          polyline: drawingMode === 'bezier' ? getBezierPoints(draftPoints) : draftPoints,
          svgStyle: {
            stroke: '#00e5ff',
            strokeWidth: '3px',
            strokeLinejoin: 'round',
            pointerEvents: 'none'
          }
        });
      }
    }

    // Inject edit vertices for active polygon/polyline editing
    const editPoints = editingPolygonId && draftMarker && (draftMarker.polygon || draftMarker.polyline);
    if (editPoints) {
      const points = draftMarker.polygon || draftMarker.polyline;
      const isPolygon = !!draftMarker.polygon;
      const isBezier = draftMarker.id?.includes('bezier');
      const n = points.length;

      // If it is bezier, inject Photoshop style handle connector lines
      if (isBezier && n >= 2) {
        list.push({
          id: 'bezier-handle-line-1',
          polyline: [points[0], points[1]],
          svgStyle: {
            stroke: 'rgba(255, 255, 255, 0.65)',
            strokeWidth: '1.5px',
            strokeDasharray: '3,3',
            pointerEvents: 'none'
          }
        });
        if (n >= 3) {
          list.push({
            id: 'bezier-handle-line-2',
            polyline: [points[n - 1], points[n - 2]],
            svgStyle: {
              stroke: 'rgba(255, 255, 255, 0.65)',
              strokeWidth: '1.5px',
              strokeDasharray: '3,3',
              pointerEvents: 'none'
            }
          });
        }
      }

      points.forEach((pt, index) => {
        // 1. 添加真实控制点
        let handleHtml = '';
        if (isBezier) {
          if (index === 0 || index === n - 1) {
            // Endpoints: P0 and Pn-1
            handleHtml = `
              <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                <div class="edit-handle-marker" data-handle-index="${index}" style="background: #007aff; width: 12px; height: 12px; border-radius: 2px; border: 2px solid white; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
              </div>
            `;
          } else {
            // Control handles: P1 and P2
            handleHtml = `
              <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                <div class="edit-handle-marker" data-handle-index="${index}" style="background: #ffffff; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #ff3b30; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
              </div>
            `;
          }
        } else {
          // Default styling
          handleHtml = `
            <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div class="edit-handle-marker" data-handle-index="${index}" style="background: #ff3b30; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
              <div class="edit-delete-marker" data-handle-index="${index}" style="position: absolute; top: -2px; right: -2px; background: white; color: #ff3b30; font-size: 10px; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #ff3b30; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; box-shadow: 0 0 3px rgba(0,0,0,0.5); pointer-events: auto;">×</div>
            </div>
          `;
        }

        list.push({
          id: `edit-handle-${index}`,
          position: { yaw: pt[0], pitch: pt[1] },
          html: handleHtml,
          anchor: 'center',
          tooltip: isBezier ? '拖动修改曲线端点或控制柄' : '拖动修改位置，点击红叉删除'
        });

        // 2. 添加虚拟中点 (Bezier 曲线不需要中点)
        const showMid = !isBezier && (isPolygon ? (n >= 3) : (index < n - 1));
        if (showMid) {
          const nextPt = isPolygon ? points[(index + 1) % n] : points[index + 1];
          let yaw1 = pt[0];
          let yaw2 = nextPt[0];
          let pitch1 = pt[1];
          let pitch2 = nextPt[1];

          let diff = yaw2 - yaw1;
          while (diff > Math.PI) {
            yaw2 -= 2 * Math.PI;
            diff = yaw2 - yaw1;
          }
          while (diff < -Math.PI) {
            yaw2 += 2 * Math.PI;
            diff = yaw2 - yaw1;
          }

          let midYaw = yaw1 + diff / 2;
          let midPitch = (pitch1 + pitch2) / 2;

          while (midYaw < 0) midYaw += 2 * Math.PI;
          while (midYaw >= 2 * Math.PI) midYaw -= 2 * Math.PI;

          list.push({
            id: `virtual-handle-${index}`,
            position: { yaw: midYaw, pitch: midPitch },
            html: `
              <div class="virtual-handle-wrapper" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <div class="virtual-handle-marker" data-handle-index="${index}" style="background: rgba(0, 229, 255, 0.75); width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; cursor: pointer; box-shadow: 0 0 4px rgba(0,0,0,0.6); pointer-events: auto;"></div>
              </div>
            `,
            anchor: 'center',
            tooltip: '拖拽此处添加并调整新顶点'
          });
        }
      });
    }

    return list;
  }, [markers, drawingMode, draftPoints, editingPolygonId, editingPointId, selectedMarkerId, draftMarker]);

  return (
    <div style={{
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1440px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: '#0d0f14',
      minHeight: '100vh',
      color: '#f7fafc'
    }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1f2e', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #00f5d4 0%, #00e5ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🏷️ 智慧全景标签标绘工具
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#a0aec0' }}>
            点击“标绘工具栏”或右键菜单进行标绘配置。您可以边画标号边在配置面板中调整它们的外观参数。
          </p>
        </div>
        
        {/* Toggle Edit Toolbar button */}
        {!editorVisible && drawingMode === 'none' && (
          <button
            onClick={handleStartEditToolbar}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #00f5d4 0%, #00e5ff 100%)',
              color: '#0d0f14',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 229, 255, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            ✏️ 打开标绘工具栏
          </button>
        )}
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        
        {/* Left canvas wrapper */}
        <div style={{
          flex: 1,
          position: 'relative',
          borderRadius: '12px',
          border: '1px solid #1c1f2e',
          overflow: 'hidden',
          backgroundColor: '#161922',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          height: '650px'
        }}>
          
          <PhotoSphereComponent
            ref={psvRef}
            panorama={panoramaUrl}
            markers={displayMarkers}
            height="100%"
            onMarkerClick={handleMarkerClick}
            onViewerClick={handleViewerClick}
            onViewerDblClick={handleViewerDblClick}
            onEditPointDrag={handleEditPointDrag}
            onEditPointDelete={handleEditPointDelete}
            onEditPointAdd={handleEditPointAdd}
            onPointDrag={handlePointDrag}
            onMarkerResize={handleMarkerResize}
            onContextMenu={handleContextMenu}
            onDeleteMarker={handleDeleteMarker}
            selectedMarkerId={selectedMarkerId}
            drawingMode={drawingMode}
            editingPolygonId={editingPolygonId}
            editingPointId={editingPointId}
          />

          {/* 右上角时间与用户信息悬浮组件 */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 9990
          }}>
            <UserStatusWidget />
          </div>

          {/* Prompt banner shown while drawing */}
          {drawingMode !== 'none' && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9993,
              backgroundColor: 'rgba(22, 25, 34, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(0, 223, 182, 0.4)',
              borderRadius: '20px',
              padding: '8px 20px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '500',
              pointerEvents: 'none',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#00dfb6',
                boxShadow: '0 0 8px #00dfb6'
              }} />
              {(() => {
                const selectedTool = registeredTools.find(t => t.id === drawingMode);
                if (!selectedTool) return '';
                if (selectedTool.type === 'point') {
                  return `提示：请在全景图上左键点击，放置${selectedTool.name}标签`;
                }
                return `提示：请在全景图上点击绘制${selectedTool.name}节点/顶点，双击完成绘制`;
              })()}
            </div>
          )}

          {/* Context menu overlay */}
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            visible={contextMenu.visible}
            onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
            onAddTag={handleStartEditToolbar}
          />

          {/* Integrated ConfigPanel (includes toolbar, tabs and forms) */}
          {editorVisible && (
            <ConfigPanel
              panelPos={panelPos}
              setPanelPos={setPanelPos}
              panelHeight={panelHeight}
              setPanelHeight={setPanelHeight}
              drawingMode={drawingMode}
              onSelectTool={handleSelectTool}
              onAction={handleAction}
              draftMarker={draftMarker}
              onUpdateDraft={handleUpdateDraft}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}
        </div>

        {/* Right sidebar */}
        <MarkerList
          markers={markers}
          selectedMarkerId={selectedMarkerId}
          editingPolygonId={editingPolygonId}
          editingPointId={editingPointId}
          onGotoMarker={gotoMarker}
          onSelectMarker={handleSelectMarker}
          onToggleEdit={handleToggleEdit}
          onToggleEditPoint={handleToggleEditPoint}
          onDeleteMarker={handleDeleteMarker}
        />
      </div>

    </div>
  );
}

export default App;
