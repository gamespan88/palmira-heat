// Rico Marín on foot: third-person movement, sprinting, simple collision and a responsive camera.
import * as THREE from 'three';
import { clamp } from './utils.js';
import { resolveBuildingCollisions } from './city.js';
import { createPersonMesh } from './pedestrians.js';

export function createPlayer(scene, start) {
  const mesh = createPersonMesh(0xff8c42, 0xe0ac69);
  mesh.position.set(start.x, 0, start.z); scene.add(mesh);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.62), new THREE.MeshStandardMaterial({ color: 0x191b20, roughness: 0.45, metalness: 0.5 }));
  gun.position.set(0.5, 1.22, 0.42); gun.visible = false; mesh.add(gun);
  return {
    mesh, gun, position: mesh.position, yaw: start.yaw, pitch: -0.08, health: 100, mode: 'foot', vehicle: null,
    walkPhase: 0, speedNow: 0,
    reset(position, yaw) { this.position.set(position.x, 0, position.z); this.yaw = yaw; this.health = 100; this.mode = 'foot'; this.vehicle = null; this.mesh.visible = true; },
    updateOnFoot(delta, input, cameraYaw, colliders) {
      const look = input.consumeLook();
      this.yaw -= look.x * 0.0024; this.pitch = clamp(this.pitch - look.y * 0.0018, -0.55, 0.5);
      const forward = (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0) - (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0);
      const strafe = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
      const sprint = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
      const speed = sprint ? 9.4 : 5.4;
      const sin = Math.sin(cameraYaw); const cos = Math.cos(cameraYaw);
      const moveX = (sin * forward + cos * strafe); const moveZ = (cos * forward - sin * strafe);
      const length = Math.hypot(moveX, moveZ) || 1;
      this.speedNow = (forward || strafe) ? speed : 0;
      if (forward || strafe) {
        this.position.x += (moveX / length) * speed * delta; this.position.z += (moveZ / length) * speed * delta;
        this.yaw = Math.atan2(moveX / length, moveZ / length);
        this.walkPhase += delta * (sprint ? 12 : 8.5);
      }
      resolveBuildingCollisions(this.position, 0.62, colliders);
      this.mesh.position.copy(this.position); this.mesh.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.045;
      this.mesh.rotation.y = this.yaw;
      return this.speedNow;
    },
    placeCamera(camera, delta, shake = 0) {
      const back = 7.2; const height = 3.1;
      const target = new THREE.Vector3(
        this.position.x - Math.sin(this.yaw) * back,
        height + Math.sin(-this.pitch) * 2,
        this.position.z - Math.cos(this.yaw) * back,
      );
      camera.position.lerp(target, 1 - Math.pow(0.0001, delta));
      if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake; }
      camera.lookAt(this.position.x, 1.45, this.position.z);
    },
  };
}
