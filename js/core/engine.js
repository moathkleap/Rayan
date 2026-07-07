'use strict';
/* ============================================================
   Rayan & Naya — المحرك
   حلقة اللعبة بخطوة ثابتة 60Hz + مدير مشاهد + قياس دقة Retina
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const VW = 960, VH = 540; // دقة افتراضية (تُقاس لتناسب أي شاشة حتى 4K)

  const Engine = {
    canvas: null,
    ctx: null,
    scene: null,
    _pendingScene: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    time: 0,
    frame: 0,
    shake: 0,
    flash: 0,
    flashColor: '#ffffff',
    slowmo: 1,         // معامل إبطاء الزمن (قدرة Time Slow)
    _accum: 0,
    _last: 0,
    running: false,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    },

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = window.innerWidth, h = window.innerHeight;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      const s = Math.min(w / VW, h / VH);
      this.scale = s * dpr;
      this.offsetX = (w * dpr - VW * this.scale) / 2;
      this.offsetY = (h * dpr - VH * this.scale) / 2;
    },

    setScene(scene) { this._pendingScene = scene; },

    start() {
      if (this.running) return;
      this.running = true;
      this._last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        requestAnimationFrame(loop);
        let dtMs = now - this._last;
        this._last = now;
        if (dtMs > 250) dtMs = 250; // تجاوز توقفات التبويب
        this._accum += dtMs / 1000;
        const STEP = 1 / 60;
        let steps = 0;
        while (this._accum >= STEP && steps < 5) {
          this._tick(STEP);
          this._accum -= STEP;
          steps++;
        }
        this._render();
      };
      requestAnimationFrame(loop);
    },

    _tick(dt) {
      if (this._pendingScene) {
        if (this.scene && this.scene.exit) this.scene.exit();
        this.scene = this._pendingScene;
        this._pendingScene = null;
        if (this.scene.enter) this.scene.enter();
      }
      RN.Input.pollGamepad();
      const gdt = dt * this.slowmo;
      this.time += gdt;
      this.frame++;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 18);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
      if (this.scene && this.scene.update) this.scene.update(gdt, dt);
      RN.Input.endFrame();
    },

    _render() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#06070f';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      let sx = 0, sy = 0;
      if (this.shake > 0) {
        sx = (Math.random() - 0.5) * this.shake * this.scale;
        sy = (Math.random() - 0.5) * this.shake * this.scale;
      }
      ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX + sx, this.offsetY + sy);
      // اتجاه الأساس حسب اللغة (النصوص الرقمية تُعزل بـ U.ltr)
      const dir = RN.I18N && RN.I18N.isRTL() ? 'rtl' : 'ltr';
      if (ctx.direction !== dir) ctx.direction = dir;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-2, -2, VW + 4, VH + 4);
      ctx.clip();
      if (this.scene && this.scene.render) this.scene.render(ctx);
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(1, this.flash);
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, VW, VH);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },

    doShake(power) { this.shake = Math.max(this.shake, power); },
    doFlash(color, power) { this.flashColor = color || '#ffffff'; this.flash = power || 0.5; },

    // تحويل إحداثيات حدث لمس/فأرة إلى إحداثيات افتراضية
    toVirtual(clientX, clientY) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      return {
        x: (clientX * dpr - this.offsetX) / this.scale,
        y: (clientY * dpr - this.offsetY) / this.scale,
      };
    },
  };

  RN.Engine = Engine;
  RN.VW = VW;
  RN.VH = VH;
})();
