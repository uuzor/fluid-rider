/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AssetType, defineAssets } from '@iwsdk/core';
import demoCube from './scene-assets/demo-cube.scene-asset.js';
import raceCourse from './scene-assets/race-course.scene-asset.js';
import boostToken from './scene-assets/boost-token.scene-asset.js';
import bikeCockpit from './scene-assets/bike-cockpit.scene-asset.js';
import pulseShot from './scene-assets/pulse-shot.scene-asset.js';

// Build every public URL from BASE_URL so the runtime, the managed editor, and
// subpath builds all resolve the same file.
const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

export default defineAssets({
  'environment-desk': {
    url: publicAssetUrl('gltf/environmentDesk/environmentDesk.gltf'),
    type: AssetType.GLTF,
    name: 'Environment Desk',
    priority: 'lazy',
  },
  'plant-sansevieria': {
    url: publicAssetUrl('gltf/plantSansevieria/plantSansevieria.gltf'),
    type: AssetType.GLTF,
    name: 'Plant Sansevieria',
    priority: 'lazy',
  },
  robot: {
    url: publicAssetUrl('gltf/robot/robot.gltf'),
    type: AssetType.GLTF,
    name: 'Robot',
    priority: 'lazy',
  },
  'webxr-banner': {
    url: publicAssetUrl('gltf/webxr-banner/banner.gltf'),
    type: AssetType.GLTF,
    name: 'WebXR Banner',
    priority: 'lazy',
  },
  'welcome-panel': {
    url: publicAssetUrl('ui/welcome.uikitml'),
    type: AssetType.UIKitML,
    name: 'Welcome Panel',
  },
  'input-hud': {
    url: publicAssetUrl('ui/input-hud.uikitml'),
    type: AssetType.UIKitML,
    name: 'Controller Input HUD',
  },
  'demo-cube': demoCube,
  'race-course': raceCourse,
  'boost-token': boostToken,
  'bike-cockpit': bikeCockpit,
  'pulse-shot': pulseShot,
  'race-cyclist': {
    url: publicAssetUrl('gltf/race-cyclist/model.glb'),
    type: AssetType.GLTF,
    name: 'CC0 voxel cyclist and bicycle',
    priority: 'critical',
  },
  'race-hud': {
    url: publicAssetUrl('ui/race-hud.uikitml'),
    type: AssetType.UIKitML,
    name: 'Trail Rush race HUD',
  },
});
