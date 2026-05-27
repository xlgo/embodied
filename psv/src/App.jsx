import React, { useState, useMemo, useRef, useEffect } from 'react';
import PhotoSphereComponent from './PhotoSphereComponent';
import EditorToolbar from './components/EditorToolbar';
import MarkerList from './components/MarkerList';

const INITIAL_MARKERS = [
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
    strokeColor: '#ff0000',
    strokeWidth: 2,
    fillColor: '#ff0000',
    fillOpacity: 0.2,
    fillStyle: 'solid',
    tooltip: {
      content: '这是一个多边形标注 (Polygon Marker)',
      position: 'bottom right',
    },
  },
  {
    id: 'html-bubble',
    type: 'point',
    title: '自定义气泡框',
    color: '#ffc107',
    icon: '💬',
    position: { pitch: 0.1, yaw: 1.5 },
    tooltip: 'HTML 自定义气泡'
  },
  {
    id: 'text-marker',
    type: 'point',
    title: '文本标记',
    color: '#007bff',
    icon: '📍',
    position: { pitch: -0.2, yaw: 3.14 },
    tooltip: '简单的文本标记'
  }
];

function getDistanceToSegment(C, A, B) {
  // A, B, C are [yaw, pitch]
  let ay = A[0];
  let by = B[0];
  const cy = C[0];

  // Adjust ay and by to be within [-pi, pi] relative to cy (yaw wrapping)
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

  // Draft state representing the marker currently under active edit (before hitting Save)
  const [draftMarker, setDraftMarker] = useState(null);

  const panoramaUrl = '/sphere.jpg';

  const handleMarkerClick = (marker) => {
    // Check if we are currently editing a polygon and clicked its sub-handles
    if (editingPolygonId) {
      if (marker.id.startsWith('delete-handle-')) {
        const pointIndex = parseInt(marker.id.split('-').pop(), 10);
        setDraftMarker(prev => {
          if (prev && prev.polygon) {
            const newPoints = [...prev.polygon];
            newPoints.splice(pointIndex, 1);
            return { ...prev, polygon: newPoints };
          }
          return prev;
        });
        return;
      }
      if (marker.id.startsWith('edit-handle-')) {
        return; // Click on edit handle does nothing (dragging updates position)
      }
    }
    // Clicking standard markers in the viewer does NOT select it now (only select via sidebar list)
  };

  const handleViewerClick = (data) => {
    if (drawingMode === 'none') return;
    
    const { pitch, yaw } = data;
    
    if (drawingMode === 'point') {
      const newMarker = {
        id: `point-${Date.now()}`,
        type: 'point',
        title: '新建标记点',
        color: '#3b82f6',
        icon: '📍',
        position: { pitch, yaw },
        tooltip: '自定义绘制点'
      };
      setMarkers(prev => [...prev, newMarker]);
      setDrawingMode('none');
      setSelectedMarkerId(newMarker.id); // Automatically select newly created point
      setEditingPointId(newMarker.id); // Automatically start editing
      setDraftMarker(JSON.parse(JSON.stringify(newMarker))); // Initialize draft
    } else if (drawingMode === 'polygon') {
      setDraftPoints(prev => [...prev, [yaw, pitch]]);
    }
  };

  const finishPolygon = () => {
    setDraftPoints(currentPoints => {
      // Clean up consecutive duplicate points (close to 0.01 radians)
      const cleaned = [];
      for (let i = 0; i < currentPoints.length; i++) {
        if (i > 0) {
          const prev = currentPoints[i-1];
          const curr = currentPoints[i];
          const dist = Math.sqrt(Math.pow(prev[0] - curr[0], 2) + Math.pow(prev[1] - curr[1], 2));
          if (dist < 0.01) {
            continue; // skip duplicate point from double-click
          }
        }
        cleaned.push(currentPoints[i]);
      }

      if (cleaned.length >= 3) {
        const newPolygon = {
          id: `polygon-${Date.now()}`,
          polygon: cleaned,
          strokeColor: '#00ff00',
          strokeWidth: 2,
          fillColor: '#00ff00',
          fillOpacity: 0.3,
          fillStyle: 'solid',
          tooltip: '自定义绘制的多边形'
        };
        setMarkers(prev => [...prev, newPolygon]);
        setSelectedMarkerId(newPolygon.id); // Automatically select newly created polygon
        setEditingPolygonId(newPolygon.id); // Enter edit mode directly
        setDraftMarker(JSON.parse(JSON.stringify(newPolygon))); // Initialize draft
      } else {
        alert("多边形至少需要3个点！");
      }
      return [];
    });
    setDrawingMode('none');
  };

  const cancelDrawing = () => {
    setDraftPoints([]);
    setDrawingMode('none');
  };

  const gotoMarker = (id) => {
    if (psvRef.current) {
      psvRef.current.gotoMarker(id);
    }
  };

  const handleSelectMarker = (id) => {
    if (selectedMarkerId === id) return;

    // Check if there are unsaved changes
    if (draftMarker) {
      const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并切换吗？");
      if (!confirmDiscard) return;
    }

    setEditingPolygonId(null);
    setEditingPointId(null);
    setDraftMarker(null);
    setSelectedMarkerId(id);
  };

  const handleToggleEdit = (id) => {
    if (editingPolygonId !== id) {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并切换吗？");
        if (!confirmDiscard) return;
      }
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target))); // copy to draft
      setEditingPolygonId(id);
      setEditingPointId(null);
    } else {
      // Exit without saving
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要关闭编辑并放弃修改吗？");
        if (!confirmDiscard) return;
      }
      setEditingPolygonId(null);
      setDraftMarker(null);
    }
  };

  const handleToggleEditPoint = (id) => {
    if (editingPointId !== id) {
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并切换吗？");
        if (!confirmDiscard) return;
      }
      const target = markers.find(m => m.id === id);
      setDraftMarker(JSON.parse(JSON.stringify(target))); // copy to draft
      setEditingPointId(id);
      setEditingPolygonId(null);
    } else {
      // Exit without saving
      if (draftMarker) {
        const confirmDiscard = window.confirm("当前有未保存的修改，确定要关闭编辑并放弃修改吗？");
        if (!confirmDiscard) return;
      }
      setEditingPointId(null);
      setDraftMarker(null);
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
    setMarkers(prev => prev.map(m => {
      if (m.id === id) {
        return draftMarker;
      }
      return m;
    }));
    setEditingPointId(null);
    setEditingPolygonId(null);
    setDraftMarker(null);
  };

  const handleCancelEdit = () => {
    if (draftMarker) {
      const confirmDiscard = window.confirm("确定要取消并放弃此次修改吗？");
      if (!confirmDiscard) return;
    }
    setEditingPointId(null);
    setEditingPolygonId(null);
    setDraftMarker(null);
  };

  const handlePointDrag = (id, yaw, pitch) => {
    // During dragging, update the position in draftMarker for real-time preview
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

  const handleDeleteMarker = (id) => {
    if (editingPolygonId === id) setEditingPolygonId(null);
    if (editingPointId === id) setEditingPointId(null);
    if (selectedMarkerId === id) setSelectedMarkerId(null);
    if (draftMarker && draftMarker.id === id) setDraftMarker(null);
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  // Dragging handler for editing polygon points
  const handleEditPointDrag = (pointIndex, yaw, pitch) => {
    setDraftMarker(prev => {
      if (prev && prev.polygon) {
        const newPoints = [...prev.polygon];
        newPoints[pointIndex] = [yaw, pitch];
        return { ...prev, polygon: newPoints };
      }
      return prev;
    });
  };

  // Double click handler for viewer (finishing drawing or adding point in edit mode)
  const handleViewerDblClick = (data) => {
    if (drawingMode === 'polygon') {
      finishPolygon();
    } else if (editingPolygonId && draftMarker && draftMarker.polygon) {
      const { yaw, pitch } = data;
      const points = draftMarker.polygon;
      if (points.length < 2) return;

      let minDistance = Infinity;
      let insertIndex = -1;

      for (let i = 0; i < points.length; i++) {
        const A = points[i];
        const B = points[(i + 1) % points.length];
        const dist = getDistanceToSegment([yaw, pitch], A, B);
        if (dist < minDistance) {
          minDistance = dist;
          insertIndex = i + 1;
        }
      }

      if (minDistance < 0.08 && insertIndex !== -1) {
        setDraftMarker(prev => {
          if (prev && prev.polygon) {
            const newPoints = [...prev.polygon];
            newPoints.splice(insertIndex, 0, [yaw, pitch]);
            return {
              ...prev,
              polygon: newPoints
            };
          }
          return prev;
        });
      }
    }
  };

  const handleEditPointDelete = (pointIndex) => {
    setDraftMarker(prev => {
      if (prev && prev.polygon) {
        const newPoints = [...prev.polygon];
        newPoints.splice(pointIndex, 1);
        return { ...prev, polygon: newPoints };
      }
      return prev;
    });
  };

  // Combine saved markers with the dynamic draft shape and edit handles
  const displayMarkers = useMemo(() => {
    // 1. Transform raw point markers with dynamic HTML
    const list = markers.map(m => {
      const isEditingThis = draftMarker && draftMarker.id === m.id;
      // Real-time preview uses draftMarker values if this marker is being edited
      const currentMarker = isEditingThis ? draftMarker : m;

      const isSelected = selectedMarkerId === currentMarker.id;
      const isEditing = (editingPointId === currentMarker.id || editingPolygonId === currentMarker.id);

      if (currentMarker.type === 'point') {
        const isEditingPoint = editingPointId === currentMarker.id;
        return {
          ...currentMarker,
          html: `
            <div class="draggable-point-marker" data-marker-id="${currentMarker.id}" style="display: flex; flex-direction: column; align-items: center; cursor: ${isEditingPoint ? 'grab' : 'pointer'}; user-select: none;">
              <div class="marker-icon-wrapper" style="background: ${currentMarker.color || '#3b82f6'}; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid ${isEditingPoint ? '#ffc107' : (isSelected ? '#007bff' : 'white')}; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; transition: all 0.2s; transform: ${(isEditingPoint || isSelected) ? 'scale(1.15)' : 'none'};">
                ${currentMarker.icon || '📍'}
              </div>
              <div class="marker-title" style="background: ${isEditingPoint ? '#ffc107' : (isSelected ? '#007bff' : 'rgba(0,0,0,0.8)')}; color: ${isEditingPoint ? '#000' : '#fff'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 4px; white-space: nowrap; pointer-events: none; max-width: 120px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                ${currentMarker.title || '未命名'}
              </div>
            </div>
          `,
          anchor: 'bottom center'
        };
      } else if (currentMarker.polygon) {
        // Build style dynamically based on polygon properties
        const strokeColor = currentMarker.strokeColor || '#ff0000';
        const strokeWidth = `${currentMarker.strokeWidth || 2}px`;
        const fillColor = currentMarker.fillColor || '#ff0000';
        const fillOpacity = currentMarker.fillOpacity !== undefined ? currentMarker.fillOpacity : 0.2;
        const fillStyle = currentMarker.fillStyle || 'solid';

        const hexToRgba = (hex, alpha) => {
          let c = hex.substring(1);
          if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
          }
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const stroke = hexToRgba(strokeColor, 0.8);
        const fill = fillStyle === 'none' ? 'none' : hexToRgba(fillColor, fillOpacity);

        return {
          ...currentMarker,
          svgStyle: {
            fill: isEditing ? 'rgba(255, 193, 7, 0.3)' : (isSelected ? hexToRgba(fillColor, Math.min(1, fillOpacity + 0.15)) : fill),
            stroke: isEditing ? 'rgba(255, 193, 7, 1)' : (isSelected ? 'rgba(0, 123, 255, 1)' : stroke),
            strokeWidth: isEditing ? '4px' : (isSelected ? '4px' : strokeWidth)
          }
        };
      }
      return currentMarker;
    });
    
    // 2. Inject drafting markers
    if (drawingMode === 'polygon' && draftPoints.length > 0) {
      draftPoints.forEach((pt, index) => {
        list.push({
          id: `draft-pt-${index}`,
          position: { yaw: pt[0], pitch: pt[1] },
          circle: 5,
          svgStyle: { fill: 'blue', stroke: 'white', strokeWidth: '2px', pointerEvents: 'none' }
        });
      });
      
      if (draftPoints.length >= 3) {
        list.push({
          id: 'draft-polygon',
          polygon: draftPoints,
          svgStyle: {
            fill: 'rgba(0, 0, 255, 0.2)',
            stroke: 'blue',
            strokeWidth: '3px',
            strokeLinejoin: 'round',
            pointerEvents: 'none'
          }
        });
      } else if (draftPoints.length === 2) {
        list.push({
          id: 'draft-polyline',
          polyline: draftPoints,
          svgStyle: {
            stroke: 'blue',
            strokeWidth: '3px',
            strokeLinejoin: 'round',
            pointerEvents: 'none'
          }
        });
      }
    }

    // 3. Inject edit vertices for active polygon editing (using draftMarker coordinates)
    if (editingPolygonId && draftMarker && draftMarker.polygon) {
      draftMarker.polygon.forEach((pt, index) => {
        list.push({
          id: `edit-handle-${index}`,
          position: { yaw: pt[0], pitch: pt[1] },
          html: `
            <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <!-- Drag handle (red dot) -->
              <div class="edit-handle-marker" data-handle-index="${index}" style="background: red; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
              <!-- Delete button (white circle with red X) -->
              <div class="edit-delete-marker" data-handle-index="${index}" style="position: absolute; top: -2px; right: -2px; background: white; color: red; font-size: 10px; width: 14px; height: 14px; border-radius: 50%; border: 1px solid red; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; box-shadow: 0 0 3px rgba(0,0,0,0.5); pointer-events: auto;">×</div>
            </div>
          `,
          anchor: 'center',
          tooltip: '拖动修改位置，点击红叉删除'
        });
      });
    }

    return list;
  }, [markers, drawingMode, draftPoints, editingPolygonId, editingPointId, selectedMarkerId, draftMarker]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '20px' }}>
      
      {/* Left Panel: Viewer */}
      <div style={{ flex: 1, minWidth: '0' }}>
        <h1>Photo Sphere Viewer - 画板管理台</h1>
        <p>支持多边形与标记点编辑。更改配置可以实时预览，确认无误后点击保存生效。</p>
        
        <EditorToolbar
          drawingMode={drawingMode}
          onStartPolygon={() => {
            if (draftMarker) {
              const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并开始绘制吗？");
              if (!confirmDiscard) return;
            }
            setDrawingMode('polygon');
            setEditingPolygonId(null);
            setEditingPointId(null);
            setSelectedMarkerId(null);
            setDraftMarker(null);
          }}
          onStartPoint={() => {
            if (draftMarker) {
              const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并开始绘制吗？");
              if (!confirmDiscard) return;
            }
            setDrawingMode('point');
            setEditingPolygonId(null);
            setEditingPointId(null);
            setSelectedMarkerId(null);
            setDraftMarker(null);
          }}
          onRestoreDefault={() => {
            if (draftMarker) {
              const confirmDiscard = window.confirm("当前有未保存的修改，确定要放弃修改并恢复默认吗？");
              if (!confirmDiscard) return;
            }
            setMarkers(INITIAL_MARKERS);
            setEditingPolygonId(null);
            setEditingPointId(null);
            setSelectedMarkerId(null);
            setDraftMarker(null);
          }}
          onFinishPolygon={finishPolygon}
          onCancelDrawing={cancelDrawing}
        />
        
        <div style={{ border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <PhotoSphereComponent
            ref={psvRef}
            panorama={panoramaUrl}
            markers={displayMarkers}
            height="600px"
            onMarkerClick={handleMarkerClick}
            onViewerClick={handleViewerClick}
            onViewerDblClick={handleViewerDblClick}
            onEditPointDrag={handleEditPointDrag}
            onEditPointDelete={handleEditPointDelete}
            onPointDrag={handlePointDrag}
            drawingMode={drawingMode}
            editingPolygonId={editingPolygonId}
            editingPointId={editingPointId}
          />
        </div>
      </div>

      {/* Right Panel: List */}
      <MarkerList
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        editingPolygonId={editingPolygonId}
        editingPointId={editingPointId}
        draftMarker={draftMarker}
        onGotoMarker={gotoMarker}
        onSelectMarker={handleSelectMarker}
        onToggleEdit={handleToggleEdit}
        onToggleEditPoint={handleToggleEditPoint}
        onDeleteMarker={handleDeleteMarker}
        onUpdateDraft={handleUpdateDraft}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />

    </div>
  );
}

export default App;
