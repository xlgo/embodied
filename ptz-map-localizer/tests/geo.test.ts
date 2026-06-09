import assert from 'node:assert/strict';
import test from 'node:test';
import { clickToCameraRay, enuOffsetToLngLat, locateClickOnGround, normalizeDegrees } from '../src/utils/geo.js';
import type { CameraConfig, ClickPoint, PtzState } from '../src/types.js';

const camera: CameraConfig = {
  id: 'cam',
  name: 'cam',
  lng: 126,
  lat: 45,
  altitudeMeters: 40,
  groundHeightMeters: 0,
  mountYawOffsetDeg: 0,
  mountPitchOffsetDeg: 0,
  rollOffsetDeg: 0,
  calibrated: true
};

const ptz: PtzState = {
  panDeg: 0,
  tiltDeg: 45,
  zoom: 1,
  fovHDeg: 60,
  fovVDeg: 40,
  timestamp: Date.now()
};

test('normalizeDegrees handles 720-degree PTZ rotation', () => {
  assert.equal(normalizeDegrees(720), 0);
  assert.equal(normalizeDegrees(725), 5);
  assert.equal(normalizeDegrees(-5), 355);
});

test('center click produces forward camera ray', () => {
  const ray = clickToCameraRay({ x: 500, y: 250, imageWidth: 1000, imageHeight: 500 }, 60, 40);
  assert.equal(Math.round(ray.x * 1e8), 0);
  assert.equal(Math.round(ray.y * 1e8), 0);
  assert.ok(ray.z > 0.99);
});

test('ENU offset changes latitude and longitude in expected directions', () => {
  const next = enuOffsetToLngLat(126, 45, 100, 100);
  assert.ok(next.lng > 126);
  assert.ok(next.lat > 45);
});

test('ground localization returns high confidence for calibrated fresh PTZ', () => {
  const click: ClickPoint = { x: 500, y: 250, imageWidth: 1000, imageHeight: 500 };
  const result = locateClickOnGround(click, camera, ptz, ptz.timestamp);
  assert.equal(result.confidence, 'high');
  assert.ok(result.distanceMeters > 39 && result.distanceMeters < 41);
  assert.ok(result.errorRadiusMeters <= 10);
});
