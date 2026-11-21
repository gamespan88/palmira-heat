// Palmira Police Department: interceptors spawn at the city edge, pursue, ram and try to box Rico in.
// At three stars and up, dispatch also stages roadblocks across the road ahead of a fleeing driver.
import * as THREE from 'three';
import { CAR_TYPES, WORLD } from './config.js';
import { clamp, nearestRoadCoordinate } from './utils.js';
import { createCarMesh, makeVehicle } from './vehicles.js';
import { resolveBuildingCollisions } from './city.js';

export function createPoliceFleet(scene) {
  const fleet = [];
  for (let i = 0; i < 5; i += 1) {
    const cruiser = makeVehicle(scene, CAR_TYPES[0], new THREE.Vector3(170 + i * 8, 0, 170), 0, 'police');
    cruiser.mesh.visible = false; cruiser.active = false; cruiser.speed = 0; fleet.push(cruiser);
  }
  return fleet;
}
export function updatePolice(fleet, delta, wanted, target, colliders, effects, audio) {
  const wantedCount = wanted.stars <= 0 ? 0 : Math.min(fleet.length, wanted.stars);
  let anySeesTarget = false;
  fleet.forEach((cruiser, index) => {
    const shouldBeActive = index < wantedCount;
    if (!shouldBeActive) { cruiser.active = false; cruiser.mesh.visible = false; return; }
    if (!cruiser.active) {
      cruiser.active = true; cruiser.mesh.visible = true;
      const angle = (index / Math.max(1, wantedCount)) * Math.PI * 2 + performance.now() * 0.0001;
      cruiser.position.set(target.position.x + Math.sin(angle) * 62, 0, target.position.z + Math.cos(angle) * 62);
      cruiser.yaw = Math.atan2(target.position.x - cruiser.position.x, target.position.z - cruiser.position.z);
      cruiser.speed = 8;
    }
    const toTargetX = target.position.x - cruiser.position.x; const toTargetZ = target.position.z - cruiser.position.z;
    const distance = Math.hypot(toTargetX, toTargetZ);
    if (distance < 58) anySeesTarget = true;
    const desiredYaw = Math.atan2(toTargetX, toTargetZ);
    let deltaYaw = desiredYaw - cruiser.yaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
    cruiser.yaw += clamp(deltaYaw, -1.85 * delta, 1.85 * delta);
    const topSpeed = 25 + wanted.stars * 2.1;
    cruiser.speed += clamp((distance > 9 ? topSpeed : 7) - cruiser.speed, -22 * delta, 13 * delta);
    const beforeX = cruiser.position.x; const beforeZ = cruiser.position.z;
    cruiser.position.x += Math.sin(cruiser.yaw) * cruiser.speed * delta;
    cruiser.position.z += Math.cos(cruiser.yaw) * cruiser.speed * delta;
    resolveBuildingCollisions(cruiser.position, 2.35, colliders);
    if (Math.hypot(cruiser.position.x - beforeX, cruiser.position.z - beforeZ) < cruiser.speed * delta * 0.35 && cruiser.speed > 8) {
      effects.sparks(cruiser.position, 5); audio.crash(0.5); cruiser.speed *= -0.25;
    }
    if (distance < 3.4 && target.mode === 'car') { target.vehicle.health -= 9 * delta; effects.sparks(target.position, 2); }
    const lightBar = cruiser.mesh.getObjectByName('lightBar');
    if (lightBar) lightBar.material.color.setHex(Math.floor(performance.now() / 220) % 2 ? 0xff3344 : 0x3377ff);
    cruiser.updateTransform();
  });
  if (wantedCount > 0) audio.siren(true, delta);
  return anySeesTarget;
}

const coneGeometry = new THREE.ConeGeometry(0.42, 1.05, 8);
const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.8 });

function buildRoadblockGroup(scene) {
  const group = new THREE.Group();
  const cruisers = [];
  for (const sideSign of [-1, 1]) {
    const cruiser = createCarMesh(CAR_TYPES[0], true);
    cruiser.position.set(sideSign * 2.6, 0, 0); cruiser.rotation.y = sideSign * 0.5;
    group.add(cruiser); cruisers.push(cruiser);
  }
  for (const offset of [-1.3, 0, 1.3]) {
    const cone = new THREE.Mesh(coneGeometry, coneMaterial); cone.position.set(offset, 0.52, 1.9); cone.castShadow = true; group.add(cone);
  }
  group.visible = false; scene.add(group);
  return { group, cruisers, active: false, age: 0, colliders: [{ x: 0, z: 0 }, { x: 0, z: 0 }] };
}

export function createRoadblockSystem(scene) {
  const blocks = [buildRoadblockGroup(scene), buildRoadblockGroup(scene), buildRoadblockGroup(scene)];
  let spawnTimer = 9;
  function placeBlock(block, x, z, axis) {
    block.group.position.set(x, 0, z);
    block.group.rotation.y = axis === 'z' ? 0 : Math.PI / 2;
    block.group.visible = true; block.active = true; block.age = 0;
    block.cruisers.forEach((cruiser, index) => {
      const local = index === 0 ? -2.6 : 2.6;
      const worldX = axis === 'z' ? x + local : x;
      const worldZ = axis === 'z' ? z : z + local;
      block.colliders[index].x = worldX; block.colliders[index].z = worldZ;
    });
  }
  return {
    blocks,
    stageAt(x, z, axis = 'z') {
      const block = blocks.find((candidate) => !candidate.active) || blocks[0];
      placeBlock(block, x, z, axis);
    },
    update(delta, wanted, target) {
      for (const block of blocks) {
        if (!block.active) continue;
        block.age += delta;
        const distance = Math.hypot(target.position.x - block.group.position.x, target.position.z - block.group.position.z);
        if (block.age > 30 || distance > 110) { block.active = false; block.group.visible = false; }
      }
      spawnTimer -= delta;
      if (spawnTimer > 0) return;
      spawnTimer = 13 + Math.random() * 6;
      if (wanted.stars < 3 || target.mode !== 'car' || !target.vehicle || Math.abs(target.vehicle.speed) < 6) return;
      const block = blocks.find((candidate) => !candidate.active);
      if (!block) return;
      const headingX = Math.sin(target.vehicle.yaw); const headingZ = Math.cos(target.vehicle.yaw);
      const aheadX = target.position.x + headingX * 58; const aheadZ = target.position.z + headingZ * 58;
      if (Math.abs(headingZ) >= Math.abs(headingX)) placeBlock(block, nearestRoadCoordinate(aheadX, WORLD.roadCoordinates), aheadZ, 'z');
      else placeBlock(block, aheadX, nearestRoadCoordinate(aheadZ, WORLD.roadCoordinates), 'x');
    },
  };
}
