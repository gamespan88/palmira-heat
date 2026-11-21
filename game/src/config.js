// Palmira Heat tuning: world scale, cast, colours and save identity in one place.
export const GAME_TITLE = 'PALMIRA HEAT';
export const SAVE_KEY = 'palmira-heat-save-v1';
export const WORLD = {
  bound: 176,
  roadCoordinates: [-144, -96, -48, 0, 48, 96, 144],
  roadWidth: 13,
  blockSize: 48,
  coastZ: 160,
};
export const PLAYER_START = { x: -6, z: 100, yaw: Math.PI };
export const CAST = {
  hero: 'Rico Marín',
  courierBoss: 'Dario Sol',
  fixer: 'Marisol Vega',
  mechanic: 'Tessa Bloom',
  rival: 'Vince Corallo',
  harborMaster: 'Ivo Marek',
};
export const PALETTE = {
  sky: 0xffb36b,
  fog: 0xf2a56b,
  road: 0x403a47,
  sidewalk: 0xd9b48c,
  sand: 0xf4cf8f,
  water: 0x1e9bb5,
  grass: 0x5da85f,
  palmTrunk: 0x8a5a35,
  palmLeaf: 0x2e9e5b,
  police: 0xf4f6ff,
  policeTrim: 0x2456c8,
  taxi: 0xffc526,
};
export const CAR_TYPES = [
  { kind: 'Solana Sedan', color: 0x4fb3ff, speed: 27, acceleration: 15 },
  { kind: 'Palma Taxi', color: 0xffc526, speed: 26, acceleration: 14 },
  { kind: 'Cargo Mule Truck', color: 0xe8e2d4, speed: 21, acceleration: 10 },
  { kind: 'Vela GT Coupe', color: 0xff4f79, speed: 36, acceleration: 22 },
  { kind: 'Marina Family Wagon', color: 0x67d68a, speed: 24, acceleration: 13 },
  { kind: 'Brisa Pickup', color: 0xe2725b, speed: 25, acceleration: 13 },
  { kind: 'Solana Convertible', color: 0x7ee0d2, speed: 33, acceleration: 20 },
];
export const LIMITS = { trafficCars: 28, parkedCars: 20, pedestrians: 55, policeCars: 5 };
