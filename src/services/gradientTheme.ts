const STORAGE_KEY = 'agentstation_applied_gradient_v1';

/** Restore the device-local Gradient Studio theme before React mounts. */
function restoreAppliedGradient(): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const selection: unknown = JSON.parse(raw);
    if (!selection || typeof selection !== 'object') return;
    const background = (selection as { background?: unknown }).background;
    if (typeof background !== 'string' || !background.startsWith('radial-gradient(')) return;
    document.documentElement.style.setProperty('--as-user-gradient', background);
  } catch {
    // Storage may be disabled; AgentStation continues with its default theme.
  }
}

restoreAppliedGradient();

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  restoreAppliedGradient();
});
