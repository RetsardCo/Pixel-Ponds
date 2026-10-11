// ── Retro Web Audio API Sound Synthesizer ──
// Zero external assets required, instant loading, 100% reliable in any browser.

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1, decay = true) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Action sounds
  step() {
    this.playTone(120 + Math.random() * 40, 0.06, 'triangle', 0.04);
  }

  till() {
    this.playTone(180, 0.12, 'sawtooth', 0.06);
    setTimeout(() => this.playTone(110, 0.1, 'sine', 0.05), 40);
  }

  water() {
    this.playTone(400, 0.08, 'sine', 0.05);
    setTimeout(() => this.playTone(320, 0.1, 'sine', 0.06), 60);
    setTimeout(() => this.playTone(260, 0.12, 'triangle', 0.04), 120);
  }

  plant() {
    this.playTone(520, 0.08, 'triangle', 0.08);
    setTimeout(() => this.playTone(660, 0.1, 'triangle', 0.08), 70);
  }

  harvest() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.09), i * 60);
    });
  }

  castRod() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch(e) {}
  }

  splash() {
    this.playTone(200, 0.15, 'triangle', 0.08);
    setTimeout(() => this.playTone(140, 0.12, 'sine', 0.06), 60);
  }

  biteAlert() {
    // High alert ping!
    this.playTone(880, 0.1, 'square', 0.1);
    setTimeout(() => this.playTone(1174, 0.25, 'square', 0.12), 100);
  }

  reelClick() {
    // Sharp click when right-clicking during fishing fight
    this.playTone(300 + Math.random() * 80, 0.04, 'square', 0.08);
    setTimeout(() => this.playTone(450, 0.03, 'triangle', 0.07), 30);
  }

  fishCatch() {
    // Fanfare!
    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];
    melody.forEach((note, idx) => {
      setTimeout(() => {
        this.playTone(note.f, note.d, 'triangle', 0.12);
      }, idx * 110);
    });
  }

  fishEscape() {
    // Disappointed slide down
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch(e) {}
  }

  coin() {
    this.playTone(987.77, 0.08, 'sine', 0.09);
    setTimeout(() => this.playTone(1318.51, 0.2, 'sine', 0.11), 80);
  }

  sleep() {
    const notes = [440, 415, 392, 349];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.07), i * 180);
    });
  }
}

const sounds = new SoundSystem();
