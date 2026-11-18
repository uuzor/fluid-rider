import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from '@iwsdk/core';

const frame = new MeshStandardMaterial({ color: '#26383f', metalness: 0.62, roughness: 0.35 });
const grip = new MeshStandardMaterial({ color: '#c4f36a', metalness: 0.08, roughness: 0.6 });
const tire = new MeshStandardMaterial({ color: '#12191c', roughness: 0.98 });
const rim = new MeshStandardMaterial({ color: '#90b2b5', metalness: 0.72, roughness: 0.3 });
const accent = new MeshStandardMaterial({ color: '#ff805e', metalness: 0.22, roughness: 0.4 });

const cockpit = new Group();
cockpit.name = 'Seated bike cockpit';

const handlebar = new Mesh(new CylinderGeometry(0.045, 0.045, 1.18, 10), frame);
handlebar.rotation.z = Math.PI / 2;
handlebar.position.set(0, 0.04, -0.06);
cockpit.add(handlebar);

for (const side of [-1, 1]) {
  const gripMesh = new Mesh(new CylinderGeometry(0.07, 0.07, 0.3, 10), grip);
  gripMesh.rotation.z = Math.PI / 2;
  gripMesh.position.set(side * 0.62, 0.04, -0.06);
  cockpit.add(gripMesh);

  const brakeLever = new Mesh(new BoxGeometry(0.16, 0.035, 0.2), accent);
  brakeLever.position.set(side * 0.42, 0.02, -0.19);
  brakeLever.rotation.y = side * -0.17;
  cockpit.add(brakeLever);
}

const stem = new Mesh(new CylinderGeometry(0.055, 0.075, 0.37, 9), frame);
stem.position.set(0, -0.16, -0.12);
cockpit.add(stem);

const frontWheel = new Mesh(new TorusGeometry(0.34, 0.028, 7, 24), tire);
frontWheel.position.set(0, -0.57, -0.82);
cockpit.add(frontWheel);

const wheelRim = new Mesh(new TorusGeometry(0.28, 0.012, 5, 20), rim);
wheelRim.position.copy(frontWheel.position);
cockpit.add(wheelRim);

for (const side of [-1, 1]) {
  const fork = new Mesh(new CylinderGeometry(0.025, 0.035, 0.57, 7), frame);
  fork.position.set(side * 0.1, -0.28, -0.55);
  fork.rotation.x = 0.24;
  cockpit.add(fork);
}

export default cockpit;
