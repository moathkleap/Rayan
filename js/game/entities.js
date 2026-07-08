'use strict';
/* ============================================================
   Rayan & Naya — الكيانات التفاعلية
   كريستالات، مفاتيح، أبواب، صناديق كنوز، قوى، نقاط حفظ،
   روافع، أزرار، لوحات ضغط، صناديق دفع، مشاعل، مرايا ليزر،
   منصات متحركة، زنبركات، مناطق سرية، مقذوفات
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;

  /* ---------- المقذوفات (لاعب وأعداء) ---------- */
  class Projectile {
    constructor(x, y, vx, vy, friendly, kind, dmg) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.friendly = friendly; this.kind = kind || 'energy';
      this.dmg = dmg || 1; this.life = 2.2; this.dead = false;
    }
    update(scene, dt) {
      this.life -= dt;
      if (this.life <= 0) { this.dead = true; return; }
      if (this.kind === 'magma' || this.kind === 'web' || this.kind === 'rock') this.vy += 900 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const tx = Math.floor(this.x / 32), ty = Math.floor(this.y / 32);
      if (RN.Physics.isSolid(scene.level.tileAt(tx, ty))) {
        this.dead = true;
        scene.particles.burst(this.x, this.y, 6, { color: this.color(), speed: 90, size: 2.5, life: 0.4 });
        return;
      }
      if (this.friendly) {
        for (const e of scene.enemies) {
          if (!e.dead && U.aabb({ x: this.x - 5, y: this.y - 5, w: 10, h: 10 }, e)) {
            e.hurt(scene, this.dmg, this.vx > 0 ? 1 : -1);
            this.dead = true;
            return;
          }
        }
        if (scene.boss && !scene.boss.dead && U.aabb({ x: this.x - 5, y: this.y - 5, w: 10, h: 10 }, scene.boss.hitbox())) {
          scene.boss.hurt(scene, this.dmg);
          this.dead = true;
        }
      } else {
        const p = scene.player;
        if (U.aabb({ x: this.x - 5, y: this.y - 5, w: 10, h: 10 }, p.box())) {
          p.hurt(scene, this.dmg, this.vx > 0 ? 1 : -1);
          this.dead = true;
        }
      }
    }
    color() {
      return { energy: '#5ad8ff', fire: '#ff8a2a', ice: '#8ae0ff', web: '#e8e8d8', magma: '#ff6a1e', shadow: '#a05aff', lightning: '#ffe14a', rock: '#8a7a6a', sand: '#e0c070' }[this.kind] || '#ffffff';
    }
    render(ctx, camX, camY, time) {
      const x = this.x - camX, y = this.y - camY;
      ctx.fillStyle = this.color();
      ctx.shadowColor = this.color(); ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x, y, this.kind === 'magma' || this.kind === 'rock' ? 7 : 5, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(x - this.vx * 0.008, y - this.vy * 0.008, 2.5, 0, 7); ctx.fill();
    }
  }

  const Entities = {
    update(scene, dt) {
      const level = scene.level, p = scene.player;
      const pb = p.box();
      for (const e of level.entities) {
        switch (e.type) {
          case 'crystal': {
            if (e.taken) break;
            // مغناطيس
            const magR = 40 + (RN.Save.data.upgrades.magnet * 45) + (p.powerups.magnet > 0 ? 160 : 0);
            const d = U.dist(e.x, e.y, p.x + p.w / 2, p.y + p.h / 2);
            if (d < magR) {
              const ang = Math.atan2(p.y + p.h / 2 - e.y, p.x + p.w / 2 - e.x);
              e.x += Math.cos(ang) * 320 * dt;
              e.y += Math.sin(ang) * 320 * dt;
            }
            if (d < 26) {
              e.taken = true;
              scene.collectCrystal(e.big ? 5 : 1, e.x, e.y);
            }
            break;
          }
          case 'key': {
            if (e.taken) break;
            if (U.aabb({ x: e.x - 12, y: e.y - 12, w: 24, h: 24 }, pb)) {
              e.taken = true;
              p.keys[e.id] = true;
              RN.Audio.sfx('key');
              scene.particles.burst(e.x, e.y, 12, { color: '#ffd700', speed: 120, size: 3, life: 0.6, glow: true });
              scene.toast('🗝 ' + RN.t('keys'));
            }
            break;
          }
          case 'door': {
            if (e.open) break;
            if (p.keys[e.id] && U.aabb({ x: e.x - 40, y: e.y, w: 96, h: 128 }, pb)) {
              e.open = true;
              level.openGate(e.id);
              RN.Audio.sfx('door');
              scene.particles.burst(e.x + 32, e.y + 64, 20, { color: '#ffd700', speed: 150, size: 3, life: 0.7 });
            }
            break;
          }
          case 'chest': {
            if (e.opened) break;
            if (U.aabb({ x: e.x - 20, y: e.y - 28, w: 40, h: 28 }, pb) && (RN.Input.justPressed('down') || p.attacking)) {
              e.opened = true;
              RN.Audio.sfx('chest');
              RN.Save.data.statsCounters.chests++;
              if (e.contents === 'relic') scene.foundRelic(e.relicId, e.x, e.y - 20);
              else {
                scene.collectCrystal(e.amount || 15, e.x, e.y - 20);
                scene.particles.burst(e.x, e.y - 16, 20, { color: '#7ae0ff', speed: 160, size: 3, life: 0.8, glow: true });
              }
            }
            break;
          }
          case 'powerup': {
            if (e.taken) break;
            if (U.aabb({ x: e.x - 13, y: e.y - 13, w: 26, h: 26 }, pb)) {
              e.taken = true;
              p.applyPowerup(e.kind);
              scene.particles.burst(e.x, e.y, 16, { color: RN.C.POWERUPS[e.kind].color, speed: 140, size: 3, life: 0.7, glow: true });
            }
            break;
          }
          case 'checkpoint': {
            if (!e.active && U.aabb({ x: e.x - 8, y: e.y - 40, w: 48, h: 72 }, pb)) {
              e.active = true;
              scene.setCheckpoint(e.x, e.y - 40);
              RN.Audio.sfx('checkpoint');
              RN.Save.auto();
            }
            break;
          }
          case 'goalGate': {
            if (!scene.finished && U.aabb({ x: e.x - 10, y: e.y - 96, w: 68, h: 96 }, pb)) {
              scene.completeLevel();
            }
            break;
          }
          case 'lever': {
            if (!e.on && U.aabb({ x: e.x - 10, y: e.y - 20, w: 44, h: 52 }, pb) && (RN.Input.justPressed('down') || p.attacking)) {
              e.on = true;
              RN.Audio.sfx('lever');
              if (e.action === 'bridge') level.buildBridge(e.id);
              else level.openGate(e.id);
              RN.Engine.doShake(3);
            }
            break;
          }
          case 'button': {
            const on = U.aabb({ x: e.x, y: e.y - 6, w: 32, h: 14 }, pb);
            if (on && e.timer <= 0) {
              e.timer = e.dur;
              level.openGate(e.id);
              RN.Audio.sfx('button');
            }
            if (e.timer > 0) {
              e.timer -= dt;
              if (e.timer <= 0) {
                // لا تُغلق البوابة فوق اللاعب
                const cells = level.gates[e.id] || [];
                const inGate = cells.some(([tx, ty]) => U.aabb({ x: tx * 32, y: ty * 32, w: 32, h: 32 }, pb));
                if (inGate) e.timer = 0.4;
                else { level.closeGate(e.id); RN.Audio.sfx('button'); }
              }
            }
            break;
          }
          case 'plate': {
            let on = U.aabb({ x: e.x, y: e.y - 6, w: 32, h: 14 }, pb);
            for (const b of level.entities) {
              if (b.type === 'box' && U.aabb({ x: e.x, y: e.y - 6, w: 32, h: 14 }, { x: b.x, y: b.y, w: 30, h: 30 })) on = true;
            }
            if (on && !e.pressed) { e.pressed = true; level.openGate(e.id); RN.Audio.sfx('button'); }
            if (!on && e.pressed) { e.pressed = false; level.closeGate(e.id); }
            break;
          }
          case 'box': {
            e.vy += 1900 * dt;
            e.vx *= Math.pow(0.72, dt * 60);
            // دفع اللاعب
            const bb = { x: e.x, y: e.y, w: 30, h: 30 };
            if (U.aabb({ x: pb.x - 2, y: pb.y, w: pb.w + 4, h: pb.h }, bb) && p.onGround) {
              const push = p.x + p.w / 2 < e.x + 15 ? 1 : -1;
              if ((push === 1 && RN.Input.down('right')) || (push === -1 && RN.Input.down('left'))) {
                e.vx = push * 70;
              }
            }
            const actor = { x: e.x, y: e.y, w: 30, h: 30, vx: e.vx, vy: e.vy };
            RN.Physics.moveActor(level, actor, dt);
            e.x = actor.x; e.y = actor.y; e.vx = actor.vx; e.vy = actor.vy;
            break;
          }
          case 'torch': {
            if (!e.lit && p.attacking && U.dist(e.x, e.y, p.x + p.w / 2 + p.facing * 30, p.y + p.h / 2) < 38) {
              e.lit = true;
              RN.Audio.sfx('fire');
              scene.particles.burst(e.x, e.y - 10, 12, { color: '#ff9a3a', speed: 80, size: 3, life: 0.6, glow: true });
              const all = level.entities.filter((o) => o.type === 'torch' && o.id === e.id);
              if (all.every((o) => o.lit)) { level.openGate(e.id); RN.Audio.sfx('door'); scene.toast('✨'); }
            }
            break;
          }
          case 'mirror': {
            if (p.attacking && !e._hitCd && U.dist(e.x, e.y - 16, p.x + p.w / 2 + p.facing * 30, p.y + p.h / 2) < 40) {
              e.state = (e.state + 1) % 2;
              e._hitCd = 0.4;
              RN.Audio.sfx('ui');
              const all = level.entities.filter((o) => o.type === 'mirror' && o.id === e.id);
              if (all.every((o) => o.state === o.want)) { level.openGate(e.id); RN.Audio.sfx('door'); scene.toast('✨'); }
            }
            if (e._hitCd) e._hitCd = Math.max(0, e._hitCd - dt);
            break;
          }
          case 'movingPlatform': {
            e.t = (e.t || 0) + dt;
            const prev = { x: e.x, y: e.y };
            const osc = Math.sin(e.t * (e.speed / 60));
            if (e.axis === 'x') e._ox = osc * e.range;
            else e._oy = osc * e.range;
            const nx = e.x0 !== undefined ? e.x0 + (e._ox || 0) : (e.x0 = e.x, e.y0 = e.y, e.x);
            const ny = e.y0 + (e._oy || 0);
            e.dx = nx - prev.x; e.dy = ny - prev.y;
            e.x = nx; e.y = ny;
            // حمل اللاعب
            if (p.vy >= 0 && pb.x + pb.w > e.x && pb.x < e.x + e.w &&
              Math.abs(pb.y + pb.h - e.y) < 10 + Math.abs(e.dy) && p.vy * dt >= e.dy - 8) {
              p.y = e.y - p.h - 0.01;
              p.vy = 0;
              p.onGround = true;
              p._ridingPlat = { dx: e.dx, dy: e.dy };
            }
            break;
          }
          case 'spring': {
            if (U.aabb({ x: e.x, y: e.y - 6, w: 32, h: 20 }, pb) && p.vy > 50) {
              p.vy = -1080;
              p.springT = 0.3;
              e.anim = 0.25;
              RN.Audio.sfx('doubleJump');
            }
            if (e.anim) e.anim = Math.max(0, e.anim - dt);
            break;
          }
          case 'secretZone': {
            if (!e.found && U.aabb(e, pb)) {
              e.found = true;
              scene.onSecretFound();
            }
            break;
          }
        }
      }
      // مقذوفات
      for (let i = scene.projectiles.length - 1; i >= 0; i--) {
        const pr = scene.projectiles[i];
        pr.update(scene, dt);
        if (pr.dead) scene.projectiles.splice(i, 1);
      }
    },

    render(scene, ctx, camX, camY, time) {
      const level = scene.level;
      for (const e of level.entities) {
        const x = e.x - camX, y = e.y - camY;
        if (x < -80 || x > RN.VW + 80 || y < -80 || y > RN.VH + 80) continue;
        switch (e.type) {
          case 'crystal': {
            if (e.taken) break;
            const bob = Math.sin(time * 3 + e.x * 0.05) * 3;
            const s = e.big ? 1.7 : 1;
            ctx.save();
            ctx.translate(x, y + bob);
            ctx.scale(s, s);
            ctx.rotate(Math.sin(time * 2 + e.x) * 0.15);
            const cm = RN.Save.settings.colorMode;
            const col = cm === 1 ? '#4ab0ff' : cm === 2 ? '#ffd24a' : '#4ae0d8';
            ctx.fillStyle = col;
            ctx.shadowColor = col; ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, -9); ctx.lineTo(6, -3); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.lineTo(-6, -3);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(1, -4); ctx.lineTo(-1, 2); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
            ctx.restore();
            break;
          }
          case 'key': {
            if (e.taken) break;
            const bob = Math.sin(time * 3) * 3;
            ctx.save();
            ctx.translate(x, y + bob);
            ctx.strokeStyle = '#ffd700'; ctx.fillStyle = '#ffd700'; ctx.lineWidth = 3;
            ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(0, -5, 5, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke();
            ctx.fillRect(0, 5, 5, 2.5); ctx.fillRect(0, 9, 4, 2.5);
            ctx.shadowBlur = 0;
            ctx.restore();
            break;
          }
          case 'door': {
            if (e.open) break;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(x + 32, y + 60, 7, 0, 7); ctx.fill();
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(x + 29, y + 58, 6, 9);
            break;
          }
          case 'chest': {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = '#8a5a2a';
            U.roundRect(ctx, -16, e.opened ? -14 : -22, 32, e.opened ? 14 : 22, 4); ctx.fill();
            ctx.fillStyle = '#a8763e';
            U.roundRect(ctx, -16, e.opened ? -14 : -22, 32, 8, 4); ctx.fill();
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, e.opened ? -10 : -16, 6, 8);
            if (e.opened) {
              ctx.fillStyle = 'rgba(255,220,80,0.35)';
              ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-8, -34); ctx.lineTo(8, -34); ctx.lineTo(14, -14); ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            break;
          }
          case 'powerup': {
            if (e.taken) break;
            const pu = RN.C.POWERUPS[e.kind];
            const bob = Math.sin(time * 2.5 + e.x) * 4;
            ctx.save();
            ctx.translate(x, y + bob);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill();
            ctx.strokeStyle = pu.color; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 0, 15, time * 1.5, time * 1.5 + 4.6); ctx.stroke();
            ctx.fillStyle = pu.color;
            ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(pu.icon, 0, 1);
            ctx.restore();
            break;
          }
          case 'checkpoint': {
            ctx.save();
            ctx.translate(x + 16, y + 40);
            ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44); ctx.stroke();
            const wave = Math.sin(time * 4) * 3;
            ctx.fillStyle = e.active ? '#4ae08a' : '#8a8a9a';
            ctx.beginPath();
            ctx.moveTo(0, -44);
            ctx.quadraticCurveTo(12, -40 + wave, 22, -42 + wave);
            ctx.lineTo(22, -30 + wave);
            ctx.quadraticCurveTo(12, -28 + wave, 0, -32);
            ctx.closePath(); ctx.fill();
            ctx.restore();
            break;
          }
          case 'goalGate': {
            ctx.save();
            ctx.translate(x + 24, y);
            // بوابة متوهجة
            const grad = ctx.createLinearGradient(0, -90, 0, 0);
            grad.addColorStop(0, 'rgba(120,220,255,0.9)');
            grad.addColorStop(1, 'rgba(120,220,255,0.15)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, -45, 26 + Math.sin(time * 3) * 2, 46, 0, 0, 7);
            ctx.fill();
            ctx.strokeStyle = '#bfeaff'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, -45, 28, 48, 0, 0, 7);
            ctx.stroke();
            // شرر
            for (let i = 0; i < 3; i++) {
              const a = time * 2 + i * 2.1;
              ctx.fillStyle = 'rgba(255,255,255,0.8)';
              ctx.beginPath(); ctx.arc(Math.cos(a) * 24, -45 + Math.sin(a) * 42, 2, 0, 7); ctx.fill();
            }
            ctx.restore();
            break;
          }
          case 'lever': {
            ctx.save();
            ctx.translate(x + 12, y + 26);
            ctx.fillStyle = '#5a5a6a';
            U.roundRect(ctx, -10, -6, 20, 10, 3); ctx.fill();
            ctx.strokeStyle = e.on ? '#4ae08a' : '#c0c0d0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, -4);
            ctx.lineTo(e.on ? 10 : -10, -20); ctx.stroke();
            ctx.fillStyle = e.on ? '#4ae08a' : '#e05a5a';
            ctx.beginPath(); ctx.arc(e.on ? 10 : -10, -20, 4.5, 0, 7); ctx.fill();
            ctx.restore();
            break;
          }
          case 'button': {
            ctx.fillStyle = '#5a5a6a';
            U.roundRect(ctx, x + 2, y + 20, 28, 10, 3); ctx.fill();
            ctx.fillStyle = e.timer > 0 ? '#4ae08a' : '#e0b04a';
            U.roundRect(ctx, x + 6, y + (e.timer > 0 ? 26 : 22), 20, 6, 2); ctx.fill();
            if (e.timer > 0) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
              ctx.fillText(Math.ceil(e.timer), x + 16, y + 8);
            }
            break;
          }
          case 'plate': {
            ctx.fillStyle = '#6a6a7a';
            U.roundRect(ctx, x + 2, y + (e.pressed ? 26 : 23), 28, e.pressed ? 6 : 9, 2); ctx.fill();
            ctx.fillStyle = e.pressed ? '#4ae08a' : '#9a9aaa';
            ctx.fillRect(x + 6, y + (e.pressed ? 27 : 24), 20, 2);
            break;
          }
          case 'box': {
            ctx.fillStyle = '#9a6a3a';
            U.roundRect(ctx, x, y, 30, 30, 3); ctx.fill();
            ctx.strokeStyle = '#7a5028'; ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, 24, 24);
            ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + 27, y + 27);
            ctx.moveTo(x + 27, y + 3); ctx.lineTo(x + 3, y + 27); ctx.stroke();
            break;
          }
          case 'torch': {
            ctx.save();
            ctx.translate(x, y + 16);
            ctx.fillStyle = '#6a5028';
            ctx.fillRect(-3, -14, 6, 22);
            ctx.fillStyle = '#4a4a5a';
            ctx.beginPath(); ctx.arc(0, -16, 6, Math.PI, 0); ctx.fill();
            if (e.lit) {
              const fl = Math.sin(time * 12 + e.x) * 2;
              ctx.fillStyle = '#ff9a3a';
              ctx.shadowColor = '#ff9a3a'; ctx.shadowBlur = 14;
              ctx.beginPath();
              ctx.moveTo(-5, -18);
              ctx.quadraticCurveTo(0, -34 - fl, 5, -18);
              ctx.closePath(); ctx.fill();
              ctx.fillStyle = '#ffe08a';
              ctx.beginPath();
              ctx.moveTo(-2.5, -18);
              ctx.quadraticCurveTo(0, -27 - fl, 2.5, -18);
              ctx.closePath(); ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.restore();
            break;
          }
          case 'beamSource': {
            ctx.fillStyle = '#8a5cff';
            U.roundRect(ctx, x, y, 14, 32, 3); ctx.fill();
            ctx.fillStyle = '#c8a8ff';
            ctx.beginPath(); ctx.arc(x + 7, y + 10, 4 + Math.sin(time * 4) * 1, 0, 7); ctx.fill();
            // شعاع عند الحل
            const solved = !scene.level.gates[e.id] || scene.level.gates[e.id].every(([tx, ty]) => scene.level.tileAt(tx, ty) !== RN.C.T.GATE);
            if (solved) {
              ctx.strokeStyle = 'rgba(180,120,255,0.8)';
              ctx.shadowColor = '#b478ff'; ctx.shadowBlur = 10;
              ctx.lineWidth = 3;
              ctx.beginPath(); ctx.moveTo(x + 14, y + 10); ctx.lineTo(x + 400, y + 10); ctx.stroke();
              ctx.shadowBlur = 0;
            }
            break;
          }
          case 'mirror': {
            ctx.save();
            ctx.translate(x, y + 16);
            ctx.fillStyle = '#6a6a8a';
            ctx.fillRect(-4, -10, 8, 26);
            ctx.rotate(e.state === 1 ? -0.78 : 0.78);
            ctx.fillStyle = '#c8e8ff';
            ctx.strokeStyle = '#8a8ab0'; ctx.lineWidth = 2;
            U.roundRect(ctx, -3, -26, 6, 22, 3); ctx.fill(); ctx.stroke();
            ctx.restore();
            break;
          }
          case 'movingPlatform': {
            ctx.fillStyle = scene.level.wi === 4 ? 'rgba(255,255,255,0.95)' : '#8a7a9a';
            U.roundRect(ctx, x, y, e.w, 14, 6); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(x + 4, y + 2, e.w - 8, 4);
            break;
          }
          case 'spring': {
            const sq = e.anim ? 0.5 : 1;
            ctx.fillStyle = '#c0c0d0';
            ctx.save();
            ctx.translate(x + 16, y + 28);
            ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.ellipse(0, -i * 6 * sq - 3, 10, 3, 0, 0, 7);
              ctx.stroke();
            }
            ctx.fillStyle = '#e05a5a';
            U.roundRect(ctx, -12, -22 * sq - 6, 24, 6, 3); ctx.fill();
            ctx.restore();
            break;
          }
        }
      }
      for (const pr of scene.projectiles) pr.render(ctx, camX, camY, time);
    },
  };

  RN.Entities = Entities;
  RN.Projectile = Projectile;
})();
