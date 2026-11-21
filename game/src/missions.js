// Story missions and the repeatable Palmira taxi fare: objectives, beacons, dialogue and rewards.
import * as THREE from 'three';
import { CAST, WORLD } from './config.js';
import { distance2D } from './utils.js';

export const STORY_MISSIONS = [
  {
    title: 'First Favor', reward: 200,
    steps: [
      { kind: 'goto', target: { x: 54, z: 42 }, text: `Meet ${CAST.fixer} outside Café Sol`, speaker: CAST.fixer, line: 'Rico! Sunshine, espresso, and one tiny favor. Dario needs a driver who smiles at cameras and ignores questions.' },
      { kind: 'goto', target: { x: -90, z: -42 }, text: `Report to ${CAST.courierBoss} at Solstice Garage`, speaker: CAST.courierBoss, line: 'You showed up. Good. Palmira pays couriers who arrive whole and on time.' },
    ],
  },
  {
    title: 'Hot Package', reward: 350,
    steps: [
      { kind: 'goto', target: { x: -90, z: -42 }, text: 'Collect the sealed courier case at Solstice Garage', speaker: CAST.courierBoss, line: 'This case goes to Neon Pier. Do not open it, do not race it, and if Palmira PD notices — lose them.' },
      { kind: 'goto', target: { x: 96, z: 168 }, text: 'Deliver the case to Neon Pier — the heat is on', speaker: CAST.fixer, line: 'Half the pier can hear those sirens, Rico. Dock first, improvise later.', crime: 2 },
    ],
  },
  {
    title: 'Cool Down', reward: 300,
    steps: [
      { kind: 'escape', target: { x: -138, z: 96 }, text: 'Break police line of sight and let your wanted level cool to zero', speaker: CAST.mechanic, line: 'Tessa here. Ditch the obvious roads, let the stars die, then roll into my yard nice and boring.', crime: 3 },
      { kind: 'goto', target: { x: -138, z: 96 }, text: `Hide out at ${CAST.mechanic}'s yard`, speaker: CAST.mechanic, line: 'See? Boring is a superpower in this city.' },
    ],
  },
  {
    title: 'Neon Pier Showdown', reward: 650,
    steps: [
      { kind: 'goto', target: { x: 90, z: 166 }, text: 'Confront Vince Corallo at Neon Pier', speaker: CAST.rival, line: 'Marisol sends a courier to collect my pier? Cute. Boys — teach him Palmira manners.' },
      { kind: 'shoot', target: { x: 96, z: 192 }, text: 'Clear Vince Corallo\'s crew from the pier (pistol: mouse aim, click to fire)', speaker: CAST.fixer, line: 'Rico, whatever happens, that pier flies Marisol\'s flag by sunset.' },
    ],
  },
  {
    title: 'Clean Getaway', reward: 550,
    steps: [
      { kind: 'escape', target: { x: 138, z: -96 }, text: 'Lose the heat from the pier showdown, then reach Marisol\'s safehouse', speaker: CAST.fixer, line: 'That showdown woke up half of Palmira PD, Rico. Vanish — then get to my safehouse on the east side and stay vanished.', crime: 3 },
      { kind: 'goto', target: { x: 138, z: -96 }, text: 'Reach the safehouse on Palmira\'s east side', speaker: CAST.fixer, line: 'Quiet street, locked door, cold drinks. Dawn makes honest people of us all.' },
    ],
  },
  {
    title: 'Harbor Heist', reward: 700,
    steps: [
      { kind: 'goto', target: { x: 104, z: 148 }, text: `Collect the harbor strongbox from Captain ${CAST.harborMaster} at the marina warehouse`, speaker: CAST.harborMaster, line: 'One strongbox, Rico. Customs never stamped it, the ferry never logged it, and Vince\'s boys would pay dearly to hold it again.' },
      { kind: 'goto', target: { x: -90, z: -42 }, text: `Deliver the strongbox to ${CAST.courierBoss} at Solstice Garage`, speaker: CAST.courierBoss, line: 'Every light on the coast road is a cop tonight. Bring my box home whole and the harbor remembers you kindly.', crime: 2 },
    ],
  },
  {
    title: 'Street Crown', reward: 650,
    steps: [
      { kind: 'goto', target: { x: 54, z: 96 }, text: `Meet ${CAST.mechanic} at the Marina Loop race start`, speaker: CAST.mechanic, line: 'My coupe, your hands, one loop of Palmira. The street crown is a timer, Rico — beat the beacons and it is yours.' },
      { kind: 'race', target: { x: 51.1, z: 96 }, text: 'Win Tessa\'s Marina Loop checkpoint race', speaker: CAST.mechanic, line: 'Cyan beacons, full loop, no shortcuts through the Mercado. GO when the countdown dies!' },
    ],
  },
  {
    title: 'Last Ferry Out', reward: 1000,
    steps: [
      { kind: 'goto', target: { x: 90, z: 166 }, text: 'Reach the Neon Pier ferry gate — every road is watched', speaker: CAST.fixer, line: 'Vince put a price on the strongbox AND on you, Rico. The last ferry leaves from Neon Pier — I will be waiting with the engine running.', crime: 4 },
      { kind: 'goto', target: { x: 96, z: 204 }, text: 'Board the ferry at the end of Neon Pier', speaker: CAST.fixer, line: 'Run the planks, Rico! Palmira is beautiful from the water — and so is being alive.' },
    ],
  },
];

export function createMissionSystem(scene, hooks) {
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 26, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false }),
  );
  beacon.position.y = 13; scene.add(beacon);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; scene.add(ring);
  const system = {
    missionIndex: 0, stepIndex: 0, active: false, storyComplete: false, enemies: [], taxi: null, dialogueTimer: 0,
    currentMission() { return STORY_MISSIONS[this.missionIndex] || null; },
    currentStep() { const mission = this.currentMission(); return mission ? mission.steps[this.stepIndex] : null; },
    objectiveText() {
      if (this.taxi) return `TAXI FARE — Drive your passenger to the gold beacon (${Math.round(distance2D(hooks.playerPosition(), this.taxi.target))} m)`;
      const mission = this.currentMission(); const step = this.currentStep();
      if (!mission || !step) return this.storyComplete ? 'Free roam Palmira — taxi fares (E near a pedestrian), the Marina Loop race from the gold ring at the marina junction, or just explore' : 'Explore Palmira';
      return `MISSION ${this.missionIndex + 1} — ${mission.title.toUpperCase()}: ${step.text}`;
    },
    announceStep() {
      const step = this.currentStep(); if (!step) return;
      hooks.showDialogue(step.speaker, step.line);
      if (step.crime) hooks.setWanted(step.crime, 'Story heat');
      if (step.kind === 'shoot') this.enemies = hooks.spawnShowdown();
      if (step.kind === 'race') hooks.beginRace();
    },
    startStory(savedIndex = 0, savedComplete = false) {
      this.missionIndex = Math.min(Math.max(0, savedIndex), STORY_MISSIONS.length - 1); this.stepIndex = 0;
      this.storyComplete = savedComplete || savedIndex >= STORY_MISSIONS.length;
      this.active = !this.storyComplete;
      if (this.active) this.announceStep();
      this.refreshBeacon();
    },
    refreshBeacon() {
      const target = this.taxi?.target || this.currentStep()?.target;
      beacon.visible = ring.visible = Boolean(target);
      if (target) { beacon.position.x = target.x; beacon.position.z = target.z; ring.position.x = target.x; ring.position.z = target.z; }
    },
    completeStep() {
      const mission = this.currentMission(); if (!mission) return;
      this.stepIndex += 1;
      if (this.stepIndex >= mission.steps.length) {
        hooks.addCash(mission.reward); hooks.showMessage('MISSION COMPLETE', `${mission.title} — $${mission.reward} earned. Palmira remembers a reliable courier.`);
        hooks.playCompleteSound(); this.missionIndex += 1; this.stepIndex = 0;
        if (this.missionIndex >= STORY_MISSIONS.length) { this.storyComplete = true; this.active = false; hooks.showDialogue(CAST.fixer, 'The ferry horn, Rico — Palmira is ours from the water. Your name means something in this city now, and the Loop still needs a king. Free roam — you earned it.'); }
        else this.announceStep();
        hooks.saveGame();
      } else this.announceStep();
      this.refreshBeacon();
    },
    acceptTaxiFare(pedestrian, random) {
      if (this.taxi || !pedestrian?.alive) return false;
      const target = { x: WORLD.roadCoordinates[Math.floor(random() * WORLD.roadCoordinates.length)], z: [-144, -96, -48, 0, 48, 96, 132][Math.floor(random() * 7)] };
      this.taxi = { passenger: pedestrian, target, fare: 60 + Math.round(distance2D(pedestrian.position, target) * 1.4) };
      pedestrian.alive = false; pedestrian.mesh.visible = false;
      hooks.showDialogue('Passenger', `Take me across Palmira, driver — $${this.taxi.fare} if we arrive in one piece!`);
      this.refreshBeacon(); return true;
    },
    update(delta, elapsed) {
      beacon.material.opacity = 0.26 + Math.sin(elapsed * 3.2) * 0.1;
      ring.rotation.z += delta * 0.7;
      if (this.taxi) {
        if (hooks.playerMode() === 'car' && distance2D(hooks.playerPosition(), this.taxi.target) < 7) {
          hooks.addCash(this.taxi.fare); hooks.showMessage('FARE PAID', `Passenger delivered — $${this.taxi.fare}. Palmira Taxi thanks you.`); hooks.playCompleteSound();
          this.taxi.passenger.alive = true; this.taxi.passenger.mesh.visible = true;
          this.taxi.passenger.position.set(this.taxi.target.x + 3, 0, this.taxi.target.z + 3);
          this.taxi = null; hooks.saveGame(); this.refreshBeacon();
        }
        return;
      }
      const step = this.currentStep(); if (!step || !this.active) return;
      const playerPosition = hooks.playerPosition();
      if (step.kind === 'goto' && distance2D(playerPosition, step.target) < 6.2) this.completeStep();
      else if (step.kind === 'escape' && hooks.wantedStars() === 0) this.completeStep();
      else if (step.kind === 'race' && hooks.raceComplete()) this.completeStep();
      else if (step.kind === 'shoot' && this.enemies.length > 0 && this.enemies.every((enemy) => !enemy.alive)) this.completeStep();
    },
  };
  return system;
}
