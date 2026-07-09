'use strict';
/* ============================================================
   Rayan & Naya — الأعداء والذكاء الاصطناعي
   28 نوعًا أصليًا عبر 7 عوالم. سلوكيات: دوريات، مطاردة، هروب،
   كمائن، حراسة، قنص، تعاون (استدعاء القطيع)، وتكيّف مع أسلوب
   اللاعب (درع أشواك ضد الدوس / صد الهجمات الأمامية)
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  // تعريفات الأنواع: أرشيتايب الحركة + خصائص + مظهر
  const DEFS = {
    // ---- الغابة ----
    beetle: { ai: 'walker', hp: 2, w: 34, h: 24, speed: 55, color: '#6a4a9a', dmg: 1 },
    wasp: { ai: 'flyer', hp: 1, w: 30, h: 24, speed: 95, color: '#e8c02a', dmg: 1, chase: 190 },
    plant: { ai: 'ambushStatic', hp: 3, w: 34, h: 40, speed: 0, color: '#3a9a4a', dmg: 1, range: 90 },
    hopper: { ai: 'jumper', hp: 2, w: 30, h: 26, speed: 120, color: '#e07a9a', dmg: 1 },
    // ---- الصحراء ----
    scorpion: { ai: 'chaser', hp: 2, w: 38, h: 22, speed: 75, color: '#c08637', dmg: 1, chase: 170, adaptive: true },
    statue: { ai: 'guard', hp: 5, w: 36, h: 46, speed: 38, color: '#9a8a6a', dmg: 2, range: 130 },
    vulture: { ai: 'diver', hp: 2, w: 38, h: 26, speed: 130, color: '#7a5a4a', dmg: 1, chase: 220 },
    mummyRat: { ai: 'coward', hp: 1, w: 28, h: 20, speed: 130, color: '#c8b89a', dmg: 1 },
    // ---- الجليد ----
    snowWolf: { ai: 'pack', hp: 3, w: 42, h: 28, speed: 110, color: '#c8d8e8', dmg: 1, chase: 240 },
    frostBat: { ai: 'flyer', hp: 1, w: 30, h: 22, speed: 85, color: '#8ab0d8', dmg: 1, chase: 180 },
    iceGolem: { ai: 'shooterWalk', hp: 5, w: 44, h: 50, speed: 30, color: '#a8c8e0', dmg: 2, shot: 'ice', cd: 2.4 },
    icicle: { ai: 'dropper', hp: 1, w: 18, h: 30, speed: 0, color: '#c8e8ff', dmg: 1, range: 60 },
    // ---- البراكين ----
    lavaSlug: { ai: 'walker', hp: 3, w: 40, h: 22, speed: 35, color: '#e05a2a', dmg: 2, trail: true },
    fireImp: { ai: 'flyerShooter', hp: 2, w: 30, h: 30, speed: 70, color: '#ff7a3a', dmg: 1, shot: 'fire', cd: 2.2, chase: 240 },
    rockCrawler: { ai: 'walker', hp: 4, w: 40, h: 28, speed: 60, color: '#7a5a4a', dmg: 1, spiky: true },
    magmaTurret: { ai: 'turret', hp: 4, w: 34, h: 30, speed: 0, color: '#8a4a3a', dmg: 1, shot: 'magma', cd: 2.6, range: 320 },
    // ---- السماء ----
    stormBird: { ai: 'diver', hp: 2, w: 40, h: 26, speed: 145, color: '#5a7ad8', dmg: 1, chase: 250 },
    cloudJelly: { ai: 'floater', hp: 2, w: 34, h: 30, speed: 45, color: '#c8d8f8', dmg: 1 },
    windWisp: { ai: 'coward', hp: 1, w: 26, h: 26, speed: 150, color: '#a8e8e8', dmg: 1 },
    skyDrake: { ai: 'flyerShooter', hp: 3, w: 44, h: 32, speed: 80, color: '#4ab0a8', dmg: 1, shot: 'lightning', cd: 2.5, chase: 260 },
    // ---- عالم النجوم ----
    starWisp: { ai: 'coward', hp: 1, w: 26, h: 26, speed: 145, color: '#ffe98a', dmg: 1 },
    cometHawk: { ai: 'diver', hp: 2, w: 40, h: 26, speed: 150, color: '#7ad8ff', dmg: 1, chase: 250 },
    nebulaJelly: { ai: 'floater', hp: 2, w: 34, h: 32, speed: 50, color: '#c88aff', dmg: 1 },
    starSentinel: { ai: 'teleShooter', hp: 3, w: 30, h: 42, speed: 0, color: '#ffd76a', dmg: 1, shot: 'lightning', cd: 2.2 },
    // ---- العالم المظلم ----
    shadowGhost: { ai: 'stalker', hp: 2, w: 32, h: 38, speed: 70, color: '#5a3a8a', dmg: 1, chase: 260 },
    darkKnight: { ai: 'guard', hp: 5, w: 36, h: 48, speed: 55, color: '#3a3a5a', dmg: 2, range: 150, blocker: true },
    gargoyle: { ai: 'dropper', hp: 3, w: 36, h: 32, speed: 90, color: '#4a4a6a', dmg: 2, range: 110, thenChase: true },
    shadeCaster: { ai: 'teleShooter', hp: 3, w: 30, h: 42, speed: 0, color: '#6a2a8a', dmg: 1, shot: 'shadow', cd: 2.0 },
  };

  class Enemy {
    constructor(type, x, y) {
      const d = DEFS[type] || DEFS.beetle;
      this.type = type;
      this.def = d;
      this.x = x; this.y = y;
      this.w = d.w; this.h = d.h;
      this.vx = 0; this.vy = 0;
      this.hp = d.hp;
      this.maxHp = d.hp;
      this.dir = -1;
      this.dead = false;
      this.state = 'patrol';
      this.timer = U.rand(0, 2);
      this.shootCd = U.rand(0.5, d.cd || 2);
      this.homeX = x; this.homeY = y;
      this.flash = 0;
      this.frozen = 0;
      this.alerted = false;
      this.adapted = false;
      this._animT = U.rand(0, 9);
      this.grounded = ['walker', 'chaser', 'guard', 'jumper', 'coward', 'pack', 'shooterWalk'].includes(d.ai);
    }

    box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

    hurt(scene, dmg, dir, isStomp) {
      if (this.dead) return;
      const d = this.def;
      // التكيف: قشرة شوكية تمنع الدوس
      if (isStomp && (d.spiky || (this.adapted && scene.playerStyle.stomps > scene.playerStyle.slashes + 2))) {
        scene.player.hurt(scene, 1, -dir);
        return;
      }
      // فارس الظلام يصد الهجمات الأمامية
      if (!isStomp && d.blocker && Math.sign(scene.player.x - this.x) === -this.dir * -1 && Math.sign(scene.player.x + scene.player.w / 2 - (this.x + this.w / 2)) === this.dir) {
        RN.Audio.sfx('hit');
        scene.particles.burst(this.x + this.w / 2 + this.dir * 15, this.y + this.h / 2, 6, { color: '#c0c0e0', speed: 100, size: 2, life: 0.3 });
        return;
      }
      this.hp -= dmg;
      this.flash = 0.15;
      this.vx = dir * 140;
      if (isStomp) scene.playerStyle.stomps++;
      else scene.playerStyle.slashes++;
      // تعلم أسلوب اللاعب
      if (this.def.adaptive && this.hp > 0) this.adapted = true;
      if (this.hp <= 0) {
        this.dead = true;
        RN.Audio.sfx('enemyDie');
        RN.Save.data.statsCounters.kills++;
        scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 16, { color: this.def.color, speed: 170, size: 3.5, life: 0.6 });
        // إسقاط كريستالة
        if (Math.random() < 0.5) {
          scene.level.ent('crystal', { x: this.x + this.w / 2, y: this.y, big: false, taken: false });
          scene.level.crystalTotal++; // لا تُحتسب ضمن نجمة الجمع (سقطت بعد العد) — تُحسب كمكافأة
        }
        scene.checkKillAchievements();
      } else {
        RN.Audio.sfx('hit');
      }
    }

    update(scene, dt) {
      if (this.dead) return;
      const d = this.def, p = scene.player, level = scene.level;
      this._animT += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.frozen > 0) { this.frozen -= dt; return; }
      const px = p.x + p.w / 2, py = p.y + p.h / 2;
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      const distP = U.dist(px, py, cx, cy);
      const seesPlayer = distP < (d.chase || 150) && Math.abs(py - cy) < 140;

      switch (d.ai) {
        case 'walker': this._walk(level, dt, d.speed); break;

        case 'chaser': {
          if (seesPlayer) { this.dir = px > cx ? 1 : -1; this._walk(level, dt, d.speed * 1.5, true); }
          else this._walk(level, dt, d.speed);
          break;
        }

        case 'pack': {
          // ذئاب: عند رؤية اللاعب تنبه بقية القطيع (تعاون)
          if (seesPlayer && !this.alerted) {
            this.alerted = true;
            for (const e of scene.enemies) {
              if (e.type === 'snowWolf' && !e.dead && U.dist(e.x, e.y, cx, cy) < 500) e.alerted = true;
            }
          }
          if (this.alerted) {
            this.dir = px > cx ? 1 : -1;
            this._walk(level, dt, d.speed * 1.4, true);
            // وثبة عند الاقتراب
            if (distP < 90 && this._onGround && Math.random() < 0.02) { this.vy = -420; }
          } else this._walk(level, dt, d.speed * 0.6);
          break;
        }

        case 'coward': {
          // يهرب عندما ينظر إليه اللاعب، ويقترب من الخلف
          const facingMe = Math.sign(cx - px) === p.facing;
          this.dir = facingMe ? (cx > px ? 1 : -1) : (px > cx ? 1 : -1);
          if (distP < 260) this._walk(level, dt, d.speed, true);
          else this._walk(level, dt, d.speed * 0.4);
          break;
        }

        case 'guard': {
          // ساكن حتى يقترب اللاعب (كمين) ثم يتقدم بثبات
          if (this.state === 'patrol' && distP < d.range) {
            this.state = 'active';
            RN.Audio.sfx('rockfall');
            scene.particles.burst(cx, cy, 10, { color: d.color, speed: 80, size: 3, life: 0.5 });
          }
          if (this.state === 'active') {
            this.dir = px > cx ? 1 : -1;
            this._walk(level, dt, d.speed, true);
          }
          break;
        }

        case 'jumper': {
          this.timer -= dt;
          if (this._onGround && this.timer <= 0) {
            this.vy = -520;
            this.vx = this.dir * d.speed;
            this.timer = U.rand(1.2, 2.2);
            if (seesPlayer) this.dir = px > cx ? 1 : -1;
          }
          this._gravity(level, dt);
          break;
        }

        case 'flyer': {
          const targetY = seesPlayer ? py : this.homeY + Math.sin(this._animT * 2) * 30;
          const targetX = seesPlayer ? px : this.homeX + Math.sin(this._animT * 1.3) * 60;
          this.vx = U.moveToward(this.vx, U.clamp(targetX - cx, -1, 1) * d.speed, 300 * dt);
          this.vy = U.moveToward(this.vy, U.clamp(targetY - cy, -1, 1) * d.speed * 0.8, 300 * dt);
          this.x += this.vx * dt; this.y += this.vy * dt;
          this.dir = this.vx > 0 ? 1 : -1;
          break;
        }

        case 'diver': {
          if (this.state === 'patrol') {
            this.x = this.homeX + Math.sin(this._animT * 1.2) * 80;
            this.y = this.homeY + Math.sin(this._animT * 2.5) * 15;
            this.dir = Math.cos(this._animT * 1.2) > 0 ? 1 : -1;
            if (seesPlayer && py > cy) { this.state = 'dive'; this._diveVx = (px - cx) * 1.6; this._diveVy = 380; }
          } else if (this.state === 'dive') {
            this.x += this._diveVx * dt;
            this.y += this._diveVy * dt;
            this.dir = this._diveVx > 0 ? 1 : -1;
            if (this.y > py + 60 || this.y > this.homeY + 320) this.state = 'return';
          } else {
            const dx = this.homeX - this.x, dy = this.homeY - this.y;
            this.x += U.clamp(dx, -1, 1) * d.speed * dt;
            this.y += U.clamp(dy, -1, 1) * d.speed * dt;
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) this.state = 'patrol';
          }
          break;
        }

        case 'floater': {
          this.y = this.homeY + Math.sin(this._animT * 1.6) * 45;
          this.x = this.homeX + Math.sin(this._animT * 0.9) * 50;
          break;
        }

        case 'ambushStatic': {
          // نبتة آكلة: تنقض عند الاقتراب
          if (this.state === 'patrol' && distP < d.range) { this.state = 'snap'; this.timer = 0.5; }
          if (this.state === 'snap') {
            this.timer -= dt;
            if (this.timer <= 0) this.state = 'patrol';
          }
          break;
        }

        case 'dropper': {
          // يتدلى من السقف وينقض عندما يمر اللاعب تحته
          if (this.state === 'patrol') {
            if (Math.abs(px - cx) < d.range && py > cy) {
              this.state = 'fall';
              this.vy = 50;
            }
          } else if (this.state === 'fall') {
            this.vy += 1600 * dt;
            this.y += this.vy * dt;
            const res = { x: this.x, y: this.y, w: this.w, h: this.h, vx: 0, vy: this.vy };
            const r = RN.Physics.moveActor(level, res, 0.0001);
            if (RN.Physics.isSolid(level.tileAt(Math.floor(cx / 32), Math.floor((this.y + this.h) / 32)))) {
              if (this.type === 'icicle') {
                this.dead = true;
                scene.particles.burst(cx, this.y + this.h, 10, { color: '#c8e8ff', speed: 120, size: 3, life: 0.5 });
                RN.Audio.sfx('break');
              } else if (d.thenChase) {
                this.state = 'chase';
                this.vy = 0;
                this.y = Math.floor((this.y + this.h) / 32) * 32 - this.h - 0.5;
              }
            }
          } else if (this.state === 'chase') {
            this.dir = px > cx ? 1 : -1;
            this._walk(level, dt, d.speed, true);
          }
          break;
        }

        case 'stalker': {
          // شبح: يتحرك فقط عندما لا ينظر إليه اللاعب، يعبر الجدران
          const facingMe = Math.sign(cx - px) === p.facing && Math.abs(py - cy) < 200;
          if (!facingMe && distP < d.chase) {
            const ang = Math.atan2(py - cy, px - cx);
            this.x += Math.cos(ang) * d.speed * dt;
            this.y += Math.sin(ang) * d.speed * dt;
            this.dir = px > cx ? 1 : -1;
            this._visible = 0.4;
          } else {
            this._visible = 1;
          }
          break;
        }

        case 'turret': {
          if (distP < d.range) {
            this.shootCd -= dt;
            if (this.shootCd <= 0) {
              this.shootCd = d.cd;
              const ang = Math.atan2(py - cy - 60, px - cx);
              scene.projectiles.push(new RN.Projectile(cx, cy - 8, Math.cos(ang) * 260, Math.sin(ang) * 260 - 120, false, d.shot, d.dmg));
              RN.Audio.sfx('fire');
            }
          }
          break;
        }

        case 'shooterWalk': {
          this._walk(level, dt, d.speed);
          if (seesPlayer) {
            this.dir = px > cx ? 1 : -1;
            this.shootCd -= dt;
            if (this.shootCd <= 0) {
              this.shootCd = d.cd;
              scene.projectiles.push(new RN.Projectile(cx + this.dir * 20, cy - 6, this.dir * 300, 0, false, d.shot, d.dmg));
              RN.Audio.sfx('shot');
            }
          }
          break;
        }

        case 'flyerShooter': {
          const hoverY = py - 120, hoverX = px + (cx > px ? 130 : -130);
          if (seesPlayer) {
            this.vx = U.moveToward(this.vx, U.clamp(hoverX - cx, -1, 1) * d.speed, 200 * dt);
            this.vy = U.moveToward(this.vy, U.clamp(hoverY - cy, -1, 1) * d.speed, 200 * dt);
            this.dir = px > cx ? 1 : -1;
            this.shootCd -= dt;
            if (this.shootCd <= 0) {
              this.shootCd = d.cd;
              const ang = Math.atan2(py - cy, px - cx);
              scene.projectiles.push(new RN.Projectile(cx, cy, Math.cos(ang) * 280, Math.sin(ang) * 280, false, d.shot, d.dmg));
              RN.Audio.sfx('shot');
            }
          } else {
            this.vx = Math.sin(this._animT * 1.4) * d.speed * 0.5;
            this.vy = Math.cos(this._animT * 1.8) * d.speed * 0.4;
          }
          this.x += this.vx * dt; this.y += this.vy * dt;
          break;
        }

        case 'teleShooter': {
          this.timer -= dt;
          if (seesPlayer || distP < 300) {
            this.shootCd -= dt;
            if (this.shootCd <= 0) {
              this.shootCd = d.cd;
              const ang = Math.atan2(py - cy, px - cx);
              scene.projectiles.push(new RN.Projectile(cx, cy, Math.cos(ang) * 240, Math.sin(ang) * 240, false, d.shot, d.dmg));
              RN.Audio.sfx('shot');
            }
            if (this.timer <= 0) {
              // انتقال آني بعيدًا عن اللاعب
              scene.particles.burst(cx, cy, 12, { color: d.color, speed: 130, size: 3, life: 0.5, glow: true });
              this.x = this.homeX + U.rand(-120, 120);
              this.timer = U.rand(2.5, 4);
              scene.particles.burst(this.x + this.w / 2, cy, 12, { color: d.color, speed: 130, size: 3, life: 0.5, glow: true });
            }
          }
          break;
        }
      }

      // أثر نار البزاقة البركانية
      if (d.trail && this._onGround && Math.random() < 0.1) {
        scene.particles.spawn({ x: cx, y: this.y + this.h - 2, vy: -20, color: '#ff8a3a', size: 3, life: 0.8, glow: true });
      }

      // إيذاء اللاعب بالتلامس
      if (!p.dead && U.aabb(this.box(), p.box())) {
        const snapping = d.ai === 'ambushStatic' && this.state !== 'snap' ? false : true;
        if (snapping) p.hurt(scene, d.dmg, Math.sign(px - cx) || 1);
      }
    }

    _walk(level, dt, speed, chasing) {
      this.vx = this.dir * speed;
      this._gravity(level, dt);
      const front = this.dir > 0 ? this.x + this.w + 4 : this.x - 4;
      // الالتفاف عند الحواف والجدران (إلا أثناء المطاردة عند الحافة — يتوقف)
      if (this._onGround) {
        const noGround = !RN.Physics.groundAhead(level, front, this.y + this.h);
        const wall = RN.Physics.wallAhead(level, front, this.y + this.h / 2);
        if (wall || (noGround && !chasing)) this.dir *= -1;
        else if (noGround && chasing) this.vx = 0;
      }
    }

    _gravity(level, dt) {
      this.vy = Math.min(this.vy + 1900 * dt, 900);
      const actor = { x: this.x, y: this.y, w: this.w, h: this.h, vx: this.vx, vy: this.vy };
      const res = RN.Physics.moveActor(level, actor, dt);
      this.x = actor.x; this.y = actor.y; this.vx = actor.vx; this.vy = actor.vy;
      this._onGround = res.onGround;
      if (res.onWall) this.dir = -res.onWall;
    }

    /* ---------------- الرسم ---------------- */
    render(ctx, camX, camY, time) {
      if (this.dead) return;
      const x = this.x - camX, y = this.y - camY;
      if (x < -80 || x > RN.VW + 80) return;
      const d = this.def;
      ctx.save();
      ctx.translate(x + this.w / 2, y + this.h);
      if (this._visible !== undefined && this.type === 'shadowGhost') ctx.globalAlpha = this._visible;
      if (this.flash > 0) { ctx.globalAlpha = 0.5; }
      if (this.frozen > 0) { ctx.filter = 'saturate(0.3) brightness(1.4)'; }
      ctx.scale(this.dir, 1);
      const c = d.color, cd = U.shade(c, -0.25), cl = U.shade(c, 0.3);
      const wob = Math.sin(this._animT * 8) * 2;
      const t = this.type;

      if (t === 'beetle' || t === 'rockCrawler' || t === 'lavaSlug') {
        // جسم زاحف بقبة
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = cd;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
        // أشواك القشرة (تكيف/طبيعة)
        if (d.spiky || this.adapted) {
          ctx.fillStyle = cd;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 7 - 3, -this.h + 3);
            ctx.lineTo(i * 7, -this.h - 7);
            ctx.lineTo(i * 7 + 3, -this.h + 3);
            ctx.closePath(); ctx.fill();
          }
        }
        if (d.trail) { // توهج حمم
          ctx.fillStyle = '#ffb84a';
          ctx.beginPath(); ctx.ellipse(0, -4, this.w / 2 - 3, 4, 0, 0, 7); ctx.fill();
        }
        // أرجل متحركة
        ctx.strokeStyle = cd; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 10, -4);
          ctx.lineTo(i * 10 + Math.sin(this._animT * 12 + i) * 4, 0);
          ctx.stroke();
        }
        this._eye(ctx, this.w / 2 - 8, -this.h + 8, 4);
      } else if (t === 'wasp' || t === 'frostBat') {
        // أجنحة
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const flap = Math.sin(this._animT * 25) * 0.6;
        ctx.save(); ctx.rotate(-0.5 + flap);
        ctx.beginPath(); ctx.ellipse(0, -this.h + 2, 13, 6, 0, 0, 7); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(0.5 - flap);
        ctx.beginPath(); ctx.ellipse(0, -this.h + 2, 13, 6, 0, 0, 7); ctx.fill();
        ctx.restore();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2 - 2, 0, 0, 7); ctx.fill();
        if (t === 'wasp') {
          ctx.fillStyle = '#3a3020';
          ctx.fillRect(-this.w / 2 + 4, -this.h / 2 - 5, 5, 10);
          ctx.fillRect(-this.w / 2 + 13, -this.h / 2 - 6, 5, 12);
          // إبرة
          ctx.fillStyle = cd;
          ctx.beginPath(); ctx.moveTo(-this.w / 2, -this.h / 2); ctx.lineTo(-this.w / 2 - 7, -this.h / 2); ctx.lineTo(-this.w / 2, -this.h / 2 + 4); ctx.closePath(); ctx.fill();
        }
        this._eye(ctx, this.w / 2 - 8, -this.h / 2 - 3, 4.5);
      } else if (t === 'plant') {
        const snap = this.state === 'snap';
        // ساق
        ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -14, 0, -this.h + 14); ctx.stroke();
        // رأس فكّي
        ctx.fillStyle = c;
        ctx.save();
        ctx.translate(0, -this.h + 10);
        ctx.rotate(snap ? -0.3 : Math.sin(time * 2) * 0.1);
        ctx.beginPath(); ctx.ellipse(0, -6, 15, snap ? 14 : 9, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#e05a7a';
        ctx.beginPath(); ctx.ellipse(0, -4, 10, snap ? 8 : 3, 0, 0, 7); ctx.fill();
        // أسنان
        ctx.fillStyle = '#ffffff';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(i * 6 - 2, -10); ctx.lineTo(i * 6, -4); ctx.lineTo(i * 6 + 2, -10); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        // أوراق
        ctx.fillStyle = '#4aa84a';
        ctx.beginPath(); ctx.ellipse(-8, -3, 9, 3.5, -0.4, 0, 7); ctx.ellipse(8, -3, 9, 3.5, 0.4, 0, 7); ctx.fill();
      } else if (t === 'hopper') {
        // فطر نطاط
        ctx.fillStyle = '#e8d8c0';
        ctx.fillRect(-7, -this.h / 2, 14, this.h / 2);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0, -this.h / 2, this.w / 2, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-8, -this.h / 2 - 6, 3.5, 0, 7); ctx.arc(5, -this.h / 2 - 9, 3, 0, 7); ctx.fill();
        this._eye(ctx, 4, -6, 3.5);
      } else if (t === 'scorpion') {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2 - 4, this.h / 2 - 2, 0, 0, 7); ctx.fill();
        // ذيل
        ctx.strokeStyle = cd; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.w / 2 - 10, -this.h / 2);
        ctx.quadraticCurveTo(this.w / 2 + 4, -this.h - 8 + wob, this.w / 2 - 4, -this.h - 12 + wob);
        ctx.stroke();
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath(); ctx.arc(this.w / 2 - 5, -this.h - 13 + wob, 3.5, 0, 7); ctx.fill();
        // كلابات أمامية
        ctx.fillStyle = cd;
        ctx.beginPath(); ctx.arc(-this.w / 2 + 2, -6, 5, 0, 7); ctx.fill();
        this._eye(ctx, -this.w / 2 + 10, -this.h + 6, 3.5);
        if (this.adapted) { // درع تكيف
          ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2 + 2, 0, Math.PI, 0); ctx.stroke();
        }
      } else if (t === 'statue' || t === 'darkKnight') {
        // تمثال/فارس
        ctx.fillStyle = c;
        U.roundRect(ctx, -this.w / 2 + 4, -this.h, this.w - 8, this.h - 6, 5); ctx.fill();
        ctx.fillStyle = cd;
        U.roundRect(ctx, -this.w / 2 + 6, -this.h + 4, this.w - 12, 14, 4); ctx.fill();
        // عيون متوهجة
        const glow = this.state === 'active' || this.alerted ? 1 : 0.3;
        ctx.fillStyle = t === 'statue' ? `rgba(255,180,60,${glow})` : `rgba(160,80,255,${glow})`;
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
        ctx.fillRect(-8, -this.h + 8, 5, 3.5);
        ctx.fillRect(3, -this.h + 8, 5, 3.5);
        ctx.shadowBlur = 0;
        // درع وسيف للفارس
        if (t === 'darkKnight') {
          ctx.fillStyle = '#5a5a7a';
          ctx.beginPath(); ctx.ellipse(-this.w / 2 - 2, -this.h / 2, 6, 13, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#8a8aad'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(this.w / 2 - 2, -this.h / 2); ctx.lineTo(this.w / 2 + 8, -this.h + 4); ctx.stroke();
        } else {
          // شقوق التمثال
          ctx.strokeStyle = U.shade(c, -0.35); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-5, -this.h + 20); ctx.lineTo(2, -this.h + 30); ctx.lineTo(-3, -this.h + 40); ctx.stroke();
        }
      } else if (t === 'vulture' || t === 'stormBird' || t === 'cometHawk') {
        const flap = this.state === 'dive' ? 0.2 : Math.sin(this._animT * 8) * 0.7;
        ctx.fillStyle = c;
        // جناحان
        ctx.save(); ctx.rotate(-flap * 0.6);
        ctx.beginPath(); ctx.ellipse(-6, -this.h / 2 - 4, 17, 6, -0.35, 0, 7); ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2 - 6, this.h / 2 - 3, 0, 0, 7); ctx.fill();
        // رأس ومنقار
        ctx.fillStyle = t === 'vulture' ? '#d8c8b8' : cl;
        ctx.beginPath(); ctx.arc(this.w / 2 - 10, -this.h + 4, 6, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8a83a';
        ctx.beginPath(); ctx.moveTo(this.w / 2 - 5, -this.h + 3); ctx.lineTo(this.w / 2 + 4, -this.h + 6); ctx.lineTo(this.w / 2 - 5, -this.h + 8); ctx.closePath(); ctx.fill();
        this._eye(ctx, this.w / 2 - 10, -this.h + 3, 2.5);
        if (t === 'stormBird') { // شرر كهربائي
          ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.4;
          ctx.beginPath(); ctx.moveTo(-14, -this.h / 2); ctx.lineTo(-19, -this.h / 2 - 5); ctx.lineTo(-16, -this.h / 2 - 9); ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (t === 'cometHawk') { // ذيل مذنّب متوهج
          ctx.strokeStyle = '#bcecff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.globalAlpha = 0.55 + Math.sin(time * 8) * 0.3;
          ctx.beginPath(); ctx.moveTo(-this.w / 2, -this.h / 2); ctx.lineTo(-this.w / 2 - 15, -this.h / 2 - 5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-this.w / 2 + 2, -this.h / 2 + 5); ctx.lineTo(-this.w / 2 - 9, -this.h / 2 + 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else if (t === 'mummyRat' || t === 'windWisp' || t === 'starWisp') {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, 7); ctx.fill();
        if (t === 'mummyRat') {
          // لفافات
          ctx.strokeStyle = '#a89878'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-10, -this.h + 4); ctx.lineTo(8, -6); ctx.moveTo(-6, -4); ctx.lineTo(10, -this.h + 6); ctx.stroke();
          // ذيل
          ctx.beginPath(); ctx.moveTo(-this.w / 2, -6); ctx.quadraticCurveTo(-this.w / 2 - 8, -10 + wob, -this.w / 2 - 12, -4); ctx.stroke();
          // أذنان
          ctx.fillStyle = cd;
          ctx.beginPath(); ctx.arc(this.w / 2 - 8, -this.h + 1, 4, 0, 7); ctx.fill();
        } else {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = cl;
          ctx.beginPath(); ctx.ellipse(Math.sin(time * 6) * 3, -this.h / 2, this.w / 2 - 5, this.h / 2 - 5, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (t === 'starWisp') { // بريق نجمي رباعي
          ctx.fillStyle = '#fff8d0';
          ctx.globalAlpha = 0.6 + Math.sin(time * 6) * 0.35;
          ctx.save(); ctx.translate(0, -this.h / 2); ctx.rotate(time * 1.5);
          U.sparkle(ctx, this.w / 2 + 4, this.w / 2 - 3, 2);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
        this._eye(ctx, this.w / 2 - 9, -this.h / 2 - 2, 3);
      } else if (t === 'snowWolf') {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2 - 4, this.h / 2 - 3, 0, 0, 7); ctx.fill();
        // رأس
        ctx.beginPath(); ctx.arc(this.w / 2 - 8, -this.h + 6, 9, 0, 7); ctx.fill();
        // أذنان وخطم
        ctx.fillStyle = cd;
        ctx.beginPath(); ctx.moveTo(this.w / 2 - 14, -this.h - 1); ctx.lineTo(this.w / 2 - 11, -this.h - 9); ctx.lineTo(this.w / 2 - 7, -this.h - 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8f0f8';
        ctx.beginPath(); ctx.ellipse(this.w / 2 - 2, -this.h + 9, 6, 4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#2a3040';
        ctx.beginPath(); ctx.arc(this.w / 2 + 3, -this.h + 8, 2, 0, 7); ctx.fill();
        // أرجل
        ctx.strokeStyle = cd; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-10 + i * 18, -5);
          ctx.lineTo(-10 + i * 18 + Math.sin(this._animT * 12 + i * 3) * 5, 0);
          ctx.stroke();
        }
        // عين مطاردة
        this._eye(ctx, this.w / 2 - 8, -this.h + 3, 3, this.alerted ? '#e05a5a' : undefined);
        // ذيل
        ctx.strokeStyle = c; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-this.w / 2 + 4, -this.h + 6); ctx.quadraticCurveTo(-this.w / 2 - 6, -this.h + wob, -this.w / 2 - 4, -this.h - 6 + wob); ctx.stroke();
      } else if (t === 'iceGolem') {
        ctx.fillStyle = c;
        U.roundRect(ctx, -this.w / 2 + 2, -this.h, this.w - 4, this.h - 4, 8); ctx.fill();
        ctx.fillStyle = cl;
        U.roundRect(ctx, -this.w / 2 + 8, -this.h + 6, this.w - 26, 12, 4); ctx.fill();
        // بلورات على الكتف
        ctx.fillStyle = '#e8f6ff';
        for (const [bx, by, bs] of [[-14, -this.h + 2, 6], [12, -this.h + 4, 5], [0, -this.h - 4, 5]]) {
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bs, by - bs * 1.6); ctx.lineTo(bx + bs * 2, by); ctx.closePath(); ctx.fill();
        }
        this._eye(ctx, 8, -this.h + 14, 4, '#4ab0ff');
        // ذراعان ضخمتان
        ctx.fillStyle = cd;
        ctx.beginPath(); ctx.arc(-this.w / 2, -this.h / 2 + wob * 0.5, 8, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(this.w / 2, -this.h / 2 - wob * 0.5, 8, 0, 7); ctx.fill();
      } else if (t === 'icicle') {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(-this.w / 2, -this.h);
        ctx.lineTo(this.w / 2, -this.h);
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.moveTo(-3, -this.h + 3); ctx.lineTo(1, -this.h + 3); ctx.lineTo(-1, -8); ctx.closePath(); ctx.fill();
        this._eye(ctx, 3, -this.h + 10, 2.5, '#4a80c0');
      } else if (t === 'fireImp' || t === 'shadeCaster' || t === 'starSentinel') {
        // كيان طافٍ بلهب/ظل
        const fl = Math.sin(this._animT * 10) * 3;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(-this.w / 2, 0);
        ctx.quadraticCurveTo(-this.w / 2 - 3, -this.h / 2, 0, -this.h - fl * 0.5);
        ctx.quadraticCurveTo(this.w / 2 + 3, -this.h / 2, this.w / 2, 0);
        ctx.quadraticCurveTo(0, -8 + fl * 0.3, -this.w / 2, 0);
        ctx.fill();
        ctx.fillStyle = cl;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 4, this.h / 3, 0, 0, 7); ctx.fill();
        const sentEye = t === 'shadeCaster' ? '#e8b0ff' : t === 'starSentinel' ? '#fff2c0' : '#3a2010';
        this._eye(ctx, -5, -this.h / 2 - 4, 3, sentEye);
        this._eye(ctx, 6, -this.h / 2 - 4, 3, sentEye);
      } else if (t === 'magmaTurret') {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0, -6, this.w / 2, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ff7a2a';
        const pulse = 0.6 + Math.sin(time * 4) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.beginPath(); ctx.arc(0, -this.h / 2 - 2, 7, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = cd;
        ctx.fillRect(-this.w / 2, -8, this.w, 8);
      } else if (t === 'cloudJelly' || t === 'nebulaJelly') {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0, -this.h / 2 - 4, this.w / 2, Math.PI, 0); ctx.fill();
        // أهداب
        ctx.strokeStyle = cd; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 6, -this.h / 2 - 2);
          ctx.quadraticCurveTo(i * 6 + Math.sin(this._animT * 4 + i) * 3, -6, i * 6 + Math.sin(this._animT * 4 + i) * 5, 0);
          ctx.stroke();
        }
        this._eye(ctx, -5, -this.h / 2 - 8, 3);
        this._eye(ctx, 6, -this.h / 2 - 8, 3);
        ctx.globalAlpha = 1;
      } else if (t === 'shadowGhost') {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, -this.h + 12, this.w / 2, Math.PI, 0);
        const base = 0;
        ctx.lineTo(this.w / 2, base - 6);
        for (let i = 2; i >= -2; i--) {
          ctx.quadraticCurveTo(i * 8 + 4, base - 12 + Math.sin(this._animT * 5 + i) * 3, i * 8, base - 4);
        }
        ctx.closePath(); ctx.fill();
        this._eye(ctx, -6, -this.h + 12, 3.5, '#e8d8ff');
        this._eye(ctx, 6, -this.h + 12, 3.5, '#e8d8ff');
      } else if (t === 'gargoyle') {
        ctx.fillStyle = c;
        U.roundRect(ctx, -this.w / 2 + 4, -this.h + 4, this.w - 8, this.h - 4, 6); ctx.fill();
        // أجنحة حجرية
        const spread = this.state === 'fall' || this.state === 'chase' ? 1 : 0.3;
        ctx.fillStyle = cd;
        ctx.beginPath();
        ctx.moveTo(-this.w / 2 + 4, -this.h + 10);
        ctx.lineTo(-this.w / 2 - 12 * spread, -this.h - 4 * spread);
        ctx.lineTo(-this.w / 2 + 2, -this.h + 16);
        ctx.closePath(); ctx.fill();
        // قرنان
        ctx.beginPath(); ctx.moveTo(-6, -this.h + 5); ctx.lineTo(-8, -this.h - 4); ctx.lineTo(-2, -this.h + 6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, -this.h + 5); ctx.lineTo(8, -this.h - 4); ctx.lineTo(2, -this.h + 6); ctx.closePath(); ctx.fill();
        this._eye(ctx, -5, -this.h + 12, 3, '#ff6a4a');
        this._eye(ctx, 6, -this.h + 12, 3, '#ff6a4a');
      } else if (t === 'skyDrake') {
        // تنين صغير
        const flap = Math.sin(this._animT * 9) * 0.6;
        ctx.fillStyle = cd;
        ctx.save(); ctx.rotate(-flap * 0.5);
        ctx.beginPath(); ctx.moveTo(-4, -this.h / 2); ctx.lineTo(-22, -this.h - 6); ctx.lineTo(-8, -this.h / 2 + 4); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2 - 6, this.h / 2 - 4, 0, 0, 7); ctx.fill();
        // عنق ورأس
        ctx.beginPath(); ctx.arc(this.w / 2 - 10, -this.h + 4, 7, 0, 7); ctx.fill();
        ctx.fillStyle = cd;
        ctx.beginPath(); ctx.moveTo(this.w / 2 - 4, -this.h + 2); ctx.lineTo(this.w / 2 + 6, -this.h + 5); ctx.lineTo(this.w / 2 - 4, -this.h + 8); ctx.closePath(); ctx.fill();
        // ذيل
        ctx.strokeStyle = c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-this.w / 2 + 6, -this.h / 2); ctx.quadraticCurveTo(-this.w / 2 - 8, -this.h / 2 + wob, -this.w / 2 - 14, -this.h / 2 - 4 + wob); ctx.stroke();
        this._eye(ctx, this.w / 2 - 11, -this.h + 2, 2.5, '#ffd24a');
      } else {
        // شكل افتراضي
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, -this.h / 2, this.w / 2, this.h / 2, 0, 0, 7); ctx.fill();
        this._eye(ctx, 6, -this.h / 2 - 3, 3.5);
      }

      // شريط صحة صغير عند الإصابة
      if (this.hp < this.maxHp && this.maxHp > 1) {
        ctx.scale(this.dir, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-14, -this.h - 12, 28, 4);
        ctx.fillStyle = '#e05a5a';
        ctx.fillRect(-13, -this.h - 11, 26 * (this.hp / this.maxHp), 2);
      }
      ctx.restore();
    }

    _eye(ctx, x, y, r, color) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = color || '#2a2030';
      ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.55, 0, 7); ctx.fill();
    }
  }

  RN.Enemy = Enemy;
  RN.ENEMY_DEFS = DEFS;
})();
