'use strict';
/* ============================================================
   Rayan & Naya — نظام الصوت
   موسيقى إجرائية ديناميكية (WebAudio) + مؤثرات صوتية مُخلّقة
   تتغير الموسيقى حسب: الاستكشاف / القتال / الزعيم / المشاهد
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const Audio = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicVol: 0.7,
    sfxVol: 0.9,
    enabled: true,
    _seqTimer: null,
    _nextNoteTime: 0,
    _step: 0,
    _theme: null,
    _mode: 'explore',
    _noiseBuf: null,

    init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { this.enabled = false; return; }
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.5;
      this.sfxGain.gain.value = this.sfxVol;
      const comp = this.ctx.createDynamicsCompressor();
      this.musicGain.connect(comp);
      this.sfxGain.connect(comp);
      comp.connect(this.ctx.destination);
      // ضجيج أبيض للمؤثرات (خطوات، انفجارات، رياح)
      const len = this.ctx.sampleRate * 1;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    },

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v * 0.5; },
    setSfxVol(v) { this.sfxVol = v; if (this.sfxGain) this.sfxGain.gain.value = v; },

    /* ================== الموسيقى ================== */
    // سلالم موسيقية لكل عالم لإعطاء هوية مختلفة
    THEMES: [
      { tempo: 104, root: 220.0, scale: [0, 2, 4, 7, 9], bass: 'triangle', lead: 'sine', padHz: 110, name: 'forest' },     // خماسي كبير — مرح
      { tempo: 96, root: 233.1, scale: [0, 1, 4, 5, 7, 8, 11], bass: 'sawtooth', lead: 'square', padHz: 116.5, name: 'desert' }, // حجاز — شرقي
      { tempo: 88, root: 246.9, scale: [0, 2, 3, 7, 10], bass: 'sine', lead: 'triangle', padHz: 123.5, name: 'ice' },      // خماسي صغير — بارد
      { tempo: 120, root: 207.7, scale: [0, 3, 5, 6, 7, 10], bass: 'sawtooth', lead: 'sawtooth', padHz: 103.8, name: 'volcano' }, // بلوز — خطر
      { tempo: 112, root: 261.6, scale: [0, 2, 4, 5, 7, 9, 11], bass: 'triangle', lead: 'sine', padHz: 130.8, name: 'sky' },  // كبير — سماوي
      { tempo: 108, root: 277.2, scale: [0, 2, 4, 6, 7, 9, 11], bass: 'triangle', lead: 'sine', padHz: 138.6, name: 'stars' }, // ليدي — كوني حالم
      { tempo: 92, root: 196.0, scale: [0, 2, 3, 5, 7, 8, 10], bass: 'square', lead: 'sawtooth', padHz: 98, name: 'dark' },   // صغير — مظلم
      { tempo: 100, root: 261.6, scale: [0, 2, 4, 7, 9], bass: 'triangle', lead: 'sine', padHz: 130.8, name: 'menu' },
    ],

    setMusic(themeIndex, mode) {
      if (!this.ctx || !this.enabled) return;
      if (themeIndex === 'menu') themeIndex = this.THEMES.length - 1; // لحن القائمة هو الأخير دائمًا
      const theme = this.THEMES[RN.U.clamp(themeIndex, 0, this.THEMES.length - 1)];
      if (this._theme === theme && this._mode === mode) return;
      this._theme = theme;
      this._mode = mode || 'explore';
      if (!this._seqTimer) {
        this._nextNoteTime = this.ctx.currentTime + 0.05;
        this._step = 0;
        this._seqTimer = setInterval(() => this._scheduler(), 40);
      }
    },

    stopMusic() {
      if (this._seqTimer) { clearInterval(this._seqTimer); this._seqTimer = null; }
      this._theme = null;
    },

    _scheduler() {
      if (!this._theme || !this.ctx) return;
      const t = this._theme;
      const spb = 60 / (t.tempo * (this._mode === 'boss' ? 1.25 : this._mode === 'combat' ? 1.1 : 1));
      const stepDur = spb / 4; // 16th
      while (this._nextNoteTime < this.ctx.currentTime + 0.12) {
        this._playStep(this._step, this._nextNoteTime, stepDur);
        this._nextNoteTime += stepDur;
        this._step = (this._step + 1) % 64;
      }
    },

    _note(scaleIdx, octave) {
      const t = this._theme;
      const deg = t.scale[((scaleIdx % t.scale.length) + t.scale.length) % t.scale.length];
      const oct = Math.floor(scaleIdx / t.scale.length) + octave;
      return t.root * Math.pow(2, (deg + oct * 12) / 12);
    },

    _playStep(step, when, dur) {
      const t = this._theme, mode = this._mode;
      const bar = Math.floor(step / 16), beat16 = step % 16;
      const prog = [0, 3, 4, 0]; // تتابع نغمي بسيط
      const chordRoot = prog[bar % 4];

      // Bass — دائمًا
      if (beat16 % 4 === 0) {
        this._tone(this._note(chordRoot, -1), t.bass, when, dur * 3.2, 0.16);
      }
      // Pad — استكشاف وسينما
      if (beat16 === 0 && mode !== 'boss') {
        this._tone(this._note(chordRoot, 0), 'sine', when, dur * 15, 0.05);
        this._tone(this._note(chordRoot + 2, 0), 'sine', when, dur * 15, 0.04);
      }
      // Lead — نمط متغير حسب الوضع
      const density = mode === 'boss' ? 2 : mode === 'combat' ? 3 : 4;
      if (beat16 % density === 0 && (mode !== 'cine')) {
        const seq = [0, 2, 4, 2, 5, 4, 2, 0, 3, 2, 4, 6, 5, 4, 2, 1];
        const idx = seq[(step + bar * 3) % 16] + chordRoot;
        if ((step % 8 !== 6) || mode === 'boss') {
          this._tone(this._note(idx, 1), t.lead, when, dur * 1.8, mode === 'explore' ? 0.055 : 0.075);
        }
      }
      // Drums — قتال وزعيم
      if (mode === 'combat' || mode === 'boss') {
        if (beat16 % 4 === 0) this._kick(when);
        if (beat16 % 8 === 4) this._snare(when);
        if (beat16 % 2 === 1) this._hat(when, 0.02);
      } else if (mode === 'explore' && beat16 % 8 === 4) {
        this._hat(when, 0.012);
      }
      if (mode === 'boss' && beat16 % 16 === 14) this._snare(when, 0.09);
    },

    _tone(freq, wave, when, dur, vol) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = wave; o.frequency.value = freq;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      o.connect(g); g.connect(this.musicGain);
      o.start(when); o.stop(when + dur + 0.05);
    },
    _kick(when) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(120, when);
      o.frequency.exponentialRampToValueAtTime(40, when + 0.12);
      g.gain.setValueAtTime(0.28, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
      o.connect(g); g.connect(this.musicGain); o.start(when); o.stop(when + 0.15);
    },
    _snare(when, vol) {
      const s = this.ctx.createBufferSource(); s.buffer = this._noiseBuf;
      const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.14, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.11);
      s.connect(f); f.connect(g); g.connect(this.musicGain); s.start(when); s.stop(when + 0.12);
    },
    _hat(when, vol) {
      const s = this.ctx.createBufferSource(); s.buffer = this._noiseBuf;
      const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
      s.connect(f); f.connect(g); g.connect(this.musicGain); s.start(when); s.stop(when + 0.05);
    },

    /* ================== المؤثرات الصوتية ================== */
    _sfxTone(freq0, freq1, dur, wave, vol, when) {
      if (!this.ctx) return;
      const t = when || this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = wave || 'square';
      o.frequency.setValueAtTime(freq0, t);
      if (freq1) o.frequency.exponentialRampToValueAtTime(Math.max(1, freq1), t + dur);
      g.gain.setValueAtTime(vol || 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
    },
    _sfxNoise(dur, filterHz, vol, type) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const s = this.ctx.createBufferSource(); s.buffer = this._noiseBuf; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterHz;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t); s.stop(t + dur + 0.02);
    },

    sfx(name) {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      switch (name) {
        case 'jump': this._sfxTone(300, 650, 0.16, 'square', 0.09); break;
        case 'doubleJump': this._sfxTone(420, 880, 0.18, 'square', 0.09); break;
        case 'land': this._sfxNoise(0.08, 500, 0.1); break;
        case 'step': this._sfxNoise(0.04, 900, 0.03); break;
        case 'coin': this._sfxTone(1100, 1600, 0.09, 'sine', 0.11); this._sfxTone(1600, 2100, 0.12, 'sine', 0.08, t + 0.06); break;
        case 'gem': this._sfxTone(900, 1800, 0.2, 'triangle', 0.12); break;
        case 'key': this._sfxTone(700, 1400, 0.15, 'triangle', 0.12); this._sfxTone(1400, 2000, 0.2, 'triangle', 0.1, t + 0.1); break;
        case 'hit': this._sfxTone(220, 90, 0.12, 'sawtooth', 0.15); this._sfxNoise(0.1, 1800, 0.1, 'bandpass'); break;
        case 'stomp': this._sfxTone(400, 100, 0.15, 'square', 0.14); break;
        case 'hurt': this._sfxTone(300, 110, 0.3, 'sawtooth', 0.16); break;
        case 'death': this._sfxTone(440, 60, 0.8, 'sawtooth', 0.16); break;
        case 'enemyDie': this._sfxTone(500, 80, 0.25, 'square', 0.13); this._sfxNoise(0.2, 900, 0.09); break;
        case 'dash': this._sfxNoise(0.18, 2400, 0.13, 'bandpass'); break;
        case 'shot': this._sfxTone(900, 350, 0.14, 'sawtooth', 0.12); break;
        case 'slam': this._sfxTone(200, 45, 0.3, 'square', 0.2); this._sfxNoise(0.3, 400, 0.18); break;
        case 'chest': this._sfxTone(500, 1000, 0.3, 'triangle', 0.13); this._sfxTone(1000, 1500, 0.3, 'triangle', 0.1, t + 0.15); break;
        case 'door': this._sfxNoise(0.4, 300, 0.14); break;
        case 'lever': this._sfxTone(400, 250, 0.1, 'square', 0.1); this._sfxTone(250, 400, 0.1, 'square', 0.1, t + 0.1); break;
        case 'button': this._sfxTone(500, 300, 0.08, 'square', 0.1); break;
        case 'powerup': [523, 659, 784, 1047].forEach((f, i) => this._sfxTone(f, f * 1.05, 0.14, 'triangle', 0.1, t + i * 0.07)); break;
        case 'ability': [392, 523, 659, 784, 1047].forEach((f, i) => this._sfxTone(f, f, 0.22, 'sine', 0.12, t + i * 0.1)); break;
        case 'star': [784, 988, 1175].forEach((f, i) => this._sfxTone(f, f, 0.2, 'sine', 0.12, t + i * 0.12)); break;
        case 'checkpoint': this._sfxTone(660, 990, 0.25, 'sine', 0.12); break;
        case 'break': this._sfxNoise(0.2, 700, 0.16); break;
        case 'splash': this._sfxNoise(0.35, 1200, 0.12); break;
        case 'lightning': this._sfxNoise(0.4, 3000, 0.2, 'highpass'); this._sfxTone(150, 50, 0.35, 'sawtooth', 0.14); break;
        case 'roar': this._sfxTone(140, 60, 0.7, 'sawtooth', 0.22); this._sfxNoise(0.6, 350, 0.16); break;
        case 'bossHit': this._sfxTone(280, 80, 0.2, 'square', 0.17); break;
        case 'explosion': this._sfxNoise(0.5, 600, 0.22); this._sfxTone(160, 40, 0.4, 'sawtooth', 0.15); break;
        case 'ui': this._sfxTone(700, 900, 0.06, 'sine', 0.08); break;
        case 'uiBack': this._sfxTone(500, 350, 0.08, 'sine', 0.08); break;
        case 'achievement': [659, 784, 1047, 1319].forEach((f, i) => this._sfxTone(f, f, 0.18, 'triangle', 0.1, t + i * 0.09)); break;
        case 'memory': [523, 659, 784, 659, 880].forEach((f, i) => this._sfxTone(f, f, 0.3, 'sine', 0.09, t + i * 0.16)); break;
        case 'timeSlow': this._sfxTone(800, 200, 0.5, 'sine', 0.1); break;
        case 'shield': this._sfxTone(400, 800, 0.3, 'triangle', 0.1); break;
        case 'freeze': this._sfxTone(1500, 400, 0.3, 'sine', 0.1); break;
        case 'fire': this._sfxNoise(0.3, 900, 0.13, 'bandpass'); break;
        case 'wind': this._sfxNoise(0.6, 500, 0.08); break;
        case 'rockfall': this._sfxNoise(0.3, 250, 0.18); break;
      }
    },
  };

  RN.Audio = Audio;
})();
