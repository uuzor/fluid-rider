import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from '@iwsdk/core';

const pulseMaterial = new MeshStandardMaterial({
  color: '#ff9c73',
  emissive: '#ff593a',
  emissiveIntensity: 1.6,
  metalness: 0.05,
  roughness: 0.24,
});

const pulse = new Group();
pulse.name = 'Pulse shot';
const core = new Mesh(new SphereGeometry(0.11, 10, 8), pulseMaterial);
core.name = 'Pulse core';
pulse.add(core);
const trail = new Mesh(new SphereGeometry(0.18, 8, 6), pulseMaterial);
trail.name = 'Pulse trail';
trail.position.z = 0.22;
trail.scale.set(0.7, 0.7, 1.8);
pulse.add(trail);

export default pulse;
