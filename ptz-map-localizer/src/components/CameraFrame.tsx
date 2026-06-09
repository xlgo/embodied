import { useEffect, useRef, useState } from 'react';
import type { ClickPoint, FrameResult, GeoResult } from '../types.js';

declare global {
  interface Window {
    mpegts?: MpegtsApi;
  }
}

type MpegtsApi = {
  createPlayer: (config: Record<string, unknown>, options?: Record<string, unknown>) => {
    attachMediaElement: (media: HTMLElement | string) => void;
    load: () => void;
    unload?: () => void;
    detachMediaElement?: () => void;
    destroy?: () => void;
    volume?: number;
  };
};

interface Props {
  frame: FrameResult | null;
  result: GeoResult | null;
  onClickPoint: (point: ClickPoint) => void;
}

const platformBaseUrl = (import.meta.env.VITE_PLATFORM_BASE_URL || 'http://192.168.11.51:9884').replace(/\/$/, '');
const defaultMpegtsScriptUrl = import.meta.env.DEV ? '/pano/sdk/mpegts.js' : `${platformBaseUrl}/pano/sdk/mpegts.js`;
const mpegtsScriptUrl = (import.meta.env.VITE_MPEGTS_SCRIPT_URL || defaultMpegtsScriptUrl).trim();
let mpegtsLoadingPromise: Promise<void> | null = null;

function getMpegtsApi(): MpegtsApi | undefined {
  const fromWindow = window.mpegts;
  if (fromWindow?.createPlayer) return fromWindow;
  const fromGlobal = (globalThis as typeof globalThis & { mpegts?: MpegtsApi }).mpegts;
  if (fromGlobal?.createPlayer) return fromGlobal;
  try {
    const fromBareGlobal = Function('return typeof mpegts !== "undefined" ? mpegts : undefined')() as MpegtsApi | undefined;
    if (fromBareGlobal?.createPlayer) return fromBareGlobal;
  } catch {
    return undefined;
  }
  return undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error) return error;
  if (error) return String(error);
  return fallback;
}

async function installMpegtsFromSource(): Promise<void> {
  const response = await fetch(mpegtsScriptUrl);
  if (!response.ok) throw new Error(`mpegts 脚本读取失败: ${response.status}`);
  const source = await response.text();
  const runSdk = new Function(
    'window',
    'self',
    'globalThis',
    'module',
    'exports',
    'define',
    `${source}\n//# sourceURL=${mpegtsScriptUrl}`
  );
  runSdk(window, window, window, undefined, undefined, undefined);
  if (!getMpegtsApi()) throw new Error('mpegts SDK 已执行但播放器对象仍不可用');
}

function loadMpegtsPlayer(): Promise<void> {
  if (getMpegtsApi()) return Promise.resolve();
  if (!mpegtsScriptUrl) return Promise.reject(new Error('未配置 VITE_MPEGTS_SCRIPT_URL'));
  if (mpegtsLoadingPromise) return mpegtsLoadingPromise;

  mpegtsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = mpegtsScriptUrl;
    script.dataset.ptzMpegts = 'true';
    script.onload = () => {
      if (getMpegtsApi()) {
        resolve();
        return;
      }
      installMpegtsFromSource().then(resolve).catch(reject);
    };
    script.onerror = () => {
      mpegtsLoadingPromise = null;
      reject(new Error(`mpegts 脚本加载失败: ${script.src}`));
    };
    document.head.appendChild(script);
  });
  mpegtsLoadingPromise.catch(() => {
    mpegtsLoadingPromise = null;
  });
  return mpegtsLoadingPromise;
}

export function CameraFrame({ frame, result, onClickPoint }: Props) {
  const playerHostRef = useRef<HTMLDivElement>(null);
  const [playerStatus, setPlayerStatus] = useState('');

  useEffect(() => {
    if (frame?.kind === 'image') {
      setPlayerStatus('全域实景图片');
      return undefined;
    }

    const playerHost = playerHostRef.current;
    if (!playerHost || !frame) {
      setPlayerStatus('');
      return undefined;
    }

    let disposed = false;
    let player: ReturnType<MpegtsApi['createPlayer']> | null = null;

    const cleanup = () => {
      disposed = true;
      player?.unload?.();
      player?.detachMediaElement?.();
      player?.destroy?.();
      player = null;
    };

    const playNative = () => {
      if (disposed) return;
      playerHost.innerHTML = '';
      const video = document.createElement('video');
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      playerHost.appendChild(video);
      video.src = frame.url;
      video.play().then(
        () => {
          if (!disposed) setPlayerStatus(frame.player === 'mpegts' ? '未检测到 mpegts 播放器，已尝试浏览器原生播放' : '');
        },
        () => {
          if (!disposed) setPlayerStatus(frame.player === 'mpegts' ? '未检测到 mpegts 播放器，原生播放失败' : '实时流播放失败');
        }
      );
    };

    const playMpegts = () => {
      const mpegts = getMpegtsApi();
      if (!mpegts || disposed) {
        playNative();
        return;
      }
      player = mpegts.createPlayer(
        {
          type: 'arges',
          debug: false,
          isLive: true,
          decorder: 'auto',
          url: frame.url,
          hasAudio: true,
          hasVideo: true,
          cors: true,
          argesInfo: {
            deviceCode: frame.deviceCode,
            channelCode: frame.channelCode
          }
        },
        { visibilityReload: true, toolbar: { show: false } }
      );
      if (!player) {
        setPlayerStatus('mpegts 播放器初始化失败，真实流地址已获取但当前浏览器无法解码');
        return;
      }
      playerHost.innerHTML = '';
      player.attachMediaElement('realTimeVideo');
      try {
        player.volume = 0;
      } catch {
        const video = playerHost.querySelector('video');
        if (video) video.muted = true;
      }
      player.load();
      setPlayerStatus('');
    };

    setPlayerStatus('正在加载实时流');
    playerHost.innerHTML = '';

    if (frame.player === 'mpegts') {
      loadMpegtsPlayer().then(playMpegts).catch((error) => {
        if (disposed) return;
        setPlayerStatus(`${errorMessage(error, 'mpegts 播放器不可用')}，真实流地址已获取但当前浏览器无法解码`);
      });
      return cleanup;
    }

    playNative();
    return cleanup;
  }, [frame]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!frame) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onClickPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      imageWidth: rect.width,
      imageHeight: rect.height
    });
  };

  return (
    <div className="camera-frame" onClick={handleClick}>
      {frame?.kind === 'image' ? (
        <img src={frame.url} alt="全域实景" draggable={false} />
      ) : frame ? (
        <div id="realTimeVideo" ref={playerHostRef} className="player-host" />
      ) : (
        <div className="empty-frame" />
      )}
      {result && <div className="aim-point" />}
      <div className="frame-hint">点击实时画面中的地面目标</div>
      {playerStatus && <div className="frame-status">{playerStatus}</div>}
    </div>
  );
}
