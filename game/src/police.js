// Palmira Police Department: interceptors spawn at the city edge, pursue, ram and try to box Rico in.
import * as THREE from 'three';
import { CAR_TYPES } from './config.js';
import { clamp } from './utils.js';
import { makeVehicle } from './vehicles.js';
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
