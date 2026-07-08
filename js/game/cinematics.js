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

  /* ---------- مقدمة القصة (سينمائية متحركة) ---------- */
  class IntroScene extends BaseCine {
    constructor(done) {
      super(done);
      // مدد المشاهد: القرية، الأطلال، الخطف الديناميكي، العوالم
      this.durs = [6.5, 6, 9.5, 6];
      this.duration = this.durs.reduce((a, b) => a + b, 0);
      // غيوم متحركة مشتركة
      this.clouds = [];
      const rng = U.rng(314);
      for (let i = 0; i < 7; i++) {
        this.clouds.push({ x: rng() * (RN.VW + 400), y: 25 + rng() * 140, w: 90 + rng() * 130, sp: 10 + rng() * 14, a: 0.45 + rng() * 0.35 });
      }
      this.birds = [];
      for (let i = 0; i < 3; i++) this.birds.push({ y: 60 + rng() * 90, sp: 30 + rng() * 20, ph: rng() * 7 });
      this.texts = RN.I18N.lang === 'ar' ? [
        'في قرية هادئة عند أطراف التلال، عاش ريان مع أخته الصغيرة نايا...',
        'في يومٍ مشمس، اكتشفا أطلالًا قديمة... وبوابة مختومة منذ آلاف السنين.',
        'انفتحت البوابة! وخرج منها ملك الظلال...',
        'انقسم العالم إلى ستة عوالم... وبدأت رحلة ريان لإنقاذ أخته.',
      ] : [
        'In a quiet village by the hills, Rayan lived with his little sister Naya...',
        'One sunny day they found ancient ruins... and a gate sealed for millennia.',
        'The gate burst open! The Shadow King emerged...',
        'The world split into six realms... and Rayan\'s journey began.',
      ];
    }

    _slide() {
      let t = this.t;
      for (let i = 0; i < this.durs.length; i++) {
        if (t < this.durs[i]) return [i, t];
        t -= this.durs[i];
      }
      return [3, this.durs[3]];
    }

    // سماء متدرجة + غيوم منجرفة + طيور (لكل المشاهد)
    _movingSky(ctx, top, bottom, cloudTint, speedMul, dark) {
      const g = ctx.createLinearGradient(0, 0, 0, RN.VH);
      g.addColorStop(0, top); g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      // شمس (إلا في الظلام)
      if (!dark) {
        const sx = RN.VW - 180, sy = 100;
        const halo = ctx.createRadialGradient(sx, sy, 8, sx, sy, 150);
        halo.addColorStop(0, 'rgba(255,250,220,0.9)');
        halo.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(sx - 150, sy - 150, 300, 300);
      }
      for (const c of this.clouds) {
        const cx = ((c.x + this.t * c.sp * speedMul) % (RN.VW + 460)) - 230;
        ctx.globalAlpha = c.a;
        ctx.fillStyle = cloudTint;
        ctx.beginPath();
        ctx.ellipse(cx, c.y, c.w * 0.5, c.w * 0.16, 0, 0, 7);
        ctx.ellipse(cx - c.w * 0.24, c.y - c.w * 0.06, c.w * 0.27, c.w * 0.13, 0, 0, 7);
        ctx.ellipse(cx + c.w * 0.2, c.y - c.w * 0.08, c.w * 0.3, c.w * 0.15, 0, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!dark) {
        for (const b of this.birds) {
          const bx = ((b.sp * this.t + b.ph * 200) % (RN.VW + 160)) - 80;
          const by = b.y + Math.sin(this.t * 1.5 + b.ph) * 8;
          const flap = Math.sin(this.t * 8 + b.ph) * 4;
          ctx.strokeStyle = 'rgba(40,50,70,0.55)';
          ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bx - 7, by - flap);
          ctx.quadraticCurveTo(bx, by + 2, bx + 7, by - flap);
          ctx.stroke();
        }
      }
    }

    render(ctx) {
      const [slide, st] = this._slide();
      const W = RN.VW, H = RN.VH;

      if (slide === 0) {
        /* ===== القرية: يمشيان فعليًا عبر الشاشة ===== */
        this._movingSky(ctx, '#8fd0e8', '#d8f0c8', '#ffffff', 1);
        // تلال بعيدة
        ctx.fillStyle = '#a8d49a';
        ctx.beginPath();
        ctx.moveTo(0, H - 160);
        for (let x = 0; x <= W; x += 60) ctx.lineTo(x, H - 160 - Math.sin(x * 0.01) * 26);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        // بيوت القرية
        for (let i = 0; i < 5; i++) {
          const hx = 90 + i * 180, hy = H - 152;
          ctx.fillStyle = '#f0e2c4'; ctx.fillRect(hx, hy, 92, 72);
          ctx.strokeStyle = 'rgba(90,60,30,0.4)'; ctx.lineWidth = 2;
          ctx.strokeRect(hx, hy, 92, 72);
          ctx.fillStyle = '#b85a3a';
          ctx.beginPath(); ctx.moveTo(hx - 12, hy); ctx.lineTo(hx + 46, hy - 48); ctx.lineTo(hx + 104, hy); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#7ab8d8';
          ctx.fillRect(hx + 14, hy + 18, 20, 20);
          ctx.fillRect(hx + 58, hy + 18, 20, 20);
          ctx.fillStyle = '#8a5a30';
          ctx.fillRect(hx + 38, hy + 34, 18, 38);
          // دخان مدخنة
          for (let k = 0; k < 3; k++) {
            const sm = (this.t * 0.3 + k * 0.33 + i * 0.2) % 1;
            ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * (1 - sm)) + ')';
            ctx.beginPath(); ctx.arc(hx + 80 + Math.sin(sm * 5 + i) * 8, hy - 50 - sm * 44, 5 + sm * 9, 0, 7); ctx.fill();
          }
        }
        // أرض
        ctx.fillStyle = '#7ab85a'; ctx.fillRect(0, H - 84, W, 84);
        ctx.fillStyle = '#8fca6d'; ctx.fillRect(0, H - 84, W, 10);
        // ممشى ترابي
        ctx.fillStyle = 'rgba(190,160,110,0.65)';
        ctx.beginPath(); ctx.ellipse(W / 2, H - 40, W * 0.55, 26, 0, 0, 7); ctx.fill();
        // *** المشي الحقيقي: ينتقلان من اليسار إلى وسط الشاشة ***
        const walkT = Math.min(1, st / 5.2);
        const wx = U.lerp(-70, W * 0.58, walkT);
        const state = walkT < 1 ? 'walk' : 'idle';
        RN.Chars.drawRayan(ctx, wx, H - 92, state, this.t, 1, RN.C.OUTFITS.explorer, { scale: 1.7, lookX: 0.8 });
        RN.Chars.drawNaya(ctx, wx - 78, H - 90, walkT < 1 ? 'walk' : 'idle', this.t + 0.3, 1, 'princess', 1.6, 0.8);
        // غبار خطوات
        if (walkT < 1 && Math.floor(this.t * 6) % 2 === 0) {
          ctx.fillStyle = 'rgba(180,160,120,0.4)';
          ctx.beginPath(); ctx.arc(wx - 24 + Math.sin(this.t * 9) * 6, H - 88, 3.5, 0, 7); ctx.fill();
        }
      } else if (slide === 1) {
        /* ===== الأطلال: يقتربان من البوابة ===== */
        this._movingSky(ctx, '#d8b070', '#f4e0b8', 'rgba(255,246,220,0.9)', 1);
        // أعمدة أطلال
        for (let i = 0; i < 4; i++) {
          const px = 130 + i * 200, ph = 190 + (i % 2) * 44;
          ctx.fillStyle = i % 2 ? '#b3a382' : '#a89878';
          ctx.fillRect(px, H - 90 - ph, 42, ph);
          ctx.fillStyle = 'rgba(120,100,70,0.5)';
          ctx.fillRect(px, H - 90 - ph, 10, ph);
          ctx.fillStyle = '#8f8066';
          ctx.fillRect(px - 8, H - 90 - ph - 14, 58, 16);
        }
        // البوابة تنبض
        const gx = W * 0.72, gy = H - 210;
        const pulse = 1 + Math.sin(this.t * 2.2) * 0.03;
        ctx.strokeStyle = '#5a4a6a'; ctx.lineWidth = 15;
        ctx.beginPath(); ctx.ellipse(gx, gy, 82 * pulse, 112 * pulse, 0, 0, 7); ctx.stroke();
        const gg = ctx.createRadialGradient(gx, gy, 8, gx, gy, 95);
        gg.addColorStop(0, 'rgba(120,60,180,' + (0.35 + Math.sin(this.t * 2.2) * 0.12) + ')');
        gg.addColorStop(1, 'rgba(60,30,90,0.45)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.ellipse(gx, gy, 74 * pulse, 104 * pulse, 0, 0, 7); ctx.fill();
        // رموز متوهجة تدور
        for (let k = 0; k < 5; k++) {
          const a = this.t * 0.8 + k * 1.256;
          ctx.fillStyle = 'rgba(200,150,255,0.8)';
          ctx.beginPath(); ctx.arc(gx + Math.cos(a) * 82, gy + Math.sin(a) * 112, 3.5, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#9a8768'; ctx.fillRect(0, H - 96, W, 96);
        ctx.fillStyle = '#ac9878'; ctx.fillRect(0, H - 96, W, 10);
        // يقتربان ثم يتأملان
        const wt = Math.min(1, st / 3.2);
        const rx = U.lerp(-60, W * 0.42, wt);
        RN.Chars.drawRayan(ctx, rx, H - 104, wt < 1 ? 'walk' : 'idle', this.t, 1, RN.C.OUTFITS.explorer, { scale: 1.7, lookX: 1 });
        RN.Chars.drawNaya(ctx, rx - 72, H - 102, wt < 1 ? 'walk' : 'think', this.t + 0.3, 1, 'princess', 1.6, 1);
      } else if (slide === 2) {
        /* ===== الخطف الديناميكي ===== */
        // سماء تُظلم تدريجيًا وغيوم داكنة مسرعة
        const darkT = Math.min(1, st / 1.4);
        this._movingSky(ctx,
          U.mix('#d8b070', '#171029', darkT),
          U.mix('#f4e0b8', '#332050', darkT),
          darkT > 0.5 ? '#3a2a55' : '#cbb89a', 3.2, darkT > 0.6);
        // برق خاطف
        if (st > 0.8 && Math.sin(this.t * 9) > 0.93) {
          ctx.fillStyle = 'rgba(220,190,255,0.28)';
          ctx.fillRect(0, 0, W, H);
        }
        // الأطلال والبوابة (منفجرة)
        const gx = W * 0.72, gy = H - 230;
        for (let i = 0; i < 4; i++) {
          const px = 130 + i * 200, ph = 190 + (i % 2) * 44;
          ctx.fillStyle = U.mix('#a89878', '#3a3050', darkT);
          ctx.fillRect(px, H - 90 - ph, 42, ph);
        }
        ctx.fillStyle = U.mix('#9a8768', '#2c2440', darkT);
        ctx.fillRect(0, H - 96, W, 96);
        // فتح البوابة: انفجار ضوئي
        const burst = U.clamp((st - 0.4) / 0.9, 0, 1);
        const rg = ctx.createRadialGradient(gx, gy, 10, gx, gy, 130 + burst * 220);
        rg.addColorStop(0, 'rgba(190,90,255,' + (0.85 * Math.max(0.35, 1 - burst * 0.5)) + ')');
        rg.addColorStop(1, 'rgba(90,30,150,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(200,140,255,0.9)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.ellipse(gx, gy, 80, 110, 0, 0, 7); ctx.stroke();
        // دوامة داخل البوابة
        for (let k = 0; k < 4; k++) {
          const a = this.t * 3 + k * 1.57;
          ctx.strokeStyle = 'rgba(230,190,255,0.5)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(gx, gy, 30 + k * 12, 45 + k * 16, a * 0.35, a, a + 2.2);
          ctx.stroke();
        }

        /* خط زمني: 1.4 نزول الشرير | 2.6 انقضاض | 3.6 إمساك |
           5.6 صعود بها | 6.6 اختفاء | البقية: ريان وحده */
        // مواقع
        const nayaGroundX = W * 0.5;
        let nayaX = nayaGroundX, nayaY = H - 104, nayaPose = 'idle', nayaHeld = false;
        let rayanX = W * 0.3, rayanState = 'idle';
        let kingX = gx, kingY = gy - 40, kingScale = 0.001, kingVisible = st > 1.0;

        if (st < 2.6) {
          // نايا تتراجع خائفة، ريان يتقدم
          nayaPose = st > 1.4 ? 'worried' : 'idle';
          rayanState = st > 1.4 ? 'run' : 'idle';
          rayanX = U.lerp(W * 0.3, W * 0.36, U.clamp((st - 1.4) / 1.2, 0, 1));
          if (kingVisible) {
            // الملك يهبط من البوابة بقوس
            const dT = U.easeOutCubic(U.clamp((st - 1.0) / 1.6, 0, 1));
            kingScale = 0.3 + dT * 0.9;
            kingX = U.lerp(gx, W * 0.62, dT);
            kingY = U.lerp(gy - 30, H - 96, dT) - Math.sin(dT * Math.PI) * 70;
          }
        } else if (st < 3.6) {
          // انقضاض أفقي سريع نحو نايا
          const sw = U.clamp((st - 2.6) / 1.0, 0, 1);
          const swE = sw * sw; // تسارع
          kingScale = 1.2;
          kingX = U.lerp(W * 0.62, nayaGroundX + 14, swE);
          kingY = H - 96 - Math.sin(sw * Math.PI) * 26;
          nayaPose = 'worried';
          // خطوط سرعة خلف الملك
          ctx.strokeStyle = 'rgba(180,120,255,0.5)';
          ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let k = 0; k < 5; k++) {
            const lx = kingX + 40 + k * 26 + Math.sin(this.t * 20 + k) * 4;
            ctx.beginPath(); ctx.moveTo(lx, kingY - 90 + k * 14); ctx.lineTo(lx + 34, kingY - 90 + k * 14); ctx.stroke();
          }
          rayanState = 'run';
          rayanX = U.lerp(W * 0.36, W * 0.42, sw);
          if (st > 3.45) { RN.Engine.doShake(6); RN.Engine.doFlash('#c88aff', 0.35); }
        } else if (st < 5.8) {
          // ممسوكة! يصعد بها نحو البوابة بقوس ديناميكي
          const up = U.easeInOut(U.clamp((st - 3.6) / 2.2, 0, 1));
          kingScale = U.lerp(1.2, 0.55, up);
          // مسار بيزيه: من الأرض لأعلى ثم للبوابة
          const bx0 = nayaGroundX + 14, by0 = H - 96;
          const cx1 = W * 0.42, cy1 = H - 430; // ذروة القوس
          kingX = (1 - up) * (1 - up) * bx0 + 2 * (1 - up) * up * cx1 + up * up * gx;
          kingY = (1 - up) * (1 - up) * by0 + 2 * (1 - up) * up * cy1 + up * up * gy;
          nayaHeld = true;
          nayaPose = 'worried';
          // ريان يطارد ويقفز محاولًا الإمساك
          const chase = U.clamp((st - 3.6) / 1.2, 0, 1);
          rayanX = U.lerp(W * 0.42, W * 0.52, chase);
          rayanState = st < 4.6 ? 'run' : 'jump';
          // أثر طاقة خلفهما
          for (let k = 0; k < 3; k++) {
            ctx.fillStyle = 'rgba(160,90,255,' + (0.3 - k * 0.08) + ')';
            ctx.beginPath(); ctx.arc(kingX + k * 16, kingY + 30 + k * 22, 12 - k * 3, 0, 7); ctx.fill();
          }
        } else if (st < 6.8) {
          // ابتلاع البوابة لهما وإغلاقها
          const sh = U.clamp((st - 5.8) / 1.0, 0, 1);
          kingScale = U.lerp(0.55, 0.02, sh);
          kingX = gx; kingY = gy;
          nayaHeld = kingScale > 0.1;
          rayanX = W * 0.52; rayanState = 'idle';
          if (st > 6.5 && st < 6.65) { RN.Engine.doFlash('#ffffff', 0.5); RN.Engine.doShake(8); }
          // انكماش البوابة
          ctx.globalAlpha = 1 - sh;
        } else {
          // ريان وحيد تحت المطر البنفسجي
          kingVisible = false;
          rayanX = W * 0.52;
          rayanState = 'hurt';
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 1;

        // رسم نايا (على الأرض أو محمولة داخل كرة طاقة)
        if (nayaHeld && kingVisible) {
          const orbX = kingX - 26 * kingScale, orbY = kingY - 46 * kingScale;
          RN.Chars.drawNaya(ctx, orbX, orbY + 34 * kingScale, 'worried', this.t, -1, 'princess', 1.15 * kingScale, -0.8);
          ctx.strokeStyle = 'rgba(190,120,255,0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(orbX, orbY, 40 * kingScale, 52 * kingScale, 0, 0, 7); ctx.stroke();
          const og = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, 46 * kingScale);
          og.addColorStop(0, 'rgba(190,120,255,0.06)');
          og.addColorStop(1, 'rgba(190,120,255,0.3)');
          ctx.fillStyle = og;
          ctx.beginPath(); ctx.ellipse(orbX, orbY, 40 * kingScale, 52 * kingScale, 0, 0, 7); ctx.fill();
        } else if (st < 3.6) {
          RN.Chars.drawNaya(ctx, nayaX, nayaY, nayaPose, this.t, -1, 'princess', 1.6, 1);
        }
        // ملك الظلال
        if (kingVisible && kingScale > 0.02) {
          RN.Chars.drawShadowKing(ctx, kingX, kingY, this.t, 1.35 * kingScale);
        }
        // ريان
        RN.Chars.drawRayan(ctx, rayanX, H - 104, rayanState, this.t, 1, RN.C.OUTFITS.explorer, { scale: 1.7, lookX: 1, lookY: st > 3.6 && st < 6.8 ? -0.8 : 0 });
        // صرخة نايا عند الإمساك
        if (st > 3.6 && st < 5.2) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold ' + RN.UI.fontPx(17) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(RN.I18N.lang === 'ar' ? '!ريااااان' : 'RAYAAAN!', kingX - 30, kingY - 110 * kingScale);
        }
      } else {
        /* ===== العوالم الستة + ريان ينطلق ===== */
        this._movingSky(ctx, '#0d0a1e', '#2a1a4a', '#3a2a55', 1.5, true);
        // نجوم
        for (let i = 0; i < 50; i++) {
          const sx2 = (i * 137) % W, sy2 = (i * 89) % (H - 200);
          ctx.globalAlpha = 0.4 + Math.sin(this.t * 2 + i) * 0.3;
          ctx.fillStyle = '#cdbaff';
          ctx.fillRect(sx2, sy2, 1.8, 1.8);
        }
        ctx.globalAlpha = 1;
        const cols = ['#58b24d', '#e0b263', '#e9f6ff', '#e0562a', '#bfe3ff', '#8a5cff'];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + this.t * 0.25;
          const ix = W / 2 + Math.cos(a) * 260;
          const iy = H / 2 - 30 + Math.sin(a) * 120;
          const iw = 58 + Math.sin(this.t + i) * 4;
          ctx.fillStyle = U.shade(cols[i], -0.35);
          ctx.beginPath(); ctx.moveTo(ix - iw * 0.8, iy + 6); ctx.lineTo(ix, iy + iw * 0.8); ctx.lineTo(ix + iw * 0.8, iy + 6); ctx.closePath(); ctx.fill();
          ctx.fillStyle = cols[i];
          ctx.beginPath(); ctx.ellipse(ix, iy, iw, 20, 0, 0, 7); ctx.fill();
        }
        // ريان يجري نحو مغامرته عبر الشاشة
        const runX = U.lerp(-60, W + 80, st / this.durs[3]);
        ctx.fillStyle = 'rgba(120,90,200,0.25)';
        ctx.beginPath(); ctx.ellipse(runX, H - 60, 40, 8, 0, 0, 7); ctx.fill();
        RN.Chars.drawRayan(ctx, runX, H - 70, 'run', this.t, 1, RN.C.OUTFITS.explorer, { scale: 1.7, lookX: 1 });
      }

      this.letterbox(ctx);
      this.caption(ctx, this.texts[slide]);
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
