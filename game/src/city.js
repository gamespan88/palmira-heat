// Palmira itself: procedural golden-hour city, road grid, beach, pier, props and colliders.
import * as THREE from 'three';
import { PALETTE, WORLD } from './config.js';
import { clamp, createSeededRandom } from './utils.js';

function makeFacadeTexture(random, base, windowColor) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 256;
  const pen = canvas.getContext('2d');
  pen.fillStyle = base; pen.fillRect(0, 0, 128, 256);
  for (let y = 12; y < 244; y += 22) for (let x = 10; x < 118; x += 20) {
    pen.fillStyle = random() > 0.42 ? windowColor : 'rgba(30,32,48,0.85)';
    pen.fillRect(x, y, 12, 13);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function makeSignTexture(text, background, foreground) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
  const pen = canvas.getContext('2d');
  pen.fillStyle = background; pen.fillRect(0, 0, 256, 64);
  pen.fillStyle = foreground; pen.font = 'bold 30px Verdana'; pen.textAlign = 'center'; pen.textBaseline = 'middle';
  pen.fillText(text, 128, 34);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildCity(scene) {
  const random = createSeededRandom(4451);
  const colliders = [];
  const city = new THREE.Group(); scene.add(city);
  scene.fog = new THREE.Fog(PALETTE.fog, 95, 310);
  const hemi = new THREE.HemisphereLight(0xffe0b3, 0x51365e, 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc37a, 2.4);
  sun.position.set(-90, 120, -70); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -170; sun.shadow.camera.right = 170; sun.shadow.camera.top = 170; sun.shadow.camera.bottom = -170;
  sun.shadow.camera.far = 420; sun.shadow.bias = -0.0004; scene.add(sun);
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 12), new THREE.MeshBasicMaterial({ color: PALETTE.sky, side: THREE.BackSide, fog: false }));
  scene.add(skyDome);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; city.add(ground);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.road, roughness: 0.94 });
  for (const coordinate of WORLD.roadCoordinates) {
    const vertical = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, 330), roadMaterial);
    vertical.rotation.x = -Math.PI / 2; vertical.position.set(coordinate, 0.02, 0); vertical.receiveShadow = true; city.add(vertical);
    const horizontal = vertical.clone(); horizontal.rotation.z = Math.PI / 2; horizontal.position.set(0, 0.021, coordinate); city.add(horizontal);
  }
  const dashGeometry = new THREE.PlaneGeometry(0.35, 4.6);
  const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const dashes = new THREE.InstancedMesh(dashGeometry, dashMaterial, 360);
  const matrix = new THREE.Matrix4(); const quaternion = new THREE.Quaternion(); const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const side = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
  let dashIndex = 0;
  for (const coordinate of WORLD.roadCoordinates) for (let p = -156; p <= 156 && dashIndex < 358; p += 12) {
    quaternion.copy(flat); matrix.compose(new THREE.Vector3(coordinate, 0.035, p), quaternion, new THREE.Vector3(1, 1, 1)); dashes.setMatrixAt(dashIndex++, matrix);
    quaternion.copy(side); matrix.compose(new THREE.Vector3(p, 0.036, coordinate), quaternion, new THREE.Vector3(1, 1, 1)); dashes.setMatrixAt(dashIndex++, matrix);
  }
  dashes.count = dashIndex; city.add(dashes);

  const facadeBases = ['#e8b07e', '#d97f63', '#f2d19a', '#9fd3d8', '#e58bb1', '#c9d6df'];
  const facadeMaterials = facadeBases.map((base) => new THREE.MeshStandardMaterial({ map: makeFacadeTexture(random, base, '#ffe9a3'), emissive: 0xffca7a, emissiveIntensity: 0.16, roughness: 0.86 }));
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a52, roughness: 1 });
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const signNames = ['CAFE SOL', 'HOTEL PALMA', 'MARINA GYM', 'SOLSTICE GARAGE', 'TESSA MOTORS', 'NEON MARKET', 'PIER TACOS', 'BANCO BRISA'];
  let signIndex = 0;
  for (let gx = 0; gx < WORLD.roadCoordinates.length - 1; gx += 1) for (let gz = 0; gz < WORLD.roadCoordinates.length - 1; gz += 1) {
    const centerX = (WORLD.roadCoordinates[gx] + WORLD.roadCoordinates[gx + 1]) / 2;
    const centerZ = (WORLD.roadCoordinates[gz] + WORLD.roadCoordinates[gz + 1]) / 2;
    if (centerZ > 96) continue;
    const buildingsInBlock = 1 + Math.floor(random() * 3);
    for (let b = 0; b < buildingsInBlock; b += 1) {
      const width = 13 + random() * 12; const depth = 13 + random() * 12;
      const height = 13 + random() * 38 + (Math.abs(centerX) < 50 && Math.abs(centerZ) < 50 ? 16 : 0);
      const x = centerX + (random() - 0.5) * 16; const z = centerZ + (random() - 0.5) * 16;
      const building = new THREE.Mesh(buildingGeometry, facadeMaterials[Math.floor(random() * facadeMaterials.length)]);
      building.scale.set(width, height, depth); building.position.set(x, height / 2, z);
      building.castShadow = true; building.receiveShadow = true; city.add(building);
      const roof = new THREE.Mesh(buildingGeometry, roofMaterial); roof.scale.set(width + 0.7, 0.7, depth + 0.7); roof.position.set(x, height + 0.35, z); city.add(roof);
      colliders.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
      if (signIndex < signNames.length && random() > 0.45) {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.8), new THREE.MeshBasicMaterial({ map: makeSignTexture(signNames[signIndex], '#24122e', '#ffd166'), side: THREE.DoubleSide }));
        sign.position.set(x, Math.min(8, height - 2), z - depth / 2 - 0.06); sign.rotation.y = Math.PI; city.add(sign); signIndex += 1;
      }
    }
  }

  const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.42, 5.4, 6);
  const leafGeometry = new THREE.ConeGeometry(3.4, 2.4, 7);
  const trunks = new THREE.InstancedMesh(trunkGeometry, new THREE.MeshStandardMaterial({ color: PALETTE.palmTrunk, roughness: 1 }), 90);
  const leaves = new THREE.InstancedMesh(leafGeometry, new THREE.MeshStandardMaterial({ color: PALETTE.palmLeaf, roughness: 1 }), 90);
  let palmIndex = 0;
  for (const road of WORLD.roadCoordinates) for (let p = -140; p <= 140; p += 23) {
    if (palmIndex >= 88) break;
    const x = road + (random() > 0.5 ? 9.5 : -9.5); const z = p + random() * 5;
    if (colliders.some((box) => x > box.minX - 2 && x < box.maxX + 2 && z > box.minZ - 2 && z < box.maxZ + 2)) continue;
    matrix.compose(new THREE.Vector3(x, 2.7, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); trunks.setMatrixAt(palmIndex, matrix);
    matrix.compose(new THREE.Vector3(x, 6.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, random() * 3)), new THREE.Vector3(1, 1, 1)); leaves.setMatrixAt(palmIndex, matrix);
    palmIndex += 1;
  }
  trunks.count = palmIndex; leaves.count = palmIndex; trunks.castShadow = true; city.add(trunks, leaves);

  const lampGeometry = new THREE.CylinderGeometry(0.12, 0.12, 5.6, 5);
  const lampHeads = new THREE.SphereGeometry(0.42, 8, 6);
  const lamps = new THREE.InstancedMesh(lampGeometry, new THREE.MeshStandardMaterial({ color: 0x39404f }), 72);
  const heads = new THREE.InstancedMesh(lampHeads, new THREE.MeshBasicMaterial({ color: 0xffe6a3 }), 72);
  let lampIndex = 0;
  for (const road of WORLD.roadCoordinates) for (let p = -132; p <= 132; p += 44) {
    if (lampIndex >= 70) break;
    matrix.compose(new THREE.Vector3(road + 7.4, 2.8, p), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); lamps.setMatrixAt(lampIndex, matrix);
    matrix.compose(new THREE.Vector3(road + 7.4, 5.8, p), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(lampIndex, matrix);
    lampIndex += 1;
  }
  lamps.count = lampIndex; heads.count = lampIndex; city.add(lamps, heads);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(340, 52), new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.04, WORLD.coastZ + 22); sand.receiveShadow = true; city.add(sand);
  const waterMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.28, metalness: 0.08, transparent: true, opacity: 0.92 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(340, 95), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.12, WORLD.coastZ + 82); city.add(water);
  const pierMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 1 });
  for (let plank = 0; plank < 9; plank += 1) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 5.4), pierMaterial);
    pier.position.set(72, 0.45, WORLD.coastZ + 8 + plank * 5.4); pier.castShadow = true; city.add(pier);
  }
  const crateGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  const crates = new THREE.InstancedMesh(crateGeometry, new THREE.MeshStandardMaterial({ color: 0xb47a45, roughness: 1 }), 42);
  for (let i = 0; i < 42; i += 1) {
    const road = WORLD.roadCoordinates[Math.floor(random() * WORLD.roadCoordinates.length)];
    const x = road + (random() > 0.5 ? 10 : -10); const z = -140 + random() * 250;
    matrix.compose(new THREE.Vector3(x, 0.8, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, random() * 3, 0)), new THREE.Vector3(1, 1, 1));
    crates.setMatrixAt(i, matrix);
  }
  crates.castShadow = true; city.add(crates);
  return { colliders, update(delta, elapsed) { waterMaterial.opacity = 0.88 + Math.sin(elapsed * 1.4) * 0.04; water.position.y = -0.12 + Math.sin(elapsed * 0.9) * 0.05; } };
}

export function resolveBuildingCollisions(position, radius, colliders) {
  for (const box of colliders) {
    const nearestX = clamp(position.x, box.minX, box.maxX); const nearestZ = clamp(position.z, box.minZ, box.maxZ);
    const dx = position.x - nearestX; const dz = position.z - nearestZ; const distance = Math.hypot(dx, dz);
    if (distance < radius) {
      if (distance > 0.001) { position.x = nearestX + (dx / distance) * radius; position.z = nearestZ + (dz / distance) * radius; }
      else position.z = box.maxZ + radius;
    }
  }
  position.x = clamp(position.x, -WORLD.bound, WORLD.bound);
  position.z = clamp(position.z, -WORLD.bound, WORLD.bound + 34);
}
