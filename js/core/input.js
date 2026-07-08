'use strict';
/* ============================================================
   Rayan & Naya — نظام الإدخال
   لوحة مفاتيح (قابلة لإعادة التخصيص) + يد تحكم + شاشة لمس
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'dash', 'shot', 'timeSlow', 'pause'];

  const DEFAULT_MAP = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['KeyK', 'Space'],
    attack: ['KeyJ', 'KeyX'],
    dash: ['KeyL', 'ShiftLeft'],
    shot: ['KeyI', 'KeyC'],
    timeSlow: ['KeyO', 'KeyV'],
    pause: ['Escape', 'KeyP'],
  };

  const Input = {
    map: JSON.parse(JSON.stringify(DEFAULT_MAP)),
    state: {},        // مضغوط الآن
    pressed: {},      // ضُغط في هذا الإطار
    released: {},
    touchState: {},
    remapTarget: null,
    onRemap: null,
    usingTouch: false,

    init() {
      for (const a of ACTIONS) { this.state[a] = false; this.pressed[a] = false; this.released[a] = false; }
      window.addEventListener('keydown', (e) => {
        if (this.remapTarget) {
          this.map[this.remapTarget] = [e.code];
          const t = this.remapTarget; this.remapTarget = null;
          if (this.onRemap) this.onRemap(t, e.code);
          e.preventDefault();
          return;
        }
        const a = this.actionFor(e.code);
        if (a) {
          if (!this.state[a]) this.pressed[a] = true;
          this.state[a] = true;
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => {
        const a = this.actionFor(e.code);
        if (a) { this.state[a] = false; this.released[a] = true; }
      });
      window.addEventListener('blur', () => { for (const a of ACTIONS) this.state[a] = false; });
    },

    actionFor(code) {
      for (const a of ACTIONS) if (this.map[a] && this.map[a].includes(code)) return a;
      return null;
    },

    resetMap() { this.map = JSON.parse(JSON.stringify(DEFAULT_MAP)); },

    // يُستدعى من أزرار اللمس
    setTouch(action, down) {
      this.usingTouch = true;
      if (down && !this.touchState[action] && !this.state[action]) this.pressed[action] = true;
      if (!down && this.touchState[action]) this.released[action] = true;
      this.touchState[action] = down;
    },

    pollGamepad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = pads && pads[0];
      if (!gp) return;
      const th = 0.35;
      const gpState = {
        left: gp.axes[0] < -th || (gp.buttons[14] && gp.buttons[14].pressed),
        right: gp.axes[0] > th || (gp.buttons[15] && gp.buttons[15].pressed),
        up: gp.axes[1] < -th || (gp.buttons[12] && gp.buttons[12].pressed),
        down: gp.axes[1] > th || (gp.buttons[13] && gp.buttons[13].pressed),
        jump: gp.buttons[0] && gp.buttons[0].pressed,       // A
        attack: gp.buttons[2] && gp.buttons[2].pressed,     // X
        dash: gp.buttons[1] && gp.buttons[1].pressed,       // B
        shot: gp.buttons[3] && gp.buttons[3].pressed,       // Y
        timeSlow: gp.buttons[5] && gp.buttons[5].pressed,   // RB
        pause: gp.buttons[9] && gp.buttons[9].pressed,      // Start
      };
      for (const a of ACTIONS) {
        if (gpState[a] && !this._gpPrev[a] && !this.state[a] && !this.touchState[a]) this.pressed[a] = true;
        if (!gpState[a] && this._gpPrev[a]) this.released[a] = true;
        this._gpNow[a] = !!gpState[a];
      }
    },
    _gpPrev: {}, _gpNow: {},

    // هل الفعل فعّال الآن (من أي مصدر)؟
    down(a) { return !!(this.state[a] || this.touchState[a] || this._gpNow[a]); },
    justPressed(a) { return !!this.pressed[a]; },
    justReleased(a) { return !!this.released[a]; },

    // يُستدعى في نهاية كل إطار
    endFrame() {
      for (const a of ACTIONS) { this.pressed[a] = false; this.released[a] = false; this._gpPrev[a] = this._gpNow[a]; }
    },

    axisX() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); },
  };

  RN.Input = Input;
  RN.INPUT_ACTIONS = ACTIONS;
})();
