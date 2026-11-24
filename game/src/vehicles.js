// Vehicle factory and arcade car physics: sedans, taxis, trucks, coupes, police interceptors and the Vela Moto bike.
import * as THREE from 'three';
import { BIKE_TYPE, CAR_TYPES, LIMITS, PALETTE } from './config.js';
import { clamp } from './utils.js';
import { resolveBuildingCollisions } from './city.js';
import { createPersonMesh } from './pedestrians.js';

const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x17181d, roughness: 0.9 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a5e, roughness: 0.12, metalness: 0.55 });
const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.35, metalness: 0.6 });
const darkTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1e26, roughness: 0.7 });
const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.25, metalness: 0.85 });
const plateMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f1e4 });
const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xff3344 });
const poolMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.1, depthWrite: false });
const poolGeometry = new THREE.CircleGeometry(2.7, 18);

function addBox(group, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh;
}
// Shaped stylised cars: a sloped hood wedge and glass cabin over a skirted body, real wheels
// with bright hubcaps tucked into dark arches, lamp bars front and back, twin exhausts,
// a rear plate and a soft pool of headlight glow thrown on the asphalt ahead.
export function createCarMesh(type, isPolice = false) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: isPolice ? PALETTE.police : type.color, roughness: 0.34, metalness: 0.3 });
  const isTruck = type.kind.includes('Truck');
  const isPickup = type.kind.includes('Pickup');
  const isConvertible = type.kind.includes('Convertible');
  const isCoupe = type.kind.includes('Coupe');
  // Core body: skirt, main shell, sloped hood and a nose cap so the silhouette tapers.
  addBox(group, new THREE.BoxGeometry(2.12, 0.2, 3.4), darkTrimMaterial, 0, 0.3, 0);
  addBox(group, new THREE.BoxGeometry(2.05, 0.58, 4.35), paint, 0, 0.6, 0);
  const hood = addBox(group, new THREE.BoxGeometry(1.95, 0.26, 1.25), paint, 0, 0.92, 1.5); hood.rotation.x = -0.1;
  addBox(group, new THREE.BoxGeometry(1.98, 0.32, 0.5), paint, 0, 0.6, 2.05);
  addBox(group, new THREE.BoxGeometry(1.98, 0.3, 0.34), darkTrimMaterial, 0, 0.66, -2.08);
  if (isTruck) {
    addBox(group, new THREE.BoxGeometry(1.9, 0.5, 0.9), glassMaterial, 0, 1.14, 1.35);
    addBox(group, new THREE.BoxGeometry(1.95, 0.14, 1.0), paint, 0, 1.44, 1.3);
    addBox(group, new THREE.BoxGeometry(2.25, 1.55, 2.7), new THREE.MeshStandardMaterial({ color: 0xf0eadc, roughness: 0.7 }), 0, 1.4, -1.25);
  } else if (isPickup) {
    addBox(group, new THREE.BoxGeometry(1.8, 0.55, 1.15), glassMaterial, 0, 1.2, 1.0);
    addBox(group, new THREE.BoxGeometry(1.84, 0.13, 1.2), paint, 0, 1.54, 1.0);
    const bedMaterial = new THREE.MeshStandardMaterial({ color: 0x8a4a38, roughness: 0.8 });
    addBox(group, new THREE.BoxGeometry(2.0, 0.52, 0.18), bedMaterial, 0, 0.98, -2.05);
    addBox(group, new THREE.BoxGeometry(0.18, 0.52, 2.1), bedMaterial, -0.95, 0.98, -1.05);
    addBox(group, new THREE.BoxGeometry(0.18, 0.52, 2.1), bedMaterial, 0.95, 0.98, -1.05);
    addBox(group, new THREE.BoxGeometry(1.5, 0.55, 1.6), new THREE.MeshStandardMaterial({ color: 0xb47a45, roughness: 1 }), 0, 0.98, -1.15);
  } else if (isConvertible) {
    // Sloped windshield frame + tinted pane, two bucket seats and a roll bar over an open deck.
    const shield = addBox(group, new THREE.BoxGeometry(1.78, 0.52, 0.1), paint, 0, 1.14, 0.6); shield.rotation.x = -0.22;
    const pane = addBox(group, new THREE.BoxGeometry(1.6, 0.4, 0.06), glassMaterial, 0, 1.16, 0.65); pane.rotation.x = -0.22;
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x7a1f2b, roughness: 0.9 });
    addBox(group, new THREE.BoxGeometry(0.56, 0.42, 0.5), seatMaterial, -0.44, 0.86, -0.45);
    addBox(group, new THREE.BoxGeometry(0.56, 0.42, 0.5), seatMaterial, 0.44, 0.86, -0.45);
    addBox(group, new THREE.BoxGeometry(1.7, 0.13, 0.13), paint, 0, 1.06, -0.95);
    addBox(group, new THREE.BoxGeometry(1.78, 0.32, 1.05), paint, 0, 0.96, -1.6);
  } else {
    // Glass cabin with a paint roof and pillars; the coupe gets a sloped fastback glass
    // running down to a proper rear spoiler instead of a vertical rear window.
    const cabinZ = -0.22;
    addBox(group, new THREE.BoxGeometry(1.8, 0.55, 1.95), glassMaterial, 0, 1.24, cabinZ);
    addBox(group, new THREE.BoxGeometry(1.84, 0.13, 2.0), paint, 0, 1.57, cabinZ);
    for (const px of [-0.85, 0.85]) for (const pz of [0.68, -1.12]) addBox(group, new THREE.BoxGeometry(0.12, 0.55, 0.12), paint, px, 1.26, cabinZ + pz);
    const shield = addBox(group, new THREE.BoxGeometry(1.7, 0.5, 0.08), glassMaterial, 0, 1.14, 0.86); shield.rotation.x = -0.3;
    if (isCoupe) {
      const fastback = addBox(group, new THREE.BoxGeometry(1.68, 0.09, 1.15), glassMaterial, 0, 1.3, -1.5); fastback.rotation.x = 0.42;
      addBox(group, new THREE.BoxGeometry(1.95, 0.09, 0.52), darkTrimMaterial, 0, 1.14, -2.3);
      addBox(group, new THREE.BoxGeometry(0.1, 0.24, 0.4), darkTrimMaterial, -0.72, 0.98, -2.12);
      addBox(group, new THREE.BoxGeometry(0.1, 0.24, 0.4), darkTrimMaterial, 0.72, 0.98, -2.12);
    }
  }
  // Bumpers and mirrors on every car.
  addBox(group, new THREE.BoxGeometry(2.1, 0.22, 0.18), darkTrimMaterial, 0, 0.34, 2.24);
  addBox(group, new THREE.BoxGeometry(2.1, 0.22, 0.18), darkTrimMaterial, 0, 0.34, -2.24);
  addBox(group, new THREE.BoxGeometry(0.28, 0.1, 0.16), paint, -1.12, 1.18, 0.55);
  addBox(group, new THREE.BoxGeometry(0.28, 0.1, 0.16), paint, 1.12, 1.18, 0.55);
  if (type.kind.includes('Taxi')) {
    addBox(group, new THREE.BoxGeometry(1.0, 0.28, 0.5), new THREE.MeshBasicMaterial({ color: 0x24122e }), 0, 1.72, -0.2);
    addBox(group, new THREE.BoxGeometry(2.07, 0.13, 4.37), darkTrimMaterial, 0, 0.44, 0);
  }
  if (isPolice) {
    addBox(group, new THREE.BoxGeometry(2.12, 0.34, 4.42), new THREE.MeshStandardMaterial({ color: PALETTE.policeTrim }), 0, 0.62, 0);
    addBox(group, new THREE.BoxGeometry(2.14, 0.2, 1.1), new THREE.MeshStandardMaterial({ color: 0x11131c }), 0, 0.62, 1.55);
    for (const sideSign of [-1, 1]) addBox(group, new THREE.BoxGeometry(0.05, 0.52, 1.35), new THREE.MeshStandardMaterial({ color: PALETTE.policeTrim }), sideSign * 1.05, 0.64, 0.05);
    addBox(group, new THREE.BoxGeometry(1.6, 0.3, 0.16), darkTrimMaterial, 0, 0.5, 2.36);
    addBox(group, new THREE.BoxGeometry(1.5, 0.1, 0.5), darkTrimMaterial, 0, 1.68, -0.22);
    const lightBar = addBox(group, new THREE.BoxGeometry(0.7, 0.2, 0.44), new THREE.MeshBasicMaterial({ color: 0xff3344 }), 0.36, 1.82, -0.22);
    lightBar.name = 'lightBar';
    addBox(group, new THREE.BoxGeometry(0.7, 0.2, 0.44), new THREE.MeshBasicMaterial({ color: 0x3377ff }), -0.36, 1.82, -0.22);
  }
  // Wheels tucked into dark arches, bright hubcaps with a dark centre cap.
  for (const [x, z] of [[-1.02, 1.42], [1.02, 1.42], [-1.02, -1.42], [1.02, -1.42]]) {
    addBox(group, new THREE.BoxGeometry(0.26, 0.62, 1.06), wheelMaterial, x * 0.99, 0.52, z);
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.4, z); wheel.castShadow = true; group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 10), hubMaterial); hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.4, z); group.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 8), darkTrimMaterial); cap.rotation.z = Math.PI / 2; cap.position.set(x, 0.4, z); group.add(cap);
  }
  // Lamp bars front and back, a rear plate, twin exhausts and the headlight pool.
  addBox(group, new THREE.BoxGeometry(0.4, 0.15, 0.06), lightMaterial, -0.62, 0.7, 2.31);
  addBox(group, new THREE.BoxGeometry(0.4, 0.15, 0.06), lightMaterial, 0.62, 0.7, 2.31);
  addBox(group, new THREE.BoxGeometry(1.7, 0.05, 0.05), lightMaterial, 0, 0.56, 2.31);
  addBox(group, new THREE.BoxGeometry(1.8, 0.13, 0.06), tailMaterial, 0, 0.8, -2.26);
  addBox(group, new THREE.BoxGeometry(0.62, 0.19, 0.03), plateMaterial, 0, 0.5, -2.27);
  for (const sideSign of [-1, 1]) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8), chromeMaterial);
    exhaust.rotation.x = Math.PI / 2; exhaust.position.set(sideSign * 0.55, 0.3, -2.3); group.add(exhaust);
  }
  const pool = new THREE.Mesh(poolGeometry, poolMaterial);
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.04, 4.6); pool.scale.set(0.85, 1.5, 1); pool.name = 'headlightPool'; group.add(pool);
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
