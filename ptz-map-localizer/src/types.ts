export interface CameraConfig {
  id: string;
  name: string;
  deviceCode?: string;
  channelCode?: string;
  nodeType?: number;
  unitType?: number;
  cameraType?: number;
  channelStatus?: number;
  lng: number;
  lat: number;
  altitudeMeters: number;
  groundHeightMeters: number;
  mountYawOffsetDeg: number;
  mountPitchOffsetDeg: number;
  rollOffsetDeg: number;
  calibrated?: boolean;
  locationSource?: 'device' | 'manual' | 'missing';
  raw?: unknown;
}

export interface DeviceTreeNode {
  id: string;
  name: string;
  nodeType: number;
  unitType?: number;
  cameraType?: number;
  channelStatus?: number;
  parentId?: string | number | null;
  orgCode?: string;
  isLeaf: boolean;
  selectable: boolean;
  loaded?: boolean;
  loading?: boolean;
  children: DeviceTreeNode[];
  camera?: CameraConfig;
  raw?: unknown;
}

export interface DeviceTreeResult {
  tree: DeviceTreeNode[];
  devices: CameraConfig[];
  raw: unknown;
}

export interface PtzState {
  panDeg: number;
  tiltDeg: number;
  zoom: number;
  fovHDeg: number;
  fovVDeg: number;
  timestamp: number;
  projectionType?: number;
  raw?: unknown;
}

export interface ClickPoint {
  x: number;
  y: number;
  imageWidth: number;
  imageHeight: number;
}

export interface GeoResult {
  lng: number;
  lat: number;
  distanceMeters: number;
  bearingDeg: number;
  confidence: 'high' | 'medium' | 'low' | 'invalid';
  errorRadiusMeters: number;
}

export interface CalibrationPoint {
  clickPoint: ClickPoint;
  lng: number;
  lat: number;
  note?: string;
}

export interface FrameResult {
  url: string;
  timestamp: number;
  kind: 'live' | 'image';
  player: 'mpegts' | 'native' | 'image';
  streamUuid?: string;
  deviceCode?: string;
  channelCode?: string;
  raw?: unknown;
}

export interface CaptchaResult {
  imageDataUrl: string;
  uuidCode: string;
}

export interface LoginResult {
  token: string;
  raw: unknown;
}
