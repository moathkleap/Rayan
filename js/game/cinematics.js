'use strict';
/* ============================================================
   Rayan & Naya — المشاهد السينمائية
   مقدمة القصة، مشاهد نايا في السجون (بعد كل زعيم)، الذكريات،
   مشهد النهاية مع تلميح الجزء الثاني — كلها قابلة للتخطي
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  /* نصوص مشاهد نايا حسب سجن كل عالم (تُعرض قبل دخول العالم) */
  const PRISON_SCENES = [
    { // سجن الغابة: قفص خشبي
      ar: ['نايا: لن يوقفني قفص من الأغصان!', 'نايا تحاول ثني القضبان... دون جدوى.', '“ريان… أنا أعلم أنك قادم.”'],
      en: ['Naya: A cage of branches won\'t stop me!', 'Naya pulls at the bars... no luck.', '"Rayan… I know you\'re coming."'],
    },
    { // سجن كريستالي (معبد الصحراء)
      ar: ['نايا تفحص جدران الكريستال المتلألئة.', 'نايا: الضوء ينعكس هنا... ربما أستطيع كسره!', '“ريان… أنا أعلم أنك قادم.”'],
      en: ['Naya studies the shimmering crystal walls.', 'Naya: The light bends here... maybe I can crack it!', '"Rayan… I know you\'re coming."'],
    },
    { // سجن جليدي
      ar: ['البرد قارس... لكن عزيمة نايا أقوى.', 'نايا: سأذيب هذا الجليد ولو بأنفاسي!', '“ريان… أنا أعلم أنك قادم.”'],
      en: ['The cold bites... but Naya\'s will is stronger.', 'Naya: I\'ll melt this ice with my own breath!', '"Rayan… I know you\'re coming."'],
    },
    { // زنزانة بركانية
      ar: ['الحمم تتوهج خلف القضبان الحديدية.', 'نايا: الحرارة تُلين المعدن... فكرة!', '“ريان… أنا أعلم أنك قادم.”'],
      en: ['Lava glows behind the iron bars.', 'Naya: Heat softens metal... that\'s an idea!', '"Rayan… I know you\'re coming."'],
    },
    { // قفص طائر في السماء
      ar: ['قفص معلق بين الغيوم والبروق.', 'نايا: لو أرجّحُ القفص نحو تلك الجزيرة...', '“ريان… أنا أعلم أنك قادم.”'],
      en: ['A cage swings among clouds and lightning.', 'Naya: If I swing it toward that island...', '"Rayan… I know you\'re coming."'],
    },
    { // قاعة مظلمة في القلعة
      ar: ['قاعة العرش المظلمة... آخر سجن.', 'ملك الظلال: أخوكِ لن يصل أبدًا!', 'نايا: بل سيصل... وأنا سأكون جاهزة. “ريان… أنا قادمة إليك أيضًا!”'],
      en: ['The dark throne hall... the final prison.', 'Shadow King: Your brother will never make it!', 'Naya: He will... and I\'ll be ready. "Rayan… I\'m coming to you too!"'],
    },
  ];

  /* الذكريات الاثنتا عشرة (تُفتح بجمع القطع الأثرية) */
  const MEMORIES = [
    { ar: 'أول مغامرة: ريان يعلّم نايا تسلق شجرة التين خلف البيت.', en: 'First adventure: Rayan teaching Naya to climb the fig tree.' },
    { ar: 'ليلة النجوم: بنيا خيمة فوق السطح وعدّا النجوم حتى الفجر.', en: 'Star night: a rooftop tent, counting stars till dawn.' },
    { ar: 'كنز الحديقة: خريطة رسمها ريان، وكنز من حلوى دفنته نايا.', en: 'Garden treasure: Rayan\'s map, Naya\'s buried candy chest.' },
    { ar: 'يوم المطر: قفزا في كل بركة ماء في طريق المدرسة.', en: 'Rain day: jumping in every puddle on the way to school.' },
    { ar: 'قلعة الرمل: بنيا أعظم قلعة على الشاطئ... ثم هدمها الموج فضحكا.', en: 'Sand castle: the greatest castle, till the waves came.' },
    { ar: 'الطائرة الورقية: صنعها ريان، وأطلقتها نايا أعلى من الجميع.', en: 'The kite: Rayan built it, Naya flew it highest.' },
    { ar: 'عيد نايا: خبأ ريان هديتها في عشر صناديق متداخلة.', en: 'Naya\'s birthday: a gift hidden in ten nested boxes.' },
    { ar: 'الدراجة الأولى: ركض ريان خلف دراجتها حتى تعلمت التوازن.', en: 'First bike: Rayan ran behind till she could balance.' },
    { ar: 'مقلب الدقيق: خطة نايا السرية انتهت بوجهين أبيضين وضحكة أم.', en: 'Flour prank: two white faces and mom\'s laughter.' },
    { ar: 'نجم المسرح: شجعها ريان من الصف الأول حين نسيت كلماتها.', en: 'Stage star: Rayan cheering when she forgot her lines.' },
    { ar: 'سباق الأطلال: أول مرة رأيا فيها البوابة القديمة من بعيد.', en: 'Ruins race: the first far glimpse of the ancient gate.' },
    { ar: 'الوعد: "مهما حدث، سنحمي بعضنا دائمًا." — قالاها معًا.', en: 'The promise: "No matter what, we protect each other."' },
  ];

  /* ---------- مشهد أساس ---------- */
  class BaseCine {
    constructor(done) {
      this.done = done;
      this.t = 0;
      this.finished = false;
      this.skipBtn = { x: RN.VW - 130, y: RN.VH - 54, w: 110, h: 38, label: RN.t('skip') };
    }
    enter() { RN.Audio.setMusic(6, 'cine'); }
    finish() {
      if (this.finished) return;
      this.finished = true;
      this.done && this.done();
    }
    onClick(x, y) { if (RN.UI.hit(this.skipBtn, x, y)) this.finish(); }
    update(dt) {
      this.t += dt;
      if (RN.Input.justPressed('pause') || RN.Input.justPressed('jump')) this.finish();
      if (this.t > this.duration) this.finish();
    }
    letterbox(ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, RN.VW, 52);
      ctx.fillRect(0, RN.VH - 52, RN.VW, 52);
      this.skipBtn.label = RN.t('skip');
      RN.UI.button(ctx, this.skipBtn);
    }
    caption(ctx, text, alpha) {
      ctx.fillStyle = `rgba(255,255,255,${alpha === undefined ? 1 : alpha})`;
      ctx.font = `bold ${RN.UI.fontPx(19)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, RN.VW / 2, RN.VH - 26);
    }
  }

  /* ---------- مقدمة القصة ---------- */
  class IntroScene extends BaseCine {
    constructor(done) {
      super(done);
      this.duration = 26;
      this.slides = RN.I18N.lang === 'ar' ? [
        'في قرية هادئة عند أطراف التلال، عاش ريان مع أخته الصغيرة نايا...',
        'في يومٍ مشمس، اكتشفا أطلالًا قديمة... وبوابة مختومة منذ آلاف السنين.',
        'انفتحت البوابة! وخرج منها ملك الظلال... وخطف نايا في لمح البصر!',
        'انقسم العالم إلى ستة عوالم... وبدأت رحلة ريان لإنقاذ أخته.',
      ] : [
        'In a quiet village by the hills, Rayan lived with his little sister Naya...',
        'One sunny day they found ancient ruins... and a gate sealed for millennia.',
        'The gate burst open! The Shadow King emerged... and took Naya!',
        'The world split into six realms... and Rayan\'s journey began.',
      ];
    }
    update(dt) { super.update(dt); }
    render(ctx) {
      const slide = Math.min(3, Math.floor(this.t / 6.5));
      const st = this.t - slide * 6.5;
      // خلفيات
      if (slide === 0) {
        const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
        g.addColorStop(0, '#8fd0e8'); g.addColorStop(1, '#d8f0c8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, RN.VW, RN.VH);
        // بيوت قرية
        for (let i = 0; i < 5; i++) {
          const hx = 120 + i * 170, hy = RN.VH - 150;
          ctx.fillStyle = '#e8d8b8'; ctx.fillRect(hx, hy, 90, 70);
          ctx.fillStyle = '#b85a3a';
          ctx.beginPath(); ctx.moveTo(hx - 10, hy); ctx.lineTo(hx + 45, hy - 45); ctx.lineTo(hx + 100, hy); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#7ab85a'; ctx.fillRect(0, RN.VH - 80, RN.VW, 80);
        RN.Chars.drawRayan(ctx, RN.VW / 2 - 40, RN.VH - 90, 'walk', this.t, 1, RN.C.OUTFITS.explorer, {});
        RN.Chars.drawNaya(ctx, RN.VW / 2 + 30, RN.VH - 90, 'walk', this.t, 1);
      } else if (slide === 1) {
        const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
        g.addColorStop(0, '#c8a86a'); g.addColorStop(1, '#8a6a4a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, RN.VW, RN.VH);
        // أعمدة أطلال
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#a89878';
          ctx.fillRect(150 + i * 190, RN.VH - 260 + (i % 2) * 40, 40, 200);
        }
        // بوابة
        ctx.strokeStyle = '#5a4a6a'; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.ellipse(RN.VW / 2, RN.VH - 200, 80, 110, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(60,30,90,0.5)';
        ctx.beginPath(); ctx.ellipse(RN.VW / 2, RN.VH - 200, 72, 102, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, RN.VH - 90, RN.VW, 90);
        RN.Chars.drawRayan(ctx, RN.VW / 2 - 150, RN.VH - 100, 'idle', this.t, 1, RN.C.OUTFITS.explorer, {});
        RN.Chars.drawNaya(ctx, RN.VW / 2 - 100, RN.VH - 100, 'think', this.t, 1);
      } else if (slide === 2) {
        ctx.fillStyle = '#140a24'; ctx.fillRect(0, 0, RN.VW, RN.VH);
        // انفجار البوابة
        const burst = Math.min(1, st / 1.5);
        const rg = ctx.createRadialGradient(RN.VW / 2, RN.VH / 2, 10, RN.VW / 2, RN.VH / 2, 300 * burst + 50);
        rg.addColorStop(0, 'rgba(180,80,255,0.9)');
        rg.addColorStop(1, 'rgba(60,20,120,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, RN.VW, RN.VH);
        RN.Chars.drawShadowKing(ctx, RN.VW / 2, RN.VH / 2 + 100, this.t, 1.5);
        // نايا مخطوفة
        const ny = RN.VH / 2 - 40 - st * 12;
        RN.Chars.drawNaya(ctx, RN.VW / 2 + 90, ny, 'worried', this.t, -1, 'princess', 0.9);
        ctx.strokeStyle = 'rgba(160,90,255,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(RN.VW / 2 + 90, ny - 30, 34, 48, 0, 0, 7); ctx.stroke();
        RN.Chars.drawRayan(ctx, 150, RN.VH - 100, 'hurt', this.t, 1, RN.C.OUTFITS.explorer, {});
        ctx.fillStyle = '#241a34'; ctx.fillRect(0, RN.VH - 90, RN.VW, 90);
      } else {
        ctx.fillStyle = '#0d0a1e'; ctx.fillRect(0, 0, RN.VW, RN.VH);
        // ستة عوالم كجزر ملونة
        const cols = ['#58b24d', '#e0b263', '#e9f6ff', '#e0562a', '#bfe3ff', '#8a5cff'];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + this.t * 0.2;
          const ix = RN.VW / 2 + Math.cos(a) * 250;
          const iy = RN.VH / 2 - 20 + Math.sin(a) * 120;
          ctx.fillStyle = cols[i];
          ctx.beginPath(); ctx.ellipse(ix, iy, 55, 20, 0, 0, 7); ctx.fill();
          ctx.fillStyle = U.shade(cols[i], -0.35);
          ctx.beginPath(); ctx.moveTo(ix - 45, iy + 6); ctx.lineTo(ix, iy + 44); ctx.lineTo(ix + 45, iy + 6); ctx.closePath(); ctx.fill();
        }
        RN.Chars.drawRayan(ctx, RN.VW / 2, RN.VH / 2 + 40, 'victory', this.t, 1, RN.C.OUTFITS.explorer, {});
      }
      this.letterbox(ctx);
      this.caption(ctx, this.slides[slide]);
    }
  }

  /* ---------- مشهد سجن نايا (قبل عالم جديد) ---------- */
  class PrisonScene extends BaseCine {
    constructor(worldIndex, done) {
      super(done);
      this.wi = worldIndex;
      this.duration = 14;
      this.lines = PRISON_SCENES[worldIndex][RN.I18N.lang === 'ar' ? 'ar' : 'en'];
      this.bg = new RN.Background(worldIndex, worldIndex * 555);
    }
    render(ctx) {
      const w = RN.C.WORLDS[this.wi];
      this.bg.render(ctx, this.t * 20, 0, this.t);
      // أرضية
      ctx.fillStyle = w.ground;
      ctx.fillRect(0, RN.VH - 80, RN.VW, 80);
      ctx.fillStyle = w.groundTop;
      ctx.fillRect(0, RN.VH - 80, RN.VW, 10);

      const cx = RN.VW / 2, cy = RN.VH - 80;
      const lineIdx = Math.min(this.lines.length - 1, Math.floor(this.t / (this.duration / (this.lines.length + 0.6))));
      // نايا داخل السجن
      const pose = lineIdx === 0 ? 'captive' : lineIdx === 1 ? 'think' : 'worried';
      RN.Chars.drawNaya(ctx, cx, cy - 14, pose, this.t, 1, RN.Save.data.nayaOutfit, 1.4);
      this._prison(ctx, cx, cy, this.wi);
      // الحارس يظهر في النهاية
      if (this.t > this.duration - 4) {
        const gx = U.lerp(RN.VW + 100, cx + 220, Math.min(1, (this.t - (this.duration - 4)) / 1.5));
        this._guard(ctx, gx, cy, this.wi);
      }
      this.letterbox(ctx);
      this.caption(ctx, this.lines[lineIdx]);
      // اسم العالم القادم
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${RN.UI.fontPx(16)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(RN.t('worlds')[this.wi], RN.VW / 2, 28);
    }

    _prison(ctx, cx, cy, wi) {
      ctx.save();
      ctx.translate(cx, cy);
      if (wi === 0) { // قفص خشبي
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(i * 24, -4); ctx.lineTo(i * 24 + 4, -150); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(-80, -150); ctx.quadraticCurveTo(0, -185, 84, -150); ctx.stroke();
        ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-76, -140); ctx.quadraticCurveTo(-40, -160, -20, -145); ctx.stroke();
      } else if (wi === 1) { // سجن كريستالي
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#e8d8ff';
        ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(-60, -160); ctx.lineTo(0, -190); ctx.lineTo(60, -160); ctx.lineTo(90, 0); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#c8a8ff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(-60, -160); ctx.lineTo(0, -190); ctx.lineTo(60, -160); ctx.lineTo(90, 0); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-60, -160); ctx.lineTo(0, 0); ctx.moveTo(60, -160); ctx.lineTo(0, 0); ctx.stroke();
      } else if (wi === 2) { // سجن جليدي
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#bfe4ff';
        RN.U.roundRect(ctx, -85, -170, 170, 170, 20); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 6;
        RN.U.roundRect(ctx, -85, -170, 170, 170, 20); ctx.stroke();
        for (let i = 0; i < 4; i++) { // رقاقات
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(-60 + i * 40, -160 + (i % 2) * 8, 4, 0, 7); ctx.fill();
        }
      } else if (wi === 3) { // زنزانة بركانية
        ctx.strokeStyle = '#3a3040'; ctx.lineWidth = 9;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(i * 25, 0); ctx.lineTo(i * 25, -160); ctx.stroke();
        }
        ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6 + Math.sin(this.t * 4) * 0.3;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(i * 25, -4); ctx.lineTo(i * 25, -20); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#3a3040';
        ctx.fillRect(-90, -172, 180, 14);
      } else if (wi === 4) { // قفص طائر معلق
        const sway = Math.sin(this.t * 1.2) * 8;
        ctx.translate(sway, -30);
        ctx.strokeStyle = '#c8a83a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, -240); ctx.stroke();
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(i * 24, 20); ctx.quadraticCurveTo(i * 26, -100, 0, -200); ctx.stroke();
        }
        ctx.beginPath(); ctx.ellipse(0, 20, 78, 14, 0, 0, 7); ctx.stroke();
      } else { // قاعة مظلمة
        ctx.fillStyle = 'rgba(20,10,40,0.55)';
        ctx.fillRect(-RN.VW / 2, -RN.VH + 80, RN.VW, RN.VH);
        ctx.strokeStyle = '#8a5cff'; ctx.lineWidth = 5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.ellipse(0, -70, 95, 120, 0, 0, 7); ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = this.t * 1.5 + i * 1.26;
          ctx.fillStyle = '#b478ff';
          ctx.beginPath(); ctx.arc(Math.cos(a) * 95, -70 + Math.sin(a) * 120, 4, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    _guard(ctx, x, y, wi) {
      // الوحش الحارس: ظل كبير بعينين متوهجتين بلون العالم
      const w = RN.C.WORLDS[wi];
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(15,10,25,0.85)';
      ctx.beginPath();
      ctx.moveTo(-55, 0);
      ctx.quadraticCurveTo(-60, -110, 0, -130 + Math.sin(this.t * 3) * 4);
      ctx.quadraticCurveTo(60, -110, 55, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = w.accent;
      ctx.shadowColor = w.accent; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(-15, -95, 7, 4, -0.2, 0, 7);
      ctx.ellipse(15, -95, 7, 4, 0.2, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  /* ---------- مشهد ذكرى ---------- */
  class MemoryScene extends BaseCine {
    constructor(relicId, done) {
      super(done);
      this.relicId = relicId;
      this.duration = 8;
      this.mem = MEMORIES[relicId % MEMORIES.length];
    }
    render(ctx) {
      // إطار ذكرى دافئ (سيبيا)
      const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
      g.addColorStop(0, '#f4e4c0'); g.addColorStop(1, '#e0c89a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, RN.VW, RN.VH);
      // فينييت
      const rg = ctx.createRadialGradient(RN.VW / 2, RN.VH / 2, 150, RN.VW / 2, RN.VH / 2, 560);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(90,60,20,0.55)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, RN.VW, RN.VH);
      // شمس وعشب
      ctx.fillStyle = 'rgba(255,240,180,0.8)';
      ctx.beginPath(); ctx.arc(RN.VW - 180, 110, 45, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8b476';
      ctx.fillRect(0, RN.VH - 110, RN.VW, 110);
      // الشخصيتان معًا
      RN.Chars.drawRayan(ctx, RN.VW / 2 - 55, RN.VH - 120, 'celebrate', this.t, 1, RN.C.OUTFITS.explorer, {});
      RN.Chars.drawNaya(ctx, RN.VW / 2 + 45, RN.VH - 120, 'cheer', this.t, -1, 'princess', 1.15);
      // قلوب صغيرة
      for (let i = 0; i < 3; i++) {
        const a = this.t * 1.5 + i * 2;
        ctx.fillStyle = `rgba(230,90,110,${0.4 + Math.sin(a) * 0.3})`;
        ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('♥', RN.VW / 2 + Math.sin(a) * 90, RN.VH - 240 - (this.t * 12 + i * 30) % 90);
      }
      ctx.fillStyle = '#6a4a20';
      ctx.font = `bold ${RN.UI.fontPx(22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(RN.t('memoryFound'), RN.VW / 2, 90);
      this.letterbox(ctx);
      this.caption(ctx, RN.I18N.lang === 'ar' ? this.mem.ar : this.mem.en);
    }
  }

  /* ---------- مشهد النهاية ---------- */
  class FinaleScene extends BaseCine {
    constructor(done) {
      super(done);
      this.duration = 24;
    }
    render(ctx) {
      const t = this.t;
      if (t < 14) {
        // تحرير نايا واحتفال
        const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
        g.addColorStop(0, U.mix('#0d0a1e', '#7ec8e3', Math.min(1, t / 6)));
        g.addColorStop(1, U.mix('#2a1a4a', '#cfeef7', Math.min(1, t / 6)));
        ctx.fillStyle = g; ctx.fillRect(0, 0, RN.VW, RN.VH);
        ctx.fillStyle = '#58b24d';
        ctx.fillRect(0, RN.VH - 90, RN.VW, 90);
        // ملك الظلال يتلاشى
        if (t < 4) {
          ctx.globalAlpha = 1 - t / 4;
          RN.Chars.drawShadowKing(ctx, RN.VW / 2 + 200, RN.VH - 100, t, 1.2);
          ctx.globalAlpha = 1;
        }
        const run = Math.min(1, t / 3);
        RN.Chars.drawRayan(ctx, U.lerp(150, RN.VW / 2 - 35, run), RN.VH - 100, t < 3 ? 'run' : 'celebrate', t, 1, RN.C.OUTFITS[RN.Save.data.outfit], {});
        RN.Chars.drawNaya(ctx, U.lerp(RN.VW - 150, RN.VW / 2 + 35, run), RN.VH - 100, t < 3 ? 'walk' : 'cheer', t, -1, RN.Save.data.nayaOutfit, 1.15);
        if (t > 3.5) {
          for (let i = 0; i < 5; i++) {
            const a = t * 2 + i * 1.3;
            ctx.fillStyle = ['#ffd700', '#4ae0d8', '#ff8ab0', '#8ad84a', '#c88aff'][i];
            ctx.beginPath();
            ctx.arc(RN.VW / 2 + Math.sin(a * 1.7) * 200, RN.VH - 200 - ((t * 60 + i * 47) % 240), 4, 0, 7);
            ctx.fill();
          }
        }
        this.caption(ctx, RN.I18N.lang === 'ar'
          ? (t < 4 ? 'تلاشى ملك الظلال... وتحطم السجن الأخير!' : 'نايا: كنتُ أعلم أنك ستأتي! • ريان: دائمًا وأبدًا.')
          : (t < 4 ? 'The Shadow King faded... the last prison shattered!' : 'Naya: I knew you\'d come! • Rayan: Always.'));
      } else {
        // التلميح: بوابة جديدة وظل غامض
        ctx.fillStyle = '#0d0a1e'; ctx.fillRect(0, 0, RN.VW, RN.VH);
        const ft = t - 14;
        // بوابة في السماء
        ctx.strokeStyle = '#e84a8a';
        ctx.shadowColor = '#e84a8a'; ctx.shadowBlur = 20;
        ctx.lineWidth = 5;
        ctx.globalAlpha = Math.min(1, ft / 2);
        ctx.beginPath(); ctx.ellipse(RN.VW / 2, 160, 70 * Math.min(1, ft / 2), 95 * Math.min(1, ft / 2), 0, 0, 7); ctx.stroke();
        ctx.shadowBlur = 0;
        // ظل غامض يراقب
        if (ft > 2.5) {
          ctx.fillStyle = `rgba(230,74,138,${Math.min(0.9, (ft - 2.5) / 2)})`;
          ctx.beginPath();
          ctx.ellipse(RN.VW / 2 - 8, 168, 5, 3, -0.2, 0, 7);
          ctx.ellipse(RN.VW / 2 + 8, 168, 5, 3, 0.2, 0, 7);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#58b24d';
        ctx.fillRect(0, RN.VH - 90, RN.VW, 90);
        RN.Chars.drawRayan(ctx, RN.VW / 2 - 40, RN.VH - 100, 'idle', t, 1, RN.C.OUTFITS[RN.Save.data.outfit], {});
        RN.Chars.drawNaya(ctx, RN.VW / 2 + 30, RN.VH - 100, 'think', t, 1, RN.Save.data.nayaOutfit, 1.15);
        if (ft > 5) {
          ctx.fillStyle = `rgba(255,215,0,${Math.min(1, (ft - 5) / 1.5)})`;
          ctx.font = `bold ${RN.UI.fontPx(26)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(RN.t('theEnd'), RN.VW / 2, RN.VH / 2);
        }
      }
      this.letterbox(ctx);
    }
  }

  RN.Cine = { IntroScene, PrisonScene, MemoryScene, FinaleScene, MEMORIES };
})();
