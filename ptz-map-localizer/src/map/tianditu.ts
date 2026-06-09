import type { GeoResult } from '../types.js';

declare global {
  interface Window {
    T?: any;
  }
}

let loadingPromise: Promise<void> | null = null;

export function getTiandituScriptUrl(key: string, scriptUrl?: string): string {
  const url = scriptUrl?.trim();
  if (url) return url.replace('{tk}', encodeURIComponent(key));
  return `https://api.tianditu.gov.cn/api?v=4.0&tk=${encodeURIComponent(key)}`;
}

export function loadTianditu(key: string, scriptUrl?: string): Promise<void> {
  if (window.T) return Promise.resolve();
  if (!key) return Promise.reject(new Error('未读取到 VITE_TDT_KEY，请在 ptz-map-localizer/.env 中配置并重启 dev server'));
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = getTiandituScriptUrl(key, scriptUrl);
    script.dataset.ptzTdt = 'true';
    script.onload = () => (window.T ? resolve() : reject(new Error('天地图 API 已加载但没有暴露 window.T')));
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error(`天地图 API 加载失败: ${script.src}`));
    };
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export interface TdtMapHandle {
  setCamera: (lng: number, lat: number, name: string) => void;
  setResult: (result: GeoResult | null) => void;
  destroy: () => void;
}

function setOverlayTitle(overlay: any, title: string): void {
  if (typeof overlay?.setTitle === 'function') {
    overlay.setTitle(title);
  }
}

export function createTiandituMap(container: HTMLElement, lng: number, lat: number): TdtMapHandle {
  const T = window.T;
  const map = new T.Map(container);
  map.centerAndZoom(new T.LngLat(lng, lat), 16);
  map.enableScrollWheelZoom();

  let cameraMarker: any = null;
  let resultMarker: any = null;
  let resultCircle: any = null;

  return {
    setCamera(nextLng, nextLat, name) {
      if (cameraMarker) map.removeOverLay(cameraMarker);
      cameraMarker = new T.Marker(new T.LngLat(nextLng, nextLat));
      setOverlayTitle(cameraMarker, name);
      map.addOverLay(cameraMarker);
      map.panTo(new T.LngLat(nextLng, nextLat));
    },
    setResult(result) {
      if (resultMarker) map.removeOverLay(resultMarker);
      if (resultCircle) map.removeOverLay(resultCircle);
      resultMarker = null;
      resultCircle = null;
      if (!result) return;
      const point = new T.LngLat(result.lng, result.lat);
      resultMarker = new T.Marker(point);
      setOverlayTitle(resultMarker, `定位点 ${result.distanceMeters.toFixed(1)}m`);
      resultCircle = new T.Circle(point, Number.isFinite(result.errorRadiusMeters) ? result.errorRadiusMeters : 100, {
        color: '#ff4d4f',
        weight: 2,
        opacity: 0.8,
        fillColor: '#ff7875',
        fillOpacity: 0.18
      });
      map.addOverLay(resultCircle);
      map.addOverLay(resultMarker);
      map.panTo(point);
    },
    destroy() {
      map.clearOverLays();
    }
  };
}
