// Deterministic screenshot scenes (?shot=cover|foot|mission|coast): the game's own code stages
// real gameplay states — a chase, a busy sidewalk, the pier showdown and a coastal drive.
export const SHOT_NAMES = ['cover', 'foot', 'mission', 'coast'];

export function readShotName(search = window.location.search) {
  const name = new URLSearchParams(search).get('shot');
  return SHOT_NAMES.includes(name) ? name : null;
}

export function stageShotScene(name, game) {
  const { player, wanted } = game;
  game.shotMode = true;
  if (name === 'cover') {
    const car = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Coupe')) || game.vehicles[0];
    game.enterVehicle(car, true);
    car.position.set(27.2, 0, 6); car.yaw = 0; car.speed = 13; car.updateTransform();
    wanted.setStars(4, 'Hot package chase');
    game.missions.missionIndex = 1; game.missions.stepIndex = 1; game.missions.active = true; game.missions.refreshBeacon();
    game.police.forEach((cruiser, index) => {
      if (index > 1) return;
      cruiser.active = true; cruiser.mesh.visible = true;
      cruiser.position.set(index === 0 ? 24.3 : 30.3, 0, index === 0 ? 1.8 : 0.4);
      cruiser.yaw = 0.1 * (index === 0 ? 1 : -1); cruiser.speed = 12; cruiser.updateTransform();
    });
    const trafficAhead = game.vehicles.filter((vehicle) => vehicle.mode === 'traffic');
    if (trafficAhead[0]) { trafficAhead[0].position.set(20.9, 0, 36); trafficAhead[0].yaw = 0; trafficAhead[0].updateTransform(); }
    if (trafficAhead[1]) { trafficAhead[1].position.set(27.4, 0, 62); trafficAhead[1].yaw = Math.PI; trafficAhead[1].updateTransform(); }
    game.hud.showDialogue('Marisol Vega', 'Half the pier can hear those sirens, Rico. Dock first, improvise later.');
    game.hud.freezeOverlays();
    return { follow: 'car', height: 6.4, back: 16 };
  }
  if (name === 'foot') {
    player.position.set(-17.5, 0, 38); player.yaw = -0.7; player.mesh.visible = true;
    game.missions.missionIndex = 0; game.missions.stepIndex = 0; game.missions.active = true; game.missions.refreshBeacon();
    game.hud.showDialogue('Marisol Vega', 'Rico! Sunshine, espresso, and one tiny favor. Dario needs a driver.');
    game.hud.freezeOverlays();
    const nearby = game.pedestrians.filter((pedestrian) => pedestrian.alive);
    nearby.slice(0, 4).forEach((pedestrian, index) => {
      pedestrian.position.set(-21 + index * 3.4, 0, 44 - index * 4.5); pedestrian.mesh.position.copy(pedestrian.position);
    });
    const passing = game.vehicles.find((vehicle) => vehicle.mode === 'traffic');
    if (passing) { passing.position.set(-27.2, 0, 58); passing.yaw = Math.PI; passing.updateTransform(); }
    return { follow: 'foot', height: 3.4, back: 8.4 };
  }
  if (name === 'mission') {
    player.position.set(70.8, 0, 133); player.yaw = 0.17; player.gun.visible = true; player.mesh.visible = true;
    wanted.setStars(2, 'Pier showdown');
    game.missions.missionIndex = 3; game.missions.stepIndex = 1; game.missions.active = true;
    game.missions.enemies = game.spawnShowdown();
    const foeSpots = [[69.5, 139.5], [75, 139], [72, 142.5]];
    game.missions.enemies.forEach((foe, index) => {
      const [foeX, foeZ] = foeSpots[index % foeSpots.length];
      foe.position.set(foeX, 0, foeZ); foe.mesh.position.set(foeX, 0, foeZ);
      foe.yaw = Math.PI + (index - 1) * 0.3; foe.speed = 0;
    });
    game.missions.refreshBeacon();
    game.hud.showDialogue('Vince Corallo', 'Marisol sends a courier to collect my pier? Boys — teach him Palmira manners.');
    game.hud.freezeOverlays();
    return { follow: 'foot', height: 3.1, back: 7.4, side: 1.1 };
  }
  const taxi = game.vehicles.find((vehicle) => vehicle.type.kind.includes('Taxi')) || game.vehicles[1];
  game.enterVehicle(taxi, true);
  taxi.position.set(75, 0, 92); taxi.yaw = 0.12; taxi.speed = 10; taxi.updateTransform();
  game.missions.missionIndex = 2; game.missions.stepIndex = 1; game.missions.active = true; game.missions.refreshBeacon();
  game.hud.showDialogue('Tessa Bloom', 'Coast road at golden hour, Rico. Palmira is showing off again.');
  game.hud.freezeOverlays();
  return { follow: 'car', height: 5, back: 12.5, side: 2.5 };
}
