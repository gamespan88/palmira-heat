// Palmira's people: low-poly walkers on sidewalks who stroll, chat, flee danger and can be hired as fares.
import * as THREE from 'three';
import { WORLD } from './config.js';
import { clamp } from './utils.js';
import { resolveBuildingCollisions } from './city.js';

const shirtColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e06c, 0xf78fb3, 0x74b9ff, 0xfdcb6e, 0xdfe6e9];
const skinColors = [0xf1c27d, 0xe0ac69, 0x8d5524, 0xffdbac, 0xc68642];
const hairColors = [0x241a12, 0x4a2c14, 0x8a5a2a, 0xd8c9a3, 0xb03a2e, 0x191924, 0xe8e2d4];
let personCount = 0;
// Jointed low-poly figure: pelvis, torso, head with a hair cap, and arms/legs that pivot
// at the shoulder/hip so the walk cycle swings real limbs instead of sliding a statue.
export function createPersonMesh(shirt = 0x4ecdc4, skin = 0xf1c27d, enemy = false) {
  const group = new THREE.Group();
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: enemy ? 0x8e2434 : shirt, roughness: 0.9 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85 });
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: enemy ? 0x1d1d24 : 0x2f405f, roughness: 1 });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColors[personCount++ % hairColors.length], roughness: 0.95 });
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1a20, roughness: 0.9 });
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.34), pantsMaterial); pelvis.position.y = 0.8; pelvis.castShadow = true; group.add(pelvis);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.36), shirtMaterial); torso.name = 'torso'; torso.position.y = 1.22; torso.castShadow = true; group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), skinMaterial); head.position.y = 1.82; head.castShadow = true; group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.275, 10, 6), hairMaterial); hair.scale.set(1, 0.62, 1); hair.position.y = 1.93; group.add(hair);
  const arms = []; const legs = []; const shirtMeshes = [torso];
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group(); armPivot.position.set(side * 0.45, 1.46, 0); group.add(armPivot);
    const armGeo = new THREE.BoxGeometry(0.15, 0.58, 0.18); armGeo.translate(0, -0.25, 0);
    const arm = new THREE.Mesh(armGeo, shirtMaterial); arm.castShadow = true; armPivot.add(arm); shirtMeshes.push(arm);
    const handGeo = new THREE.BoxGeometry(0.13, 0.16, 0.15); handGeo.translate(0, -0.6, 0);
    armPivot.add(new THREE.Mesh(handGeo, skinMaterial));
    armPivot.rotation.z = side * -0.07; arms.push(armPivot);
    const legPivot = new THREE.Group(); legPivot.position.set(side * 0.17, 0.72, 0); group.add(legPivot);
    const legGeo = new THREE.BoxGeometry(0.19, 0.68, 0.22); legGeo.translate(0, -0.32, 0);
    const leg = new THREE.Mesh(legGeo, pantsMaterial); leg.castShadow = true; legPivot.add(leg);
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.11, 0.34); shoeGeo.translate(0, -0.68, 0.05);
    legPivot.add(new THREE.Mesh(shoeGeo, shoeMaterial));
    legs.push(legPivot);
  }
  group.userData.limbs = { arms, legs };
  group.userData.shirtMeshes = shirtMeshes;
  if (enemy) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.13, 0.58), new THREE.MeshBasicMaterial({ color: 0xffd166 })); band.position.y = 1.98; group.add(band); }
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
    const limbs = pedestrian.mesh.userData.limbs;
    if (limbs) {
      const swing = Math.sin(pedestrian.walkPhase) * (pedestrian.state === 'flee' ? 0.8 : 0.5);
      limbs.legs[0].rotation.x = swing; limbs.legs[1].rotation.x = -swing;
      limbs.arms[0].rotation.x = -swing * 0.85; limbs.arms[1].rotation.x = swing * 0.85;
    }
    pedestrian.mesh.position.copy(pedestrian.position);
    pedestrian.mesh.position.y = Math.abs(Math.sin(pedestrian.walkPhase)) * 0.04;
    pedestrian.mesh.rotation.y = pedestrian.yaw;
  }
}
export function knockDownPedestrian(pedestrian, scene) {
  pedestrian.alive = false; pedestrian.health = 0;
  pedestrian.mesh.rotation.x = Math.PI / 2; pedestrian.mesh.position.y = 0.28;
  setTimeout(() => { scene.remove(pedestrian.mesh); }, 9000);
}
