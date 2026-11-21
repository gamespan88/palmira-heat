// Keyboard and mouse state: gameplay reads this, menus wire its callbacks.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouseDown: false,
    lookDeltaX: 0,
    lookDeltaY: 0,
    pointerLocked: false,
    onPause: null,
    onInteract: null,
    onTalk: null,
    onReload: null,
    isDown(code) { return keys.has(code); },
    consumeLook() { const delta = { x: input.lookDeltaX, y: input.lookDeltaY }; input.lookDeltaX = 0; input.lookDeltaY = 0; return delta; },
    lockPointer() {
      if (document.pointerLockElement === canvas) return;
      try { const request = canvas.requestPointerLock?.(); if (request && request.catch) request.catch(() => {}); }
      catch { /* pointer lock is a convenience; the game also plays without it */ }
    },
  };
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'KeyF') input.onInteract?.();
    if (event.code === 'KeyE') input.onTalk?.();
    if (event.code === 'KeyR') input.onReload?.();
    if (event.code === 'Escape' || event.code === 'KeyP') input.onPause?.();
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); input.mouseDown = false; });
  canvas.addEventListener('mousedown', (event) => { if (event.button === 0) input.mouseDown = true; });
  window.addEventListener('mouseup', (event) => { if (event.button === 0) input.mouseDown = false; });
  document.addEventListener('pointerlockchange', () => { input.pointerLocked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', (event) => {
    if (!input.pointerLocked) return;
    input.lookDeltaX += event.movementX || 0;
    input.lookDeltaY += event.movementY || 0;
  });
  return input;
}
