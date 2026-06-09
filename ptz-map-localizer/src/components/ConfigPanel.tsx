import type { CameraConfig, PtzState } from '../types.js';

interface Props {
  camera: CameraConfig | null;
  ptz: PtzState | null;
  onCameraChange: (camera: CameraConfig) => void;
  onPtzChange: (ptz: PtzState) => void;
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.1
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function ConfigPanel({ camera, ptz, onCameraChange, onPtzChange }: Props) {
  if (!camera || !ptz) {
    return (
      <section className="panel config-panel">
        <div className="panel-title">标定与姿态</div>
        <p className="muted">请选择真实设备后查看和校正相机参数。</p>
      </section>
    );
  }

  return (
    <section className="panel config-panel">
      <div className="panel-title">标定与姿态</div>
      <div className="field-grid">
        <NumberField label="经度" value={camera.lng} step={0.000001} onChange={(lng) => onCameraChange({ ...camera, lng })} />
        <NumberField label="纬度" value={camera.lat} step={0.000001} onChange={(lat) => onCameraChange({ ...camera, lat })} />
        <NumberField label="相机高程(m)" value={camera.altitudeMeters} onChange={(altitudeMeters) => onCameraChange({ ...camera, altitudeMeters })} />
        <NumberField label="地面高程(m)" value={camera.groundHeightMeters} onChange={(groundHeightMeters) => onCameraChange({ ...camera, groundHeightMeters })} />
        <NumberField label="偏航修正(°)" value={camera.mountYawOffsetDeg} onChange={(mountYawOffsetDeg) => onCameraChange({ ...camera, mountYawOffsetDeg })} />
        <NumberField label="俯仰修正(°)" value={camera.mountPitchOffsetDeg} onChange={(mountPitchOffsetDeg) => onCameraChange({ ...camera, mountPitchOffsetDeg })} />
        <NumberField label="Pan(°)" value={ptz.panDeg} onChange={(panDeg) => onPtzChange({ ...ptz, panDeg, timestamp: Date.now() })} />
        <NumberField label="Tilt(°)" value={ptz.tiltDeg} onChange={(tiltDeg) => onPtzChange({ ...ptz, tiltDeg, timestamp: Date.now() })} />
        <NumberField label="水平FOV(°)" value={ptz.fovHDeg} onChange={(fovHDeg) => onPtzChange({ ...ptz, fovHDeg, timestamp: Date.now() })} />
        <NumberField label="垂直FOV(°)" value={ptz.fovVDeg} onChange={(fovVDeg) => onPtzChange({ ...ptz, fovVDeg, timestamp: Date.now() })} />
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={Boolean(camera.calibrated)}
          onChange={(event) => onCameraChange({ ...camera, calibrated: event.target.checked })}
        />
        <span>已完成现场控制点标定</span>
      </label>
    </section>
  );
}
