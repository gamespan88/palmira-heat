// Palmira's people: low-poly walkers on sidewalks who stroll, chat, flee danger and can be hired as fares.
import * as THREE from 'three';
import { WORLD } from './config.js';
import { clamp } from './utils.js';
import { resolveBuildingCollisions } from './city.js';

const shirtColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e06c, 0xf78fb3, 0x74b9ff, 0xfdcb6e, 0xdfe6e9];
const skinColors = [0xf1c27d, 0xe0ac69, 0x8d5524, 0xffdbac, 0xc68642];
export function createPersonMesh(shirt = 0x4ecdc4, skin = 0xf1c27d, enemy = false) {
  const group = new THREE.Group();
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: enemy ? 0x8e2434 : shirt, roughness: 0.9 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85 });
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: enemy ? 0x1d1d24 : 0x2f405f, roughness: 1 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.78, 0.36), shirtMaterial); torso.position.y = 1.12; torso.castShadow = true; group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), skinMaterial); head.position.y = 1.78; head.castShadow = true; group.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.72, 0.24), pantsMaterial); leg.position.set(side * 0.18, 0.38, 0); group.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.2), shirtMaterial); arm.position.set(side * 0.47, 1.12, 0); group.add(arm);
  }
  if (enemy) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.13, 0.58), new THREE.MeshBasicMaterial({ color: 0xffd166 })); band.position.y = 1.9; group.add(band); }
  return group;
}
export function spawnPedestrians(scene, random, roads, count = 38) {
  const pedestrians = [];
  for (let i = 0; i < count; i += 1) {
    const horizontal = random() > 0.5; const road = roads[Math.floor(random() * roads.length)];
    const side = random() > 0.5 ? 8.6 : -8.6; const along = -172 + random() * 344;
    const mesh = createPersonMesh(shirtColors[i % shirtColors.length], skinColors[i % skinColors.length]);
    mesh.position.set(horizontal ? along : road + side, 0, horizontal ? road + side : along);
    scene.add(mesh);
    pedestrians.push({
      mesh, position: mesh.position, yaw: horizontal ? Math.PI / 2 : 0, speed: 1.1 + random() * 1.1,
      horizontal, road, side, direction: random() > 0.5 ? 1 : -1, health: 100, state: 'walk', fleeTimer: 0,
      walkPhase: random() * 6, enemy: false, alive: true,
    });
  }
  return pedestrians;
}
export function updatePedestrians(pedestrians, delta, dangerPosition, colliders) {
  for (const pedestrian of pedestrians) {
    if (!pedestrian.alive) continue;
    if (dangerPosition && pedestrian.position.distanceTo(dangerPosition) < 11) { pedestrian.state = 'flee'; pedestrian.fleeTimer = 1.6; }
    if (pedestrian.fleeTimer > 0) pedestrian.fleeTimer -= delta; else if (pedestrian.state === 'flee') pedestrian.state = 'walk';
    let moveX = 0; let moveZ = 0; const speed = pedestrian.state === 'flee' ? 4.4 : pedestrian.speed;
    if (pedestrian.state === 'flee' && dangerPosition) {
      moveX = pedestrian.position.x - dangerPosition.x; moveZ = pedestrian.position.z - dangerPosition.z;
      const length = Math.hypot(moveX, moveZ) || 1; moveX /= length; moveZ /= length;
      pedestrian.yaw = Math.atan2(moveX, moveZ);
    } else if (pedestrian.horizontal) { moveX = pedestrian.direction; pedestrian.yaw = pedestrian.direction > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { moveZ = pedestrian.direction; pedestrian.yaw = pedestrian.direction > 0 ? 0 : Math.PI; }
    pedestrian.position.x += moveX * speed * delta; pedestrian.position.z += moveZ * speed * delta;
    if (pedestrian.position.x > WORLD.bound - 4 || pedestrian.position.x < -WORLD.bound + 4) pedestrian.direction *= -1;
    if (pedestrian.position.z > WORLD.coastZ + 36 || pedestrian.position.z < -WORLD.bound + 4) pedestrian.direction *= -1;
    pedestrian.position.x = clamp(pedestrian.position.x, -WORLD.bound + 2, WORLD.bound - 2); pedestrian.position.z = clamp(pedestrian.position.z, -WORLD.bound + 2, WORLD.coastZ + 44);
    resolveBuildingCollisions(pedestrian.position, 0.55, colliders);
    pedestrian.walkPhase += delta * (pedestrian.state === 'flee' ? 13 : 7);
    pedestrian.mesh.position.copy(pedestrian.position);
    pedestrian.mesh.position.y = Math.abs(Math.sin(pedestrian.walkPhase)) * 0.05;
    pedestrian.mesh.rotation.y = pedestrian.yaw;
  }
}
export function knockDownPedestrian(pedestrian, scene) {
  pedestrian.alive = false; pedestrian.health = 0;
  pedestrian.mesh.rotation.x = Math.PI / 2; pedestrian.mesh.position.y = 0.28;
  setTimeout(() => { scene.remove(pedestrian.mesh); }, 9000);
}
