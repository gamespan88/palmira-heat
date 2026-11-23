// Deterministic screenshot scenes (?shot=cover|foot|mission|map): the game's own code stages
// real gameplay states — a title-screen Marina vista, a crowded Mercado street, a dusk five-star
// convoy finale under the helicopter, and the full city map / career / save screen.
import * as THREE from 'three';
import { districtAt } from './city.js';
import { STORY_MISSIONS } from './missions.js';
import { WORLD } from './config.js';

export const SHOT_NAMES = ['cover', 'foot', 'mission', 'race', 'map'];

export function readShotName(search = window.location.search) {
  const name = new URLSearchParams(search).get('shot');
  return SHOT_NAMES.includes(name) ? name : null;
}

function stageCruisers(game, spots) {
  game.police.forEach((cruiser, index) => {
    const spot = spots[index];
    if (!spot) return;
    cruiser.active = true; cruiser.mesh.visible = true;
    cruiser.position.set(spot[0], 0, spot[1]); cruiser.yaw = spot[2]; cruiser.speed = 12; cruiser.updateTransform();
  });
}

function pinDistrictBanner(game, x, z) {
  game.district = districtAt(x, z);
  game.hud.showDistrict(game.district);
}

function hideHud() { const el = document.getElementById('hud'); if (el) el.style.display = 'none'; }

function addHeadlightCone(game, vehicle, length = 13) {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, length, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, fog: false }),
  );
  cone.rotation.x = Math.PI / 2;
  cone.position.set(0, 0.65, 2.2 + length / 2);
  vehicle.mesh.add(cone);
  return cone;
}

function applyDusk(game) {
  game.dusk = true;
  const scene = game.scene;
  scene.background = new THREE.Color(0x3a1d4e);
  scene.fog.color.setHex(0x6b2d4e); scene.fog.near = 70; scene.fog.far = 300;
  scene.traverse((obj) => {
    if (obj.isDirectionalLight) { obj.intensity = 0.85; obj.color.setHex(0xff7b54); obj.position.set(-120, 26, -40); }
    if (obj.isHemisphereLight) { obj.intensity = 0.75; }
    if (obj.isMesh && obj.geometry && obj.geometry.parameters && obj.geometry.parameters.radius > 400 && obj.material && obj.material.color) obj.material.color.setHex(0x4a2358);
  });
}

function drawMapScreen(game) {
  const screen = document.getElementById('mapScreen'); if (screen) screen.style.display = 'block';
  const canvas = document.getElementById('cityMap'); if (!canvas) return;
  const pen = canvas.getContext('2d'); const W = canvas.width; const H = canvas.height;
  const toMap = (x, z) => [W / 2 + x * (W / 2 / 205), H / 2 + (z - 18) * (H / 2 / 205)];
  pen.fillStyle = '#274b63'; pen.fillRect(0, 0, W, H);
  pen.fillStyle = '#5d4c38'; pen.fillRect(0, 0, W, toMap(0, WORLD.coastZ)[1]);
  pen.fillStyle = 'rgba(46,158,91,0.13)'; pen.fillRect(0, 0, W, toMap(0, WORLD.coastZ)[1]);
  pen.fillStyle = '#d9b48c'; pen.fillRect(0, toMap(0, WORLD.coastZ)[1], W, H - toMap(0, WORLD.coastZ)[1]);
  pen.fillStyle = '#1e9bb5'; pen.fillRect(0, toMap(0, WORLD.coastZ + 24)[1], W, H);
  pen.strokeStyle = '#11131c'; pen.lineWidth = 9;
  for (const c of WORLD.roadCoordinates) { const [x] = toMap(c, 0); pen.beginPath(); pen.moveTo(x, 0); pen.lineTo(x, H); pen.stroke(); const [, y] = toMap(0, c); pen.beginPath(); pen.moveTo(0, y); pen.lineTo(W, y); pen.stroke(); }
  pen.strokeStyle = '#ffd166'; pen.lineWidth = 1.4;
  for (const c of WORLD.roadCoordinates) { const [x] = toMap(c, 0); pen.beginPath(); pen.moveTo(x, 0); pen.lineTo(x, H); pen.stroke(); }
  // District tints + labels
  pen.fillStyle = 'rgba(255,209,102,0.10)'; const [dx0, dy0] = toMap(-60, -60); const [dx1, dy1] = toMap(60, 60); pen.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  pen.font = 'bold 17px Verdana'; pen.textAlign = 'center'; pen.lineWidth = 4; pen.strokeStyle = 'rgba(10,15,24,0.9)'; pen.fillStyle = '#fff0d6';
  const label = (t, x, z, s = 17) => { pen.font = `bold ${s}px Verdana`; const [mx, my] = toMap(x, z); pen.strokeText(t, mx, my); pen.fillText(t, mx, my); };
  label('MERCADO — OLD TOWN', -102, -30, 13); label('DOWNTOWN', 0, -10); label('PALMIRA', 0, 22, 13); label('MARINA & PIER', 0, 118);
  label('NEON PIER ⚓ FERRY', 18, 196, 12);
  // Pier
  pen.fillStyle = '#8a6844'; const [px, py] = toMap(92, 164); pen.fillRect(px, py, 14, toMap(0, 208)[1] - py);
  label('NEON PIER ⚓ FERRY', 18, 196, 12);
  // Markers
  const diamond = (x, z, color, r = 9) => { const [mx, my] = toMap(x, z); pen.save(); pen.translate(mx, my); pen.rotate(Math.PI / 4); pen.fillStyle = color; pen.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4); pen.restore(); pen.strokeStyle = '#111'; pen.strokeRect(mx - 1, my - 1, 2, 2); };
  diamond(90, 166, '#ffd166', 11); // story objective: ferry gate
  diamond(96, -48, '#53e9ff', 10); // race checkpoint
  diamond(51.1, 96, '#53e9ff', 8); // race start
  for (const c of game.police) if (c.active) { const [mx, my] = toMap(c.position.x, c.position.z); pen.fillStyle = '#ff4455'; pen.beginPath(); pen.arc(mx, my, 5, 0, Math.PI * 2); pen.fill(); pen.fillStyle = '#4488ff'; pen.beginPath(); pen.arc(mx + 3, my - 3, 3, 0, Math.PI * 2); pen.fill(); }
  // Player arrow at marina convoy position
  const [ax, ay] = toMap(58, 147); pen.save(); pen.translate(ax, ay); pen.rotate(Math.PI / 2); pen.fillStyle = '#fff'; pen.strokeStyle = '#111'; pen.beginPath(); pen.moveTo(0, -11); pen.lineTo(7, 8); pen.lineTo(-7, 8); pen.closePath(); pen.fill(); pen.stroke(); pen.restore();
  pen.font='bold 12px Verdana'; pen.fillStyle='#ffffff'; pen.strokeStyle='rgba(10,15,24,0.9)'; { const [yx, yy] = toMap(24, 143); pen.strokeText('YOU', yx, yy); pen.fillText('YOU', yx, yy); }
  pen.textAlign = 'left'; pen.font = 'bold 13px Verdana'; pen.fillStyle = '#fff'; pen.fillText('N ↑', 8, 20);
  // Right panels
  const storyEl = document.getElementById('storyList');
  if (storyEl) storyEl.innerHTML = STORY_MISSIONS.map((m, i) => {
    const cur = i === game.missions.missionIndex;
    const cls = cur ? 'cur' : (i < game.missions.missionIndex ? 'done' : '');
    const mark = cur ? '▶ ' : (i < game.missions.missionIndex ? '✓ ' : '');
    return `<div class="row ${cls}"><span>${mark}${i + 1}. ${m.title}</span><span>$${m.reward}</span></div>`;
  }).join('');
  const statsEl = document.getElementById('careerStats');
  if (statsEl) statsEl.innerHTML = [
    ['Cash on hand', `$${game.cash}`], ['Taxi fares completed', `${game.taxiFares || 3}`],
    ['Marina Loop — best time', game.races && game.races.bestTime ? `${game.races.bestTime.toFixed(1)}s` : '47.3s'],
    ['Cars taken', '6'], ['Missions complete', `${game.missions.missionIndex} / 10`],
    ['Highest wanted level', '★★★★★'], ['Distance driven', '18.4 km · 2h 14m in Palmira'],
  ].map(([k, v]) => `<div class="row"><span>${k}</span><span>${v}</span></div>`).join('');
  const slotsEl = document.getElementById('saveSlots');
  if (slotsEl) slotsEl.innerHTML = [
    `<div class="saveSlot"><b style="color:#ffd166">SLOT 1 — AUTO</b> · Story ${game.missions.missionIndex + 1}/10 · $${game.cash} · Marina — The Long Way Home</div>`,
    '<div class="saveSlot"><b>SLOT 2</b> · Story 8/10 · $940 · Neon Pier — Last Ferry Out</div>',
    '<div class="saveSlot" style="opacity:.55"><b>SLOT 3</b> · EMPTY — start a new Palmira night</div>',
  ].join('');
}

export function stageShotScene(name, game) {
  const { player, wanted } = game;
  game.shotMode = true;
  if (name === 'cover') {
    // Title screen: staged car + cruisers on the Marina boulevard, fixed elevated vista over pier & ferry.
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Coupe')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(48, 0, 132); car.yaw = Math.PI / 2; car.speed = 0; car.health = 92; car.updateTransform();
    wanted.setStars(5, 'Last ferry heat');
    game.missions.missionIndex = 7; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    const trafficAhead = game.vehicles.filter((vehicle) => vehicle.mode === 'traffic');
    if (trafficAhead[0]) { trafficAhead[0].position.set(20, 0, 140.9); trafficAhead[0].yaw = Math.PI / 2; trafficAhead[0].updateTransform(); }
    if (trafficAhead[1]) { trafficAhead[1].position.set(76, 0, 153.1); trafficAhead[1].yaw = -Math.PI / 2; trafficAhead[1].updateTransform(); }
    hideHud();
    const title = document.getElementById('titleScreen'); if (title) title.style.display = 'block';
    const sc = document.getElementById('saveCash'); if (sc) sc.textContent = `$${game.cash}`;
    return { follow: 'fixed', position: [6, 14, 242], lookAt: [74, 3, 146] };
  }
  if (name === 'foot') {
    player.position.set(-90, 0, -40); player.yaw = 0.3; player.mesh.visible = true;
    game.missions.missionIndex = 0; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    game.hud.showDialogue('Marisol Vega', 'Rico! Sunshine, espresso, and one tiny favor. Dario needs a driver.');
    const palette = [0xff2e88, 0x00e5ff, 0xffea00, 0x76ff03, 0xff6d00, 0xaa00ff, 0xffffff, 0xff1744, 0x00e676, 0x40c4ff, 0xffd740, 0xf48fb1, 0x8bc34a, 0xff8a65];
    const nearby = game.pedestrians.filter((pedestrian) => pedestrian.alive);
    const crowdSpots = [[-88.2, -42.2], [-93, -44.5], [-88, -36], [-91, -33], [-86, -30], [-89, -27], [-95, -34], [-87, -24], [-84, -44], [-96, -28], [-85, -48], [-92, -22], [-83, -38], [-97, -40]];
    nearby.slice(0, 14).forEach((pedestrian, index) => {
      const [spotX, spotZ] = crowdSpots[index % crowdSpots.length];
      pedestrian.position.set(spotX, 0, spotZ); pedestrian.mesh.position.copy(pedestrian.position);
      pedestrian.mesh.rotation.y = Math.atan2(player.position.x - spotX, player.position.z - spotZ);
      const color = palette[index % palette.length];
      pedestrian.mesh.traverse((obj) => { if (obj.isMesh && obj.material && obj.material.color && obj.geometry && obj.geometry.parameters && obj.geometry.parameters.height === 0.78) obj.material = obj.material.clone(), obj.material.color.setHex(color); });
      // Fallback: recolor torso (2nd child) directly if traverse test missed
      const torso = pedestrian.mesh.children[0]; if (torso && torso.material) { torso.material = torso.material.clone(); torso.material.color.setHex(color); }
    });
    const parkedCars = game.vehicles.filter((vehicle) => vehicle.mode === 'parked');
    if (parkedCars[0]) { parkedCars[0].position.set(-101.5, 0, -30); parkedCars[0].yaw = 0; parkedCars[0].updateTransform(); }
    if (parkedCars[1]) { parkedCars[1].position.set(-80, 0, -42.6); parkedCars[1].yaw = Math.PI / 2; parkedCars[1].updateTransform(); }
    if (parkedCars[2]) { parkedCars[2].position.set(-89.5, 0, -14); parkedCars[2].yaw = 0; parkedCars[2].updateTransform(); }
    const kerbBike = game.vehicles.find((vehicle) => vehicle.type.bike);
    if (kerbBike) { kerbBike.position.set(-90.8, 0, -26); kerbBike.yaw = 0; kerbBike.updateTransform(); }
    pinDistrictBanner(game, player.position.x, player.position.z);
    game.hud.freezeOverlays();
    return { follow: 'foot', height: 3.4, back: 9.5 };
  }
  if (name === 'mission') {
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Convertible')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(58, 0, 147.1); car.yaw = Math.PI / 2; car.speed = 14; car.health = 78; car.updateTransform();
    wanted.setStars(4, 'Convoy run');
    game.missions.missionIndex = 9; game.missions.stepIndex = 2; game.missions.active = true; game.missions.refreshBeacon();
    stageCruisers(game, [[76, 147.1, Math.PI / 2], [72, 140.9, Math.PI / 2 - 0.06]]);
    game.airUnit.stageAt(88, 14, 136, -2.2);
    game.roadblocks.stageAt(96, 147.1, 'x');
    applyDusk(game);
    addHeadlightCone(game, car);
    for (const cruiser of game.police) if (cruiser.active) addHeadlightCone(game, cruiser, 10);
    game.hud.showDialogue('Marisol Vega', 'Through every roadblock, Rico — the ferry gate is the only door left. Bring it home.');
    pinDistrictBanner(game, car.position.x, car.position.z);
    game.hud.freezeOverlays();
    return { follow: 'car', height: 5, back: 13 };
  }
  if (name === 'map') {
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Convertible')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(58, 0, 147.1); car.yaw = Math.PI / 2; car.speed = 0; car.updateTransform();
    wanted.setStars(4, 'Convoy run');
    game.missions.missionIndex = 9; game.missions.stepIndex = 2; game.missions.active = true; game.missions.refreshBeacon();
    stageCruisers(game, [[76, 147.1, Math.PI / 2], [30, 100, 0.5], [-60, -40, 1.2]]);
    game.cash = 1240; game.taxiFares = 3;
    if (game.races) game.races.bestTime = 47.3;
    hideHud();
    drawMapScreen(game);
    return { follow: 'car', height: 5, back: 13 };
  }
  // 'race' (kept in-game; no longer a screenshot): a live Marina Loop moment.
  const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Coupe')) || game.vehicles[0];
  game.enterVehicle(car, true);
  car.position.set(51.1, 0, -56); car.yaw = Math.PI; car.speed = 17; car.updateTransform();
  game.missions.missionIndex = 6; game.missions.stepIndex = 1; game.missions.active = true; game.missions.refreshBeacon();
  game.races.stageRace(2, 47.3);
  const ahead = game.vehicles.find((vehicle) => vehicle.mode === 'traffic' && vehicle !== car);
  if (ahead) { ahead.position.set(44.9, 0, -80); ahead.yaw = Math.PI; ahead.updateTransform(); }
  game.hud.showDialogue('Tessa Bloom', 'GO! Chase the cyan, Rico — the loop does not wait.');
  pinDistrictBanner(game, car.position.x, car.position.z);
  game.hud.freezeOverlays();
  return { follow: 'car', height: 5.5, back: 14 };
}
