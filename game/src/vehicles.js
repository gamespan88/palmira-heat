// Vehicle factory and arcade car physics: sedans, taxis, trucks, coupes, police interceptors and the Vela Moto bike.
import * as THREE from 'three';
import { BIKE_TYPE, CAR_TYPES, LIMITS, PALETTE } from './config.js';
import { clamp } from './utils.js';
import { resolveBuildingCollisions } from './city.js';
import { createPersonMesh } from './pedestrians.js';

const bodyGeometry = new THREE.BoxGeometry(2.05, 0.72, 4.35);
const cabinGeometry = new THREE.BoxGeometry(1.78, 0.62, 2.05);
const wheelGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x17181d, roughness: 0.9 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x9be7ff, roughness: 0.18, metalness: 0.35 });
const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xff3344 });

function addBox(group, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh;
}
export function createCarMesh(type, isPolice = false) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: isPolice ? PALETTE.police : type.color, roughness: 0.38, metalness: 0.28 });
  const body = addBox(group, bodyGeometry, paint, 0, 0.62, 0);
  if (type.kind.includes('Truck')) { body.scale.set(1.12, 1.25, 1.28); addBox(group, new THREE.BoxGeometry(2.25, 1.5, 2.7), new THREE.MeshStandardMaterial({ color: 0xf0eadc }), 0, 1.35, -1.25); }
  else if (type.kind.includes('Pickup')) {
    addBox(group, cabinGeometry, glassMaterial, 0, 1.18, 0.95);
    const bedMaterial = new THREE.MeshStandardMaterial({ color: 0x8a4a38, roughness: 0.8 });
    addBox(group, new THREE.BoxGeometry(2.0, 0.5, 0.18), bedMaterial, 0, 0.95, -2.05);
    addBox(group, new THREE.BoxGeometry(0.18, 0.5, 2.1), bedMaterial, -0.95, 0.95, -1.05);
    addBox(group, new THREE.BoxGeometry(0.18, 0.5, 2.1), bedMaterial, 0.95, 0.95, -1.05);
    addBox(group, new THREE.BoxGeometry(1.5, 0.55, 1.6), new THREE.MeshStandardMaterial({ color: 0xb47a45, roughness: 1 }), 0, 0.95, -1.15);
  }
  else if (type.kind.includes('Convertible')) {
    const openCabin = addBox(group, cabinGeometry, glassMaterial, 0, 0.98, -0.18);
    openCabin.scale.set(0.96, 0.42, 0.9);
    addBox(group, new THREE.BoxGeometry(1.7, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0x24122e, roughness: 0.9 }), 0, 0.92, -1.35);
  }
  else {
    const cabin = addBox(group, cabinGeometry, glassMaterial, 0, 1.18, -0.18);
    if (type.kind.includes('Coupe')) cabin.scale.set(0.94, 0.82, 0.82);
  }
  if (type.kind.includes('Taxi')) addBox(group, new THREE.BoxGeometry(1.0, 0.28, 0.5), new THREE.MeshBasicMaterial({ color: 0x24122e }), 0, 1.62, -0.15);
  if (isPolice) {
    addBox(group, new THREE.BoxGeometry(2.1, 0.2, 4.4), new THREE.MeshStandardMaterial({ color: PALETTE.policeTrim }), 0, 0.98, 0);
    const lightBar = addBox(group, new THREE.BoxGeometry(1.35, 0.2, 0.42), new THREE.MeshBasicMaterial({ color: 0xff3344 }), 0, 1.62, -0.15);
    lightBar.name = 'lightBar';
    addBox(group, new THREE.BoxGeometry(0.62, 0.2, 0.42), new THREE.MeshBasicMaterial({ color: 0x3377ff }), -0.68, 1.62, -0.15);
  }
  for (const [x, z] of [[-1.02, 1.42], [1.02, 1.42], [-1.02, -1.42], [1.02, -1.42]]) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.38, z); wheel.castShadow = true; group.add(wheel);
  }
  addBox(group, new THREE.BoxGeometry(0.34, 0.16, 0.06), lightMaterial, -0.62, 0.68, 2.19);
  addBox(group, new THREE.BoxGeometry(0.34, 0.16, 0.06), lightMaterial, 0.62, 0.68, 2.19);
  addBox(group, new THREE.BoxGeometry(0.34, 0.16, 0.06), tailMaterial, -0.62, 0.68, -2.19);
  addBox(group, new THREE.BoxGeometry(0.34, 0.16, 0.06), tailMaterial, 0.62, 0.68, -2.19);
  return group;
}

const bikeWheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.11, 12);
const bikeFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x24122e, roughness: 0.6, metalness: 0.4 });
export function createBikeMesh(type) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.35, metalness: 0.3 });
  addBox(group, new THREE.BoxGeometry(0.3, 0.26, 1.15), paint, 0, 0.58, 0.12);
  addBox(group, new THREE.BoxGeometry(0.34, 0.2, 0.72), bikeFrameMaterial, 0, 0.8, -0.42);
  addBox(group, new THREE.BoxGeometry(0.12, 0.62, 0.14), bikeFrameMaterial, 0, 0.62, 0.86).rotation.x = -0.28;
  addBox(group, new THREE.BoxGeometry(0.58, 0.07, 0.09), bikeFrameMaterial, 0, 0.98, 0.8);
  addBox(group, new THREE.BoxGeometry(0.3, 0.14, 0.06), lightMaterial, 0, 0.72, 0.97);
  addBox(group, new THREE.BoxGeometry(0.26, 0.1, 0.05), tailMaterial, 0, 0.78, -0.82);
  for (const z of [0.82, -0.82]) {
    const wheel = new THREE.Mesh(bikeWheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; wheel.position.set(0, 0.34, z); wheel.castShadow = true; group.add(wheel);
  }
  const rider = createPersonMesh(0xff8c42, 0xe0ac69);
  rider.name = 'rider'; rider.position.set(0, 0.44, -0.18); rider.visible = false; group.add(rider);
  return group;
}

export function makeVehicle(scene, type, position, yaw, mode) {
  const mesh = type.bike ? createBikeMesh(type) : createCarMesh(type, mode === 'police');
  mesh.position.copy(position); mesh.rotation.y = yaw; scene.add(mesh);
  return {
    type, mesh, mode, position: mesh.position, yaw, speed: 0, steering: 0,
    health: 100, driver: null, occupied: mode !== 'parked', routeAxis: Math.abs(Math.sin(yaw)) > 0.5 ? 'z' : 'x',
    routeDirection: Math.cos(yaw) >= 0 ? 1 : -1, laneOffset: 3.1, waitTimer: 0, smokeTimer: 0,
    updateTransform() { this.mesh.position.copy(this.position); this.mesh.rotation.y = this.yaw; },
  };
}
export function spawnVehicleFleet(scene, random, roads) {
  const vehicles = [];
  const pickRoad = () => roads[Math.floor(random() * roads.length)];
  for (let i = 0; i < LIMITS.trafficCars; i += 1) {
    const type = CAR_TYPES[i % CAR_TYPES.length];
    const along = -168 + random() * 336;
    const horizontal = random() > 0.5;
    const direction = random() > 0.5 ? 1 : -1;
    const position = horizontal ? new THREE.Vector3(along, 0, pickRoad() + direction * 3.1) : new THREE.Vector3(pickRoad() + direction * 3.1, 0, along);
    const yaw = horizontal ? (direction > 0 ? Math.PI / 2 : -Math.PI / 2) : (direction > 0 ? 0 : Math.PI);
    const vehicle = makeVehicle(scene, type, position, yaw, 'traffic');
    vehicle.routeAxis = horizontal ? 'x' : 'z'; vehicle.routeDirection = direction; vehicle.speed = 7 + random() * 6; vehicle.occupied = true;
    vehicles.push(vehicle);
  }
  for (let i = 0; i < LIMITS.parkedCars; i += 1) {
    const type = CAR_TYPES[Math.floor(random() * CAR_TYPES.length)];
    const road = pickRoad(); const along = -172 + random() * 344;
    const side = random() > 0.5 ? 5.4 : -5.4;
    const horizontal = random() > 0.5;
    const position = horizontal ? new THREE.Vector3(along, 0, road + side) : new THREE.Vector3(road + side, 0, along);
    vehicles.push(makeVehicle(scene, type, position, horizontal ? Math.PI / 2 : 0, 'parked'));
  }
  // Vela Moto bikes wait at the kerb near the places Rico works: Mercado, the race start, the marina, Downtown.
  const bikeSpots = [[-101.4, -36, 0], [58, 101.4, Math.PI / 2], [101.4, 140, 0], [5.4, 20, 0], [-149.4, -20, 0]];
  for (const [x, z, yaw] of bikeSpots) vehicles.push(makeVehicle(scene, BIKE_TYPE, new THREE.Vector3(x, 0, z), yaw, 'parked'));
  return vehicles;
}
export function driveVehiclePhysics(vehicle, throttle, steeringInput, brake, delta, colliders) {
  const maxForward = vehicle.type.speed; const maxReverse = 8;
  if (throttle > 0) vehicle.speed += vehicle.type.acceleration * throttle * delta;
  else if (throttle < 0) vehicle.speed += vehicle.type.acceleration * 0.62 * throttle * delta;
  else vehicle.speed -= Math.sign(vehicle.speed) * Math.min(Math.abs(vehicle.speed), 5.5 * delta);
  if (brake) vehicle.speed -= Math.sign(vehicle.speed) * Math.min(Math.abs(vehicle.speed), 26 * delta);
  vehicle.speed = clamp(vehicle.speed, -maxReverse, maxForward);
  vehicle.steering = clamp(steeringInput, -1, 1);
  const speedRatio = vehicle.speed / maxForward;
  const turnRate = vehicle.type.bike ? 2.15 : 1.55;
  vehicle.yaw += vehicle.steering * delta * turnRate * Math.sign(vehicle.speed || 1) * Math.min(1, Math.abs(speedRatio) + 0.22);
  const beforeX = vehicle.position.x; const beforeZ = vehicle.position.z;
  vehicle.position.x += Math.sin(vehicle.yaw) * vehicle.speed * delta;
  vehicle.position.z += Math.cos(vehicle.yaw) * vehicle.speed * delta;
  resolveBuildingCollisions(vehicle.position, vehicle.type.bike ? 1.15 : 2.35, colliders);
  const impact = Math.hypot(vehicle.position.x - beforeX, vehicle.position.z - beforeZ) < Math.abs(vehicle.speed * delta) * 0.42 && Math.abs(vehicle.speed) > 7;
  if (impact) { vehicle.health = Math.max(0, vehicle.health - Math.abs(vehicle.speed) * 0.65); vehicle.speed *= -0.22; }
  vehicle.updateTransform();
  return impact;
}
