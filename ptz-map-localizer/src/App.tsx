import { useCallback, useEffect, useMemo, useState } from 'react';
import { CameraFrame } from './components/CameraFrame';
import { ConfigPanel } from './components/ConfigPanel';
import { DevicePanel } from './components/DevicePanel';
import { LoginPanel } from './components/LoginPanel';
import { MapPanel } from './components/MapPanel';
import { PtzControlPanel } from './components/PtzControlPanel';
import {
  getDeviceTree,
  getFrame,
  getPlatformBaseUrl,
  getPtzState,
  getToken,
  isPanoramicScene,
  loadDeviceTreeChildren,
  logout,
  supportsPtz
} from './api/platformAdapter.js';
import type { CameraConfig, ClickPoint, DeviceTreeNode, FrameResult, GeoResult, PtzState } from './types.js';
import { locateClickOnGround } from './utils/geo.js';
import './style.css';

function replaceTreeNode(
  nodes: DeviceTreeNode[],
  nodeId: string,
  updater: (node: DeviceTreeNode) => DeviceTreeNode
): DeviceTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    if (node.children.length === 0) return node;
    return { ...node, children: replaceTreeNode(node.children, nodeId, updater) };
  });
}

function mergeDevices(current: CameraConfig[], incoming: CameraConfig[]): CameraConfig[] {
  const byId = new Map(current.map((device) => [device.id, device]));
  incoming.forEach((device) => byId.set(device.id, device));
  return [...byId.values()];
}

function isPreferredSceneDevice(device: CameraConfig): boolean {
  return /湖蓝|大坝|林场|rog|test2/i.test(device.name);
}

function pickInitialDevice(devices: CameraConfig[]): CameraConfig | undefined {
  return (
    devices.find((device) => Number(device.channelStatus) === 1 && isPanoramicScene(device) && isPreferredSceneDevice(device)) ||
    devices.find((device) => Number(device.channelStatus) === 1 && isPanoramicScene(device)) ||
    devices.find((device) => isPanoramicScene(device) && isPreferredSceneDevice(device)) ||
    devices.find((device) => isPanoramicScene(device)) ||
    devices.find((device) => Number(device.channelStatus) === 1 && supportsPtz(device)) ||
    devices.find((device) => Number(device.channelStatus) === 1 && !isPanoramicScene(device)) ||
    devices.find((device) => supportsPtz(device)) ||
    devices.find((device) => Number(device.channelStatus) === 1) ||
    devices[0]
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [tree, setTree] = useState<DeviceTreeNode[]>([]);
  const [devices, setDevices] = useState<CameraConfig[]>([]);
  const [camera, setCamera] = useState<CameraConfig | null>(null);
  const [ptz, setPtz] = useState<PtzState | null>(null);
  const [frame, setFrame] = useState<FrameResult | null>(null);
  const [result, setResult] = useState<GeoResult | null>(null);
  const [message, setMessage] = useState('');
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [deviceTreeOpen, setDeviceTreeOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 318, height: 256 });
  const [now, setNow] = useState(() => new Date());

  const canUseTenMeter = Boolean(camera?.calibrated && result?.confidence === 'high');
  const ptzAgeSeconds = useMemo(() => {
    if (!ptz) return '-';
    return ((Date.now() - ptz.timestamp) / 1000).toFixed(1);
  }, [ptz?.timestamp, result]);

  const refreshPtz = useCallback(async () => {
    if (!camera) return;
    const nextPtz = await getPtzState(camera.id);
    setPtz(nextPtz);
  }, [camera?.id]);

  const loadCameraRuntime = useCallback(async (nextCamera: CameraConfig) => {
    setCamera(nextCamera);
    setFrame(null);
    setResult(null);
    setMessage(`正在加载 ${nextCamera.name} 的${isPanoramicScene(nextCamera) ? '全域实景图片' : '实时流和 PTZ'}`);
    const [frameResult, ptzResult] = await Promise.allSettled([
      getFrame(nextCamera.id),
      isPanoramicScene(nextCamera) ? Promise.resolve(null) : getPtzState(nextCamera.id)
    ]);

    if (frameResult.status === 'fulfilled') setFrame(frameResult.value);
    else setFrame(null);

    if (ptzResult.status === 'fulfilled') setPtz(ptzResult.value);
    else setPtz(null);

    if (frameResult.status === 'fulfilled' && ptzResult.status === 'fulfilled') {
      setMessage(isPanoramicScene(nextCamera) ? '全域实景图片已加载' : '实时流和 PTZ 已加载，PTZ 将每 2 秒自动刷新');
      return;
    }

    if (frameResult.status === 'fulfilled' && ptzResult.status === 'rejected') {
      setMessage(`画面已加载，PTZ 获取失败：${ptzResult.reason?.message || '接口异常'}`);
      return;
    }

    if (frameResult.status === 'rejected' && ptzResult.status === 'fulfilled') {
      setMessage(`PTZ 已加载，画面加载失败：${frameResult.reason?.message || '接口异常'}`);
      return;
    }

    if (frameResult.status === 'rejected') {
      setFrame(null);
      setPtz(null);
      setMessage(frameResult.reason?.message || '设备实时数据加载失败');
    }
  }, []);

  const loadDeviceData = useCallback(async () => {
    setMessage('正在读取真实设备树');
    try {
      const next = await getDeviceTree();
      setTree(next.tree);
      setDevices(next.devices);
      setMessage(next.devices.length > 0 ? `已读取 ${next.devices.length} 个设备` : '已读取目录，请展开设备树加载设备');
      const initialDevice = pickInitialDevice(next.devices);
      if (initialDevice) await loadCameraRuntime(initialDevice);
    } catch (error) {
      setTree([]);
      setDevices([]);
      setCamera(null);
      setFrame(null);
      setPtz(null);
      setMessage(error instanceof Error ? error.message : '设备树加载失败');
    }
  }, [loadCameraRuntime]);

  useEffect(() => {
    if (loggedIn) loadDeviceData();
  }, [loggedIn, loadDeviceData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!camera || isPanoramicScene(camera)) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      getPtzState(camera.id).then(setPtz).catch((error) => {
        setMessage((current) => {
          const errorText = error instanceof Error ? error.message : 'PTZ 自动刷新失败';
          return current.includes('画面已加载') ? `${current}；PTZ 自动刷新失败：${errorText}` : errorText;
        });
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [camera?.id]);

  const handleExpand = async (node: DeviceTreeNode) => {
    if (node.loaded || !node.orgCode) return;
    setLoadingNodeId(node.id);
    setTree((current) => replaceTreeNode(current, node.id, (item) => ({ ...item, loading: true })));
    try {
      const next = await loadDeviceTreeChildren(node);
      setTree((current) =>
        replaceTreeNode(current, node.id, (item) => ({ ...item, children: next.tree, loaded: true, loading: false }))
      );
      setDevices((current) => mergeDevices(current, next.devices));
      setMessage(next.devices.length > 0 ? `目录已加载 ${next.devices.length} 个设备` : '目录已加载，未发现设备节点');
    } catch (error) {
      setTree((current) => replaceTreeNode(current, node.id, (item) => ({ ...item, loading: false })));
      setMessage(error instanceof Error ? error.message : '目录加载失败');
    } finally {
      setLoadingNodeId(null);
    }
  };

  const handleNodeSelect = (node: DeviceTreeNode) => {
    if (!node.camera) return;
    loadCameraRuntime(node.camera);
    setDeviceTreeOpen(false);
  };

  const handleCameraSelect = (id: string) => {
    const next = devices.find((item) => item.id === id);
    if (next) {
      loadCameraRuntime(next);
      setDeviceTreeOpen(false);
    }
  };

  const handleClickPoint = (click: ClickPoint) => {
    if (!camera || !ptz) {
      setMessage('请先选择真实设备并等待 PTZ 自动刷新成功');
      return;
    }
    const next = locateClickOnGround(click, camera, ptz);
    setResult(next);
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setTree([]);
    setDevices([]);
    setCamera(null);
    setPtz(null);
    setFrame(null);
    setResult(null);
  };

  const handleMapResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startSize = mapSize;

    const handleMove = (moveEvent: PointerEvent) => {
      setMapSize({
        width: Math.min(720, Math.max(280, startSize.width + moveEvent.clientX - startX)),
        height: Math.min(560, Math.max(190, startSize.height + startY - moveEvent.clientY))
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const timeText = now.toLocaleTimeString('zh-CN', { hour12: false });
  const dateText = now.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  const cameraPath = camera ? `黑龙江铁塔 / 呼兰河水务 / ${camera.name}` : '黑龙江铁塔 / 呼兰河水务 / 请选择设备';

  if (!loggedIn) {
    return (
      <main className="login-page">
        <LoginPanel onLoggedIn={() => setLoggedIn(true)} />
      </main>
    );
  }

  return (
    <main className="app-shell immersive-shell">
      <CameraFrame frame={frame} result={result} onClickPoint={handleClickPoint} />

      <header className="immersive-header">
        <div className="device-selector">
          <button className="device-pill" type="button" onClick={() => setDeviceTreeOpen((open) => !open)} title={cameraPath}>
            <span className="pin-icon">●</span>
            <span>{cameraPath}</span>
            <span className="chevron">{deviceTreeOpen ? '▲' : '▼'}</span>
          </button>
          {deviceTreeOpen && (
            <div className="device-popover">
              <select value={camera?.id || ''} onChange={(event) => handleCameraSelect(event.target.value)}>
                <option value="" disabled>选择设备</option>
                {devices.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <DevicePanel tree={tree} selectedId={camera?.id || null} loadingNodeId={loadingNodeId} onExpand={handleExpand} onSelect={handleNodeSelect} />
              <div className="device-popover-actions">
                <button type="button" onClick={loadDeviceData}>刷新设备</button>
                <button type="button" onClick={handleLogout}>退出</button>
              </div>
            </div>
          )}
        </div>

        <div className="brand-title">
          <span className="brand-icon">◎</span>
          <strong>黑龙江铁塔全域感知实景调度平台</strong>
        </div>

        <div className="clock-card">
          <strong>{timeText}</strong>
          <span>{dateText}　|　tower</span>
        </div>
      </header>

      <nav className="side-toolbar" aria-label="实景工具">
        <button type="button"><span>◒</span><strong>告警</strong></button>
        <button type="button"><span>▣</span><strong>通道</strong></button>
        <button type="button"><span>◆</span><strong>标签</strong></button>
      </nav>

      <aside
        className={['floating-map', mapFullscreen ? 'fullscreen' : ''].join(' ')}
        style={mapFullscreen ? undefined : { width: mapSize.width, height: mapSize.height }}
      >
        <div className="floating-map-toolbar">
          <button type="button" className="active">平面地图</button>
          <button type="button">3D地图</button>
          <button type="button">卫星地图</button>
          <button type="button" onClick={() => setMapFullscreen((value) => !value)}>
            {mapFullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
        <MapPanel camera={camera} result={result} />
        {!mapFullscreen && (
          <button className="map-resize-handle" type="button" onPointerDown={handleMapResizeStart} title="拖动调整地图大小">◢</button>
        )}
      </aside>

      <aside className="floating-ptz">
        <PtzControlPanel camera={camera} ptz={ptz} disabled={Boolean(camera && isPanoramicScene(camera))} onRefreshPtz={refreshPtz} />
      </aside>

      <section className="action-dock" aria-label="视频工具">
        <button type="button" className="active"><span>▣</span><strong>截屏</strong></button>
        <button type="button"><span>▶</span><strong>录屏</strong></button>
        <button type="button"><span>↺</span><strong>录像回放</strong></button>
        <button type="button"><span>⌾</span><strong>巡检</strong></button>
        <button type="button"><span>▦</span><strong>相关视频</strong></button>
        <button type="button"><span>□</span><strong>联动屏</strong></button>
      </section>

      <div className="right-zoom-tools" aria-label="地图缩放">
        <button type="button">＋</button>
        <span>100</span>
        <button type="button">－</button>
      </div>

      <ConfigPanel camera={camera} ptz={ptz} onCameraChange={setCamera} onPtzChange={setPtz} />
    </main>
  );
}
