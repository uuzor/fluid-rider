import {
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  TorusGeometry,
} from '@iwsdk/core';

const crystalMaterial = new MeshStandardMaterial({
  color: '#c4f36a',
  emissive: '#7ba83d',
  emissiveIntensity: 1.1,
  metalness: 0.1,
  roughness: 0.28,
});
const ringMaterial = new MeshStandardMaterial({
  color: '#f7c86a',
  emissive: '#9d5c24',
  emissiveIntensity: 0.8,
  metalness: 0.28,
  roughness: 0.3,
});

const token = new Group();
token.name = 'Boost token';
const crystal = new Mesh(new OctahedronGeometry(0.25, 0), crystalMaterial);
crystal.name = 'Boost crystal';
token.add(crystal);
const ring = new Mesh(new TorusGeometry(0.38, 0.035, 7, 22), ringMaterial);
ring.name = 'Boost ring';
ring.rotation.x = Math.PI / 2;
token.add(ring);

export default token;
