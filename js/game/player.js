'use strict';
/* ============================================================
   Rayan & Naya — تحكم ريان
   جميع الحركات: مشي/جري/قفزة/مزدوجة/جدارية/تسلق/انزلاق/اندفاع/
   هجوم/قذيفة/ضربة أرضية/انزلاق هوائي/إبطاء زمن/درع + القوى المؤقتة
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  class Player {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.w = 22; this.h = 46;
      this.vx = 0; this.vy = 0;
      this.facing = 1;
      this.onGround = false;
      this.state = 'idle';
      this.animT = 0;
      const diff = RN.C.DIFFICULTY[RN.Save.settings.difficulty];
      this.maxHp = diff.hearts + RN.Save.data.upgrades.hp;
      this.hp = this.maxHp;
      this.maxEnergy = 100 + RN.Save.data.upgrades.energy * 25;
      this.energy = this.maxEnergy;
      this.keys = {};
      this.powerups = { fireball: 0, lightning: 0, freeze: 0, power2x: 0, speed2x: 0, magnet: 0, invincible: 0 };
      this.shield = false;
      this.jumps = 0;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.dashT = 0;
      this.dashCd = 0;
      this.attackT = 0;
      this.attackCd = 0;
      this.attacking = false;
      this.slamming = false;
      this.gliding = false;
      this.climbing = false;
      this.wallDir = 0;
      this.invuln = 0;
      this.hurtT = 0;
      this.dead = false;
      this.deathT = 0;
      this.slowT = 0;       // إبطاء شباك العنكبوت
      this.springT = 0;
      this.dropThrough = false;
      this.victory = false;
      this._stepT = 0;
      this._ridingPlat = null;
      this.hitsTaken = 0;
    }

    box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    has(ab) { return !!RN.Save.data.abilities[ab]; }

    applyPowerup(kind) {
      RN.Audio.sfx('powerup');
      const sc = RN.Save.data.statsCounters;
      sc.powerups = (sc.powerups || 0) + 1;
      if (sc.powerups >= 10) RN.Achievements.unlock('powerup_10');
      const pu = RN.C.POWERUPS[kind];
      if (kind === 'shield') { this.shield = true; RN.Audio.sfx('shield'); return; }
      this.powerups[kind] = pu.dur;
    }

    hurt(scene, dmg, dir) {
      if (this.dead || this.invuln > 0 || this.dashT > 0) return;
      if (RN.Save.settings.assist === 2) return;
      if (this.powerups.invincible > 0) return;
      if (this.shield) {
        this.shield = false;
        this.invuln = 1.2;
        RN.Audio.sfx('shield');
        scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 14, { color: '#7affc8', speed: 150, size: 3, life: 0.5, glow: true });
        return;
      }
      const diff = RN.C.DIFFICULTY[RN.Save.settings.difficulty];
      this.hp -= dmg * diff.enemyDmg;
      this.hitsTaken++;
      this.invuln = 1.4;
      this.hurtT = 0.35;
      this.vx = dir * 260;
      this.vy = -300;
      RN.Audio.sfx('hurt');
      RN.Engine.doShake(5);
      RN.Engine.doFlash('#ff4444', 0.25);
      scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 10, { color: '#ff6a6a', speed: 140, size: 3, life: 0.5 });
      if (this.hp <= 0) this.die(scene);
    }

    die(scene) {
      if (this.dead) return;
      this.dead = true;
      this.deathT = 1.6;
      this.vy = -500;
      RN.Audio.sfx('death');
      RN.Save.data.statsCounters.deaths++;
    }

    update(scene, dt) {
      this.animT += dt;
      const P = RN.C.PHYS;
      const level = scene.level;
      const inp = RN.Input;

      if (this.dead) {
        this.deathT -= dt;
        this.vy += P.gravity * dt;
        this.y += this.vy * dt;
        if (this.deathT <= 0) scene.onPlayerDeath();
        return;
      }
      if (this.victory) {
        this.vx = 0;
        this._physics(scene, dt);
        return;
      }

      // شبكة أمان: إن انحشر اللاعب داخل بلاطة صلبة (سقوط/تليبورت/بوابة تُغلق فوقه)
      // فسيتعذّر عليه التحرك في أي اتجاه — حرّره قبل معالجة الإدخال.
      this._unstick(scene);

      // مؤقتات
      if (this.invuln > 0) this.invuln -= dt;
      if (this.hurtT > 0) this.hurtT -= dt;
      if (this.dashCd > 0) this.dashCd -= dt;
      if (this.attackCd > 0) this.attackCd -= dt;
      if (this.slowT > 0) this.slowT -= dt;
      if (this.springT > 0) this.springT -= dt;
      for (const k in this.powerups) if (this.powerups[k] > 0) this.powerups[k] -= dt;
      this.energy = Math.min(this.maxEnergy, this.energy + 13 * dt);

      const speedMul = (this.powerups.speed2x > 0 ? 1.55 : 1) * (this.slowT > 0 ? 0.55 : 1);
      const ax = inp.axisX();
      if (ax !== 0 && this.hurtT <= 0) this.facing = ax;

      /* ---- إبطاء الزمن ---- */
      if (this.has('timeSlow') && inp.down('timeSlow') && this.energy > 5) {
        if (RN.Engine.slowmo > 0.99) RN.Audio.sfx('timeSlow');
        RN.Engine.slowmo = U.lerp(RN.Engine.slowmo, 0.45, 0.2);
        this.energy -= 22 * dt;
      } else {
        RN.Engine.slowmo = U.lerp(RN.Engine.slowmo, 1, 0.15);
        if (RN.Engine.slowmo > 0.97) RN.Engine.slowmo = 1;
      }

      /* ---- الاندفاع ---- */
      if (this.dashT > 0) {
        this.dashT -= dt;
        this.vx = this.facing * P.dashSpeed * speedMul;
        this.vy = 0;
        scene.particles.spawn({
          x: this.x + this.w / 2 - this.facing * 10, y: this.y + this.h / 2 + U.rand(-12, 12),
          vx: -this.facing * 60, vy: 0, color: '#7ad8ff', size: 4, life: 0.35, glow: true,
        });
        this._physics(scene, dt);
        return;
      }
      if (this.has('dash') && inp.justPressed('dash') && this.dashCd <= 0 && this.energy >= 20) {
        this.dashT = P.dashTime;
        this.dashCd = 0.55;
        this.energy -= 20;
        RN.Audio.sfx('dash');
        return;
      }

      /* ---- التسلق ---- */
      const canClimbTile = RN.Physics.onClimbable(level, this);
      if (canClimbTile && (inp.down('up') || inp.down('down')) && !this.climbing) this.climbing = true;
      if (this.climbing) {
        if (!canClimbTile || inp.justPressed('jump')) {
          this.climbing = false;
          if (inp.justPressed('jump')) { this.vy = -P.jumpVel * 0.9; RN.Audio.sfx('jump'); }
        } else {
          this.vy = (inp.down('up') ? -1 : inp.down('down') ? 1 : 0) * P.climbSpeed;
          this.vx = ax * P.climbSpeed * 0.7;
          this._physics(scene, dt, true);
          return;
        }
      }

      /* ---- الحركة الأفقية ---- */
      const onIce = this._groundTile === RN.C.T.ICE;
      const inSand = this._groundTile === RN.C.T.SAND;
      const targetSpeed = ax * (Math.abs(this.vx) > P.runSpeed - 10 && Math.abs(ax) > 0 ? P.sprintSpeed : P.runSpeed) * speedMul * (inSand ? 0.55 : 1);
      if (this.hurtT <= 0) {
        if (ax !== 0) {
          this.vx = U.moveToward(this.vx, targetSpeed, (onIce ? P.iceFriction : P.accel) * dt);
        } else {
          this.vx = U.moveToward(this.vx, 0, (onIce ? P.iceFriction * 0.4 : P.friction) * dt);
        }
      }
      // رياح عالم السماء / هبات الزعيم
      if (scene.windX) this.vx += scene.windX * dt * 0.8;

      /* ---- القفز ---- */
      this.jumpBuf = inp.justPressed('jump') ? P.jumpBuffer : Math.max(0, this.jumpBuf - dt);
      this.coyote = this.onGround ? P.coyote : Math.max(0, this.coyote - dt);
      const maxJumps = RN.Save.settings.assist === 1 ? 99 : this.has('doubleJump') ? 2 : 1;

      // النزول عبر المنصات
      this.dropThrough = inp.down('down') && inp.justPressed('jump');
      if (this.dropThrough) this.jumpBuf = 0;

      if (this.jumpBuf > 0) {
        if (this.coyote > 0) {
          this.vy = -P.jumpVel;
          this.jumps = 1;
          this.jumpBuf = 0;
          this.coyote = 0;
          RN.Audio.sfx('jump');
          RN.Save.data.statsCounters.jumps++;
          // غبار + شرارات قفز
          scene.particles.burst(this.x + this.w / 2, this.y + this.h, 5, { color: 'rgba(200,190,170,0.7)', speed: 60, size: 2.5, life: 0.3 });
          scene.particles.burst(this.x + this.w / 2, this.y + this.h - 4, 5, { color: '#ffe08a', speed: 110, size: 1.8, life: 0.35, glow: true, shape: 'star', vr: 6 });
        } else if (this.wallDir !== 0 && this.has('wallJump')) {
          // قفزة جدارية
          this.vy = -P.jumpVel * 0.92;
          this.vx = -this.wallDir * P.wallJumpX;
          this.facing = -this.wallDir;
          this.jumps = 1;
          this.jumpBuf = 0;
          RN.Audio.sfx('doubleJump');
          scene.particles.burst(this.x + (this.wallDir > 0 ? this.w : 0), this.y + this.h / 2, 6, { color: '#cccccc', speed: 80, size: 2.5, life: 0.3 });
        } else if (this.jumps < maxJumps && this.jumps >= 1) {
          this.vy = -P.doubleJumpVel;
          this.jumps++;
          this.jumpBuf = 0;
          this._djSpin = 0.4;
          RN.Audio.sfx('doubleJump');
          scene.particles.burst(this.x + this.w / 2, this.y + this.h, 8, { color: '#7ad8ff', speed: 90, size: 3, life: 0.4, glow: true });
        }
      }
      // قطع القفزة عند ترك الزر
      if (inp.justReleased('jump') && this.vy < -200) this.vy = -200;
      if (this._djSpin > 0) this._djSpin -= dt;

      /* ---- الجاذبية + انزلاق الجدار + الطيران الشراعي ---- */
      let grav = P.gravity;
      this.gliding = false;
      if (this.has('glide') && !this.onGround && this.vy > 0 && inp.down('jump')) {
        this.gliding = true;
        this.vy = Math.min(this.vy, P.glideFall);
        grav = 0;
        if (Math.random() < 0.15) {
          scene.particles.spawn({ x: this.x + U.rand(0, this.w), y: this.y + this.h, vy: 40, color: 'rgba(255,255,255,0.6)', size: 2, life: 0.4 });
        }
      }
      this.vy = Math.min(this.vy + grav * dt, this.slamming ? P.slamSpeed : P.maxFall);
      // انزلاق على الجدار
      if (this.wallDir !== 0 && !this.onGround && this.vy > 0 && this.has('wallJump') && ax === this.wallDir) {
        this.vy = Math.min(this.vy, P.wallSlideMax);
        if (Math.random() < 0.2) {
          scene.particles.spawn({ x: this.x + (this.wallDir > 0 ? this.w : 0), y: this.y + this.h * 0.7, vx: 0, vy: 30, color: '#bbbbbb', size: 2, life: 0.3 });
        }
      }

      /* ---- الضربة الأرضية ---- */
      if (this.has('slam') && !this.onGround && !this.slamming && inp.down('down') && inp.justPressed('attack') && this.energy >= 10) {
        this.slamming = true;
        this.energy -= 10;
        this.vy = P.slamSpeed;
        this.vx = 0;
      }

      /* ---- الهجوم ---- */
      this.attacking = false;
      if (this.attackT > 0) {
        this.attackT -= dt;
        this.attacking = this.attackT > 0.05;
        // صندوق ضرر أمام اللاعب
        if (this.attacking) {
          const dmg = (this.powerups.power2x > 0 ? 2 : 1) * (this.powerups.lightning > 0 ? 2 : 1);
          const hb = { x: this.x + this.w / 2 + (this.facing > 0 ? 2 : -44), y: this.y - 4, w: 42, h: this.h + 8 };
          // صندوق ضرر ممتد للأعلى للأعداء فقط: قوس السيف المرئي يصل فوق صندوق
          // الفيزياء (الشخصية مرسومة أطول منه)، بينما يبقى كسر البلاطات على hb.
          const swingHb = { x: hb.x, y: this.y - 26, w: hb.w, h: this.h + 30 };
          for (const e of scene.enemies) {
            if (!e.dead && !e._hitBySwing && U.aabb(swingHb, e.box())) {
              e._hitBySwing = true;
              e.hurt(scene, dmg, this.facing, false);
              if (this.powerups.freeze > 0) e.frozen = 2.5;
            }
          }
          if (scene.boss && !scene.boss.dead && U.aabb(swingHb, scene.boss.hitbox())) {
            if (!scene.boss._hitBySwing) {
              scene.boss._hitBySwing = true;
              scene.boss.hurt(scene, dmg);
            }
          }
          // كسر البلاطات
          this._breakTiles(scene, hb);
        }
      } else if (inp.justPressed('attack') && this.attackCd <= 0 && !this.slamming && !inp.down('down')) {
        this.attackT = 0.22;
        this.attackCd = this.powerups.lightning > 0 ? 0.25 : 0.38;
        RN.Audio.sfx('hit');
        for (const e of scene.enemies) e._hitBySwing = false;
        if (scene.boss) scene.boss._hitBySwing = false;
      }

      /* ---- قذيفة الطاقة ---- */
      const canShoot = this.has('shot') || this.powerups.fireball > 0;
      if (canShoot && inp.justPressed('shot') && this.energy >= 15 && !this.slamming) {
        const isFire = this.powerups.fireball > 0;
        if (!isFire) this.energy -= 15;
        const dmg = (isFire ? 2 : 1) * (this.powerups.power2x > 0 ? 2 : 1);
        scene.projectiles.push(new RN.Projectile(
          this.x + this.w / 2 + this.facing * 18, this.y + 16,
          this.facing * 520, 0, true, isFire ? 'fire' : 'energy', dmg));
        RN.Audio.sfx('shot');
        this._shootT = 0.25;
      }
      if (this._shootT > 0) this._shootT -= dt;

      this._physics(scene, dt);

      /* ---- الدوس على الأعداء ---- */
      if (this.vy > 60 || this.slamming) {
        for (const e of scene.enemies) {
          if (e.dead) continue;
          const eb = e.box();
          if (U.aabb(this.box(), eb) && this.y + this.h < eb.y + eb.h * 0.6) {
            e.hurt(scene, this.slamming ? 3 : 1 + (this.powerups.power2x > 0 ? 1 : 0), this.facing, true);
            this.vy = -RN.C.PHYS.jumpVel * 0.55;
            this.jumps = 1;
            RN.Audio.sfx('stomp');
          }
        }
      }
      // لمس عدو مع حصانة القوة
      if (this.powerups.invincible > 0) {
        for (const e of scene.enemies) {
          if (!e.dead && U.aabb(this.box(), e.box())) e.hurt(scene, 99, this.facing, false);
        }
      }

      /* ---- خطوات وغبار ---- */
      if (this.onGround && Math.abs(this.vx) > 60) {
        this._stepT -= dt * Math.abs(this.vx) / 100;
        if (this._stepT <= 0) {
          this._stepT = 0.32;
          RN.Audio.sfx('step');
          scene.particles.spawn({ x: this.x + this.w / 2 - this.facing * 8, y: this.y + this.h - 2, vx: -this.facing * 40, vy: -20, color: 'rgba(180,170,150,0.6)', size: 2.5, life: 0.35 });
        }
      }
    }

    _breakTiles(scene, hb) {
      const level = scene.level;
      const tx0 = Math.floor(hb.x / 32), tx1 = Math.floor((hb.x + hb.w) / 32);
      const ty0 = Math.floor(hb.y / 32), ty1 = Math.floor((hb.y + hb.h) / 32);
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          if (level.tileAt(tx, ty) === RN.C.T.BREAK) {
            level.setTile(tx, ty, RN.C.T.EMPTY);
            RN.Audio.sfx('break');
            scene.particles.burst(tx * 32 + 16, ty * 32 + 16, 10, { color: RN.C.WORLDS[level.wi].ground, speed: 130, size: 4, life: 0.5, grav: 500 });
          }
        }
      }
    }

    // تحرير اللاعب إن كان جسده مدفونًا داخل بلاطة صلبة (حالة "لا أستطيع التحرك").
    // الفحص يستعمل نقطتي مركز الجسم فقط، فلا يُطلَق أثناء اللعب الطبيعي
    // (الوقوف على الأرض/داخل شقّ ضيّق) بل فقط عند الانحشار الحقيقي.
    _unstick(scene) {
      const level = scene.level;
      const tile = 32;
      const embedded = () => {
        const cx = Math.floor((this.x + this.w / 2) / tile);
        const cyMid = Math.floor((this.y + this.h * 0.5) / tile);
        const cyLow = Math.floor((this.y + this.h * 0.8) / tile);
        return RN.Physics.isSolid(level.tileAt(cx, cyMid)) || RN.Physics.isSolid(level.tileAt(cx, cyLow));
      };
      if (!embedded()) return;
      // حاول رفعه للأعلى حتى يتحرر (حتى ~5 بلاطات) — يغطّي انغلاق بوابة فوقه
      const startY = this.y;
      for (let s = 0; s < 40; s++) {
        this.y -= 4;
        if (!embedded()) { this.vy = 0; return; }
      }
      // تعذّر التحرير بالرفع: أعده لآخر موضع آمن معروف
      this.y = startY;
      this.x = scene.safeX; this.y = scene.safeY;
      this.vx = 0; this.vy = 0;
      this.invuln = Math.max(this.invuln, 1);
    }

    _physics(scene, dt, noGravReset) {
      const level = scene.level;
      const res = RN.Physics.moveActor(level, this, dt);
      this.onGround = res.onGround || this.onGround === true && res.onGround; // moveActor يحدد
      this.onGround = res.onGround;
      this._groundTile = res.groundTile;
      this.wallDir = res.onWall;
      if (res.onGround) {
        if (this.slamming) {
          this.slamming = false;
          RN.Audio.sfx('slam');
          RN.Engine.doShake(7);
          scene.shockwave(this.x + this.w / 2, this.y + this.h, 130, 2);
          scene.particles.burst(this.x + this.w / 2, this.y + this.h, 18, { color: '#d8c8a8', speed: 200, size: 4, life: 0.5, grav: 600 });
        }
        this.jumps = 0;
        // تفتيت البلاطات الهشة
        for (const [tx, ty] of res.crumbled) {
          if (!level._crumbling) level._crumbling = [];
          if (!level._crumbling.some((c) => c[0] === tx && c[1] === ty)) {
            level._crumbling.push([tx, ty, 0.45]);
          }
        }
      }
      // المخاطر
      if (res.hazard && this.invuln <= 0) {
        if (res.hazard === 'pit') {
          this.hp -= 1;
          this.hitsTaken++;
          RN.Audio.sfx('hurt');
          if (this.hp <= 0) { this.die(scene); return; }
          // إعادة لآخر موضع آمن
          this.x = scene.safeX; this.y = scene.safeY;
          this.vx = 0; this.vy = 0;
          this.invuln = 1.5;
        } else {
          this.hurt(scene, res.hazard === 'lava' ? 2 : 1, -this.facing);
          if (!this.dead && (res.hazard === 'lava' || res.hazard === 'spike')) {
            this.x = scene.safeX; this.y = scene.safeY;
            this.vx = 0; this.vy = 0;
          }
        }
        if (res.hazard === 'lava') RN.Audio.sfx('fire');
      }
      // تسجيل الموضع الآمن
      if (res.onGround && !res.hazard && res.groundTile !== RN.C.T.CRUMBLE) {
        scene.safeX = this.x;
        scene.safeY = this.y - 4;
      }
    }

    /* ---------------- الرسم ---------------- */
    renderState() {
      if (this.dead) return 'death';
      if (this.victory) return 'victory';
      if (this.hurtT > 0) return 'hurt';
      if (this.climbing) return 'climb';
      if (this.dashT > 0) return 'dash';
      if (this.slamming) return 'slam';
      if (this.attackT > 0) return 'attack';
      if (this._shootT > 0) return 'shoot';
      if (this.gliding) return 'glide';
      if (!this.onGround) {
        if (this.wallDir !== 0 && this.vy > 0 && this.has('wallJump')) return 'wallSlide';
        if (this._djSpin > 0) return 'doubleJump';
        return this.vy < 0 ? 'jump' : 'fall';
      }
      const sp = Math.abs(this.vx);
      if (sp > RN.C.PHYS.runSpeed + 20) return 'sprint';
      if (sp > 120) return 'run';
      if (sp > 8) return 'walk';
      return 'idle';
    }

    render(ctx, camX, camY) {
      if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 12) % 2 === 0) return;
      const state = this.renderState();
      const outfit = RN.C.OUTFITS[RN.Save.data.outfit] || RN.C.OUTFITS.explorer;
      const fx = {
        shield: this.shield,
        invincible: this.powerups.invincible > 0,
        power2x: this.powerups.power2x > 0,
        scale: RN.Chars.RAYAN_SCALE,
        lookX: 0.7,
        lookY: this.vy < -100 ? -0.5 : this.vy > 200 ? 0.6 : 0,
      };
      const t = state === 'attack' ? (0.22 - this.attackT) : this.animT;
      // ظل ناعم
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2 - camX, this.y + this.h - camY + 3, 14, 4, 0, 0, 7);
      ctx.fill();
      RN.Chars.drawRayan(ctx, this.x + this.w / 2 - camX, this.y + this.h - camY, state, t, this.facing, outfit, fx);
      // مظلة الانزلاق
      if (this.gliding) {
        const px = this.x + this.w / 2 - camX, py = this.y - camY;
        // المظلة مرفوعة فوق قمة الرأس (الرأس يصل حتى ~py-44 بالمقياس الحالي)
        // والأحزمة تنزل إلى اليدين المرفوعتين في وضعية الانزلاق (~py-28).
        ctx.fillStyle = '#e8862a';
        ctx.beginPath();
        ctx.arc(px, py - 52, 26, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f4f1e8';
        ctx.beginPath(); ctx.arc(px, py - 52, 26, Math.PI * 1.25, Math.PI * 1.55); ctx.lineTo(px, py - 52); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - 24, py - 50); ctx.lineTo(px - 15, py - 28);
        ctx.moveTo(px + 24, py - 50); ctx.lineTo(px + 15, py - 28);
        ctx.stroke();
      }
    }
  }

  RN.Player = Player;
})();
