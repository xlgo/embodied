import type { CameraConfig, ClickPoint, GeoResult, PtzState } from '../types.js';

const EARTH_RADIUS_METERS = 6378137;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeDegrees(deg: number): number {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function shortestAngleDeltaDeg(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function normalizeVector(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function rotateAroundForward(v: Vec3, rollDeg: number): Vec3 {
  const roll = degToRad(rollDeg);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  return {
    x: v.x * c - v.y * s,
    y: v.x * s + v.y * c,
    z: v.z
  };
}

export function clickToCameraRay(click: ClickPoint, fovHDeg: number, fovVDeg: number): Vec3 {
  const nx = (click.x / click.imageWidth - 0.5) * 2;
  const ny = (0.5 - click.y / click.imageHeight) * 2;
  return normalizeVector({
    x: Math.tan(degToRad(fovHDeg) / 2) * nx,
    y: Math.tan(degToRad(fovVDeg) / 2) * ny,
    z: 1
  });
}

export function cameraRayToEnu(ray: Vec3, camera: CameraConfig, ptz: PtzState): Vec3 {
  const rolledRay = rotateAroundForward(ray, camera.rollOffsetDeg);
  const yaw = degToRad(normalizeDegrees(ptz.panDeg + camera.mountYawOffsetDeg));
  const tilt = degToRad(ptz.tiltDeg + camera.mountPitchOffsetDeg);

  const forwardHorizontal = { x: Math.sin(yaw), y: Math.cos(yaw), z: 0 };
  const right = { x: Math.cos(yaw), y: -Math.sin(yaw), z: 0 };
  const forward = normalizeVector({
    x: forwardHorizontal.x * Math.cos(tilt),
    y: forwardHorizontal.y * Math.cos(tilt),
    z: -Math.sin(tilt)
  });
  const up = normalizeVector({
    x: forwardHorizontal.x * Math.sin(tilt),
    y: forwardHorizontal.y * Math.sin(tilt),
    z: Math.cos(tilt)
  });

  return normalizeVector({
    x: right.x * rolledRay.x + up.x * rolledRay.y + forward.x * rolledRay.z,
    y: right.y * rolledRay.x + up.y * rolledRay.y + forward.y * rolledRay.z,
    z: right.z * rolledRay.x + up.z * rolledRay.y + forward.z * rolledRay.z
  });
}

export function enuOffsetToLngLat(
  originLng: number,
  originLat: number,
  eastMeters: number,
  northMeters: number
): { lng: number; lat: number } {
  const latRad = degToRad(originLat);
  const lat = originLat + radToDeg(northMeters / EARTH_RADIUS_METERS);
  const lng = originLng + radToDeg(eastMeters / (EARTH_RADIUS_METERS * Math.cos(latRad)));
  return { lng, lat };
}

export function locateClickOnGround(
  click: ClickPoint,
  camera: CameraConfig,
  ptz: PtzState,
  now = Date.now()
): GeoResult {
  const cameraHeight = camera.altitudeMeters - camera.groundHeightMeters;
  const ray = clickToCameraRay(click, ptz.fovHDeg, ptz.fovVDeg);
  const worldRay = cameraRayToEnu(ray, camera, ptz);

  if (cameraHeight <= 0 || worldRay.z >= -0.0001) {
    return {
      lng: camera.lng,
      lat: camera.lat,
      distanceMeters: 0,
      bearingDeg: 0,
      confidence: 'invalid',
      errorRadiusMeters: Number.POSITIVE_INFINITY
    };
  }

  const scale = cameraHeight / -worldRay.z;
  const east = worldRay.x * scale;
  const north = worldRay.y * scale;
  const { lng, lat } = enuOffsetToLngLat(camera.lng, camera.lat, east, north);
  const distanceMeters = Math.hypot(east, north);
  const bearingDeg = normalizeDegrees(radToDeg(Math.atan2(east, north)));
  const ptzAgeMs = Math.abs(now - ptz.timestamp);
  const confidence = camera.calibrated ? (ptzAgeMs < 2000 ? 'high' : 'medium') : 'low';
  const errorRadiusMeters = camera.calibrated ? (ptzAgeMs < 2000 ? 10 : 25) : Math.max(50, distanceMeters * 0.08);

  return { lng, lat, distanceMeters, bearingDeg, confidence, errorRadiusMeters };
}

export function estimateYawPitchOffsetFromCalibration(
  camera: CameraConfig,
  ptz: PtzState,
  click: ClickPoint,
  targetLng: number,
  targetLat: number
): Pick<CameraConfig, 'mountYawOffsetDeg' | 'mountPitchOffsetDeg'> {
  const latRad = degToRad(camera.lat);
  const east = degToRad(targetLng - camera.lng) * EARTH_RADIUS_METERS * Math.cos(latRad);
  const north = degToRad(targetLat - camera.lat) * EARTH_RADIUS_METERS;
  const height = camera.altitudeMeters - camera.groundHeightMeters;
  const targetYaw = normalizeDegrees(radToDeg(Math.atan2(east, north)));
  const targetTilt = radToDeg(Math.atan2(height, Math.hypot(east, north)));
  const centerRay = clickToCameraRay(click, ptz.fovHDeg, ptz.fovVDeg);
  const pixelYaw = radToDeg(Math.atan2(centerRay.x, centerRay.z));
  const pixelPitch = radToDeg(Math.atan2(centerRay.y, Math.hypot(centerRay.x, centerRay.z)));

  return {
    mountYawOffsetDeg: shortestAngleDeltaDeg(ptz.panDeg + pixelYaw, targetYaw),
    mountPitchOffsetDeg: targetTilt - ptz.tiltDeg + pixelPitch
  };
}
