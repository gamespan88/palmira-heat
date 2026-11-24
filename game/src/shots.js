// Deterministic screenshot scenes (?shot=cover|foot|mission|map): the game's own code stages
// real gameplay states — a title-screen Marina vista, a crowded Mercado street, a dusk five-star
// convoy finale under the helicopter, and the full city map / career / save screen.
import * as THREE from 'three';
import { districtAt } from './city.js';
import { STORY_MISSIONS } from './missions.js';
import { RANK_NAMES, WORLD } from './config.js';

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
  scene.fog.color.setHex(0x9a5570); scene.fog.near = 80; scene.fog.far = 340;
  scene.traverse((obj) => {
    if (obj.isDirectionalLight) { obj.intensity = 1.5; obj.color.setHex(0xff8a50); obj.position.set(-120, 42, -40); }
    if (obj.isHemisphereLight) { obj.intensity = 1.1; }
    if (obj.isMesh && obj.geometry && obj.geometry.parameters && obj.geometry.parameters.radius > 400 && obj.material && obj.material.color) obj.material.color.setHex(0x8a5a7a);
  });
}

// The pause-menu map, drawn like a real city map: Palmira Bay across the top, a sand
// band under it, then the tinted districts and city blocks of the 7×7 grid, with the
// story-jobs grid, completion ring and career panels filled in around it.
function drawMapScreen(game) {
  const screen = document.getElementById('mapScreen'); if (screen) screen.style.display = 'block';
  const canvas = document.getElementById('cityMap'); if (!canvas) return;
  const pen = canvas.getContext('2d'); const W = canvas.width; const H = canvas.height;
  const toMap = (x, z) => [W / 2 + x * (W / 2 / 205), H / 2 - (z - 18) * (H / 2 / 205)];
  // Sea, sand, land.
  const seaGrad = pen.createLinearGradient(0, 0, 0, 70);
  seaGrad.addColorStop(0, '#7fd4e8'); seaGrad.addColorStop(1, '#1d7fa8');
  pen.fillStyle = seaGrad; pen.fillRect(0, 0, W, toMap(0, 190)[1]);
  pen.fillStyle = '#f4cf8f'; pen.fillRect(0, toMap(0, 190)[1], W, toMap(0, 158)[1] - toMap(0, 190)[1]);
  pen.fillStyle = '#e6d3a3'; pen.fillRect(0, toMap(0, 158)[1], W, H - toMap(0, 158)[1]);
  // District tints.
  const tint = (x0, z0, x1, z1, style) => { const [ax, ay] = toMap(x0, z1); const [bx, by] = toMap(x1, z0); pen.fillStyle = style; pen.fillRect(ax, ay, bx - ax, by - ay); };
  tint(-205, -187, -60, 158, 'rgba(199,111,74,0.32)');
  tint(-60, -60, 60, 60, 'rgba(255,176,66,0.30)');
  tint(-205, 60, 205, 158, 'rgba(255,143,177,0.20)');
  tint(60, -187, 205, -60, 'rgba(93,168,95,0.25)');
  // City blocks with inner building plots.
  const roads = WORLD.roadCoordinates;
  for (let gx = 0; gx < roads.length - 1; gx += 1) for (let gz = 0; gz < roads.length - 1; gz += 1) {
    const [bx0, by0] = toMap(roads[gx] + 7, roads[gz + 1] - 7);
    const [bx1, by1] = toMap(roads[gx + 1] - 7, roads[gz] + 7);
    pen.fillStyle = 'rgba(122,90,58,0.27)'; pen.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    const hash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453) % 1;
    pen.fillStyle = 'rgba(122,90,58,0.3)';
    pen.fillRect(bx0 + 4, by0 + 4, (bx1 - bx0) * (0.3 + hash * 0.25), (by1 - by0) * 0.4);
    pen.fillRect(bx0 + (bx1 - bx0) * 0.55, by0 + (by1 - by0) * 0.52, (bx1 - bx0) * 0.36, (by1 - by0) * 0.38);
  }
  // Roads: pale bands with gold centre dashes.
  pen.strokeStyle = '#f7efdb';
  for (const c of roads) {
    const [x] = toMap(c, 0); pen.lineWidth = 15; pen.beginPath(); pen.moveTo(x, toMap(0, 158)[1]); pen.lineTo(x, H); pen.stroke();
    const [, y] = toMap(0, c); pen.lineWidth = 11; pen.beginPath(); pen.moveTo(0, y); pen.lineTo(W, y); pen.stroke();
  }
  pen.strokeStyle = '#e8a33a'; pen.lineWidth = 1.3; pen.setLineDash([6, 6]);
  for (const c of roads) { const [x] = toMap(c, 0); pen.beginPath(); pen.moveTo(x, toMap(0, 158)[1]); pen.lineTo(x, H); pen.stroke(); }
  pen.setLineDash([]);
  // The pier and its lighthouse.
  const [pierX, pierTop] = toMap(96, 210); const [, pierBase] = toMap(0, 160);
  pen.fillStyle = '#8a6844'; pen.fillRect(pierX - 4, pierTop, 8, pierBase - pierTop);
  pen.fillStyle = '#ff4455'; pen.fillRect(pierX - 2.5, pierTop - 7, 5, 7);
  pen.fillStyle = '#ffffff'; pen.fillRect(pierX - 2.5, pierTop - 3.5, 5, 2);
  // Labels.
  pen.textAlign = 'center'; pen.lineWidth = 4; pen.strokeStyle = 'rgba(10,15,24,0.85)'; pen.fillStyle = '#fff0d6';
  const label = (t, x, z, s = 16, fill = '#fff0d6') => { pen.font = `bold ${s}px Verdana`; pen.fillStyle = fill; const [mx, my] = toMap(x, z); pen.strokeText(t, mx, my); pen.fillText(t, mx, my); };
  pen.font = 'italic bold 17px Verdana'; pen.fillStyle = 'rgba(255,255,255,0.92)';
  { const [mx, my] = toMap(-40, 200); pen.fillText('P A L M I R A   B A Y', mx, my); }
  label('NEON PIER ⚓ FERRY', 138, 178, 11.5, '#ffd9ec');
  label('MARINA & PIER', -30, 104, 15);
  label('MERCADO — OLD TOWN', -128, -6, 12.5);
  label('DOWNTOWN', 0, 6, 16);
  label('PALMIRA', 128, -96, 13);
  // Markers.
  const diamond = (x, z, color, r = 9) => { const [mx, my] = toMap(x, z); pen.save(); pen.translate(mx, my); pen.rotate(Math.PI / 4); pen.fillStyle = color; pen.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4); pen.restore(); pen.strokeStyle = '#111'; pen.lineWidth = 1.4; pen.strokeRect(mx - 1, my - 1, 2, 2); };
  diamond(90, 166, '#ffd166', 11);
  diamond(96, -48, '#53e9ff', 10);
  diamond(51.1, 96, '#53e9ff', 8);
  for (const c of game.police) if (c.active) { const [mx, my] = toMap(c.position.x, c.position.z); pen.fillStyle = '#ff4455'; pen.beginPath(); pen.arc(mx, my, 5, 0, Math.PI * 2); pen.fill(); pen.fillStyle = '#4488ff'; pen.beginPath(); pen.arc(mx + 3, my - 3, 3, 0, Math.PI * 2); pen.fill(); }
  const [ax, ay] = toMap(58, 147); pen.save(); pen.translate(ax, ay); pen.fillStyle = '#fff'; pen.strokeStyle = '#111'; pen.beginPath(); pen.moveTo(0, -11); pen.lineTo(7, 8); pen.lineTo(-7, 8); pen.closePath(); pen.fill(); pen.stroke(); pen.restore();
  pen.font = 'bold 12px Verdana'; pen.fillStyle = '#ffffff'; pen.strokeStyle = 'rgba(10,15,24,0.9)'; pen.strokeText('YOU', ax - 34, ay + 16); pen.fillText('YOU', ax - 34, ay + 16);
  pen.textAlign = 'left'; pen.font = 'bold 13px Verdana'; pen.fillStyle = '#fff'; pen.fillText('N ↑', W - 34, 20);
  // Right rail: completion ring, cash, rank.
  const mission = STORY_MISSIONS[game.missions.missionIndex];
  const pct = Math.round(((game.missions.missionIndex + (game.missions.stepIndex + 1) / Math.max(1, mission ? mission.steps.length : 1)) / 10) * 100);
  const pctEl = document.getElementById('completePct'); if (pctEl) pctEl.textContent = `${pct}%`;
  const ringEl = document.getElementById('completeRingFg'); if (ringEl) ringEl.style.strokeDashoffset = `${(226.2 * (1 - pct / 100)).toFixed(1)}`;
  const cashEl = document.getElementById('mapCash'); if (cashEl) cashEl.textContent = `$${game.cash.toLocaleString('en-US')}`;
  const rankIndex = Math.min(RANK_NAMES.length - 1, Math.floor(game.missions.missionIndex / 2) + 1);
  const rankEl = document.getElementById('mapRank'); if (rankEl) rankEl.textContent = `RANK ${rankIndex + 1} · ${RANK_NAMES[rankIndex]}`;
  const clockEl = document.getElementById('mapClock'); if (clockEl) clockEl.textContent = 'FRI 17:42 · MARINA & PIER';
  // Story jobs grid.
  const storyEl = document.getElementById('storyList');
  if (storyEl) storyEl.innerHTML = STORY_MISSIONS.map((m, i) => {
    const cur = i === game.missions.missionIndex;
    const cls = cur ? 'cur' : (i < game.missions.missionIndex ? 'done' : '');
    const status = cur ? 'ACTIVE' : (i < game.missions.missionIndex ? 'DONE' : `$${m.reward.toLocaleString('en-US')}`);
    const district = districtAt(m.steps[0].target.x, m.steps[0].target.z).replace(' — OLD TOWN', '').replace(' PALMIRA', '');
    return `<div class="job ${cls}"><span class="jobNum">${i + 1}</span><div class="jobBody"><b>${m.title.toUpperCase()}</b><small>${m.steps[0].speaker} · ${district}</small></div><span class="jobStatus">${status}</span></div>`;
  }).join('');
  const statsEl = document.getElementById('careerStats');
  if (statsEl) statsEl.innerHTML = [
    ['Cash on hand', `$${game.cash.toLocaleString('en-US')}`], ['Taxi fares completed', `${game.taxiFares || 3}`],
    ['Marina Loop — best time', game.races && game.races.bestTime ? `${game.races.bestTime.toFixed(1)}s` : '47.3s'],
    ['Cars taken', '6'], ['Missions complete', `${game.missions.missionIndex} / 10`],
    ['Highest wanted level', '★★★★★'], ['Distance driven', '18.4 km · 2h 14m in Palmira'],
  ].map(([k, v]) => `<div class="row"><span>${k}</span><span>${v}</span></div>`).join('');
  const slotsEl = document.getElementById('saveSlots');
  if (slotsEl) slotsEl.innerHTML = [
    `<div class="saveSlot"><b style="color:#ffd166">SLOT 1 — AUTO</b> · Story ${game.missions.missionIndex + 1}/10 · $${game.cash.toLocaleString('en-US')} · Marina — The Long Way Home</div>`,
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
    applyDusk(game);
    // The hero coupe parked in the title foreground, rear three-quarter to the camera.
    const heroCar = game.vehicles.find((vehicle) => vehicle.mode === 'traffic' && vehicle.type.kind.includes('Coupe'));
    if (heroCar) { heroCar.position.set(26, 0, 196); heroCar.yaw = 2.6; heroCar.speed = 0; heroCar.updateTransform(); }
    hideHud();
    const title = document.getElementById('titleScreen'); if (title) title.style.display = 'block';
    const sc = document.getElementById('saveCash'); if (sc) sc.textContent = `$${game.cash}`;
    // The Save Files panel reflects Rico's real story progress.
    const storyPct = Math.round(((game.missions.missionIndex + 1) / 10) * 100);
    const sfPct = document.getElementById('sf1Pct'); if (sfPct) sfPct.textContent = `${storyPct}%`;
    const sfRing = document.getElementById('sf1Ring'); if (sfRing) sfRing.style.strokeDashoffset = `${(106.8 * (1 - storyPct / 100)).toFixed(1)}`;
    const sfTitle = document.getElementById('sf1Title'); if (sfTitle) sfTitle.textContent = `${game.missions.missionIndex + 1} · ${STORY_MISSIONS[game.missions.missionIndex].title.toUpperCase()}`;
    return { follow: 'fixed', position: [6, 14, 242], lookAt: [74, 3, 146] };
  }
  if (name === 'foot') {
    player.position.set(-86.5, 0, -36); player.yaw = 0.3; player.mesh.visible = true;
    game.missions.missionIndex = 0; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    game.hud.showDialogue('Marisol Vega', 'Rico! Sunshine, espresso, and one tiny favor. Dario needs a driver.');
    const palette = [0xff2e88, 0x00e5ff, 0xffea00, 0x76ff03, 0xff6d00, 0xaa00ff, 0xffffff, 0xff1744, 0x00e676, 0x40c4ff, 0xffd740, 0xf48fb1, 0x8bc34a, 0xff8a65];
    const nearby = game.pedestrians.filter((pedestrian) => pedestrian.alive);
    const crowdSpots = [[-88.2, -42.2], [-98.5, -37], [-88, -36], [-91, -33], [-86, -30], [-89, -27], [-95, -34], [-87, -24], [-84, -44], [-96, -28], [-85, -48], [-92, -22], [-83, -38], [-97, -40]];
    nearby.slice(0, 14).forEach((pedestrian, index) => {
      const [spotX, spotZ] = crowdSpots[index % crowdSpots.length];
      pedestrian.speed = 0; // staged crowd holds its marks for the camera
      pedestrian.position.set(spotX, 0, spotZ); pedestrian.mesh.position.copy(pedestrian.position);
      pedestrian.mesh.rotation.y = Math.atan2(player.position.x - spotX, player.position.z - spotZ);
      const shirtMaterial = new THREE.MeshStandardMaterial({ color: palette[index % palette.length], roughness: 0.9 });
      (pedestrian.mesh.userData.shirtMeshes || []).forEach((mesh) => { mesh.material = shirtMaterial; });
    });
    // A Corallo runner Rico already put down, sprawled across the asphalt as a warning.
    const downed = nearby[14];
    if (downed) {
      downed.alive = false;
      downed.position.set(-87.5, 0, -30.5); downed.mesh.position.set(-87.5, 0.28, -30.5);
      downed.mesh.rotation.set(Math.PI / 2, 0, 0.7);
      const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x8e2434, roughness: 0.9 });
      (downed.mesh.userData.shirtMeshes || []).forEach((mesh) => { mesh.material = shirtMaterial; });
    }
    // Rico aims down the street, pistol raised; one bystander throws both hands up.
    const playerLimbs = player.mesh.userData.limbs;
    if (playerLimbs) { playerLimbs.arms[1].rotation.x = -1.35; playerLimbs.arms[0].rotation.x = -0.35; }
    const waver = nearby[3];
    if (waver && waver.mesh.userData.limbs) { waver.mesh.userData.limbs.arms[0].rotation.z = 2.7; waver.mesh.userData.limbs.arms[1].rotation.z = -2.7; }
    const parkedCars = game.vehicles.filter((vehicle) => vehicle.mode === 'parked');
    if (parkedCars[0]) { parkedCars[0].position.set(-101.5, 0, -30); parkedCars[0].yaw = 0; parkedCars[0].updateTransform(); }
    if (parkedCars[1]) { parkedCars[1].position.set(-80, 0, -42.6); parkedCars[1].yaw = Math.PI / 2; parkedCars[1].updateTransform(); }
    if (parkedCars[2]) { parkedCars[2].position.set(-89.5, 0, -14); parkedCars[2].yaw = 0; parkedCars[2].updateTransform(); }
    const kerbBike = game.vehicles.find((vehicle) => vehicle.type.bike);
    if (kerbBike) { kerbBike.position.set(-90.8, 0, -26); kerbBike.yaw = 0; kerbBike.updateTransform(); }
    pinDistrictBanner(game, player.position.x, player.position.z);
    game.hud.freezeOverlays();
    return { follow: 'foot', height: 3.4, back: 9, side: 3 };
  }
  if (name === 'mission') {
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Coupe')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(58, 0, 147.1); car.yaw = Math.PI / 2; car.speed = 14; car.updateTransform();
    car.health = 78;
    wanted.setStars(4, 'Convoy run');
    game.missions.missionIndex = 9; game.missions.stepIndex = 2; game.missions.active = true; game.missions.refreshBeacon();
    stageCruisers(game, [[76, 147.1, Math.PI / 2], [72, 140.9, Math.PI / 2 - 0.06]]);
    game.airUnit.stageAt(80, 10.5, 141.5, -2.2);
    game.roadblocks.stageAt(96, 147.1, 'x');
    game.roadblocks.stageAt(122, 140.9, 'x');
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
