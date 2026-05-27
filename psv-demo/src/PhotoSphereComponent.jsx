import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

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
  drawingMode = 'none',
  editingPolygonId = null
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const draggingRef = useRef(null); // { index: number }
  const isDraggingRef = useRef(false);

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
  const markersRef = useRef(markers);
  const editingPolygonIdRef = useRef(editingPolygonId);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    onViewerClickRef.current = onViewerClick;
    onViewerDblClickRef.current = onViewerDblClick;
    onEditPointDragRef.current = onEditPointDrag;
    onEditPointDeleteRef.current = onEditPointDelete;
    markersRef.current = markers;
    editingPolygonIdRef.current = editingPolygonId;
  }, [onMarkerClick, onViewerClick, onViewerDblClick, onEditPointDrag, onEditPointDelete, markers, editingPolygonId]);

  // Update cursor when drawing mode changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = drawingMode !== 'none' ? 'crosshair' : 'default';
    }
  }, [drawingMode]);

  // Handle vertex dragging
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e) => {
      const handle = e.target.closest('.edit-handle-marker');
      if (handle) {
        const index = parseInt(handle.getAttribute('data-handle-index'), 10);
        draggingRef.current = { index };
        isDraggingRef.current = true;
        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', false); // Disable panorama panning
          viewerRef.current.setOption('moveSpeed', 0); // Lock movement speed
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const deleteBtn = e.target.closest('.edit-delete-marker');
      if (deleteBtn) {
        const index = parseInt(deleteBtn.getAttribute('data-handle-index'), 10);
        if (onEditPointDeleteRef.current) {
          onEditPointDeleteRef.current(index);
        }
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handlePointerMove = (e) => {
      if (draggingRef.current !== null && viewerRef.current && markersPluginRef.current) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        try {
          const position = viewerRef.current.dataHelper.viewerCoordsToSphericalCoords({ x, y });
          if (position) {
            const { yaw, pitch } = position;
            const index = draggingRef.current.index;

            // 1. Manually update edit-handle marker position (defer render)
            markersPluginRef.current.updateMarker({
              id: `edit-handle-${index}`,
              position: { yaw, pitch }
            }, false);

            // 2. Manually update active polygon marker's coordinates (defer render)
            const currentEditingId = editingPolygonIdRef.current;
            if (currentEditingId) {
              const activePolygon = markersRef.current.find(m => m.id === currentEditingId);
              if (activePolygon && activePolygon.polygon) {
                const newPoints = [...activePolygon.polygon];
                newPoints[index] = [yaw, pitch];
                markersPluginRef.current.updateMarker({
                  id: currentEditingId,
                  polygon: newPoints
                }, false);
              }
            }

            // Force recalculate and redraw all markers in the scene efficiently
            markersPluginRef.current.renderMarkers();

            // 4. Notify parent state
            if (onEditPointDragRef.current) {
              onEditPointDragRef.current(index, yaw, pitch);
            }
          }
        } catch (err) {
          console.error("Error converting coordinate:", err);
        }
      }
    };

    const handlePointerUp = () => {
      if (draggingRef.current !== null) {
        draggingRef.current = null;
        isDraggingRef.current = false;
        if (viewerRef.current) {
          viewerRef.current.setOption('mousemove', true); // Re-enable panorama panning
          viewerRef.current.setOption('moveSpeed', 1); // Restore movement speed
        }
        // Force sync the finalized marker array to the plugin upon releasing the drag
        if (markersPluginRef.current && markersRef.current) {
          markersPluginRef.current.setMarkers(markersRef.current);
        }
      }
    };

    // Bind mousedown and touchstart as well in capture phase to block viewer listeners of any type
    container.addEventListener('pointerdown', handlePointerDown, true);
    container.addEventListener('mousedown', handlePointerDown, true);
    container.addEventListener('touchstart', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      container.removeEventListener('mousedown', handlePointerDown, true);
      container.removeEventListener('touchstart', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
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

  return <div ref={containerRef} style={{ width, height }} />;
});

export default PhotoSphereComponent;
