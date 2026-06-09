import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDeviceTree, createStreamUuid } from '../src/api/platformAdapter.js';
import { getTiandituScriptUrl } from '../src/map/tianditu.js';

test('buildDeviceTree preserves organization folders and device leaves', () => {
  const tree = buildDeviceTree([
    { id: 1, name: 'Root', nodeType: 0, parentId: 0, orgCode: 'root' },
    {
      id: 2,
      name: 'PTZ-01',
      nodeType: 2,
      parentId: 1,
      unitType: 1,
      cameraType: 1,
      channelStatus: 1,
      deviceCode: 'dev-001',
      channelCode: 'ch-001',
      longitude: 126.1,
      latitude: 45.2
    }
  ]);

  assert.equal(tree.length, 1);
  assert.equal(tree[0].selectable, false);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].selectable, true);
  assert.equal(tree[0].children[0].camera?.deviceCode, 'dev-001');
  assert.equal(tree[0].children[0].camera?.locationSource, 'device');
});

test('getTiandituScriptUrl injects the configured key', () => {
  assert.equal(
    getTiandituScriptUrl('abc 123', 'https://example.test/tdt.js?tk={tk}'),
    'https://example.test/tdt.js?tk=abc%20123'
  );
});

test('createStreamUuid follows platform 26-character token format', () => {
  const streamUuid = createStreamUuid();
  assert.equal(streamUuid.length, 26);
  assert.match(streamUuid, /^[A-Za-z0-9]{26}$/);
  assert.equal(new Set(streamUuid).size, 26);
});
