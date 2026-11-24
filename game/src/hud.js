// DOM HUD and the circular minimap: health, cash, stars, objective, prompts, dialogue and radar blips.
import { CREW, RADIO, RANK_NAMES, WEAPONS, WORLD } from './config.js';
import { formatCash } from './utils.js';

const DISPATCH_STATUSES = [
  { label: 'PURSUIT', color: '#ffd166' },
  { label: 'RAMMING', color: '#ff8c42' },
  { label: 'BOXING IN', color: '#ff5964' },
  { label: 'FLANKING', color: '#f78fb3' },
];

export function createHud() {
  const elements = {
    hud: document.getElementById('hud'), objective: document.getElementById('objective'),
    wanted: document.getElementById('wantedStars'), cash: document.getElementById('cash'),
    weapon: document.getElementById('weaponLine'), health: document.getElementById('healthBar'),
    prompt: document.getElementById('prompt'), subtitle: document.getElementById('subtitle'),
    message: document.getElementById('message'), messageTitle: document.getElementById('messageTitle'), messageText: document.getElementById('messageText'),
    status: document.getElementById('status'), vignette: document.getElementById('damageVignette'),
    district: document.getElementById('districtBanner'),
    dispatch: document.getElementById('dispatch'), dispatchRows: document.getElementById('dispatchRows'),
    armour: document.getElementById('armourBar'),
    speedo: document.getElementById('speedo'), speedValue: document.getElementById('speedValue'),
    speedVehicle: document.getElementById('speedVehicle'), speedGear: document.getElementById('speedGear'),
    condBar: document.getElementById('condBar'), condLabel: document.getElementById('condLabel'),
    rankName: document.getElementById('rankName'), rankChip: document.getElementById('rankChip'),
    rpBar: document.getElementById('rpBar'), rpText: document.getElementById('rpText'),
    weaponSlots: document.getElementById('weaponSlots'), crewCards: document.getElementById('crewCards'),
    radio: document.getElementById('radioLine'),
    healthValue: document.getElementById('healthValue'), armourValue: document.getElementById('armourValue'),
  };
  // Weapon slot row and crew ability cards are built once; update() only restyles them.
  const slotEls = [];
  if (elements.weaponSlots) {
    WEAPONS.forEach((weapon, index) => {
      const slot = document.createElement('div'); slot.className = 'slot';
      slot.innerHTML = `<span class="slotKey">${index + 1}</span><span class="slotName">${weapon.name}</span><span class="slotAmmo">${weapon.ammo || ''}</span>`;
      elements.weaponSlots.append(slot); slotEls.push({ root: slot, ammo: slot.querySelector('.slotAmmo') });
    });
  }
  const crewEls = [];
  if (elements.crewCards) {
    CREW.forEach((member) => {
      const card = document.createElement('div'); card.className = 'crewCard'; card.style.borderColor = member.color;
      card.innerHTML = `<span class="crewFace" style="background:${member.color}"></span><span class="crewText"><b>${member.name}</b><small>${member.member}</small></span><span class="crewCd"></span>`;
      elements.crewCards.append(card); crewEls.push({ cd: card.querySelector('.crewCd'), root: card });
    });
  }
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
      const armourPct = Math.max(0, Math.min(100, Math.round(state.player.health * 0.62)));
      if (elements.armour) elements.armour.style.width = `${armourPct}%`;
      if (elements.healthValue) elements.healthValue.textContent = Math.max(0, Math.round(state.player.health));
      if (elements.armourValue) elements.armourValue.textContent = armourPct;
      // Rank + RP: the street remembers every job Rico finishes.
      if (elements.rankName) {
        const rankIndex = Math.min(RANK_NAMES.length - 1, Math.floor((state.missionIndex || 0) / 2) + (state.player.mode === 'car' ? 1 : 0));
        elements.rankName.textContent = RANK_NAMES[rankIndex];
        if (elements.rankChip) elements.rankChip.textContent = `RANK ${rankIndex + 1}`;
        const rp = Math.abs(state.cash) % 600;
        if (elements.rpBar) elements.rpBar.style.width = `${Math.round((rp / 600) * 100)}%`;
        if (elements.rpText) elements.rpText.textContent = `${rp} / 600 RP`;
      }
      // Weapon slots: drive-by SMG is the active slot in a car, the pistol on foot.
      if (slotEls.length) {
        const activeSlot = state.player.mode === 'car' ? 2 : 1;
        slotEls.forEach((slot, index) => {
          slot.root.classList.toggle('active', index === activeSlot);
          if (index === 1) slot.ammo.textContent = `${state.ammo}/${state.reserveAmmo}`;
        });
      }
      // Crew ability cards with cooldowns ticking off Palmira time.
      if (crewEls.length) {
        const elapsed = state.elapsed || 0;
        crewEls.forEach((card, index) => {
          const ability = CREW[index];
          const cycle = ability.cooldown + 8;
          const remaining = ability.cooldown - Math.floor(elapsed * 2 + index * 7) % cycle;
          if (remaining <= 0) { card.cd.textContent = 'READY'; card.root.classList.add('ready'); }
          else { card.cd.textContent = `${remaining}s`; card.root.classList.remove('ready'); }
        });
      }
      if (elements.radio) {
        if (state.player.mode === 'car') { elements.radio.style.display = 'block'; elements.radio.textContent = `♪ ${RADIO.station} — ${RADIO.track}`; }
        else elements.radio.style.display = 'none';
      }
      const stars = state.wantedStars ?? 0;
      if (elements.dispatch) {
        if (stars >= 3) {
          elements.dispatch.style.display = 'block';
          const rows = [];
          const activePolice = (state.police || []).filter((c) => c.active);
          activePolice.slice(0, 4).forEach((c, i) => {
            const status = DISPATCH_STATUSES[i % DISPATCH_STATUSES.length];
            const distance = Math.round(Math.hypot(c.position.x - state.player.position.x, c.position.z - state.player.position.z));
            rows.push(`<div class="unit"><span><span class="dot" style="background:${i % 2 ? '#4488ff' : '#ff4455'}"></span>UNIT ${i + 1} · INTERCEPTOR</span><span class="dist">${distance} m</span><span class="st" style="background:${status.color}">${status.label}</span></div>`);
          });
          if (state.roadblocksActive) rows.push('<div class="unit"><span><span class="dot" style="background:#ffb02e"></span>UNIT RB · BARRICADE</span><span class="dist">AHEAD</span><span class="st" style="background:#ff5964">ROADBLOCK</span></div>');
          if (state.heli && state.heli.active) rows.push('<div class="unit"><span><span class="dot" style="background:#e8e6ff"></span>AIR ONE · HELICOPTER</span><span class="dist">OVERHEAD</span><span class="st" style="background:#e8e6ff">SPOTLIGHT</span></div>');
          if (!rows.length) rows.push('<div class="unit"><span>ALL UNITS</span><span class="st" style="background:#ffd166">RESPONDING</span></div>');
          elements.dispatchRows.innerHTML = rows.join('');
        } else elements.dispatch.style.display = 'none';
      }
      if (elements.speedo) {
        if (state.player.mode === 'car' && state.vehicle) {
          elements.speedo.style.display = 'block';
          const kmh = Math.round(Math.abs(state.vehicle.speed || 0) * 3.6);
          elements.speedValue.innerHTML = `${kmh} <small>KM/H</small>`;
          elements.speedVehicle.textContent = state.vehicleName || state.vehicle.type.kind.toUpperCase();
          if (elements.speedGear) elements.speedGear.textContent = `GEAR ${Math.min(6, 1 + Math.floor(Math.abs(state.vehicle.speed || 0) / 6))}`;
          const cond = Math.max(0, Math.round(state.vehicle.health));
          elements.condBar.style.width = `${cond}%`;
          elements.condLabel.textContent = `CONDITION ${cond}%${cond < 40 ? ' · SMOKING' : ''}`;
        } else elements.speedo.style.display = 'none';
      }
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
