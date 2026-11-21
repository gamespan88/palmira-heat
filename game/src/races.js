// Marina Loop street races: a repeatable checkpoint circuit through Palmira's road grid.
// Drive through the gold start ring in any car; cyan beacons mark each checkpoint in order.
import * as THREE from 'three';
import { distance2D } from './utils.js';

export const RACE_START = { x: 51.1, z: 96 };
export const RACE_CHECKPOINTS = [
  { x: 96, z: 48 }, { x: 96, z: -48 }, { x: 48, z: -96 }, { x: -48, z: -96 },
  { x: -96, z: -48 }, { x: -96, z: 48 }, { x: -48, z: 96 }, { x: 51.1, z: 96 },
];
const CHECKPOINT_RADIUS = 8.5;

export function createRaceSystem(scene, hooks) {
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.1, 26, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x53e9ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
  );
  beacon.position.y = 13; scene.add(beacon);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.17, 8, 28), new THREE.MeshBasicMaterial({ color: 0x53e9ff }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; scene.add(ring);
  const startRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  startRing.rotation.x = Math.PI / 2; startRing.position.set(RACE_START.x, 0.3, RACE_START.z); scene.add(startRing);

  function moveBeacon(target) {
    beacon.visible = ring.visible = Boolean(target);
    if (target) { beacon.position.x = target.x; beacon.position.z = target.z; ring.position.x = target.x; ring.position.z = target.z; }
  }
  const system = {
    phase: 'idle', checkpointIndex: 0, raceTime: 0, countdown: 0, bestTime: hooks.savedBestTime() || 0,
    missionRace: false, missionFinishedFlag: false, finishCooldown: 0,
    get active() { return this.phase === 'countdown' || this.phase === 'running'; },
    currentTarget() { return this.phase === 'running' ? RACE_CHECKPOINTS[this.checkpointIndex] : null; },
    statusText() {
      if (this.phase === 'countdown') return `MARINA LOOP — Race starts in ${Math.ceil(this.countdown)}…`;
      if (this.phase === 'running') return `MARINA LOOP — Checkpoint ${Math.min(this.checkpointIndex + 1, RACE_CHECKPOINTS.length)}/${RACE_CHECKPOINTS.length} · ${this.raceTime.toFixed(1)}s${this.bestTime ? ` · Best ${this.bestTime.toFixed(1)}s` : ''}`;
      return '';
    },
    startRace(forMission = false) {
      if (this.active) { if (forMission) this.missionRace = true; return forMission; }
      this.phase = 'countdown'; this.countdown = 3; this.raceTime = 0; this.checkpointIndex = 0;
      this.missionRace = forMission;
      hooks.showMessage('MARINA LOOP', forMission ? 'Tessa\'s crown race — hit every cyan beacon and bring her coupe home first.' : 'Checkpoint race — hit every cyan beacon. Cash scales with your time.');
      moveBeacon(null);
      return true;
    },
    consumeMissionFinish() { const done = this.missionFinishedFlag; this.missionFinishedFlag = false; return done; },
    finishRace() {
      const time = this.raceTime;
      const prize = Math.max(150, Math.round(640 - time * 3.2));
      this.phase = 'idle'; this.finishCooldown = 6; moveBeacon(null);
      if (!this.bestTime || time < this.bestTime) { this.bestTime = time; hooks.showMessage('NEW BEST TIME', `Marina Loop in ${time.toFixed(1)}s — $${prize} prize. The street remembers, Rico.`); }
      else hooks.showMessage('RACE COMPLETE', `Marina Loop in ${time.toFixed(1)}s (best ${this.bestTime.toFixed(1)}s) — $${prize} prize.`);
      hooks.addCash(prize); hooks.playCompleteSound();
      if (this.missionRace) this.missionFinishedFlag = true;
      this.missionRace = false;
      hooks.saveGame();
    },
    update(delta, elapsed) {
      beacon.material.opacity = 0.24 + Math.sin(elapsed * 3.4) * 0.1;
      ring.rotation.z += delta * 0.8;
      startRing.rotation.z -= delta * 0.5;
      startRing.visible = this.phase === 'idle';
      if (this.finishCooldown > 0) this.finishCooldown -= delta;
      if (this.phase === 'countdown') {
        this.countdown -= delta;
        if (this.countdown <= 0) { this.phase = 'running'; moveBeacon(RACE_CHECKPOINTS[0]); hooks.showDialogue('Tessa Bloom', 'GO! Chase the cyan, Rico — the loop does not wait.'); }
        return;
      }
      if (this.phase !== 'running') {
        if (this.phase === 'idle' && this.finishCooldown <= 0 && hooks.playerMode() === 'car' && distance2D(hooks.playerPosition(), RACE_START) < 3.4) this.startRace(false);
        return;
      }
      this.raceTime += delta;
      const target = RACE_CHECKPOINTS[this.checkpointIndex];
      if (target && distance2D(hooks.playerPosition(), target) < CHECKPOINT_RADIUS) {
        this.checkpointIndex += 1; hooks.playPickupSound();
        if (this.checkpointIndex >= RACE_CHECKPOINTS.length) this.finishRace();
        else moveBeacon(RACE_CHECKPOINTS[this.checkpointIndex]);
      }
    },
  };
  moveBeacon(null);
  return system;
}
