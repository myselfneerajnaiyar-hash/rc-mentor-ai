// Each overlay owns one release token. Only the last owner restores the original style.
const locks = new WeakMap();
export function acquireBodyScrollLock(body = document.body) {
  let state = locks.get(body);
  if (!state) {
    state = { owners: new Set(), value: body.style.getPropertyValue('overflow'), priority: body.style.getPropertyPriority('overflow') };
    locks.set(body, state);
    body.style.setProperty('overflow', 'hidden');
  }
  const owner = Symbol('scroll-lock');
  state.owners.add(owner);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.owners.delete(owner);
    if (state.owners.size) return;
    if (state.value) body.style.setProperty('overflow', state.value, state.priority);
    else body.style.removeProperty('overflow');
    locks.delete(body);
  };
}
