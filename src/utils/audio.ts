/**
 * Synthesized audio chime service for Leeflet
 * Uses standard Web Audio API (cross-platform, zero dependencies, offline-ready)
 */
class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play a clean, premium Apple/Linear style harmonic completion chime
   */
  playCompletionChime() {
    try {
      const pref = localStorage.getItem('leaf_pref_completion_sound');
      if (pref === 'false') return;

      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Harmonic dual-bell chime: Note D5 (587.33 Hz) transitioning into A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, now);
      osc2.frequency.setValueAtTime(880, now + 0.05);

      // Volume envelope: smooth attack, gentle exponential decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.22);

      osc2.start(now + 0.05);
      osc2.stop(now + 0.35);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  }
}

export const soundService = new SoundService();
