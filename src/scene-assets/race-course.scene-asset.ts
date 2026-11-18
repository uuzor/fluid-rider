import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from '@iwsdk/core';

const segmentLength = 48;
const asphalt = new MeshStandardMaterial({ color: '#405258', roughness: 0.95 });
const verge = new MeshStandardMaterial({ color: '#4e795b', roughness: 1 });
const curb = new MeshStandardMaterial({ color: '#d9e0ca', roughness: 0.85 });
const curbAccent = new MeshStandardMaterial({ color: '#ef8760', roughness: 0.76 });
const rail = new MeshStandardMaterial({ color: '#b3c8bd', roughness: 0.58, metalness: 0.12 });
const bark = new MeshStandardMaterial({ color: '#704c38', roughness: 0.96 });
const pine = new MeshStandardMaterial({ color: '#28634e', roughness: 0.92 });
const pineLight = new MeshStandardMaterial({ color: '#4e9870', roughness: 0.9 });
const mountain = new MeshStandardMaterial({ color: '#668a91', roughness: 1 });
const snow = new MeshStandardMaterial({ color: '#d9e2d9', roughness: 0.9 });
const marker = new MeshStandardMaterial({ color: '#c4f36a', emissive: '#527a26', emissiveIntensity: 0.55 });

const root = new Group();
root.name = 'Alpine trail segment';

const ground = new Mesh(new BoxGeometry(40, 0.3, segmentLength), verge);
ground.position.set(0, -0.28, 0);
root.add(ground);

const road = new Mesh(new BoxGeometry(8.4, 0.16, segmentLength), asphalt);
road.position.set(0, -0.08, 0);
root.add(road);

for (const side of [-1, 1]) {
  const curbStrip = new Mesh(new BoxGeometry(0.48, 0.18, segmentLength), curb);
  curbStrip.position.set(side * 4.43, -0.03, 0);
  root.add(curbStrip);

  for (const z of [-18, -6, 6, 18]) {
    const accent = new Mesh(new BoxGeometry(0.5, 0.19, 1.7), curbAccent);
    accent.position.set(side * 4.43, 0.03, z);
    root.add(accent);
  }

  const railBeam = new Mesh(new BoxGeometry(0.12, 0.13, segmentLength), rail);
  railBeam.position.set(side * 5.05, 0.72, 0);
  root.add(railBeam);

  for (const z of [-20, -10, 0, 10, 20]) {
    const post = new Mesh(new BoxGeometry(0.13, 1.1, 0.16), rail);
    post.position.set(side * 5.05, 0.42, z);
    root.add(post);
  }

  for (const z of [-18, -2, 14]) {
    const trunk = new Mesh(new CylinderGeometry(0.11, 0.18, 1.4, 6), bark);
    trunk.position.set(side * 7.2, 0.55, z);
    root.add(trunk);

    const lowerCanopy = new Mesh(new ConeGeometry(1.05, 2.1, 7), pine);
    lowerCanopy.position.set(side * 7.2, 1.95, z);
    root.add(lowerCanopy);

    const upperCanopy = new Mesh(new ConeGeometry(0.78, 1.7, 7), pineLight);
    upperCanopy.position.set(side * 7.2, 2.75, z);
    root.add(upperCanopy);
  }

  const ridge = new Mesh(new ConeGeometry(5.8, 10.5, 5), mountain);
  ridge.position.set(side * 13.5, 4.6, -17);
  root.add(ridge);

  const snowcap = new Mesh(new ConeGeometry(2.5, 3.2, 5), snow);
  snowcap.position.set(side * 13.5, 8.2, -17);
  root.add(snowcap);
}

for (const z of [-16, 0, 16]) {
  const dash = new Mesh(new BoxGeometry(0.12, 0.025, 3.4), marker);
  dash.position.set(0, 0.012, z);
  root.add(dash);
}

export default root;
