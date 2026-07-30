/**
 * Sound notification system for new orders
 * R71 — طيف SaaS
 * 
 * Generates a notification sound using the Web Audio API
 * No external audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

/// Play a short notification chime for new order
export function playNewOrderChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone — warm notification (C5 → E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.linearRampToValueAtTime(659.25, now + 0.08); // E5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain1.gain.linearRampToValueAtTime(0, now + 0.15);

    // Second tone — confirmation (G5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.17);
    gain2.gain.linearRampToValueAtTime(0, now + 0.3);

    // Connect oscillators
    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    // Play
    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.3);

    return true;
  } catch {
    return false;
  }
}

/// Play an urgent alert tone for high-priority orders
export function playUrgentAlert() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Rapid double beep
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + i * 0.2);
      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.2 + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.12);
    }

    return true;
  } catch {
    return false;
  }
}

/// Play a success chime for delivered orders
export function playDeliveredChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Pleasant ascending triad: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.18);
    });

    return true;
  } catch {
    return false;
  }
}

/// Check if sound notifications are enabled
export function areSoundNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('tayf-sound-notifications') !== 'false';
  } catch {
    return true;
  }
}

/// Toggle sound notifications
export function toggleSoundNotifications(): boolean {
  const newVal = !areSoundNotificationsEnabled();
  try {
    localStorage.setItem('tayf-sound-notifications', String(newVal));
  } catch {}
  return newVal;
}