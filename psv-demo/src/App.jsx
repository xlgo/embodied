import React, { useState, useMemo, useRef } from 'react';
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
    svgStyle: {
      fill: 'rgba(255, 0, 0, 0.2)',
      stroke: 'rgba(255, 0, 0, 0.8)',
      strokeWidth: '2px',
    },
    tooltip: {
      content: '这是一个多边形标注 (Polygon Marker)',
      position: 'bottom right',
    },
  },
  {
    id: 'html-bubble',
    position: { pitch: 0.1, yaw: 1.5 },
    html: '<div style="background: white; padding: 10px 15px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0,0,0,0.3); font-weight: bold; color: #333; display: inline-block;">💬 自定义气泡框</div>',
    anchor: 'bottom center',
    size: { width: 140, height: 40 },
    tooltip: 'HTML 自定义气泡'
  },
  {
    id: 'text-marker',
    position: { pitch: -0.2, yaw: 3.14 },
    html: '<div style="color: yellow; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 2px black;">📍 文本标记</div>',
    anchor: 'center',
    size: { width: 150, height: 35 },
    tooltip: {
      content: '简单的文本标记',
      position: 'top'
    }
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
  const [clickedMarker, setClickedMarker] = useState(null);
  const [markers, setMarkers] = useState(INITIAL_MARKERS);

  // Drawing & Editing state
  const [drawingMode, setDrawingMode] = useState('none'); // 'none', 'polygon', 'point'
  const [draftPoints, setDraftPoints] = useState([]); // array of [yaw, pitch]
  const [editingPolygonId, setEditingPolygonId] = useState(null);

  const panoramaUrl = '/sphere.jpg';

  const handleMarkerClick = (marker) => {
    // Check if we are currently editing a polygon
    if (editingPolygonId) {
      if (marker.id.startsWith('delete-handle-')) {
        const pointIndex = parseInt(marker.id.split('-').pop(), 10);
        setMarkers(prev => prev.map(m => {
          if (m.id === editingPolygonId && m.polygon) {
            const newPoints = [...m.polygon];
            newPoints.splice(pointIndex, 1);
            return { ...m, polygon: newPoints };
          }
          return m;
        }));
        return;
      }
      if (marker.id.startsWith('edit-handle-')) {
        return; // Click on edit handle does nothing (dragging updates position)
      }
    }

    if (drawingMode !== 'none') return; // Disable standard marker clicks while drawing
    setClickedMarker(marker.id);
  };

  const handleViewerClick = (data) => {
    if (drawingMode === 'none') return;
    
    const { pitch, yaw } = data;
    
    if (drawingMode === 'point') {
      const newMarker = {
        id: `point-${Date.now()}`,
        position: { pitch, yaw },
        html: '<div style="background: red; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px black;"></div>',
        anchor: 'center',
        tooltip: '自定义绘制点'
      };
      setMarkers(prev => [...prev, newMarker]);
      setDrawingMode('none');
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
          svgStyle: {
            fill: 'rgba(0, 255, 0, 0.3)',
            stroke: 'rgba(0, 255, 0, 0.8)',
            strokeWidth: '2px',
          },
          tooltip: '自定义绘制的多边形'
        };
        setMarkers(prev => [...prev, newPolygon]);
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

  const handleToggleEdit = (id) => {
    setEditingPolygonId(editingPolygonId === id ? null : id);
  };

  const handleDeleteMarker = (id) => {
    if (editingPolygonId === id) setEditingPolygonId(null);
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  // Dragging handler for editing polygon points
  const handleEditPointDrag = (pointIndex, yaw, pitch) => {
    if (editingPolygonId) {
      setMarkers(prev => prev.map(m => {
        if (m.id === editingPolygonId && m.polygon) {
          const newPoints = [...m.polygon];
          newPoints[pointIndex] = [yaw, pitch];
          return { ...m, polygon: newPoints };
        }
        return m;
      }));
    }
  };

  // Double click handler for viewer (finishing drawing or adding point in edit mode)
  const handleViewerDblClick = (data) => {
    if (drawingMode === 'polygon') {
      finishPolygon();
    } else if (editingPolygonId) {
      const { yaw, pitch } = data;
      
      const activePolygon = markers.find(m => m.id === editingPolygonId);
      if (!activePolygon || !activePolygon.polygon || activePolygon.polygon.length < 2) return;

      const points = activePolygon.polygon;
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
        setMarkers(prev => prev.map(m => {
          if (m.id === editingPolygonId && m.polygon) {
            const newPoints = [...m.polygon];
            newPoints.splice(insertIndex, 0, [yaw, pitch]);
            return {
              ...m,
              polygon: newPoints
            };
          }
          return m;
        }));
      }
    }
  };

  const handleEditPointDelete = (pointIndex) => {
    if (editingPolygonId) {
      setMarkers(prev => prev.map(m => {
        if (m.id === editingPolygonId && m.polygon) {
          const newPoints = [...m.polygon];
          newPoints.splice(pointIndex, 1);
          return { ...m, polygon: newPoints };
        }
        return m;
      }));
    }
  };

  // Combine saved markers with the dynamic draft shape and edit handles
  const displayMarkers = useMemo(() => {
    const list = [...markers];
    
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

    if (editingPolygonId) {
      const activePolygon = markers.find(m => m.id === editingPolygonId);
      if (activePolygon && activePolygon.polygon) {
        activePolygon.polygon.forEach((pt, index) => {
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
    }

    return list;
  }, [markers, drawingMode, draftPoints, editingPolygonId]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '20px' }}>
      
      {/* Left Panel: Viewer */}
      <div style={{ flex: 1, minWidth: '0' }}>
        <h1>Photo Sphere Viewer - 画板管理台</h1>
        <p>支持多边形编辑，可以拖动点、删除点（点击红叉）、以及在线条上双击添加点。</p>
        
        <EditorToolbar
          drawingMode={drawingMode}
          onStartPolygon={() => setDrawingMode('polygon')}
          onStartPoint={() => setDrawingMode('point')}
          onRestoreDefault={() => setMarkers(INITIAL_MARKERS)}
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
            drawingMode={drawingMode}
            editingPolygonId={editingPolygonId}
          />
        </div>
      </div>

      {/* Right Panel: List */}
      <MarkerList
        markers={markers}
        editingPolygonId={editingPolygonId}
        onGotoMarker={gotoMarker}
        onToggleEdit={handleToggleEdit}
        onDeleteMarker={handleDeleteMarker}
      />

    </div>
  );
}

export default App;
