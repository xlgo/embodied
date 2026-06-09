import type {
  CameraConfig,
  CaptchaResult,
  DeviceTreeNode,
  DeviceTreeResult,
  FrameResult,
  LoginResult,
  PtzState
} from '../types.js';

const TOKEN_KEY = 'TOKEN';
const DEFAULT_PLATFORM_BASE_URL = 'http://192.168.11.51:9884';
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const BASE_URL = env?.VITE_PLATFORM_BASE_URL || DEFAULT_PLATFORM_BASE_URL;
const USE_DEV_PROXY = Boolean(env?.DEV) && BASE_URL === DEFAULT_PLATFORM_BASE_URL;
const DEFAULT_CAMERA_HEIGHT_METERS = 35;

type JsonRecord = Record<string, unknown>;

const lastDevicesById = new Map<string, CameraConfig>();

declare global {
  interface Window {
    DES3?: {
      encrypt: (security: string, value: string) => string;
    };
  }
}

function apiUrl(path: string): string {
  if (USE_DEV_PROXY && path.startsWith('/')) return path;
  if (!BASE_URL || path.startsWith('http')) return path;
  return `${BASE_URL.replace(/\/$/, '')}${path}`;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function responseData(value: unknown): unknown {
  const record = asRecord(value);
  return record.data ?? value;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('token', token);

  const response = await fetch(apiUrl(path), { ...init, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const data = await response.json();
  if (data?.code === 299) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error('登录已失效，请重新登录');
  }
  if (data?.code !== undefined && data.code !== 200) {
    throw new Error(data?.msg || `接口返回异常: ${data.code}`);
  }
  return data as T;
}

async function loadDes3(): Promise<void> {
  if (window.DES3?.encrypt) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ptz-des3]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('DES3 加密脚本加载失败')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = apiUrl('/pano/des3/DES3.js');
    script.dataset.ptzDes3 = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('DES3 加密脚本加载失败'));
    document.head.appendChild(script);
  });
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getPlatformBaseUrl(): string {
  return BASE_URL;
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function createSecuritySeed(): string {
  let seed = '';
  for (let i = 0; i < 24; i += 1) seed += Math.floor(Math.random() * 10 + 1);
  return seed.slice(0, 24);
}

export async function encryptLoginPayload(username: string, password: string): Promise<{
  security: string;
  userName: string;
  password: string;
}> {
  await loadDes3();
  if (!window.DES3?.encrypt) throw new Error('DES3 加密对象不可用');
  const security = createSecuritySeed();
  return {
    security,
    userName: window.DES3.encrypt(security, username),
    password: window.DES3.encrypt(security, password)
  };
}

export async function getCaptcha(): Promise<CaptchaResult> {
  const response = await fetch(apiUrl('/pano/user/getPicVerifyCode?type=1'));
  if (!response.ok) throw new Error(`验证码获取失败: ${response.status}`);
  const uuidCode = response.headers.get('uuidcode') || '';
  const blob = await response.blob();
  const imageDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('验证码图片读取失败'));
    reader.readAsDataURL(blob);
  });
  return { imageDataUrl, uuidCode };
}

export async function login(
  username: string,
  password: string,
  captcha: string,
  uuidCode: string
): Promise<LoginResult> {
  const encrypted = await encryptLoginPayload(username, password);
  const data = await request<{ data?: { token?: string } }>('/pano/user/login', {
    method: 'POST',
    body: JSON.stringify({
      ...encrypted,
      verifyCode: captcha,
      uuidCode
    })
  });
  const token = data.data?.token;
  if (!token) throw new Error('登录成功响应中没有 token');
  setToken(token);
  return { token, raw: data };
}

export async function logout(): Promise<void> {
  try {
    await request('/pano/user/logout', { method: 'POST', body: JSON.stringify({}) });
  } finally {
    clearToken();
  }
}

export async function getHomeData(): Promise<unknown> {
  return request('/pano/home', { method: 'POST', body: JSON.stringify({}) });
}

function readNumber(record: JsonRecord, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function readOptionalNumber(record: JsonRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function readString(record: JsonRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function readArrayPayload(value: unknown): JsonRecord[] {
  const data = responseData(value);
  if (Array.isArray(data)) return data.map(asRecord).filter((item) => Object.keys(item).length > 0);
  const record = asRecord(data);
  for (const key of ['list', 'records', 'rows', 'children', 'tree']) {
    const array = record[key];
    if (Array.isArray(array)) return array.map(asRecord).filter((item) => Object.keys(item).length > 0);
  }
  return [];
}

function normalizeName(record: JsonRecord): string {
  const name = readString(record, ['name', 'label', 'title', 'deviceName', 'channelName', 'cameraName'], '未命名节点');
  return name === 'info.local' || name === 'info.localDomain' ? '本域' : name;
}

function cameraFromNodeRecord(record: JsonRecord, index: number): CameraConfig | undefined {
  const nodeType = readOptionalNumber(record, ['nodeType']);
  if (nodeType !== 2) return undefined;

  const id = readString(record, ['id', 'channelId', 'gbId', 'channelCode', 'code'], `camera-${index + 1}`);
  const lng = readOptionalNumber(record, ['lng', 'longitude', 'lon', 'x']);
  const lat = readOptionalNumber(record, ['lat', 'latitude', 'y']);

  return {
    id,
    name: normalizeName(record),
    deviceCode: readString(record, ['deviceCode', 'deviceId', 'gbDeviceCode', 'parentCode']),
    channelCode: readString(record, ['channelCode', 'channelId', 'gbId', 'code']),
    nodeType,
    unitType: readOptionalNumber(record, ['unitType']),
    cameraType: readOptionalNumber(record, ['cameraType']),
    channelStatus: readOptionalNumber(record, ['channelStatus']),
    lng: lng ?? 0,
    lat: lat ?? 0,
    altitudeMeters: readNumber(record, ['altitude', 'altitudeMeters', 'height', 'cameraHeight'], DEFAULT_CAMERA_HEIGHT_METERS),
    groundHeightMeters: readNumber(record, ['groundHeight', 'groundHeightMeters'], 0),
    mountYawOffsetDeg: readNumber(record, ['mountYawOffsetDeg', 'yawOffset'], 0),
    mountPitchOffsetDeg: readNumber(record, ['mountPitchOffsetDeg', 'pitchOffset'], 0),
    rollOffsetDeg: readNumber(record, ['rollOffsetDeg', 'rollOffset'], 0),
    calibrated: false,
    locationSource: lng !== undefined && lat !== undefined ? 'device' : 'missing',
    raw: record
  };
}

function nodeFromRecord(record: JsonRecord, index: number): DeviceTreeNode {
  const nodeType = readNumber(record, ['nodeType'], 2);
  const id = readString(record, ['id', 'orgCode', 'channelId', 'gbId', 'channelCode', 'code'], `node-${index + 1}`);
  const camera = cameraFromNodeRecord(record, index);
  const isOrg = nodeType === 0;

  return {
    id,
    name: normalizeName(record),
    nodeType,
    unitType: readOptionalNumber(record, ['unitType']),
    cameraType: readOptionalNumber(record, ['cameraType']),
    channelStatus: readOptionalNumber(record, ['channelStatus']),
    parentId: (record.parentId as string | number | null | undefined) ?? null,
    orgCode: readString(record, ['orgCode']),
    isLeaf: !isOrg,
    selectable: Boolean(camera),
    loaded: !isOrg,
    children: [],
    camera,
    raw: record
  };
}

function flattenDevices(nodes: DeviceTreeNode[]): CameraConfig[] {
  return nodes.flatMap((node) => [
    ...(node.camera ? [node.camera] : []),
    ...flattenDevices(node.children)
  ]);
}

function cacheDevices(devices: CameraConfig[]): void {
  devices.forEach((device) => lastDevicesById.set(device.id, device));
}

export function buildDeviceTree(records: JsonRecord[]): DeviceTreeNode[] {
  const nodesById = new Map<string, DeviceTreeNode>();
  records.forEach((record, index) => {
    const node = nodeFromRecord(record, index);
    nodesById.set(node.id, node);
  });

  const roots: DeviceTreeNode[] = [];
  nodesById.forEach((node) => {
    const parentId = node.parentId === null || node.parentId === undefined ? '' : String(node.parentId);
    const parent = parentId ? nodesById.get(parentId) : undefined;
    if (parent) {
      parent.children.push(node);
      parent.loaded = true;
    } else {
      roots.push(node);
    }
  });

  return roots;
}

async function queryOrganization(params: JsonRecord = {}): Promise<unknown> {
  return request('/pano/organization/all', {
    method: 'POST',
    body: JSON.stringify({ unitType: '0,1,17', queryNum: 0, ...params })
  });
}

export async function getDeviceTree(): Promise<DeviceTreeResult> {
  const raw = await queryOrganization();
  const records = readArrayPayload(raw);
  const tree = buildDeviceTree(records);
  const devices = flattenDevices(tree);
  lastDevicesById.clear();
  cacheDevices(devices);
  return { tree, devices, raw };
}

export async function loadDeviceTreeChildren(parent: DeviceTreeNode): Promise<DeviceTreeResult> {
  if (!parent.orgCode) return { tree: [], devices: [], raw: null };
  const raw = await queryOrganization({ orgCode: parent.orgCode, openLevel: 1 });
  const records = readArrayPayload(raw);
  const tree = buildDeviceTree(records);
  const devices = flattenDevices(tree);
  cacheDevices(devices);
  return { tree, devices, raw };
}

export async function getCameraDevices(): Promise<CameraConfig[]> {
  const result = await getDeviceTree();
  return result.devices;
}

function firstRecordWithKeys(value: unknown, keys: string[]): JsonRecord {
  const visit = (next: unknown): JsonRecord | undefined => {
    if (Array.isArray(next)) {
      for (const item of next) {
        const found = visit(item);
        if (found) return found;
      }
      return undefined;
    }
    const record = asRecord(next);
    if (Object.keys(record).length === 0) return undefined;
    if (keys.some((key) => record[key] !== undefined)) return record;
    for (const item of Object.values(record)) {
      const found = visit(item);
      if (found) return found;
    }
    return undefined;
  };
  return visit(value) || asRecord(responseData(value));
}

function nestedRecord(record: JsonRecord, key: string): JsonRecord {
  return asRecord(record[key]);
}

function getDeviceCodes(camera?: CameraConfig): { deviceCode: string; channelCode: string } {
  const raw = asRecord(camera?.raw);
  return {
    deviceCode: camera?.deviceCode || readString(raw, ['deviceCode', 'deviceId', 'gbDeviceCode', 'parentCode']),
    channelCode: camera?.channelCode || readString(raw, ['channelCode', 'channelId', 'gbId', 'code'])
  };
}

function getCameraOrThrow(cameraId: string): CameraConfig {
  const camera = lastDevicesById.get(cameraId);
  if (!camera) throw new Error('未找到已选择的真实设备，请先刷新设备树');
  return camera;
}

function normalizeMediaUrl(url: string): string {
  if (!url) return '';
  if (/^(https?:|wss?:|data:|blob:)/i.test(url)) return url;
  if (USE_DEV_PROXY && url.startsWith('/')) return url;
  if (url.startsWith('/')) return `${BASE_URL.replace(/\/$/, '')}${url}`;
  return `${BASE_URL.replace(/\/$/, '')}/${url}`;
}

function isPrivateHost(hostname: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(hostname);
}

function platformHost(): string {
  try {
    return new URL(BASE_URL).hostname;
  } catch {
    return window.location.hostname;
  }
}

export function createStreamUuid(length = 26): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const used = new Set<string>();
  let uuid = '';
  while (uuid.length < length && used.size < chars.length) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    if (!used.has(char)) {
      used.add(char);
      uuid += char;
    }
  }
  while (uuid.length < length) {
    uuid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uuid;
}

export function isPanoramicScene(camera: CameraConfig | null | undefined): boolean {
  return Number(camera?.unitType) === 17;
}

export function supportsPtz(camera: CameraConfig | null | undefined): boolean {
  return Number(camera?.unitType) === 1 && Number(camera?.cameraType) === 1;
}

async function getPanoramicFrame(camera: CameraConfig, deviceCode: string, channelCode: string): Promise<FrameResult> {
  const data = await request<unknown>('/pano/panoramic/getRealSceneImage', {
    method: 'POST',
    body: JSON.stringify({ deviceCode, channelCode })
  });
  const record = firstRecordWithKeys(data, ['imagePath', 'imageUrl', 'realSceneImage', 'picUrl', 'url', 'path']);
  const imageUrl = readString(record, ['imagePath', 'imageUrl', 'realSceneImage', 'picUrl', 'url', 'path', 'data']);
  if (!imageUrl) throw new Error(`${camera.name} 没有返回全域实景图片地址`);

  return {
    url: normalizeMediaUrl(imageUrl),
    kind: 'image',
    player: 'image',
    deviceCode,
    channelCode,
    timestamp: Date.now(),
    raw: data
  };
}

export async function getFrame(cameraId: string): Promise<FrameResult> {
  const camera = getCameraOrThrow(cameraId);
  const { deviceCode, channelCode } = getDeviceCodes(camera);
  if (!deviceCode || !channelCode) throw new Error('设备缺少 deviceCode/channelCode，无法加载画面');

  if (isPanoramicScene(camera)) {
    return getPanoramicFrame(camera, deviceCode, channelCode);
  }

  const streamUuid = createStreamUuid();
  const data = await request<unknown>('/pano/realTimeVideo/getVideoRealtimeUrl', {
    method: 'POST',
    headers: { 'X-StreamUuid': streamUuid },
    body: JSON.stringify({
      deviceCode,
      channelCode,
      streamType: 1,
      protocolType: 5,
      netType: isPrivateHost(platformHost()) ? 0 : 1,
      tranProtocol: 1
    })
  });
  const record = firstRecordWithKeys(data, ['streamUrl', 'url', 'playUrl', 'videoUrl']);
  const streamUrl = readString(record, ['streamUrl', 'url', 'playUrl', 'videoUrl', 'data']);
  if (!streamUrl) throw new Error('实时流接口没有返回 streamUrl');

  return {
    url: normalizeMediaUrl(streamUrl),
    kind: 'live',
    player: 'mpegts',
    streamUuid,
    deviceCode,
    channelCode,
    timestamp: Date.now(),
    raw: data
  };
}

export async function getPtzState(cameraId: string): Promise<PtzState> {
  const camera = getCameraOrThrow(cameraId);
  const { deviceCode, channelCode } = getDeviceCodes(camera);
  if (!deviceCode || !channelCode) throw new Error('设备缺少 deviceCode/channelCode，无法获取 PTZ');

  const [viewResult, positionResult] = await Promise.allSettled([
    request<unknown>('/pano/realTimeVideo/viewPitchAngle', {
      method: 'POST',
      body: JSON.stringify({ deviceCode, channelCode })
    }),
    request<unknown>('/pano/operate/queryPtzPosition', {
      method: 'POST',
      body: JSON.stringify({ type: 2, deviceCode, channelCode })
    })
  ]);

  if (viewResult.status === 'rejected' && positionResult.status === 'rejected') {
    throw new Error(`PTZ 获取失败: ${viewResult.reason?.message || positionResult.reason?.message || '接口异常'}`);
  }

  const viewData = viewResult.status === 'fulfilled' ? viewResult.value : null;
  const positionData = positionResult.status === 'fulfilled' ? positionResult.value : null;
  const view = firstRecordWithKeys(viewData, ['horizontalAngle', 'pitchAngle', 'viewXAngle', 'viewYAngle']);
  const ptzpos = nestedRecord(view, 'ptzpos');
  const position = firstRecordWithKeys(positionData, ['pan', 'tilt', 'zoom', 'P', 'T', 'Z']);
  const positionPtzpos = nestedRecord(position, 'ptzpos');

  return {
    panDeg: readNumber(view, ['horizontalAngle', 'pan', 'P'], readNumber(ptzpos, ['fpanpos'], readNumber(position, ['pan', 'P'], readNumber(positionPtzpos, ['fpanpos'], 0)))),
    tiltDeg: readNumber(view, ['pitchAngle', 'tilt', 'T'], readNumber(ptzpos, ['ftiltpos'], readNumber(position, ['tilt', 'T'], readNumber(positionPtzpos, ['ftiltpos'], 0)))),
    zoom: readNumber(position, ['zoom', 'Z', 'positionZoom'], readNumber(positionPtzpos, ['fzoompos'], 1)),
    fovHDeg: readNumber(view, ['viewXAngle', 'fhorizontalvalue', 'H', 'fovHDeg', 'hfov'], 54),
    fovVDeg: readNumber(view, ['viewYAngle', 'fverticalvalue', 'V', 'fovVDeg', 'vfov'], 31),
    projectionType: readOptionalNumber(view, ['projectionType', 'projection_type', 'ptzProjectionType', 'ptz_projection_type']),
    timestamp: Date.now(),
    raw: { view: viewData, position: positionData }
  };
}

export async function requestPtzControlToken(cameraId: string): Promise<string> {
  const camera = getCameraOrThrow(cameraId);
  const { deviceCode, channelCode } = getDeviceCodes(camera);
  if (!deviceCode || !channelCode) throw new Error('设备缺少 deviceCode/channelCode，无法锁定云台');
  const data = await request<unknown>('/pano/operate/doLockOrReleasePtz', {
    method: 'POST',
    body: JSON.stringify({ deviceCode, channelCode, controlType: 0, duration: 180 })
  });
  const record = firstRecordWithKeys(data, ['token']);
  const token = readString(record, ['token']);
  if (!token) throw new Error('云台锁定接口没有返回 token');
  return token;
}

export async function sendPtzCommand(
  cameraId: string,
  operType: number,
  operContent: 0 | 1,
  step: number,
  token: string
): Promise<void> {
  const camera = getCameraOrThrow(cameraId);
  const { deviceCode, channelCode } = getDeviceCodes(camera);
  if (!deviceCode || !channelCode) throw new Error('设备缺少 deviceCode/channelCode，无法控制云台');
  const path = operType <= 8 ? '/pano/operate/doPtzCmds' : '/pano/operate/doCameraFocusOrZoom';
  await request(path, {
    method: 'POST',
    body: JSON.stringify({
      deviceCode,
      channelCode,
      token,
      operContent,
      operType,
      step
    })
  });
}
