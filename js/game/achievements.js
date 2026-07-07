'use strict';
/* ============================================================
   Rayan & Naya — نظام الإنجازات (أكثر من 110 إنجازات)
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const DEFS = [];

  function add(id, ar, en) { DEFS.push({ id, ar, en }); }

  // --- إنجازات المراحل: 3 نجوم لكل مرحلة (48) ---
  for (let w = 0; w < 6; w++) {
    for (let l = 0; l < 8; l++) {
      add(`star3_${w}_${l}`, `أداء مثالي ${w + 1}-${l + 1}: ثلاث نجوم`, `Perfect ${w + 1}-${l + 1}: three stars`);
    }
  }
  // --- إكمال العوالم (6) ---
  const WAR = ['الغابة السحرية', 'الصحراء القديمة', 'عالم الجليد', 'أرض البراكين', 'ممالك السماء', 'العالم المظلم'];
  const WEN = ['Enchanted Forest', 'Ancient Desert', 'Frozen Realm', 'Volcano Lands', 'Sky Kingdoms', 'Dark World'];
  for (let w = 0; w < 6; w++) add(`world_${w}`, `بطل ${WAR[w]}`, `Hero of ${WEN[w]}`);
  // --- زعيم دون ضربة (6) ---
  const BAR = ['العنكبوت', 'ملك الرمال', 'التنين الجليدي', 'وحش الحمم', 'حارس السماء', 'ملك الظلال'];
  for (let w = 0; w < 6; w++) add(`bossnohit_${w}`, `بلا خدش: اهزم ${BAR[w]} دون إصابة`, `Untouched: beat boss ${w + 1} without damage`);
  // --- عالم دون موت (6) ---
  for (let w = 0; w < 6; w++) add(`nodeath_${w}`, `روح لا تُقهر: أنهِ ${WAR[w]} دون خسارة`, `Deathless: finish ${WEN[w]} without dying`);
  // --- الذكريات (12 + 1) ---
  for (let i = 0; i < 12; i++) add(`relic_${i}`, `ذكرى مستعادة ${i + 1}/12`, `Memory restored ${i + 1}/12`);
  add('relics_all', 'ألبوم العائلة: اجمع كل الذكريات', 'Family album: collect all memories');
  // --- كريستالات تراكمية (5) ---
  for (const [n, ar] of [[100, 'جامع مبتدئ'], [500, 'جامع ماهر'], [1000, 'ثري الكريستال'], [2500, 'ملك الكريستال'], [5000, 'أسطورة الكريستال']]) {
    add(`crystals_${n}`, `${ar}: اجمع ${n} كريستالة`, `Collect ${n} crystals`);
  }
  // --- قتال (6) ---
  for (const [n, ar] of [[1, 'أول انتصار'], [25, 'مقاتل'], [100, 'محارب'], [250, 'بطل الساحات'], [500, 'كابوس الوحوش'], [1000, 'أسطورة']]) {
    add(`kills_${n}`, `${ar}: اهزم ${n} من الوحوش`, `Defeat ${n} monsters`);
  }
  // --- قفزات (4) ---
  for (const [n, ar] of [[100, 'نطاط'], [1000, 'كنغر'], [5000, 'طائر بلا أجنحة'], [10000, 'ملك القفز']]) {
    add(`jumps_${n}`, `${ar}: اقفز ${n} مرة`, `Jump ${n} times`);
  }
  // --- صناديق (3) ---
  for (const [n, ar] of [[5, 'باحث عن الكنوز'], [20, 'صائد الكنوز'], [50, 'ملك الكنوز']]) {
    add(`chests_${n}`, `${ar}: افتح ${n} صندوقًا`, `Open ${n} chests`);
  }
  // --- أسرار (4) ---
  for (const [n, ar] of [[3, 'عين ثاقبة'], [10, 'مستكشف الخفايا'], [25, 'كاشف الأسرار'], [50, 'لا شيء يخفى عليك']]) {
    add(`secrets_${n}`, `${ar}: اكتشف ${n} سرًا`, `Find ${n} secrets`);
  }
  // --- سرعة (3) ---
  add('speed_60', 'البرق: أنهِ مرحلة في أقل من دقيقة', 'Finish a level under 60s');
  add('speed_45', 'الصاعقة: أنهِ مرحلة في أقل من 45 ثانية', 'Finish a level under 45s');
  add('speed_30', 'أسرع من الظل: أنهِ مرحلة في أقل من 30 ثانية', 'Finish a level under 30s');
  // --- ملابس (6) ---
  for (const o of ['knight', 'ninja', 'robot', 'space', 'hunter']) add(`outfit_${o}`, 'خزانة جديدة: اشترِ زيًا', `Buy the ${o} outfit`);
  add('outfits_all', 'مصمم أزياء: امتلك كل الملابس', 'Own every outfit');
  // --- قدرات (3) ---
  add('abilities_all', 'القوة الكاملة: افتح كل القدرات', 'Unlock every ability');
  add('upgrade_max', 'أقصى حد: طوّر خاصية للنهاية', 'Max out an upgrade');
  add('powerup_10', 'مدمن القوى: استخدم 10 قوى خاصة', 'Use 10 power-ups');
  // --- متفرقات (8) ---
  add('first_level', 'الخطوة الأولى: أنهِ أول مرحلة', 'Finish your first level');
  add('game_done', 'المنقذ: أنقذ نايا واهزم ملك الظلال', 'Rescue Naya and beat the Shadow King');
  add('nightmare_done', 'سيد الكوابيس: أنهِ اللعبة على صعوبة كابوس', 'Beat the game on Nightmare');
  add('deaths_10', 'العنيد: لا تستسلم بعد 10 محاولات', 'Die 10 times and keep going');
  add('no_crystal_level', 'الزاهد: أنهِ مرحلة دون جمع أي كريستالة', 'Finish a level with zero crystals');
  add('all_crystal_level', 'المكنسة: اجمع كل كريستالات مرحلة', 'Collect every crystal in a level');
  add('stars_50', 'سماء مرصعة: اجمع 50 نجمة', 'Earn 50 stars');
  add('stars_144', 'الكمال المطلق: اجمع كل النجوم', 'Earn every star');

  const Achievements = {
    DEFS,
    queue: [],

    has(id) { return RN.Save.data.achievements.includes(id); },

    unlock(id) {
      if (this.has(id)) return;
      const def = DEFS.find((d) => d.id === id);
      if (!def) return;
      RN.Save.data.achievements.push(id);
      this.queue.push({ def, t: 4 });
      RN.Audio.sfx('achievement');
      RN.Save.auto();
    },

    // فحوصات العدادات المركزية
    checkCounters() {
      const s = RN.Save.data;
      const c = s.statsCounters;
      for (const n of [1, 25, 100, 250, 500, 1000]) if (c.kills >= n) this.unlock(`kills_${n}`);
      for (const n of [100, 1000, 5000, 10000]) if (c.jumps >= n) this.unlock(`jumps_${n}`);
      for (const n of [5, 20, 50]) if (c.chests >= n) this.unlock(`chests_${n}`);
      for (const n of [100, 500, 1000, 2500, 5000]) if (s.totalCrystals >= n) this.unlock(`crystals_${n}`);
      if (c.deaths >= 10) this.unlock('deaths_10');
      let secrets = 0;
      for (const k in s.secrets) secrets += s.secrets[k];
      for (const n of [3, 10, 25, 50]) if (secrets >= n) this.unlock(`secrets_${n}`);
      let stars = 0;
      for (const k in s.stars) stars += s.stars[k];
      if (stars >= 50) this.unlock('stars_50');
      if (stars >= 144) this.unlock('stars_144');
      if (s.relics.length >= 12) this.unlock('relics_all');
      const ab = s.abilities;
      if (ab.doubleJump && ab.dash && ab.wallJump && ab.glide && ab.slam && ab.shot && ab.timeSlow) this.unlock('abilities_all');
      const up = s.upgrades;
      if (up.hp >= 4 || up.energy >= 4 || up.magnet >= 3) this.unlock('upgrade_max');
      const owned = s.outfitsOwned;
      if (['explorer', 'knight', 'ninja', 'robot', 'space', 'hunter'].every((o) => owned.includes(o))) this.unlock('outfits_all');
    },

    update(dt) {
      if (this.queue.length) {
        this.queue[0].t -= dt;
        if (this.queue[0].t <= 0) this.queue.shift();
      }
    },

    // شارة إنجاز منبثقة
    render(ctx) {
      if (!this.queue.length) return;
      const a = this.queue[0];
      const t = a.t;
      const slide = t > 3.6 ? (4 - t) / 0.4 : t < 0.4 ? t / 0.4 : 1;
      const y = -70 + slide * 86;
      const w = 380;
      const x = (RN.VW - w) / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(16,20,40,0.92)';
      RN.U.roundRect(ctx, x, y, w, 56, 12); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
      RN.U.roundRect(ctx, x, y, w, 56, 12); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🏆', x + 34, y + 28);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${13 * RN.Save.settings.textScale}px sans-serif`;
      ctx.fillText(RN.t('achievementUnlocked'), x + w / 2 + 15, y + 17);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${13 * RN.Save.settings.textScale}px sans-serif`;
      const name = RN.I18N.lang === 'ar' ? a.def.ar : a.def.en;
      ctx.fillText(name, x + w / 2 + 15, y + 38);
      ctx.restore();
    },
  };

  RN.Achievements = Achievements;
})();
