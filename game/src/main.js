// Palmira Heat orchestration: boot, menus, driving, stealing, collisions, capture, death and the loop.
import * as THREE from 'three';
import { CAST, LIMITS, PALETTE, PLAYER_START, WORLD } from './config.js';
import { clamp, createSeededRandom, distance2D } from './utils.js';
import { createInput } from './input.js';
import { createAudioEngine } from './audio.js';
import { buildCity, districtAt } from './city.js';
import { createEffects } from './effects.js';
import { spawnVehicleFleet, driveVehiclePhysics } from './vehicles.js';
import { spawnPedestrians, updatePedestrians, createPersonMesh, knockDownPedestrian } from './pedestrians.js';
import { createPlayer } from './player.js';
import { updateTraffic } from './traffic.js';
import { createPoliceFleet, createRoadblockSystem, updatePolice } from './police.js';
import { createWantedSystem } from './wanted.js';
import { createCombat } from './combat.js';
import { createMissionSystem, STORY_MISSIONS } from './missions.js';
import { createRaceSystem, RACE_START } from './races.js';
import { createAirUnit } from './airunit.js';
import { createHud } from './hud.js';
import { loadSavedGame, writeSavedGame, clearSavedGame } from './savegame.js';
import { readShotName, stageShotScene } from './shots.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
const scene = new THREE.Scene(); scene.background = new THREE.Color(PALETTE.sky);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 620);
const random = createSeededRandom(90210);
const city = buildCity(scene);
const effects = createEffects(scene);
const audio = createAudioEngine();
const input = createInput(canvas);
const hud = createHud();
const player = createPlayer(scene, PLAYER_START);
const vehicles = spawnVehicleFleet(scene, random, WORLD.roadCoordinates);
const pedestrians = spawnPedestrians(scene, random, WORLD.roadCoordinates, LIMITS.pedestrians);
const police = createPoliceFleet(scene);
const roadblocks = createRoadblockSystem(scene);
const airUnit = createAirUnit(scene);
const wanted = createWantedSystem();

const game = {
  scene, camera, player, vehicles, pedestrians, police, roadblocks, airUnit, wanted, hud, effects, audio,
  mode: 'menu', cash: 120, shotMode: false, shotCamera: null, elapsed: 0, shake: 0, district: '',
  cameraYaw: PLAYER_START.yaw, dangerPosition: null, saveData: loadSavedGame(),
  enterVehicle(vehicle, silent = false) {
    if (!vehicle) return;
    const wasTraffic = vehicle.mode === 'traffic';
    if (wasTraffic && !silent) {
      const driver = { mesh: createPersonMesh(0x74b9ff, 0xf1c27d), yaw: vehicle.yaw + Math.PI, speed: 2.2, horizontal: false, road: 0, side: 0, direction: 1, health: 100, state: 'flee', fleeTimer: 3, walkPhase: 0, enemy: false, alive: true };
      driver.mesh.position.set(vehicle.position.x + 2.2, 0, vehicle.position.z); driver.position = driver.mesh.position;
      scene.add(driver.mesh); pedestrians.push(driver);
      wanted.commitCrime(16, 'Car stolen in traffic');
      hud.showDialogue('Driver', 'Hey! That is my car! Somebody call Palmira PD!');
    } else if (vehicle.mode === 'parked' && !silent) wanted.commitCrime(9, 'Parked car stolen');
    vehicle.mode = 'player'; vehicle.driver = 'player'; vehicle.occupied = true;
    const rider = vehicle.mesh.getObjectByName('rider'); if (rider) rider.visible = true;
    player.mode = 'car'; player.vehicle = vehicle; player.mesh.visible = false;
    if (!silent) audio.click();
  },
  exitVehicle() {
    const vehicle = player.vehicle; if (!vehicle) return;
    const rider = vehicle.mesh.getObjectByName('rider'); if (rider) rider.visible = false;
    vehicle.mode = 'parked'; vehicle.driver = null; vehicle.speed = 0;
    player.mode = 'foot'; player.vehicle = null; player.mesh.visible = true;
    player.position.set(vehicle.position.x + 2.4, 0, vehicle.position.z + 0.5);
  },
  spawnShowdown() {
    const foes = [];
    for (const [x, z] of [[96, 198], [101, 190], [91, 194]]) {
      const mesh = createPersonMesh(0x8e2434, 0xe0ac69, true); mesh.position.set(x, 0, z); scene.add(mesh);
      const foe = { mesh, position: mesh.position, yaw: Math.PI, speed: 1.2, horizontal: false, road: 0, side: 0, direction: 1, health: 70, state: 'walk', fleeTimer: 0, walkPhase: 0, enemy: true, alive: true };
      pedestrians.push(foe); foes.push(foe);
    }
    return foes;
  },
  addCash(amount) { game.cash += amount; },
  saveGame() { writeSavedGame({ cash: game.cash, missionIndex: missions.missionIndex + (missions.stepIndex > 0 ? 0 : 0), storyComplete: missions.storyComplete, taxiFares: game.taxiFares, bestRaceTime: races.bestTime, player }); },
  taxiFares: 0,
};
const races = createRaceSystem(scene, {
  playerPosition: () => player.mode === 'car' && player.vehicle ? player.vehicle.position : player.position,
  playerMode: () => player.mode,
  addCash: (amount) => game.addCash(amount),
  showDialogue: (speaker, line) => hud.showDialogue(speaker, line),
  showMessage: (title, text) => hud.showMessage(title, text),
  playCompleteSound: () => audio.missionComplete(),
  playPickupSound: () => audio.pickup(),
  savedBestTime: () => game.saveData?.bestRaceTime || 0,
  saveGame: () => game.saveGame(),
});
game.races = races;
const combat = createCombat(audio, effects, wanted, (label) => { wanted.commitCrime(label === 'Rival down' ? 6 : 22, label); });
const missions = createMissionSystem(scene, {
  playerPosition: () => player.mode === 'car' && player.vehicle ? player.vehicle.position : player.position,
  playerMode: () => player.mode,
  wantedStars: () => wanted.stars,
  addCash: (amount) => game.addCash(amount),
  showDialogue: (speaker, line) => hud.showDialogue(speaker, line),
  showMessage: (title, text) => hud.showMessage(title, text),
  playCompleteSound: () => audio.missionComplete(),
  setWanted: (stars, label) => wanted.setStars(stars, label),
  spawnShowdown: () => game.spawnShowdown(),
  beginRace: () => races.startRace(true),
  raceComplete: () => races.consumeMissionFinish(),
  saveGame: () => game.saveGame(),
});
game.missions = missions;

function nearestVehicle(maxDistance = 4.4) {
  let best = null; let bestDistance = maxDistance;
  for (const vehicle of vehicles) { const distance = distance2D(player.position, vehicle.position); if (distance < bestDistance) { best = vehicle; bestDistance = distance; } }
  return best;
}
function nearestPedestrian(maxDistance = 3.4) {
  let best = null; let bestDistance = maxDistance;
  for (const pedestrian of pedestrians) { if (!pedestrian.alive || pedestrian.enemy) continue; const distance = distance2D(player.position, pedestrian.position); if (distance < bestDistance) { best = pedestrian; bestDistance = distance; } }
  return best;
}
function startGame(continueSave) {
  audio.unlock(); audio.click();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  hud.showGame(); game.mode = 'playing';
  if (continueSave && game.saveData) {
    game.cash = game.saveData.cash; missions.startStory(game.saveData.missionIndex, game.saveData.storyComplete);
    if (game.saveData.position) player.position.set(game.saveData.position.x, 0, game.saveData.position.z);
    hud.showMessage('WELCOME BACK', 'Your Palmira save was loaded from this device.');
  } else {
    clearSavedGame(); game.cash = 120; player.reset(PLAYER_START, PLAYER_START.yaw); missions.startStory(0, false);
  }
  if (!game.shotMode) input.lockPointer();
}
function endRun(kind) {
  game.mode = 'ended'; document.exitPointerLock?.();
  const isBusted = kind === 'busted';
  const fine = Math.min(game.cash, isBusted ? Math.round(game.cash * 0.12) + 25 : 40);
  game.cash -= fine; wanted.clear();
  document.getElementById('endTitle').textContent = isBusted ? 'BUSTED' : 'WASTED';
  document.getElementById('endText').textContent = isBusted
    ? `Palmira PD boxed Rico in. Bail and paperwork cost $${fine}. The city keeps spinning.`
    : `Rico woke up outside Brisa Clinic with a $${fine} bill and a spectacular headache.`;
  document.getElementById('endScreen').style.display = 'flex';
}
function respawn() {
  document.getElementById('endScreen').style.display = 'none';
  if (player.vehicle) game.exitVehicle();
  player.reset({ x: 102, z: -102 }, Math.PI); game.mode = 'playing'; game.saveGame();
  hud.showMessage('BACK IN PALMIRA', 'Wanted level cleared. Try to keep the sunshine side up.');
}
function togglePause() {
  if (game.mode === 'playing') {
    game.mode = 'paused'; document.exitPointerLock?.();
    document.getElementById('pauseStats').textContent = `${CAST.hero} — $${game.cash} · Story mission ${Math.min(missions.missionIndex + 1, STORY_MISSIONS.length)} of ${STORY_MISSIONS.length} · Taxi fares ${game.taxiFares}${races.bestTime ? ` · Marina Loop best ${races.bestTime.toFixed(1)}s` : ''}`;
    document.getElementById('pauseScreen').style.display = 'flex';
  } else if (game.mode === 'paused') {
    game.mode = 'playing'; document.getElementById('pauseScreen').style.display = 'none'; input.lockPointer();
  }
}
document.getElementById('newGameButton').addEventListener('click', () => startGame(false));
document.getElementById('continueButton').addEventListener('click', () => startGame(true));
document.getElementById('resumeButton').addEventListener('click', togglePause);
document.getElementById('saveButton').addEventListener('click', () => { game.saveGame(); audio.pickup(); hud.showMessage('SAVED', 'Cash, story progress and position saved on this device.'); });
document.getElementById('restartButton').addEventListener('click', () => { clearSavedGame(); game.saveData = null; document.getElementById('pauseScreen').style.display = 'none'; document.getElementById('startScreen').style.display = 'flex'; game.mode = 'menu'; });
document.getElementById('respawnButton').addEventListener('click', respawn);
if (!game.saveData) document.getElementById('continueButton').style.display = 'none';
canvas.addEventListener('click', () => { if (game.mode === 'playing' && !game.shotMode) { audio.unlock(); input.lockPointer(); } });
input.onPause = () => { if (game.mode === 'playing' || game.mode === 'paused') togglePause(); };
input.onReload = () => combat.reload(performance.now() / 1000);
input.onInteract = () => {
  if (game.mode !== 'playing') return;
  if (player.mode === 'car') game.exitVehicle();
  else { const vehicle = nearestVehicle(); if (vehicle) game.enterVehicle(vehicle); }
};
input.onTalk = () => {
  if (game.mode !== 'playing' || player.mode !== 'foot') return;
  const pedestrian = nearestPedestrian();
  if (pedestrian && missions.acceptTaxiFare(pedestrian, Math.random)) { game.taxiFares += 1; audio.pickup(); }
};

function damagePlayer(amount) {
  if (game.mode !== 'playing' || game.shotMode) return;
  player.health -= amount; game.shake = Math.max(game.shake, 0.25);
  if (player.health <= 0) endRun('wasted');
}
function checkVehicleCollisions(vehicle, delta) {
  for (const other of vehicles) {
    if (other === vehicle) continue;
    const distance = distance2D(vehicle.position, other.position);
    if (distance < 3.7) {
      const push = (3.7 - distance) / 2;
      const angle = Math.atan2(vehicle.position.x - other.position.x, vehicle.position.z - other.position.z);
      vehicle.position.x += Math.sin(angle) * push; vehicle.position.z += Math.cos(angle) * push;
      other.health -= Math.abs(vehicle.speed) * 0.8; vehicle.health -= Math.abs(vehicle.speed) * 0.55;
      if (Math.abs(vehicle.speed) > 5) { effects.sparks(vehicle.position, 7); audio.crash(Math.abs(vehicle.speed) / 18); game.shake = 0.5; wanted.commitCrime(4, 'Collision'); }
      vehicle.speed *= 0.55;
    }
  }
  for (const pedestrian of pedestrians) {
    if (!pedestrian.alive) continue;
    if (distance2D(vehicle.position, pedestrian.position) < 2.1 && Math.abs(vehicle.speed) > 2.5) {
      knockDownPedestrian(pedestrian, scene); wanted.commitCrime(30, 'Pedestrian hit'); vehicle.speed *= 0.45; damagePlayer(2);
      hud.showDialogue('Witness', 'He just ran somebody down! Call Palmira PD!');
    }
  }
  for (const block of roadblocks.blocks) {
    if (!block.active) continue;
    for (const obstacle of block.colliders) {
      if (Math.hypot(vehicle.position.x - obstacle.x, vehicle.position.z - obstacle.z) < 3.5 && Math.abs(vehicle.speed) > 3) {
        vehicle.health -= Math.abs(vehicle.speed) * 0.7; effects.sparks(vehicle.position, 8); audio.crash(1); game.shake = 0.6;
        wanted.commitCrime(6, 'Roadblock smashed');
        vehicle.speed *= -0.18;
      }
    }
  }
}
function updatePlayerVehicle(delta) {
  const vehicle = player.vehicle; if (!vehicle) return;
  if (game.shotMode) { player.position.copy(vehicle.position); player.yaw = vehicle.yaw; return; }
  const throttle = (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0) - (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0);
  const steering = (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0) - (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0);
  const beforeHealth = vehicle.health;
  driveVehiclePhysics(vehicle, throttle, steering, input.isDown('Space'), delta, city.colliders);
  if (vehicle.health < beforeHealth - 2) { audio.crash(0.8); game.shake = 0.55; }
  checkVehicleCollisions(vehicle, delta);
  if (Math.abs(vehicle.speed) > 12 && Math.random() > 0.86) { const back = new THREE.Vector3(vehicle.position.x - Math.sin(vehicle.yaw) * 2.2, 0.35, vehicle.position.z - Math.cos(vehicle.yaw) * 2.2); effects.smoke(back, 1); }
  if (vehicle.health < 38) effects.darkSmoke(vehicle.position, 1);
  player.position.copy(vehicle.position); player.yaw = vehicle.yaw;
  audio.setEngine(vehicle.speed / vehicle.type.speed, true);
  const backDistance = 10.2; const height = 4.1;
  const target = new THREE.Vector3(vehicle.position.x - Math.sin(vehicle.yaw) * backDistance, height, vehicle.position.z - Math.cos(vehicle.yaw) * backDistance);
  camera.position.lerp(target, 1 - Math.pow(0.000001, delta));
  if (game.shake > 0) { camera.position.x += (Math.random() - 0.5) * game.shake; camera.position.y += (Math.random() - 0.5) * game.shake * 0.6; }
  camera.lookAt(vehicle.position.x + Math.sin(vehicle.yaw) * 7, 1.4, vehicle.position.z + Math.cos(vehicle.yaw) * 7);
}

const shotName = readShotName();
let shotCameraSpec = null;
if (shotName) {
  document.getElementById('startScreen').style.display = 'none'; hud.showGame(); game.mode = 'playing';
  shotCameraSpec = stageShotScene(shotName, game);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('error', (event) => { window.__PALMIRA_ERRORS = [...(window.__PALMIRA_ERRORS || []), String(event.message || event.error)]; });

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, (now - lastTime) / 1000); lastTime = now;
  game.elapsed += delta;
  if (game.mode === 'playing') {
    combat.update(delta);
    if (player.mode === 'car') updatePlayerVehicle(delta);
    else {
      audio.setEngine(0, false);
      player.updateOnFoot(delta, input, player.yaw, city.colliders);
      if (input.mouseDown) combat.tryShoot(now / 1000, camera, player, pedestrians, scene);
      player.gun.visible = input.pointerLocked || game.shotMode;
      player.placeCamera(camera, delta, game.shake);
    }
    game.dangerPosition = (input.mouseDown || wanted.stars > 1) ? player.position : null;
    updateTraffic(vehicles, delta, Math.random, WORLD.roadCoordinates, player.vehicle, pedestrians, effects);
    updatePedestrians(pedestrians, delta, game.dangerPosition, city.colliders);
    if (!game.shotMode) {
      const seenByPolice = updatePolice(police, delta, wanted, player, city.colliders, effects, audio);
      roadblocks.update(delta, wanted, player);
      const seenByAirUnit = airUnit.update(delta, game.elapsed, player.position, wanted.stars);
      wanted.update(delta, seenByPolice || seenByAirUnit);
      missions.update(delta, game.elapsed);
      races.update(delta, game.elapsed);
      if (missions.currentStep()?.kind === 'shoot') combat.updateEnemyFire(delta, player, missions.enemies, damagePlayer);
      let nearestPolice = Infinity;
      for (const cruiser of police) if (cruiser.active) nearestPolice = Math.min(nearestPolice, distance2D(player.position, cruiser.position));
      const playerSpeed = player.mode === 'car' ? Math.abs(player.vehicle?.speed || 0) : player.speedNow;
      if (wanted.stars > 0 && nearestPolice < 6.6 && playerSpeed < 2.1) wanted.bustTimer += delta; else wanted.bustTimer = Math.max(0, wanted.bustTimer - delta * 1.6);
      if (wanted.bustTimer > 2.4) endRun('busted');
    }
    if (game.shotMode) airUnit.update(delta, game.elapsed, player.position, wanted.stars);
    const currentDistrict = districtAt(player.position.x, player.position.z);
    if (currentDistrict !== game.district) { game.district = currentDistrict; hud.showDistrict(currentDistrict); }
    const promptVehicle = player.mode === 'foot' ? nearestVehicle() : null;
    const promptPedestrian = player.mode === 'foot' ? nearestPedestrian() : null;
    const nearRaceStart = player.mode === 'car' && !races.active && races.finishCooldown <= 0 && distance2D(player.position, RACE_START) < 9;
    hud.setPrompt(player.mode === 'car' ? (nearRaceStart ? 'Marina Loop — drive through the gold ring to race · F — exit vehicle' : 'F — exit vehicle · Space — brake') : promptVehicle ? `F — ${promptVehicle.mode === 'parked' ? 'steal' : 'take'} ${promptVehicle.type.kind}` : promptPedestrian && !missions.taxi ? 'E — offer a taxi fare' : '');
    hud.update({
      objective: races.active ? races.statusText() : missions.objectiveText(), wantedText: wanted.starText(), cash: game.cash,
      player, vehicleName: player.vehicle ? player.vehicle.type.kind.toUpperCase() : '', ammo: combat.ammoInMagazine, reserveAmmo: combat.reserveAmmo,
      vehicles, police, heli: airUnit, enemies: missions.enemies, objectiveTarget: races.active ? races.currentTarget() : (missions.taxi?.target || missions.currentStep()?.target),
      vehicle: player.vehicle, wantedStars: wanted.stars, roadblocksActive: roadblocks.blocks.some((b) => b.active),
    });
    audio.updateMusic(delta, true);
    game.shake = Math.max(0, game.shake - delta * 1.7);
  }
  if (game.shotMode && shotCameraSpec) {
    if (shotCameraSpec.follow === 'fixed') {
      camera.position.set(shotCameraSpec.position[0], shotCameraSpec.position[1], shotCameraSpec.position[2]);
      camera.lookAt(shotCameraSpec.lookAt[0], shotCameraSpec.lookAt[1], shotCameraSpec.lookAt[2]);
    } else {
    const anchor = shotCameraSpec.follow === 'car' && player.vehicle ? player.vehicle : player;
    const yaw = anchor.yaw || 0; const side = shotCameraSpec.side || 0;
    camera.position.set(
      anchor.position.x - Math.sin(yaw) * shotCameraSpec.back + Math.cos(yaw) * side,
      shotCameraSpec.height,
      anchor.position.z - Math.cos(yaw) * shotCameraSpec.back - Math.sin(yaw) * side,
    );
    camera.lookAt(anchor.position.x + Math.sin(yaw) * 8, 1.5, anchor.position.z + Math.cos(yaw) * 8);
    }
  }
  city.update(delta, game.elapsed);
  effects.update(delta);
  renderer.render(scene, camera);
  window.__PALMIRA_READY = true;
}
requestAnimationFrame(animate);
window.__PALMIRA = game;
