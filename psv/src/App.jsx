import React, { useState, useMemo, useRef, useEffect } from 'react';
import PhotoSphereComponent from './PhotoSphereComponent';
import MarkerList from './components/MarkerList';
import ContextMenu from './components/ContextMenu';
import ConfigPanel from './components/ConfigPanel';
import { findToolById, findToolForMarker } from './components/tools/registry';
import UserStatusWidget from './components/UserStatusWidget';
import FilterToolbar from './components/FilterToolbar';
import BottomToolbar from './components/BottomToolbar';

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

function hexToRgba(hex, alpha) {
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
}

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

function getHollowArrowPoints(p1, p2, headSize = 24, shaftWidth = 8, tailWidth = 8) {
  const y1 = p1[0];
  const p1_val = p1[1];
  let y2 = p2[0];
  const p2_val = p2[1];

  // 计算 yaw 差值，处理 wrap-around 溢出
  let dy = y2 - y1;
  while (dy > Math.PI) dy -= 2 * Math.PI;
  while (dy < -Math.PI) dy += 2 * Math.PI;
  const dp = p2_val - p1_val;

  const L = Math.sqrt(dy * dy + dp * dp);
  if (L < 0.0001) {
    return [p2, p2, p2, p2, p2, p2, p2];
  }

  // 箭头头部弧度大小 (1px 约等于 0.0012 弧度)
  const headLength = Math.min(headSize * 0.0012, L * 0.5);
  const headWidth = headLength * 0.8;
  const shaftRad = (shaftWidth / 2) * 0.0012;
  const tailRad = (tailWidth / 2) * 0.0012;

  // 单位方向及法线向量
  const uy = dy / L;
  const up = dp / L;
  const ny = -up;
  const np = uy;

  const V1 = [y2, p2_val]; // 顶点
  const V2 = [y2 - headLength * uy + headWidth * ny, p2_val - headLength * up + headWidth * np]; // 左翼尖
  const V3 = [y2 - headLength * uy + shaftRad * ny, p2_val - headLength * up + shaftRad * np]; // 左内角
  const V4 = [y1 + tailRad * ny, p1_val + tailRad * np]; // 左尾角
  const V5 = [y1 - tailRad * ny, p1_val - tailRad * np]; // 右尾角
  const V6 = [y2 - headLength * uy - shaftRad * ny, p2_val - headLength * up - shaftRad * np]; // 右内角
  const V7 = [y2 - headLength * uy - headWidth * ny, p2_val - headLength * up - headWidth * np]; // 右翼尖

  return [V1, V2, V3, V4, V5, V6, V7].map(pt => {
    let y = pt[0];
    while (y < 0) y += 2 * Math.PI;
    while (y >= 2 * Math.PI) y -= 2 * Math.PI;
    return [y, pt[1]];
  });
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

function getSegmentMidpoint(pt, nextPt) {
  const toVector = ([yaw, pitch]) => {
    const cp = Math.cos(pitch);
    return {
      x: cp * Math.sin(yaw),
      y: Math.sin(pitch),
      z: cp * Math.cos(yaw)
    };
  };
  const a = toVector(pt);
  const b = toVector(nextPt);
  const x = a.x + b.x;
  const y = a.y + b.y;
  const z = a.z + b.z;
  const length = Math.sqrt(x * x + y * y + z * z);

  if (length > 0.000001) {
    let yaw = Math.atan2(x / length, z / length);
    if (yaw < 0) yaw += 2 * Math.PI;

    return {
      yaw,
      pitch: Math.asin(y / length)
    };
  }

  let yaw1 = pt[0];
  let yaw2 = nextPt[0];
  const pitch1 = pt[1];
  const pitch2 = nextPt[1];

  let diff = yaw2 - yaw1;
  while (diff > Math.PI) {
    yaw2 -= 2 * Math.PI;
    diff = yaw2 - yaw1;
  }
  while (diff < -Math.PI) {
    yaw2 += 2 * Math.PI;
    diff = yaw2 - yaw1;
  }

  let yaw = yaw1 + diff / 2;
  while (yaw < 0) yaw += 2 * Math.PI;
  while (yaw >= 2 * Math.PI) yaw -= 2 * Math.PI;

  return {
    yaw,
    pitch: (pitch1 + pitch2) / 2
  };
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

  // 左侧工具栏过滤器状态：告警、通道、标签，默认均开启显示
  const [activeFilters, setActiveFilters] = useState({
    alarm: true,
    channel: true,
    label: true
  });

  // 左侧设备树相关状态与交互控制
  const [treeVisible, setTreeVisible] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState('2-1-1');
  const [expandedNodes, setExpandedNodes] = useState({ '2': true, '2-1': true });
  const [treeSearchQuery, setTreeSearchQuery] = useState('');

  // Draft state representing the marker currently under active edit/creation (before hitting Save)
  const [draftMarker, setDraftMarker] = useState(null);

  // Floating Context Menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Floating Editor Panel Visibility, Positions & Dimension
  const [editorVisible, setEditorVisible] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 680, y: 30 });
  const [panelHeight, setPanelHeight] = useState(385);

  // Floating Marker List visibility state (defaults to false for maximized view)
  const [markerListVisible, setMarkerListVisible] = useState(false);

  // Automatically show the floating marker list when editing is active
  useEffect(() => {
    if (editorVisible || drawingMode !== 'none' || editingPolygonId || editingPointId) {
      setMarkerListVisible(true);
    }
  }, [editorVisible, drawingMode, editingPolygonId, editingPointId]);

  const panoramaUrl = '/sphere.jpg';
  const lastMarkerClickRef = useRef({ id: null, time: 0 });

  // Toggles workspace editor panel visibility when user clicks edit
  const handleStartEditToolbar = () => {
    setEditorVisible(true);
    setPanelPos({ x: 680, y: 30 });
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
        setPanelPos({ x: 680, y: 30 });
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
    
    const selectedTool = findToolById(drawingMode);
    if (!selectedTool) return;

    if (selectedTool.type === 'point') {
      const finalId = `point-${Date.now()}`;
      // 使用当前草稿样式属性创建点
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
    } else if (selectedTool.type === 'polygon' || selectedTool.type === 'polyline' || selectedTool.createMarker) {
      setDraftPoints(prev => {
        const nextPoints = [...prev, selectedTool.getDraftPoint ? selectedTool.getDraftPoint(data) : [yaw, pitch]];
        // 箭头只需两点，点击第二点后自动完成绘制
        if ((selectedTool.shouldAutoFinish && selectedTool.shouldAutoFinish(nextPoints)) || (selectedTool.id === 'arrow' && nextPoints.length === 2)) {
          setTimeout(() => {
            finishDrawing(nextPoints);
          }, 0);
        }
        return nextPoints;
      });
    }
  };

  const finishDrawing = (overridePoints) => {
    setDraftPoints(currentPoints => {
      const pointsToUse = overridePoints || currentPoints;
      const cleaned = [];
      for (let i = 0; i < pointsToUse.length; i++) {
        if (i > 0) {
          const prev = pointsToUse[i-1];
          const curr = pointsToUse[i];
          const dist = Math.sqrt(Math.pow(prev[0] - curr[0], 2) + Math.pow(prev[1] - curr[1], 2));
          if (dist < 0.01) {
            continue;
          }
        }
        cleaned.push(pointsToUse[i]);
      }

      const selectedTool = findToolById(drawingMode);
      if (!selectedTool) return [];

      if (selectedTool.createMarker) {
        const finalId = `${selectedTool.id}-${Date.now()}`;
        const newShape = selectedTool.createMarker({
          id: finalId,
          points: cleaned,
          draftMarker,
          defaultConfig: selectedTool.defaultConfig
        });
        if (newShape) {
          setMarkers(prev => [...prev, newShape]);
          setSelectedMarkerId(finalId);
          setEditingPolygonId(finalId);
          setDraftMarker(JSON.parse(JSON.stringify(newShape)));
          setEditorVisible(true);
        } else {
          alert(selectedTool.minPointsMessage || '标绘点位不足');
        }
        return [];
      }

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
        alert(isPolygon ? '多边形至少需要3个点！' : '标绘至少需要2个点！');
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
      setPanelPos({ x: 680, y: 30 });
      setPanelHeight(385);
    }
  };

  const handleToggleEdit = (id) => {
    if (editingPolygonId !== id) {
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target)));
      setEditingPolygonId(id);
      setEditingPointId(null);
      setSelectedMarkerId(id);
      setEditorVisible(true);
      setPanelPos({ x: 680, y: 30 });
      setPanelHeight(385);
    } else {
      setEditingPolygonId(null);
      setDraftMarker(null);
      setSelectedMarkerId(null);
      setEditorVisible(false);
    }
  };

  const handleToggleEditPoint = (id) => {
    if (editingPointId !== id) {
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target)));
      setEditingPointId(id);
      setEditingPolygonId(null);
      setSelectedMarkerId(id);
      setEditorVisible(true);
      setPanelPos({ x: 680, y: 30 });
      setPanelHeight(385);
    } else {
      setEditingPointId(null);
      setDraftMarker(null);
      setSelectedMarkerId(null);
      setEditorVisible(false);
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
    setEditorVisible(false);
  };

  const handleCancelEdit = () => {
    setEditorVisible(false);
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
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
      setEditorVisible(false);
    }
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
        const selectedTool = findToolForMarker(draftMarker);
        if (selectedTool) {
          if (selectedTool.type === 'point') {
            setDraftMarker({ ...selectedTool.defaultConfig, id: draftMarker.id, position: draftMarker.position });
          } else if (selectedTool.resetDraft) {
            setDraftMarker(selectedTool.resetDraft(draftMarker));
          } else {
            const shapeKey = draftMarker.polygon ? 'polygon' : 'polyline';
            setDraftMarker({ ...selectedTool.defaultConfig, id: draftMarker.id, [shapeKey]: draftMarker[shapeKey] });
          }
        }
      }
    }
  };

  const handleSelectTool = (toolId) => {
    const selectedTool = findToolById(toolId);
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
        setEditingPolygonId(`new-${selectedTool.type}`);
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

  const handleEditPointDrag = (pointIndex, yaw, pitch, meta = {}) => {
    setDraftMarker(prev => {
      const selectedTool = prev ? findToolForMarker(prev) : null;
      if (selectedTool?.updateDraftOnEditDrag) {
        return selectedTool.updateDraftOnEditDrag(prev, pointIndex, yaw, pitch, meta);
      }
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
      const selectedTool = prev ? findToolForMarker(prev) : null;
      if (selectedTool?.allowVertexAdd === false) return prev;
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
    if (drawingMode === 'polygon' || drawingMode === 'line' || drawingMode === 'bezier' || drawingMode === 'arrow') {
      finishDrawing();
    }
  };

  const handleEditPointDelete = (pointIndex) => {
    setDraftMarker(prev => {
      const selectedTool = prev ? findToolForMarker(prev) : null;
      if (selectedTool?.allowVertexDelete === false) return prev;
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

  // 编译生成供全景图 Viewer 显示的最终 markers 属性列表
  const displayMarkers = useMemo(() => {
    const list = [];
    markers.forEach(m => {
      const isEditingThis = draftMarker && draftMarker.id === m.id;
      const rawMarker = isEditingThis ? draftMarker : m;

      // 属性净化：删除可能冲突的多重内容属性，防止 PSVError 报错
      const markerTool = findToolForMarker(rawMarker);
      const currentMarker = markerTool?.cleanMarker ? markerTool.cleanMarker(rawMarker) : { ...rawMarker };
      if (currentMarker.type === 'point') {
        delete currentMarker.polygon;
        delete currentMarker.polyline;
        delete currentMarker.circle;
        delete currentMarker.circleEdge;
      } else if (currentMarker.polygon || currentMarker.polyline) {
        delete currentMarker.type;
        delete currentMarker.position;
        delete currentMarker.html;
        delete currentMarker.icon;
      }

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
            lineSvg = `<svg style="position: absolute; overflow: visible; left: 0; top: -25px; width: 35px; height: 25px; pointer-events: none;"><path d="M 0 25 L 15 6 L 35 6" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; left: 35px; top: -19px; transform: translateY(-50%);`;
          } else if (textPosition === 'top-left') {
            lineSvg = `<svg style="position: absolute; overflow: visible; right: 0; top: -25px; width: 35px; height: 25px; pointer-events: none;"><path d="M 35 25 L 20 6 L 0 6" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; right: 35px; top: -19px; transform: translateY(-50%);`;
          } else if (textPosition === 'bottom-right') {
            lineSvg = `<svg style="position: absolute; overflow: visible; left: 0; top: 0; width: 35px; height: 25px; pointer-events: none;"><path d="M 0 0 L 15 19 L 35 19" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; left: 35px; top: 19px; transform: translateY(-50%);`;
          } else if (textPosition === 'bottom-left') {
            lineSvg = `<svg style="position: absolute; overflow: visible; right: 0; top: 0; width: 35px; height: 25px; pointer-events: none;"><path d="M 35 0 L 20 19 L 0 19" fill="none" stroke="${leaderColor}" stroke-width="2" /></svg>`;
            boxStyle = `position: absolute; right: 35px; top: 19px; transform: translateY(-50%);`;
          }

          list.push({
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
          });
        } else {
          const size = currentMarker.iconSize || 24;
          const color = currentMarker.color || '#ff3b30';
          const icon = currentMarker.icon || '📍';
          const showTitle = currentMarker.showTitle !== false;

          const isSvgIcon = icon.includes('<path') || icon.includes('<circle');
          const innerIconHtml = isSvgIcon 
            ? `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">${icon}</svg>` 
            : `<span style="font-size: ${size * 0.45}px; line-height: 1;">${icon}</span>`;

          list.push({
            ...currentMarker,
            html: `
              <div class="draggable-point-marker" data-marker-id="${currentMarker.id}" style="display: flex; flex-direction: column; align-items: center; cursor: ${isEditing ? 'grab' : 'pointer'}; user-select: none;">
                <div class="${isEditing ? 'selected-bounding-box' : ''}" style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size * 1.25}px;">
                  <!-- 地图定位针背景 SVG -->
                  <svg viewBox="0 0 24 30" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
                    <path d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 30 12 30 C12 30 24 21 24 12 C24 5.37 18.63 0 12 0 Z" fill="${color}" />
                  </svg>
                  <!-- 内部图标容器 -->
                  <div style="position: absolute; top: ${size * 0.15}px; width: ${size * 0.55}px; height: ${size * 0.55}px; display: flex; align-items: center; justify-content: center; color: white;">
                    ${innerIconHtml}
                  </div>
                  ${isEditing ? `<div class="resize-corner-handle" data-marker-id="${currentMarker.id}" style="bottom: 0; right: 0;"></div>` : ''}
                </div>
                ${showTitle ? `
                  <div class="marker-title" style="background: rgba(0, 0, 0, 0.85); color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 4px; white-space: nowrap; pointer-events: none; max-width: 120px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                    ${currentMarker.title || '未命名'}
                  </div>
                ` : ''}
              </div>
            `,
            anchor: 'bottom center'
          });
        }
      } else if (markerTool?.renderMarker) {
        const rendered = markerTool.renderMarker(currentMarker, { hexToRgba });
        list.push(...(Array.isArray(rendered) ? rendered : [rendered]));
      } else if (currentMarker.polygon || currentMarker.polyline) {
        const strokeColor = currentMarker.strokeColor || '#00ffcc';
        const strokeWidth = `${currentMarker.strokeWidth || 2.5}px`;
        const fillColor = currentMarker.fillColor || '#00ffcc';
        const fillOpacity = currentMarker.fillOpacity !== undefined ? currentMarker.fillOpacity : 0.25;
        const fillStyle = currentMarker.fillStyle || 'solid';



        const stroke = hexToRgba(strokeColor, 1);
        const fill = currentMarker.polyline ? 'none' : (fillStyle === 'none' ? 'none' : hexToRgba(fillColor, fillOpacity));

        let renderedMarker = { ...currentMarker };
        
        // 判断是否为箭头标注
        const isArrow = currentMarker.polyline && (currentMarker.id?.includes('arrow') || currentMarker.arrowStyle || currentMarker.arrowHeadSize !== undefined);
        
        if (isArrow && currentMarker.polyline.length >= 2) {
          const p1 = currentMarker.polyline[0];
          const p2 = currentMarker.polyline[1];
          const headSize = currentMarker.arrowHeadSize || 24;
          const shaftWidth = currentMarker.arrowShaftWidth || 8;
          const tailWidth = currentMarker.arrowTailWidth || 8;
          
          const arrowPoints = getHollowArrowPoints(p1, p2, headSize, shaftWidth, tailWidth);
          const arrowFill = fillColor === 'none' || fillStyle === 'none' ? 'none' : hexToRgba(fillColor, fillOpacity);
          
          const finalMarker = { ...renderedMarker };
          delete finalMarker.polyline;
          
          list.push({
            ...finalMarker,
            polygon: arrowPoints,
            svgStyle: {
              fill: arrowFill,
              stroke: stroke,
              strokeWidth: strokeWidth
            }
          });
        } else {
          if (currentMarker.polyline && currentMarker.id.includes('bezier')) {
            renderedMarker.polyline = getBezierPoints(currentMarker.polyline);
          }
          list.push({
            ...renderedMarker,
            svgStyle: {
              fill: fill,
              stroke: stroke,
              strokeWidth: strokeWidth
            }
          });
        }
      } else {
        list.push(currentMarker);
      }
    });
    
    const drawingTool = findToolById(drawingMode);
    if (drawingTool?.renderDraftMarkers && draftPoints.length > 0) {
      const renderedDraft = drawingTool.renderDraftMarkers(draftPoints, draftMarker, { hexToRgba });
      list.push(...(Array.isArray(renderedDraft) ? renderedDraft : [renderedDraft]));
    }

    // 注入绘制中（Polygon/Line/Bezier/Arrow）的临时锚点与连线
    if ((drawingMode === 'polygon' || drawingMode === 'line' || drawingMode === 'bezier' || drawingMode === 'arrow') && draftPoints.length > 0) {
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
        if (drawingMode === 'arrow') {
          const p1 = draftPoints[0];
          const p2 = draftPoints[1];
          const headSize = draftMarker?.arrowHeadSize || 24;
          const shaftWidth = draftMarker?.arrowShaftWidth || 8;
          const tailWidth = draftMarker?.arrowTailWidth || 8;
          const strokeColor = draftMarker?.strokeColor || '#00e5ff';
          const strokeWidth = `${draftMarker?.strokeWidth || 2}px`;
          const fillColor = draftMarker?.fillColor || '#00e5ff';
          const fillOpacity = draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.3;
          
          const arrowPoints = getHollowArrowPoints(p1, p2, headSize, shaftWidth, tailWidth);
          
          list.push({
            id: 'draft-polygon',
            polygon: arrowPoints,
            svgStyle: {
              fill: hexToRgba(fillColor, fillOpacity),
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              strokeLinejoin: 'round',
              pointerEvents: 'none'
            }
          });
        } else {
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
    }

    // Inject edit vertices for active polygon/polyline editing
    const editingTool = draftMarker ? findToolForMarker(draftMarker) : null;
    if (editingPolygonId && editingTool?.getEditHandles) {
      const handles = editingTool.getEditHandles(draftMarker);
      list.push(...(Array.isArray(handles) ? handles : [handles]));
    }

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
          const midpoint = getSegmentMidpoint(pt, nextPt);

          list.push({
            id: `virtual-handle-${index}`,
            position: midpoint,
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

  // 根据左侧工具栏的过滤器筛选要渲染到全景图中的标记
  const filteredMarkers = useMemo(() => {
    return displayMarkers.filter(m => {
      // 辅助元素（编辑控制点、虚拟中点、绘图中的临时标记等）始终展示
      if (
        m.id.startsWith('edit-handle') ||
        m.id.startsWith('virtual-handle') ||
        m.id.startsWith('draft-pt') ||
        m.id === 'draft-polygon' ||
        m.id === 'draft-polyline' ||
        m.id.startsWith('bezier-handle-line')
      ) {
        return true;
      }
      
      // 点位标记的细分过滤
      if (m.type === 'point') {
        const iconStr = m.icon || '';
        // 匹配点位默认配置与 presetIcons 中的 camera 监控路径 / 或字符
        const isCamera = iconStr.includes('M16 10.375') || iconStr === '💬'; // 💬 为图文/通道，监控亦代表通道
        // 匹配警示/告警图标
        const isWarning = iconStr.includes('M12 2L2 22H22') || iconStr === '⚠️';
        
        if (isWarning) {
          return activeFilters.alarm;
        }
        if (isCamera) {
          return activeFilters.channel;
        }
        return activeFilters.label;
      }
      
      // 多边形、折线等其它标注默认归在“标签”过滤器下
      return activeFilters.label;
    });
  }, [displayMarkers, activeFilters]);

  return (
    <div style={{
      padding: '12px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '100%',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#0d0f14',
      minHeight: '100vh',
      color: '#f7fafc'
    }}>
      


      {/* Main Workspace */}
      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
        
        {/* Left canvas wrapper */}
        <div style={{
          flex: 1,
          position: 'relative',
          borderRadius: '12px',
          border: '1px solid #1c1f2e',
          overflow: 'hidden',
          backgroundColor: '#161922',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          height: 'calc(100vh - 48px)'
        }}>
          
          {/* 左侧垂直悬浮功能过滤器工具栏独立组件 */}
          <FilterToolbar activeFilters={activeFilters} onChange={setActiveFilters} />

          {/* 1. 顶部标题栏 (严格按照效果图 Dock 在最左上角，并带斜切角与渐变底边) */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9982,
            height: '54px',
            width: '520px',
            background: 'linear-gradient(90deg, rgba(29, 32, 45, 0.95) 0%, rgba(29, 32, 45, 0.92) 50%, rgba(29, 32, 45, 0.65) 80%, rgba(29, 32, 45, 0) 100%)',
            clipPath: 'polygon(0 0, 520px 0, 460px 100%, 0 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '24px',
            boxSizing: 'border-box'
          }}>
            {/* Logo 盒子 */}
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#22252a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: '#555e70',
              border: '1px solid rgba(255,255,255,0.06)',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              logo
            </div>
            {/* 标题文本 */}
            <span style={{
              fontSize: '17px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '1.2px',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              userSelect: 'none'
            }}>
              黑龙江铁塔全域感知实景调度平台
            </span>
            {/* 底部渐变发光线 */}
            <div style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #00dfb6 0%, rgba(0, 223, 182, 0.5) 75%, transparent 100%)'
            }} />
          </div>

          {/* 2. 设备选择器与设备树控制面板 (下移至标题栏下方) */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '72px',
            zIndex: 9981,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '320px',
            pointerEvents: 'none'
          }}>
            {/* 2.1 当前选中设备栏 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(22, 25, 34, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1.2px solid rgba(0, 223, 182, 0.4)',
              borderRadius: '20px',
              padding: '6px 12px',
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00dfb6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{
                  fontSize: '11px',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  黑龙江铁塔/呼兰河水务/湖蓝大顶子林场
                </span>
              </div>
              <button
                onClick={() => setTreeVisible(prev => !prev)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0,
                  transform: treeVisible ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0
                }}
                title={treeVisible ? "收起设备树" : "展开设备树"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* 3. 设备树面板 */}
            {treeVisible && (
              <div style={{
                background: 'rgba(22, 25, 34, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 53, 79, 0.8)',
                borderRadius: '10px',
                padding: '12px',
                pointerEvents: 'auto',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {/* 搜索输入 */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2.5" style={{ position: 'absolute', left: '10px' }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="请输入搜索通道点位"
                    value={treeSearchQuery}
                    onChange={(e) => setTreeSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(46, 53, 79, 0.6)',
                      borderRadius: '6px',
                      padding: '6px 10px 6px 28px',
                      fontSize: '11px',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 树节点列表 */}
                <div style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}>
                  {/* 一级节点 A */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e0' }}>
                    <span style={{ fontSize: '8px', color: '#718096', marginRight: '8px' }}>▶</span>
                    <span>一级树导航</span>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.02)' }} />

                  {/* 一级节点 B (展开/折叠) */}
                  <div>
                    <div
                      onClick={() => setExpandedNodes(prev => ({ ...prev, '2': !prev['2'] }))}
                      style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e0' }}
                    >
                      <span style={{ fontSize: '8px', color: '#cbd5e0', marginRight: '8px', transform: expandedNodes['2'] ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                      <span>一级树导航</span>
                    </div>

                    {expandedNodes['2'] && (
                      <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column' }}>
                        {/* 二级节点 */}
                        <div>
                          <div
                            onClick={() => setExpandedNodes(prev => ({ ...prev, '2-1': !prev['2-1'] }))}
                            style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e0' }}
                          >
                            <span style={{ fontSize: '8px', color: '#cbd5e0', marginRight: '8px', transform: expandedNodes['2-1'] ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                            <span>二级树导航</span>
                          </div>

                          {expandedNodes['2-1'] && (
                            <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                              {/* 三级叶子节点列表 */}
                              {[1, 2, 3, 4, 5, 6].map((num) => {
                                const id = `2-1-${num}`;
                                const isSelected = selectedNodeId === id;
                                return (
                                  <div
                                    key={id}
                                    onClick={() => setSelectedNodeId(id)}
                                    style={{
                                      padding: '5px 12px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      color: isSelected ? '#00dfb6' : '#a0aec0',
                                      backgroundColor: isSelected ? 'rgba(0, 223, 182, 0.12)' : 'transparent',
                                      fontWeight: isSelected ? 'bold' : 'normal',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    三级树导航
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.02)' }} />

                  {/* 一级节点后续 */}
                  {[3, 4, 5, 6, 7, 8].map((num) => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e0' }}>
                      <span style={{ fontSize: '8px', color: '#718096', marginRight: '8px' }}>▶</span>
                      <span>一级树导航</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <PhotoSphereComponent
            ref={psvRef}
            panorama={panoramaUrl}
            markers={filteredMarkers}
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
                const selectedTool = findToolById(drawingMode);
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
            markerListVisible={markerListVisible}
            onToggleMarkerList={() => setMarkerListVisible(prev => !prev)}
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

          {/* Bottom Floating Navigation Toolbar */}
          <BottomToolbar />

          {/* Floating Marker List (visible when markerListVisible is true) */}
          {markerListVisible && (
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
              style={{
                position: 'absolute',
                left: treeVisible ? '360px' : '20px',
                top: '72px',
                zIndex: 9980,
                width: '300px',
                maxHeight: 'calc(100% - 140px)',
                backgroundColor: 'rgba(22, 25, 34, 0.92)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(46, 53, 79, 0.8)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                borderLeft: '1px solid rgba(46, 53, 79, 0.8)',
                paddingLeft: '16px',
                transition: 'left 0.3s ease, opacity 0.3s ease'
              }}
            />
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
