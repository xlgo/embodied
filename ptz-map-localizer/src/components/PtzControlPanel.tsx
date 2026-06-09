import { useRef, useState } from 'react';
import { requestPtzControlToken, sendPtzCommand } from '../api/platformAdapter.js';
import type { CameraConfig, PtzState } from '../types.js';

const directionButtons = [
  { code: 5, label: '↖' },
  { code: 1, label: '↑' },
  { code: 6, label: '↗' },
  { code: 3, label: '←' },
  { code: 0, label: '•', disabled: true },
  { code: 4, label: '→' },
  { code: 7, label: '↙' },
  { code: 2, label: '↓' },
  { code: 8, label: '↘' }
];

interface Props {
  camera: CameraConfig | null;
  ptz: PtzState | null;
  disabled?: boolean;
  onRefreshPtz: () => Promise<void>;
}

export function PtzControlPanel({ camera, ptz, disabled = false, onRefreshPtz }: Props) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const activeCodeRef = useRef<number | null>(null);
  const tokenRef = useRef<string>('');

  const ensureToken = async () => {
    if (!camera) throw new Error('请选择设备');
    if (disabled) throw new Error('该设备不支持云台控制');
    if (!tokenRef.current) tokenRef.current = await requestPtzControlToken(camera.id);
    return tokenRef.current;
  };

  const send = async (code: number, content: 0 | 1) => {
    if (!camera || disabled || code === 0) return;
    setBusy(true);
    try {
      const token = await ensureToken();
      await sendPtzCommand(camera.id, code, content, step, token);
      setStatus(content === 1 ? '云台指令已下发' : '云台已停止');
      if (content === 0) await onRefreshPtz();
    } catch (error) {
      tokenRef.current = '';
      setStatus(error instanceof Error ? error.message : '云台控制失败');
    } finally {
      setBusy(false);
    }
  };

  const start = (code: number) => {
    activeCodeRef.current = code;
    send(code, 1);
  };

  const stop = (code: number) => {
    if (activeCodeRef.current !== code) return;
    activeCodeRef.current = null;
    send(code, 0);
  };

  return (
    <section className="panel ptz-panel">
      <div className="panel-title">云台控制</div>
      <div className="ptz-grid">
        {directionButtons.map((item) => (
          <button
            key={item.code || 'center'}
            className="ptz-button"
            type="button"
            disabled={!camera || disabled || busy || item.disabled}
            onPointerDown={() => start(item.code)}
            onPointerUp={() => stop(item.code)}
            onPointerLeave={() => stop(item.code)}
            title={`方向码 ${item.code}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ptz-zoom-row">
        <button type="button" disabled={!camera || disabled || busy} onPointerDown={() => start(11)} onPointerUp={() => stop(11)} onPointerLeave={() => stop(11)}>
          变倍+
        </button>
        <button type="button" disabled={!camera || disabled || busy} onPointerDown={() => start(12)} onPointerUp={() => stop(12)} onPointerLeave={() => stop(12)}>
          变倍-
        </button>
      </div>
      <div className="ptz-step-row">
        <button type="button" disabled={step <= 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>-</button>
        <span>步长 {step}</span>
        <button type="button" disabled={step >= 8} onClick={() => setStep((value) => Math.min(8, value + 1))}>+</button>
      </div>
      <div className="status-row">
        <span>Pan {ptz ? ptz.panDeg.toFixed(2) : '-'}</span>
        <span>Tilt {ptz ? ptz.tiltDeg.toFixed(2) : '-'}</span>
        <span>Zoom {ptz ? ptz.zoom.toFixed(2) : '-'}</span>
      </div>
      {disabled && <div className="message">全域实景节点展示图片，不支持云台控制</div>}
      {status && <div className="message">{status}</div>}
    </section>
  );
}
