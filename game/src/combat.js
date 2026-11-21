// Pistol combat: centre-screen hitscan, ammo, reloads, hit reactions and rival return fire in the finale.
import * as THREE from 'three';
import { knockDownPedestrian } from './pedestrians.js';

export function createCombat(audio, effects, wanted, onCrime) {
  const raycaster = new THREE.Raycaster(); raycaster.far = 85;
  const centre = new THREE.Vector2(0, 0);
  let cooldown = 0; let enemyFireTimer = 0;
  return {
    ammoInMagazine: 12, reserveAmmo: 72, reloadingUntil: 0,
    update(delta) { cooldown = Math.max(0, cooldown - delta); },
    reload(now) {
      if (this.ammoInMagazine >= 12 || this.reserveAmmo <= 0) return;
      const needed = Math.min(12 - this.ammoInMagazine, this.reserveAmmo);
      this.ammoInMagazine += needed; this.reserveAmmo -= needed; this.reloadingUntil = now + 0.65; audio.reload();
    },
    tryShoot(now, camera, player, pedestrians, scene) {
      if (cooldown > 0 || now < this.reloadingUntil || player.mode !== 'foot') return false;
      if (this.ammoInMagazine <= 0) { this.reload(now); return false; }
      cooldown = 0.19; this.ammoInMagazine -= 1;
      player.gun.visible = true;
      audio.gunshot(); wanted.commitCrime(15, 'Shots fired');
      const muzzlePosition = player.position.clone(); muzzlePosition.y = 1.35;
      effects.muzzle(muzzlePosition);
      raycaster.setFromCamera(centre, camera);
      let nearest = null; let nearestDistance = Infinity;
      for (const pedestrian of pedestrians) {
        if (!pedestrian.alive) continue;
        const box = new THREE.Box3().setFromObject(pedestrian.mesh);
        const hit = raycaster.ray.intersectBox(box, new THREE.Vector3());
        if (hit) { const distance = hit.distanceTo(raycaster.ray.origin); if (distance < nearestDistance) { nearest = pedestrian; nearestDistance = distance; } }
      }
      if (nearest) {
        nearest.health -= nearest.enemy ? 34 : 55;
        nearest.state = 'flee'; nearest.fleeTimer = 2;
        effects.sparks(nearest.position, nearest.enemy ? 5 : 3);
        if (nearest.health <= 0) { knockDownPedestrian(nearest, scene); onCrime(nearest.enemy ? 'Rival down' : 'Pedestrian down'); }
      }
      return true;
    },
    updateEnemyFire(delta, player, enemies, onPlayerHit) {
      enemyFireTimer -= delta;
      if (enemyFireTimer > 0) return;
      enemyFireTimer = 0.85;
      for (const enemy of enemies) {
        if (!enemy.alive || enemy.position.distanceTo(player.position) > 34) continue;
        effects.muzzle(enemy.position.clone().setY(1.35)); audio.gunshot();
        if (Math.random() > 0.38) onPlayerHit(4 + Math.random() * 5);
      }
    },
  };
}
