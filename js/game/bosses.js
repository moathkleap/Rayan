'use strict';
/* ============================================================
   Rayan & Naya — الزعماء
   7 زعماء أصليون، لكل منهم 3 أطوار قتال، نوافذ ضعف مختلفة،
   هجمات مُنذَرة (Telegraphed)، ومؤثرات خاصة
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  // طبقات ذيل المذنّب (ثابتة — خارج مسار الرسم لكل إطار)
  const COMET_TAILS = [['rgba(120,200,255,0.35)', 0], ['rgba(255,230,150,0.3)', 1], ['rgba(255,255,255,0.22)', 2]];

  const BOSS_DEFS = [
    { id: 'spider', hp: 26, w: 110, h: 70, color: '#5a3a7a', touchDmg: 2 },
    { id: 'sandKing', hp: 30, w: 90, h: 110, color: '#c89a4a', touchDmg: 2 },
    { id: 'iceDragon', hp: 34, w: 130, h: 80, color: '#7ab0d8', touchDmg: 2 },
    { id: 'lavaBeast', hp: 38, w: 110, h: 100, color: '#c04a24', touchDmg: 2 },
    { id: 'skyWarden', hp: 40, w: 80, h: 110, color: '#5a8ad8', touchDmg: 2 },
    { id: 'cometTitan', hp: 44, w: 100, h: 90, color: '#6a8ad8', touchDmg: 2 },
    { id: 'shadowKing', hp: 50, w: 90, h: 120, color: '#3a2a6a', touchDmg: 2 },
  ];

  // الهجمات التي تفتح نافذة الضعف لكل زعيم (إجهاد أو انكشاف). تُستخدم لتنعيم
  // الإيقاع: إن مرّت عدة دورات دون اختيار أحدها عشوائيًا، يُفرَض ظهوره — كي
  // لا يطول أمد المعركة بلا فرصة لإلحاق ضرر كامل.
  const VULN_ATTACKS = {
    spider: ['lunge', 'ceiling'],
    sandKing: ['whirl'],
    iceDragon: ['breath', 'sweep'],
    lavaBeast: ['erupt'],
    skyWarden: ['dive'],
    cometTitan: ['crash'],
    shadowKing: ['barrage'],
  };
  const MAX_DRY_PICKS = 3; // بعد 3 اختيارات دون نافذة ضعف، يُفرَض هجوم نافذة الضعف

  class Boss {
    constructor(wi, x, y) {
      const def = BOSS_DEFS[wi];
      this.wi = wi;
      this.def = def;
      this.x = x; this.y = y - def.h;
      this.w = def.w; this.h = def.h;
      this.vx = 0; this.vy = 0;
      const diff = RN.C.DIFFICULTY[RN.Save.settings.difficulty];
      this.maxHp = Math.round(def.hp * diff.bossHp);
      this.hp = this.maxHp;
      this.dead = false;
      this.dying = 0;
      this.state = 'intro';
      this.timer = 2.0;
      this.vulnerable = false;
      this.stun = 0;
      this.flash = 0;
      this.dir = -1;
      this.animT = 0;
      this.groundY = y;
      this.tookHitThisFight = false;
      this._telegraph = null; // {x,y,w,h,t,kind}
    }

    get phase() {
      if (this.hp > this.maxHp * 2 / 3) return 1;
      if (this.hp > this.maxHp / 3) return 2;
      return 3;
    }

    hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

    hurt(scene, dmg) {
      if (this.dead || this.state === 'intro') return;
      if (!this.vulnerable) {
        RN.Audio.sfx('hit');
        scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 5, { color: '#c0c0d0', speed: 90, size: 2, life: 0.3 });
        // ضرر مخفف عند عدم وجود نافذة ضعف
        if (Math.random() > 0.35) return;
        dmg = 1;
      }
      this.hp -= dmg;
      this.flash = 0.18;
      this.tookHitThisFight = true;
      RN.Audio.sfx('bossHit');
      RN.Engine.doShake(4);
      scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 12, { color: this.def.color, speed: 160, size: 4, life: 0.5 });
      if (this.hp <= 0) {
        this.dead = true;
        this.dying = 2.5;
        RN.Audio.sfx('explosion');
        RN.Engine.doShake(12);
        RN.Engine.doFlash('#ffffff', 0.7);
      }
    }

    update(scene, dt) {
      this.animT += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.dead) {
        this.dying -= dt;
        if (Math.random() < 0.3) {
          scene.particles.burst(this.x + U.rand(0, this.w), this.y + U.rand(0, this.h), 8,
            { color: U.pick(['#ffd24a', '#ff8a3a', '#ffffff']), speed: 150, size: 4, life: 0.7, glow: true });
        }
        if (this.dying <= 0) scene.onBossDefeated();
        return;
      }
      const p = scene.player;
      const px = p.x + p.w / 2;
      const cx = this.x + this.w / 2;
      this.dir = px > cx ? 1 : -1;
      this.timer -= dt;
      if (this.stun > 0) {
        this.stun -= dt;
        this.vulnerable = true;
        if (this.stun <= 0) { this.vulnerable = false; this.state = 'move'; this.timer = 0.6; }
      } else {
        this['_' + this.def.id](scene, dt, px);
      }
      // ضرر التلامس
      if (!p.dead && U.aabb(this.hitbox(), p.box())) {
        p.hurt(scene, this.def.touchDmg, Math.sign(px - cx) || 1);
      }
    }

    _walkTo(tx, speed, dt) {
      const cx = this.x + this.w / 2;
      if (Math.abs(tx - cx) < 12) return true;
      this.x += Math.sign(tx - cx) * speed * dt;
      return false;
    }

    // اختيار الهجمة التالية مع ضمان ألا تتأخّر نافذة الضعف كثيرًا: تُحتسب
    // الاختيارات المتتالية التي لا تفتح نافذة ضعف، فإن بلغت الحدّ يُفرَض
    // اختيار هجمة نافذة الضعف المتاحة في هذا الطور (إن وُجدت).
    _pickAttack(opts) {
      const vuln = VULN_ATTACKS[this.def.id] || [];
      this._dryPicks = (this._dryPicks || 0) + 1;
      let pool = opts;
      if (this._dryPicks >= MAX_DRY_PICKS) {
        const forced = opts.filter((o) => vuln.includes(o));
        if (forced.length) pool = forced;
      }
      const s = U.pick(pool);
      if (vuln.includes(s)) this._dryPicks = 0;
      return s;
    }

    // انقضاض نحو اللاعب حتى ملامسة الأرض ثم إجهاد (نافذة ضعف). يعيد true عند الارتطام.
    _diveToward(dt, px, speed, shake, stunTime) {
      const ang = Math.atan2((this.groundY - this.h) - this.y, px - this.x);
      this.x += Math.cos(ang) * speed * dt;
      this.y += Math.sin(ang) * speed * dt;
      if (this.y >= this.groundY - this.h - 6) {
        this.y = this.groundY - this.h;
        RN.Engine.doShake(shake); RN.Audio.sfx('slam');
        this.stun = stunTime;
        return true;
      }
      return false;
    }

    _spawnMinion(scene, type, x) {
      const alive = scene.enemies.filter((e) => !e.dead).length;
      if (alive < 3) {
        const e = new RN.Enemy(type, x, this.groundY - 80);
        scene.enemies.push(e);
        scene.particles.burst(x, this.groundY - 40, 12, { color: '#8a5aff', speed: 130, size: 3, life: 0.5, glow: true });
      }
    }

    /* ========== عنكبوت الغابة العملاق ========== */
    _spider(scene, dt, px) {
      const ph = this.phase;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'move'; this.timer = 1.4; } break;
        case 'move':
          this._walkTo(px, 60 + ph * 22, dt);
          if (this.timer <= 0) {
            const opts = ph >= 3 ? ['lunge', 'web', 'ceiling'] : ph === 2 ? ['lunge', 'web'] : ['lunge'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'lunge' ? 0.7 : this.state === 'web' ? 1.2 : 1.0;
            if (this.state === 'lunge') this._lungeDir = this.dir;
          }
          break;
        case 'lunge': // انقضاض ثم إجهاد (نافذة ضعف)
          if (this.timer > 0.35) { /* تحفّز */ }
          else {
            this.x += this._lungeDir * 480 * dt;
          }
          if (this.timer <= 0) { this.stun = 1.6; RN.Audio.sfx('roar'); }
          break;
        case 'web': { // قذف شباك تُبطئ
          if (this.timer <= 0) {
            for (let i = -1; i <= 1; i++) {
              scene.projectiles.push(new RN.Projectile(this.x + this.w / 2, this.y + 20, i * 120 + this.dir * 180, -260, false, 'web', 1));
            }
            RN.Audio.sfx('shot');
            this.state = 'move'; this.timer = 1.6 - ph * 0.2;
          }
          break;
        }
        case 'ceiling': { // يقفز عاليًا ثم يسقط فوق اللاعب بموجة صدمة
          if (!this._cState) { this._cState = 'up'; this.vy = -1000; }
          if (this._cState === 'up') {
            this.y += this.vy * dt; this.vy += 900 * dt;
            this.x = U.lerp(this.x, px - this.w / 2, dt * 2);
            // ينتقل للتحويم عند بلوغ القمة (vy >= 0) — أو الوصول لأعلى الساحة —
            // أيهما أسبق. بدون فحص القمة كانت القفزة لا تبلغ y<60 أبدًا فيسقط
            // العنكبوت خلال الأرض ولا يعود، فتتعذّر مواصلة المعركة (طور 3).
            if (this.vy >= 0 || this.y < 60) { this._cState = 'hover'; this.timer = 0.8; }
          } else if (this._cState === 'hover') {
            this.x = U.lerp(this.x, px - this.w / 2, dt * 4);
            if (this.timer <= 0) { this._cState = 'drop'; this.vy = 100; }
          } else if (this._cState === 'drop') {
            this.vy += 2600 * dt; this.y += this.vy * dt;
            if (this.y + this.h >= this.groundY) {
              this.y = this.groundY - this.h;
              this._cState = null;
              RN.Engine.doShake(10); RN.Audio.sfx('slam');
              scene.shockwave(this.x + this.w / 2, this.groundY, 260, 1);
              this.stun = 2.0;
            }
          }
          break;
        }
      }
      // عودة للأرض إن لم يكن في وضع السقف
      if (this.state !== 'ceiling' && this.y + this.h < this.groundY) {
        this.y = Math.min(this.y + 500 * dt, this.groundY - this.h);
      }
    }

    /* ========== ملك الرمال ========== */
    _sandKing(scene, dt, px) {
      const ph = this.phase;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'move'; this.timer = 1.2; } break;
        case 'move':
          this._walkTo(px + (px > this.x ? -140 : 140), 55, dt);
          if (this.timer <= 0) {
            const opts = ph >= 3 ? ['wave', 'whirl', 'summon', 'wave'] : ph === 2 ? ['wave', 'whirl', 'summon'] : ['wave', 'whirl'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'wave' ? 0.8 : this.state === 'summon' ? 1.0 : 1.1;
          }
          break;
        case 'wave': // موجة رمل زاحفة
          if (this.timer <= 0) {
            for (let k = 0; k < ph; k++) {
              setTimeout(() => { }, 0);
              scene.projectiles.push(new RN.Projectile(this.x + this.w / 2, this.groundY - 16, this.dir * (240 + k * 60), 0, false, 'sand', 1));
            }
            RN.Audio.sfx('wind');
            this.state = 'move'; this.timer = 1.7 - ph * 0.25;
          }
          break;
        case 'summon':
          if (this.timer <= 0) {
            this._spawnMinion(scene, 'scorpion', this.x + this.w / 2 + U.rand(-150, 150));
            this.state = 'move'; this.timer = 2.0;
          }
          break;
        case 'whirl': // إعصار اندفاع عبر الساحة ثم تعب
          this._whirlT = (this._whirlT || 0) + dt;
          this.x += this.dir * 300 * dt;
          scene.particles.spawn({ x: this.x + U.rand(0, this.w), y: this.y + U.rand(0, this.h), vx: U.rand(-50, 50), vy: U.rand(-120, -40), color: '#e0c070', size: 4, life: 0.6 });
          if (this._whirlT > 1.4) {
            this._whirlT = 0;
            this.stun = 2.2; // متعب — نافذة الضعف
          }
          break;
      }
      this.x = U.clamp(this.x, 80, scene.level.w * 32 - 80 - this.w);
    }

    /* ========== التنين الجليدي ========== */
    _iceDragon(scene, dt, px) {
      const ph = this.phase;
      const hoverY = this.groundY - 260;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'fly'; this.timer = 1.6; } break;
        case 'move': // بعد انتهاء نافذة الضعف (إجهاد الانقضاض) يعود للتحليق.
        // بدون هذه الحالة كان التنين يعلَق بلا حراك بعد الـ sweep إذ يفرض
        // المحرّك state='move' عند انتهاء الإجهاد فلا يجد معالِجًا — قتال معطوب.
        case 'fly': // يحلق ذهابًا وإيابًا
          this.y = U.lerp(this.y, hoverY + Math.sin(this.animT * 2) * 30, dt * 3);
          this.x += Math.sin(this.animT * 0.9) * 120 * dt;
          if (this.timer <= 0) {
            const opts = ph >= 3 ? ['breath', 'rain', 'sweep'] : ph === 2 ? ['breath', 'rain'] : ['breath', 'sweep'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'breath' ? 1.0 : this.state === 'rain' ? 0.8 : 0.6;
          }
          break;
        case 'breath': // يهبط ويطلق نفَسًا جليديًا — صدره يتوهج (نافذة ضعف)
          this.y = U.lerp(this.y, this.groundY - this.h, dt * 4);
          if (this.timer <= 0 && !this._breathing) {
            this._breathing = 1.6;
            RN.Audio.sfx('freeze');
          }
          if (this._breathing) {
            this._breathing -= dt;
            this.vulnerable = true;
            if (Math.random() < 0.6) {
              scene.projectiles.push(new RN.Projectile(
                this.x + (this.dir > 0 ? this.w : 0), this.y + 30,
                this.dir * U.rand(220, 330), U.rand(-40, 60), false, 'ice', 1));
            }
            if (this._breathing <= 0) {
              this._breathing = null;
              this.vulnerable = false;
              this.state = 'fly'; this.timer = 1.8 - ph * 0.25;
            }
          }
          break;
        case 'rain': // وابل كتل جليدية من الأعلى
          if (this.timer <= 0) {
            for (let i = 0; i < 3 + ph; i++) {
              scene.projectiles.push(new RN.Projectile(px + U.rand(-200, 200), this.groundY - 420, 0, U.rand(150, 260), false, 'ice', 1));
            }
            RN.Audio.sfx('freeze');
            this.state = 'fly'; this.timer = 1.6;
          }
          break;
        case 'sweep': // انقضاض كاسح منخفض
          this.y = U.lerp(this.y, this.groundY - this.h - 10, dt * 5);
          this.x += this.dir * 380 * dt;
          if (this.timer <= 0) { this.state = 'fly'; this.timer = 1.5; this.stun = 1.2; }
          break;
      }
      this.x = U.clamp(this.x, 80, scene.level.w * 32 - 80 - this.w);
    }

    /* ========== وحش الحمم ========== */
    _lavaBeast(scene, dt, px) {
      const ph = this.phase;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'move'; this.timer = 1.2; } break;
        case 'move':
          this._walkTo(px + (px > this.x ? -160 : 160), 45, dt);
          this.cooled = false;
          if (this.timer <= 0) {
            const opts = ph >= 3 ? ['lob', 'erupt', 'rocks'] : ph === 2 ? ['lob', 'erupt'] : ['lob', 'erupt'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'lob' ? 0.7 : this.state === 'erupt' ? 1.1 : 0.9;
            if (this.state === 'erupt') {
              // تحذير مرئي لمواقع الانفجار
              this._eruptXs = [];
              for (let i = 0; i < 2 + ph; i++) this._eruptXs.push(px + U.rand(-220, 220));
              this._telegraph = { xs: this._eruptXs, t: this.timer, kind: 'erupt' };
            }
          }
          break;
        case 'lob': // قذائف حمم بقوس
          if (this.timer <= 0) {
            for (let i = 0; i < 2 + ph; i++) {
              scene.projectiles.push(new RN.Projectile(this.x + this.w / 2, this.y + 20,
                this.dir * U.rand(120, 320), U.rand(-580, -420), false, 'magma', 1));
            }
            RN.Audio.sfx('fire');
            this.state = 'move'; this.timer = 1.6 - ph * 0.2;
          }
          break;
        case 'erupt': // أعمدة نار من الأرض ثم يبرد (نافذة ضعف)
          if (this.timer <= 0) {
            for (const ex of this._eruptXs) {
              scene.firePillar(ex, this.groundY, 1.0);
            }
            this._telegraph = null;
            RN.Audio.sfx('explosion');
            RN.Engine.doShake(6);
            this.cooled = true; // يتحول لصخر رمادي
            this.stun = 2.4;
          }
          break;
        case 'rocks': // صخور متساقطة
          if (this.timer <= 0) {
            for (let i = 0; i < 4 + ph; i++) {
              scene.projectiles.push(new RN.Projectile(U.rand(120, scene.level.w * 32 - 120), this.groundY - 460, 0, U.rand(120, 200), false, 'rock', 2));
            }
            RN.Audio.sfx('rockfall');
            this.state = 'move'; this.timer = 1.8;
          }
          break;
      }
    }

    /* ========== حارس السماء ========== */
    _skyWarden(scene, dt, px) {
      const ph = this.phase;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'tele'; this.timer = 0.9; } break;
        case 'move': // بعد انتهاء نافذة الضعف يعود للتنقل
        case 'tele': // ينتقل بين مواضع عالية
          if (this.timer <= 0) {
            scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 16, { color: '#8ad8ff', speed: 160, size: 3, life: 0.5, glow: true });
            this.x = U.clamp(px + U.rand(-260, 260), 90, scene.level.w * 32 - 90 - this.w);
            this.y = this.groundY - U.rand(200, 300);
            scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 16, { color: '#8ad8ff', speed: 160, size: 3, life: 0.5, glow: true });
            const opts = ph >= 3 ? ['bolt', 'gust', 'dive', 'bolt'] : ph === 2 ? ['bolt', 'gust', 'dive'] : ['bolt', 'dive'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'bolt' ? 1.0 : this.state === 'gust' ? 1.8 : 0.8;
            if (this.state === 'bolt') this._boltX = px;
          }
          break;
        case 'bolt': // صاعقة على موضع اللاعب (مُنذرة)
          this._telegraph = { xs: [this._boltX], t: this.timer, kind: 'bolt' };
          if (this.timer <= 0) {
            scene.lightningStrike(this._boltX, 1 + (ph > 2 ? 1 : 0));
            this._telegraph = null;
            if (ph >= 2 && Math.random() < 0.5) { this._boltX = px; this.state = 'bolt'; this.timer = 0.8; }
            else { this.state = 'tele'; this.timer = 1.2 - ph * 0.15; }
          }
          break;
        case 'gust': // رياح دافعة
          scene.windX = this.dir * -260;
          scene.particles.spawn({ x: RN.VW + scene.camX, y: U.rand(0, RN.VH) + scene.camY, vx: -400, vy: 0, color: 'rgba(255,255,255,0.5)', size: 8, life: 0.5 });
          if (this.timer <= 0) { scene.windX = 0; this.state = 'tele'; this.timer = 0.8; }
          break;
        case 'dive': // انقضاض ثم إجهاد
          if (this.timer > 0) break;
          this._diveToward(dt, px, 460, 6, 2.0);
          break;
      }
    }

    /* ========== المذنّب الأعظم ========== */
    _cometTitan(scene, dt, px) {
      const ph = this.phase;
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'orbit'; this.timer = 1.4; } break;
        case 'move': // بعد نافذة الضعف يعود للتحليق
        case 'orbit': { // تحليق متموج فوق الساحة
          this.state = 'orbit';
          this._orbT = (this._orbT || 0) + dt;
          const tx = U.clamp(px + Math.sin(this._orbT * 1.6) * 220, 90, scene.level.w * 32 - 90 - this.w);
          this.x += (tx - this.x) * Math.min(1, dt * 2.2);
          this.y = this.groundY - 240 + Math.sin(this._orbT * 2.3) * 40;
          if (this.timer <= 0) {
            // 'crash' في كل الأطوار: هو المسار الوحيد إلى نافذة الضعف (stun)
            const opts = ph >= 3 ? ['meteors', 'burst', 'crash'] : ph === 2 ? ['meteors', 'burst', 'crash'] : ['meteors', 'crash'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'meteors' ? 1.1 : this.state === 'burst' ? 0.9 : 0.7;
            if (this.state === 'meteors') {
              const n = 1 + ph;
              this._mxs = [];
              for (let i = 0; i < n; i++) this._mxs.push(U.clamp(px + U.rand(-200, 200), 60, scene.level.w * 32 - 60));
            }
          }
          break;
        }
        case 'meteors': // وابل نيازك مُنذَر
          this._telegraph = { xs: this._mxs, t: this.timer, kind: 'meteor' };
          if (this.timer <= 0) {
            this._telegraph = null;
            for (const mx of this._mxs) {
              scene.projectiles.push(new RN.Projectile(mx, this.y - 40, 0, 560, false, 'rock', 1));
            }
            RN.Audio.sfx('slam');
            this.state = 'orbit'; this.timer = 1.6 - ph * 0.25;
          }
          break;
        case 'burst': { // حلقة شظايا نجمية
          if (this.timer <= 0) {
            const bx = this.x + this.w / 2, by = this.y + this.h / 2;
            const n = 6 + ph * 2;
            for (let i = 0; i < n; i++) {
              const a = (i / n) * Math.PI * 2 + this.animT;
              scene.projectiles.push(new RN.Projectile(bx, by, Math.cos(a) * 240, Math.sin(a) * 240, false, 'lightning', 1));
            }
            RN.Audio.sfx('shot');
            this.state = 'orbit'; this.timer = 1.4 - ph * 0.2;
          }
          break;
        }
        case 'crash': // ارتطام مذنّبي ثم خمود (نافذة الضعف)
          if (this.timer > 0) break;
          if (this._diveToward(dt, px, 500, 7, 2.2)) {
            scene.particles.burst(this.x + this.w / 2, this.groundY - 10, 22, { color: '#ffe98a', speed: 220, size: 4, life: 0.6, glow: true });
          }
          break;
      }
    }

    /* ========== ملك الظلال ========== */
    _shadowKing(scene, dt, px) {
      const ph = this.phase;
      scene.darkVeil = ph >= 2 ? (ph >= 3 ? 0.55 : 0.35) : 0.15; // تضييق الرؤية
      switch (this.state) {
        case 'intro': if (this.timer <= 0) { this.state = 'tele'; this.timer = 0.8; } break;
        case 'move': // بعد انتهاء نافذة الضعف يعود للتنقل
        case 'tele':
          if (this.timer <= 0) {
            scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 20, { color: '#8a5cff', speed: 180, size: 4, life: 0.6, glow: true });
            this.x = U.clamp(px + U.rand(-300, 300), 90, scene.level.w * 32 - 90 - this.w);
            this.y = this.groundY - this.h - U.rand(0, 120);
            scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 20, { color: '#8a5cff', speed: 180, size: 4, life: 0.6, glow: true });
            // نافذة الضعف (barrage → إنهاك) في كل الأطوار، أسوةً ببقية الزعماء
            // السبعة. بدونها كان الطوران 1 و2 بلا أي نافذة ضعف إطلاقًا، فلا
            // يُصاب الزعيم إلا بالضرر المخفّف العشوائي — قتال طويل غير متوازن.
            const opts = ph >= 3 ? ['orbs', 'clones', 'barrage']
              : ph === 2 ? ['orbs', 'clones', 'barrage']
                : ['orbs', 'barrage'];
            this.state = this._pickAttack(opts);
            this.timer = this.state === 'orbs' ? 0.9 : this.state === 'clones' ? 1.0 : 1.4;
          }
          break;
        case 'orbs': { // كرات ظل مروحية
          if (this.timer <= 0) {
            const n = 1 + ph * 2;
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            const base = Math.atan2(scene.player.y + 20 - cy, px - cx);
            for (let i = 0; i < n; i++) {
              const a = base + (i - (n - 1) / 2) * 0.3;
              scene.projectiles.push(new RN.Projectile(cx, cy, Math.cos(a) * 260, Math.sin(a) * 260, false, 'shadow', 1));
            }
            RN.Audio.sfx('shot');
            this.state = 'tele'; this.timer = 1.3 - ph * 0.2;
          }
          break;
        }
        case 'clones':
          if (this.timer <= 0) {
            this._spawnMinion(scene, 'shadowGhost', this.x - 100);
            this._spawnMinion(scene, 'shadowGhost', this.x + this.w + 100);
            this.state = 'tele'; this.timer = 1.4;
          }
          break;
        case 'barrage': { // وابل يائس ثم إنهاك (نافذة الضعف الكبرى)
          this._barT = (this._barT || 0) + dt;
          if (this._barT > 0.18) {
            this._barT = 0;
            this._barN = (this._barN || 0) + 1;
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            const a = U.rand(0, Math.PI * 2);
            scene.projectiles.push(new RN.Projectile(cx, cy, Math.cos(a) * 230, Math.sin(a) * 230, false, 'shadow', 1));
            RN.Audio.sfx('shot');
            if (this._barN > 10) {
              this._barN = 0;
              this.stun = 3.0;
              scene.darkVeil = 0;
            }
          }
          break;
        }
      }
    }

    /* ================= الرسم ================= */
    render(ctx, camX, camY, time) {
      const x = this.x - camX, y = this.y - camY;
      ctx.save();
      ctx.translate(x + this.w / 2, y + this.h);
      if (this.flash > 0) ctx.globalAlpha = 0.55;
      if (this.dead) ctx.globalAlpha = Math.max(0.15, this.dying / 2.5);
      ctx.scale(this.dir, 1);
      const c = this.cooled ? '#8a8a8a' : this.def.color;
      const cd = U.shade(c, -0.25), cl = U.shade(c, 0.3);
      const w = this.w, h = this.h;
      const wob = Math.sin(this.animT * 4) * 3;

      switch (this.def.id) {
        case 'spider': { // العنكبوت
          // أرجل ×4 لكل جانب
          ctx.strokeStyle = cd; ctx.lineWidth = 6; ctx.lineCap = 'round';
          for (let s = -1; s <= 1; s += 2) {
            for (let i = 0; i < 4; i++) {
              const a = (i - 1.5) * 0.4 + Math.sin(this.animT * 6 + i) * 0.12;
              ctx.beginPath();
              ctx.moveTo(s * w * 0.2, -h * 0.5);
              ctx.quadraticCurveTo(s * (w * 0.55), -h * 0.75 + Math.sin(a) * 10, s * (w * 0.62), 0);
              ctx.stroke();
            }
          }
          // جسم
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.5, w * 0.4, h * 0.42, 0, 0, 7); ctx.fill();
          ctx.fillStyle = cd;
          ctx.beginPath(); ctx.ellipse(-w * 0.15, -h * 0.55, w * 0.22, h * 0.2, 0, 0, 7); ctx.fill();
          // رأس بعيون
          ctx.fillStyle = cl;
          ctx.beginPath(); ctx.arc(w * 0.3, -h * 0.42, h * 0.3, 0, 7); ctx.fill();
          const eyeGlow = this.vulnerable ? '#ffd24a' : '#e03a3a';
          for (const [ex, ey, er] of [[w * 0.36, -h * 0.52, 6], [w * 0.24, -h * 0.55, 4.5], [w * 0.42, -h * 0.38, 4.5], [w * 0.28, -h * 0.36, 3.5]]) {
            ctx.fillStyle = eyeGlow;
            ctx.shadowColor = eyeGlow; ctx.shadowBlur = this.vulnerable ? 12 : 5;
            ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
          }
          ctx.shadowBlur = 0;
          // أنياب
          ctx.fillStyle = '#e8e8e0';
          ctx.beginPath(); ctx.moveTo(w * 0.42, -h * 0.25); ctx.lineTo(w * 0.46, -h * 0.1); ctx.lineTo(w * 0.5, -h * 0.25); ctx.closePath(); ctx.fill();
          break;
        }
        case 'sandKing': { // ملك الرمال
          // جسد رملي متصاعد
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(-w * 0.5, 0);
          ctx.quadraticCurveTo(-w * 0.55, -h * 0.6, -w * 0.25, -h * 0.8 + wob);
          ctx.quadraticCurveTo(0, -h - 6 + wob, w * 0.25, -h * 0.8 + wob);
          ctx.quadraticCurveTo(w * 0.55, -h * 0.6, w * 0.5, 0);
          ctx.closePath(); ctx.fill();
          // دوامة رمل بالقاعدة
          ctx.fillStyle = cl;
          ctx.beginPath(); ctx.ellipse(0, -6, w * 0.5, 12, 0, 0, 7); ctx.fill();
          // تاج فرعوني
          ctx.fillStyle = '#e8c23a';
          U.roundRect(ctx, -w * 0.2, -h - 4 + wob, w * 0.4, 14, 4); ctx.fill();
          ctx.fillStyle = '#3a6ad8';
          ctx.fillRect(-4, -h - 4 + wob, 8, 14);
          // عيون
          const glow = this.vulnerable ? '#ffd24a' : '#e8862a';
          ctx.fillStyle = glow;
          ctx.shadowColor = glow; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.ellipse(-12, -h * 0.78 + wob, 6, 4, 0, 0, 7); ctx.ellipse(14, -h * 0.78 + wob, 6, 4, 0, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
          // ذراعان رمليتان
          ctx.strokeStyle = cd; ctx.lineWidth = 12; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.5); ctx.quadraticCurveTo(-w * 0.7, -h * 0.4 + wob, -w * 0.6, -h * 0.15); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w * 0.4, -h * 0.5); ctx.quadraticCurveTo(w * 0.7, -h * 0.4 - wob, w * 0.6, -h * 0.15); ctx.stroke();
          break;
        }
        case 'iceDragon': { // التنين الجليدي
          const flap = Math.sin(this.animT * 5) * 0.5;
          // جناحان
          ctx.fillStyle = U.alpha('#bfe0f8', 0.85);
          ctx.save(); ctx.rotate(-flap * 0.4);
          ctx.beginPath();
          ctx.moveTo(-w * 0.1, -h * 0.6);
          ctx.lineTo(-w * 0.62, -h * 1.1);
          ctx.lineTo(-w * 0.5, -h * 0.55);
          ctx.lineTo(-w * 0.72, -h * 0.7);
          ctx.lineTo(-w * 0.42, -h * 0.35);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          // جسم
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.ellipse(-w * 0.08, -h * 0.45, w * 0.36, h * 0.3, 0, 0, 7); ctx.fill();
          // صدر متوهج عند نافذة الضعف
          ctx.fillStyle = this.vulnerable ? '#ffd24a' : cl;
          if (this.vulnerable) { ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 16; }
          ctx.beginPath(); ctx.ellipse(w * 0.05, -h * 0.35, w * 0.16, h * 0.16, 0, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
          // عنق ورأس
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(w * 0.2, -h * 0.55);
          ctx.quadraticCurveTo(w * 0.38, -h * 0.85, w * 0.46, -h * 0.75);
          ctx.lineTo(w * 0.46, -h * 0.55);
          ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.ellipse(w * 0.46, -h * 0.72, w * 0.14, h * 0.12, 0.2, 0, 7); ctx.fill();
          // فك وقرون جليدية
          ctx.fillStyle = '#e8f6ff';
          ctx.beginPath(); ctx.moveTo(w * 0.5, -h * 0.68); ctx.lineTo(w * 0.68, -h * 0.66); ctx.lineTo(w * 0.5, -h * 0.6); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(w * 0.4, -h * 0.82); ctx.lineTo(w * 0.44, -h * 1.0); ctx.lineTo(w * 0.48, -h * 0.8); ctx.closePath(); ctx.fill();
          this._beye(ctx, w * 0.46, -h * 0.76, 4, '#4ab0ff');
          // ذيل شوكي
          ctx.strokeStyle = c; ctx.lineWidth = 10; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.45);
          ctx.quadraticCurveTo(-w * 0.65, -h * 0.3 + wob, -w * 0.6, -h * 0.1 + wob); ctx.stroke();
          break;
        }
        case 'lavaBeast': { // وحش الحمم
          // جسد صخري متشقق بحمم
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(-w * 0.5, 0);
          ctx.quadraticCurveTo(-w * 0.6, -h * 0.7, -w * 0.2, -h * 0.85 + wob);
          ctx.quadraticCurveTo(0, -h + wob, w * 0.25, -h * 0.82 + wob);
          ctx.quadraticCurveTo(w * 0.6, -h * 0.65, w * 0.5, 0);
          ctx.closePath(); ctx.fill();
          // شقوق حمم متوهجة
          if (!this.cooled) {
            ctx.strokeStyle = '#ffb84a';
            ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 8;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-w * 0.25, -h * 0.2); ctx.lineTo(-w * 0.1, -h * 0.45); ctx.lineTo(-w * 0.22, -h * 0.62);
            ctx.moveTo(w * 0.15, -h * 0.25); ctx.lineTo(w * 0.05, -h * 0.5); ctx.lineTo(w * 0.2, -h * 0.7);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          // قبضتان صخريتان
          ctx.fillStyle = cd;
          ctx.beginPath(); ctx.arc(-w * 0.5, -h * 0.25 + wob, 18, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(w * 0.5, -h * 0.25 - wob, 18, 0, 7); ctx.fill();
          // عيون
          const eg = this.cooled ? '#8ab0c0' : '#ffd24a';
          ctx.fillStyle = eg;
          ctx.shadowColor = eg; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.ellipse(-10, -h * 0.72 + wob, 6, 5, 0, 0, 7); ctx.ellipse(14, -h * 0.72 + wob, 6, 5, 0, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
          // فم متوهج
          ctx.fillStyle = this.cooled ? '#5a5a5a' : '#ff6a1e';
          ctx.beginPath(); ctx.ellipse(2, -h * 0.55 + wob, 14, 6 + Math.sin(time * 5) * 2, 0, 0, 7); ctx.fill();
          break;
        }
        case 'skyWarden': { // حارس السماء
          // جسد طائر بعباءة غيوم
          ctx.fillStyle = U.alpha('#e8f2ff', 0.9);
          ctx.beginPath(); ctx.ellipse(0, -h * 0.18, w * 0.45, h * 0.16, 0, 0, 7); ctx.fill();
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(-w * 0.35, -h * 0.15);
          ctx.quadraticCurveTo(-w * 0.4, -h * 0.75, 0, -h * 0.9 + wob);
          ctx.quadraticCurveTo(w * 0.4, -h * 0.75, w * 0.35, -h * 0.15);
          ctx.closePath(); ctx.fill();
          // رأس بخوذة
          ctx.fillStyle = cl;
          ctx.beginPath(); ctx.arc(0, -h * 0.8 + wob, 16, 0, 7); ctx.fill();
          ctx.fillStyle = '#e8c23a';
          ctx.beginPath(); ctx.moveTo(-14, -h * 0.86 + wob); ctx.lineTo(0, -h * 1.05 + wob); ctx.lineTo(14, -h * 0.86 + wob); ctx.closePath(); ctx.fill();
          this._beye(ctx, -5, -h * 0.8 + wob, 3, '#ffe14a');
          this._beye(ctx, 6, -h * 0.8 + wob, 3, '#ffe14a');
          // أجنحة برق
          ctx.strokeStyle = this.vulnerable ? '#c0c8d8' : '#ffe14a';
          ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = this.vulnerable ? 0 : 10;
          ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (let s = -1; s <= 1; s += 2) {
            ctx.beginPath();
            ctx.moveTo(s * w * 0.3, -h * 0.6);
            ctx.lineTo(s * w * 0.62, -h * 0.75 + wob);
            ctx.lineTo(s * w * 0.55, -h * 0.55 + wob);
            ctx.lineTo(s * w * 0.8, -h * 0.6 + wob);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          break;
        }
        case 'cometTitan': { // المذنّب الأعظم
          // ذيل متوهج خلف الرأس
          ctx.globalCompositeOperation = 'screen';
          for (const [tc, i] of COMET_TAILS) {
            ctx.fillStyle = tc;
            ctx.beginPath();
            ctx.moveTo(-w * 0.1, -h * 0.75 + i * 8);
            ctx.quadraticCurveTo(-w * (0.9 + i * 0.15), -h * (0.65 + i * 0.08) + wob, -w * (1.15 + i * 0.18), -h * 0.35 + wob * 2);
            ctx.quadraticCurveTo(-w * 0.7, -h * 0.42, -w * 0.05, -h * 0.35);
            ctx.closePath(); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          // رأس صخري
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(w * 0.12, -h * 0.55, h * 0.42, 0, 7); ctx.fill();
          // فوهات نيزكية
          ctx.fillStyle = cd;
          ctx.beginPath();
          ctx.arc(w * 0.0, -h * 0.66, h * 0.12, 0, 7);
          ctx.arc(w * 0.24, -h * 0.38, h * 0.09, 0, 7);
          ctx.fill();
          // شقوق ضوء نجمي (تتوهج ذهبيًا في نافذة الضعف)
          const cglow = this.vulnerable ? '#ffd24a' : '#bfe8ff';
          ctx.strokeStyle = cglow;
          ctx.shadowColor = cglow; ctx.shadowBlur = this.vulnerable ? 16 : 8;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-w * 0.05, -h * 0.72); ctx.lineTo(w * 0.08, -h * 0.56); ctx.lineTo(-w * 0.02, -h * 0.4);
          ctx.moveTo(w * 0.28, -h * 0.72); ctx.lineTo(w * 0.34, -h * 0.56);
          ctx.stroke();
          ctx.shadowBlur = 0;
          // عينان
          this._beye(ctx, w * 0.2, -h * 0.6, 5, this.vulnerable ? '#ffd24a' : '#7ae0ff');
          this._beye(ctx, w * 0.4, -h * 0.55, 4, this.vulnerable ? '#ffd24a' : '#7ae0ff');
          break;
        }
        case 'shadowKing': { // ملك الظلال
          RN.Chars.drawShadowKing(ctx, 0, 0, this.animT, Math.max(1, w / 76));
          // هالة ضعف
          if (this.vulnerable) {
            ctx.strokeStyle = '#ffd24a';
            ctx.globalAlpha = 0.6 + Math.sin(time * 8) * 0.3;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(0, -h * 0.55, w * 0.55, h * 0.6, 0, 0, 7); ctx.stroke();
            ctx.globalAlpha = 1;
          }
          break;
        }
      }
      ctx.restore();

      // إنذارات الهجمات
      if (this._telegraph) {
        const tg = this._telegraph;
        for (const ex of tg.xs) {
          ctx.globalAlpha = 0.35 + Math.sin(time * 12) * 0.2;
          ctx.fillStyle = tg.kind === 'bolt' ? '#ffe14a' : '#ff6a2a';
          ctx.fillRect(ex - 22 - camX, 0, 44, RN.VH);
          ctx.globalAlpha = 1;
        }
      }
    }

    _beye(ctx, x, y, r, color) {
      ctx.fillStyle = color;
      ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  RN.Boss = Boss;
})();
