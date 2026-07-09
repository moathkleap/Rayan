'use strict';
/* ============================================================
   Rayan & Naya — الخلفيات السينمائية
   8 طبقات Parallax: سماء متدرجة غنية، شمس/قمر بأشعة ضوئية
   (God Rays)، غيوم بطيئة، جبال بعيدة، غابة/تلال بعيدة، طبقة
   وسطى، طبقة قريبة مفصلة، وضباب جوي + حبيبات غبار مضيئة
   وطيور — كل عالم بريشة لونية سينمائية خاصة
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  // لوحات سماء سينمائية (3 توقفات) لكل عالم
  const SKIES = [
    ['#5fb0dd', '#8fd0e8', '#eaf7e8'],
    ['#e8a84a', '#f5c76b', '#fdeec6'],
    ['#6f9cc8', '#a8c8e8', '#eef6ff'],
    ['#2a1418', '#6e2a1e', '#c8552a'],
    ['#3a6cc8', '#6f9fe0', '#cfe8ff'],
    ['#0b1030', '#20306e', '#3a4a8e'],
    ['#0a0718', '#231640', '#3a2560'],
  ];

  class Background {
    constructor(worldIndex, seed) {
      this.wi = worldIndex;
      this.w = RN.C.WORLDS[worldIndex];
      this.isDark = this.w.id === 'dark';
      this.isStars = this.w.id === 'stars';
      this.night = this.isDark || this.isStars; // عوالم بسماء ليلية مرصعة
      const rng = U.rng(seed || (worldIndex + 7) * 999);
      this.rngv = rng;

      // غيوم (طبقتان: بعيدة وقريبة)
      this.cloudsFar = [];
      this.cloudsNear = [];
      for (let i = 0; i < 6; i++) {
        this.cloudsFar.push({ x: rng() * (RN.VW + 400), y: 20 + rng() * 120, w: 90 + rng() * 130, speed: 3 + rng() * 5, alpha: 0.25 + rng() * 0.25 });
        this.cloudsNear.push({ x: rng() * (RN.VW + 400), y: 30 + rng() * 170, w: 130 + rng() * 170, speed: 8 + rng() * 9, alpha: 0.4 + rng() * 0.35 });
      }
      // أربع طبقات أرضية
      this.mountains = [];  // 0.08
      this.farHills = [];   // 0.18
      this.mid = [];        // 0.38
      this.near = [];       // 0.62
      for (let i = 0; i < 10; i++) this.mountains.push({ x: i * 260 + rng() * 130, h: 140 + rng() * 150, w2: 160 + rng() * 120, v: rng() });
      for (let i = 0; i < 12; i++) this.farHills.push({ x: i * 210 + rng() * 100, h: 80 + rng() * 90, w2: 110 + rng() * 90, v: rng() });
      for (let i = 0; i < 14; i++) this.mid.push({ x: i * 230 + rng() * 110, h: 120 + rng() * 150, w2: 70 + rng() * 80, v: rng() });
      for (let i = 0; i < 12; i++) this.near.push({ x: i * 300 + rng() * 150, h: 170 + rng() * 190, w2: 90 + rng() * 100, v: rng() });

      // نجوم + حبيبات غبار مضيئة + طيور
      this.stars = [];
      for (let i = 0; i < 90; i++) this.stars.push({ x: rng() * RN.VW, y: rng() * RN.VH * 0.75, s: rng() * 1.8 + 0.4, tw: rng() * 6 });
      this.motes = [];
      for (let i = 0; i < 26; i++) this.motes.push({ x: rng() * RN.VW, y: rng() * RN.VH, s: 0.8 + rng() * 2, sp: 4 + rng() * 10, ph: rng() * 7 });
      this.birds = [];
      if (worldIndex === 0 || worldIndex === 4) {
        for (let i = 0; i < 3; i++) this.birds.push({ x: rng() * RN.VW, y: 50 + rng() * 130, sp: 22 + rng() * 18, ph: rng() * 7, dir: rng() < 0.5 ? 1 : -1 });
      }
    }

    /* ---------- الطبقة 1: السماء ---------- */
    _sky(ctx) {
      const s = SKIES[this.wi];
      const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
      g.addColorStop(0, s[0]); g.addColorStop(0.55, s[1]); g.addColorStop(1, s[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, RN.VW, RN.VH);
    }

    /* ---------- الطبقة 2: الشمس/القمر + أشعة ضوئية ---------- */
    _sunAndRays(ctx, time) {
      if (this.night) {
        // نجوم وقمر وشفق: بنفسجي في العالم المظلم، ذهبي-فيروزي في عالم النجوم
        for (const s of this.stars) {
          ctx.globalAlpha = (this.isStars ? 0.5 : 0.35) + Math.sin(time * 2 + s.tw) * 0.3;
          ctx.fillStyle = this.isStars ? (s.tw > 4.5 ? '#ffe9a0' : '#cfe4ff') : (s.tw > 4.5 ? '#ffd9f0' : '#cdbaff');
          ctx.fillRect(s.x, s.y, s.s, s.s);
        }
        ctx.globalAlpha = 1;
        // شفق (Aurora) متموج
        ctx.globalCompositeOperation = 'screen';
        for (let b = 0; b < 3; b++) {
          const g = ctx.createLinearGradient(0, 40 + b * 30, 0, 170 + b * 30);
          if (this.isStars) {
            g.addColorStop(0, 'rgba(90,180,255,0)');
            g.addColorStop(0.5, `rgba(${150 + b * 30},${190 + b * 15},255,0.10)`);
            g.addColorStop(1, 'rgba(255,220,120,0)');
          } else {
            g.addColorStop(0, 'rgba(150,80,255,0)');
            g.addColorStop(0.5, `rgba(${120 + b * 30},${60 + b * 20},255,0.10)`);
            g.addColorStop(1, 'rgba(80,220,200,0)');
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, 90 + b * 26);
          for (let x = 0; x <= RN.VW; x += 40) {
            ctx.lineTo(x, 90 + b * 26 + Math.sin(x * 0.008 + time * 0.5 + b * 2) * 26);
          }
          ctx.lineTo(RN.VW, 190 + b * 26);
          ctx.lineTo(0, 190 + b * 26);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        // قمر (بنفسجي في المظلم، ذهبي في عالم النجوم)
        const mx = RN.VW - 150, my = 90;
        const hc = this.isStars ? '255,225,150' : '190,160,255';
        const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 110);
        halo.addColorStop(0, `rgba(${hc},0.5)`);
        halo.addColorStop(1, `rgba(${hc},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(mx - 110, my - 110, 220, 220);
        const mg = ctx.createRadialGradient(mx - 10, my - 10, 4, mx, my, 36);
        if (this.isStars) { mg.addColorStop(0, '#fff4d0'); mg.addColorStop(1, '#d8b268'); }
        else { mg.addColorStop(0, '#e8dcff'); mg.addColorStop(1, '#a288d8'); }
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(mx, my, 34, 0, 7); ctx.fill();
        ctx.fillStyle = this.isStars ? 'rgba(190,150,90,0.45)' : 'rgba(120,95,180,0.5)';
        ctx.beginPath(); ctx.arc(mx - 11, my - 7, 7, 0, 7); ctx.arc(mx + 9, my + 11, 5, 0, 7); ctx.arc(mx + 2, my - 15, 3.5, 0, 7); ctx.fill();
        return;
      }
      if (this.wi === 3) {
        // وهج بركاني نابض من الأسفل
        const rg = ctx.createRadialGradient(RN.VW / 2, RN.VH + 60, 60, RN.VW / 2, RN.VH + 60, 560);
        const pulse = 0.3 + Math.sin(time * 1.4) * 0.06;
        rg.addColorStop(0, `rgba(255,120,30,${pulse + 0.15})`);
        rg.addColorStop(0.6, `rgba(200,60,20,${pulse * 0.5})`);
        rg.addColorStop(1, 'rgba(200,60,20,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, RN.VW, RN.VH);
        return;
      }
      // شمس بهالات متعددة + أشعة دوّارة (God Rays)
      const sx = RN.VW - 170, sy = 95;
      ctx.globalCompositeOperation = 'screen';
      const halo = ctx.createRadialGradient(sx, sy, 5, sx, sy, 190);
      halo.addColorStop(0, 'rgba(255,252,230,0.95)');
      halo.addColorStop(0.16, 'rgba(255,244,190,0.55)');
      halo.addColorStop(0.5, 'rgba(255,238,170,0.16)');
      halo.addColorStop(1, 'rgba(255,238,170,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(sx - 190, sy - 190, 380, 380);
      // أشعة مخروطية تدور ببطء وتتنفس
      ctx.save();
      ctx.translate(sx, sy);
      const rayCount = 7;
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + time * 0.05;
        const len = 300 + Math.sin(time * 0.7 + i * 1.7) * 60;
        const wdt = 0.10 + Math.sin(time * 0.5 + i) * 0.03;
        const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        rg.addColorStop(0, 'rgba(255,246,200,0.16)');
        rg.addColorStop(1, 'rgba(255,246,200,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, len, a - wdt, a + wdt);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      // قرص الشمس
      const sun = ctx.createRadialGradient(sx - 6, sy - 6, 2, sx, sy, 30);
      sun.addColorStop(0, '#fffdf0'); sun.addColorStop(1, '#ffe89a');
      ctx.fillStyle = sun;
      ctx.beginPath(); ctx.arc(sx, sy, 28, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- غيوم منمقة (ظل + إضاءة) ---------- */
    _cloud(ctx, x, y, w, dark) {
      const puffs = [
        [0, 0, 0.5, 0.17], [-0.24, -0.06, 0.27, 0.14], [0.2, -0.08, 0.3, 0.16],
        [-0.05, -0.12, 0.24, 0.13], [0.36, 0.02, 0.18, 0.1],
      ];
      // ظل سفلي
      ctx.fillStyle = dark;
      ctx.beginPath();
      for (const [px, py, pw, ph] of puffs) ctx.ellipse(x + px * w, y + py * w + 4, pw * w, ph * w, 0, 0, 7);
      ctx.fill();
      // جسم مضيء
      ctx.fillStyle = this.isDark ? '#4a3a70' : this.isStars ? '#46549e' : this.wi === 3 ? '#6e4048' : '#ffffff';
      ctx.beginPath();
      for (const [px, py, pw, ph] of puffs) ctx.ellipse(x + px * w, y + py * w, pw * w, ph * w, 0, 0, 7);
      ctx.fill();
    }

    /* ---------- عنصر طبيعي بريشة غنية حسب العالم والطبقة ---------- */
    _feature(ctx, it, baseY, tone, layer, time) {
      const wi = this.wi;
      const x = it.x, h = it.h, w2 = it.w2;
      switch (wi) {
        case 0: { // أشجار غابة بثلاث درجات لونية
          if (layer <= 1) { // تلال بعيدة
            ctx.fillStyle = tone;
            ctx.beginPath();
            ctx.moveTo(x - w2, baseY);
            ctx.quadraticCurveTo(x, baseY - h, x + w2, baseY);
            ctx.closePath(); ctx.fill();
            break;
          }
          // ظل قاعدي
          ctx.fillStyle = 'rgba(20,40,25,0.25)';
          ctx.beginPath(); ctx.ellipse(x, baseY - 2, w2 * 0.55, 7, 0, 0, 7); ctx.fill();
          // جذع بتدرج
          const tg = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
          tg.addColorStop(0, U.shade('#6e4a2a', -0.3));
          tg.addColorStop(0.5, '#6e4a2a');
          tg.addColorStop(1, U.shade('#6e4a2a', 0.15));
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.moveTo(x - 8, baseY);
          ctx.quadraticCurveTo(x - 5, baseY - h * 0.5, x - 4, baseY - h + 20);
          ctx.lineTo(x + 4, baseY - h + 20);
          ctx.quadraticCurveTo(x + 5, baseY - h * 0.5, x + 8, baseY);
          ctx.closePath(); ctx.fill();
          // تاج من عناقيد بثلاث درجات + تمايل
          const sway = Math.sin(time * 0.8 + x * 0.01) * 3;
          const cy = baseY - h + 8;
          const tones = [U.shade(tone, -0.22), tone, U.shade(tone, 0.22)];
          for (let ti = 0; ti < 3; ti++) {
            ctx.fillStyle = tones[ti];
            const off = (ti - 1) * 6;
            ctx.beginPath();
            ctx.arc(x - w2 * 0.28 + sway * 0.6 + off, cy + 8 - ti * 5, w2 * 0.32, 0, 7);
            ctx.arc(x + sway + off, cy - w2 * 0.14 - ti * 6, w2 * 0.38, 0, 7);
            ctx.arc(x + w2 * 0.3 + sway * 0.8 + off, cy + 6 - ti * 5, w2 * 0.3, 0, 7);
            ctx.fill();
          }
          break;
        }
        case 1: { // معابد وأهرام بظلال جانبية
          const g = ctx.createLinearGradient(x - w2 * 0.7, 0, x + w2 * 0.7, 0);
          g.addColorStop(0, U.shade(tone, 0.12));
          g.addColorStop(0.55, tone);
          g.addColorStop(1, U.shade(tone, -0.2));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - w2 * 0.7, baseY);
          ctx.lineTo(x, baseY - h);
          ctx.lineTo(x + w2 * 0.7, baseY);
          ctx.closePath(); ctx.fill();
          if (layer >= 2) {
            // درجات الهرم
            ctx.strokeStyle = 'rgba(90,60,25,0.3)';
            ctx.lineWidth = 1.5;
            for (let s = 1; s <= 3; s++) {
              const fy = baseY - (h * s) / 4;
              const half = w2 * 0.7 * (1 - s / 4);
              ctx.beginPath(); ctx.moveTo(x - half, fy); ctx.lineTo(x + half, fy); ctx.stroke();
            }
            // مدخل متوهج
            if (it.v > 0.55) {
              ctx.fillStyle = 'rgba(255,190,90,0.85)';
              U.roundRect(ctx, x - 7, baseY - 24, 14, 24, 6);
              ctx.fill();
            }
            // نخلة مجاورة
            if (it.v < 0.3) {
              const px = x + w2 * 0.85;
              ctx.strokeStyle = '#7a5a2e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
              ctx.beginPath(); ctx.moveTo(px, baseY); ctx.quadraticCurveTo(px + 8, baseY - 30, px + 5, baseY - 55); ctx.stroke();
              ctx.strokeStyle = '#3e7a3a'; ctx.lineWidth = 4;
              for (let f = 0; f < 5; f++) {
                const a = -0.4 - f * 0.5 + Math.sin(time + f) * 0.05;
                ctx.beginPath();
                ctx.moveTo(px + 5, baseY - 55);
                ctx.quadraticCurveTo(px + 5 + Math.cos(a) * 20, baseY - 55 + Math.sin(a) * 20, px + 5 + Math.cos(a) * 34, baseY - 55 + Math.sin(a) * 30);
                ctx.stroke();
              }
            }
          }
          break;
        }
        case 2: { // قمم جليدية + صنوبر مثلج
          const g = ctx.createLinearGradient(x - w2 * 0.8, 0, x + w2 * 0.8, 0);
          g.addColorStop(0, U.shade(tone, 0.15));
          g.addColorStop(0.6, tone);
          g.addColorStop(1, U.shade(tone, -0.18));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - w2 * 0.8, baseY);
          ctx.lineTo(x - w2 * 0.15, baseY - h * 0.72);
          ctx.lineTo(x, baseY - h);
          ctx.lineTo(x + w2 * 0.28, baseY - h * 0.6);
          ctx.lineTo(x + w2 * 0.8, baseY);
          ctx.closePath(); ctx.fill();
          // قمة ثلجية
          ctx.fillStyle = '#f7fbff';
          ctx.beginPath();
          ctx.moveTo(x - w2 * 0.17, baseY - h * 0.68);
          ctx.lineTo(x, baseY - h);
          ctx.lineTo(x + w2 * 0.14, baseY - h * 0.75);
          ctx.lineTo(x + w2 * 0.05, baseY - h * 0.7);
          ctx.lineTo(x - w2 * 0.05, baseY - h * 0.76);
          ctx.closePath(); ctx.fill();
          if (layer >= 2 && it.v > 0.4) {
            // شجرة صنوبر مثلجة
            const px = x + w2 * 0.5, ph = 40 + it.v * 30;
            for (let s = 0; s < 3; s++) {
              const sy = baseY - s * ph * 0.26;
              const half = (ph * 0.4) * (1 - s * 0.24);
              ctx.fillStyle = '#3d6b5a';
              ctx.beginPath();
              ctx.moveTo(px - half, sy);
              ctx.lineTo(px, sy - ph * 0.4);
              ctx.lineTo(px + half, sy);
              ctx.closePath(); ctx.fill();
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.beginPath();
              ctx.moveTo(px - half * 0.6, sy - ph * 0.14);
              ctx.lineTo(px, sy - ph * 0.4);
              ctx.lineTo(px + half * 0.6, sy - ph * 0.14);
              ctx.quadraticCurveTo(px, sy - ph * 0.05, px - half * 0.6, sy - ph * 0.14);
              ctx.fill();
            }
          }
          break;
        }
        case 3: { // مخاريط بركانية بشقوق متوهجة ودخان
          const g = ctx.createLinearGradient(x - w2, 0, x + w2, 0);
          g.addColorStop(0, U.shade(tone, 0.1));
          g.addColorStop(0.5, tone);
          g.addColorStop(1, U.shade(tone, -0.25));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - w2, baseY);
          ctx.lineTo(x - w2 * 0.14, baseY - h);
          ctx.lineTo(x + w2 * 0.14, baseY - h);
          ctx.lineTo(x + w2, baseY);
          ctx.closePath(); ctx.fill();
          if (layer >= 2) {
            // فوهة متوهجة + شقوق
            ctx.globalCompositeOperation = 'screen';
            const pulse = 0.55 + Math.sin(time * 2.4 + x) * 0.25;
            ctx.fillStyle = `rgba(255,150,50,${pulse})`;
            ctx.beginPath(); ctx.ellipse(x, baseY - h + 2, w2 * 0.15, 5, 0, 0, 7); ctx.fill();
            ctx.strokeStyle = `rgba(255,120,40,${pulse * 0.8})`;
            ctx.lineWidth = 2.4; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - w2 * 0.05, baseY - h + 4);
            ctx.lineTo(x - w2 * 0.22, baseY - h * 0.55);
            ctx.lineTo(x - w2 * 0.12, baseY - h * 0.3);
            ctx.moveTo(x + w2 * 0.08, baseY - h + 4);
            ctx.lineTo(x + w2 * 0.2, baseY - h * 0.5);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            // دخان
            for (let s = 0; s < 3; s++) {
              const st = (time * 0.35 + s * 0.33 + it.v) % 1;
              ctx.fillStyle = `rgba(70,50,55,${0.3 * (1 - st)})`;
              ctx.beginPath();
              ctx.arc(x + Math.sin(st * 5 + x) * 14, baseY - h - st * 70, 8 + st * 20, 0, 7);
              ctx.fill();
            }
          }
          break;
        }
        case 4: { // جزر طائرة بعشب وشلالات
          const fy = baseY - h - Math.sin(time * 0.7 + x * 0.02) * 9;
          // صخر الجزيرة
          const g = ctx.createLinearGradient(0, fy, 0, fy + w2 * 0.5);
          g.addColorStop(0, tone);
          g.addColorStop(1, U.shade(tone, -0.3));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x - w2 * 0.5, fy + 4);
          ctx.quadraticCurveTo(x - w2 * 0.2, fy + w2 * 0.45, x, fy + w2 * 0.5);
          ctx.quadraticCurveTo(x + w2 * 0.25, fy + w2 * 0.4, x + w2 * 0.5, fy + 4);
          ctx.closePath(); ctx.fill();
          // سطح عشبي
          const gg = ctx.createLinearGradient(0, fy - 12, 0, fy + 8);
          gg.addColorStop(0, layer >= 2 ? '#7ecb6f' : '#9ad48e');
          gg.addColorStop(1, '#4e9a52');
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.ellipse(x, fy, w2 * 0.55, 13, 0, 0, 7); ctx.fill();
          if (layer >= 2) {
            // شلال صغير
            if (it.v > 0.5) {
              ctx.fillStyle = 'rgba(190,230,255,0.65)';
              const wf = ((time * 60) % 30);
              ctx.fillRect(x + w2 * 0.15, fy + 6, 5, 34);
              ctx.fillStyle = 'rgba(255,255,255,0.8)';
              ctx.fillRect(x + w2 * 0.15, fy + 6 + wf, 5, 5);
            }
            // شجيرة
            ctx.fillStyle = '#3f8a5e';
            ctx.beginPath(); ctx.arc(x - w2 * 0.2, fy - 9, 9, 0, 7); ctx.arc(x - w2 * 0.08, fy - 13, 8, 0, 7); ctx.fill();
          }
          break;
        }
        case 5: { // قلاع مظلمة وأشجار ملتوية
          if (it.v > 0.45 || layer < 2) {
            const g = ctx.createLinearGradient(x - w2 * 0.55, 0, x + w2 * 0.55, 0);
            g.addColorStop(0, U.shade(tone, 0.12));
            g.addColorStop(1, U.shade(tone, -0.2));
            ctx.fillStyle = g;
            ctx.fillRect(x - w2 * 0.4, baseY - h, w2 * 0.8, h);
            ctx.fillRect(x - w2 * 0.58, baseY - h * 0.78, w2 * 0.18, h * 0.78);
            ctx.fillRect(x + w2 * 0.4, baseY - h * 0.78, w2 * 0.18, h * 0.78);
            // أسقف مخروطية
            for (const [tx2, tw, th] of [[x, w2 * 0.44, w2 * 0.5], [x - w2 * 0.49, w2 * 0.12, w2 * 0.3], [x + w2 * 0.49, w2 * 0.12, w2 * 0.3]]) {
              ctx.beginPath();
              ctx.moveTo(tx2 - tw, baseY - h + (tx2 === x ? 0 : h * 0.22));
              ctx.lineTo(tx2, baseY - h - th + (tx2 === x ? 0 : h * 0.22));
              ctx.lineTo(tx2 + tw, baseY - h + (tx2 === x ? 0 : h * 0.22));
              ctx.closePath(); ctx.fill();
            }
            if (layer >= 2) {
              // نوافذ متوهجة تخفق
              ctx.globalCompositeOperation = 'screen';
              const flick = 0.5 + Math.sin(time * 2.2 + x * 3) * 0.3;
              ctx.fillStyle = `rgba(150,95,255,${flick})`;
              U.roundRect(ctx, x - 5, baseY - h * 0.62, 10, 15, 5); ctx.fill();
              U.roundRect(ctx, x - w2 * 0.53, baseY - h * 0.55, 7, 11, 3.5); ctx.fill();
              ctx.globalCompositeOperation = 'source-over';
            }
          } else {
            // شجرة ملتوية عارية
            ctx.strokeStyle = tone; ctx.lineCap = 'round';
            ctx.lineWidth = 7;
            const sway = Math.sin(time * 0.6 + x) * 2;
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.quadraticCurveTo(x + 14, baseY - h * 0.5, x - 6 + sway, baseY - h * 0.9);
            ctx.stroke();
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(x + 6, baseY - h * 0.55);
            ctx.quadraticCurveTo(x + 26, baseY - h * 0.75, x + 30 + sway, baseY - h * 0.95);
            ctx.moveTo(x - 3 + sway, baseY - h * 0.85);
            ctx.quadraticCurveTo(x - 22, baseY - h, x - 26 + sway, baseY - h * 1.08);
            ctx.stroke();
          }
          break;
        }
      }
    }

    _layerLoop(ctx, items, off, spanUnit, cb) {
      const span = items.length * spanUnit;
      for (const it of items) {
        let x = ((it.x - off) % span + span) % span - 220;
        if (x > RN.VW + 240) continue;
        cb(Object.assign({}, it, { x }));
      }
    }

    render(ctx, camX, camY, time) {
      const w = this.w;
      // 1) سماء
      this._sky(ctx);
      // 2) شمس/قمر + أشعة
      this._sunAndRays(ctx, time);

      // 3) غيوم بعيدة
      for (const c of this.cloudsFar) {
        const cx = ((c.x + time * c.speed - camX * 0.04) % (RN.VW + 460)) - 230;
        ctx.globalAlpha = c.alpha * 0.7;
        this._cloud(ctx, cx, c.y, c.w, 'rgba(140,160,200,0.35)');
      }
      ctx.globalAlpha = 1;

      // 4) جبال بعيدة (ضبابية — تُمزج مع لون السماء)
      const farTone = U.mix(w.far, SKIES[this.wi][1], 0.45);
      this._layerLoop(ctx, this.mountains, camX * 0.08, 260, (it) => {
        this._feature(ctx, it, RN.VH - 46, farTone, 0, time);
      });

      // 5) تلال/غابة بعيدة
      const hillTone = U.mix(w.far, SKIES[this.wi][1], 0.18);
      this._layerLoop(ctx, this.farHills, camX * 0.18, 210, (it) => {
        this._feature(ctx, it, RN.VH - 40, hillTone, 1, time);
      });

      // ضباب جوي بين الطبقات
      ctx.fillStyle = w.fog;
      ctx.fillRect(0, RN.VH * 0.42, RN.VW, RN.VH * 0.58);

      // 6) غيوم قريبة
      for (const c of this.cloudsNear) {
        const cx = ((c.x + time * c.speed - camX * 0.12) % (RN.VW + 500)) - 250;
        ctx.globalAlpha = c.alpha;
        this._cloud(ctx, cx, c.y, c.w, 'rgba(150,170,210,0.4)');
      }
      ctx.globalAlpha = 1;

      // 7) طبقة وسطى
      this._layerLoop(ctx, this.mid, camX * 0.38, 230, (it) => {
        this._feature(ctx, it, RN.VH - 34, w.mid, 2, time);
      });

      // ضباب خفيف ثانٍ (مخفف كي لا يغسل أسفل الشاشة)
      const fogRGBA = w.fog.replace(/[\d.]+\)$/, (m) => (parseFloat(m) * 0.45) + ')');
      const fg = ctx.createLinearGradient(0, RN.VH * 0.6, 0, RN.VH);
      fg.addColorStop(0, 'rgba(255,255,255,0)');
      fg.addColorStop(1, fogRGBA);
      ctx.fillStyle = fg;
      ctx.fillRect(0, RN.VH * 0.6, RN.VW, RN.VH * 0.4);

      // 8) طبقة قريبة (أغمق وأكثر تشبعًا)
      this._layerLoop(ctx, this.near, camX * 0.62, 300, (it) => {
        this._feature(ctx, it, RN.VH - 18, U.shade(w.mid, -0.16), 3, time);
      });

      // طيور بعيدة
      for (const b of this.birds) {
        const bx = ((b.x + time * b.sp * b.dir - camX * 0.1) % (RN.VW + 200) + RN.VW + 200) % (RN.VW + 200) - 100;
        const by = b.y + Math.sin(time * 1.6 + b.ph) * 8;
        const flap = Math.sin(time * 7 + b.ph) * 4;
        ctx.strokeStyle = 'rgba(40,50,70,0.6)';
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 7, by - flap);
        ctx.quadraticCurveTo(bx, by + 2, bx + 7, by - flap);
        ctx.stroke();
      }

      // حبيبات غبار مضيئة تسبح في الهواء
      ctx.globalCompositeOperation = 'screen';
      for (const m of this.motes) {
        const mx = ((m.x + time * m.sp - camX * 0.3) % (RN.VW + 40) + RN.VW + 40) % (RN.VW + 40) - 20;
        const my = m.y + Math.sin(time * 0.8 + m.ph) * 22;
        const a = 0.12 + Math.sin(time * 1.5 + m.ph * 2) * 0.1;
        ctx.fillStyle = this.isDark ? `rgba(190,150,255,${a})` : this.isStars ? `rgba(255,222,140,${a + 0.05})` : this.wi === 3 ? `rgba(255,170,90,${a})` : `rgba(255,250,210,${a + 0.05})`;
        ctx.beginPath(); ctx.arc(mx, my, m.s, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  RN.Background = Background;
})();
