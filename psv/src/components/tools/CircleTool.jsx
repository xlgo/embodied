import React from 'react';

function getPointDistancePx(a, b) {
  if (a?.length >= 4 && b?.length >= 4) {
    return Math.sqrt((a[2] - b[2]) ** 2 + (a[3] - b[3]) ** 2);
  }
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) * 900;
}

function getCircleEdgePosition(marker) {
  if (marker?.circleEdge) return marker.circleEdge;
  const radiusYaw = Math.max(0.01, (marker?.circle || 60) * 0.001);
  const yaw = ((marker?.position?.yaw || 0) + radiusYaw) % (2 * Math.PI);
  return { yaw, pitch: marker?.position?.pitch || 0 };
}

function getCircleStyle(marker, hexToRgba) {
  const strokeColor = marker.strokeColor || '#8b5cf6';
  const fillColor = marker.fillColor || '#8b5cf6';
  const fillOpacity = marker.fillOpacity !== undefined ? marker.fillOpacity : 0.22;
  const fillStyle = marker.fillStyle || 'solid';

  return {
    fill: fillStyle === 'none' ? 'none' : hexToRgba(fillColor, fillOpacity),
    stroke: hexToRgba(strokeColor, 1),
    strokeWidth: `${marker.strokeWidth || 2.5}px`
  };
}

const DEFAULT_CONFIG = {
  circle: 60,
  strokeColor: '#8b5cf6',
  strokeWidth: 2.5,
  fillColor: '#8b5cf6',
  fillOpacity: 0.22,
  fillStyle: 'solid',
  tooltip: '新建圆形区域',
  category: 'none',
  layerFilter: 'always',
  linkAction: 'none',
  windowWidth: 800,
  windowHeight: 600,
  images: []
};

export default {
  id: 'circle',
  name: '圆形标绘',
  type: 'circle',
  match: (m) => !!m.circle && !!m.position,
  allowVertexAdd: false,
  allowVertexDelete: false,
  minPointsMessage: '圆形标绘至少需要圆心和半径两点',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12h8" />
    </svg>
  ),
  defaultConfig: DEFAULT_CONFIG,
  getDraftPoint: (data) => [data.yaw, data.pitch, data.viewerX, data.viewerY],
  shouldAutoFinish: (points) => points.length >= 2,
  createMarker: ({ id, points, draftMarker, defaultConfig }) => {
    if (!points || points.length < 2) return null;
    const center = points[0];
    const edge = points[1];

    return {
      ...defaultConfig,
      ...(draftMarker || {}),
      id,
      position: { yaw: center[0], pitch: center[1] },
      circle: Math.max(8, Math.round(getPointDistancePx(center, edge))),
      circleEdge: { yaw: edge[0], pitch: edge[1] }
    };
  },
  cleanMarker: (marker) => {
    const cleaned = { ...marker };
    delete cleaned.type;
    delete cleaned.html;
    delete cleaned.icon;
    delete cleaned.circleEdge;
    return cleaned;
  },
  renderMarker: (marker, { hexToRgba }) => ({
    ...marker,
    svgStyle: getCircleStyle(marker, hexToRgba)
  }),
  renderDraftMarkers: (draftPoints) => {
    const center = draftPoints[0];
    return {
      id: 'draft-pt-0',
      position: { yaw: center[0], pitch: center[1] },
      circle: 5,
      svgStyle: { fill: '#8b5cf6', stroke: 'white', strokeWidth: '2px', pointerEvents: 'none' }
    };
  },
  getEditHandles: (marker) => {
    const edge = getCircleEdgePosition(marker);
    return [
      { index: 0, position: marker.position, color: '#ff3b30', label: '移动圆心' },
      { index: 1, position: edge, color: '#8b5cf6', label: '拖动调整半径' }
    ].map(({ index, position, color, label }) => ({
      id: `edit-handle-${index}`,
      position,
      html: `
        <div class="edit-handle-wrapper" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div class="edit-handle-marker" data-handle-index="${index}" style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; cursor: move; box-shadow: 0 0 5px black; pointer-events: auto;"></div>
        </div>
      `,
      anchor: 'center',
      tooltip: label
    }));
  },
  updateDraftOnEditDrag: (marker, pointIndex, yaw, pitch, meta = {}) => {
    if (pointIndex === 0) {
      const edge = getCircleEdgePosition(marker);
      const deltaYaw = yaw - marker.position.yaw;
      const deltaPitch = pitch - marker.position.pitch;
      return {
        ...marker,
        position: { yaw, pitch },
        circleEdge: { yaw: edge.yaw + deltaYaw, pitch: edge.pitch + deltaPitch }
      };
    }

    return {
      ...marker,
      circle: meta.circle !== undefined ? meta.circle : marker.circle,
      circleEdge: { yaw, pitch }
    };
  },
  handleViewerEditDrag: ({ marker, index, yaw, pitch, viewerPoint, viewer, markersPlugin }) => {
    if (index === 0) {
      const edge = getCircleEdgePosition(marker);
      const deltaYaw = yaw - marker.position.yaw;
      const deltaPitch = pitch - marker.position.pitch;
      const circleEdge = { yaw: edge.yaw + deltaYaw, pitch: edge.pitch + deltaPitch };

      marker.position = { yaw, pitch };
      marker.circleEdge = circleEdge;
      markersPlugin.updateMarker({ id: marker.id, position: { yaw, pitch } }, false);
      markersPlugin.updateMarker({ id: 'edit-handle-1', position: circleEdge }, false);
      return { handled: true, meta: {} };
    }

    const center = viewer.dataHelper.sphericalCoordsToViewerCoords(marker.position);
    const circle = Math.max(8, Math.round(Math.sqrt((center.x - viewerPoint.x) ** 2 + (center.y - viewerPoint.y) ** 2)));

    marker.circle = circle;
    marker.circleEdge = { yaw, pitch };
    markersPlugin.updateMarker({ id: marker.id, circle }, false);
    return { handled: true, meta: { circle } };
  },
  resetDraft: (marker) => ({
    ...DEFAULT_CONFIG,
    id: marker.id,
    circle: marker.circle,
    circleEdge: marker.circleEdge,
    position: marker.position
  }),
  StylePanel: function StylePanel({ draftMarker, onUpdateDraft, StepInput, ColorInput }) {
    return (
      <>
        <ColorInput
          label="边框颜色"
          value={draftMarker?.strokeColor || '#8b5cf6'}
          onChange={(val) => onUpdateDraft({ strokeColor: val })}
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>边框粗细</span>
          <StepInput
            value={draftMarker?.strokeWidth || 2}
            onChange={(val) => onUpdateDraft({ strokeWidth: val })}
            min={1}
            max={10}
            step={1}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>半径</span>
          <StepInput
            value={Math.round(draftMarker?.circle || 60)}
            onChange={(val) => onUpdateDraft({ circle: val })}
            min={8}
            max={600}
            step={5}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>填充方式</span>
          <select
            className="custom-select"
            value={draftMarker?.fillStyle || 'solid'}
            onChange={(e) => onUpdateDraft({ fillStyle: e.target.value })}
            style={{ flex: 1 }}
          >
            <option value="solid">实色填充</option>
            <option value="none">无填充</option>
          </select>
        </div>

        {draftMarker?.fillStyle !== 'none' && (
          <>
            <ColorInput
              label="填充颜色"
              value={draftMarker?.fillColor || '#8b5cf6'}
              onChange={(val) => onUpdateDraft({ fillColor: val })}
            />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0', width: '90px', flexShrink: 0, textAlign: 'left' }}>填充透明度</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.22}
                  onChange={(e) => onUpdateDraft({ fillOpacity: parseFloat(e.target.value) })}
                  style={{ flex: 1, cursor: 'pointer', height: '6px', background: '#2e354f', outline: 'none', borderRadius: '3px' }}
                />
                <span style={{ fontSize: '12px', color: '#a0aec0', fontFamily: 'monospace', width: '36px', textAlign: 'right' }}>
                  {Math.round((draftMarker?.fillOpacity !== undefined ? draftMarker.fillOpacity : 0.22) * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
};
