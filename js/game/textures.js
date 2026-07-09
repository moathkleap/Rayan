'use strict';
/* ============================================================
   Rayan & Naya — مولّد الخامات المرسومة
   خامات بلاطات بأسلوب اليد (Hand-painted) مولّدة مرة واحدة على
   Canvas خارجي: تدرجات، بقع لونية، شقوق، حواف غير منتظمة،
   عشب بشفرات، خشب بعروق، جليد ببلورات، حمم متوهجة — 4 نسخ
   لكل نوع لكسر التكرار + إضاءة حافة (Rim light) وظل داخلي (AO)
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;
  const SIZE = 64; // ×2 من حجم البلاطة للحدة على الشاشات الكبيرة

  const cache = {}; // worldIndex -> {ground:[c,c,c,c], top:[...], platform:[...], ...}

  function mkCanvas() {
    const c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    return c;
  }

  // بقع لونية عضوية (فرشاة)
  function blotches(ctx, rng, colors, n, rMin, rMax, alpha) {
    for (let i = 0; i < n; i++) {
      const x = rng() * SIZE, y = rng() * SIZE;
      const r = rMin + rng() * (rMax - rMin);
      ctx.globalAlpha = alpha * (0.5 + rng() * 0.5);
      ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
      ctx.beginPath();
      // شكل غير منتظم: 6 نقاط بنصف قطر متغير
      for (let k = 0; k <= 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const rr = r * (0.7 + rng() * 0.6);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
        if (k === 0) ctx.moveTo(px, py); else ctx.quadraticCurveTo(x + Math.cos(a - 0.5) * rr * 1.15, y + Math.sin(a - 0.5) * rr, px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // حبيبات دقيقة (خامة)
  function grain(ctx, rng, dark, light, n) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rng() < 0.5 ? dark : light;
      ctx.globalAlpha = 0.06 + rng() * 0.12;
      ctx.fillRect(rng() * SIZE, rng() * SIZE, 1 + rng() * 2.5, 1 + rng() * 2.5);
    }
    ctx.globalAlpha = 1;
  }

  // شقوق
  function cracks(ctx, rng, color, n) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.25 + rng() * 0.3;
      let x = rng() * SIZE, y = rng() * SIZE;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + Math.floor(rng() * 3);
      for (let s = 0; s < segs; s++) {
        x += (rng() - 0.5) * 22; y += rng() * 14;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // تظليل داخلي علوي/سفلي (يمنح عمقًا)
  function innerShade(ctx, topLight, bottomDark) {
    let g = ctx.createLinearGradient(0, 0, 0, SIZE);
    g.addColorStop(0, `rgba(255,255,255,${topLight})`);
    g.addColorStop(0.25, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,10,${bottomDark})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  function makeGround(wi, variant) {
    const w = RN.C.WORLDS[wi];
    const rng = U.rng(wi * 100 + variant * 17 + 5);
    const c = mkCanvas();
    const ctx = c.getContext('2d');
    const base = w.ground;
    // قاعدة متدرجة
    const g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, U.shade(base, 0.06));
    g.addColorStop(1, U.shade(base, -0.1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
    // طبقات فرشاة
    blotches(ctx, rng, [U.shade(base, -0.18), U.shade(base, 0.12), U.shade(base, -0.08)], 10, 5, 16, 0.35);
    blotches(ctx, rng, [U.shade(base, 0.2)], 4, 2, 6, 0.3);
    grain(ctx, rng, '#000000', '#ffffff', 90);
    // صخيرات مدفونة
    for (let i = 0; i < 3; i++) {
      const x = rng() * SIZE, y = 14 + rng() * 44, r = 3 + rng() * 6;
      ctx.fillStyle = U.shade(base, -0.22);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, rng(), 0, 7); ctx.fill();
      ctx.fillStyle = U.shade(base, 0.15);
      ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.5, r * 0.3, rng(), 0, 7); ctx.fill();
    }
    cracks(ctx, rng, U.shade(base, -0.35), 2);
    innerShade(ctx, 0.05, 0.14);
    return c;
  }

  function makeTop(wi, variant) {
    // بلاطة السطح: أرض + غطاء (عشب/رمل ناعم/ثلج/رماد/سحاب/بلاط قوطي)
    const w = RN.C.WORLDS[wi];
    const rng = U.rng(wi * 313 + variant * 29 + 11);
    const c = makeGround(wi, variant + 10);
    const ctx = c.getContext('2d');
    const top = w.groundTop;
    // حافة غير منتظمة
    ctx.beginPath();
    ctx.moveTo(0, 0);
    let y = 10 + rng() * 4;
    ctx.lineTo(0, y);
    for (let x = 0; x <= SIZE; x += 8) {
      y = U.clamp(y + (rng() - 0.5) * 6, 7, 18);
      ctx.quadraticCurveTo(x - 4, y + (rng() - 0.5) * 4, x, y);
    }
    ctx.lineTo(SIZE, 0);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, 0, 0, 20);
    tg.addColorStop(0, U.shade(top, 0.18));
    tg.addColorStop(1, U.shade(top, -0.12));
    ctx.fillStyle = tg;
    ctx.fill();
    // خط ظل تحت الغطاء
    ctx.strokeStyle = 'rgba(0,0,20,0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // لمسة ضوء علوية
    ctx.fillStyle = 'rgba(255,255,240,0.3)';
    ctx.fillRect(0, 0, SIZE, 2.5);
    // تفاصيل الغطاء حسب العالم
    if (wi === 0) { // شفرات عشب
      for (let i = 0; i < 9; i++) {
        const x = rng() * SIZE;
        const h = 4 + rng() * 7;
        ctx.strokeStyle = rng() < 0.3 ? U.shade(top, 0.25) : U.shade(top, -0.1);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.quadraticCurveTo(x + (rng() - 0.5) * 5, 6, x + (rng() - 0.5) * 8, 12 - h);
        ctx.stroke();
      }
      // زهيرات
      if (rng() < 0.5) {
        const x = rng() * SIZE;
        ctx.fillStyle = U.pick(['#ffd6e8', '#fff3b0', '#d6e8ff']);
        for (let k = 0; k < 4; k++) {
          const a = k * 1.57;
          ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2, 5 + Math.sin(a) * 2, 1.5, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#e8a83a';
        ctx.beginPath(); ctx.arc(x, 5, 1.4, 0, 7); ctx.fill();
      }
    } else if (wi === 2) { // بريق ثلجي
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(rng() * SIZE, 2 + rng() * 10, 1.5, 1.5);
      }
    } else if (wi === 1) { // تموجات رمل
      ctx.strokeStyle = U.shade(top, -0.15);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const yy = 4 + i * 4 + rng() * 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.quadraticCurveTo(SIZE / 2, yy + (rng() - 0.5) * 5, SIZE, yy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (wi === 3) { // جمرات على السطح
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rng() < 0.5 ? '#ff8a3a' : '#ffb84a';
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(rng() * SIZE, 4 + rng() * 8, 1.4, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (RN.C.WORLDS[wi].id === 'dark') { // نقوش سحرية باهتة
      ctx.strokeStyle = 'rgba(160,110,255,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(SIZE / 2 + (rng() - 0.5) * 20, 8, 3 + rng() * 2, 0, 7);
      ctx.stroke();
    } else if (RN.C.WORLDS[wi].id === 'stars') { // بريق نجمي على السطح
      ctx.fillStyle = 'rgba(255,232,150,0.75)';
      for (let i = 0; i < 3; i++) {
        const sx = rng() * SIZE, sy = 3 + rng() * 9;
        ctx.fillRect(sx - 2.5, sy - 0.6, 5, 1.2);
        ctx.fillRect(sx - 0.6, sy - 2.5, 1.2, 5);
      }
    }
    return c;
  }

  function makePlatform(wi, variant) {
    const w = RN.C.WORLDS[wi];
    const rng = U.rng(wi * 517 + variant * 31 + 3);
    const c = mkCanvas();
    const ctx = c.getContext('2d');
    if (wi === 0) {
      // لوح خشبي بعروق
      const g = ctx.createLinearGradient(0, 4, 0, 30);
      g.addColorStop(0, '#a8763e'); g.addColorStop(0.5, '#8a5a30'); g.addColorStop(1, '#6e4523');
      ctx.fillStyle = g;
      U.roundRect(ctx, 0, 4, SIZE, 26, 6); ctx.fill();
      // عروق الخشب
      ctx.strokeStyle = 'rgba(60,35,15,0.5)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const yy = 9 + i * 5 + rng() * 2;
        ctx.beginPath();
        ctx.moveTo(2, yy);
        ctx.quadraticCurveTo(SIZE / 2, yy + (rng() - 0.5) * 6, SIZE - 2, yy);
        ctx.stroke();
      }
      // عقدة خشب
      ctx.strokeStyle = 'rgba(60,35,15,0.6)';
      ctx.beginPath(); ctx.ellipse(12 + rng() * 40, 16, 3.5, 2.4, 0, 0, 7); ctx.stroke();
      // إضاءة علوية ومسامير
      ctx.fillStyle = 'rgba(255,230,180,0.45)';
      ctx.fillRect(3, 5, SIZE - 6, 3);
      ctx.fillStyle = '#4a3018';
      ctx.beginPath(); ctx.arc(7, 12, 2, 0, 7); ctx.arc(SIZE - 7, 12, 2, 0, 7); ctx.fill();
    } else if (wi === 4) {
      // سحابة منمقة
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.beginPath();
      ctx.ellipse(SIZE / 2, 18, SIZE / 2 - 2, 13, 0, 0, 7);
      ctx.ellipse(SIZE / 4, 14, 12, 9, 0, 0, 7);
      ctx.ellipse(SIZE * 0.72, 13, 13, 9, 0, 0, 7);
      ctx.fill();
      const g = ctx.createLinearGradient(0, 6, 0, 30);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(140,170,220,0.55)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(SIZE / 2, 19, SIZE / 2 - 2, 12, 0, 0, 7);
      ctx.fill();
    } else {
      // حجر منحوت بلون العالم
      const base = U.shade(w.mid, 0.15);
      const g = ctx.createLinearGradient(0, 4, 0, 30);
      g.addColorStop(0, U.shade(base, 0.2)); g.addColorStop(1, U.shade(base, -0.2));
      ctx.fillStyle = g;
      U.roundRect(ctx, 0, 4, SIZE, 26, 6); ctx.fill();
      blotches(ctx, rng, [U.shade(base, -0.15), U.shade(base, 0.15)], 5, 3, 9, 0.3);
      ctx.strokeStyle = U.shade(base, -0.35);
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(SIZE * 0.33, 6); ctx.lineTo(SIZE * 0.3, 28); ctx.moveTo(SIZE * 0.68, 6); ctx.lineTo(SIZE * 0.72, 28); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(3, 5, SIZE - 6, 3);
      if (RN.C.WORLDS[wi].id === 'dark') { // توهج روني
        ctx.fillStyle = 'rgba(160,110,255,0.5)';
        ctx.beginPath(); ctx.arc(SIZE / 2, 17, 3, 0, 7); ctx.fill();
      } else if (RN.C.WORLDS[wi].id === 'stars') { // توهج نجمي
        ctx.fillStyle = 'rgba(255,222,120,0.6)';
        ctx.beginPath(); ctx.arc(SIZE / 2, 17, 2.6, 0, 7); ctx.fill();
      }
    }
    return c;
  }

  function makeIce(variant) {
    const rng = U.rng(2000 + variant * 41);
    const c = mkCanvas();
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, '#cfe4f4'); g.addColorStop(0.5, '#a9c8e4'); g.addColorStop(1, '#8fb4d8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
    blotches(ctx, rng, ['#bcd8ee', '#9fc2e0'], 6, 6, 16, 0.4);
    // خطوط بلورية
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.4 + rng() * 0.4;
      ctx.beginPath();
      const x = rng() * SIZE, y = rng() * SIZE;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8 + rng() * 14, y - 10 - rng() * 12);
      if (rng() < 0.5) ctx.lineTo(x + 20 + rng() * 10, y - 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // لمعة كبيرة قطرية
    const shine = ctx.createLinearGradient(0, SIZE, SIZE, 0);
    shine.addColorStop(0.35, 'rgba(255,255,255,0)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    shine.addColorStop(0.62, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, SIZE, SIZE);
    innerShade(ctx, 0.15, 0.12);
    return c;
  }

  const Textures = {
    get(wi) {
      if (cache[wi]) return cache[wi];
      const set = { ground: [], top: [], platform: [], ice: [] };
      for (let v = 0; v < 4; v++) {
        set.ground.push(makeGround(wi, v));
        set.top.push(makeTop(wi, v));
        set.platform.push(makePlatform(wi, v));
        if (wi === 2) set.ice.push(makeIce(v));
      }
      cache[wi] = set;
      return set;
    },
  };

  RN.Textures = Textures;
})();
