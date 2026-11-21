// Lightweight pooled particles for tire smoke, collision sparks, dust and muzzle flashes.
import * as THREE from 'three';
export function createEffects(scene) {
  const maxParticles = 260;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false; scene.add(points);
  const particles = Array.from({ length: maxParticles }, () => ({ life: 0, maxLife: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, gravity: 0 }));
  let cursor = 0;
  const color = new THREE.Color();
  function spawn(position, count, hex, speed = 2, life = 0.55, upward = 1.2, gravity = -1.2) {
    color.setHex(hex);
    for (let n = 0; n < count; n += 1) {
      const particle = particles[cursor]; cursor = (cursor + 1) % maxParticles;
      particle.life = life * (0.65 + Math.random() * 0.6); particle.maxLife = particle.life;
      particle.x = position.x; particle.y = position.y; particle.z = position.z;
      particle.vx = (Math.random() - 0.5) * speed; particle.vz = (Math.random() - 0.5) * speed;
      particle.vy = Math.random() * upward; particle.gravity = gravity;
      const offset = cursor * 3; colors[offset] = color.r; colors[offset + 1] = color.g; colors[offset + 2] = color.b;
    }
    geometry.attributes.color.needsUpdate = true;
  }
  return {
    smoke(position, count = 5) { spawn(position, count, 0xd8d2c8, 1.1, 0.8, 1.5, 0.7); },
    darkSmoke(position, count = 6) { spawn(position, count, 0x333038, 1.4, 0.9, 1.8, 0.5); },
    sparks(position, count = 8) { spawn(position, count, 0xffc44d, 4.2, 0.32, 1.4, -4); },
    dust(position, count = 5) { spawn(position, count, 0xe8bd7a, 1.8, 0.6, 0.8, -0.4); },
    muzzle(position) { spawn(position, 4, 0xffe66d, 1.2, 0.12, 0.25, 0); },
    update(delta) {
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]; const offset = i * 3;
        if (particle.life <= 0) { positions[offset + 1] = -99; continue; }
        particle.life -= delta; particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.z += particle.vz * delta;
        positions[offset] = particle.x; positions[offset + 1] = particle.y; positions[offset + 2] = particle.z;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
