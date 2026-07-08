'use strict';
/* ============================================================
   Rayan & Naya — رسم الشخصيات (نسخة عالية الدقة v3)
   وجوه بتظليل متعدد الطبقات: تدرج جلد + ظل جانبي + إضاءة حافة
   (Rim Light) + لمعة جبهة، عيون زجاجية بقزحية متدرجة وحلقة
   حوفية ورموش وجفون، شعر بخصلات فردية ولمعات، ملابس بثنيات
   وأطراف وخياطة، فستان تول متعدد الطبقات ببريق — مع الحفاظ
   الكامل على ملامح ريان ونايا الحقيقية.
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  const SKIN = '#edbd8e';
  const SKIN_HI = '#ffdcae';
  const SKIN_SHADE = '#d09e66';
  const SKIN_DEEP = '#b8854e';
  const LINE = 'rgba(52,30,18,0.8)';
  const HAIR = '#241a12';
  const HAIR_DK = '#150e07';
  const HAIR_HI = '#4a3826';
  const NAYA_SKIN = '#efc29c';
  const NAYA_SKIN_HI = '#ffdfc0';
  const NAYA_HAIR = '#2c1f14';
  const NAYA_HAIR_HI = '#5c4128';

  // ---- أحجام الشخصيات ----
  // نايا هي المقياس الأساسي، وريان أطول (وأكبر) منها بنسبة 50% على الطول.
  // ملاحظة: رسمة نايا الداخلية أعلى قليلًا من ريان (شعر مجعّد + فيونكة +
  // فستان منفوش)، لذا نعوّض بنسبة الارتفاع الداخلي المقيسة كي يصبح طول
  // ريان الظاهر أكبر من نايا بنسبة 50% بالضبط.
  const NAYA_SCALE = 1.15;
  const CHAR_HEIGHT_RATIO = 65.5 / 62; // ارتفاع نايا الداخلي ÷ ارتفاع ريان الداخلي
  const RAYAN_SCALE = NAYA_SCALE * 1.5 * CHAR_HEIGHT_RATIO; // ≈ 1.822 — أطول من نايا 50% ظاهريًا

  function skinGrad(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, SKIN_HI);
    g.addColorStop(0.45, SKIN);
    g.addColorStop(1, SKIN_SHADE);
    return g;
  }

  /* ---------- حساب وضعية ريان ---------- */
  function rayanPose(state, t) {
    const p = { legA: 0, legB: 0, armA: 0, armB: 0, crouch: 0, lean: 0, bob: 0, mouth: 'smile', eyes: 'open', armPose: null, breath: 0, hairSway: 0, armFront: false };
    const s = Math.sin;
    switch (state) {
      case 'idle':
        p.breath = s(t * 2.1) * 0.5 + 0.5;
        p.bob = s(t * 2.1) * 1.3;
        // ذراعان تتدليان عموديًا بجوار الجسم مع تأرجح تنفس خفيف
        p.armA = -(s(t * 2.1) * 0.04 + 0.09); p.armB = s(t * 2.1) * 0.04 + 0.09;
        if ((t % 3.4) > 3.25) p.eyes = 'blink';
        break;
      case 'walk':
        p.legA = s(t * 8) * 0.55; p.legB = -p.legA;
        p.armA = -s(t * 8) * 0.45; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 8)) * 1.6; p.lean = 0.04; p.hairSway = 0.3;
        break;
      case 'run':
        p.legA = s(t * 13) * 0.85; p.legB = -p.legA;
        p.armA = -s(t * 13) * 0.8; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 13)) * 2.4; p.lean = 0.14; p.mouth = 'open'; p.hairSway = 0.7;
        break;
      case 'sprint':
        p.legA = s(t * 16) * 1.0; p.legB = -p.legA;
        p.armA = -s(t * 16) * 0.95; p.armB = -p.armA;
        p.bob = Math.abs(s(t * 16)) * 2.8; p.lean = 0.22; p.mouth = 'open'; p.hairSway = 1;
        break;
      case 'jump':
        p.legA = -0.5; p.legB = 0.35; p.armA = -2.6; p.armB = 0.5; p.mouth = 'open'; p.hairSway = -0.6; break;
      case 'fall':
        p.legA = 0.3; p.legB = -0.25; p.armA = -2.2; p.armB = -2.2; p.mouth = 'open'; p.hairSway = -1; break;
      case 'doubleJump':
        p.legA = 0.9; p.legB = -0.9; p.armA = -2.8; p.armB = 2.8; p.mouth = 'open'; p.hairSway = -0.8; break;
      case 'wallSlide':
        p.legA = 0.4; p.legB = 0.2; p.armA = -1.6; p.armB = 0.3; p.lean = -0.15; p.hairSway = -0.5; break;
      case 'climb':
        p.legA = s(t * 7) * 0.5; p.legB = -p.legA;
        p.armA = -2.6 + s(t * 7) * 0.4; p.armB = -2.6 - s(t * 7) * 0.4; break;
      case 'dash':
        p.armFront = true;
        p.legA = 1.1; p.legB = -0.6; p.armA = 1.8; p.armB = -1.9; p.lean = 0.35; p.mouth = 'grit'; p.hairSway = 1.4; break;
      case 'slide':
        p.crouch = 0.55; p.legA = 1.2; p.legB = 1.0; p.armA = -0.8; p.armB = 0.4; p.lean = -0.3; break;
      case 'attack': {
        p.armFront = true;
        const k = Math.min(1, t / 0.22);
        p.armA = -2.6 + k * 3.4; p.armB = 0.5; p.lean = 0.18 * k; p.mouth = 'grit'; p.armPose = 'swing'; p.hairSway = 0.5;
        break;
      }
      case 'shoot':
        p.armFront = true;
        p.armA = -1.57; p.armB = 0.3; p.lean = 0.08; p.mouth = 'grit'; break;
      case 'slam':
        p.armFront = true;
        p.legA = 0.8; p.legB = 0.8; p.armA = -2.8; p.armB = -2.8; p.mouth = 'grit'; p.hairSway = -1.2; break;
      case 'glide':
        p.legA = 0.35; p.legB = 0.15; p.armA = -2.85; p.armB = -2.85; p.mouth = 'open'; p.hairSway = -0.7; break;
      case 'hurt':
        p.legA = -0.4; p.legB = 0.5; p.armA = -2.0; p.armB = 2.0; p.lean = -0.25; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'death':
        p.crouch = 0.7; p.armA = 0.9; p.armB = -0.9; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'victory': {
        const hop = Math.abs(s(t * 6)) * 5;
        p.bob = -hop; p.armA = -2.74 + s(t * 6) * 0.15; p.armB = -2.74 - s(t * 6) * 0.15;
        p.legA = s(t * 6) * 0.2; p.mouth = 'grin';
        break;
      }
      case 'celebrate':
        p.armA = -2.7; p.armB = 0.9; p.bob = Math.abs(s(t * 5)) * 3; p.mouth = 'grin'; p.breath = s(t * 2) * 0.5 + 0.5; break;
      default: break;
    }
    return p;
  }

  /* ============================================================
     ريان
     ============================================================ */
  function drawRayan(ctx, x, y, state, t, facing, outfit, fx) {
    const p = rayanPose(state, t);
    const o = outfit || RN.C.OUTFITS.explorer;
    fx = fx || {};
    const scale = fx.scale || RAYAN_SCALE;
    ctx.save();
    ctx.translate(x, y + (p.bob || 0) * scale);
    ctx.scale(facing * scale, scale);
    ctx.rotate(p.lean || 0);
    ctx.translate(0, p.crouch * 12);

    if (fx.shield) {
      ctx.globalCompositeOperation = 'screen';
      const sg = ctx.createRadialGradient(0, -30, 10, 0, -30, 38);
      sg.addColorStop(0, 'rgba(122,255,200,0.05)');
      sg.addColorStop(0.8, `rgba(122,255,200,${0.25 + Math.sin(t * 8) * 0.08})`);
      sg.addColorStop(1, 'rgba(122,255,200,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(0, -30, 38, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (fx.invincible) ctx.globalAlpha = 0.92 + Math.sin(t * 20) * 0.08;

    const breath = (p.breath || 0) * 0.7;

    // ---- ساق خلفية / ذراع خلفية (الكتف عند حافة الجذع) ----
    leg(ctx, -4.7, -21, p.legB, o, false);
    arm(ctx, -9.7, -36.5, p.armB, o, false, p, fx);

    // ---- الجذع: تيشيرت ----
    const sg2 = ctx.createLinearGradient(-9, -40, 9, -20);
    sg2.addColorStop(0, U.shade(o.shirt, 0.12));
    sg2.addColorStop(0.55, o.shirt);
    sg2.addColorStop(1, U.shade(o.shirt, -0.2));
    ctx.fillStyle = sg2;
    const hem = Math.sin(t * 10) * (p.hairSway || 0) * 1.2;
    ctx.beginPath();
    ctx.moveTo(-9.6, -40 + breath * -0.8);
    ctx.quadraticCurveTo(-11.2, -30, -10.1 - hem * 0.5, -19.5);
    ctx.lineTo(10.1 + hem * 0.5, -19.5);
    ctx.quadraticCurveTo(11.2 + breath * 0.8, -30, 9.6, -40 + breath * -0.8);
    ctx.quadraticCurveTo(0, -43.4 - breath, -9.6, -40 + breath * -0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.stroke();
    // ظل جانبي على القميص (يمنح استدارة)
    const shSide = ctx.createLinearGradient(-9, 0, -1, 0);
    shSide.addColorStop(0, U.alpha(U.shade(o.shirt, -0.4), 0.35));
    shSide.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shSide;
    ctx.beginPath();
    ctx.moveTo(-9, -40); ctx.quadraticCurveTo(-10.5, -30, -9.5, -20.5);
    ctx.lineTo(-3, -20.5); ctx.quadraticCurveTo(-5, -30, -4, -40);
    ctx.closePath(); ctx.fill();
    // ياقة دائرية مخيطة
    ctx.strokeStyle = U.shade(o.shirt, -0.25); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, -41 - breath * 0.5, 4.6, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.strokeStyle = U.shade(o.shirt, 0.3); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0, -40.2 - breath * 0.5, 4.6, 0.3, Math.PI - 0.3); ctx.stroke();
    // ثنيات قماش
    ctx.strokeStyle = U.alpha(U.shade(o.shirt, -0.32), 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-3, -24.5, -1, -26);
    ctx.moveTo(4, -23); ctx.quadraticCurveTo(6.5, -22, 8, -23.5);
    ctx.moveTo(-7.5, -33); ctx.quadraticCurveTo(-6, -31.5, -6.5, -29.5);
    ctx.stroke();
    // شعار الصدر (لوح تزلج)
    ctx.save();
    ctx.translate(0.5, -31); ctx.rotate(-0.5);
    const dg = ctx.createLinearGradient(-5, 0, 5, 0);
    dg.addColorStop(0, U.shade(o.shirtDeco, 0.25));
    dg.addColorStop(1, U.shade(o.shirtDeco, -0.15));
    ctx.fillStyle = dg;
    U.roundRect(ctx, -5.5, -2, 11, 4.2, 2.1); ctx.fill();
    ctx.strokeStyle = U.alpha(U.shade(o.shirtDeco, -0.5), 0.7); ctx.lineWidth = 0.7;
    U.roundRect(ctx, -5.5, -2, 11, 4.2, 2.1); ctx.stroke();
    ctx.fillStyle = U.shade(o.shirtDeco, -0.4);
    ctx.beginPath(); ctx.arc(-3, 2.9, 1.4, 0, 7); ctx.arc(3, 2.9, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(-3.4, 2.5, 0.5, 0, 7); ctx.arc(2.6, 2.5, 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(-4.5, -1.6, 9, 1.1);
    ctx.restore();

    // ---- شورت ----
    const pg = ctx.createLinearGradient(0, -23, 0, -14.5);
    pg.addColorStop(0, U.shade(o.pants, 0.14));
    pg.addColorStop(1, U.shade(o.pants, -0.14));
    ctx.fillStyle = pg;
    U.roundRect(ctx, -9.3, -22.5, 18.6, 9.5, 3.5); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    U.roundRect(ctx, -9.3, -22.5, 18.6, 9.5, 3.5); ctx.stroke();
    // خط وسط + حافة مخيطة
    ctx.strokeStyle = U.alpha(U.shade(o.pants, -0.4), 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -17); ctx.stroke();
    ctx.strokeStyle = U.alpha(U.shade(o.pants, 0.4), 0.8);
    ctx.beginPath(); ctx.moveTo(-8.2, -14.6); ctx.lineTo(-1.5, -14.6); ctx.moveTo(1.5, -14.6); ctx.lineTo(8.2, -14.6); ctx.stroke();

    // ---- ساق أمامية / ذراع / رأس ----
    // الذراع المتدلية تُرسم خلف الرأس (الرأس الكرتوني أعرض من الجذع)،
    // والمرفوعة أو الهجومية تُرسم أمامه
    leg(ctx, 4.7, -21, p.legA, o, true);
    if (!p.armFront) arm(ctx, 9.7, -36.5, p.armA, o, true, p, fx);
    head(ctx, p, t, o, fx);
    if (p.armFront) arm(ctx, 9.7, -36.5, p.armA, o, true, p, fx);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function leg(ctx, ox, oy, ang, o, front) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang * 0.6);
    const ax = front ? 0.9 : 0.3;
    // ساق ممتلئة (Chunky): أسطوانة مدببة قصيرة بحجم حقيقي
    const lgr = ctx.createLinearGradient(-3, 0, 3.5, 0);
    lgr.addColorStop(0, front ? SKIN : SKIN_SHADE);
    lgr.addColorStop(0.55, front ? SKIN_HI : SKIN);
    lgr.addColorStop(1, front ? SKIN_SHADE : SKIN_DEEP);
    ctx.fillStyle = lgr;
    ctx.beginPath();
    ctx.moveTo(-3.4, -2.5);
    ctx.quadraticCurveTo(-3.7, 4, ax - 2.6, 8.5);
    ctx.quadraticCurveTo(ax - 2.7, 11.5, ax, 11.8);
    ctx.quadraticCurveTo(ax + 2.7, 11.5, ax + 2.6, 8.5);
    ctx.quadraticCurveTo(3.8, 4, 3.4, -2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.15;
    ctx.stroke();
    // جورب سميك
    ctx.fillStyle = '#f8f8f4';
    ctx.beginPath();
    ctx.moveTo(ax - 2.75, 9.2);
    ctx.quadraticCurveTo(ax - 2.8, 12.4, ax, 12.6);
    ctx.quadraticCurveTo(ax + 2.8, 12.4, ax + 2.75, 9.2);
    ctx.quadraticCurveTo(ax, 10.2, ax - 2.75, 9.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.stroke();
    /* حذاء كرتوني كبير — توقيع الأسلوب الجديد:
       جسم منتفخ بمقدمة مستديرة ضخمة ونعل أبيض سميك */
    ctx.save();
    ctx.translate(ax, 14.6);
    const shg = ctx.createLinearGradient(0, -4, 0, 3);
    shg.addColorStop(0, U.shade(o.shoes, 0.28));
    shg.addColorStop(0.55, o.shoes);
    shg.addColorStop(1, U.shade(o.shoes, -0.18));
    ctx.fillStyle = shg;
    ctx.beginPath();
    ctx.moveTo(-4.6, -3.2);                                  // كعب علوي
    ctx.quadraticCurveTo(-5.9, -1.2, -5.4, 1.6);             // ظهر الكعب
    ctx.lineTo(7.2, 1.6);
    ctx.quadraticCurveTo(9.6, 1.2, 9.2, -1.2);               // مقدمة ضخمة مستديرة
    ctx.quadraticCurveTo(8.7, -3.8, 5.6, -4.0);
    ctx.quadraticCurveTo(2.4, -5.6, -0.8, -4.9);             // لسان الحذاء
    ctx.quadraticCurveTo(-3.4, -4.5, -4.6, -3.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.15;
    ctx.stroke();
    // لمعة علوية
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(1.5, -3.4, 3.4, 1.1, -0.12, 0, 7); ctx.fill();
    // غطاء المقدمة المطاطي
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.moveTo(5.2, -3.4);
    ctx.quadraticCurveTo(8.9, -3.2, 9.2, -1.2);
    ctx.quadraticCurveTo(9.4, 0.6, 8.2, 1.4);
    ctx.quadraticCurveTo(6.6, 1.6, 5.8, 1.5);
    ctx.quadraticCurveTo(7.0, -1.4, 5.2, -3.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(52,30,18,0.5)'; ctx.lineWidth = 0.8;
    ctx.stroke();
    // نعل أبيض سميك جدًا
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-5.6, 1.4);
    ctx.quadraticCurveTo(-6.2, 4.6, -3.8, 4.9);
    ctx.lineTo(7.6, 4.9);
    ctx.quadraticCurveTo(10.2, 4.6, 9.6, 1.6);
    ctx.quadraticCurveTo(9.4, 1.0, 8.6, 1.35);
    ctx.lineTo(-4.8, 1.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.0;
    ctx.stroke();
    // خط وسط النعل
    ctx.strokeStyle = 'rgba(140,150,170,0.55)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-4.6, 3.2); ctx.lineTo(9.0, 3.2); ctx.stroke();
    // أربطة
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-0.9, -3.4); ctx.lineTo(2.7, -2.5);
    ctx.moveTo(-1.1, -1.9); ctx.lineTo(2.6, -1.0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function arm(ctx, ox, oy, ang, o, front, p, fx) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    // كم واسع (قطعة ممتلئة وليست خطًا)
    const sg = ctx.createLinearGradient(-3, 0, 3.5, 5);
    sg.addColorStop(0, front ? U.shade(o.shirt, 0.12) : U.shade(o.shirt, -0.16));
    sg.addColorStop(1, front ? U.shade(o.shirt, -0.12) : U.shade(o.shirt, -0.3));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-3.0, -0.6);
    ctx.quadraticCurveTo(-3.6, 3.4, -2.5, 6.2);
    ctx.lineTo(2.9, 6.4);
    ctx.quadraticCurveTo(3.9, 3.2, 3.0, -0.6);
    ctx.quadraticCurveTo(0, -2.2, -3.0, -0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.1;
    ctx.stroke();
    // حافة الكم
    ctx.strokeStyle = U.alpha(U.shade(o.shirt, -0.35), 0.85); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-2.5, 6.2); ctx.lineTo(2.9, 6.4); ctx.stroke();
    // الساعد: كتلة مدببة بانحناءة مرفق
    const fgr = ctx.createLinearGradient(-2.5, 7, 2.5, 13);
    fgr.addColorStop(0, front ? SKIN_HI : SKIN);
    fgr.addColorStop(1, front ? SKIN_SHADE : SKIN_DEEP);
    ctx.fillStyle = fgr;
    ctx.beginPath();
    ctx.moveTo(-2.2, 6.3);
    ctx.quadraticCurveTo(-2.4, 9.6, -1.7, 12.2);
    ctx.quadraticCurveTo(0.1, 13.2, 1.9, 12.2);
    ctx.quadraticCurveTo(2.8, 9.6, 2.5, 6.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.05;
    ctx.stroke();
    // قفاز اليد: كرة كبيرة بإبهام مدمج (أسلوب أبطال المنصات)
    ctx.save();
    ctx.translate(0.1, 15.0);
    const hgg = ctx.createRadialGradient(-0.9, -1.0, 0.5, 0, 0.2, 3.6);
    hgg.addColorStop(0, front ? SKIN_HI : SKIN);
    hgg.addColorStop(1, front ? U.shade(SKIN, -0.06) : SKIN_SHADE);
    // الإبهام
    const thx = front ? -2.2 : 2.2;
    ctx.fillStyle = hgg;
    ctx.beginPath(); ctx.ellipse(thx, -0.8, 1.05, 1.6, front ? -0.4 : 0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.95;
    ctx.beginPath(); ctx.ellipse(thx, -0.8, 1.05, 1.6, front ? -0.4 : 0.4, 0, 7); ctx.stroke();
    // الكف: مستديرة كبيرة
    ctx.fillStyle = hgg;
    ctx.beginPath(); ctx.arc(0, 0.2, 2.75, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.05;
    ctx.beginPath(); ctx.arc(0, 0.2, 2.75, 0, 7); ctx.stroke();
    // ثنية أصابع واحدة ناعمة
    ctx.strokeStyle = U.alpha(SKIN_DEEP, 0.5); ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-1.1, 2.35); ctx.quadraticCurveTo(0, 2.9, 1.1, 2.35);
    ctx.stroke();
    // لمعة
    ctx.fillStyle = 'rgba(255,235,205,0.55)';
    ctx.beginPath(); ctx.ellipse(-0.9, -1.0, 1.0, 0.7, -0.5, 0, 7); ctx.fill();
    ctx.restore();
    // شفرة الطاقة عند الهجوم
    if (front && p.armPose === 'swing') {
      ctx.globalCompositeOperation = 'screen';
      const grad = ctx.createLinearGradient(0, 16, 0, 46);
      grad.addColorStop(0, fx && fx.power2x ? 'rgba(255,90,138,0.95)' : 'rgba(90,216,255,0.95)');
      grad.addColorStop(1, 'rgba(90,216,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0.1, 17); ctx.lineTo(0.1, 44); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0.1, 17); ctx.lineTo(0.1, 39); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  /* ---------- رأس ريان: وجه عالي التفاصيل ---------- */
  function head(ctx, p, t, o, fx) {
    ctx.save();
    ctx.translate(0, -47);

    // رقبة بتدرج وظل الذقن
    const ng = ctx.createLinearGradient(0, 4, 0, 10);
    ng.addColorStop(0, SKIN_SHADE);
    ng.addColorStop(1, SKIN);
    ctx.fillStyle = ng;
    ctx.fillRect(-3.2, 4, 6.4, 6.5);

    // ---- أذن (خلف الوجه — يظهر طرفها الخارجي فقط) ----
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.ellipse(-11.9, 1.4, 2.5, 3.3, 0.12, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(-11.9, 1.4, 2.5, 3.3, 0.12, 0, 7); ctx.stroke();
    ctx.strokeStyle = U.alpha(SKIN_DEEP, 0.8); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12.8, -0.2); ctx.quadraticCurveTo(-11.4, 0.2, -11.8, 2.2); ctx.stroke();

    // ---- شكل الوجه: دائرة بذقن ناعم ----
    const facePath = () => {
      ctx.beginPath();
      ctx.moveTo(-12.3, -1);
      ctx.quadraticCurveTo(-12.7, -8.8, -7.2, -11.9);
      ctx.quadraticCurveTo(0, -14, 7.2, -11.9);
      ctx.quadraticCurveTo(12.7, -8.8, 12.5, -1);
      ctx.quadraticCurveTo(12.3, 6.3, 7.6, 10.3);  // خد أمامي
      ctx.quadraticCurveTo(3.4, 13.2, 0, 13.2);    // ذقن
      ctx.quadraticCurveTo(-5.2, 13, -9, 9.6);
      ctx.quadraticCurveTo(-12.3, 5.8, -12.3, -1);
      ctx.closePath();
    };
    // تدرج جلد أساسي
    const fg = ctx.createRadialGradient(-3.5, -4.5, 3, 0.5, 1, 17);
    fg.addColorStop(0, SKIN_HI);
    fg.addColorStop(0.55, SKIN);
    fg.addColorStop(1, U.shade(SKIN, -0.13));
    facePath();
    ctx.fillStyle = fg;
    ctx.fill();
    // ظل جانبي (الجهة الخلفية)
    ctx.save();
    facePath(); ctx.clip();
    const sSh = ctx.createLinearGradient(-13, 0, -4, 0);
    sSh.addColorStop(0, U.alpha(SKIN_DEEP, 0.4));
    sSh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sSh;
    ctx.fillRect(-14, -14, 10, 28);
    // إضاءة حافة أمامية (Rim)
    const rim = ctx.createLinearGradient(9, 0, 13.5, 0);
    rim.addColorStop(0, 'rgba(255,240,210,0)');
    rim.addColorStop(1, 'rgba(255,240,210,0.5)');
    ctx.fillStyle = rim;
    ctx.fillRect(8, -12, 6, 24);
    // لمعة جبهة
    ctx.fillStyle = 'rgba(255,240,215,0.35)';
    ctx.beginPath(); ctx.ellipse(2, -7.5, 6, 3.2, -0.15, 0, 7); ctx.fill();
    // ظل تحت الشعر على الجبهة
    ctx.fillStyle = U.alpha(SKIN_DEEP, 0.22);
    ctx.beginPath();
    ctx.moveTo(-12.5, -6);
    ctx.quadraticCurveTo(-4, -9.5, 5, -8.6);
    ctx.quadraticCurveTo(11, -8, 13.2, -5.5);
    ctx.quadraticCurveTo(11, -7.5, 5, -7.3);
    ctx.quadraticCurveTo(-4, -7.8, -12.5, -4.5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // خط تحديد الوجه
    facePath();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.05;
    ctx.stroke();

    // ---- الشعر: قصة قصيرة حديثة (Fade) من صورة ريان ----
    // جوانب مدرّجة قصيرة جدًا (تلاشٍ) تظهر خلفية فروة أفتح
    const fade = ctx.createLinearGradient(0, -6, 0, 2);
    fade.addColorStop(0, U.alpha(HAIR, 0.75));
    fade.addColorStop(1, U.alpha(HAIR, 0.06));
    ctx.fillStyle = fade;
    ctx.beginPath();
    ctx.moveTo(-12.4, -3);
    ctx.quadraticCurveTo(-12.6, 1, -11.7, 3.5);
    ctx.lineTo(-10, 3.5);
    ctx.quadraticCurveTo(-10.9, 0.5, -10.8, -3.5);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12.5, -3);
    ctx.quadraticCurveTo(12.6, 1, 11.8, 3.5);
    ctx.lineTo(10.2, 3.5);
    ctx.quadraticCurveTo(11, 0.5, 10.9, -3.5);
    ctx.closePath(); ctx.fill();
    // الكتلة العلوية: قبعة شعر كثيفة قصيرة تلتصق بالجمجمة
    const hg2 = ctx.createLinearGradient(0, -17.5, 0, -6);
    hg2.addColorStop(0, HAIR_HI);
    hg2.addColorStop(0.45, HAIR);
    hg2.addColorStop(1, HAIR_DK);
    ctx.fillStyle = hg2;
    ctx.beginPath();
    ctx.moveTo(-12.45, -2.6);
    ctx.quadraticCurveTo(-13.4, -10, -7.6, -13.6);
    ctx.quadraticCurveTo(0, -16.9, 7.6, -13.6);
    ctx.quadraticCurveTo(13.4, -10, 12.55, -2.6);
    // خط الجبهة الأمامي: حافة شبه مستقيمة بتعرج خفيف (بلا غرّة)
    ctx.quadraticCurveTo(11.9, -5.4, 10.6, -6.7);
    ctx.quadraticCurveTo(9.8, -7.9, 8.2, -7.6);
    ctx.quadraticCurveTo(5.4, -8.5, 2.6, -8.1);
    ctx.quadraticCurveTo(-0.4, -8.7, -3.4, -8.2);
    ctx.quadraticCurveTo(-6.6, -8.8, -9.2, -7.9);
    ctx.quadraticCurveTo(-11, -7.1, -11.8, -5.5);
    ctx.quadraticCurveTo(-12.3, -4.4, -12.45, -2.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,10,5,0.55)'; ctx.lineWidth = 0.9;
    ctx.stroke();
    // نسيج الشعر القصير: أقواس صغيرة كثيفة على الكتلة العلوية
    ctx.strokeStyle = U.alpha('#5a4530', 0.7);
    ctx.lineWidth = 0.85; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const hx = -8.4 + k * 2.15 + ((k * 7) % 3) * 0.35;
      const hy = -11.2 - Math.sin(((k + 0.5) / 8) * Math.PI) * 2.7 + ((k * 5) % 2) * 0.4;
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 0.9, hy - 1.0, hx + 1.8, hy - 0.25);
    }
    ctx.stroke();
    // لمعة إضاءة علوية خفيفة
    ctx.strokeStyle = U.alpha('#6a543c', 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -14.6); ctx.quadraticCurveTo(1, -16.2, 6, -14.4);
    ctx.stroke();
    // خط حلاقة حاد فوق الأذن (تشطيب الحلاق)
    ctx.strokeStyle = U.alpha(HAIR, 0.5); ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-12.2, -4.4); ctx.quadraticCurveTo(-11.1, -5.5, -9.6, -6.2);
    ctx.moveTo(12.3, -4.4); ctx.quadraticCurveTo(11.3, -5.5, 9.8, -6.2);
    ctx.stroke();

    // ---- عيون زجاجية ----
    const lookX = U.clamp(fx.lookX !== undefined ? fx.lookX : 0.5, -1, 1);
    const lookY = U.clamp(fx.lookY || 0, -1, 1);
    if (p.eyes === 'open') {
      for (const ex of [4.9, -3.3]) {
        // بياض بظل جفن علوي
        const wg = ctx.createLinearGradient(0, -4.8, 0, 2.6);
        wg.addColorStop(0, '#dfe4ea');
        wg.addColorStop(0.35, '#ffffff');
        wg.addColorStop(1, '#f3f5f8');
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.ellipse(ex, -1, 3.25, 3.8, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(70,42,26,0.4)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.ellipse(ex, -1, 3.25, 3.8, 0, 0, 7); ctx.stroke();
        const px = lookX * 1.1, py = lookY * 0.9;
        // قزحية بتدرج + حلقة حوفية
        const ig = ctx.createRadialGradient(ex + px - 0.5, -1.4 + py, 0.3, ex + px, -0.8 + py, 2.25);
        ig.addColorStop(0, '#a9743f');
        ig.addColorStop(0.55, '#6b4423');
        ig.addColorStop(0.9, '#3a2110');
        ig.addColorStop(1, '#1c0f05');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(ex + px, -0.8 + py, 2.15, 0, 7); ctx.fill();
        // حدقة
        ctx.fillStyle = '#0d0602';
        ctx.beginPath(); ctx.arc(ex + px, -0.8 + py, 1.0, 0, 7); ctx.fill();
        // لمعتان
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(ex + px * 0.5 + 0.8, -1.8 + py * 0.5, 0.75, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(ex + px * 0.5 - 0.9, 0.2 + py * 0.5, 0.4, 0, 7); ctx.fill();
        // خط رموش علوي + جفن سفلي
        ctx.strokeStyle = 'rgba(46,26,12,0.85)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ex - 3.1, -3.4); ctx.quadraticCurveTo(ex, -5.2, ex + 3.1, -3.5); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,150,110,0.7)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(ex - 2.2, 2.9); ctx.quadraticCurveTo(ex, 3.6, ex + 2.3, 2.9); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#4a2f1d'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(2.1, -0.6); ctx.quadraticCurveTo(4.9, 0.8, 7.7, -0.6);
      ctx.moveTo(-6.1, -0.6); ctx.quadraticCurveTo(-3.3, 0.8, -0.5, -0.6);
      ctx.stroke();
      // رموش مغلقة
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(7.1, 0); ctx.lineTo(8.1, 0.8);
      ctx.moveTo(-5.6, 0); ctx.lineTo(-6.6, 0.8);
      ctx.stroke();
    }
    // ---- حواجب رفيعة مقوسة ----
    ctx.fillStyle = U.alpha(HAIR, 0.92);
    const browY = p.mouth === 'grit' ? -4.9 : p.mouth === 'sad' ? -5.0 : -5.6;
    const tilt = p.mouth === 'grit' ? 0.9 : p.mouth === 'sad' ? -0.7 : -0.3;
    for (const [bx, dir] of [[4.9, 1], [-3.3, -1]]) {
      ctx.beginPath();
      ctx.moveTo(bx - 2.8 * dir, browY + tilt * 0.55 * dir);
      ctx.quadraticCurveTo(bx, browY - 0.9, bx + 2.8 * dir, browY - tilt * 0.4 * dir);
      ctx.quadraticCurveTo(bx, browY - 0.05, bx - 2.8 * dir, browY + tilt * 0.55 * dir + 0.5);
      ctx.closePath(); ctx.fill();
    }
    // ---- أنف بظل ولمعة ----
    ctx.strokeStyle = U.alpha(SKIN_DEEP, 0.9); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(1.9, 1.4); ctx.quadraticCurveTo(3.1, 3.0, 1.8, 4.3); ctx.stroke();
    ctx.fillStyle = U.alpha(SKIN_DEEP, 0.28);
    ctx.beginPath(); ctx.ellipse(1.6, 4.8, 1.6, 0.75, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,215,0.6)';
    ctx.beginPath(); ctx.ellipse(2.7, 2.3, 0.65, 1.0, 0.3, 0, 7); ctx.fill();
    // ---- خدود ----
    ctx.fillStyle = 'rgba(240,120,105,0.25)';
    ctx.beginPath(); ctx.ellipse(7.9, 4.2, 2.4, 1.55, 0.2, 0, 7); ctx.ellipse(-6.5, 4.2, 2.4, 1.55, -0.2, 0, 7); ctx.fill();
    // ---- فم ----
    ctx.strokeStyle = '#93493a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    if (p.mouth === 'smile') {
      ctx.beginPath(); ctx.moveTo(-2.4, 6.4); ctx.quadraticCurveTo(1.2, 9.6, 5.0, 6.6); ctx.stroke();
      // شفة سفلية (لمعة)
      ctx.strokeStyle = 'rgba(255,200,175,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-0.4, 9.4); ctx.quadraticCurveTo(1.4, 10.2, 3.2, 9.4); ctx.stroke();
      // غمازتا الابتسامة
      ctx.strokeStyle = U.alpha(SKIN_DEEP, 0.55); ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-2.9, 5.8); ctx.lineTo(-3.5, 6.6);
      ctx.moveTo(5.5, 6.0); ctx.lineTo(6.1, 6.8);
      ctx.stroke();
    } else if (p.mouth === 'grin' || p.mouth === 'open') {
      ctx.fillStyle = '#6e2f26';
      ctx.beginPath(); ctx.moveTo(-2.2, 6); ctx.quadraticCurveTo(2, 12.2, 6.2, 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#93493a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-2.2, 6); ctx.quadraticCurveTo(2, 12.2, 6.2, 6); ctx.closePath(); ctx.stroke();
      // أسنان بلمعة
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-1.6, 6.15); ctx.lineTo(5.6, 6.15); ctx.lineTo(5, 8); ctx.lineTo(-1, 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(180,190,200,0.5)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0.6, 6.2); ctx.lineTo(0.7, 7.9); ctx.moveTo(2.4, 6.2); ctx.lineTo(2.5, 7.9); ctx.moveTo(4.1, 6.2); ctx.lineTo(4.2, 7.9); ctx.stroke();
      // لسان
      ctx.fillStyle = '#e06a63';
      ctx.beginPath(); ctx.ellipse(2, 10, 2.5, 1.4, 0, 0, 7); ctx.fill();
    } else if (p.mouth === 'grit') {
      ctx.beginPath(); ctx.moveTo(-1, 7.2); ctx.lineTo(5.7, 7.2); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0.6, 7.2); ctx.lineTo(0.6, 8.4); ctx.moveTo(3.6, 7.2); ctx.lineTo(3.6, 8.4); ctx.stroke();
    } else if (p.mouth === 'sad') {
      ctx.beginPath(); ctx.moveTo(-1, 8.6); ctx.quadraticCurveTo(2.2, 6.2, 5.7, 8.6); ctx.stroke();
    }

    hat(ctx, o.hat, t);
    ctx.restore();
  }

  function hat(ctx, kind, t) {
    if (!kind) return;
    switch (kind) {
      case 'helm': {
        const g = ctx.createLinearGradient(0, -19, 0, -2);
        g.addColorStop(0, '#d4dcec'); g.addColorStop(0.5, '#a8b4c8'); g.addColorStop(1, '#7e88a0');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, -4, 14.2, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, -4, 14.2, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(-4, -12, 4.5, 2, -0.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8c23a';
        U.roundRect(ctx, -2, -20, 4, 8, 2); ctx.fill();
        break;
      }
      case 'band': {
        const g = ctx.createLinearGradient(0, -9, 0, -3);
        g.addColorStop(0, '#d84848'); g.addColorStop(1, '#a02828');
        ctx.fillStyle = g;
        ctx.fillRect(-13, -8.5, 26.5, 5);
        const flow = Math.sin(t * 5) * 3;
        ctx.beginPath();
        ctx.moveTo(-13, -6);
        ctx.quadraticCurveTo(-19, -4 + flow, -21.5, -0.5 + flow);
        ctx.lineTo(-19, -7.5);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'antenna':
        ctx.strokeStyle = '#5f7888'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, -21); ctx.stroke();
        ctx.fillStyle = '#3ad8e8';
        ctx.shadowColor = '#3ad8e8'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(0, -22, 2.5 + Math.sin(t * 6) * 0.5, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        break;
      case 'visor': {
        const g = ctx.createLinearGradient(-9, -4, 11, 3);
        g.addColorStop(0, 'rgba(160,130,255,0.65)');
        g.addColorStop(1, 'rgba(90,70,200,0.45)');
        ctx.fillStyle = g;
        U.roundRect(ctx, -9, -4.5, 20, 7.5, 3.7); ctx.fill();
        ctx.strokeStyle = '#eef0fa'; ctx.lineWidth = 1.4;
        U.roundRect(ctx, -9, -4.5, 20, 7.5, 3.7); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(-6, -3.3, 8, 1.7);
        break;
      }
      case 'fedora': {
        const g = ctx.createLinearGradient(0, -20, 0, -6);
        g.addColorStop(0, '#8a6538'); g.addColorStop(1, '#553e1f');
        ctx.fillStyle = '#5e4526';
        ctx.beginPath(); ctx.ellipse(0, -9, 16.5, 4.2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = g;
        U.roundRect(ctx, -9, -19.5, 18, 11.5, 4); ctx.fill();
        ctx.fillStyle = '#31230f';
        ctx.fillRect(-9, -11.5, 18, 3);
        ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(0, -9, 16.5, 4.2, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,200,0.35)';
        ctx.beginPath(); ctx.ellipse(-3, -17, 4.5, 1.6, -0.2, 0, 7); ctx.fill();
        break;
      }
    }
  }

  /* ============================================================
     نايا
     ============================================================ */
  function drawNaya(ctx, x, y, pose, t, facing, outfitId, scale, look) {
    const o = RN.C.NAYA_OUTFITS[outfitId || 'princess'] || RN.C.NAYA_OUTFITS.princess;
    const s = Math.sin;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((facing || 1) * (scale || 1.15), scale || 1.15);
    let bob = 0, armA = 0.25, armB = -0.25, mouth = 'smile', eyes = 'open', breath = 0;
    if (pose === 'idle') { bob = s(t * 2.3) * 1.2; breath = s(t * 2.3) * 0.5 + 0.5; if ((t % 3.1) > 2.95) eyes = 'blink'; }
    if (pose === 'worried') { armA = 2.4; armB = 2.4; mouth = 'sad'; bob = s(t * 3) * 0.8; }
    if (pose === 'cheer') { armA = -2.8; armB = -2.8; mouth = 'grin'; bob = -Math.abs(s(t * 6)) * 4; }
    if (pose === 'wave') { armA = -2.5 + s(t * 7) * 0.45; mouth = 'grin'; bob = s(t * 3) * 1; breath = s(t * 3) * 0.5 + 0.5; }
    if (pose === 'walk') { armA = s(t * 8) * 0.5; armB = -armA; bob = Math.abs(s(t * 8)) * 1.4; }
    if (pose === 'captive') { armA = -1.9; armB = -1.2; mouth = 'sad'; bob = s(t * 2) * 0.8; }
    if (pose === 'think') { armA = -2.0; armB = 0.3; mouth = 'hmm'; bob = s(t * 2.5) * 1; if ((t % 2.7) > 2.55) eyes = 'blink'; }
    ctx.translate(0, bob);

    // ظل أرضي
    ctx.fillStyle = 'rgba(20,10,30,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 1.5, 13, 3, 0, 0, 7); ctx.fill();

    // ---- أرجل + جوارب بكشكشة + حذاء أبيض ----
    const lg = ctx.createLinearGradient(-2, -16, 2, -4);
    lg.addColorStop(0, NAYA_SKIN_HI); lg.addColorStop(1, U.shade(NAYA_SKIN, -0.1));
    ctx.fillStyle = lg;
    for (const sx of [-3.5, 3.5]) {
      ctx.beginPath();
      ctx.moveTo(sx - 2.6, -16);
      ctx.quadraticCurveTo(sx - 2.9, -10, sx - 1.75, -5);
      ctx.lineTo(sx + 1.75, -5);
      ctx.quadraticCurveTo(sx + 2.9, -10, sx + 2.6, -16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(74,44,26,0.3)'; ctx.lineWidth = 0.7;
      ctx.stroke();
      // ركبة صغيرة
      ctx.fillStyle = 'rgba(190,140,95,0.3)';
      ctx.beginPath(); ctx.ellipse(sx, -10, 1.3, 0.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = lg;
    }
    // جورب بكشكشة
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5.4;
    ctx.beginPath(); ctx.moveTo(-3.5, -7.5); ctx.lineTo(-3.5, -5.5); ctx.moveTo(3.5, -7.5); ctx.lineTo(3.5, -5.5); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const sx of [-3.5, 3.5]) {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.arc(sx + k * 2, -7.8, 1.1, 0, 7); ctx.fill();
      }
    }
    // حذاء بلمعة وإبزيم
    for (const sx of [-7.5, 0.5]) {
      const shoeG = ctx.createLinearGradient(0, -5, 0, 0);
      shoeG.addColorStop(0, '#ffffff'); shoeG.addColorStop(1, '#d2d4de');
      ctx.fillStyle = shoeG;
      U.roundRect(ctx, sx, -5, 8, 5.2, 2.6); ctx.fill();
      ctx.strokeStyle = 'rgba(74,44,26,0.4)'; ctx.lineWidth = 0.8;
      U.roundRect(ctx, sx, -5, 8, 5.2, 2.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(160,165,185,0.9)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(sx + 1, -3.4); ctx.lineTo(sx + 7, -3.4); ctx.stroke();
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(sx + 4, -3.4, 0.8, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(sx + 2.4, -4.2, 1.6, 0.6, -0.2, 0, 7); ctx.fill();
    }

    // ذراع خلفية (المتدلية فقط — المرفوعة تُرسم بعد الفستان)
    const backArmRaised = armB < -1.2;
    if (!backArmRaised) nayaArm(ctx, -6, -30, armB, false);

    /* ---- الفستان: صدّ + حزام + 3 طبقات تول مكشكشة ---- */
    const hemSway = s(t * 2.2) * 1.4;
    // الصدّ (الجزء العلوي)
    const bod = ctx.createLinearGradient(-7, -34, 7, -24);
    bod.addColorStop(0, U.shade(o.dress, 0.16));
    bod.addColorStop(0.6, o.dress);
    bod.addColorStop(1, U.shade(o.dress, -0.1));
    ctx.fillStyle = bod;
    ctx.beginPath();
    ctx.moveTo(-7, -32 + breath * -0.5);
    ctx.quadraticCurveTo(-7.8, -27, -7.2, -23.5);
    ctx.lineTo(7.2, -23.5);
    ctx.quadraticCurveTo(7.8, -27, 7, -32 + breath * -0.5);
    ctx.quadraticCurveTo(0, -34.5 - breath * 0.5, -7, -32 + breath * -0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,70,0.4)'; ctx.lineWidth = 0.8;
    ctx.stroke();
    // أكمام منفوشة قصيرة
    for (const sx of [-7.6, 7.6]) {
      ctx.fillStyle = U.shade(o.dress, 0.1);
      ctx.beginPath(); ctx.ellipse(sx, -30.5, 2.8, 3.4, sx > 0 ? 0.3 : -0.3, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,70,0.35)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(sx, -30.5, 2.8, 3.4, sx > 0 ? 0.3 : -0.3, 0, 7); ctx.stroke();
    }
    // حزام خصر بفيونكة صغيرة
    ctx.fillStyle = U.shade(o.deco, -0.05);
    U.roundRect(ctx, -7.2, -24.5, 14.4, 2.4, 1.2); ctx.fill();
    ctx.fillStyle = U.shade(o.deco, 0.25);
    ctx.beginPath(); ctx.arc(0, -23.3, 1.2, 0, 7); ctx.fill();
    // ---- التنورة: 3 طبقات تول بحواف مموجة ----
    const layers = [
      { top: -23.5, hem: -10.5, half: 14.5, tone: -0.16, alpha: 1 },
      { top: -23.5, hem: -12.3, half: 12.8, tone: 0, alpha: 0.96 },
      { top: -23.5, hem: -14.3, half: 10.6, tone: 0.14, alpha: 0.9 },
    ];
    for (const L of layers) {
      const dg2 = ctx.createLinearGradient(0, L.top, 0, L.hem);
      dg2.addColorStop(0, U.shade(o.dress, L.tone + 0.1));
      dg2.addColorStop(1, U.shade(o.dress, L.tone - 0.06));
      ctx.fillStyle = dg2;
      ctx.globalAlpha = L.alpha;
      ctx.beginPath();
      ctx.moveTo(-6.5, L.top);
      ctx.quadraticCurveTo(-L.half - hemSway * 0.6, (L.top + L.hem) / 2 - 2, -L.half - hemSway, L.hem);
      // حافة مكشكشة (موجات) — أقواس متتالية نحو اليمين
      const n = 4;
      for (let k = 1; k <= n; k++) {
        const x0 = U.lerp(-L.half - hemSway, L.half + hemSway, (k - 1) / n);
        const x1 = U.lerp(-L.half - hemSway, L.half + hemSway, k / n);
        const py = L.hem + (k % 2 === 0 ? 0 : 1.9) + s(t * 2.5 + k) * 0.4;
        ctx.quadraticCurveTo((x0 + x1) / 2, L.hem + (k % 2 === 0 ? -0.6 : 3.2), x1, py);
      }
      ctx.quadraticCurveTo(L.half + hemSway * 0.6, (L.top + L.hem) / 2 - 2, 6.5, L.top);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,70,0.28)'; ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // بريق على التنورة
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 5; k++) {
      const spx = s(k * 2.3 + 1) * 9;
      const spy = -20 + (k * 2.1) % 8;
      const tw = 0.4 + Math.abs(s(t * 2.4 + k * 1.9)) * 0.6;
      ctx.globalAlpha = tw * 0.8;
      ctx.beginPath(); ctx.arc(spx, spy, 0.65, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // زهرة قماشية على الصدر (بتلات حقيقية)
    ctx.save();
    ctx.translate(-1, -28.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      ctx.fillStyle = U.shade(o.deco, i % 2 ? 0.12 : -0.05);
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 1.7, 1.05, a, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath(); ctx.arc(0, 0, 1.15, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(-0.35, -0.35, 0.4, 0, 7); ctx.fill();
    ctx.restore();
    // عقد خرز لامع
    const beads = ['#ff8ab0', '#8ad8ff', '#ffe08a', '#b8ffa8', '#dab0ff'];
    for (let i = 0; i < 5; i++) {
      const bx = -5 + i * 2.5, by = -33.8 + Math.abs(i - 2) * 1.05;
      const bg = ctx.createRadialGradient(bx - 0.4, by - 0.4, 0.15, bx, by, 1.5);
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.35, beads[i]);
      bg.addColorStop(1, U.shade(beads[i], -0.3));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bx, by, 1.4, 0, 7); ctx.fill();
    }

    if (backArmRaised) nayaArm(ctx, -6, -30, armB, false);
    // ذراع أمامية (المرفوعة تُرسم بعد الرأس كي لا تختفي خلفه)
    const frontArmRaised = armA < -1.2;
    if (!frontArmRaised) nayaArm(ctx, 6, -30, armA, true);

    /* ---- الرأس ---- */
    ctx.save();
    ctx.translate(0, -43);
    // رقبة
    ctx.fillStyle = U.shade(NAYA_SKIN, -0.14);
    ctx.fillRect(-2.5, 3, 5, 5.5);

    // وجه بيضاوي بخدود ممتلئة
    const nfacePath = () => {
      ctx.beginPath();
      ctx.moveTo(-11.3, -1.5);
      ctx.quadraticCurveTo(-11.6, -8.5, -6.2, -10.8);
      ctx.quadraticCurveTo(0, -12.6, 6.2, -10.8);
      ctx.quadraticCurveTo(11.6, -8.5, 11.5, -1.5);
      ctx.quadraticCurveTo(11.4, 5.5, 6.8, 9.4);
      ctx.quadraticCurveTo(2.8, 12.1, 0, 12.1);
      ctx.quadraticCurveTo(-4.5, 12, -8, 8.8);
      ctx.quadraticCurveTo(-11.2, 5.2, -11.3, -1.5);
      ctx.closePath();
    };
    const nfg = ctx.createRadialGradient(-3, -3.5, 2.5, 0.5, 0.5, 15);
    nfg.addColorStop(0, NAYA_SKIN_HI);
    nfg.addColorStop(0.55, NAYA_SKIN);
    nfg.addColorStop(1, U.shade(NAYA_SKIN, -0.11));
    nfacePath();
    ctx.fillStyle = nfg;
    ctx.fill();
    ctx.save();
    nfacePath(); ctx.clip();
    // ظل جانبي + Rim
    const nsh = ctx.createLinearGradient(-11.5, 0, -4, 0);
    nsh.addColorStop(0, 'rgba(190,135,85,0.35)');
    nsh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nsh;
    ctx.fillRect(-12, -12, 9, 25);
    const nrim = ctx.createLinearGradient(8, 0, 11.8, 0);
    nrim.addColorStop(0, 'rgba(255,235,205,0)');
    nrim.addColorStop(1, 'rgba(255,235,205,0.55)');
    ctx.fillStyle = nrim;
    ctx.fillRect(7, -11, 5.5, 22);
    // لمعة جبهة + ظل شعر
    ctx.fillStyle = 'rgba(255,235,210,0.35)';
    ctx.beginPath(); ctx.ellipse(1.5, -6, 5, 2.6, -0.1, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(160,110,60,0.22)';
    ctx.beginPath();
    ctx.moveTo(-11, -5.5); ctx.quadraticCurveTo(0, -9.6, 11.3, -5.2);
    ctx.quadraticCurveTo(0, -7.8, -11, -4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    nfacePath();
    ctx.strokeStyle = 'rgba(74,44,26,0.5)'; ctx.lineWidth = 0.95;
    ctx.stroke();

    /* الشعر المجعد: عناقيد بظل هلالي ولمعة لكل خصلة */
    const curlSway = s(t * 2.5) * 0.8;
    const curls = [
      [-9.5, -7.2, 5.2], [-4.5, -11.2, 5.5], [1.8, -11.8, 5.6], [7.8, -8.6, 5.1],
      [11.2, -2.8, 4.6], [-11.6, -0.8, 4.6], [12.2, 3.2, 4.0], [-12.2, 5.2, 4.0],
      [10.2, 8.8, 3.6], [-10.2, 9.8, 3.6], [-1.5, -13.6, 4.3], [5, -12.9, 4.1],
    ];
    for (const [cx0, cy, cr2] of curls) {
      const cx = cx0 + (cy < 0 ? curlSway : curlSway * 0.4);
      // قاعدة الخصلة بتدرج
      const cg = ctx.createRadialGradient(cx - cr2 * 0.3, cy - cr2 * 0.35, cr2 * 0.15, cx, cy, cr2);
      cg.addColorStop(0, NAYA_HAIR_HI);
      cg.addColorStop(0.55, NAYA_HAIR);
      cg.addColorStop(1, '#1a1109');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, cr2, 0, 7); ctx.fill();
      // خط تجعيد داخلي (حلزون صغير)
      ctx.strokeStyle = 'rgba(90,64,40,0.55)'; ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx + cr2 * 0.12, cy + cr2 * 0.1, cr2 * 0.5, 0.6, 4.6);
      ctx.stroke();
      // لمعة صغيرة
      ctx.fillStyle = 'rgba(140,100,64,0.75)';
      ctx.beginPath(); ctx.arc(cx - cr2 * 0.3, cy - cr2 * 0.35, cr2 * 0.22, 0, 7); ctx.fill();
    }
    // شعيرات صغيرة عند الجبهة
    ctx.strokeStyle = 'rgba(44,31,20,0.8)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -8.4); ctx.quadraticCurveTo(-5, -7, -5.6, -6);
    ctx.moveTo(0, -9.2); ctx.quadraticCurveTo(1, -7.8, 0.4, -6.6);
    ctx.moveTo(5.4, -8.4); ctx.quadraticCurveTo(6.4, -7.2, 5.8, -6.2);
    ctx.stroke();
    // فيونكة ساتان بلمعة
    ctx.save();
    ctx.translate(6.4, -11.8);
    ctx.rotate(-0.15);
    for (const dir of [-1, 1]) {
      const bg2 = ctx.createLinearGradient(0, -3, dir * 6, 0);
      bg2.addColorStop(0, '#e2c6a4');
      bg2.addColorStop(1, '#bfa07e');
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 3, -4.6, dir * 5.6, -3);
      ctx.quadraticCurveTo(dir * 6.4, -0.6, dir * 3.6, 1.4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,60,0.5)'; ctx.lineWidth = 0.7;
      ctx.stroke();
      // ثنية داخلية
      ctx.strokeStyle = 'rgba(120,90,60,0.45)';
      ctx.beginPath(); ctx.moveTo(dir * 1, -0.4); ctx.quadraticCurveTo(dir * 3, -2.2, dir * 4.6, -1.8); ctx.stroke();
    }
    const knot = ctx.createRadialGradient(-0.5, -0.5, 0.3, 0, 0, 2.2);
    knot.addColorStop(0, '#eed8b8'); knot.addColorStop(1, '#ab8a66');
    ctx.fillStyle = knot;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill();
    ctx.restore();

    /* عيون واسعة زجاجية */
    const lx = U.clamp(look !== undefined ? look : 0.4, -1, 1) * 1.0;
    if (eyes === 'open') {
      for (const ex of [4.6, -2.9]) {
        const wg = ctx.createLinearGradient(0, -4.2, 0, 2.6);
        wg.addColorStop(0, '#e2e6ec');
        wg.addColorStop(0.35, '#ffffff');
        wg.addColorStop(1, '#f4f6f9');
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.ellipse(ex, -0.5, 3.0, 3.7, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(46,32,22,0.4)'; ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.ellipse(ex, -0.5, 3.0, 3.7, 0, 0, 7); ctx.stroke();
        // قزحية عسلية داكنة بحلقة حوفية
        const ig = ctx.createRadialGradient(ex + lx - 0.4, -0.8, 0.25, ex + lx, -0.2, 2.15);
        ig.addColorStop(0, '#96683c');
        ig.addColorStop(0.55, '#5e3a1e');
        ig.addColorStop(0.9, '#331c0c');
        ig.addColorStop(1, '#170b03');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(ex + lx, -0.2, 2.05, 0, 7); ctx.fill();
        ctx.fillStyle = '#0c0501';
        ctx.beginPath(); ctx.arc(ex + lx, -0.2, 0.95, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(ex + lx * 0.5 + 0.75, -1.15, 0.7, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(ex + lx * 0.5 - 0.8, 0.7, 0.38, 0, 7); ctx.fill();
        // رموش علوية رقيقة + سفلية
        ctx.strokeStyle = 'rgba(30,18,10,0.75)'; ctx.lineWidth = 0.95; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ex - 2.9, -2.9); ctx.quadraticCurveTo(ex, -4.6, ex + 2.9, -3.0); ctx.stroke();
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(ex + 2.7, -3.3); ctx.lineTo(ex + 3.8, -4.4);
        ctx.moveTo(ex + 1.7, -3.9); ctx.lineTo(ex + 2.5, -5.1);
        ctx.moveTo(ex - 2.6, -3.2); ctx.lineTo(ex - 3.6, -4.3);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(190,140,100,0.6)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(ex - 2, 2.9); ctx.quadraticCurveTo(ex, 3.5, ex + 2.1, 2.9); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#3d2517'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(2.0, 0); ctx.quadraticCurveTo(4.5, 1.4, 7.0, 0);
      ctx.moveTo(-5.3, 0); ctx.quadraticCurveTo(-2.8, 1.4, -0.3, 0);
      ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6.6, 0.4); ctx.lineTo(7.7, 1.3);
      ctx.moveTo(-4.9, 0.4); ctx.lineTo(-6, 1.3);
      ctx.stroke();
    }
    // حواجب رقيقة مقوسة
    ctx.strokeStyle = U.alpha(U.shade(NAYA_HAIR, 0.2), 0.9); ctx.lineWidth = 0.95; ctx.lineCap = 'round';
    const nbY = mouth === 'sad' ? -5.3 : -5.9;
    ctx.beginPath();
    ctx.moveTo(2.5, nbY + (mouth === 'sad' ? 0.7 : 0.1)); ctx.quadraticCurveTo(4.7, nbY - 0.85, 6.8, nbY + 0.1);
    ctx.moveTo(-5.4, nbY + 0.1); ctx.quadraticCurveTo(-3.3, nbY - 0.85, -1.2, nbY + (mouth === 'sad' ? 0.7 : 0.1));
    ctx.stroke();
    // خدود وردية بتوهج
    const cheekL = ctx.createRadialGradient(7.4, 3.6, 0.4, 7.4, 3.6, 2.8);
    cheekL.addColorStop(0, 'rgba(255,120,125,0.4)');
    cheekL.addColorStop(1, 'rgba(255,120,125,0)');
    ctx.fillStyle = cheekL;
    ctx.beginPath(); ctx.arc(7.4, 3.6, 2.8, 0, 7); ctx.fill();
    const cheekR = ctx.createRadialGradient(-6.2, 3.6, 0.4, -6.2, 3.6, 2.8);
    cheekR.addColorStop(0, 'rgba(255,120,125,0.4)');
    cheekR.addColorStop(1, 'rgba(255,120,125,0)');
    ctx.fillStyle = cheekR;
    ctx.beginPath(); ctx.arc(-6.2, 3.6, 2.8, 0, 7); ctx.fill();
    // أنف صغير
    ctx.strokeStyle = 'rgba(200,145,95,0.9)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(1.4, 1.5); ctx.quadraticCurveTo(2.4, 2.7, 1.3, 3.7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,235,210,0.6)';
    ctx.beginPath(); ctx.ellipse(2.2, 1.9, 0.5, 0.9, 0.3, 0, 7); ctx.fill();
    // فم
    ctx.strokeStyle = '#a34648'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    if (mouth === 'smile') {
      ctx.beginPath(); ctx.moveTo(-1.6, 5.9); ctx.quadraticCurveTo(1.5, 8.5, 4.6, 5.9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,180,0.75)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0.4, 8.3); ctx.quadraticCurveTo(1.6, 9, 2.8, 8.3); ctx.stroke();
    }
    else if (mouth === 'grin') {
      ctx.fillStyle = '#7c2f2c';
      ctx.beginPath(); ctx.moveTo(-2.1, 5.4); ctx.quadraticCurveTo(1.5, 10.6, 5.1, 5.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#a34648'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-2.1, 5.4); ctx.quadraticCurveTo(1.5, 10.6, 5.1, 5.4); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-1.5, 5.55); ctx.lineTo(4.5, 5.55); ctx.lineTo(4, 7.1); ctx.lineTo(-1, 7.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e5706a';
      ctx.beginPath(); ctx.ellipse(1.5, 8.8, 1.9, 1.05, 0, 0, 7); ctx.fill();
    }
    else if (mouth === 'sad') {
      ctx.beginPath(); ctx.moveTo(-1.6, 7.6); ctx.quadraticCurveTo(1.5, 5.4, 4.6, 7.6); ctx.stroke();
      // دمعة صغيرة متلألئة
      const tearT = (t % 2.4) / 2.4;
      if (tearT < 0.6) {
        ctx.fillStyle = `rgba(160,210,255,${0.85 - tearT})`;
        ctx.beginPath(); ctx.ellipse(6.6, 1.8 + tearT * 6, 0.75, 1.15, 0, 0, 7); ctx.fill();
      }
    }
    else if (mouth === 'hmm') { ctx.beginPath(); ctx.moveTo(-0.5, 6.9); ctx.lineTo(3.8, 6.9); ctx.stroke(); }
    ctx.restore();

    if (frontArmRaised) nayaArm(ctx, 6, -30, armA, true);

    ctx.restore();
  }

  function nayaArm(ctx, ox, oy, ang, front) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    const ag = ctx.createLinearGradient(-2, 0, 2, 13);
    ag.addColorStop(0, front ? NAYA_SKIN_HI : U.shade(NAYA_SKIN, -0.1));
    ag.addColorStop(1, front ? U.shade(NAYA_SKIN, -0.06) : U.shade(NAYA_SKIN, -0.18));
    ctx.strokeStyle = ag;
    ctx.lineWidth = 4.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    const hg = ctx.createRadialGradient(-0.7, 12.2, 0.3, 0, 12.8, 3);
    hg.addColorStop(0, front ? NAYA_SKIN_HI : NAYA_SKIN);
    hg.addColorStop(1, front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.14));
    ctx.fillStyle = hg;
    // كف صغيرة نظيفة بإبهام مدمج
    ctx.save();
    ctx.translate(0, 12.2);
    const thx = front ? -1.5 : 1.5;
    const hgn = ctx.createRadialGradient(-0.6, -0.6, 0.3, 0, 0.4, 2.7);
    hgn.addColorStop(0, front ? NAYA_SKIN_HI : NAYA_SKIN);
    hgn.addColorStop(1, front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.14));
    ctx.fillStyle = hgn;
    ctx.beginPath(); ctx.ellipse(thx, -0.2, 0.8, 1.35, front ? -0.5 : 0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,42,26,0.3)'; ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.ellipse(thx, -0.2, 0.8, 1.35, front ? -0.5 : 0.5, 0, 7); ctx.stroke();
    ctx.fillStyle = hgn;
    ctx.beginPath(); ctx.ellipse(0, 0.4, 1.95, 2.3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,42,26,0.33)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.ellipse(0, 0.4, 1.95, 2.3, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,140,95,0.5)'; ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-0.6, 2.5); ctx.lineTo(-0.6, 1.3);
    ctx.moveTo(0.6, 2.55); ctx.lineTo(0.6, 1.35);
    ctx.stroke();
    ctx.restore();
    // سوار خرز
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(-1.1, 9, 1.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#8ad8ff';
    ctx.beginPath(); ctx.arc(0.4, 9.6, 1.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9ab8';
    ctx.beginPath(); ctx.arc(1.7, 8.9, 1.0, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- ملك الظلال (للمشاهد) ---------- */
  function drawShadowKing(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);
    const wob = Math.sin(t * 2) * 3;
    ctx.globalCompositeOperation = 'screen';
    const aura = ctx.createRadialGradient(0, -55 + wob, 20, 0, -55 + wob, 90);
    aura.addColorStop(0, 'rgba(140,70,255,0.22)');
    aura.addColorStop(1, 'rgba(140,70,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, -55 + wob, 90, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, -95, 0, 0);
    g.addColorStop(0, '#43307c');
    g.addColorStop(0.6, '#251a4a');
    g.addColorStop(1, 'rgba(20,10,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.quadraticCurveTo(-42, -60 + wob, -20, -85 + wob);
    ctx.quadraticCurveTo(0, -98 + wob, 20, -85 + wob);
    ctx.quadraticCurveTo(42, -60 + wob, 38, 0);
    for (let i = 3; i >= -3; i--) {
      ctx.quadraticCurveTo(i * 11 + 5, -14 + Math.sin(t * 3 + i) * 5, i * 11, -2);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0e081e';
    ctx.beginPath(); ctx.arc(0, -70 + wob, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#b44aff';
    ctx.shadowColor = '#b44aff'; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(-6, -72 + wob, 3.6, 2.1, -0.3, 0, 7);
    ctx.ellipse(6, -72 + wob, 3.6, 2.1, 0.3, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#6a4aff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -84 + wob);
      ctx.lineTo(i * 9, -97 + wob);
      ctx.stroke();
      ctx.fillStyle = '#b48aff';
      ctx.beginPath(); ctx.arc(i * 9, -98 + wob, 1.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  RN.Chars = { drawRayan, drawNaya, drawShadowKing, SKIN, HAIR, RAYAN_SCALE, NAYA_SCALE };
})();
