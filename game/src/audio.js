// All sound is synthesized with WebAudio: engine, siren, shots, clicks and a warm music loop.
export function createAudioEngine() {
  let context = null;
  let master = null;
  let engineOscillator = null;
  let engineGain = null;
  let musicTimer = 0;
  let musicStep = 0;
  function ensureContext() {
    if (context) { if (context.state === 'suspended') context.resume(); return context; }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain(); master.gain.value = 0.32; master.connect(context.destination);
    engineOscillator = context.createOscillator(); engineOscillator.type = 'sawtooth'; engineOscillator.frequency.value = 55;
    const engineFilter = context.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 420;
    engineGain = context.createGain(); engineGain.gain.value = 0;
    engineOscillator.connect(engineFilter); engineFilter.connect(engineGain); engineGain.connect(master); engineOscillator.start();
    return context;
  }
  function tone(frequency, duration, type = 'sine', volume = 0.16, slideTo = null, delay = 0) {
    if (!ensureContext()) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(start); oscillator.stop(start + duration + 0.02);
  }
  function noiseBurst(duration = 0.12, volume = 0.28) {
    if (!ensureContext()) return;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource(); source.buffer = buffer;
    const gain = context.createGain(); gain.gain.value = volume;
    source.connect(gain); gain.connect(master); source.start();
  }
  return {
    unlock() { ensureContext(); },
    click() { tone(660, 0.06, 'triangle', 0.08); },
    pickup() { tone(520, 0.09, 'triangle', 0.12); tone(780, 0.12, 'triangle', 0.1, null, 0.07); },
    missionComplete() { [523, 659, 784].forEach((note, index) => tone(note, 0.16, 'triangle', 0.12, null, index * 0.09)); },
    gunshot() { noiseBurst(0.11, 0.3); tone(120, 0.08, 'square', 0.12, 45); },
    reload() { tone(220, 0.05, 'square', 0.08); tone(330, 0.05, 'square', 0.08, null, 0.11); },
    crash(strength = 1) { noiseBurst(0.18, Math.min(0.34, 0.12 + strength * 0.1)); tone(75, 0.2, 'sine', 0.18, 35); },
    siren(active, delta) {
      if (!active || !context) return;
      musicTimer += delta;
      if (musicTimer > 0.42) { musicTimer = 0; tone(660, 0.18, 'triangle', 0.045); tone(880, 0.18, 'triangle', 0.045, null, 0.2); }
    },
    setEngine(speedRatio, driving) {
      if (!context || !engineGain) return;
      const target = driving ? 0.028 + Math.abs(speedRatio) * 0.075 : 0;
      engineGain.gain.setTargetAtTime(target, context.currentTime, 0.08);
      engineOscillator.frequency.setTargetAtTime(52 + Math.abs(speedRatio) * 118, context.currentTime, 0.08);
    },
    updateMusic(delta, playing) {
      if (!playing || !context) return;
      musicTimer -= delta;
      if (musicTimer > 0) return;
      musicTimer = 0.24;
      const bass = [110, 110, 130.8, 98][musicStep % 4];
      const sparkle = [440, 523, 659, 587][musicStep % 4];
      tone(bass, 0.2, 'triangle', 0.045);
      if (musicStep % 2 === 0) tone(sparkle, 0.12, 'sine', 0.018);
      musicStep += 1;
    },
  };
}
