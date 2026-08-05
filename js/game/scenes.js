'use strict';
/* ============================================================
   Rayan & Naya — مشاهد الواجهة
   القائمة الرئيسية، الملفات، خريطة العوالم، المتجر،
   الإعدادات، الإنجازات
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;
  const Scenes = {};

  /* ============ القائمة الرئيسية ============ */
  class MenuScene {
    enter() {
      this.bg = new RN.Background(0, 42);
      this.weather = new RN.Weather('leaves');
      this.t = 0;
      // فراشات حية
      const rng = U.rng(77);
      this.butterflies = [];
      for (let i = 0; i < 4; i++) {
        this.butterflies.push({
          x: rng() * RN.VW, y: 200 + rng() * 240, ph: rng() * 7,
          c: U.pick(['#ff9ac0', '#9ad4ff', '#ffd970', '#c9a4ff']),
        });
      }
      // عشب أمامي
      this.grass = [];
      for (let i = 0; i < 70; i++) {
        this.grass.push({ x: (i / 70) * RN.VW + rng() * 12, h: 10 + rng() * 16, ph: rng() * 7, tone: rng() });
      }
      RN.Audio.setMusic('menu', 'explore');
    }
    update(dt, rawDt) {
      this.t += rawDt;
      this.weather.update(rawDt);
      RN.Achievements.update(rawDt);
    }
    render(ctx) {
      this.bg.render(ctx, this.t * 30, 0, this.t);
      // أرضية بخامة
      const tex = RN.Textures.get(0);
      for (let x = 0; x < RN.VW + 32; x += 32) {
        ctx.drawImage(tex.top[Math.floor((x / 32) % 4)], x, RN.VH - 70, 32, 32);
        ctx.drawImage(tex.ground[Math.floor((x / 32 + 2) % 4)], x, RN.VH - 38, 32, 38);
      }

      // الشخصيتان — ينظر كل منهما للآخر
      // RAYAN_TO_NAYA (≈ 1.27 مقياسًا، ~20% طولًا على الشاشة) تُبقي نسبة
      // الطول بين الشخصيتين موحّدة مع بقية المشاهد.
      const nayaTitleScale = 1.5;
      const rayanTitleScale = nayaTitleScale * RN.Chars.RAYAN_TO_NAYA;
      RN.Chars.drawRayan(ctx, RN.VW / 2 - 190, RN.VH - 74, 'idle', this.t, 1,
        RN.C.OUTFITS[RN.Save.data.outfit || 'explorer'], { scale: rayanTitleScale, lookX: 1 });
      RN.Chars.drawNaya(ctx, RN.VW / 2 + 190, RN.VH - 74, 'wave', this.t, -1, 'princess', nayaTitleScale, 0.9);

      // فراشات ترفرف
      for (const b of this.butterflies) {
        const bx = b.x + Math.sin(this.t * 0.7 + b.ph) * 90;
        const by = b.y + Math.sin(this.t * 1.1 + b.ph * 2) * 40;
        const flap = Math.sin(this.t * 14 + b.ph) * 0.9;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.sin(this.t + b.ph) * 0.2);
        ctx.fillStyle = b.c;
        for (const s of [-1, 1]) {
          ctx.save();
          ctx.scale(s, 1);
          ctx.rotate(flap * 0.5);
          ctx.beginPath();
          ctx.ellipse(4, -2, 4.5, 3, 0.5, 0, 7);
          ctx.ellipse(3.5, 2, 3.4, 2.3, -0.4, 0, 7);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-0.8, -3, 1.6, 7);
        ctx.restore();
      }

      // أوراق الطقس
      this.weather.render(ctx);

      // عشب أمامي متمايل
      for (const g of this.grass) {
        const sway = Math.sin(this.t * 2 + g.ph + g.x * 0.02) * 3.5;
        ctx.strokeStyle = g.tone > 0.6 ? '#63bd58' : g.tone > 0.3 ? '#4da045' : '#3c8a3e';
        ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(g.x, RN.VH - 64);
        ctx.quadraticCurveTo(g.x + sway * 0.4, RN.VH - 64 - g.h * 0.6, g.x + sway, RN.VH - 64 - g.h);
        ctx.stroke();
      }

      /* ---- الشعار: كتلة ثلاثية الأبعاد بلمعان ودخول متحرك ---- */
      // دخول: نزول مع ارتداد في أول ثانية ونصف
      const intro = Math.min(1, this.t / 1.2);
      const bounce = intro < 1 ? Math.pow(intro, 2) * (3 - 2 * intro) : 1;
      const dropY = U.lerp(-160, 0, bounce) + (intro >= 1 ? Math.sin(this.t * 1.4) * 5 : 0);
      const popScale = intro < 1 ? 0.7 + bounce * 0.3 : 1;
      ctx.save();
      ctx.translate(RN.VW / 2, 105 + dropY);
      ctx.scale(popScale, popScale);
      ctx.rotate(Math.sin(this.t * 0.7) * 0.012);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const TITLE = RN.t('title');
      ctx.font = `900 ${RN.UI.fontPx(62)}px sans-serif`;
      // توهج خلفي
      ctx.shadowColor = 'rgba(255,190,60,0.55)';
      ctx.shadowBlur = 26;
      // عمق ثلاثي الأبعاد: طبقات إزاحة
      for (let d = 7; d >= 1; d--) {
        ctx.fillStyle = U.mix('#5c2e08', '#8a4a12', d / 7);
        ctx.fillText(TITLE, 0, d * 1.6);
      }
      ctx.shadowBlur = 0;
      // الوجه الأمامي بتدرج ذهبي + حد
      ctx.lineWidth = 8; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#4a2606';
      ctx.strokeText(TITLE, 0, 0);
      const grad = ctx.createLinearGradient(0, -32, 0, 32);
      grad.addColorStop(0, '#fff6b0');
      grad.addColorStop(0.4, '#ffdd4a');
      grad.addColorStop(0.65, '#ffb02a');
      grad.addColorStop(1, '#ff8a1e');
      ctx.fillStyle = grad;
      ctx.fillText(TITLE, 0, 0);
      // لمعان يمسح الشعار كل بضع ثوانٍ
      const shinePhase = (this.t % 4) / 4;
      if (shinePhase < 0.3) {
        ctx.save();
        ctx.beginPath();
        const sx = U.lerp(-220, 220, shinePhase / 0.3);
        ctx.rect(sx - 26, -44, 52, 88);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(TITLE, 0, 0);
        ctx.restore();
      }
      // بريق نجمي
      for (let i = 0; i < 2; i++) {
        const sp = ((this.t * 0.5 + i * 0.5) % 1);
        const sx = -150 + i * 260, sy = -22 + i * 30;
        const ss = Math.sin(sp * Math.PI) * 6;
        if (ss > 0.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(sp * 2);
          for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-0.9, -ss, 1.8, ss * 2); }
          ctx.restore();
        }
      }
      // العنوان الفرعي
      ctx.font = `bold ${RN.UI.fontPx(19)}px sans-serif`;
      ctx.strokeStyle = 'rgba(30,45,80,0.85)'; ctx.lineWidth = 5;
      ctx.strokeText(RN.t('subtitle'), 0, 52);
      const sg = ctx.createLinearGradient(0, 44, 0, 60);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#bfe0ff');
      ctx.fillStyle = sg;
      ctx.fillText(RN.t('subtitle'), 0, 52);
      ctx.restore();

      // تدرج سينمائي + Vignette
      ctx.globalCompositeOperation = 'overlay';
      const cg = ctx.createLinearGradient(0, 0, 0, RN.VH);
      cg.addColorStop(0, 'rgba(255,200,120,0.10)');
      cg.addColorStop(1, 'rgba(40,80,160,0.12)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      ctx.globalCompositeOperation = 'source-over';
      const vg = ctx.createRadialGradient(RN.VW / 2, RN.VH / 2, RN.VH * 0.5, RN.VW / 2, RN.VH / 2, RN.VH * 1.05);
      vg.addColorStop(0, 'rgba(0,0,20,0)');
      vg.addColorStop(1, 'rgba(0,0,20,0.32)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, RN.VW, RN.VH);

      // الأزرار
      const hasSave = RN.Save.listProfiles().some((p) => p);
      this.buttons = [];
      let by = 215;
      if (hasSave) {
        this.buttons.push({ x: RN.VW / 2 - 130, y: by, w: 260, h: 52, label: RN.t('continue'), primary: true, act: 'continue' });
        by += 62;
      }
      this.buttons.push({ x: RN.VW / 2 - 130, y: by, w: 260, h: 52, label: hasSave ? RN.t('profiles') : RN.t('play'), primary: !hasSave, act: 'profiles' });
      by += 62;
      this.buttons.push({ x: RN.VW / 2 - 130, y: by, w: 260, h: 46, label: RN.t('settings'), act: 'settings' });
      by += 56;
      this.buttons.push({ x: RN.VW / 2 - 130, y: by, w: 260, h: 46, label: RN.t('achievements'), act: 'ach' });
      // زر اللغة
      this.buttons.push({ x: RN.VW - 110, y: 16, w: 90, h: 38, label: RN.I18N.lang === 'ar' ? 'EN' : 'عربي', act: 'lang', fs: 15 });
      for (const b of this.buttons) RN.UI.button(ctx, b);
      RN.Achievements.render(ctx);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `${RN.UI.fontPx(11)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('v1.0', RN.VW / 2, RN.VH - 12);
    }
    onClick(x, y) {
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          RN.Audio.sfx('ui');
          if (b.act === 'continue') {
            // آخر ملف مستخدم
            const profiles = RN.Save.listProfiles();
            let idx = 0, newest = -1;
            profiles.forEach((p, i) => { if (p && p.created > newest) { newest = p.created; idx = i; } });
            RN.Save.loadProfile(idx);
            RN.Engine.setScene(new Scenes.WorldMapScene(RN.Save.data.world));
          }
          if (b.act === 'profiles') RN.Engine.setScene(new Scenes.ProfilesScene());
          if (b.act === 'settings') RN.Engine.setScene(new Scenes.SettingsScene('menu'));
          if (b.act === 'ach') RN.Engine.setScene(new Scenes.AchievementsScene());
          if (b.act === 'lang') {
            RN.I18N.lang = RN.I18N.lang === 'ar' ? 'en' : 'ar';
            RN.Save.settings.lang = RN.I18N.lang;
            RN.Save.saveSettings();
          }
          return;
        }
      }
    }
  }

  /* ============ الملفات ============ */
  class ProfilesScene {
    enter() {
      this.bg = new RN.Background(4, 7);
      this.t = 0;
      this.confirmDelete = -1;
    }
    update(dt, rawDt) { this.t += rawDt; }
    render(ctx) {
      this.bg.render(ctx, this.t * 20, 0, this.t);
      ctx.fillStyle = 'rgba(6,8,20,0.55)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      RN.UI.panel(ctx, RN.VW / 2 - 330, 40, 660, 440, RN.t('profiles'));
      const profiles = RN.Save.listProfiles();
      this.buttons = [{ x: 24, y: 20, w: 100, h: 40, label: '‹ ' + RN.t('back'), act: 'back', fs: 14 }];
      for (let i = 0; i < 3; i++) {
        const p = profiles[i];
        const cx = RN.VW / 2 + (i - 1) * 210;
        const cy = 110;
        ctx.fillStyle = 'rgba(30,38,66,0.9)';
        U.roundRect(ctx, cx - 95, cy, 190, 270, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(120,140,220,0.4)'; ctx.lineWidth = 2;
        U.roundRect(ctx, cx - 95, cy, 190, 270, 14); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${RN.UI.fontPx(17)}px sans-serif`;
        ctx.fillText(`${RN.t('profile')} ${i + 1}`, cx, cy + 26);
        if (p) {
          // مقياس مصغّر ثابت كي لا تتجاوز الشخصية عنوان البطاقة عند cy+26
          RN.Chars.drawRayan(ctx, cx, cy + 125, 'idle', this.t + i, 1, RN.C.OUTFITS[p.outfit] || RN.C.OUTFITS.explorer, { scale: 1.18 });
          ctx.fillStyle = '#ffffff';
          ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
          let stars = 0; for (const k in p.stars) stars += p.stars[k];
          ctx.fillText(`${RN.t('worlds')[Math.min(RN.C.WORLD_COUNT - 1, p.world)]}`, cx, cy + 155);
          ctx.fillText(U.ltr(`⭐ ${stars}   💎 ${p.crystals}`), cx, cy + 180);
          this.buttons.push({ x: cx - 75, y: cy + 200, w: 150, h: 38, label: RN.t('play'), primary: true, act: 'load', idx: i, fs: 15 });
          this.buttons.push({ x: cx - 75, y: cy + 242, w: 150, h: 22, label: this.confirmDelete === i ? RN.t('confirmOverwrite') : '🗑', act: 'del', idx: i, fs: 11 });
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = `${RN.UI.fontPx(14)}px sans-serif`;
          ctx.fillText(RN.t('emptyProfile'), cx, cy + 120);
          this.buttons.push({ x: cx - 75, y: cy + 200, w: 150, h: 38, label: RN.t('newGame'), primary: true, act: 'new', idx: i, fs: 15 });
        }
      }
      for (const b of this.buttons) RN.UI.button(ctx, b);
    }
    onClick(x, y) {
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          RN.Audio.sfx('ui');
          if (b.act === 'back') RN.Engine.setScene(new MenuScene());
          if (b.act === 'load') {
            RN.Save.loadProfile(b.idx);
            RN.Engine.setScene(new Scenes.WorldMapScene(RN.Save.data.world));
          }
          if (b.act === 'new') {
            RN.Save.newProfile(b.idx);
            RN.Engine.setScene(new RN.Cine.IntroScene(() => {
              RN.Engine.setScene(new Scenes.WorldMapScene(0));
            }));
          }
          if (b.act === 'del') {
            if (this.confirmDelete === b.idx) { RN.Save.deleteProfile(b.idx); this.confirmDelete = -1; }
            else this.confirmDelete = b.idx;
          }
          return;
        }
      }
    }
  }

  /* ============ خريطة العوالم واختيار المراحل ============ */
  class WorldMapScene {
    constructor(focusWorld) {
      this.focus = U.clamp(focusWorld || 0, 0, RN.C.WORLD_COUNT - 1);
      this.openWorld = -1;
    }
    enter() {
      this.t = 0;
      this.bg = new RN.Background(this.focus, 99);
      RN.Audio.setMusic('menu', 'explore');
    }
    update(dt, rawDt) { this.t += rawDt; RN.Achievements.update(rawDt); }
    render(ctx) {
      const sd = RN.Save.data;
      this.bg.render(ctx, this.t * 15, 0, this.t);
      ctx.fillStyle = 'rgba(6,8,20,0.5)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);

      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${RN.UI.fontPx(26)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(RN.t('worldMap'), RN.VW / 2, 34);
      // عملة اللاعب
      RN.UI.crystalIcon(ctx, RN.VW - 140, 30, 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${RN.UI.fontPx(17)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(String(sd.crystals), RN.VW - 126, 30);
      // المهمة
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🎯 ' + RN.t('questMain'), RN.VW / 2, 62);

      this.buttons = [
        { x: 24, y: 16, w: 100, h: 38, label: '‹ ' + RN.t('back'), act: 'menu', fs: 14 },
        { x: 24, y: RN.VH - 60, w: 130, h: 44, label: '🛒 ' + RN.t('shop'), act: 'shop', fs: 15 },
        { x: 164, y: RN.VH - 60, w: 130, h: 44, label: '🏆 ' + RN.t('achievements'), act: 'ach', fs: 13 },
        { x: 304, y: RN.VH - 60, w: 130, h: 44, label: '⚙ ' + RN.t('settings'), act: 'settings', fs: 15 },
      ];

      if (this.openWorld < 0) {
        // بطاقات العوالم على صفين متوازنين (مشتقة من WORLD_COUNT) على مسار متعرج
        const cardPos = (w) => {
          const total = RN.C.WORLD_COUNT;
          const topN = Math.ceil(total / 2);
          const row = w < topN ? 0 : 1;
          const n = row === 0 ? topN : total - topN;
          const i = row === 0 ? w : w - topN;
          const step = Math.min(236, (RN.VW - 30) / n);
          return { x: RN.VW / 2 + (i - (n - 1) / 2) * step, y: 150 + row * 165 };
        };
        for (let w = 0; w < RN.C.WORLD_COUNT; w++) {
          const { x: cx, y: cy } = cardPos(w);
          const unlocked = w <= sd.world;
          const wc = RN.C.WORLDS[w];
          // خط المسار
          if (w < RN.C.WORLD_COUNT - 1) {
            const np = cardPos(w + 1);
            ctx.strokeStyle = w < sd.world ? '#ffd700' : 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 4;
            ctx.setLineDash([2, 10]);
            ctx.beginPath(); ctx.moveTo(cx, cy + 55); ctx.lineTo(np.x, np.y + 55); ctx.stroke();
            ctx.setLineDash([]);
          }
          // البطاقة
          ctx.fillStyle = unlocked ? U.alpha(wc.mid, 0.92) : 'rgba(40,44,60,0.9)';
          U.roundRect(ctx, cx - 110, cy, 220, 112, 16); ctx.fill();
          ctx.strokeStyle = w === sd.world ? '#ffd700' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = w === sd.world ? 3 : 2;
          U.roundRect(ctx, cx - 110, cy, 220, 112, 16); ctx.stroke();
          // معاينة سماء العالم
          const g = ctx.createLinearGradient(0, cy + 8, 0, cy + 50);
          g.addColorStop(0, wc.sky[0]); g.addColorStop(1, wc.sky[1]);
          ctx.fillStyle = unlocked ? g : 'rgba(20,22,34,0.8)';
          U.roundRect(ctx, cx - 100, cy + 8, 200, 44, 10); ctx.fill();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (unlocked) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${RN.UI.fontPx(15)}px sans-serif`;
            ctx.fillText(RN.t('worlds')[w], cx, cy + 68);
            // رقم العالم في شارة زاوية مستقلة (تجنب مشاكل bidi)
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(cx - 90, cy + 20, 13, 0, 7); ctx.fill();
            ctx.fillStyle = '#1e3a5c';
            ctx.font = `bold ${RN.UI.fontPx(14)}px sans-serif`;
            ctx.fillText(String(w + 1), cx - 90, cy + 21);
            // نجوم العالم
            let ws = 0;
            for (let l = 0; l < 8; l++) ws += sd.stars[`${w}-${l}`] || 0;
            ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(U.ltr(`⭐ ${ws} / 24`), cx, cy + 92);
            this.buttons.push({ x: cx - 110, y: cy, w: 220, h: 112, label: '', act: 'world', idx: w, invisible: true });
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `${RN.UI.fontPx(22)}px sans-serif`;
            ctx.fillText('🔒', cx, cy + 30);
            ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
            ctx.fillText(RN.t('locked'), cx, cy + 75);
          }
        }
      } else {
        // شبكة مراحل العالم المفتوح
        const w = this.openWorld;
        const wc = RN.C.WORLDS[w];
        RN.UI.panel(ctx, RN.VW / 2 - 330, 86, 660, 360, RN.t('worlds')[w]);
        this.buttons.push({ x: RN.VW / 2 + 250, y: 100, w: 60, h: 36, label: '✕', act: 'closeWorld', fs: 16 });
        for (let l = 0; l < 8; l++) {
          const col = l % 4, row = Math.floor(l / 4);
          const cx = RN.VW / 2 - 240 + col * 160, cy = 165 + row * 135;
          const isBoss = l === 7;
          const unlocked = w < sd.world || (w === sd.world && l <= sd.level);
          ctx.fillStyle = unlocked ? (isBoss ? 'rgba(140,40,60,0.95)' : U.alpha(wc.mid, 0.95)) : 'rgba(40,44,60,0.9)';
          U.roundRect(ctx, cx - 65, cy, 130, 110, 14); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
          U.roundRect(ctx, cx - 65, cy, 130, 110, 14); ctx.stroke();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (unlocked) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${RN.UI.fontPx(isBoss ? 15 : 24)}px sans-serif`;
            ctx.fillText(isBoss ? '👑 ' + RN.t('boss') : String(l + 1), cx, cy + 34);
            const st = sd.stars[`${w}-${l}`] || 0;
            for (let s = 0; s < 3; s++) RN.UI.star(ctx, cx + (s - 1) * 26, cy + 72, 11, s < st);
            const bt = sd.bestTimes[`${w}-${l}`];
            if (bt) {
              ctx.fillStyle = 'rgba(255,255,255,0.6)';
              ctx.font = `${RN.UI.fontPx(11)}px sans-serif`;
              ctx.fillText(U.formatTime(bt), cx, cy + 96);
            }
            this.buttons.push({ x: cx - 65, y: cy, w: 130, h: 110, label: '', act: 'level', wi: w, li: l, invisible: true });
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = `${RN.UI.fontPx(24)}px sans-serif`;
            ctx.fillText('🔒', cx, cy + 55);
          }
        }
      }

      for (const b of this.buttons) if (!b.invisible) RN.UI.button(ctx, b);
      RN.Achievements.render(ctx);
    }
    onClick(x, y) {
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          RN.Audio.sfx('ui');
          if (b.act === 'menu') RN.Engine.setScene(new MenuScene());
          if (b.act === 'shop') RN.Engine.setScene(new Scenes.ShopScene(this.focus));
          if (b.act === 'ach') RN.Engine.setScene(new Scenes.AchievementsScene(this.focus));
          if (b.act === 'settings') RN.Engine.setScene(new Scenes.SettingsScene(this.focus));
          if (b.act === 'world') { this.openWorld = b.idx; }
          if (b.act === 'closeWorld') this.openWorld = -1;
          if (b.act === 'level') RN.Engine.setScene(new RN.LevelScene(b.wi, b.li));
          return;
        }
      }
    }
  }

  /* ============ المتجر ============ */
  class ShopScene {
    constructor(backWorld) { this.backWorld = backWorld || 0; this.tab = 0; }
    enter() { this.t = 0; this.bg = new RN.Background(1, 55); }
    update(dt, rawDt) { this.t += rawDt; }
    render(ctx) {
      const sd = RN.Save.data;
      this.bg.render(ctx, this.t * 15, 0, this.t);
      ctx.fillStyle = 'rgba(6,8,20,0.6)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      RN.UI.panel(ctx, RN.VW / 2 - 360, 30, 720, 470, '🛒 ' + RN.t('shop'));
      RN.UI.crystalIcon(ctx, RN.VW / 2 + 270, 62, 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${RN.UI.fontPx(17)}px sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(String(sd.crystals), RN.VW / 2 + 284, 62);

      this.buttons = [{ x: 24, y: 16, w: 100, h: 38, label: '‹ ' + RN.t('back'), act: 'back', fs: 14 }];
      // تبويبات
      const tabs = [RN.t('outfits'), RN.t('upgrades'), RN.t('abilities') ? 'قدرات' : 'Abilities'];
      const tabLabels = RN.I18N.lang === 'ar' ? ['ملابس ريان', 'التطويرات', 'قدرات خاصة', 'ملابس نايا'] : ['Rayan Outfits', 'Upgrades', 'Abilities', 'Naya Outfits'];
      for (let i = 0; i < 4; i++) {
        this.buttons.push({ x: RN.VW / 2 - 340 + i * 172, y: 88, w: 162, h: 40, label: tabLabels[i], act: 'tab', idx: i, primary: this.tab === i, fs: 14 });
      }

      const startY = 150;
      if (this.tab === 0) {
        // ملابس ريان
        RN.C.OUTFIT_ORDER.forEach((oid, i) => {
          const o = RN.C.OUTFITS[oid];
          const cx = RN.VW / 2 - 240 + (i % 3) * 240, cy = startY + Math.floor(i / 3) * 165;
          ctx.fillStyle = 'rgba(30,38,66,0.9)';
          U.roundRect(ctx, cx - 105, cy, 210, 150, 12); ctx.fill();
          // مقياس مصغّر ثابت ليلائم ارتفاع بطاقة المتجر (150 بكسل)
          RN.Chars.drawRayan(ctx, cx - 55, cy + 115, 'idle', this.t + i, 1, o, { scale: 1.18 });
          const owned = sd.outfitsOwned.includes(oid);
          const equipped = sd.outfit === oid;
          ctx.textAlign = 'center';
          if (!owned) {
            RN.UI.crystalIcon(ctx, cx + 20, cy + 50, 0.9);
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${RN.UI.fontPx(15)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(String(o.cost), cx + 32, cy + 50);
          }
          this.buttons.push({
            x: cx - 5, y: cy + 85, w: 100, h: 40,
            label: equipped ? RN.t('equipped') : owned ? RN.t('equip') : RN.t('buy'),
            act: 'outfit', id: oid, primary: !equipped && (owned || sd.crystals >= o.cost),
            disabled: !owned && sd.crystals < o.cost, fs: 13,
          });
        });
      } else if (this.tab === 1) {
        // التطويرات
        const ups = [
          ['hp', '❤ ' + RN.t('hpUp')],
          ['energy', '⚡ ' + RN.t('energyUp')],
          ['magnet', '◎ ' + RN.t('magnetUp')],
        ];
        ups.forEach(([uid, label], i) => {
          const cy = startY + i * 100;
          const conf = RN.C.UPGRADES[uid];
          const lvl = sd.upgrades[uid];
          const cost = conf.baseCost * (lvl + 1);
          const maxed = lvl >= conf.max;
          ctx.fillStyle = 'rgba(30,38,66,0.9)';
          U.roundRect(ctx, RN.VW / 2 - 320, cy, 640, 84, 12); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${RN.UI.fontPx(17)}px sans-serif`;
          ctx.textAlign = RN.I18N.isRTL() ? 'right' : 'left';
          ctx.fillText(label, RN.I18N.isRTL() ? RN.VW / 2 + 290 : RN.VW / 2 - 290, cy + 28);
          // نقاط المستوى
          for (let k = 0; k < conf.max; k++) {
            ctx.fillStyle = k < lvl ? '#4ae08a' : 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(RN.VW / 2 + (RN.I18N.isRTL() ? 250 : -250) + (RN.I18N.isRTL() ? -1 : 1) * k * 26, cy + 58, 8, 0, 7);
            ctx.fill();
          }
          this.buttons.push({
            x: RN.VW / 2 - (RN.I18N.isRTL() ? 300 : -140), y: cy + 20, w: 160, h: 44,
            label: maxed ? '✓ MAX' : `${RN.t('buy')} — 💎${cost}`,
            act: 'upgrade', id: uid, cost, primary: !maxed && sd.crystals >= cost,
            disabled: maxed || sd.crystals < cost, fs: 13,
          });
        });
      } else if (this.tab === 2) {
        // قدرات المتجر
        RN.C.SHOP_ABILITIES.forEach((a, i) => {
          const cy = startY + i * 110;
          const owned = sd.abilities[a.id];
          ctx.fillStyle = 'rgba(30,38,66,0.9)';
          U.roundRect(ctx, RN.VW / 2 - 320, cy, 640, 94, 12); ctx.fill();
          ctx.fillStyle = '#7ad8ff';
          ctx.font = `bold ${RN.UI.fontPx(18)}px sans-serif`;
          ctx.textAlign = RN.I18N.isRTL() ? 'right' : 'left';
          ctx.fillText((a.id === 'shot' ? '✦ ' : '⏳ ') + RN.t('abilities')[a.id], RN.I18N.isRTL() ? RN.VW / 2 + 290 : RN.VW / 2 - 290, cy + 30);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
          ctx.fillText(RN.t('abilityHints')[a.id], RN.I18N.isRTL() ? RN.VW / 2 + 290 : RN.VW / 2 - 290, cy + 60);
          this.buttons.push({
            x: RN.VW / 2 - (RN.I18N.isRTL() ? 300 : -140), y: cy + 25, w: 160, h: 44,
            label: owned ? '✓ ' + RN.t('owned') : `${RN.t('buy')} — 💎${a.cost}`,
            act: 'ability', id: a.id, cost: a.cost,
            primary: !owned && sd.crystals >= a.cost,
            disabled: owned || sd.crystals < a.cost, fs: 13,
          });
        });
        // القدرات المكتسبة من الزعماء
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = `${RN.UI.fontPx(13)}px sans-serif`;
        ctx.textAlign = 'center';
        const earned = ['doubleJump', 'dash', 'wallJump', 'glide', 'slam']
          .map((abi) => (sd.abilities[abi] ? '✓' : '✗') + ' ' + RN.t('abilities')[abi]).join('   •   ');
        ctx.fillText(earned, RN.VW / 2, startY + 260);
      } else {
        // ملابس نايا (تظهر في المشاهد)
        Object.keys(RN.C.NAYA_OUTFITS).forEach((oid, i) => {
          const o = RN.C.NAYA_OUTFITS[oid];
          const cx = RN.VW / 2 - 240 + (i % 3) * 240, cy = startY + Math.floor(i / 3) * 165;
          ctx.fillStyle = 'rgba(30,38,66,0.9)';
          U.roundRect(ctx, cx - 105, cy, 210, 150, 12); ctx.fill();
          RN.Chars.drawNaya(ctx, cx - 55, cy + 118, 'idle', this.t + i, 1, oid, 1.1);
          const owned = o.cost === 0 || sd.outfitsOwned.includes('naya_' + oid);
          const equipped = sd.nayaOutfit === oid;
          if (!owned) {
            RN.UI.crystalIcon(ctx, cx + 20, cy + 50, 0.9);
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${RN.UI.fontPx(15)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(String(o.cost), cx + 32, cy + 50);
          }
          this.buttons.push({
            x: cx - 5, y: cy + 85, w: 100, h: 40,
            label: equipped ? RN.t('equipped') : owned ? RN.t('equip') : RN.t('buy'),
            act: 'naya', id: oid, primary: !equipped && (owned || sd.crystals >= o.cost),
            disabled: !owned && sd.crystals < o.cost, fs: 13,
          });
        });
      }

      for (const b of this.buttons) if (!b.invisible) RN.UI.button(ctx, b);
    }
    onClick(x, y) {
      const sd = RN.Save.data;
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          if (b.disabled) { RN.Audio.sfx('uiBack'); return; }
          RN.Audio.sfx('ui');
          if (b.act === 'back') RN.Engine.setScene(new WorldMapScene(this.backWorld));
          if (b.act === 'tab') this.tab = b.idx;
          if (b.act === 'outfit') {
            const o = RN.C.OUTFITS[b.id];
            if (!sd.outfitsOwned.includes(b.id)) {
              if (sd.crystals < o.cost) return;
              sd.crystals -= o.cost;
              sd.outfitsOwned.push(b.id);
              RN.Achievements.unlock(`outfit_${b.id}`);
              RN.Audio.sfx('powerup');
            }
            sd.outfit = b.id;
            RN.Achievements.checkCounters();
            RN.Save.commit(false);
          }
          if (b.act === 'naya') {
            const o = RN.C.NAYA_OUTFITS[b.id];
            const key = 'naya_' + b.id;
            if (o.cost > 0 && !sd.outfitsOwned.includes(key)) {
              if (sd.crystals < o.cost) return;
              sd.crystals -= o.cost;
              sd.outfitsOwned.push(key);
              RN.Audio.sfx('powerup');
            }
            sd.nayaOutfit = b.id;
            RN.Save.commit(false);
          }
          if (b.act === 'upgrade') {
            if (sd.crystals >= b.cost && sd.upgrades[b.id] < RN.C.UPGRADES[b.id].max) {
              sd.crystals -= b.cost;
              sd.upgrades[b.id]++;
              RN.Audio.sfx('powerup');
              RN.Achievements.checkCounters();
              RN.Save.commit(false);
            }
          }
          if (b.act === 'ability') {
            if (sd.crystals >= b.cost && !sd.abilities[b.id]) {
              sd.crystals -= b.cost;
              sd.abilities[b.id] = true;
              RN.Audio.sfx('ability');
              if (RN.updateTouchButtons) RN.updateTouchButtons();
              RN.Achievements.checkCounters();
              RN.Save.commit(false);
            }
          }
          return;
        }
      }
    }
  }

  /* ============ الإعدادات ============ */
  class SettingsScene {
    constructor(back) { this.back = back; this.remapping = null; this.confirmReset = false; }
    enter() {
      this.t = 0;
      this.bg = new RN.Background(2, 33);
      RN.Input.onRemap = (action, code) => {
        RN.Save.settings.keymap = RN.Input.map;
        RN.Save.saveSettings();
        this.remapping = null;
      };
    }
    exit() { RN.Input.onRemap = null; RN.Save.saveSettings(); }
    update(dt, rawDt) { this.t += rawDt; }
    render(ctx) {
      const s = RN.Save.settings;
      this.bg.render(ctx, this.t * 12, 0, this.t);
      ctx.fillStyle = 'rgba(6,8,20,0.6)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      RN.UI.panel(ctx, RN.VW / 2 - 430, 46, 860, 448, '⚙ ' + RN.t('settings'));
      this.buttons = [{ x: 24, y: 16, w: 100, h: 38, label: '‹ ' + RN.t('back'), act: 'back', fs: 14 }];

      const rows = [
        ['lang', RN.t('language'), RN.I18N.lang === 'ar' ? 'العربية' : 'English'],
        ['music', RN.t('music'), '◄ ' + Math.round(s.musicVol * 100) + '% ►'],
        ['sfx', RN.t('sfx'), '◄ ' + Math.round(s.sfxVol * 100) + '% ►'],
        ['difficulty', RN.t('difficulty'), RN.t('diffNames')[s.difficulty]],
        ['textScale', RN.t('textSize'), ['85%', '100%', '120%'][[0.85, 1, 1.2].indexOf(s.textScale)] || '100%'],
        ['colorMode', RN.t('colorAssist'), RN.t('colorModes')[s.colorMode]],
        ['assist', RN.t('assistMode'), RN.t('assistLevels')[s.assist]],
        ['quality', RN.t('quality'), RN.t('qualityLevels')[s.quality]],
      ];
      // شبكة الإعدادات: عمودان × أربعة صفوف (تستغل العرض وتُبقي اللوحة متناسقة)
      const rtl = RN.I18N.isRTL();
      const colW = 402, colGap = 24;
      const leftX = RN.VW / 2 - 430 + 16;      // 66
      const rightX = leftX + colW + colGap;    // 492
      const gridTop = 96, rowStep = 50, rowH = 42, valW = 168;
      rows.forEach(([id, label, val], i) => {
        const cx = i % 2 === 0 ? leftX : rightX;
        const cy = gridTop + Math.floor(i / 2) * rowStep;
        ctx.fillStyle = 'rgba(30,38,66,0.75)';
        U.roundRect(ctx, cx, cy, colW, rowH, 8); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${RN.UI.fontPx(15)}px sans-serif`;
        ctx.textAlign = rtl ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, rtl ? cx + colW - 16 : cx + 16, cy + rowH / 2);
        this.buttons.push({
          x: rtl ? cx + 12 : cx + colW - 12 - valW, y: cy + 5, w: valW, h: 32,
          label: val, act: 'cycle', id, fs: 13,
        });
      });
      // إعادة تخصيص الأزرار
      const remapY = gridTop + 4 * rowStep + 6;   // 302
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${RN.UI.fontPx(14)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⌨ ' + RN.t('remap'), RN.VW / 2, remapY + 6);
      const acts = ['jump', 'attack', 'dash', 'shot', 'timeSlow'];
      const remapW = 156, remapStep = 165;
      const remapStart = RN.VW / 2 - ((acts.length - 1) * remapStep + remapW) / 2;
      acts.forEach((a, i) => {
        this.buttons.push({
          x: remapStart + i * remapStep, y: remapY + 18, w: remapW, h: 32,
          label: this.remapping === a ? '...' : `${RN.t('abilities')[a] || a}: ${(RN.Input.map[a] || [''])[0].replace('Key', '')}`,
          act: 'remap', id: a, fs: 11,
        });
      });
      // صفّان بمحاذاة العمودين: الحفظ السحابي + (إعادة المقدمة / تصفير التقدّم)
      const botY = remapY + 62;
      this.buttons.push({ x: leftX, y: botY, w: colW, h: 38, label: '☁ ' + RN.t('exportSave'), act: 'export', fs: 14 });
      this.buttons.push({ x: rightX, y: botY, w: colW, h: 38, label: '☁ ' + RN.t('importSave'), act: 'import', fs: 14 });
      this.buttons.push({ x: leftX, y: botY + 46, w: colW, h: 38, label: '🎬 ' + RN.t('replayIntro'), act: 'replayIntro', fs: 14 });
      this.buttons.push({
        x: rightX, y: botY + 46, w: colW, h: 38,
        label: this.confirmReset ? '⚠ ' + RN.t('confirmReset') : '🗑 ' + RN.t('resetProgress'),
        act: 'reset', primary: this.confirmReset, fs: 14,
      });

      for (const b of this.buttons) RN.UI.button(ctx, b);
      if (this.remapping) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, RN.VW, RN.VH);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${RN.UI.fontPx(22)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(RN.t('pressKey'), RN.VW / 2, RN.VH / 2);
      }
    }
    onClick(x, y) {
      const s = RN.Save.settings;
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          RN.Audio.sfx('ui');
          if (b.act !== 'reset') this.confirmReset = false;
          if (b.act === 'back') {
            RN.Save.saveSettings();
            RN.Engine.setScene(this.back === 'menu' ? new MenuScene() : new WorldMapScene(this.back));
          }
          if (b.act === 'cycle') {
            switch (b.id) {
              case 'lang':
                RN.I18N.lang = RN.I18N.lang === 'ar' ? 'en' : 'ar';
                s.lang = RN.I18N.lang;
                break;
              case 'music': s.musicVol = Math.round(((s.musicVol + 0.1) % 1.1) * 10) / 10; RN.Audio.setMusicVol(s.musicVol); break;
              case 'sfx': s.sfxVol = Math.round(((s.sfxVol + 0.1) % 1.1) * 10) / 10; RN.Audio.setSfxVol(s.sfxVol); break;
              case 'difficulty': s.difficulty = (s.difficulty + 1) % 4; break;
              case 'textScale': {
                const opts = [0.85, 1, 1.2];
                s.textScale = opts[(opts.indexOf(s.textScale) + 1) % 3];
                break;
              }
              case 'colorMode': s.colorMode = (s.colorMode + 1) % 4; break;
              case 'assist': s.assist = (s.assist + 1) % 3; break;
              case 'quality': s.quality = (s.quality + 1) % 3; break;
            }
            RN.Save.saveSettings();
          }
          if (b.act === 'remap') {
            this.remapping = b.id;
            RN.Input.remapTarget = b.id;
          }
          if (b.act === 'export') {
            const code = RN.Save.exportCode();
            if (window.prompt) window.prompt(RN.t('exportSave'), code);
          }
          if (b.act === 'import') {
            const code = window.prompt ? window.prompt(RN.t('importSave'), '') : '';
            if (code) RN.Save.importCode(code);
          }
          if (b.act === 'replayIntro') {
            RN.Save.saveSettings();
            const back = this.back;
            RN.Engine.setScene(new RN.Cine.IntroScene(() => RN.Engine.setScene(new SettingsScene(back))));
          }
          if (b.act === 'reset') {
            if (this.confirmReset) {
              for (let i = 0; i < 3; i++) RN.Save.deleteProfile(i);
              this.confirmReset = false;
              RN.Engine.setScene(new MenuScene());
            } else {
              this.confirmReset = true;
            }
          }
          return;
        }
      }
    }
  }

  /* ============ الإنجازات ============ */
  class AchievementsScene {
    constructor(back) { this.back = back; this.page = 0; }
    enter() { this.t = 0; this.bg = new RN.Background(5, 21); }
    update(dt, rawDt) { this.t += rawDt; }
    render(ctx) {
      this.bg.render(ctx, this.t * 10, 0, this.t);
      ctx.fillStyle = 'rgba(6,8,20,0.65)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      const defs = RN.Achievements.DEFS;
      const unlockedCount = RN.Save.data.achievements.length;
      RN.UI.panel(ctx, RN.VW / 2 - 350, 24, 700, 480, `🏆 ${RN.t('achievements')} — ` + U.ltr(`${unlockedCount} / ${defs.length}`));
      const perPage = 8;
      const pages = Math.ceil(defs.length / perPage);
      this.page = U.clamp(this.page, 0, pages - 1);
      this.buttons = [
        { x: 24, y: 16, w: 100, h: 38, label: '‹ ' + RN.t('back'), act: 'back', fs: 14 },
        { x: RN.VW / 2 - 200, y: 462, w: 70, h: 36, label: '◄', act: 'prev', fs: 15 },
        { x: RN.VW / 2 + 130, y: 462, w: 70, h: 36, label: '►', act: 'next', fs: 15 },
      ];
      ctx.fillStyle = '#ffffff';
      ctx.font = `${RN.UI.fontPx(14)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(U.ltr(`${this.page + 1} / ${pages}`), RN.VW / 2, 480);
      for (let i = 0; i < perPage; i++) {
        const d = defs[this.page * perPage + i];
        if (!d) break;
        const has = RN.Achievements.has(d.id);
        const ry = 70 + i * 48;
        ctx.fillStyle = has ? 'rgba(60,90,50,0.8)' : 'rgba(30,38,66,0.75)';
        U.roundRect(ctx, RN.VW / 2 - 320, ry, 640, 42, 8); ctx.fill();
        ctx.font = `${RN.UI.fontPx(18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(has ? '🏆' : '🔒', RN.VW / 2 + (RN.I18N.isRTL() ? 295 : -295), ry + 21);
        ctx.fillStyle = has ? '#ffffff' : 'rgba(255,255,255,0.5)';
        ctx.font = `${RN.UI.fontPx(14)}px sans-serif`;
        ctx.textAlign = RN.I18N.isRTL() ? 'right' : 'left';
        ctx.fillText(RN.I18N.lang === 'ar' ? d.ar : d.en, RN.VW / 2 + (RN.I18N.isRTL() ? 265 : -265), ry + 21);
      }
      for (const b of this.buttons) RN.UI.button(ctx, b);
    }
    onClick(x, y) {
      for (const b of this.buttons || []) {
        if (RN.UI.hit(b, x, y)) {
          RN.Audio.sfx('ui');
          if (b.act === 'back') {
            RN.Engine.setScene(this.back === undefined ? new MenuScene() : new WorldMapScene(this.back));
          }
          if (b.act === 'prev') this.page--;
          if (b.act === 'next') this.page++;
          return;
        }
      }
    }
  }

  Scenes.MenuScene = MenuScene;
  Scenes.ProfilesScene = ProfilesScene;
  Scenes.WorldMapScene = WorldMapScene;
  Scenes.ShopScene = ShopScene;
  Scenes.SettingsScene = SettingsScene;
  Scenes.AchievementsScene = AchievementsScene;
  RN.Scenes = Scenes;
})();
