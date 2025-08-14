// Basit bir global event bus (bağımlılık yok)
const listeners = {};

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(callback);
  return () => off(event, callback);
}

export function off(event, callback) {
  if (listeners[event]) listeners[event].delete(callback);
}

export function emit(event, payload) {
  if (!listeners[event]) return;
  for (const cb of listeners[event]) {
    try { cb(payload); } catch (_) {}
  }
}

export default { on, off, emit };


