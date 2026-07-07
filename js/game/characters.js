'use strict';
/* ============================================================
   Rayan & Naya — رسم الشخصيات الكرتونية (نسخة سينمائية)
   رسم متجهي غني مستمد من الهوية البصرية الحقيقية:
   ريان: شعر بني داكن قصير مع غرّة، بشرة قمحية فاتحة، ابتسامة
         دافئة، تيشيرت أبيض بشعار برتقالي، شورت كحلي.
   نايا: شعر بني داكن مجعد مع فيونكة، فستان كريمي منفوش
         بزخرفة زهرية، عقد خرز ملون، حذاء أبيض.
   تفاصيل حية: تنفّس أثناء الوقوف، رمش دوري، حدقات تتبع
   الاتجاه، تمايل الشعر مع الحركة، تدرجات وظلال على الملابس،
   خطوط تحديد ناعمة (Outline) بأسلوب الرسم اليدوي.
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  const SKIN = '#f2c69c';
  const SKIN_HI = '#ffe0bd';
  const SKIN_SHADE = '#d9a877';
  const LINE = 'rgba(70,42,26,0.55)';
  const HAIR = '#38281c';
  const HAIR_HI = '#5a4230';
  const NAYA_SKIN = '#eec09a';
  const NAYA_HAIR = '#2e2016';

  function skinGrad(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, SKIN_HI);
    g.addColorStop(0.45, SKIN);
    g.addColorStop(1, SKIN_SHADE);
    return g;
  }

  /* ---------- حساب وضعية ريان من حالة الحركة والزمن ---------- */
  function rayanPose(state, t) {
    const p = { legA: 0, legB: 0, armA: 0, armB: 0, crouch: 0, lean: 0, bob: 0, mouth: 'smile', eyes: 'open', armPose: null, breath: 0, hairSway: 0 };
    const s = Math.sin;
    switch (state) {
      case 'idle':
        p.breath = s(t * 2.1) * 0.5 + 0.5; // 0..1 تنفس
        p.bob = s(t * 2.1) * 1.3;
        p.armA = s(t * 2.1) * 0.05 + 0.14; p.armB = -p.armA;
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
        p.legA = 1.1; p.legB = -0.6; p.armA = 1.8; p.armB = -1.9; p.lean = 0.35; p.mouth = 'grit'; p.hairSway = 1.4; break;
      case 'slide':
        p.crouch = 0.55; p.legA = 1.2; p.legB = 1.0; p.armA = -0.8; p.armB = 0.4; p.lean = -0.3; break;
      case 'attack': {
        const k = Math.min(1, t / 0.22);
        p.armA = -2.6 + k * 3.4; p.armB = 0.5; p.lean = 0.18 * k; p.mouth = 'grit'; p.armPose = 'swing'; p.hairSway = 0.5;
        break;
      }
      case 'shoot':
        p.armA = -1.57; p.armB = 0.3; p.lean = 0.08; p.mouth = 'grit'; break;
      case 'slam':
        p.legA = 0.8; p.legB = 0.8; p.armA = -2.9; p.armB = -2.9; p.mouth = 'grit'; p.hairSway = -1.2; break;
      case 'glide':
        p.legA = 0.35; p.legB = 0.15; p.armA = -3.0; p.armB = -3.0; p.mouth = 'open'; p.hairSway = -0.7; break;
      case 'hurt':
        p.legA = -0.4; p.legB = 0.5; p.armA = -2.0; p.armB = 2.0; p.lean = -0.25; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'death':
        p.crouch = 0.7; p.armA = 0.9; p.armB = -0.9; p.mouth = 'sad'; p.eyes = 'shut'; break;
      case 'victory': {
        const hop = Math.abs(s(t * 6)) * 5;
        p.bob = -hop; p.armA = -2.9 + s(t * 6) * 0.2; p.armB = -2.9 - s(t * 6) * 0.2;
        p.legA = s(t * 6) * 0.2; p.mouth = 'grin';
        break;
      }
      case 'celebrate':
        p.armA = -2.9; p.armB = 0.9; p.bob = Math.abs(s(t * 5)) * 3; p.mouth = 'grin'; p.breath = s(t * 2) * 0.5 + 0.5; break;
      default: break;
    }
    return p;
  }

  /* ---------- رسم ريان ----------
     x,y: مركز القدمين. facing: 1/-1.
     fx: {shield, invincible, power2x, scale, lookX, lookY} */
  function drawRayan(ctx, x, y, state, t, facing, outfit, fx) {
    const p = rayanPose(state, t);
    const o = outfit || RN.C.OUTFITS.explorer;
    fx = fx || {};
    const scale = fx.scale || 1.18;
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
    if (fx.invincible) {
      ctx.globalAlpha = 0.92 + Math.sin(t * 20) * 0.08;
    }

    const breath = (p.breath || 0) * 0.7; // امتداد صدر خفيف

    // ---- ساق خلفية ----
    leg(ctx, -4, -22, p.legB, o, false);
    // ---- ذراع خلفية ----
    arm(ctx, -5, -34, p.armB, o, false, p, fx);

    // ---- الجذع: تيشيرت بتدرج وثنيات ----
    const sg2 = ctx.createLinearGradient(-9, -40, 9, -20);
    sg2.addColorStop(0, U.shade(o.shirt, 0.1));
    sg2.addColorStop(0.55, o.shirt);
    sg2.addColorStop(1, U.shade(o.shirt, -0.18));
    ctx.fillStyle = sg2;
    ctx.beginPath();
    // جذع بحواف ناعمة + حافة قميص تتمايل مع الحركة
    const hem = Math.sin(t * 10) * (p.hairSway || 0) * 1.2;
    ctx.moveTo(-9, -40 + breath * -0.8);
    ctx.quadraticCurveTo(-10.5, -30, -9.5 - hem * 0.5, -20.5);
    ctx.lineTo(9.5 + hem * 0.5, -20.5);
    ctx.quadraticCurveTo(10.5 + breath * 0.8, -30, 9, -40 + breath * -0.8);
    ctx.quadraticCurveTo(0, -43 - breath, -9, -40 + breath * -0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.stroke();
    // ثنيات قماش
    ctx.strokeStyle = U.alpha(U.shade(o.shirt, -0.3), 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-3, -24.5, -1, -26);
    ctx.moveTo(4, -23); ctx.quadraticCurveTo(6.5, -22, 8, -23.5);
    ctx.stroke();
    // ظل تحت الرقبة
    ctx.fillStyle = 'rgba(90,60,30,0.18)';
    ctx.beginPath(); ctx.ellipse(0, -39.5, 6, 2.2, 0, 0, 7); ctx.fill();
    // شعار الصدر (لوح تزلج — من قميص ريان الحقيقي)
    ctx.save();
    ctx.translate(0.5, -31); ctx.rotate(-0.5);
    const dg = ctx.createLinearGradient(-5, 0, 5, 0);
    dg.addColorStop(0, U.shade(o.shirtDeco, 0.2));
    dg.addColorStop(1, U.shade(o.shirtDeco, -0.15));
    ctx.fillStyle = dg;
    U.roundRect(ctx, -5.5, -2, 11, 4.2, 2.1); ctx.fill();
    ctx.fillStyle = U.shade(o.shirtDeco, -0.4);
    ctx.beginPath(); ctx.arc(-3, 2.8, 1.4, 0, 7); ctx.arc(3, 2.8, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-4.5, -1.6, 9, 1.1);
    ctx.restore();

    // ---- شورت بتدرج وحافة ----
    const pg = ctx.createLinearGradient(0, -23, 0, -15);
    pg.addColorStop(0, U.shade(o.pants, 0.12));
    pg.addColorStop(1, U.shade(o.pants, -0.12));
    ctx.fillStyle = pg;
    U.roundRect(ctx, -8.5, -23, 17, 8.5, 3); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    U.roundRect(ctx, -8.5, -23, 17, 8.5, 3); ctx.stroke();
    ctx.strokeStyle = U.alpha(U.shade(o.pants, 0.35), 0.7);
    ctx.beginPath(); ctx.moveTo(-7.5, -16.5); ctx.lineTo(-2, -16.5); ctx.moveTo(2, -16.5); ctx.lineTo(7.5, -16.5); ctx.stroke();

    // ---- ساق أمامية ----
    leg(ctx, 4, -22, p.legA, o, true);
    // ---- الرأس ----
    head(ctx, p, t, o, fx, facing);
    // ---- ذراع أمامية ----
    arm(ctx, 5, -34, p.armA, o, true, p, fx);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function leg(ctx, ox, oy, ang, o, front) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang * 0.6);
    // ساق بتدرج جلد
    ctx.strokeStyle = front ? skinGrad(ctx, -3, 0, 3, 16) : SKIN_SHADE;
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ang > 0 ? 3 : -1, 15); ctx.stroke();
    // حذاء رياضي بنعل ولمعة
    ctx.save();
    ctx.translate(ang > 0 ? 3 : -1, 17);
    const shg = ctx.createLinearGradient(0, -3, 0, 3);
    shg.addColorStop(0, U.shade(o.shoes, 0.15));
    shg.addColorStop(1, U.shade(o.shoes, -0.12));
    ctx.fillStyle = shg;
    U.roundRect(ctx, -4, -3.5, 11.5, 6.5, 3); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    U.roundRect(ctx, -4, -3.5, 11.5, 6.5, 3); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    U.roundRect(ctx, -4, 1, 11.5, 2.4, 1.2); ctx.fill();
    // رباط
    ctx.strokeStyle = 'rgba(120,120,140,0.8)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(3, -1); ctx.moveTo(0, -0.5); ctx.lineTo(3, 0.5); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function arm(ctx, ox, oy, ang, o, front, p, fx) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    // كم القميص بتدرج
    const sg = ctx.createLinearGradient(-3, 0, 3, 8);
    sg.addColorStop(0, front ? U.shade(o.shirt, 0.08) : U.shade(o.shirt, -0.18));
    sg.addColorStop(1, front ? U.shade(o.shirt, -0.12) : U.shade(o.shirt, -0.3));
    ctx.strokeStyle = sg;
    ctx.lineWidth = 6.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
    // الساعد واليد
    ctx.strokeStyle = front ? skinGrad(ctx, -2, 7, 2, 16) : SKIN_SHADE;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, 15); ctx.stroke();
    ctx.fillStyle = front ? SKIN : SKIN_SHADE;
    ctx.beginPath(); ctx.arc(0, 16, 3.5, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(0, 16, 3.5, 0, 7); ctx.stroke();
    // شفرة الطاقة عند الهجوم
    if (front && p.armPose === 'swing') {
      ctx.globalCompositeOperation = 'screen';
      const grad = ctx.createLinearGradient(0, 16, 0, 46);
      grad.addColorStop(0, fx && fx.power2x ? 'rgba(255,90,138,0.95)' : 'rgba(90,216,255,0.95)');
      grad.addColorStop(1, 'rgba(90,216,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 44); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 39); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function head(ctx, p, t, o, fx, facing) {
    ctx.save();
    ctx.translate(0, -47);
    // رقبة بظل
    ctx.fillStyle = SKIN_SHADE;
    ctx.fillRect(-3, 4, 6, 6);
    // وجه بتدرج ناعم
    const fg = ctx.createRadialGradient(-4, -4, 3, 0, 0, 15);
    fg.addColorStop(0, SKIN_HI);
    fg.addColorStop(0.6, SKIN);
    fg.addColorStop(1, U.shade(SKIN, -0.1));
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke();
    // أذن
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(-11, 1, 3.4, 0, 7); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(-11, 1, 3.4, 0, 7); ctx.stroke();
    ctx.strokeStyle = SKIN_SHADE;
    ctx.beginPath(); ctx.arc(-11, 1, 1.6, 1, 4); ctx.stroke();

    // شعر بني داكن قصير — كتلة + خصلات + تمايل
    const sway = (p.hairSway || 0) * 1.6 + Math.sin(t * 3) * 0.4;
    const hg = ctx.createLinearGradient(0, -16, 0, -2);
    hg.addColorStop(0, HAIR_HI);
    hg.addColorStop(0.5, HAIR);
    hg.addColorStop(1, U.shade(HAIR, -0.25));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, -3, 13.4, Math.PI * 0.95, Math.PI * 2.12);
    ctx.quadraticCurveTo(13, -8, 10, -5);
    ctx.quadraticCurveTo(8, -9, 3, -8.5);
    ctx.quadraticCurveTo(-3, -10, -8, -7);
    ctx.quadraticCurveTo(-12.5, -6, -13, 1);
    ctx.closePath(); ctx.fill();
    // غرة أمامية مرفوعة تتمايل
    ctx.beginPath();
    ctx.moveTo(5.5, -11);
    ctx.quadraticCurveTo(11 + sway, -15.5, 13.5 + sway * 0.6, -8);
    ctx.quadraticCurveTo(10, -9.5, 7, -7.5);
    ctx.closePath(); ctx.fill();
    // خصلات خلفية تتحرك
    ctx.beginPath();
    ctx.moveTo(-12.5, -3);
    ctx.quadraticCurveTo(-15 - sway * 0.8, -1, -13.5 - sway * 0.4, 2.5);
    ctx.quadraticCurveTo(-12.8, 0, -12.5, -1);
    ctx.closePath(); ctx.fill();
    // لمعات الشعر
    ctx.strokeStyle = U.alpha(HAIR_HI, 0.85);
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, -11.5); ctx.quadraticCurveTo(3, -12.8, 6.5, -11.2);
    ctx.moveTo(-7, -9.5); ctx.quadraticCurveTo(-4.5, -10.6, -2.5, -10.4);
    ctx.stroke();

    // اتجاه نظر الحدقة
    const lookX = U.clamp(fx.lookX !== undefined ? fx.lookX : 0.5, -1, 1);
    const lookY = U.clamp(fx.lookY || 0, -1, 1);
    // عيون بنية كبيرة
    if (p.eyes === 'open') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(5.5, -1, 3.2, 3.7, 0, 0, 7); ctx.ellipse(-2.5, -1, 3.2, 3.7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(70,42,26,0.35)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(5.5, -1, 3.2, 3.7, 0, 0, 7); ctx.ellipse(-2.5, -1, 3.2, 3.7, 0, 0, 7); ctx.stroke();
      // قزحية + حدقة تتبعان الاتجاه
      const px = lookX * 1.1, py = lookY * 0.9;
      const ig = ctx.createRadialGradient(5.5 + px, -1 + py - 0.5, 0.3, 5.5 + px, -1 + py, 2.1);
      ig.addColorStop(0, '#7a5030'); ig.addColorStop(1, '#3d2415');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(5.5 + px, -0.8 + py, 2, 0, 7); ctx.arc(-2.5 + px, -0.8 + py, 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#1e1008';
      ctx.beginPath(); ctx.arc(5.5 + px, -0.8 + py, 0.9, 0, 7); ctx.arc(-2.5 + px, -0.8 + py, 0.9, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(6.2 + px * 0.5, -1.6 + py * 0.5, 0.75, 0, 7); ctx.arc(-1.8 + px * 0.5, -1.6 + py * 0.5, 0.75, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = '#4a2f1d'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(8, -1); ctx.moveTo(-5, -1); ctx.lineTo(0, -1); ctx.stroke();
    }
    // حواجب معبرة
    ctx.strokeStyle = HAIR; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    const browY = p.mouth === 'grit' ? -5.0 : p.mouth === 'sad' ? -5.2 : -5.9;
    const browTilt = p.mouth === 'grit' ? 0.8 : p.mouth === 'sad' ? -0.7 : -0.5;
    ctx.beginPath();
    ctx.moveTo(3, browY + browTilt * 0.5); ctx.lineTo(8.4, browY - browTilt * 0.5);
    ctx.moveTo(-5.2, browY - browTilt * 0.4); ctx.lineTo(0, browY + browTilt * 0.4);
    ctx.stroke();
    // أنف بظل
    ctx.strokeStyle = SKIN_SHADE; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(2.5, 1.5); ctx.quadraticCurveTo(3.7, 3, 2.4, 4.2); ctx.stroke();
    // خدود
    ctx.fillStyle = 'rgba(240,120,110,0.22)';
    ctx.beginPath(); ctx.ellipse(8.4, 3.5, 2.4, 1.5, 0, 0, 7); ctx.ellipse(-6.8, 3.5, 2.4, 1.5, 0, 0, 7); ctx.fill();
    // فم — ابتسامة ريان الدافئة
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    if (p.mouth === 'smile') {
      ctx.beginPath(); ctx.moveTo(-1.5, 6.2); ctx.quadraticCurveTo(2, 9.2, 5.5, 6.4); ctx.stroke();
      // طرف الابتسامة
      ctx.beginPath(); ctx.moveTo(5.5, 6.4); ctx.lineTo(6.3, 5.7); ctx.stroke();
    } else if (p.mouth === 'grin' || p.mouth === 'open') {
      ctx.fillStyle = '#7a352c';
      ctx.beginPath(); ctx.moveTo(-2, 6); ctx.quadraticCurveTo(2, 11.8, 6, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-1.4, 6.1); ctx.lineTo(5.4, 6.1); ctx.lineTo(4.8, 7.8); ctx.lineTo(-0.8, 7.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e06a6a';
      ctx.beginPath(); ctx.ellipse(2, 9.6, 2.4, 1.2, 0, 0, 7); ctx.fill();
    } else if (p.mouth === 'grit') {
      ctx.beginPath(); ctx.moveTo(-1, 7); ctx.lineTo(5.5, 7); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0.5, 7); ctx.lineTo(0.5, 8.2); ctx.moveTo(3.5, 7); ctx.lineTo(3.5, 8.2); ctx.stroke();
    } else if (p.mouth === 'sad') {
      ctx.beginPath(); ctx.moveTo(-1, 8.2); ctx.quadraticCurveTo(2, 6, 5.5, 8.2); ctx.stroke();
    }

    hat(ctx, o.hat, t);
    ctx.restore();
  }

  function hat(ctx, kind, t) {
    if (!kind) return;
    switch (kind) {
      case 'helm': {
        const g = ctx.createLinearGradient(0, -18, 0, -2);
        g.addColorStop(0, '#c8d2e4'); g.addColorStop(1, '#8a94ac');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, -4, 14, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, -4, 14, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = '#e8c23a';
        U.roundRect(ctx, -2, -19, 4, 7, 2); ctx.fill();
        break;
      }
      case 'band': {
        ctx.fillStyle = '#c03a3a';
        ctx.fillRect(-13, -8, 26.5, 4.5);
        ctx.fillStyle = '#a02c2c';
        ctx.fillRect(-13, -5, 26.5, 1.5);
        const flow = Math.sin(t * 5) * 3;
        ctx.beginPath();
        ctx.moveTo(-13, -6);
        ctx.quadraticCurveTo(-19, -4 + flow, -21, -1 + flow);
        ctx.lineTo(-19, -7);
        ctx.closePath();
        ctx.fillStyle = '#c03a3a';
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
        g.addColorStop(0, 'rgba(150,120,255,0.6)');
        g.addColorStop(1, 'rgba(90,70,200,0.4)');
        ctx.fillStyle = g;
        U.roundRect(ctx, -9, -4, 20, 7, 3.5); ctx.fill();
        ctx.strokeStyle = '#e8e8f4'; ctx.lineWidth = 1.5;
        U.roundRect(ctx, -9, -4, 20, 7, 3.5); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-6, -3, 7, 1.6);
        break;
      }
      case 'fedora': {
        const g = ctx.createLinearGradient(0, -19, 0, -6);
        g.addColorStop(0, '#7e5c32'); g.addColorStop(1, '#5a4222');
        ctx.fillStyle = '#5e4526';
        ctx.beginPath(); ctx.ellipse(0, -9, 16.5, 4.2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = g;
        U.roundRect(ctx, -9, -19, 18, 11, 4); ctx.fill();
        ctx.fillStyle = '#31230f';
        ctx.fillRect(-9, -11.5, 18, 3);
        ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(0, -9, 16.5, 4.2, 0, 0, 7); ctx.stroke();
        break;
      }
    }
  }

  /* ---------- رسم نايا ----------
     poses: idle, worried, cheer, walk, captive, wave, think */
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

    // ظل أرضي ناعم
    ctx.fillStyle = 'rgba(20,10,30,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 1.5, 13, 3, 0, 0, 7); ctx.fill();

    // أرجل + حذاء أبيض
    ctx.strokeStyle = NAYA_SKIN; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3.5, -16); ctx.lineTo(-3.5, -4); ctx.moveTo(3.5, -16); ctx.lineTo(3.5, -4); ctx.stroke();
    const shoeG = ctx.createLinearGradient(0, -5, 0, 0);
    shoeG.addColorStop(0, '#ffffff'); shoeG.addColorStop(1, '#d8d8e0');
    ctx.fillStyle = shoeG;
    U.roundRect(ctx, -7.5, -5, 8, 5, 2.5); ctx.fill();
    U.roundRect(ctx, 0.5, -5, 8, 5, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(70,42,26,0.35)'; ctx.lineWidth = 0.8;
    U.roundRect(ctx, -7.5, -5, 8, 5, 2.5); ctx.stroke();
    U.roundRect(ctx, 0.5, -5, 8, 5, 2.5); ctx.stroke();

    // ذراع خلفية
    nayaArm(ctx, -6, -30, armB, false);

    // فستان منفوش بطبقات تول متدرجة + تمايل حافة
    const hemSway = s(t * 2.2) * 1.4;
    // طبقة خلفية داكنة
    ctx.fillStyle = U.shade(o.dress, -0.14);
    ctx.beginPath();
    ctx.moveTo(-8, -32);
    ctx.quadraticCurveTo(-17.5, -14, -13 - hemSway, -11.5);
    ctx.quadraticCurveTo(0, -7.5, 13 + hemSway, -11.5);
    ctx.quadraticCurveTo(17.5, -14, 8, -32);
    ctx.closePath(); ctx.fill();
    // طبقة وسطى
    const dgr = ctx.createLinearGradient(0, -32, 0, -10);
    dgr.addColorStop(0, U.shade(o.dress, 0.12));
    dgr.addColorStop(1, U.shade(o.dress, -0.05));
    ctx.fillStyle = dgr;
    ctx.beginPath();
    ctx.moveTo(-7, -32 + breath * -0.5);
    ctx.quadraticCurveTo(-14.5, -16, -11 - hemSway * 0.7, -14);
    ctx.quadraticCurveTo(0, -10.5, 11 + hemSway * 0.7, -14);
    ctx.quadraticCurveTo(14.5, -16, 7, -32 + breath * -0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,70,0.35)'; ctx.lineWidth = 0.9;
    ctx.stroke();
    // ثنيات التول
    ctx.strokeStyle = U.alpha(U.shade(o.dress, -0.22), 0.6);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-7.5, -19, -8.5 - hemSway * 0.5, -14.5);
    ctx.moveTo(0, -25); ctx.quadraticCurveTo(0.5, -19, 0, -12);
    ctx.moveTo(6, -26); ctx.quadraticCurveTo(7.5, -19, 8.5 + hemSway * 0.5, -14.5);
    ctx.stroke();
    // لمعة حافة الفستان
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10 - hemSway * 0.7, -13.4);
    ctx.quadraticCurveTo(0, -10, 10 + hemSway * 0.7, -13.4);
    ctx.stroke();
    // زخرفة زهرية على الصدر
    ctx.fillStyle = o.deco;
    for (const [fx2, fy] of [[-3, -29], [2, -27], [-1, -25]]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.5;
        ctx.beginPath(); ctx.arc(fx2 + Math.cos(a) * 1.7, fy + Math.sin(a) * 1.7, 1.05, 0, 7); ctx.fill();
      }
      ctx.fillStyle = U.shade(o.deco, 0.35);
      ctx.beginPath(); ctx.arc(fx2, fy, 0.9, 0, 7); ctx.fill();
      ctx.fillStyle = o.deco;
    }
    // عقد خرز ملون لامع
    const beads = ['#ff8ab0', '#8ad8ff', '#ffe08a', '#b8ffa8'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = beads[i];
      const bx = -4.5 + i * 3, by = -33.5 + Math.abs(i - 1.5) * 1.2;
      ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(bx - 0.4, by - 0.4, 0.5, 0, 7); ctx.fill();
    }

    // ذراع أمامية
    nayaArm(ctx, 6, -30, armA, true);

    // رأس
    ctx.save();
    ctx.translate(0, -43);
    ctx.fillStyle = U.shade(NAYA_SKIN, -0.12);
    ctx.fillRect(-2.5, 3, 5, 5);
    const fgr = ctx.createRadialGradient(-3, -3, 2, 0, 0, 13);
    fgr.addColorStop(0, U.shade(NAYA_SKIN, 0.15));
    fgr.addColorStop(0.6, NAYA_SKIN);
    fgr.addColorStop(1, U.shade(NAYA_SKIN, -0.08));
    ctx.fillStyle = fgr;
    ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,42,26,0.45)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, 7); ctx.stroke();

    // شعر مجعد — عناقيد بتدرج وحركة خفيفة
    const curlSway = s(t * 2.5) * 0.8;
    const curls = [[-9, -7, 5], [-4, -10.5, 5.5], [2, -11, 5.5], [8, -8, 5], [11, -3, 4.5], [-11.5, -1, 4.5],
      [12, 3, 4], [-12, 5, 4], [10, 9, 3.5], [-10, 10, 3.5]];
    const hgr = ctx.createRadialGradient(0, -6, 3, 0, 0, 17);
    hgr.addColorStop(0, U.shade(NAYA_HAIR, 0.22));
    hgr.addColorStop(1, NAYA_HAIR);
    ctx.fillStyle = hgr;
    for (const [cx, cy, cr2] of curls) {
      ctx.beginPath(); ctx.arc(cx + (cy < 0 ? curlSway : curlSway * 0.4), cy, cr2, 0, 7); ctx.fill();
    }
    // لمعات خصل
    ctx.fillStyle = U.alpha(U.shade(NAYA_HAIR, 0.45), 0.8);
    for (const [hx, hy, hr] of [[-3, -10, 1.8], [5, -9.5, 1.6], [10, -3, 1.4], [-10, -3, 1.3]]) {
      ctx.beginPath(); ctx.arc(hx + curlSway, hy, hr, 0, 7); ctx.fill();
    }
    // فيونكة بلمعة
    ctx.fillStyle = '#d4b494';
    ctx.beginPath();
    ctx.moveTo(6, -11); ctx.lineTo(11.5, -15); ctx.lineTo(10.3, -8.8); ctx.closePath();
    ctx.moveTo(6, -11); ctx.lineTo(1.6, -15.4); ctx.lineTo(3.3, -9.3); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0a080';
    ctx.beginPath(); ctx.arc(6, -11.5, 1.9, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(5.4, -12.1, 0.7, 0, 7); ctx.fill();

    // عيون واسعة برموش وحدقة متتبعة
    const lx = U.clamp(look !== undefined ? look : 0.4, -1, 1) * 1.0;
    if (eyes === 'open') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(4.5, -0.5, 2.9, 3.5, 0, 0, 7); ctx.ellipse(-2.8, -0.5, 2.9, 3.5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(46,32,22,0.4)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(4.5, -0.5, 2.9, 3.5, 0, 0, 7); ctx.ellipse(-2.8, -0.5, 2.9, 3.5, 0, 0, 7); ctx.stroke();
      const ig = ctx.createRadialGradient(5 + lx, -0.4, 0.3, 5 + lx, 0, 1.9);
      ig.addColorStop(0, '#6a4426'); ig.addColorStop(1, '#2e1a0e');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(5 + lx, 0, 1.9, 0, 7); ctx.arc(-2.3 + lx, 0, 1.9, 0, 7); ctx.fill();
      ctx.fillStyle = '#180d06';
      ctx.beginPath(); ctx.arc(5 + lx, 0, 0.85, 0, 7); ctx.arc(-2.3 + lx, 0, 0.85, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(5.6 + lx * 0.5, -0.8, 0.65, 0, 7); ctx.arc(-1.7 + lx * 0.5, -0.8, 0.65, 0, 7); ctx.fill();
      // رموش
      ctx.strokeStyle = NAYA_HAIR; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(7, -3.4); ctx.lineTo(8.5, -4.5);
      ctx.moveTo(6, -4.1); ctx.lineTo(7, -5.3);
      ctx.moveTo(-5.2, -3.4); ctx.lineTo(-6.7, -4.5);
      ctx.moveTo(-4.2, -4.1); ctx.lineTo(-5.2, -5.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#3d2517'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(2.2, -0.3); ctx.quadraticCurveTo(4.5, 1, 6.8, -0.3);
      ctx.moveTo(-5.1, -0.3); ctx.quadraticCurveTo(-2.8, 1, -0.5, -0.3);
      ctx.stroke();
    }
    // حواجب رقيقة
    ctx.strokeStyle = U.shade(NAYA_HAIR, 0.1); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    const nbY = mouth === 'sad' ? -4.6 : -5.2;
    ctx.beginPath();
    ctx.moveTo(2.4, nbY + (mouth === 'sad' ? 0.6 : 0)); ctx.quadraticCurveTo(4.7, nbY - 0.8, 6.8, nbY + 0.1);
    ctx.moveTo(-5.4, nbY + 0.1); ctx.quadraticCurveTo(-3.2, nbY - 0.8, -1, nbY + (mouth === 'sad' ? 0.6 : 0));
    ctx.stroke();
    // خدود وردية
    ctx.fillStyle = 'rgba(255,130,130,0.32)';
    ctx.beginPath(); ctx.ellipse(7.5, 3.5, 2.3, 1.5, 0, 0, 7); ctx.ellipse(-6, 3.5, 2.3, 1.5, 0, 0, 7); ctx.fill();
    // أنف
    ctx.strokeStyle = '#d9a877'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(1.5, 1.5); ctx.quadraticCurveTo(2.4, 2.8, 1.4, 3.6); ctx.stroke();
    // فم
    ctx.strokeStyle = '#a04a4a'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    if (mouth === 'smile') { ctx.beginPath(); ctx.moveTo(-1.5, 5.8); ctx.quadraticCurveTo(1.5, 8.2, 4.5, 5.8); ctx.stroke(); }
    else if (mouth === 'grin') {
      ctx.fillStyle = '#8a3530';
      ctx.beginPath(); ctx.moveTo(-2, 5.5); ctx.quadraticCurveTo(1.5, 10.2, 5, 5.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-1.4, 5.6); ctx.lineTo(4.4, 5.6); ctx.lineTo(3.9, 7); ctx.lineTo(-0.9, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e06a6a';
      ctx.beginPath(); ctx.ellipse(1.5, 8.4, 1.9, 1, 0, 0, 7); ctx.fill();
    }
    else if (mouth === 'sad') { ctx.beginPath(); ctx.moveTo(-1.5, 7.5); ctx.quadraticCurveTo(1.5, 5.4, 4.5, 7.5); ctx.stroke(); }
    else if (mouth === 'hmm') { ctx.beginPath(); ctx.moveTo(-0.5, 6.8); ctx.lineTo(3.8, 6.8); ctx.stroke(); }
    ctx.restore();

    ctx.restore();
  }

  function nayaArm(ctx, ox, oy, ang, front) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    ctx.strokeStyle = front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.14);
    ctx.lineWidth = 4.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    ctx.fillStyle = front ? NAYA_SKIN : U.shade(NAYA_SKIN, -0.14);
    ctx.beginPath(); ctx.arc(0, 13, 2.9, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,42,26,0.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.arc(0, 13, 2.9, 0, 7); ctx.stroke();
    // سوار خرز
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(-1, 9, 1.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#8ad8ff';
    ctx.beginPath(); ctx.arc(1, 9.4, 1.1, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- ملك الظلال (للمشاهد) ---------- */
  function drawShadowKing(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);
    const wob = Math.sin(t * 2) * 3;
    // هالة طاقة مظلمة
    ctx.globalCompositeOperation = 'screen';
    const aura = ctx.createRadialGradient(0, -55 + wob, 20, 0, -55 + wob, 90);
    aura.addColorStop(0, 'rgba(140,70,255,0.22)');
    aura.addColorStop(1, 'rgba(140,70,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, -55 + wob, 90, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // عباءة ظل بتدرج
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
    // حافة سفلية ممزقة متموجة
    for (let i = 3; i >= -3; i--) {
      ctx.quadraticCurveTo(i * 11 + 5, -14 + Math.sin(t * 3 + i) * 5, i * 11, -2);
    }
    ctx.closePath(); ctx.fill();
    // وجه مظلم بعينين متوهجتين
    ctx.fillStyle = '#0e081e';
    ctx.beginPath(); ctx.arc(0, -70 + wob, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#b44aff';
    ctx.shadowColor = '#b44aff'; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(-6, -72 + wob, 3.6, 2.1, -0.3, 0, 7);
    ctx.ellipse(6, -72 + wob, 3.6, 2.1, 0.3, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    // تاج شوكي متوهج الأطراف
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

  RN.Chars = { drawRayan, drawNaya, drawShadowKing, SKIN, HAIR };
})();
