'use strict';
/* ============================================================
   Rayan & Naya — رسم الشخصيات الكرتونية
   رسم متجهي إجرائي مستمد من الهوية البصرية الحقيقية:
   ريان: شعر بني داكن قصير مع غرّة أمامية، بشرة قمحية فاتحة،
         ابتسامة دافئة، تيشيرت أبيض بشعار برتقالي، شورت كحلي.
   نايا: شعر بني داكن مجعد مع فيونكة، فستان كريمي منفوش
         بزخرفة زهرية، عقد خرز ملون، حذاء أبيض.
   جميع الحركات: وقوف/مشي/جري/قفز/تسلق/اندفاع/هجوم/إصابة/فوز...
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  const SKIN = '#f0c49a';
  const SKIN_SHADE = '#d9a877';
  const HAIR = '#3a2a1e';
  const HAIR_HI = '#54402e';
  const NAYA_SKIN = '#eec09a';
  const NAYA_HAIR = '#33241a';

  /* ---------- حساب وضعية ريان من حالة الحركة والزمن ---------- */
  function rayanPose(state, t, opts) {
    const p = { legA: 0, legB: 0, armA: 0, armB: 0, crouch: 0, lean: 0, bob: 0, mouth: 'smile', eyes: 'open', armPose: null };
    const s = Math.sin, c = Math.cos;
    switch (state) {
      case 'idle':
        p.bob = s(t * 2.2) * 1.4;
        p.armA = s(t * 2.2) * 0.06 + 0.12; p.armB = -p.armA;
        if (Math.floor(t * 0.4) % 6 === 5 && (t * 0.4) % 1 < 0.3) p.eyes = 'blink';
        break;
      case 'walk':
        p.legA = s(t * 8) * 0.55; p.legB = -p.legA;
        p.armA = -s(t * 8) * 0.45; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 8)) * 1.6; p.lean = 0.04;
        break;
      case 'run':
        p.legA = s(t * 13) * 0.85; p.legB = -p.legA;
        p.armA = -s(t * 13) * 0.8; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 13)) * 2.4; p.lean = 0.14; p.mouth = 'open';
        break;
      case 'sprint':
        p.legA = s(t * 16) * 1.0; p.legB = -p.legA;
        p.armA = -s(t * 16) * 0.95; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 16)) * 2.8; p.lean = 0.22; p.mouth = 'open';
        break;
      case 'jump':
        p.legA = -0.5; p.legB = 0.35; p.armA = -2.6; p.armB = 0.5; p.mouth = 'open'; break;
      case 'fall':
        p.legA = 0.3; p.legB = -0.25; p.armA = -2.2; p.armB = -2.2; p.mouth = 'open'; break;
      case 'doubleJump':
        p.legA = 0.9; p.legB = -0.9; p.armA = -2.8; p.armB = 2.8; p.mouth = 'open'; break;
      case 'wallSlide':
        p.legA = 0.4; p.legB = 0.2; p.armA = -1.6; p.armB = 0.3; p.lean = -0.15; break;
      case 'climb':
        p.legA = s(t * 7) * 0.5; p.legB = -p.legA;
        p.armA = -2.6 + s(t * 7) * 0.4; p.armB = -2.6 - s(t * 7) * 0.4; break;
      case 'dash':
        p.legA = 1.1; p.legB = -0.6; p.armA = 1.8; p.armB = -1.9; p.lean = 0.35; p.mouth = 'grit'; break;
      case 'slide':
        p.crouch = 0.55; p.legA = 1.2; p.legB = 1.0; p.armA = -0.8; p.armB = 0.4; p.lean = -0.3; break;
      case 'attack':
        { const k = Math.min(1, t / 0.22);
          p.armA = -2.6 + k * 3.4; p.armB = 0.5; p.lean = 0.18 * k; p.mouth = 'grit'; p.armPose = 'swing'; }
        break;
      case 'shoot':
        p.armA = -1.57; p.armB = 0.3; p.lean = 0.08; p.mouth = 'grit'; break;
      case 'slam':
        p.legA = 0.8; p.legB = 0.8; p.armA = -2.9; p.armB = -2.9; p.mouth = 'grit'; break;
      case 'glide':
        p.legA = 0.35; p.legB = 0.15; p.armA = -3.0; p.armB = -3.0; p.mouth = 'open'; break;
      case 'hurt':
        p.legA = -0.4; p.legB = 0.5; p.armA = -2.0; p.armB = 2.0; p.lean = -0.25; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'death':
        p.crouch = 0.7; p.armA = 0.9; p.armB = -0.9; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'victory':
        { const hop = Math.abs(s(t * 6)) * 5;
          p.bob = -hop; p.armA = -2.9 + s(t * 6) * 0.2; p.armB = -2.9 - s(t * 6) * 0.2;
          p.legA = s(t * 6) * 0.2; p.mouth = 'grin'; }
        break;
      case 'celebrate':
        p.armA = -2.9; p.armB = 0.9; p.bob = Math.abs(s(t * 5)) * 3; p.mouth = 'grin'; break;
      default: break;
    }
    return p;
  }

  /* ---------- رسم ريان ----------
     x,y: مركز القدمين. facing: 1 يمين، -1 يسار. */
  function drawRayan(ctx, x, y, state, t, facing, outfit, fx) {
    const p = rayanPose(state, t, fx);
    const o = outfit || RN.C.OUTFITS.explorer;
    fx = fx || {};
    ctx.save();
    ctx.translate(x, y + (p.bob || 0));
    ctx.scale(facing, 1);
    ctx.rotate((p.lean || 0));
    const cr = p.crouch * 12;
    ctx.translate(0, cr);

    if (fx.shield) { // هالة الدرع
      ctx.globalAlpha = 0.35 + Math.sin(t * 8) * 0.1;
      ctx.fillStyle = '#7affc8';
      ctx.beginPath(); ctx.arc(0, -30, 34, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (fx.invincible) {
      ctx.globalAlpha = 0.9 + Math.sin(t * 20) * 0.1;
    }

    // ---- ساق خلفية ----
    leg(ctx, -4, -22, p.legB, o);
    // ---- ذراع خلفية ----
    arm(ctx, -5, -34, p.armB, o, false, p, fx);
    // ---- الجسم: تيشيرت ----
    ctx.fillStyle = o.shirt;
    U.roundRect(ctx, -9, -40, 18, 20, 5); ctx.fill();
    ctx.fillStyle = U.shade(o.shirt, -0.12);
    ctx.fillRect(-9, -25, 18, 4);
    // شعار الصدر (لوح تزلج مبسط — من قميص ريان الحقيقي)
    ctx.fillStyle = o.shirtDeco;
    ctx.save(); ctx.translate(0, -31); ctx.rotate(-0.5);
    U.roundRect(ctx, -5, -2, 10, 4, 2); ctx.fill();
    ctx.fillStyle = U.shade(o.shirtDeco, -0.3);
    ctx.beginPath(); ctx.arc(-3, 2.5, 1.3, 0, 7); ctx.arc(3, 2.5, 1.3, 0, 7); ctx.fill();
    ctx.restore();
    // ---- شورت ----
    ctx.fillStyle = o.pants;
    U.roundRect(ctx, -8.5, -23, 17, 8, 3); ctx.fill();
    // ---- ساق أمامية ----
    leg(ctx, 4, -22, p.legA, o);
    // ---- الرأس ----
    head(ctx, p, t, o, fx);
    // ---- ذراع أمامية ----
    arm(ctx, 5, -34, p.armA, o, true, p, fx);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function leg(ctx, ox, oy, ang, o) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang * 0.6);
    ctx.strokeStyle = SKIN; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ang > 0 ? 3 : -1, 15); ctx.stroke();
    // حذاء رياضي
    ctx.fillStyle = o.shoes;
    ctx.save(); ctx.translate(ang > 0 ? 3 : -1, 17);
    U.roundRect(ctx, -4, -3, 11, 6, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, 1, 11, 2);
    ctx.restore();
    ctx.restore();
  }

  function arm(ctx, ox, oy, ang, o, front, p, fx) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    // كم القميص
    ctx.strokeStyle = front ? o.shirt : U.shade(o.shirt, -0.15);
    ctx.lineWidth = 6.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
    // الساعد واليد
    ctx.strokeStyle = front ? SKIN : SKIN_SHADE;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, 15); ctx.stroke();
    ctx.fillStyle = front ? SKIN : SKIN_SHADE;
    ctx.beginPath(); ctx.arc(0, 16, 3.4, 0, 7); ctx.fill();
    // شفرة الطاقة عند الهجوم
    if (front && p.armPose === 'swing') {
      const grad = ctx.createLinearGradient(0, 16, 0, 44);
      grad.addColorStop(0, fx && fx.power2x ? '#ff5a8a' : '#5ad8ff');
      grad.addColorStop(1, 'rgba(90,216,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 42); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 38); ctx.stroke();
    }
    ctx.restore();
  }

  function head(ctx, p, t, o, fx) {
    ctx.save();
    ctx.translate(0, -47);
    // رقبة
    ctx.fillStyle = SKIN;
    ctx.fillRect(-3, 4, 6, 6);
    // وجه
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
    // أذن
    ctx.beginPath(); ctx.arc(-11, 1, 3.2, 0, 7); ctx.fill();
    // شعر بني داكن قصير — غرّة أمامية صغيرة مثل صورة ريان
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0, -3, 13.4, Math.PI * 0.95, Math.PI * 2.12);
    ctx.quadraticCurveTo(13, -8, 10, -5);
    ctx.quadraticCurveTo(8, -9, 3, -8.5);
    ctx.quadraticCurveTo(-3, -10, -8, -7);
    ctx.quadraticCurveTo(-12.5, -6, -13, 1);
    ctx.closePath(); ctx.fill();
    // غرة أمامية مرفوعة قليلًا
    ctx.beginPath();
    ctx.moveTo(6, -11);
    ctx.quadraticCurveTo(12, -14, 13.5, -8);
    ctx.quadraticCurveTo(10, -9.5, 7, -7.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = HAIR_HI;
    ctx.beginPath(); ctx.ellipse(4, -10, 5, 2.2, -0.3, 0, 7); ctx.fill();

    // عيون بنية كبيرة (اتجاه اليمين)
    if (p.eyes === 'open') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(5.5, -1, 3.1, 3.6, 0, 0, 7); ctx.ellipse(-2.5, -1, 3.1, 3.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a2f1d';
      ctx.beginPath(); ctx.arc(6.3, -0.6, 1.9, 0, 7); ctx.arc(-1.7, -0.6, 1.9, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(6.9, -1.3, 0.7, 0, 7); ctx.arc(-1.1, -1.3, 0.7, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#4a2f1d'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(8, -1); ctx.moveTo(-5, -1); ctx.lineTo(0, -1); ctx.stroke();
    }
    // حواجب
    ctx.strokeStyle = HAIR; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    const browY = p.mouth === 'grit' ? -5.2 : -5.8;
    ctx.beginPath(); ctx.moveTo(3, browY); ctx.lineTo(8.4, browY - 0.6); ctx.moveTo(-5.2, browY - 0.6); ctx.lineTo(0, browY); ctx.stroke();
    // أنف
    ctx.strokeStyle = SKIN_SHADE; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(2.5, 1.5); ctx.quadraticCurveTo(3.6, 3, 2.4, 4); ctx.stroke();
    // فم — ابتسامة ريان
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.7;
    if (p.mouth === 'smile') {
      ctx.beginPath(); ctx.moveTo(-1.5, 6.2); ctx.quadraticCurveTo(2, 9, 5.5, 6.4); ctx.stroke();
    } else if (p.mouth === 'grin' || p.mouth === 'open') {
      ctx.fillStyle = '#7a3a30';
      ctx.beginPath(); ctx.moveTo(-2, 6); ctx.quadraticCurveTo(2, 11.5, 6, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.2, 6, 6.4, 1.7);
    } else if (p.mouth === 'grit') {
      ctx.beginPath(); ctx.moveTo(-1, 7); ctx.lineTo(5.5, 7); ctx.stroke();
    } else if (p.mouth === 'sad') {
      ctx.beginPath(); ctx.moveTo(-1, 8); ctx.quadraticCurveTo(2, 6, 5.5, 8); ctx.stroke();
    }

    // إكسسوارات الملابس
    hat(ctx, o.hat, t);
    ctx.restore();
  }

  function hat(ctx, kind, t) {
    if (!kind) return;
    switch (kind) {
      case 'helm':
        ctx.fillStyle = '#aab4c8';
        ctx.beginPath(); ctx.arc(0, -4, 14, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#d8b23a'; ctx.fillRect(-2, -18, 4, 6);
        break;
      case 'band':
        ctx.fillStyle = '#c03a3a';
        ctx.fillRect(-13, -8, 26.5, 4.5);
        ctx.beginPath(); ctx.moveTo(-13, -6); ctx.lineTo(-20, -2); ctx.lineTo(-19, -8); ctx.closePath(); ctx.fill();
        break;
      case 'antenna':
        ctx.strokeStyle = '#5f7888'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, -21); ctx.stroke();
        ctx.fillStyle = '#3ad8e8';
        ctx.beginPath(); ctx.arc(0, -22, 2.5 + Math.sin(t * 6) * 0.5, 0, 7); ctx.fill();
        break;
      case 'visor':
        ctx.fillStyle = 'rgba(122,92,255,0.45)';
        U.roundRect(ctx, -9, -4, 20, 7, 3.5); ctx.fill();
        ctx.strokeStyle = '#e8e8f4'; ctx.lineWidth = 1.5; U.roundRect(ctx, -9, -4, 20, 7, 3.5); ctx.stroke();
        break;
      case 'fedora':
        ctx.fillStyle = '#6a4e2a';
        ctx.beginPath(); ctx.ellipse(0, -9, 16, 4, 0, 0, 7); ctx.fill();
        U.roundRect(ctx, -9, -19, 18, 11, 4); ctx.fill();
        ctx.fillStyle = '#3a2a16'; ctx.fillRect(-9, -11, 18, 3);
        break;
    }
  }

  /* ---------- رسم نايا ----------
     poses: idle, worried, cheer, walk, captive, wave, sit */
  function drawNaya(ctx, x, y, pose, t, facing, outfitId, scale) {
    const o = RN.C.NAYA_OUTFITS[outfitId || 'princess'] || RN.C.NAYA_OUTFITS.princess;
    const s = Math.sin;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((facing || 1) * (scale || 1), scale || 1);
    let bob = 0, armA = 0.25, armB = -0.25, mouth = 'smile', eyes = 'open';
    if (pose === 'idle') { bob = s(t * 2.4) * 1.2; }
    if (pose === 'worried') { armA = 2.4; armB = 2.4; mouth = 'sad'; bob = s(t * 3) * 0.8; }
    if (pose === 'cheer') { armA = -2.8; armB = -2.8; mouth = 'grin'; bob = -Math.abs(s(t * 6)) * 4; }
    if (pose === 'wave') { armA = -2.6 + s(t * 8) * 0.35; mouth = 'grin'; bob = s(t * 3) * 1; }
    if (pose === 'walk') { armA = s(t * 8) * 0.5; armB = -armA; bob = Math.abs(s(t * 8)) * 1.4; }
    if (pose === 'captive') { armA = -1.9; armB = -1.2; mouth = 'sad'; bob = s(t * 2) * 0.8; }
    if (pose === 'think') { armA = -2.0; armB = 0.3; mouth = 'hmm'; bob = s(t * 2.5) * 1; }
    ctx.translate(0, bob);

    // أرجل + حذاء أبيض
    ctx.strokeStyle = NAYA_SKIN; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3.5, -16); ctx.lineTo(-3.5, -4); ctx.moveTo(3.5, -16); ctx.lineTo(3.5, -4); ctx.stroke();
    ctx.fillStyle = '#f8f8f4';
    U.roundRect(ctx, -7.5, -5, 8, 5, 2.5); U.roundRect(ctx, 0.5, -5, 8, 5, 2.5); ctx.fill();

    // ذراع خلفية
    nayaArm(ctx, -6, -30, armB, false);

    // فستان منفوش (كريمي) — طبقات تول
    ctx.fillStyle = U.shade(o.dress, -0.08);
    ctx.beginPath(); ctx.moveTo(-8, -32); ctx.quadraticCurveTo(-17, -14, -13, -12);
    ctx.quadraticCurveTo(0, -8, 13, -12); ctx.quadraticCurveTo(17, -14, 8, -32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.dress;
    ctx.beginPath(); ctx.moveTo(-7, -32); ctx.quadraticCurveTo(-14, -16, -11, -14.5);
    ctx.quadraticCurveTo(0, -11, 11, -14.5); ctx.quadraticCurveTo(14, -16, 7, -32); ctx.closePath(); ctx.fill();
    // زخرفة زهرية على الصدر (مثل فستانها)
    ctx.fillStyle = o.deco;
    for (const [fx2, fy] of [[-3, -29], [2, -27], [-1, -25]]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(fx2 + Math.cos(a) * 1.6, fy + Math.sin(a) * 1.6, 1, 0, 7); ctx.fill();
      }
    }
    // عقد خرز ملون
    const beads = ['#ff8ab0', '#8ad8ff', '#ffe08a', '#b8ffa8'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = beads[i];
      ctx.beginPath(); ctx.arc(-4.5 + i * 3, -33.5 + Math.abs(i - 1.5) * 1.2, 1.4, 0, 7); ctx.fill();
    }

    // ذراع أمامية
    nayaArm(ctx, 6, -30, armA, true);

    // رأس
    ctx.save();
    ctx.translate(0, -43);
    ctx.fillStyle = NAYA_SKIN;
    ctx.fillRect(-2.5, 3, 5, 5);
    ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, 7); ctx.fill();
    // شعر مجعد — عناقيد دوائر حول الرأس
    ctx.fillStyle = NAYA_HAIR;
    const curls = [[-9, -7, 5], [-4, -10.5, 5.5], [2, -11, 5.5], [8, -8, 5], [11, -3, 4.5], [-11.5, -1, 4.5],
      [12, 3, 4], [-12, 5, 4], [10, 9, 3.5], [-10, 10, 3.5]];
    for (const [cx, cy, cr2] of curls) {
      ctx.beginPath(); ctx.arc(cx, cy, cr2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = U.shade(NAYA_HAIR, 0.18);
    ctx.beginPath(); ctx.arc(-3, -9, 2, 0, 7); ctx.arc(5, -8.5, 1.8, 0, 7); ctx.arc(10, -2, 1.6, 0, 7); ctx.fill();
    // فيونكة
    ctx.fillStyle = '#c8a888';
    ctx.beginPath(); ctx.moveTo(6, -11); ctx.lineTo(11, -14.5); ctx.lineTo(10, -9); ctx.closePath();
    ctx.moveTo(6, -11); ctx.lineTo(2, -15); ctx.lineTo(3.5, -9.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -11.5, 1.7, 0, 7); ctx.fill();

    // عيون بنية واسعة
    if (eyes === 'open') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(4.5, -0.5, 2.8, 3.4, 0, 0, 7); ctx.ellipse(-2.8, -0.5, 2.8, 3.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3d2517';
      ctx.beginPath(); ctx.arc(5.1, 0, 1.8, 0, 7); ctx.arc(-2.2, 0, 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(5.6, -0.7, 0.6, 0, 7); ctx.arc(-1.7, -0.7, 0.6, 0, 7); ctx.fill();
      // رموش
      ctx.strokeStyle = NAYA_HAIR; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(7, -3.4); ctx.lineTo(8.4, -4.4); ctx.moveTo(-5.2, -3.4); ctx.lineTo(-6.6, -4.4); ctx.stroke();
    }
    // خدود وردية
    ctx.fillStyle = 'rgba(255,140,140,0.35)';
    ctx.beginPath(); ctx.ellipse(7.5, 3.5, 2.2, 1.4, 0, 0, 7); ctx.ellipse(-6, 3.5, 2.2, 1.4, 0, 0, 7); ctx.fill();
    // أنف
    ctx.strokeStyle = '#d9a877'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(1.5, 1.5); ctx.quadraticCurveTo(2.4, 2.8, 1.4, 3.6); ctx.stroke();
    // فم
    ctx.strokeStyle = '#a04a4a'; ctx.lineWidth = 1.5;
    if (mouth === 'smile') { ctx.beginPath(); ctx.moveTo(-1.5, 5.8); ctx.quadraticCurveTo(1.5, 8, 4.5, 5.8); ctx.stroke(); }
    else if (mouth === 'grin') {
      ctx.fillStyle = '#8a3a3a';
      ctx.beginPath(); ctx.moveTo(-2, 5.5); ctx.quadraticCurveTo(1.5, 10, 5, 5.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.2, 5.5, 5.6, 1.4);
    }
    else if (mouth === 'sad') { ctx.beginPath(); ctx.moveTo(-1.5, 7.5); ctx.quadraticCurveTo(1.5, 5.5, 4.5, 7.5); ctx.stroke(); }
    else if (mouth === 'hmm') { ctx.beginPath(); ctx.moveTo(-0.5, 6.8); ctx.lineTo(3.8, 6.8); ctx.stroke(); }
    ctx.restore();

    ctx.restore();
  }

  function nayaArm(ctx, ox, oy, ang, front) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    ctx.strokeStyle = front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.12);
    ctx.lineWidth = 4.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    ctx.fillStyle = front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.12);
    ctx.beginPath(); ctx.arc(0, 13, 2.8, 0, 7); ctx.fill();
    // سوار خرز
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(0, 9, 1.2, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- ملك الظلال (للمشاهد) ---------- */
  function drawShadowKing(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);
    const wob = Math.sin(t * 2) * 3;
    // عباءة ظل
    const g = ctx.createLinearGradient(0, -90, 0, 0);
    g.addColorStop(0, '#3a2a6a'); g.addColorStop(1, 'rgba(20,10,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.quadraticCurveTo(-42, -60 + wob, -20, -85 + wob);
    ctx.quadraticCurveTo(0, -98 + wob, 20, -85 + wob);
    ctx.quadraticCurveTo(42, -60 + wob, 38, 0);
    ctx.closePath(); ctx.fill();
    // وجه مظلم بعينين متوهجتين
    ctx.fillStyle = '#120a24';
    ctx.beginPath(); ctx.arc(0, -70 + wob, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#b44aff';
    ctx.shadowColor = '#b44aff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(-6, -72 + wob, 3.5, 2, -0.3, 0, 7); ctx.ellipse(6, -72 + wob, 3.5, 2, 0.3, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    // تاج شوكي
    ctx.strokeStyle = '#6a4aff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -84 + wob);
      ctx.lineTo(i * 9, -97 + wob - Math.abs(i) * -3);
      ctx.stroke();
    }
    ctx.restore();
  }

  RN.Chars = { drawRayan, drawNaya, drawShadowKing, SKIN, HAIR };
})();
