'use strict';
/* ============================================================
   Rayan & Naya — مشهد اللعب
   الكاميرا، الطقس، الموسيقى الديناميكية، نقاط الحفظ، النتائج،
   مواجهات الزعماء، النجوم، الأسرار، الذكريات
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  class LevelScene {
    constructor(wi, li) {
      this.wi = wi;
      this.li = li;
      this._entered = false;
    }

    enter() {
      if (this._entered) return; // عودة من مشهد ذكرى
      this._entered = true;
      this.level = new RN.Level(this.wi, this.li);
      this.player = new RN.Player(this.level.spawn.x, this.level.spawn.y);
      this.bg = new RN.Background(this.wi, (this.wi + 1) * 131 + this.li);
      this.weather = new RN.Weather(RN.C.WORLDS[this.wi].weather);
      this.particles = new RN.Particles();
      this.projectiles = [];
      this.enemies = this.level.enemies.map((e) => new RN.Enemy(e.type, e.x, e.y));
      this.boss = null;
      this.bossIntroT = 0;
      if (this.level.isBoss) {
        this.boss = new RN.Boss(this.wi, this.level.bossSpawn.x, this.level.bossSpawn.y);
        this.boss.groundY = this.level.groundY * 32;
        this.boss.y = this.boss.groundY - this.boss.h;
        this.bossIntroT = 3.0;
      }
      this.camX = 0; this.camY = 0;
      this.time = 0;
      this.crystals = 0;
      this.secretsFound = 0;
      this.checkpointX = this.level.spawn.x;
      this.checkpointY = this.level.spawn.y;
      this.safeX = this.level.spawn.x;
      this.safeY = this.level.spawn.y;
      this.playerStyle = { stomps: 0, slashes: 0 };
      this.windX = 0;
      this.darkVeil = this.wi === 5 && !this.level.isBoss ? 0.25 : 0;
      this.toasts = [];
      this.paused = false;
      this.finished = false;
      this.gameOver = false;
      this.results = null;
      this.abilityBanner = null;
      this.hazards = [];      // أعمدة نار وغيرها
      this.maxReachedX = 0;
      this._musicMode = '';
      this._combatT = 0;
      this._pendingRelic = null;
      // بداية رحلة عالم جديدة (لتتبع إنجاز "عالم دون موت")
      const sd = RN.Save.data;
      if (this.li === 0 && (!sd.worldRun || sd.worldRun.w !== this.wi)) {
        sd.worldRun = { w: this.wi, deaths: sd.statsCounters.deaths };
      }
      RN.Audio.setMusic(this.wi, this.level.isBoss ? 'boss' : 'explore');
    }

    /* ---------------- أدوات المشهد ---------------- */
    collectCrystal(n, x, y) {
      this.crystals += n;
      RN.Audio.sfx(n > 1 ? 'gem' : 'coin');
      this.particles.burst(x, y, 6, { color: '#4ae0d8', speed: 100, size: 2.5, life: 0.5, glow: true });
    }

    toast(text) { this.toasts.push({ text, t: 2.5 }); }

    setCheckpoint(x, y) {
      this.checkpointX = x;
      this.checkpointY = y;
      this.toast('✔ ' + RN.t('saved'));
    }

    foundRelic(relicId, x, y) {
      RN.Audio.sfx('memory');
      this.particles.burst(x, y, 24, { color: '#ffd700', speed: 180, size: 4, life: 1, glow: true });
      if (!RN.Save.data.relics.includes(relicId)) {
        RN.Save.data.relics.push(relicId);
        RN.Achievements.unlock(`relic_${relicId}`);
        RN.Save.auto();
        // عرض مشهد الذكرى ثم العودة
        const self = this;
        RN.Engine.setScene(new RN.Cine.MemoryScene(relicId, () => RN.Engine.setScene(self)));
      } else {
        this.collectCrystal(20, x, y);
      }
    }

    onSecretFound() {
      this.secretsFound++;
      RN.Audio.sfx('star');
      this.toast('✨ ' + RN.t('secretsFound') + '!');
    }

    shockwave(x, y, radius, dmg) {
      // موجة صدمة أرضية: تصيب من يلامس الأرض بالقرب
      this.particles.burst(x, y, 20, { color: '#e8d8b0', speed: 260, size: 4, life: 0.5, grav: 400 });
      const p = this.player;
      if (dmg === 1) { // من الزعيم
        if (p.onGround && Math.abs(p.x + p.w / 2 - x) < radius) p.hurt(this, 1, Math.sign(p.x - x) || 1);
      } else { // من اللاعب
        for (const e of this.enemies) {
          if (!e.dead && Math.abs(e.x + e.w / 2 - x) < radius && Math.abs(e.y + e.h - y) < 60) {
            e.hurt(this, 2, Math.sign(e.x - x) || 1, false);
          }
        }
        if (this.boss && !this.boss.dead && Math.abs(this.boss.x + this.boss.w / 2 - x) < radius + 40) {
          this.boss.hurt(this, 1);
        }
      }
    }

    firePillar(x, groundY, delay) {
      this.hazards.push({ kind: 'fire', x: x - 26, y: groundY - 180, w: 52, h: 180, t: 1.0, delay: delay || 0 });
    }

    lightningStrike(x, dmg) {
      RN.Audio.sfx('lightning');
      RN.Engine.doFlash('#fffde0', 0.4);
      this.hazards.push({ kind: 'bolt', x: x - 24, y: 0, w: 48, h: RN.VH * 2, t: 0.35, delay: 0 });
    }

    checkKillAchievements() { RN.Achievements.checkCounters(); }

    /* ---------------- التحديث ---------------- */
    update(dt, rawDt) {
      RN.Achievements.update(rawDt);
      // نقر إيقاف مؤقت
      if (RN.Input.justPressed('pause') && !this.results && !this.gameOver) {
        this.paused = !this.paused;
        RN.Audio.sfx('ui');
      }
      if (this.paused || this.results || this.gameOver) return;

      // مقدمة الزعيم السينمائية
      if (this.bossIntroT > 0) {
        this.bossIntroT -= rawDt;
        this.camX = U.clamp(this.boss.x + this.boss.w / 2 - RN.VW / 2, 0, this.level.w * 32 - RN.VW);
        this.camY = U.clamp(this.boss.y + this.boss.h / 2 - RN.VH / 2, -100, this.level.h * 32 - RN.VH);
        if (this.bossIntroT <= 2.5 && this.bossIntroT + rawDt > 2.5) RN.Audio.sfx('roar');
        return;
      }

      this.time += dt;
      this.player.update(this, dt);
      this.maxReachedX = Math.max(this.maxReachedX, this.player.x);

      for (const e of this.enemies) e.update(this, dt);
      if (this.boss) this.boss.update(this, dt);
      RN.Entities.update(this, dt);
      this.particles.update(dt);
      this.weather.update(rawDt);

      // رياح عالم السماء الدورية
      if (this.wi === 4 && !this.level.isBoss) {
        const gust = Math.sin(this.time * 0.5);
        this.windX = gust > 0.55 ? -140 : 0;
      }

      // بلاطات هشة تتفتت
      if (this.level._crumbling) {
        for (let i = this.level._crumbling.length - 1; i >= 0; i--) {
          const c = this.level._crumbling[i];
          c[2] -= dt;
          if (c[2] <= 0) {
            this.level.setTile(c[0], c[1], RN.C.T.EMPTY);
            RN.Audio.sfx('rockfall');
            this.particles.burst(c[0] * 32 + 16, c[1] * 32 + 8, 8, { color: RN.C.WORLDS[this.wi].ground, speed: 90, size: 3.5, life: 0.5, grav: 500 });
            this.level._crumbling.splice(i, 1);
          }
        }
      }

      // مخاطر مؤقتة (أعمدة نار/صواعق)
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        if (h.delay > 0) { h.delay -= dt; continue; }
        h.t -= dt;
        if (h.t <= 0) { this.hazards.splice(i, 1); continue; }
        if (U.aabb(h, this.player.box())) this.player.hurt(this, h.kind === 'bolt' ? 2 : 1, this.player.facing * -1);
      }

      // الموسيقى الديناميكية: قتال عند قرب الأعداء
      if (!this.level.isBoss) {
        let combat = false;
        const px = this.player.x;
        for (const e of this.enemies) {
          if (!e.dead && Math.abs(e.x - px) < 300) { combat = true; break; }
        }
        this._combatT = combat ? 2 : Math.max(0, this._combatT - dt);
        const mode = this._combatT > 0 ? 'combat' : 'explore';
        if (mode !== this._musicMode) {
          this._musicMode = mode;
          RN.Audio.setMusic(this.wi, mode);
        }
      }

      // الكاميرا
      const p = this.player;
      const targetX = p.x + p.w / 2 - RN.VW / 2 + p.facing * 50;
      const targetY = p.y + p.h / 2 - RN.VH / 2 - 30;
      this.camX = U.lerp(this.camX, U.clamp(targetX, 0, Math.max(0, this.level.w * 32 - RN.VW)), 1 - Math.pow(0.001, dt));
      this.camY = U.lerp(this.camY, U.clamp(targetY, -120, this.level.h * 32 - RN.VH + 40), 1 - Math.pow(0.002, dt));

      // إحصاء وقت اللعب
      RN.Save.data.playTime += rawDt;

      // إسقاط تنبيهات منتهية
      for (let i = this.toasts.length - 1; i >= 0; i--) {
        this.toasts[i].t -= rawDt;
        if (this.toasts[i].t <= 0) this.toasts.splice(i, 1);
      }
      if (this.abilityBanner) {
        this.abilityBanner.t -= rawDt;
        if (this.abilityBanner.t <= 0) this.abilityBanner = null;
      }
    }

    /* ---------------- أحداث النهاية ---------------- */
    completeLevel() {
      if (this.finished) return;
      this.finished = true;
      RN.Engine.slowmo = 1;
      RN.Audio.sfx('star');
      RN.Audio.setMusic(this.wi, 'cine');
      this.player.victory = true;

      const sd = RN.Save.data;
      const key = RN.Save.starKey(this.wi, this.li);
      // حساب النجوم: الوقت + الكريستالات + الضربات
      const par = 40 + this.level.w * 0.28;
      let stars = 1;
      const crysFrac = this.level.crystalTotal > 0 ? this.crystals / this.level.crystalTotal : 1;
      if (crysFrac >= 0.6 || this.secretsFound >= this.level.secretTotal && this.level.secretTotal > 0) stars++;
      if (this.player.hitsTaken <= 2 && this.time <= par) stars++;

      sd.stars[key] = Math.max(sd.stars[key] || 0, stars);
      sd.bestTimes[key] = Math.min(sd.bestTimes[key] || 9999, this.time);
      sd.secrets[key] = Math.max(sd.secrets[key] || 0, this.secretsFound);
      sd.crystals += this.crystals;
      sd.totalCrystals += this.crystals;

      // فتح التالي
      if (this.li + 1 < RN.C.LEVELS_PER_WORLD) {
        if (this.wi === sd.world && this.li + 1 > sd.level) sd.level = this.li + 1;
      }

      // إنجازات
      RN.Achievements.unlock('first_level');
      if (stars === 3) RN.Achievements.unlock(`star3_${this.wi}_${this.li}`);
      if (this.time < 60) RN.Achievements.unlock('speed_60');
      if (this.time < 45) RN.Achievements.unlock('speed_45');
      if (this.time < 30) RN.Achievements.unlock('speed_30');
      if (this.crystals === 0) RN.Achievements.unlock('no_crystal_level');
      if (this.level.crystalTotal > 0 && this.crystals >= this.level.crystalTotal) RN.Achievements.unlock('all_crystal_level');
      RN.Achievements.checkCounters();
      RN.Save.commit(false);

      this.results = { stars, t: 0 };
    }

    onBossDefeated() {
      if (this.finished) return;
      this.finished = true;
      RN.Engine.slowmo = 1;
      const sd = RN.Save.data;
      this.player.victory = true;
      RN.Audio.setMusic(this.wi, 'cine');

      const key = RN.Save.starKey(this.wi, this.li);
      let stars = 1;
      if (this.player.hitsTaken <= 4) stars++;
      if (this.player.hitsTaken === 0) stars++;
      sd.stars[key] = Math.max(sd.stars[key] || 0, stars);
      sd.crystals += this.crystals + 50;
      sd.totalCrystals += this.crystals + 50;

      if (this.player.hitsTaken === 0) RN.Achievements.unlock(`bossnohit_${this.wi}`);
      RN.Achievements.unlock(`world_${this.wi}`);
      // عالم دون موت: تُقارن الوفيات منذ بدء رحلة هذا العالم
      const wr = sd.worldRun;
      if (wr && wr.w === this.wi && sd.statsCounters.deaths === wr.deaths) {
        RN.Achievements.unlock(`nodeath_${this.wi}`);
      }

      // فتح قدرة جديدة
      const ab = RN.C.ABILITY_UNLOCKS[this.wi];
      if (ab && !sd.abilities[ab]) {
        sd.abilities[ab] = true;
        this.abilityBanner = { ab, t: 5 };
        RN.Audio.sfx('ability');
      }
      // فتح العالم التالي
      if (this.wi + 1 < RN.C.WORLD_COUNT && sd.world <= this.wi) {
        sd.world = this.wi + 1;
        sd.level = 0;
      }
      if (this.wi === 5) {
        sd.finished = true;
        RN.Achievements.unlock('game_done');
        if (RN.Save.settings.difficulty === 3) RN.Achievements.unlock('nightmare_done');
      }
      RN.Achievements.checkCounters();
      RN.Save.commit(false);
      this.results = { stars, t: 0, boss: true };
    }

    onPlayerDeath() {
      RN.Engine.slowmo = 1;
      const diff = RN.C.DIFFICULTY[RN.Save.settings.difficulty];
      this.gameOver = true;
      this._retryFromCheckpoint = diff.checkpoints;
      RN.Audio.setMusic(this.wi, 'cine');
    }

    _respawn() {
      this.gameOver = false;
      const p = this.player;
      p.dead = false;
      p.hp = p.maxHp;
      p.energy = p.maxEnergy;
      p.invuln = 2;
      p.vx = 0; p.vy = 0;
      if (this._retryFromCheckpoint) {
        p.x = this.checkpointX; p.y = this.checkpointY;
      } else {
        // كابوس: من البداية
        this._entered = false;
        this.enter();
        return;
      }
      if (this.boss) { // إعادة مواجهة الزعيم
        this._entered = false;
        this.enter();
        return;
      }
      RN.Audio.setMusic(this.wi, 'explore');
    }

    _exitToMap() {
      RN.Engine.slowmo = 1;
      RN.Save.commit(false);
      RN.Engine.setScene(new RN.Scenes.WorldMapScene(this.wi));
    }

    _next() {
      RN.Engine.slowmo = 1;
      if (this.results && this.results.boss) {
        // مشهد سينمائي: سجن نايا التالي أو النهاية
        if (this.wi < 5) {
          const nextW = this.wi + 1;
          RN.Engine.setScene(new RN.Cine.PrisonScene(nextW, () => {
            RN.Engine.setScene(new RN.Scenes.WorldMapScene(nextW));
          }));
        } else {
          RN.Engine.setScene(new RN.Cine.FinaleScene(() => {
            RN.Engine.setScene(new RN.Scenes.MenuScene());
          }));
        }
      } else if (this.li + 1 < RN.C.LEVELS_PER_WORLD) {
        RN.Engine.setScene(new LevelScene(this.wi, this.li + 1));
      } else {
        this._exitToMap();
      }
    }

    /* ---------------- الرسم ---------------- */
    render(ctx) {
      const time = RN.Engine.time;
      this.bg.render(ctx, this.camX, this.camY, time);
      this.level.renderTiles(ctx, this.camX, this.camY, time);
      RN.Entities.render(this, ctx, this.camX, this.camY, time);
      for (const e of this.enemies) e.render(ctx, this.camX, this.camY, time);
      if (this.boss) this.boss.render(ctx, this.camX, this.camY, time);
      this.player.render(ctx, this.camX, this.camY);
      this.particles.render(ctx, this.camX, this.camY);

      // مخاطر
      for (const h of this.hazards) {
        if (h.delay > 0) continue;
        const hx = h.x - this.camX, hy = h.y - this.camY;
        if (h.kind === 'fire') {
          const fl = Math.sin(time * 20) * 4;
          const g = ctx.createLinearGradient(0, hy, 0, hy + h.h);
          g.addColorStop(0, 'rgba(255,220,80,0.2)');
          g.addColorStop(1, 'rgba(255,110,30,0.95)');
          ctx.fillStyle = g;
          ctx.fillRect(hx - fl / 2, hy, h.w + fl, h.h);
          ctx.fillStyle = 'rgba(255,240,150,0.8)';
          ctx.fillRect(hx + h.w / 4, hy + 30, h.w / 2, h.h - 30);
        } else {
          ctx.fillStyle = `rgba(255,240,150,${h.t * 2.4})`;
          ctx.fillRect(hx, 0, h.w, RN.VH);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
          ctx.beginPath();
          let lx = hx + h.w / 2, ly = 0;
          while (ly < RN.VH) { lx += U.rand(-18, 18); ly += 40; ctx.lineTo(lx, ly); }
          ctx.stroke();
        }
      }

      // الطقس (فضاء الشاشة)
      this.weather.render(ctx);

      // حجاب الظلام (العالم المظلم)
      if (this.darkVeil > 0) {
        const px = this.player.x + this.player.w / 2 - this.camX;
        const py = this.player.y + this.player.h / 2 - this.camY;
        const rg = ctx.createRadialGradient(px, py, 90, px, py, 380);
        rg.addColorStop(0, 'rgba(6,4,16,0)');
        rg.addColorStop(1, `rgba(6,4,16,${this.darkVeil + 0.35})`);
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, RN.VW, RN.VH);
      }

      RN.HUD.render(ctx, this);

      // تنبيهات
      let ty = 100;
      for (const t of this.toasts) {
        ctx.globalAlpha = Math.min(1, t.t);
        ctx.fillStyle = 'rgba(12,16,34,0.85)';
        ctx.font = `bold ${RN.UI.fontPx(15)}px sans-serif`;
        const tw = ctx.measureText(t.text).width + 30;
        U.roundRect(ctx, (RN.VW - tw) / 2, ty, tw, 32, 8); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.text, RN.VW / 2, ty + 17);
        ctx.globalAlpha = 1;
        ty += 40;
      }

      // زر الإيقاف
      this._pauseBtn = { x: RN.VW - 46, y: 78, w: 34, h: 34 };
      ctx.fillStyle = 'rgba(12,16,34,0.6)';
      U.roundRect(ctx, this._pauseBtn.x, this._pauseBtn.y, 34, 34, 8); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this._pauseBtn.x + 10, this._pauseBtn.y + 9, 5, 16);
      ctx.fillRect(this._pauseBtn.x + 20, this._pauseBtn.y + 9, 5, 16);

      // مقدمة الزعيم
      if (this.bossIntroT > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, RN.VW, 60);
        ctx.fillRect(0, RN.VH - 60, RN.VW, 60);
        const a = Math.min(1, (3 - this.bossIntroT) * 1.5);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ff5a5a';
        ctx.font = `bold ${RN.UI.fontPx(38)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(RN.t('bosses')[this.wi], RN.VW / 2, RN.VH / 2 - 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${RN.UI.fontPx(20)}px sans-serif`;
        ctx.fillText(RN.t('bossIntro'), RN.VW / 2, RN.VH / 2 + 10);
        ctx.globalAlpha = 1;
      }

      // شارة قدرة جديدة
      if (this.abilityBanner) {
        const ab = this.abilityBanner;
        const slide = ab.t > 4.5 ? (5 - ab.t) * 2 : ab.t < 0.5 ? ab.t * 2 : 1;
        ctx.globalAlpha = slide;
        RN.UI.panel(ctx, RN.VW / 2 - 200, RN.VH / 2 - 150, 400, 110);
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${RN.UI.fontPx(22)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⭐ ' + RN.t('newAbility'), RN.VW / 2, RN.VH / 2 - 118);
        ctx.fillStyle = '#7ad8ff';
        ctx.font = `bold ${RN.UI.fontPx(19)}px sans-serif`;
        ctx.fillText(RN.t('abilities')[ab.ab] || ab.ab, RN.VW / 2, RN.VH / 2 - 88);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${RN.UI.fontPx(14)}px sans-serif`;
        ctx.fillText(RN.t('abilityHints')[ab.ab] || '', RN.VW / 2, RN.VH / 2 - 60);
        ctx.globalAlpha = 1;
      }

      RN.Achievements.render(ctx);

      // ---- شاشات فوقية ----
      if (this.paused) this._renderPause(ctx);
      if (this.results) this._renderResults(ctx);
      if (this.gameOver) this._renderGameOver(ctx);
    }

    _renderPause(ctx) {
      ctx.fillStyle = 'rgba(4,6,16,0.75)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      RN.UI.panel(ctx, RN.VW / 2 - 160, 90, 320, 350, RN.t('paused'));
      this._pauseButtons = [
        { x: RN.VW / 2 - 120, y: 150, w: 240, h: 48, label: RN.t('resume'), primary: true, act: 'resume' },
        { x: RN.VW / 2 - 120, y: 210, w: 240, h: 48, label: RN.t('restart'), act: 'restart' },
        { x: RN.VW / 2 - 120, y: 270, w: 240, h: 48, label: RN.t('manualSave'), act: 'save' },
        { x: RN.VW / 2 - 120, y: 330, w: 240, h: 48, label: RN.t('quitToMap'), act: 'map' },
      ];
      for (const b of this._pauseButtons) RN.UI.button(ctx, b);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `${RN.UI.fontPx(11)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(RN.t('keyHint'), RN.VW / 2, 412);
    }

    _renderResults(ctx) {
      const r = this.results;
      r.t += 1 / 60;
      ctx.fillStyle = 'rgba(4,6,16,0.7)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      RN.UI.panel(ctx, RN.VW / 2 - 210, 60, 420, 400, r.boss ? RN.t('worldClear') : RN.t('results'));
      // نجوم متتابعة الظهور
      for (let i = 0; i < 3; i++) {
        const shown = r.t > 0.4 + i * 0.45 && i < r.stars;
        if (r.t > 0.4 + i * 0.45 && i < r.stars && r.t - 1 / 60 <= 0.4 + i * 0.45) RN.Audio.sfx('star');
        RN.UI.star(ctx, RN.VW / 2 + (i - 1) * 70, 145, shown ? 30 : 24, shown);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = `${RN.UI.fontPx(16)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rows = [
        [RN.t('time'), U.formatTime(this.time)],
        [RN.t('crystals'), `${this.crystals} / ${this.level.crystalTotal}`],
        [RN.t('damage'), String(this.player.hitsTaken)],
        [RN.t('secretsFound'), `${this.secretsFound} / ${this.level.secretTotal}`],
      ];
      let ry = 205;
      for (const [k, v] of rows) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = RN.I18N.isRTL() ? 'right' : 'left';
        ctx.fillText(k, RN.I18N.isRTL() ? RN.VW / 2 + 150 : RN.VW / 2 - 150, ry);
        ctx.fillStyle = '#7ad8ff';
        ctx.textAlign = RN.I18N.isRTL() ? 'left' : 'right';
        ctx.fillText(v, RN.I18N.isRTL() ? RN.VW / 2 - 150 : RN.VW / 2 + 150, ry);
        ry += 34;
      }
      this._resultButtons = [
        { x: RN.VW / 2 - 180, y: 360, w: 170, h: 50, label: r.boss ? RN.t('continue') : RN.t('nextLevel'), primary: true, act: 'next' },
        { x: RN.VW / 2 + 10, y: 360, w: 170, h: 50, label: RN.t('replay'), act: 'replay' },
      ];
      for (const b of this._resultButtons) RN.UI.button(ctx, b);
    }

    _renderGameOver(ctx) {
      ctx.fillStyle = 'rgba(20,4,10,0.8)';
      ctx.fillRect(0, 0, RN.VW, RN.VH);
      ctx.fillStyle = '#ff5a6a';
      ctx.font = `bold ${RN.UI.fontPx(40)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(RN.t('gameOver'), RN.VW / 2, RN.VH / 2 - 80);
      this._goButtons = [
        { x: RN.VW / 2 - 130, y: RN.VH / 2 - 10, w: 260, h: 52, label: RN.t('tryAgain'), primary: true, act: 'retry' },
        { x: RN.VW / 2 - 130, y: RN.VH / 2 + 55, w: 260, h: 52, label: RN.t('quitToMap'), act: 'map' },
      ];
      for (const b of this._goButtons) RN.UI.button(ctx, b);
    }

    /* ---------------- النقر ---------------- */
    onClick(x, y) {
      if (this.paused && this._pauseButtons) {
        for (const b of this._pauseButtons) {
          if (RN.UI.hit(b, x, y)) {
            RN.Audio.sfx('ui');
            if (b.act === 'resume') this.paused = false;
            if (b.act === 'restart') { this._entered = false; this.enter(); }
            if (b.act === 'save') { RN.Save.commit(true); this.paused = false; this.toast(RN.t('saved')); }
            if (b.act === 'map') this._exitToMap();
            return;
          }
        }
        return;
      }
      if (this.results && this._resultButtons) {
        for (const b of this._resultButtons) {
          if (RN.UI.hit(b, x, y)) {
            RN.Audio.sfx('ui');
            if (b.act === 'next') this._next();
            if (b.act === 'replay') { this._entered = false; this.enter(); }
            return;
          }
        }
        return;
      }
      if (this.gameOver && this._goButtons) {
        for (const b of this._goButtons) {
          if (RN.UI.hit(b, x, y)) {
            RN.Audio.sfx('ui');
            if (b.act === 'retry') this._respawn();
            if (b.act === 'map') this._exitToMap();
            return;
          }
        }
        return;
      }
      if (this._pauseBtn && RN.UI.hit(this._pauseBtn, x, y)) {
        this.paused = true;
        RN.Audio.sfx('ui');
      }
    }
  }

  RN.LevelScene = LevelScene;
})();
