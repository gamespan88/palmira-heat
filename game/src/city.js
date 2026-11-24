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
// A vertical sunset gradient for the sky dome: deep violet zenith melting through
// magenta and coral into gold at the horizon, so every camera angle gets a rich sky.
function makeSkyTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 4; canvas.height = 512;
  const pen = canvas.getContext('2d');
  const grad = pen.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#241047'); grad.addColorStop(0.34, '#6d2a7a'); grad.addColorStop(0.58, '#c2437a');
  grad.addColorStop(0.78, '#ff7b54'); grad.addColorStop(0.92, '#ffb36b'); grad.addColorStop(1, '#ffd166');
  pen.fillStyle = grad; pen.fillRect(0, 0, 4, 512);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function makeAwningTexture(colorA, colorB) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 32;
  const pen = canvas.getContext('2d');
  for (let x = 0; x < 128; x += 16) { pen.fillStyle = (x / 16) % 2 ? colorA : colorB; pen.fillRect(x, 0, 16, 32); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
// One palm frond: a plane bent so the tip droops — instanced six-to-a-crown it reads
// as a real palm silhouette instead of a green cone on a stick.
function makeFrondGeometry() {
  const geometry = new THREE.PlaneGeometry(0.85, 3.6, 1, 5);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i); const t = (y + 1.8) / 3.6;
    positions.setZ(i, -Math.pow(t, 2) * 1.6);
  }
  geometry.translate(0, 1.8, 0);
  geometry.computeVertexNormals();
  return geometry;
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

export function districtAt(x, z) {
  if (z > 60) return 'MARINA & PIER';
  if (x < -60) return 'MERCADO — OLD TOWN';
  if (Math.abs(x) <= 60 && Math.abs(z) <= 60) return 'DOWNTOWN PALMIRA';
  return 'PALMIRA';
}

export function buildCity(scene) {
  const random = createSeededRandom(4451);
  const colliders = [];
  const city = new THREE.Group(); scene.add(city);
  scene.fog = new THREE.Fog(PALETTE.fog, 110, 380);
  const hemi = new THREE.HemisphereLight(0xffe0b3, 0x51365e, 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb877, 2.4);
  sun.position.set(-150, 80, -64); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -205; sun.shadow.camera.right = 205; sun.shadow.camera.top = 205; sun.shadow.camera.bottom = -205;
  sun.shadow.camera.far = 460; sun.shadow.bias = -0.0004; scene.add(sun);
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 12), new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(skyDome);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(470, 470), new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; city.add(ground);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.road, roughness: 0.94 });
  for (const coordinate of WORLD.roadCoordinates) {
    const vertical = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, 460), roadMaterial);
    vertical.rotation.x = -Math.PI / 2; vertical.position.set(coordinate, 0.02, 0); vertical.receiveShadow = true; city.add(vertical);
    const horizontal = vertical.clone(); horizontal.rotation.z = Math.PI / 2; horizontal.position.set(0, 0.021, coordinate); city.add(horizontal);
  }
  const dashGeometry = new THREE.PlaneGeometry(0.35, 4.6);
  const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const dashes = new THREE.InstancedMesh(dashGeometry, dashMaterial, 470);
  const matrix = new THREE.Matrix4(); const quaternion = new THREE.Quaternion(); const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const side = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
  let dashIndex = 0;
  for (const coordinate of WORLD.roadCoordinates) for (let p = -204; p <= 204 && dashIndex < 468; p += 12) {
    quaternion.copy(flat); matrix.compose(new THREE.Vector3(coordinate, 0.035, p), quaternion, new THREE.Vector3(1, 1, 1)); dashes.setMatrixAt(dashIndex++, matrix);
    quaternion.copy(side); matrix.compose(new THREE.Vector3(p, 0.036, coordinate), quaternion, new THREE.Vector3(1, 1, 1)); dashes.setMatrixAt(dashIndex++, matrix);
  }
  dashes.count = dashIndex; city.add(dashes);

  const facadeBases = ['#e8b07e', '#d97f63', '#f2d19a', '#9fd3d8', '#e58bb1', '#c9d6df'];
  const facadeMaterials = facadeBases.map((base) => new THREE.MeshStandardMaterial({ map: makeFacadeTexture(random, base, '#ffe9a3'), emissive: 0xffca7a, emissiveIntensity: 0.16, roughness: 0.86 }));
  const mercadoMaterials = ['#c96f4a', '#b8573f', '#d99a68'].map((base) => new THREE.MeshStandardMaterial({ map: makeFacadeTexture(random, base, '#ffd98a'), emissive: 0xffb066, emissiveIntensity: 0.13, roughness: 0.95 }));
  const downtownGlass = new THREE.MeshStandardMaterial({ map: makeFacadeTexture(random, '#7fb6c9', '#c8f4ff'), emissive: 0x9fd8e8, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.3 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a52, roughness: 1 });
  const mercadoRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x9a4a38, roughness: 1 });
  const awningGeometry = new THREE.BoxGeometry(1, 0.16, 2.3);
  const awningMaterials = [['#c0392b', '#f7ead9'], ['#0e7c86', '#f7ead9'], ['#e07b2a', '#fdf3d8']].map(([a, b]) => new THREE.MeshStandardMaterial({ map: makeAwningTexture(a, b), roughness: 0.9 }));
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const signNames = ['CAFE SOL', 'HOTEL PALMA', 'MARINA GYM', 'SOLSTICE GARAGE', 'TESSA MOTORS', 'NEON MARKET', 'PIER TACOS', 'BANCO BRISA', 'HOTEL CORAL', 'CINE PALMIRA', 'FARMACIA SOL', 'PUERTO LIBROS'];
  const mercadoSignNames = ['MERCADO CENTRAL', 'PANADERIA LUZ', 'TIENDA BRISA', 'ABARROTES SOL', 'CANTINA MAR', 'FLORERIA PALMA'];
  let signIndex = 0; let mercadoSignIndex = 0;
  for (let gx = 0; gx < WORLD.roadCoordinates.length - 1; gx += 1) for (let gz = 0; gz < WORLD.roadCoordinates.length - 1; gz += 1) {
    const centerX = (WORLD.roadCoordinates[gx] + WORLD.roadCoordinates[gx + 1]) / 2;
    const centerZ = (WORLD.roadCoordinates[gz] + WORLD.roadCoordinates[gz + 1]) / 2;
    const district = districtAt(centerX, centerZ);
    const buildingsInBlock = district === 'MERCADO — OLD TOWN' ? 2 + Math.floor(random() * 2) : 1 + Math.floor(random() * 3);
    for (let b = 0; b < buildingsInBlock; b += 1) {
      const width = 13 + random() * 12; const depth = 13 + random() * 12;
      let height = 13 + random() * 38;
      if (district === 'DOWNTOWN PALMIRA') height += 16 + random() * 10;
      if (district === 'MERCADO — OLD TOWN') height *= 0.55;
      const x = centerX + (random() - 0.5) * 16; const z = centerZ + (random() - 0.5) * 16;
      let material;
      if (district === 'MERCADO — OLD TOWN') material = mercadoMaterials[Math.floor(random() * mercadoMaterials.length)];
      else if (district === 'DOWNTOWN PALMIRA' && random() > 0.55) material = downtownGlass;
      else material = facadeMaterials[Math.floor(random() * facadeMaterials.length)];
      const building = new THREE.Mesh(buildingGeometry, material);
      building.scale.set(width, height, depth); building.position.set(x, height / 2, z);
      building.castShadow = true; building.receiveShadow = true; city.add(building);
      const roof = new THREE.Mesh(buildingGeometry, district === 'MERCADO — OLD TOWN' ? mercadoRoofMaterial : roofMaterial); roof.scale.set(width + 0.7, 0.7, depth + 0.7); roof.position.set(x, height + 0.35, z); city.add(roof);
      colliders.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
      const inMercado = district === 'MERCADO — OLD TOWN';
      const signPool = inMercado ? mercadoSignNames : signNames;
      const poolIndex = inMercado ? mercadoSignIndex : signIndex;
      if (poolIndex < signPool.length && random() > 0.3) {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.8), new THREE.MeshBasicMaterial({ map: makeSignTexture(signPool[poolIndex], inMercado ? '#3a1408' : '#24122e', '#ffd166'), side: THREE.DoubleSide }));
        sign.position.set(x, Math.min(8, height - 2), z - depth / 2 - 0.06); sign.rotation.y = Math.PI; city.add(sign);
        if (inMercado) mercadoSignIndex += 1; else signIndex += 1;
      }
      // Striped shop awnings shade the Mercado frontages.
      if (inMercado && random() > 0.35) {
        const awning = new THREE.Mesh(awningGeometry, awningMaterials[Math.floor(random() * awningMaterials.length)]);
        awning.scale.set(Math.min(width * 0.72, 11), 1, 1); awning.position.set(x, 3.1, z - depth / 2 - 1.0); awning.rotation.x = 0.38; awning.castShadow = true; city.add(awning);
      }
    }
  }

  // Palms: tall trunks crowned with six drooping fronds and a coconut cluster each.
  const palmSpots = [];
  for (const road of WORLD.roadCoordinates) for (let p = -190; p <= 190; p += 23) {
    if (palmSpots.length >= 168) break;
    const x = road + (random() > 0.5 ? 9.5 : -9.5); const z = p + random() * 5;
    if (colliders.some((box) => x > box.minX - 2 && x < box.maxX + 2 && z > box.minZ - 2 && z < box.maxZ + 2)) continue;
    palmSpots.push([x, z, 1]);
  }
  // Marina promenade: a dense palm row along the coast road so the waterfront reads as a boulevard.
  for (let x = -190; x <= 190 && palmSpots.length < 278; x += 17) {
    if (x > 82 && x < 112) continue; // keep the pier span clear
    palmSpots.push([x, 155 + (Math.abs(x) % 3), 1.15]);
  }
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.42, 6.4, 6), new THREE.MeshStandardMaterial({ color: PALETTE.palmTrunk, roughness: 1 }), palmSpots.length);
  const fronds = new THREE.InstancedMesh(makeFrondGeometry(), new THREE.MeshStandardMaterial({ color: PALETTE.palmLeaf, roughness: 1, side: THREE.DoubleSide }), palmSpots.length * 6);
  const coconuts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 7, 6), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 1 }), palmSpots.length);
  const frondEuler = new THREE.Euler(); const frondQuat = new THREE.Quaternion();
  palmSpots.forEach(([x, z, s], i) => {
    const topY = 6.3 * s;
    matrix.compose(new THREE.Vector3(x, topY / 2, z), new THREE.Quaternion(), new THREE.Vector3(1, s, 1)); trunks.setMatrixAt(i, matrix);
    matrix.compose(new THREE.Vector3(x, topY - 0.25, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); coconuts.setMatrixAt(i, matrix);
    for (let f = 0; f < 6; f += 1) {
      frondEuler.set(-1.12 - (f % 3) * 0.14, (f / 6) * Math.PI * 2 + x * 0.7, 0, 'YXZ'); frondQuat.setFromEuler(frondEuler);
      matrix.compose(new THREE.Vector3(x, topY, z), frondQuat, new THREE.Vector3(s, s, s)); fronds.setMatrixAt(i * 6 + f, matrix);
    }
  });
  trunks.castShadow = true; fronds.castShadow = true; city.add(trunks, fronds, coconuts);

  const lampGeometry = new THREE.CylinderGeometry(0.12, 0.12, 5.6, 5);
  const lampHeads = new THREE.SphereGeometry(0.42, 8, 6);
  const lamps = new THREE.InstancedMesh(lampGeometry, new THREE.MeshStandardMaterial({ color: 0x39404f }), 130);
  const heads = new THREE.InstancedMesh(lampHeads, new THREE.MeshBasicMaterial({ color: 0xffe6a3 }), 130);
  // A soft additive halo around every lamp head sells the golden-hour glow for the price of one instanced mesh.
  const glows = new THREE.InstancedMesh(new THREE.SphereGeometry(1.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffbe78, transparent: true, opacity: 0.15, depthWrite: false }), 130);
  let lampIndex = 0;
  for (const road of WORLD.roadCoordinates) for (let p = -176; p <= 176; p += 44) {
    if (lampIndex >= 128) break;
    matrix.compose(new THREE.Vector3(road + 7.4, 2.8, p), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); lamps.setMatrixAt(lampIndex, matrix);
    matrix.compose(new THREE.Vector3(road + 7.4, 5.8, p), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(lampIndex, matrix);
    glows.setMatrixAt(lampIndex, matrix);
    lampIndex += 1;
  }
  lamps.count = lampIndex; heads.count = lampIndex; glows.count = lampIndex; city.add(lamps, heads, glows);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(470, 52), new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.04, WORLD.coastZ + 22); sand.receiveShadow = true; city.add(sand);
  const waterMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.28, metalness: 0.08, transparent: true, opacity: 0.92 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(470, 110), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.12, WORLD.coastZ + 86); city.add(water);
  const pierMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 1 });
  for (let plank = 0; plank < 9; plank += 1) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 5.4), pierMaterial);
    pier.position.set(96, 0.45, WORLD.coastZ + 8 + plank * 5.4); pier.castShadow = true; city.add(pier);
  }
  const ferry = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 26), new THREE.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.6 }));
  hull.position.y = 1.2; hull.castShadow = true; ferry.add(hull);
  const ferryStripe = new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.9, 26.3), new THREE.MeshStandardMaterial({ color: 0xc2437a, roughness: 0.6 }));
  ferryStripe.position.y = 2.2; ferry.add(ferryStripe);
  const ferryCabin = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.4, 15), new THREE.MeshStandardMaterial({ color: 0x9be7ff, roughness: 0.25, metalness: 0.3 }));
  ferryCabin.position.y = 4.4; ferry.add(ferryCabin);
  const ferryStack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x24122e, roughness: 0.8 }));
  ferryStack.position.set(0, 6.4, -4); ferry.add(ferryStack);
  ferry.position.set(96, 0, WORLD.coastZ + 62); city.add(ferry);
  const crateGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  const crates = new THREE.InstancedMesh(crateGeometry, new THREE.MeshStandardMaterial({ color: 0xb47a45, roughness: 1 }), 78);
  for (let i = 0; i < 78; i += 1) {
    const road = WORLD.roadCoordinates[Math.floor(random() * WORLD.roadCoordinates.length)];
    const x = road + (random() > 0.5 ? 10 : -10); const z = -190 + random() * 330;
    matrix.compose(new THREE.Vector3(x, 0.8, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, random() * 3, 0)), new THREE.Vector3(1, 1, 1));
    crates.setMatrixAt(i, matrix);
  }
  crates.castShadow = true; city.add(crates);

  // Beach umbrellas in carnival colours scattered along the sand.
  const umbrellaCount = 26;
  const umbrellaPoles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 5), new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.8 }), umbrellaCount);
  const umbrellaCanopies = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7, 0.75, 9), new THREE.MeshStandardMaterial({ roughness: 0.85 }), umbrellaCount);
  const umbrellaColors = [0xff5964, 0xffd166, 0x4ecdc4, 0xff8c42, 0x9be7ff, 0xf78fb3];
  const umbrellaColor = new THREE.Color();
  for (let i = 0; i < umbrellaCount; i += 1) {
    let x = -185 + i * 14.5 + (random() - 0.5) * 6;
    if (x > 84 && x < 112) x += 34; // keep the pier span clear
    const z = WORLD.coastZ + 14 + (i % 3) * 8 + random() * 3;
    matrix.compose(new THREE.Vector3(x, 1.15, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); umbrellaPoles.setMatrixAt(i, matrix);
    matrix.compose(new THREE.Vector3(x, 2.45, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); umbrellaCanopies.setMatrixAt(i, matrix);
    umbrellaCanopies.setColorAt(i, umbrellaColor.setHex(umbrellaColors[i % umbrellaColors.length]));
  }
  umbrellaCanopies.castShadow = true; city.add(umbrellaPoles, umbrellaCanopies);

  // The Neon Pier ferris wheel: a glowing rim of gondolas turning slowly over the water.
  const ferrisWheel = new THREE.Group();
  const wheelFrame = new THREE.MeshStandardMaterial({ color: 0xf4e9f2, roughness: 0.5, metalness: 0.3, emissive: 0xff9ecb, emissiveIntensity: 0.25 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.32, 8, 30), wheelFrame); ferrisWheel.add(rim);
  const innerRim = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.2, 6, 24), wheelFrame); ferrisWheel.add(innerRim);
  for (let s = 0; s < 4; s += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 21.5, 0.28), wheelFrame); spoke.rotation.z = s * Math.PI / 4; ferrisWheel.add(spoke);
  }
  const gondolaColors = [0xff5964, 0xffd166, 0x4ecdc4, 0xff8c42, 0x9be7ff, 0xf78fb3, 0x95e06c, 0xff4fd8];
  for (let g = 0; g < 8; g += 1) {
    const angle = (g / 8) * Math.PI * 2;
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 1.2), new THREE.MeshStandardMaterial({ color: gondolaColors[g], roughness: 0.6, emissive: gondolaColors[g], emissiveIntensity: 0.3 }));
    gondola.position.set(Math.cos(angle) * 11, Math.sin(angle) * 11, 0); ferrisWheel.add(gondola);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 })); ferrisWheel.add(hub);
  ferrisWheel.position.set(126, 13.5, 204); city.add(ferrisWheel);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x39404f, roughness: 0.7 });
  for (const sideSign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 0.5), legMaterial);
    leg.position.set(126 + sideSign * 5.5, 6.5, 204); leg.rotation.z = sideSign * -0.36; city.add(leg);
  }
  return { colliders, update(delta, elapsed) { waterMaterial.opacity = 0.88 + Math.sin(elapsed * 1.4) * 0.04; water.position.y = -0.12 + Math.sin(elapsed * 0.9) * 0.05; ferrisWheel.rotation.z += delta * 0.12; } };
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
  position.z = clamp(position.z, -WORLD.bound, WORLD.coastZ + 56);
}
