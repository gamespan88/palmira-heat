// Deterministic screenshot scenes (?shot=cover|foot|mission|race): the game's own code stages
// real gameplay states — a five-star chase under the helicopter, a Mercado crowd, the chapter-two
// convoy finale and a live Marina Loop race moment.
import { districtAt } from './city.js';

export const SHOT_NAMES = ['cover', 'foot', 'mission', 'race'];

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

export function stageShotScene(name, game) {
  const { player, wanted } = game;
  game.shotMode = true;
  if (name === 'cover') {
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Coupe')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(51.1, 0, -20); car.yaw = 0; car.speed = 13; car.updateTransform();
    wanted.setStars(5, 'Last ferry heat');
    game.missions.missionIndex = 7; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    stageCruisers(game, [[48.4, -26.2, 0.12], [53.8, -27.6, -0.12]]);
    game.airUnit.stageAt(45, 13.5, 4, 2.85);
    game.roadblocks.stageAt(48, 24, 'z');
    const trafficAhead = game.vehicles.filter((vehicle) => vehicle.mode === 'traffic');
    if (trafficAhead[0]) { trafficAhead[0].position.set(44.9, 0, 6); trafficAhead[0].yaw = 0; trafficAhead[0].updateTransform(); }
    if (trafficAhead[1]) { trafficAhead[1].position.set(51.1, 0, 44); trafficAhead[1].yaw = Math.PI; trafficAhead[1].updateTransform(); }
    const kerbBike = game.vehicles.find((vehicle) => vehicle.type.bike);
    if (kerbBike) { kerbBike.position.set(42.8, 0, -8); kerbBike.yaw = 0; kerbBike.updateTransform(); }
    game.hud.showDialogue('Marisol Vega', 'Vince put a price on you, Rico. The last ferry leaves from Neon Pier — MOVE.');
    pinDistrictBanner(game, car.position.x, car.position.z);
    game.hud.freezeOverlays();
    return { follow: 'car', height: 6.4, back: 16 };
  }
  if (name === 'foot') {
    player.position.set(-90, 0, -40); player.yaw = 0.3; player.mesh.visible = true;
    game.missions.missionIndex = 0; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    game.hud.showDialogue('Marisol Vega', 'Rico! Sunshine, espresso, and one tiny favor. Dario needs a driver.');
    const nearby = game.pedestrians.filter((pedestrian) => pedestrian.alive);
    const crowdSpots = [[-88.2, -42.2], [-93, -44.5], [-88, -36], [-91, -33], [-86, -30], [-89, -27], [-95, -34], [-87, -24]];
    nearby.slice(0, 8).forEach((pedestrian, index) => {
      const [spotX, spotZ] = crowdSpots[index % crowdSpots.length];
      pedestrian.position.set(spotX, 0, spotZ); pedestrian.mesh.position.copy(pedestrian.position);
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
    car.position.set(58, 0, 147.1); car.yaw = Math.PI / 2; car.speed = 14; car.updateTransform();
    wanted.setStars(4, 'Convoy run');
    game.missions.missionIndex = 9; game.missions.stepIndex = 2; game.missions.active = true; game.missions.refreshBeacon();
    stageCruisers(game, [[76, 147.1, Math.PI / 2], [72, 140.9, Math.PI / 2 - 0.06]]);
    game.airUnit.stageAt(88, 14, 136, -2.2);
    game.hud.showDialogue('Marisol Vega', 'Through every roadblock, Rico — the ferry gate is the only door left. Bring it home.');
    pinDistrictBanner(game, car.position.x, car.position.z);
    game.hud.freezeOverlays();
    return { follow: 'car', height: 5, back: 13 };
  }
  // 'race': a live Marina Loop moment — checkpoint 3 of 8 ahead, timer running, beacon lit.
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
