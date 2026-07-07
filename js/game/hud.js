'use strict';
/* ============================================================
   Rayan & Naya — واجهة اللعب (HUD) + أدوات واجهة عامة
   شريط صحة/طاقة، كريستالات، خريطة مصغرة، مهام، قوى مؤقتة
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  /* ---------- أزرار واجهة قابلة للنقر ---------- */
  const UI = {
    fontPx(size) { return Math.round(size * RN.Save.settings.textScale); },

    // حالة نبضة الضغط (Bounce) لكل زر حسب تسميته
    _pressMap: {},
    press(b) { this._pressMap[b.label + '|' + Math.round(b.x)] = RN.Engine.time; },

    /* زر Glassmorphism: زجاج شفاف بتدرج، حد مضيء علوي،
       ظل ناعم، لمعة زجاجية، ونبضة ارتداد عند الضغط */
    button(ctx, b, hover) {
      const key = b.label + '|' + Math.round(b.x);
      const pt = this._pressMap[key];
      let sc = 1;
      if (pt !== undefined) {
        const dt = RN.Engine.time - pt;
        if (dt < 0.35) {
          // منحنى ارتداد: انكماش سريع ثم رجوع مرن
          sc = 1 - 0.09 * Math.exp(-dt * 14) * Math.cos(dt * 26);
        } else delete this._pressMap[key];
      }
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.scale(sc, sc);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));

      // ظل ناعم خلفي
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,20,0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      if (b.primary) {
        grad.addColorStop(0, 'rgba(96,204,255,0.92)');
        grad.addColorStop(0.5, 'rgba(56,164,232,0.85)');
        grad.addColorStop(1, 'rgba(30,106,190,0.9)');
      } else {
        grad.addColorStop(0, 'rgba(255,255,255,0.16)');
        grad.addColorStop(0.5, 'rgba(180,200,255,0.10)');
        grad.addColorStop(1, 'rgba(120,140,220,0.14)');
      }
      ctx.fillStyle = grad;
      U.roundRect(ctx, b.x, b.y, b.w, b.h, Math.min(16, b.h / 2.6));
      ctx.fill();
      ctx.restore();

      // لمعة زجاج علوية (نصف الزر)
      const gloss = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h * 0.55);
      gloss.addColorStop(0, 'rgba(255,255,255,0.34)');
      gloss.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = gloss;
      U.roundRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h * 0.5, Math.min(13, b.h / 3));
      ctx.fill();

      // حد مزدوج: خارجي خافت + علوي مضيء
      ctx.strokeStyle = b.primary ? 'rgba(160,230,255,0.9)' : 'rgba(200,215,255,0.45)';
      ctx.lineWidth = 1.4;
      U.roundRect(ctx, b.x, b.y, b.w, b.h, Math.min(16, b.h / 2.6));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + 12, b.y + 1.2);
      ctx.lineTo(b.x + b.w - 12, b.y + 1.2);
      ctx.stroke();

      // النص بظل خفيف
      ctx.fillStyle = b.disabled ? 'rgba(255,255,255,0.35)' : '#ffffff';
      ctx.shadowColor = 'rgba(0,0,20,0.5)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.font = `bold ${this.fontPx(b.fs || 17)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.restore();
    },

    hit(b, x, y) {
      return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    },

    /* لوحة زجاجية */
    panel(ctx, x, y, w, h, title) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,20,0.5)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(30,38,70,0.82)');
      g.addColorStop(1, 'rgba(12,16,36,0.88)');
      ctx.fillStyle = g;
      U.roundRect(ctx, x, y, w, h, 20);
      ctx.fill();
      ctx.restore();
      // لمعة علوية
      const gloss = ctx.createLinearGradient(x, y, x, y + 46);
      gloss.addColorStop(0, 'rgba(255,255,255,0.12)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      U.roundRect(ctx, x + 2, y + 2, w - 4, 42, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,180,255,0.35)';
      ctx.lineWidth = 1.4;
      U.roundRect(ctx, x, y, w, h, 20);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 18, y + 1.2); ctx.lineTo(x + w - 18, y + 1.2); ctx.stroke();
      if (title) {
        ctx.fillStyle = '#ffd977';
        ctx.shadowColor = 'rgba(255,180,50,0.45)';
        ctx.shadowBlur = 10;
        ctx.font = `bold ${this.fontPx(22)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, x + w / 2, y + 30);
        ctx.shadowBlur = 0;
      }
    },

    star(ctx, x, y, r, filled) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.45;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = filled ? '#ffd700' : 'rgba(120,120,140,0.45)';
      ctx.fill();
      if (filled) { ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.restore();
    },

    crystalIcon(ctx, x, y, s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s || 1, s || 1);
      ctx.fillStyle = '#4ae0d8';
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(5.5, -2.5); ctx.lineTo(3.5, 7); ctx.lineTo(-3.5, 7); ctx.lineTo(-5.5, -2.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(0.5, -3.5); ctx.lineTo(-1, 1.5); ctx.lineTo(-2.8, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  };

  /* ---------- HUD داخل المرحلة ---------- */
  const HUD = {
    render(ctx, scene) {
      const p = scene.player;
      const ts = RN.Save.settings.textScale;

      // خلفية شفافة أعلى
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, 'rgba(0,0,10,0.45)');
      grad.addColorStop(1, 'rgba(0,0,10,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, RN.VW, 64);

      // ---- القلوب ----
      const hearts = Math.ceil(p.maxHp);
      for (let i = 0; i < hearts; i++) {
        const hx = 22 + i * 26, hy = 22;
        this._heart(ctx, hx, hy, 10, p.hp >= i + 1 ? 1 : p.hp > i ? 0.5 : 0);
      }
      // ---- الطاقة ----
      const ew = Math.min(180, hearts * 26);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      U.roundRect(ctx, 14, 36, ew, 10, 5); ctx.fill();
      const eGrad = ctx.createLinearGradient(14, 0, 14 + ew, 0);
      eGrad.addColorStop(0, '#3ad8e8'); eGrad.addColorStop(1, '#8a5cff');
      ctx.fillStyle = eGrad;
      U.roundRect(ctx, 15, 37, (ew - 2) * (p.energy / p.maxEnergy), 8, 4); ctx.fill();

      // ---- الكريستالات ----
      UI.crystalIcon(ctx, RN.VW - 120, 24, 1.3);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${18 * ts}px sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(U.ltr(`${scene.crystals} / ${scene.level.crystalTotal}`), RN.VW - 106, 24);

      // ---- الوقت ----
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${14 * ts}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(U.formatTime(scene.time), RN.VW / 2, 20);

      // ---- المفاتيح ----
      let ki = 0;
      for (const k in p.keys) {
        if (p.keys[k]) {
          ctx.font = '16px sans-serif';
          ctx.fillText('🗝', RN.VW - 150 - ki * 22, 24);
          ki++;
        }
      }

      // ---- القوى المؤقتة النشطة ----
      let pi = 0;
      for (const k in p.powerups) {
        if (p.powerups[k] > 0) {
          const pu = RN.C.POWERUPS[k];
          const px = 24 + pi * 46, py = 66;
          ctx.fillStyle = 'rgba(0,0,20,0.55)';
          ctx.beginPath(); ctx.arc(px, py, 17, 0, 7); ctx.fill();
          ctx.strokeStyle = pu.color; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, 17, -Math.PI / 2, -Math.PI / 2 + (p.powerups[k] / pu.dur) * Math.PI * 2);
          ctx.stroke();
          ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = pu.color;
          ctx.fillText(pu.icon, px, py + 1);
          pi++;
        }
      }
      if (p.shield) {
        const px = 24 + pi * 46, py = 66;
        ctx.fillStyle = 'rgba(0,0,20,0.55)';
        ctx.beginPath(); ctx.arc(px, py, 17, 0, 7); ctx.fill();
        ctx.strokeStyle = '#7affc8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, py, 17, 0, 7); ctx.stroke();
        ctx.fillStyle = '#7affc8'; ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🛡', px, py + 1);
      }

      // ---- الخريطة المصغرة ----
      if (!scene.level.isBoss) {
        scene.level.renderMinimap(ctx, RN.VW - 176, 40, 160, 44,
          p.x + p.w / 2, p.y + p.h / 2, scene.maxReachedX);
      }

      // ---- شريط صحة الزعيم ----
      if (scene.boss && !scene.boss.dead && scene.boss.state !== 'intro') {
        const bw = 420, bx = (RN.VW - bw) / 2, by = RN.VH - 42;
        ctx.fillStyle = 'rgba(0,0,10,0.6)';
        U.roundRect(ctx, bx - 4, by - 4, bw + 8, 22, 8); ctx.fill();
        ctx.fillStyle = '#3a1020';
        U.roundRect(ctx, bx, by, bw, 14, 6); ctx.fill();
        const hpFrac = Math.max(0, scene.boss.hp / scene.boss.maxHp);
        const bGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        bGrad.addColorStop(0, '#e83a5a'); bGrad.addColorStop(1, '#ff7a3a');
        ctx.fillStyle = bGrad;
        U.roundRect(ctx, bx, by, bw * hpFrac, 14, 6); ctx.fill();
        // فواصل الأطوار
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(bx + bw / 3 - 1, by, 2, 14);
        ctx.fillRect(bx + (bw * 2) / 3 - 1, by, 2, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${13 * ts}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(RN.t('bosses')[scene.level.wi], RN.VW / 2, by - 14);
      }

      // ---- المهمة الحالية ----
      if (scene.time < 6) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 6 - scene.time)})`;
        ctx.font = `${15 * ts}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(scene.level.isBoss ? RN.t('defeatBoss') : RN.t('findExit'), RN.VW / 2, RN.VH - 70);
      }
    },

    _heart(ctx, x, y, r, fill) {
      ctx.save();
      ctx.translate(x, y);
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(0, r * 0.35);
        ctx.bezierCurveTo(-r * 1.2, -r * 0.6, -r * 0.5, -r * 1.2, 0, -r * 0.4);
        ctx.bezierCurveTo(r * 0.5, -r * 1.2, r * 1.2, -r * 0.6, 0, r * 0.35);
        ctx.lineTo(0, r * 0.35);
        ctx.closePath();
      };
      // ظل القلب الفارغ
      path();
      ctx.fillStyle = 'rgba(20,20,35,0.7)';
      ctx.fill();
      if (fill > 0) {
        ctx.save();
        path();
        ctx.clip();
        ctx.fillStyle = '#ff4a5e';
        ctx.fillRect(-r * 1.3, -r * 1.3, r * 2.6 * fill, r * 2.6);
        ctx.restore();
      }
      path();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    },
  };

  RN.HUD = HUD;
  RN.UI = UI;
})();
