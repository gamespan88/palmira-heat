// Traffic flow: lane driving on the road grid, intersection turns, pauses and rough obstacle avoidance.
import { clamp, distance2D } from './utils.js';

function obstacleAhead(vehicle, vehicles, playerVehicle, pedestrians) {
  const aheadX = vehicle.position.x + Math.sin(vehicle.yaw) * 7;
  const aheadZ = vehicle.position.z + Math.cos(vehicle.yaw) * 7;
  for (const other of vehicles) {
    if (other === vehicle || other.mode === 'parked') continue;
    if (Math.hypot(other.position.x - aheadX, other.position.z - aheadZ) < 3.4) return true;
  }
  if (playerVehicle && Math.hypot(playerVehicle.position.x - aheadX, playerVehicle.position.z - aheadZ) < 3.8) return true;
  for (const pedestrian of pedestrians) {
    if (pedestrian.alive && Math.hypot(pedestrian.position.x - aheadX, pedestrian.position.z - aheadZ) < 2.1) return true;
  }
  return false;
}
export function updateTraffic(vehicles, delta, random, roads, playerVehicle, pedestrians, effects) {
  for (const vehicle of vehicles) {
    if (vehicle.mode !== 'traffic' || vehicle.driver === 'player') continue;
    if (vehicle.waitTimer > 0) { vehicle.waitTimer -= delta; vehicle.speed = Math.max(0, vehicle.speed - 18 * delta); vehicle.updateTransform(); continue; }
    const blocked = obstacleAhead(vehicle, vehicles, playerVehicle, pedestrians);
    const cruise = vehicle.type.speed * 0.52;
    vehicle.speed += clamp((blocked ? 0 : cruise) - vehicle.speed, -20 * delta, 7 * delta);
    vehicle.position.x += Math.sin(vehicle.yaw) * vehicle.speed * delta;
    vehicle.position.z += Math.cos(vehicle.yaw) * vehicle.speed * delta;
    const nearIntersection = roads.some((road) => Math.abs(vehicle.position.x - road) < 2.4) && roads.some((road) => Math.abs(vehicle.position.z - road) < 2.4);
    if (nearIntersection && vehicle.speed > 2 && random() > 0.996) {
      const turn = random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
      vehicle.yaw += turn; vehicle.waitTimer = 0.25;
    }
    if (Math.abs(vehicle.position.x) > 148 || Math.abs(vehicle.position.z) > 148) vehicle.yaw += Math.PI;
    if (vehicle.health < 42 && Math.random() > 0.72) effects.darkSmoke(vehicle.position, 1);
    vehicle.updateTransform();
  }
  return distance2D;
}
