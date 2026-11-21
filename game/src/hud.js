// DOM HUD and the circular minimap: health, cash, stars, objective, prompts, dialogue and radar blips.
import { WORLD } from './config.js';
import { formatCash } from './utils.js';

export function createHud() {
  const elements = {
    hud: document.getElementById('hud'), objective: document.getElementById('objective'),
    wanted: document.getElementById('wantedStars'), cash: document.getElementById('cash'),
    weapon: document.getElementById('weaponLine'), health: document.getElementById('healthBar'),
    prompt: document.getElementById('prompt'), subtitle: document.getElementById('subtitle'),
    message: document.getElementById('message'), messageTitle: document.getElementById('messageTitle'), messageText: document.getElementById('messageText'),
    status: document.getElementById('status'), vignette: document.getElementById('damageVignette'),
    district: document.getElementById('districtBanner'),
  };
  const minimap = document.getElementById('minimap'); const pen = minimap.getContext('2d');
  let subtitleUntil = 0; let messageUntil = 0; let districtUntil = 0;
  function worldToMap(x, z) { const scale = minimap.width / 2 / 205; return [minimap.width / 2 + x * scale, minimap.height / 2 + (z - 18) * scale]; }
  function drawMinimap(state) {
    const width = minimap.width; const height = minimap.height;
    pen.clearRect(0, 0, width, height);
    pen.fillStyle = '#274b63'; pen.fillRect(0, 0, width, height);
    pen.fillStyle = '#d9b48c'; pen.fillRect(0, worldToMap(0, WORLD.coastZ)[1], width, height);
    pen.fillStyle = '#1e9bb5'; pen.fillRect(0, worldToMap(0, WORLD.coastZ + 24)[1], width, height);
    pen.strokeStyle = '#11131c'; pen.lineWidth = 7;
    for (const coordinate of WORLD.roadCoordinates) {
      const [x] = worldToMap(coordinate, 0); pen.beginPath(); pen.moveTo(x, 0); pen.lineTo(x, height); pen.stroke();
      const [, y] = worldToMap(0, coordinate); pen.beginPath(); pen.moveTo(0, y); pen.lineTo(width, y); pen.stroke();
    }
    pen.strokeStyle = '#ffd166'; pen.lineWidth = 1.2;
    for (const coordinate of WORLD.roadCoordinates) { const [x] = worldToMap(coordinate, 0); pen.beginPath(); pen.moveTo(x, 0); pen.lineTo(x, height); pen.stroke(); }
    pen.font = 'bold 8px Verdana'; pen.textAlign = 'center'; pen.lineWidth = 2.6; pen.strokeStyle = 'rgba(10,15,24,0.88)'; pen.fillStyle = 'rgba(255,240,214,0.94)';
    const districtLabel = (text, x, z) => { const [mx, my] = worldToMap(x, z); pen.strokeText(text, mx, my); pen.fillText(text, mx, my); };
    districtLabel('DOWNTOWN', 0, -8);
    districtLabel('MERCADO', -117, -14);
    districtLabel('MARINA', 0, 114);
    pen.textAlign = 'left';
    const blip = (position, color, radius = 3.4) => { const [x, y] = worldToMap(position.x, position.z); pen.fillStyle = color; pen.beginPath(); pen.arc(x, y, radius, 0, Math.PI * 2); pen.fill(); };
    for (const vehicle of state.vehicles) if (vehicle.mode === 'parked') blip(vehicle.position, '#c8d2dc', 2.2);
    for (const cruiser of state.police) if (cruiser.active) blip(cruiser.position, Math.floor(performance.now() / 300) % 2 ? '#ff4455' : '#4488ff', 3.6);
    for (const enemy of state.enemies) if (enemy.alive) blip(enemy.position, '#ff3344', 3.6);
    if (state.heli && state.heli.active) {
      const [hx, hy] = worldToMap(state.heli.position.x, state.heli.position.z);
      pen.fillStyle = '#e8e6ff'; pen.beginPath(); pen.arc(hx, hy, 4.4, 0, Math.PI * 2); pen.fill();
      pen.strokeStyle = '#2456c8'; pen.lineWidth = 1.6; pen.beginPath(); pen.arc(hx, hy, 4.4, 0, Math.PI * 2); pen.stroke();
    }
    if (state.objectiveTarget) blip(state.objectiveTarget, '#ffd166', 5);
    const [px, py] = worldToMap(state.player.position.x, state.player.position.z);
    pen.save(); pen.translate(px, py); pen.rotate(state.player.yaw + Math.PI);
    pen.fillStyle = '#ffffff'; pen.beginPath(); pen.moveTo(0, -7); pen.lineTo(4.6, 5); pen.lineTo(-4.6, 5); pen.closePath(); pen.fill(); pen.restore();
    pen.fillStyle = '#fff8ec'; pen.font = 'bold 11px Verdana'; pen.fillText('N', width / 2 - 3, 13);
  }
  return {
    elements,
    showGame() { elements.hud.style.display = 'block'; },
    freezeOverlays() { subtitleUntil = Number.MAX_SAFE_INTEGER; messageUntil = Number.MAX_SAFE_INTEGER; districtUntil = Number.MAX_SAFE_INTEGER; },
    showDistrict(name) { if (!elements.district) return; elements.district.textContent = name; elements.district.style.display = 'block'; districtUntil = performance.now() + 2800; },
    showDialogue(speaker, line) { elements.subtitle.innerHTML = ''; const name = document.createElement('b'); name.textContent = speaker + ': '; elements.subtitle.append(name, document.createTextNode(line)); elements.subtitle.style.display = 'block'; subtitleUntil = performance.now() + 6200; },
    showMessage(title, text) { elements.messageTitle.textContent = title; elements.messageText.textContent = text; elements.message.style.display = 'block'; messageUntil = performance.now() + 3600; },
    setPrompt(text) { elements.prompt.textContent = text || ''; elements.prompt.style.display = text ? 'block' : 'none'; },
    update(state) {
      elements.objective.textContent = state.objective;
      elements.wanted.textContent = state.wantedText;
      elements.cash.textContent = formatCash(state.cash);
      elements.weapon.textContent = state.player.mode === 'car' ? state.vehicleName : `PISTOL ${state.ammo} / ${state.reserveAmmo}`;
      elements.health.style.width = Math.max(0, state.player.health) + '%';
      elements.vignette.style.boxShadow = `inset 0 0 90px rgba(255,0,40,${state.player.health < 35 ? 0.42 : 0})`;
      elements.status.textContent = state.objective;
      if (performance.now() > subtitleUntil) elements.subtitle.style.display = 'none';
      if (performance.now() > messageUntil) elements.message.style.display = 'none';
      if (elements.district && performance.now() > districtUntil) elements.district.style.display = 'none';
      drawMinimap(state);
    },
  };
}
