// Palmira PD air unit: a patrol helicopter that joins the chase at four stars and up,
// orbiting Rico with a searchlight that keeps police eyes on him from the sky.
import * as THREE from 'three';
import { PALETTE } from './config.js';

export function createAirUnit(scene) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: PALETTE.police, roughness: 0.42, metalness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: PALETTE.policeTrim, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9be7ff, roughness: 0.15, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.9, 5.6), paint); body.castShadow = true; group.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 1.6), glass); nose.position.set(0, -0.1, 3.2); group.add(nose);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 5.7), trim); stripe.position.y = -0.45; group.add(stripe);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 4.8), paint); tail.position.set(0, 0.25, -4.9); group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 0.9), trim); fin.position.set(0, 0.7, -7.1); group.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.28), trim); tailRotor.position.set(0.3, 0.7, -7.1); group.add(tailRotor);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 6), trim); mast.position.y = 1.25; group.add(mast);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.07, 0.65), new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.6 }));
  rotor.position.y = 1.62; group.add(rotor);
  for (const sideSign of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 4.4), trim); skid.position.set(sideSign * 1.35, -1.35, 0.2); group.add(skid);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), trim); strut.position.set(sideSign * 1.3, -1.0, 1.1); group.add(strut);
    const strutBack = strut.clone(); strutBack.position.z = -1.1; group.add(strutBack);
  }
  const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3344 }));
  beaconLight.position.set(0, 0.4, -7.1); group.add(beaconLight);
  const coneLength = 34;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(10.5, coneLength, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false, fog: false }),
  );
  cone.position.y = -coneLength / 2 - 1; group.add(cone);
  const spotlight = new THREE.SpotLight(0xfff2b0, 900, 70, 0.34, 0.65, 1.4);
  spotlight.position.set(0, -1, 0.6); group.add(spotlight); scene.add(spotlight.target);
  group.visible = false; scene.add(group);

  const unit = {
    group, position: group.position, active: false, staged: false, orbitAngle: 0, seesTarget: false,
    stageAt(x, y, z, yaw = 0) {
      this.staged = true; this.active = true; group.visible = true;
      group.position.set(x, y, z); group.rotation.y = yaw;
    },
    update(delta, elapsed, targetPosition, stars) {
      const shouldBeActive = stars >= 4;
      if (!this.staged) {
        if (shouldBeActive && !this.active) {
          this.active = true; group.visible = true;
          group.position.set(targetPosition.x + 30, 27, targetPosition.z - 30);
        } else if (!shouldBeActive && this.active) { this.active = false; group.visible = false; }
        if (this.active) {
          this.orbitAngle += delta * 0.22;
          const hoverX = targetPosition.x + Math.sin(this.orbitAngle) * 13;
          const hoverZ = targetPosition.z + Math.cos(this.orbitAngle) * 13;
          const follow = 1 - Math.pow(0.12, delta);
          group.position.x += (hoverX - group.position.x) * follow;
          group.position.z += (hoverZ - group.position.z) * follow;
          group.position.y = 25 + Math.sin(elapsed * 0.9) * 1.1;
          group.rotation.y = Math.atan2(targetPosition.x - group.position.x, targetPosition.z - group.position.z);
          group.rotation.z = Math.sin(elapsed * 0.7) * 0.05;
        }
      }
      if (this.active) {
        rotor.rotation.y += delta * 26;
        tailRotor.rotation.x += delta * 31;
        beaconLight.material.color.setHex(Math.floor(elapsed * 2.4) % 2 ? 0xff3344 : 0x551118);
        spotlight.target.position.copy(targetPosition);
        this.seesTarget = Math.hypot(targetPosition.x - group.position.x, targetPosition.z - group.position.z) < 74;
      } else this.seesTarget = false;
      return this.seesTarget;
    },
  };
  return unit;
}
