'use strict';
/* ============================================================
   Rayan & Naya — الخلفيات
   Parallax متعدد الطبقات لكل عالم: سماء متدرجة، غيوم متحركة،
   جبال/أشجار/معابد/قلاع، ضباب، انعكاسات
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  class Background {
    constructor(worldIndex, seed) {
      this.wi = worldIndex;
      this.w = RN.C.WORLDS[worldIndex];
      const rng = U.rng(seed || (worldIndex + 7) * 999);
      // غيوم
      this.clouds = [];
      for (let i = 0; i < 9; i++) {
        this.clouds.push({
          x: rng() * RN.VW * 1.6, y: 25 + rng() * 160,
          w: 70 + rng() * 120, speed: 6 + rng() * 12, alpha: 0.35 + rng() * 0.4,
        });
      }
      // عناصر الطبقة البعيدة والمتوسطة
      this.far = [];
      this.mid = [];
      for (let i = 0; i < 14; i++) {
        this.far.push({ x: i * 190 + rng() * 90, h: 90 + rng() * 130, w2: 90 + rng() * 100, v: rng() });
        this.mid.push({ x: i * 240 + rng() * 120, h: 130 + rng() * 170, w2: 70 + rng() * 90, v: rng() });
      }
      this.stars = [];
      for (let i = 0; i < 60; i++) this.stars.push({ x: rng() * RN.VW, y: rng() * RN.VH * 0.7, s: rng() * 1.6 + 0.4, tw: rng() * 6 });
    }

    render(ctx, camX, camY, time) {
      const w = this.w;
      // سماء
      const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
      g.addColorStop(0, w.sky[0]); g.addColorStop(1, w.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, RN.VW, RN.VH);

      // نجوم للعالم المظلم / شمس أو قمر لغيره
      if (this.wi === 5) {
        for (const s of this.stars) {
          ctx.globalAlpha = 0.4 + Math.sin(time * 2 + s.tw) * 0.3;
          ctx.fillStyle = '#cdbaff';
          ctx.fillRect(s.x, s.y, s.s, s.s);
        }
        ctx.globalAlpha = 1;
        // قمر بنفسجي
        ctx.fillStyle = '#b8a0e8';
        ctx.shadowColor = '#b8a0e8'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(RN.VW - 140, 90, 34, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a288d8';
        ctx.beginPath(); ctx.arc(RN.VW - 150, 82, 7, 0, 7); ctx.arc(RN.VW - 128, 98, 5, 0, 7); ctx.fill();
      } else if (this.wi === 3) {
        // وهج بركاني
        const rg = ctx.createRadialGradient(RN.VW / 2, RN.VH, 50, RN.VW / 2, RN.VH, 500);
        rg.addColorStop(0, 'rgba(255,110,30,0.35)'); rg.addColorStop(1, 'rgba(255,110,30,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, RN.VW, RN.VH);
      } else {
        // شمس بإضاءة ديناميكية
        const sunX = RN.VW - 160, sunY = 85;
        const rg = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 120);
        rg.addColorStop(0, 'rgba(255,250,220,0.95)');
        rg.addColorStop(0.25, 'rgba(255,240,180,0.5)');
        rg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, 7); ctx.fill();
      }

      // غيوم متحركة
      for (const c of this.clouds) {
        const cx = ((c.x + time * c.speed - camX * 0.08) % (RN.VW + 300)) - 150;
        ctx.globalAlpha = c.alpha * (this.wi === 5 ? 0.5 : 1);
        ctx.fillStyle = this.wi === 5 ? '#3a2a5c' : '#ffffff';
        this._cloud(ctx, cx, c.y, c.w);
      }
      ctx.globalAlpha = 1;

      // طبقة بعيدة
      this._layer(ctx, this.far, camX * 0.18, w.far, time, true);
      // ضباب بين الطبقات
      ctx.fillStyle = w.fog;
      ctx.fillRect(0, RN.VH * 0.45, RN.VW, RN.VH * 0.55);
      // طبقة متوسطة
      this._layer(ctx, this.mid, camX * 0.4, w.mid, time, false);
    }

    _cloud(ctx, x, y, w) {
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, w * 0.16, 0, 0, 7);
      ctx.ellipse(x - w * 0.22, y - w * 0.07, w * 0.26, w * 0.13, 0, 0, 7);
      ctx.ellipse(x + w * 0.18, y - w * 0.09, w * 0.3, w * 0.15, 0, 0, 7);
      ctx.fill();
    }

    _layer(ctx, items, off, color, time, isFar) {
      const span = items.length * (isFar ? 190 : 240);
      for (const it of items) {
        let x = ((it.x - off) % span + span) % span - 200;
        if (x > RN.VW + 200) continue;
        const baseY = RN.VH - 60;
        ctx.fillStyle = color;
        switch (this.wi) {
          case 0: // أشجار ضخمة
            ctx.fillStyle = U.shade(color, isFar ? 0 : -0.1);
            ctx.fillRect(x - 7, baseY - it.h, 14, it.h);
            for (let k = 0; k < 3; k++) {
              ctx.beginPath();
              ctx.arc(x + (it.v - 0.5) * 20, baseY - it.h - k * it.w2 * 0.16, it.w2 * (0.55 - k * 0.13) + Math.sin(time * 1.2 + it.x) * 2, 0, 7);
              ctx.fill();
            }
            break;
          case 1: // معابد وأهرامات
            ctx.beginPath();
            ctx.moveTo(x - it.w2 * 0.7, baseY);
            ctx.lineTo(x, baseY - it.h);
            ctx.lineTo(x + it.w2 * 0.7, baseY);
            ctx.closePath(); ctx.fill();
            if (!isFar && it.v > 0.5) {
              ctx.fillStyle = U.shade(color, -0.25);
              ctx.fillRect(x - 8, baseY - it.h * 0.4, 16, it.h * 0.4);
            }
            break;
          case 2: // قمم جليدية
            ctx.beginPath();
            ctx.moveTo(x - it.w2 * 0.8, baseY);
            ctx.lineTo(x, baseY - it.h);
            ctx.lineTo(x + it.w2 * 0.8, baseY);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#f4faff';
            ctx.beginPath();
            ctx.moveTo(x - it.w2 * 0.2, baseY - it.h * 0.72);
            ctx.lineTo(x, baseY - it.h);
            ctx.lineTo(x + it.w2 * 0.2, baseY - it.h * 0.72);
            ctx.closePath(); ctx.fill();
            break;
          case 3: // براكين
            ctx.beginPath();
            ctx.moveTo(x - it.w2, baseY);
            ctx.lineTo(x - it.w2 * 0.16, baseY - it.h);
            ctx.lineTo(x + it.w2 * 0.16, baseY - it.h);
            ctx.lineTo(x + it.w2, baseY);
            ctx.closePath(); ctx.fill();
            if (!isFar) {
              ctx.fillStyle = '#ff7a2a';
              ctx.globalAlpha = 0.6 + Math.sin(time * 3 + it.x) * 0.3;
              ctx.fillRect(x - it.w2 * 0.14, baseY - it.h, it.w2 * 0.28, 5);
              ctx.globalAlpha = 1;
            }
            break;
          case 4: // جزر طائرة
            { const fy = baseY - it.h - Math.sin(time * 0.8 + it.x) * 8;
              ctx.beginPath();
              ctx.ellipse(x, fy, it.w2 * 0.55, 14, 0, 0, 7); ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x - it.w2 * 0.45, fy + 5);
              ctx.lineTo(x, fy + it.w2 * 0.45);
              ctx.lineTo(x + it.w2 * 0.45, fy + 5);
              ctx.closePath(); ctx.fill();
              ctx.fillStyle = isFar ? '#8fc891' : '#6ab86e';
              ctx.beginPath(); ctx.ellipse(x, fy - 4, it.w2 * 0.55, 9, 0, 0, 7); ctx.fill();
            }
            break;
          case 5: // قلاع مظلمة
            ctx.fillRect(x - it.w2 * 0.4, baseY - it.h, it.w2 * 0.8, it.h);
            ctx.fillRect(x - it.w2 * 0.55, baseY - it.h * 0.75, it.w2 * 0.16, it.h * 0.75);
            ctx.fillRect(x + it.w2 * 0.39, baseY - it.h * 0.75, it.w2 * 0.16, it.h * 0.75);
            ctx.beginPath();
            ctx.moveTo(x - it.w2 * 0.4, baseY - it.h);
            ctx.lineTo(x, baseY - it.h - it.w2 * 0.4);
            ctx.lineTo(x + it.w2 * 0.4, baseY - it.h);
            ctx.closePath(); ctx.fill();
            if (!isFar) { // نوافذ متوهجة
              ctx.fillStyle = '#8a5cff';
              ctx.globalAlpha = 0.5 + Math.sin(time * 2 + it.x * 3) * 0.3;
              ctx.fillRect(x - 4, baseY - it.h * 0.6, 8, 12);
              ctx.globalAlpha = 1;
            }
            break;
        }
      }
    }
  }

  RN.Background = Background;
})();
