'use strict';
/* ============================================================
   Rayan & Naya — الجزيئات والطقس
   غبار، شرر، أوراق، ثلج، مطر رملي، جمرات، ضباب ظلال، برق
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  class Particles {
    constructor() { this.list = []; }
    get qualityMul() { return [0.35, 0.7, 1][RN.Save.settings.quality] || 1; }

    spawn(opts) {
      if (this.list.length > 600 * this.qualityMul) return;
      this.list.push(Object.assign({
        x: 0, y: 0, vx: 0, vy: 0, life: 0.6, age: 0, size: 3,
        color: '#ffffff', grav: 0, drag: 1, shape: 'circle', rot: 0, vr: 0, glow: false,
      }, opts));
    }

    burst(x, y, n, opts) {
      n = Math.ceil(n * this.qualityMul);
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, Math.PI * 2), sp = U.rand(0.3, 1) * (opts.speed || 120);
        this.spawn(Object.assign({}, opts, {
          x, y, vx: Math.cos(a) * sp + (opts.vx || 0), vy: Math.sin(a) * sp + (opts.vy || 0),
          life: U.rand(0.7, 1.3) * (opts.life || 0.6),
          size: U.rand(0.6, 1.4) * (opts.size || 3),
        }));
      }
    }

    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.age += dt;
        if (p.age >= p.life) { this.list.splice(i, 1); continue; }
        p.vy += (p.grav || 0) * dt;
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 60);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    }

    render(ctx, camX, camY) {
      for (const p of this.list) {
        const t = p.age / p.life;
        ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.fillStyle = p.color;
        if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
        const x = p.x - camX, y = p.y - camY;
        if (x < -20 || x > RN.VW + 20 || y < -20 || y > RN.VH + 20) { ctx.globalAlpha = 1; ctx.shadowBlur = 0; continue; }
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(x, y, p.size * (1 - t * 0.5), 0, 7); ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else if (p.shape === 'leaf') {
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, 7); ctx.fill();
          ctx.restore();
        } else if (p.shape === 'star') {
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
          for (let k = 0; k < 4; k++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(-p.size * 0.15, -p.size, p.size * 0.3, p.size * 2);
          }
          ctx.restore();
        }
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- الطقس: طبقة جزيئات محيطية مستمرة لكل عالم ---------- */
  class Weather {
    constructor(type) {
      this.type = type;
      this.items = [];
      this.lightning = 0;
      this.lightningX = 0;
      const q = [30, 60, 100][RN.Save.settings.quality] || 100;
      for (let i = 0; i < q; i++) this.items.push(this._make(true));
    }
    _make(anywhere) {
      const x = U.rand(0, RN.VW), y = anywhere ? U.rand(0, RN.VH) : -10;
      switch (this.type) {
        case 'leaves': return { x, y, vx: U.rand(-40, -15), vy: U.rand(15, 45), size: U.rand(2, 4.5), rot: U.rand(0, 6), vr: U.rand(-3, 3), c: U.pick(['#7ac86a', '#a8d84a', '#5aa84a', '#e8c84a']) };
        case 'sandstorm': return { x, y, vx: U.rand(-220, -120), vy: U.rand(-10, 25), size: U.rand(1, 3), rot: 0, vr: 0, c: 'rgba(230,190,120,0.6)' };
        case 'snow': return { x, y, vx: U.rand(-30, 10), vy: U.rand(25, 70), size: U.rand(1.5, 3.5), rot: 0, vr: 0, c: 'rgba(255,255,255,0.85)' };
        case 'embers': return { x, y: RN.VH + 10 - (anywhere ? U.rand(0, RN.VH) : 0), vx: U.rand(-15, 15), vy: U.rand(-70, -30), size: U.rand(1.5, 3), rot: 0, vr: 0, c: U.pick(['#ff8a3a', '#ffb84a', '#ff5a2a']) };
        case 'wind': return { x, y, vx: U.rand(-320, -180), vy: U.rand(-15, 15), size: U.rand(8, 22), rot: 0, vr: 0, c: 'rgba(255,255,255,0.25)', streak: true };
        case 'shadowMist': return { x, y, vx: U.rand(-20, 20), vy: U.rand(-12, 12), size: U.rand(15, 40), rot: 0, vr: 0, c: 'rgba(90,50,160,0.08)' };
        case 'stardust': return { x, y, vx: U.rand(-14, 14), vy: U.rand(10, 32), size: U.rand(1, 2.4), rot: 0, vr: 0, c: U.pick(['#ffe98a', '#bcd8ff', '#ffffff', '#d8b8ff']) };
        case 'rain': return { x, y, vx: -60, vy: U.rand(380, 480), size: U.rand(6, 11), rot: 0, vr: 0, c: 'rgba(160,200,255,0.5)', streak: true };
        default: return { x, y, vx: 0, vy: 10, size: 2, rot: 0, vr: 0, c: '#fff' };
      }
    }
    update(dt) {
      for (const p of this.items) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
        if (this.type === 'leaves') p.x += Math.sin(RN.Engine.time * 2 + p.y * 0.02) * 25 * dt;
        if (this.type === 'snow') p.x += Math.sin(RN.Engine.time * 1.5 + p.y * 0.03) * 20 * dt;
        if (this.type === 'stardust') p.x += Math.sin(RN.Engine.time * 1.2 + p.y * 0.04) * 14 * dt;
        if (p.y > RN.VH + 15 || p.y < -50 || p.x < -50 || p.x > RN.VW + 50) {
          Object.assign(p, this._make(false));
          if (p.vx < -100) p.x = RN.VW + 10; // عواصف تدخل من اليمين
          if (this.type === 'embers') p.y = RN.VH + 10;
        }
      }
      // برق عالم السماء
      if (this.type === 'wind' && Math.random() < 0.002) {
        this.lightning = 0.4; this.lightningX = U.rand(100, RN.VW - 100);
        RN.Audio.sfx('lightning');
      }
      if (this.lightning > 0) this.lightning -= dt;
    }
    render(ctx) {
      for (const p of this.items) {
        ctx.fillStyle = p.c;
        if (p.streak) {
          ctx.save(); ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.globalAlpha = 0.6;
          ctx.fillRect(0, -1, p.size, 2);
          ctx.restore(); ctx.globalAlpha = 1;
        } else if (this.type === 'shadowMist') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
        } else if (this.type === 'leaves') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, 7); ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
        }
      }
      if (this.lightning > 0) {
        ctx.fillStyle = `rgba(255,255,240,${this.lightning * 0.5})`;
        ctx.fillRect(0, 0, RN.VW, RN.VH);
        ctx.strokeStyle = '#fffde0'; ctx.lineWidth = 3;
        ctx.beginPath();
        let lx = this.lightningX, ly = 0;
        ctx.moveTo(lx, ly);
        while (ly < RN.VH * 0.6) { lx += U.rand(-25, 25); ly += U.rand(25, 50); ctx.lineTo(lx, ly); }
        ctx.stroke();
      }
    }
  }

  RN.Particles = Particles;
  RN.Weather = Weather;
})();
