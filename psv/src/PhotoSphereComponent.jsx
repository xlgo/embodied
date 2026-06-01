import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

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

const PhotoSphereComponent = forwardRef(({
  panorama,
  markers = [],
  width = '100%',
  height = '500px',
  onMarkerClick,
  onViewerClick,
  onViewerDblClick,
  onEditPointDrag,
  onEditPointDelete,
  onEditPointAdd,
  onPointDrag,
  onMarkerResize,
  onContextMenu,
  onDeleteMarker,
  selectedMarkerId = null,
  drawingMode = 'none',
  editingPolygonId = null,
  editingPointId = null
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const draggingRef = useRef(null); // { index: number }
  const draggingPointRef = useRef(null); // { id: string, offset: {yaw, pitch} }
  const draggingResizeRef = useRef(null); // { id: string, initialSize: number, startX: number, startY: number }
  const isDraggingRef = useRef(false);
  const [followCursor, setFollowCursor] = useState({ x: 0, y: 0, visible: false });

  useImperativeHandle(ref, () => ({
    gotoMarker: (id) => {
      if (markersPluginRef.current) {
        markersPluginRef.current.gotoMarker(id, 1000);
      }
    }
  }));

  // Store the latest callbacks/props in refs to avoid stale closures
  const onMarkerClickRef = useRef(onMarkerClick);
  const onViewerClickRef = useRef(onViewerClick);
  const onViewerDblClickRef = useRef(onViewerDblClick);
  const onEditPointDragRef = useRef(onEditPointDrag);
  const onEditPointDeleteRef = useRef(onEditPointDelete);
  const onEditPointAddRef = useRef(onEditPointAdd);
  const onPointDragRef = useRef(onPointDrag);
  const onMarkerResizeRef = useRef(onMarkerResize);
  const onContextMenuRef = useRef(onContextMenu);
  const onDeleteMarkerRef = useRef(onDeleteMarker);
  const markersRef = useRef(markers);
  const editingPolygonIdRef = useRef(editingPolygonId);
  const editingPointIdRef = useRef(editingPointId);
  const selectedMarkerIdRef = useRef(selectedMarkerId);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    onViewerClickRef.current = onViewerClick;
    onViewerDblClickRef.current = onViewerDblClick;
    onEditPointDragRef.current = onEditPointDrag;
    onEditPointDeleteRef.current = onEditPointDelete;
    onEditPointAddRef.current = onEditPointAdd;
    onPointDragRef.current = onPointDrag;
    onMarkerResizeRef.current = onMarkerResize;
    onContextMenuRef.current = onContextMenu;
    onDeleteMarkerRef.current = onDeleteMarker;
    markersRef.current = markers;
    editingPolygonIdRef.current = editingPolygonId;
    editingPointIdRef.current = editingPointId;
    selectedMarkerIdRef.current = selectedMarkerId;
  }, [onMarkerClick, onViewerClick, onViewerDblClick, onEditPointDrag, onEditPointDelete, onEditPointAdd, onPointDrag, onMarkerResize, onContextMenu, onDeleteMarker, markers, editingPolygonId, editingPointId, selectedMarkerId]);

  // Update cursor when drawing mode changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = drawingMode !== 'none' ? 'none' : 'default';
    }
  }, [drawingMode]);

  // Handle vertex, point and resize dragging
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e) => {
      // 1. Check for resize corner handle
      const resizeHandle = e.target.closest('.resize-corner-handle');
      if (resizeHandle) {
        const markerId = resizeHandle.getAttribute('data-marker-id');
        const markerObj = markersRef.current.find(m => m.id === markerId);
        const initialSize = markerObj?.iconSize || 24;

        draggingResizeRef.current = {
          id: markerId,
          initialSize,
          startX: e.clientX,
          startY: e.clientY
        };
        isDraggingRef.current = true;

        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', false); // Disable panorama panning
          viewerRef.current.setOption('moveSpeed', 0); // Lock movement speed
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 2. Check for polygon edit handle
      const handle = e.target.closest('.edit-handle-marker');
      if (handle) {
        const index = parseInt(handle.getAttribute('data-handle-index'), 10);
        draggingRef.current = { index };
        isDraggingRef.current = true;
        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', false);
          viewerRef.current.setOption('moveSpeed', 0);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 3. Check for polygon edit vertex delete
      const deleteBtn = e.target.closest('.edit-delete-marker');
      if (deleteBtn) {
        const index = parseInt(deleteBtn.getAttribute('data-handle-index'), 10);
        if (onEditPointDeleteRef.current) {
          onEditPointDeleteRef.current(index);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 3.5 Check for polygon virtual edit handle (middle of two vertices)
      const virtualHandle = e.target.closest('.virtual-handle-marker');
      if (virtualHandle) {
        const index = parseInt(virtualHandle.getAttribute('data-handle-index'), 10);
        const currentEditingId = editingPolygonIdRef.current;
        if (currentEditingId && markersPluginRef.current) {
          const activePolygon = markersRef.current.find(m => m.id === currentEditingId);
          const shapeKey = activePolygon?.polygon ? 'polygon' : activePolygon?.polyline ? 'polyline' : null;
          if (activePolygon && shapeKey) {
            const points = activePolygon[shapeKey];
            const isPolygonType = shapeKey === 'polygon';
            const n = points.length;
            const pt = points[index];
            const nextPt = isPolygonType ? points[(index + 1) % n] : points[index + 1];

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

            // Insert new point coordinates
            const newPoints = [...points];
            newPoints.splice(index + 1, 0, [midYaw, midPitch]);

            // Mutate markersRef internally to prevent lagging in pointermove
            activePolygon[shapeKey] = newPoints;

            // Fast local update
            markersPluginRef.current.updateMarker({
              id: currentEditingId,
              [shapeKey]: newPoints
            }, false);

            // Remove the clicked virtual handle
            try {
              markersPluginRef.current.removeMarker(`virtual-handle-${index}`);
            } catch (err) { }

            // Append a temporary real handle
            try {
              markersPluginRef.current.addMarker({
                id: `edit-handle-${index + 1}`,
                position: { yaw: midYaw, pitch: midPitch },
                html: `
                  <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                    <div class="edit-handle-marker" data-handle-index="${index + 1}" style="background: #ff3b30; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
                    <div class="edit-delete-marker" data-handle-index="${index + 1}" style="position: absolute; top: -2px; right: -2px; background: white; color: #ff3b30; font-size: 10px; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #ff3b30; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; box-shadow: 0 0 3px rgba(0,0,0,0.5); pointer-events: auto;">×</div>
                  </div>
                `,
                anchor: 'center'
              }, false);
            } catch (err) { }

            markersPluginRef.current.renderMarkers();

            // Trigger react state update
            if (onEditPointAddRef.current) {
              onEditPointAddRef.current(index + 1, midYaw, midPitch);
            }

            // Immediately set index + 1 as active dragging index
            draggingRef.current = { index: index + 1 };
            isDraggingRef.current = true;

            if (viewerRef.current) {
              viewerRef.current.setOption('mousemove', false);
              viewerRef.current.setOption('moveSpeed', 0);
            }
          }
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 4. Check for draggable point marker
      const pointMarker = e.target.closest('.draggable-point-marker');
      if (pointMarker && drawingMode === 'none' && !editingPolygonIdRef.current) {
        const markerId = pointMarker.getAttribute('data-marker-id');

        // ONLY allow dragging if this point is currently being edited
        if (markerId !== editingPointIdRef.current) {
          return;
        }

        let offset = { yaw: 0, pitch: 0 };
        const markerObj = markersRef.current.find(m => m.id === markerId);
        if (markerObj && markerObj.position && viewerRef.current) {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          try {
            const clickPos = viewerRef.current.dataHelper.viewerCoordsToSphericalCoords({ x, y });
            if (clickPos) {
              offset.yaw = markerObj.position.yaw - clickPos.yaw;
              offset.pitch = markerObj.position.pitch - clickPos.pitch;
            }
          } catch (err) {
            console.error("Error calculating click offset:", err);
          }
        }
        draggingPointRef.current = { id: markerId, offset };
        isDraggingRef.current = true;
        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', false);
          viewerRef.current.setOption('moveSpeed', 0);
        }
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handlePointerMove = (e) => {
      if (!viewerRef.current || !markersPluginRef.current) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Case A: Dragging a marker resize corner
      if (draggingResizeRef.current !== null) {
        const { id, initialSize, startX, startY } = draggingResizeRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const delta = Math.round((deltaX + deltaY) / 2);
        const newSize = Math.max(16, Math.min(64, initialSize + delta));

        if (onMarkerResizeRef.current) {
          onMarkerResizeRef.current(id, newSize);
        }
        return;
      }

      // Case B: Dragging a polygon edit handle
      if (draggingRef.current !== null) {
        try {
          const position = viewerRef.current.dataHelper.viewerCoordsToSphericalCoords({ x, y });
          if (position) {
            const { yaw, pitch } = position;
            const index = draggingRef.current.index;

            markersPluginRef.current.updateMarker({
              id: `edit-handle-${index}`,
              position: { yaw, pitch }
            }, false);

            const currentEditingId = editingPolygonIdRef.current;
            if (currentEditingId) {
              const activePolygon = markersRef.current.find(m => m.id === currentEditingId);
              const shapeKey = activePolygon?.polygon ? 'polygon' : activePolygon?.polyline ? 'polyline' : null;
              if (activePolygon && shapeKey) {
                const newPoints = [...activePolygon[shapeKey]];
                newPoints[index] = [yaw, pitch];
                
                const isBezier = currentEditingId.includes('bezier');
                const isArrow = currentEditingId.includes('arrow');

                 if (isArrow && newPoints.length >= 2) {
                  const headSize = activePolygon.arrowHeadSize || 24;
                  const shaftWidth = activePolygon.arrowShaftWidth || 8;
                  const tailWidth = activePolygon.arrowTailWidth || 8;
                  const strokeColor = activePolygon.strokeColor || '#00e5ff';
                  const strokeWidth = `${activePolygon.strokeWidth || 2}px`;
                  const fillColor = activePolygon.fillColor || '#00e5ff';
                  const fillOpacity = activePolygon.fillOpacity !== undefined ? activePolygon.fillOpacity : 0.3;

                  const arrowPoints = getHollowArrowPoints(newPoints[0], newPoints[1], headSize, shaftWidth, tailWidth);
                  
                  const hexToRgbaLocal = (hex, alpha) => {
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

                  markersPluginRef.current.updateMarker({
                    id: currentEditingId,
                    polygon: arrowPoints,
                    svgStyle: {
                      fill: activePolygon.fillStyle === 'none' ? 'none' : hexToRgbaLocal(fillColor, fillOpacity),
                      stroke: hexToRgbaLocal(strokeColor, 1),
                      strokeWidth: strokeWidth
                    }
                  }, false);
                } else {
                  const updatePoints = isBezier ? getBezierPoints(newPoints) : newPoints;
                  markersPluginRef.current.updateMarker({
                    id: currentEditingId,
                    [shapeKey]: updatePoints
                  }, false);
                }
              }
            }

            markersPluginRef.current.renderMarkers();

            if (onEditPointDragRef.current) {
              onEditPointDragRef.current(index, yaw, pitch);
            }
          }
        } catch (err) {
          console.error("Error converting coordinate:", err);
        }
      }

      // Case C: Dragging a point marker
      if (draggingPointRef.current !== null) {
        try {
          const position = viewerRef.current.dataHelper.viewerCoordsToSphericalCoords({ x, y });
          if (position) {
            let { yaw, pitch } = position;
            const { id, offset } = draggingPointRef.current;

            yaw += offset.yaw;
            pitch += offset.pitch;

            markersPluginRef.current.updateMarker({
              id: id,
              position: { yaw, pitch }
            }, false);

            markersPluginRef.current.renderMarkers();

            if (onPointDragRef.current) {
              onPointDragRef.current(id, yaw, pitch);
            }
          }
        } catch (err) {
          console.error("Error converting coordinate:", err);
        }
      }
    };

    const handlePointerUp = () => {
      if (draggingRef.current !== null || draggingPointRef.current !== null || draggingResizeRef.current !== null) {
        draggingRef.current = null;
        draggingPointRef.current = null;
        draggingResizeRef.current = null;
        isDraggingRef.current = false;
        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', true);
          viewerRef.current.setOption('moveSpeed', 1);
        }
        if (markersPluginRef.current && markersRef.current) {
          markersPluginRef.current.setMarkers(markersRef.current);
        }
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      if (onContextMenuRef.current) {
        onContextMenuRef.current({ x: e.clientX, y: e.clientY });
      }
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    container.addEventListener('mousedown', handlePointerDown, true);
    container.addEventListener('touchstart', handlePointerDown, true);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      container.removeEventListener('mousedown', handlePointerDown, true);
      container.removeEventListener('touchstart', handlePointerDown, true);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Keyboard Delete key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete') {
        // Do not delete if typing in inputs
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        if (selectedMarkerIdRef.current && onDeleteMarkerRef.current) {
          onDeleteMarkerRef.current(selectedMarkerIdRef.current);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = new Viewer({
      container: containerRef.current,
      panorama,
      navbar: [
        'zoom',
        'move',
        'caption',
        'fullscreen',
      ],
      plugins: [
        [MarkersPlugin, {
          markers: markers,
          clickEventOnMarker: true
        }]
      ]
    });

    markersPluginRef.current = viewerRef.current.getPlugin(MarkersPlugin);

    markersPluginRef.current.addEventListener('select-marker', ({ marker }) => {
      if (onMarkerClickRef.current) onMarkerClickRef.current(marker);
    });

    viewerRef.current.addEventListener('click', ({ data }) => {
      if (onViewerClickRef.current) onViewerClickRef.current(data);
    });

    viewerRef.current.addEventListener('dblclick', ({ data }) => {
      if (onViewerDblClickRef.current) onViewerDblClickRef.current(data);
    });

    return () => {
      viewerRef.current.destroy();
    };
  }, [panorama]);

  // Update markers when the markers prop changes, but ONLY if we are not actively dragging!
  useEffect(() => {
    if (markersPluginRef.current && !isDraggingRef.current) {
      markersPluginRef.current.setMarkers(markers);
    }
  }, [markers]);

  // Handle follow cursor position updating
  const handlePointerMoveFollow = (e) => {
    if (drawingMode !== 'point' && drawingMode !== 'image_text') return;
    const rect = containerRef.current.getBoundingClientRect();
    setFollowCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
  };

  const handlePointerEnterFollow = () => {
    if (drawingMode === 'point' || drawingMode === 'image_text') {
      setFollowCursor(prev => ({ ...prev, visible: true }));
    }
  };

  const handlePointerLeaveFollow = () => {
    setFollowCursor(prev => ({ ...prev, visible: false }));
  };

  return (
    <div
      style={{ position: 'relative', width, height }}
      onPointerMove={handlePointerMoveFollow}
      onPointerEnter={handlePointerEnterFollow}
      onPointerLeave={handlePointerLeaveFollow}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Follow cursor element representing active pin */}
      {(drawingMode === 'point' || drawingMode === 'image_text') && followCursor.visible && (
        <div
          className="follow-mouse-cursor"
          style={{
            left: `${followCursor.x}px`,
            top: `${followCursor.y}px`
          }}
        >
          <div style={{
            background: drawingMode === 'image_text' ? '#00dfb6' : '#ff3b30',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'white'
          }}>
            {drawingMode === 'image_text' ? '💬' : '📍'}
          </div>
        </div>
      )}
    </div>
  );
});

export default PhotoSphereComponent;
