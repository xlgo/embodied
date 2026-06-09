import { useEffect, useRef, useState } from 'react';
import type { CameraConfig, GeoResult } from '../types.js';
import { createTiandituMap, getTiandituScriptUrl, loadTianditu, type TdtMapHandle } from '../map/tianditu.js';

interface Props {
  camera: CameraConfig | null;
  result: GeoResult | null;
}

export function MapPanel({ camera, result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<TdtMapHandle | null>(null);
  const [status, setStatus] = useState('正在加载天地图');
  const key = (import.meta.env.VITE_TDT_KEY || '').trim();
  const scriptUrl = (import.meta.env.VITE_TDT_SCRIPT_URL || '').trim();
  const resolvedScriptUrl = key ? getTiandituScriptUrl(key, scriptUrl) : '';

  useEffect(() => {
    if (!containerRef.current || !camera) return;
    let cancelled = false;
    setStatus('正在加载天地图');
    loadTianditu(key, scriptUrl)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current?.destroy();
        mapRef.current = createTiandituMap(containerRef.current, camera.lng, camera.lat);
        mapRef.current.setCamera(camera.lng, camera.lat, camera.name);
        mapRef.current.setResult(result);
        setStatus('');
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : '天地图加载失败'));
    return () => {
      cancelled = true;
    };
  }, [camera?.id, key, scriptUrl]);

  useEffect(() => {
    if (!camera || !mapRef.current) return;
    mapRef.current.setCamera(camera.lng, camera.lat, camera.name);
  }, [camera]);

  useEffect(() => {
    mapRef.current?.setResult(result);
  }, [result]);

  return (
    <section className="map-shell">
      <div ref={containerRef} className="map-container">
        {status && (
          <div className="map-fallback">
            <strong>{status}</strong>
            <span>{key ? `Key 已读取，脚本：${resolvedScriptUrl}` : '当前运行环境没有读取到 Key，.env 变更后需要重启 Vite。'}</span>
          </div>
        )}
      </div>
    </section>
  );
}
