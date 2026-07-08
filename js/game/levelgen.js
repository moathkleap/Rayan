'use strict';
/* ============================================================
   Rayan & Naya — مولّد المراحل
   48 مرحلة (6 عوالم × 8) مبنية ببذور ثابتة: تصميم متدرج الصعوبة،
   كل مرحلة تقدم مزيجًا جديدًا: فجوات، منصات، أشواك، جسور منهارة،
   تسلق، ألغاز (مفاتيح/روافع/أزرار/صناديق/مشاعل/مرايا)، أسرار
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = RN.U;
  const C = () => RN.C;
  const T = () => RN.C.T;

  class Level {
    constructor(wi, li) {
      this.wi = wi;
      this.li = li;
      this.isBoss = li === C().LEVELS_PER_WORLD - 1;
      this.world = C().WORLDS[wi];
      this.h = 30;
      this.w = this.isBoss ? 64 : 120 + li * 12 + wi * 8;
      this.tiles = new Uint8Array(this.w * this.h);
      // خطوة الصف الثابتة للتخزين: تُحسب مرة عند التخصيص ولا تتغير.
      // العرض this.w قد يُقلَّم لاحقًا (للكاميرا/الخريطة) لكن idx يجب أن
      // يبقى على نفس الخطوة وإلا انزاحت كل قراءات البلاطات وفسدت الأرضية.
      this.stride = this.w;
      this.entities = [];
      this.enemies = [];
      this.gates = {};       // gateId -> [[tx,ty],...]
      this.crystalTotal = 0;
      this.secretTotal = 0;
      this.spawn = { x: 3 * 32, y: 20 * 32 };
      this.goal = null;
      this._decorSeed = (wi * 13 + li) * 971 + 31;
      if (this.isBoss) this._genBossArena();
      else this._generate();
    }

    idx(tx, ty) { return ty * this.stride + tx; }
    tileAt(tx, ty) {
      if (tx < 0 || tx >= this.w) return T().SOLID; // جدران جانبية
      if (ty < 0) return T().EMPTY;
      if (ty >= this.h) return T().EMPTY;
      return this.tiles[this.idx(tx, ty)];
    }
    setTile(tx, ty, id) {
      if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return;
      this.tiles[this.idx(tx, ty)] = id;
    }
    fillCol(tx, top, id, liquidTop) {
      for (let ty = top; ty < this.h; ty++) this.setTile(tx, ty, id);
      if (liquidTop !== undefined) {
        for (let ty = liquidTop; ty < this.h; ty++) this.setTile(tx, ty, this.wi === 3 ? T().LAVA : T().WATER);
      }
    }
    addGateTiles(id, cells) {
      this.gates[id] = cells;
      for (const [tx, ty] of cells) this.setTile(tx, ty, T().GATE);
    }
    openGate(id) {
      const cells = this.gates[id];
      if (!cells) return;
      for (const [tx, ty] of cells) if (this.tileAt(tx, ty) === T().GATE) this.setTile(tx, ty, T().EMPTY);
    }
    closeGate(id) {
      const cells = this.gates[id];
      if (!cells) return;
      for (const [tx, ty] of cells) if (this.tileAt(tx, ty) === T().EMPTY) this.setTile(tx, ty, T().GATE);
    }
    buildBridge(id) {
      const cells = this.gates[id];
      if (!cells) return;
      for (const [tx, ty] of cells) this.setTile(tx, ty, T().PLATFORM);
    }

    ent(type, props) {
      const e = Object.assign({ type }, props);
      this.entities.push(e);
      return e;
    }
    crystal(tx, ty, big) {
      this.ent('crystal', { x: tx * 32 + 16, y: ty * 32 + 16, big: !!big, taken: false });
      this.crystalTotal += big ? 5 : 1;
    }

    /* ================= التوليد ================= */
    _generate() {
      const wi = this.wi, li = this.li;
      const rng = U.rng((wi * 8 + li) * 7919 + 137);
      const diffT = (wi * 8 + li) / 47; // 0..1 صعوبة عالمية
      const g = { rng, x: 0, groundY: 22, diffT };

      // منطقة البداية الآمنة
      this._flat(g, 7, { safe: true });
      this.spawn = { x: 3 * 32, y: (g.groundY - 3) * 32 };

      const segs = ['flat', 'gap', 'steps', 'platforms', 'spikes', 'crumble', 'flat', 'climb'];
      const puzzleAt = [0.38, 0.72];
      let puzzleDone = 0;
      let secretDone = 0;
      const secretAt = [0.25, 0.55, 0.85];
      const checkpointAt = [0.34, 0.67];
      let checkpointDone = 0;

      while (g.x < this.w - 18) {
        const prog = g.x / this.w;
        // مواضع الألغاز
        if (puzzleDone < puzzleAt.length && prog > puzzleAt[puzzleDone]) {
          this._puzzle(g, puzzleDone);
          puzzleDone++;
          continue;
        }
        if (secretDone < secretAt.length && prog > secretAt[secretDone] && li > 0) {
          this._secret(g, secretDone);
          secretDone++;
          continue;
        }
        if (checkpointDone < checkpointAt.length && prog > checkpointAt[checkpointDone]) {
          this._flat(g, 4, { safe: true });
          this.ent('checkpoint', { x: (g.x - 2) * 32, y: (g.groundY - 1) * 32, active: false });
          checkpointDone++;
          continue;
        }
        // اختيار مقطع موزون بالصعوبة
        let pool;
        if (li === 0) pool = ['flat', 'flat', 'steps', 'gap', 'platforms', 'flat'];
        else if (li < 3) pool = ['flat', 'gap', 'steps', 'platforms', 'spikes', 'flat', 'crumble'];
        else pool = ['flat', 'gap', 'steps', 'platforms', 'spikes', 'crumble', 'climb', 'platforms', 'gap'];
        const seg = U.rngPick(rng, pool);
        this['_' + seg](g);
      }

      // نهاية المرحلة: أرض مستقرة + بوابة الهدف
      this._flat(g, 10, { safe: true });
      this.goal = { x: (g.x - 4) * 32, y: (g.groundY - 4) * 32 };
      this.ent('goalGate', { x: this.goal.x, y: (g.groundY) * 32 });
      this.w = Math.min(this.w, g.x + 2);
    }

    _groundTile() {
      if (this.wi === 2) return T().ICE;
      return T().SOLID;
    }

    _flat(g, len, opts) {
      opts = opts || {};
      len = len || U.rngi(g.rng, 6, 11);
      const gt = this._groundTile();
      // رمال متحركة في الصحراء أحيانًا
      const sandy = this.wi === 1 && !opts.safe && g.rng() < 0.3;
      for (let i = 0; i < len; i++) {
        this.fillCol(g.x + i, g.groundY, sandy ? T().SAND : gt);
      }
      if (!opts.safe) {
        // كريستالات
        if (g.rng() < 0.75) {
          const n = U.rngi(g.rng, 3, 5);
          const start = g.x + Math.floor((len - n) / 2);
          for (let i = 0; i < n; i++) this.crystal(start + i, g.groundY - 2);
        }
        // أعداء
        const maxE = g.diffT < 0.2 ? 1 : g.diffT < 0.6 ? 2 : 3;
        const n = U.rngi(g.rng, 0, Math.min(maxE, Math.floor(len / 4)));
        for (let i = 0; i < n; i++) {
          const type = U.rngPick(g.rng, this.world.enemies);
          this.enemies.push({ type, x: (g.x + 2 + i * 3 + U.rngi(g.rng, 0, 1)) * 32, y: (g.groundY - 2) * 32 });
        }
        // قوة خاصة نادرة
        if (g.rng() < 0.12) {
          const kinds = Object.keys(C().POWERUPS);
          this.ent('powerup', { x: (g.x + Math.floor(len / 2)) * 32 + 16, y: (g.groundY - 3) * 32, kind: U.rngPick(g.rng, kinds), taken: false });
        }
        // زنبرك
        if (g.rng() < 0.18) {
          this.ent('spring', { x: (g.x + len - 2) * 32, y: (g.groundY - 1) * 32 });
        }
      }
      g.x += len;
    }

    _gap(g) {
      const len = U.rngi(g.rng, 3, 4 + Math.floor(g.diffT * 3));
      const liquid = this.wi === 0 || this.wi === 2 || this.wi === 3;
      for (let i = 0; i < len; i++) {
        if (liquid) this.fillCol(g.x + i, this.h, T().EMPTY, this.h - 3);
      }
      // فجوة واسعة → منصة وسطية أو منصة متحركة
      if (len > 4) {
        if (g.rng() < 0.5 && g.diffT > 0.25) {
          this.ent('movingPlatform', {
            x: (g.x + 1) * 32, y: (g.groundY - 1) * 32, w: 96,
            axis: g.rng() < 0.5 ? 'x' : 'y', range: (len - 2) * 32 * 0.5, speed: 55 + g.diffT * 45, t: g.rng() * 6,
          });
        } else {
          const mid = g.x + Math.floor(len / 2);
          this.setTile(mid, g.groundY - (g.rng() < 0.5 ? 0 : 1), T().PLATFORM);
          this.setTile(mid - 1, g.groundY - (g.rng() < 0.5 ? 0 : 1), T().PLATFORM);
          this.crystal(mid, g.groundY - 3);
        }
      }
      g.x += len;
    }

    _steps(g) {
      const dir = g.groundY > 15 && g.rng() < 0.55 ? -1 : 1; // -1 صعود
      const n = U.rngi(g.rng, 2, 4);
      const gt = this._groundTile();
      for (let s = 0; s < n; s++) {
        const w = U.rngi(g.rng, 2, 3);
        g.groundY = U.clamp(g.groundY + dir * U.rngi(g.rng, 1, 2), 10, 25);
        for (let i = 0; i < w; i++) this.fillCol(g.x + i, g.groundY, gt);
        if (g.rng() < 0.4) this.crystal(g.x + 1, g.groundY - 2);
        g.x += w;
      }
    }

    _platforms(g) {
      const n = U.rngi(g.rng, 3, 5);
      const liquid = this.wi === 3;
      let py = g.groundY - U.rngi(g.rng, 0, 2);
      const startX = g.x;
      for (let i = 0; i < n; i++) {
        const pw = U.rngi(g.rng, 2, 3);
        const gapw = U.rngi(g.rng, 2, 3 + Math.floor(g.diffT * 2));
        for (let k = 0; k < pw; k++) {
          this.setTile(g.x + k, py, T().PLATFORM);
          if (liquid) this.fillCol(g.x + k, this.h, T().EMPTY, this.h - 3);
        }
        this.crystal(g.x + Math.floor(pw / 2), py - 2);
        if (g.rng() < 0.25 && g.diffT > 0.3) {
          const flyers = { 0: 'wasp', 1: 'vulture', 2: 'frostBat', 3: 'fireImp', 4: 'stormBird', 5: 'shadowGhost' };
          this.enemies.push({ type: flyers[this.wi], x: (g.x + 1) * 32, y: (py - 3) * 32 });
        }
        for (let k = 0; k < gapw; k++) {
          if (liquid) this.fillCol(g.x + pw + k, this.h, T().EMPTY, this.h - 3);
        }
        g.x += pw + gapw;
        py = U.clamp(py + U.rngi(g.rng, -2, 1), 9, g.groundY);
      }
      // العودة إلى الأرض
      g.groundY = U.clamp(py + U.rngi(g.rng, 1, 2), 12, 25);
      this._flat(g, 3, { safe: true });
    }

    _spikes(g) {
      const len = U.rngi(g.rng, 3, 5);
      const gt = this._groundTile();
      for (let i = 0; i < len; i++) {
        this.fillCol(g.x + i, g.groundY, gt);
        this.setTile(g.x + i, g.groundY - 1, T().SPIKE);
      }
      // منصة قفز فوق الأشواك
      const py = g.groundY - U.rngi(g.rng, 3, 4);
      const mid = g.x + Math.floor(len / 2) - 1;
      this.setTile(mid, py, T().PLATFORM);
      this.setTile(mid + 1, py, T().PLATFORM);
      this.crystal(mid, py - 2, len > 4);
      g.x += len;
    }

    _crumble(g) {
      const len = U.rngi(g.rng, 4, 7);
      const liquid = this.wi === 0 || this.wi === 2 || this.wi === 3;
      for (let i = 0; i < len; i++) {
        this.setTile(g.x + i, g.groundY, T().CRUMBLE);
        if (liquid) this.fillCol(g.x + i, this.h, T().EMPTY, this.h - 3);
        if (i % 2 === 0) this.crystal(g.x + i, g.groundY - 2);
      }
      g.x += len;
    }

    _climb(g) {
      // برج تسلق: جدار + كرمة/سلسلة للصعود ثم هبوط
      const gt = this._groundTile();
      const towerH = U.rngi(g.rng, 5, 8);
      const topY = U.clamp(g.groundY - towerH, 6, 20);
      // عمود صلب
      for (let i = 0; i < 2; i++) this.fillCol(g.x + i, g.groundY, gt);
      this.fillCol(g.x + 2, topY, gt);
      this.fillCol(g.x + 3, topY, gt);
      // كرمة تسلق قبل الجدار
      for (let ty = topY - 1; ty < g.groundY; ty++) this.setTile(g.x + 1, ty, T().CLIMB);
      this.crystal(g.x + 1, topY - 1);
      this.crystal(g.x + 3, topY - 2);
      // هبوط تدريجي بعده
      g.x += 4;
      let y = topY;
      while (y < 22) {
        const w = U.rngi(g.rng, 2, 3);
        for (let i = 0; i < w; i++) this.fillCol(g.x + i, y, gt);
        g.x += w;
        y += U.rngi(g.rng, 1, 2);
      }
      g.groundY = U.clamp(y, 12, 25);
    }

    /* ------------- الألغاز ------------- */
    _puzzle(g, n) {
      const kind = U.rngPick(g.rng, this.world.puzzles);
      const gt = this._groundTile();
      const gateId = 'p' + n;
      if (kind === 'keyDoor') {
        // مفتاح على منصة مرتفعة ثم بوابة مقفلة
        this._flat(g, 5, { safe: true });
        const ky = g.groundY - U.rngi(g.rng, 3, 4);
        this.setTile(g.x - 3, ky, T().PLATFORM);
        this.ent('key', { x: (g.x - 3) * 32 + 16, y: (ky - 1) * 32 + 8, id: gateId, taken: false });
        this._flat(g, 4, {});
        const cells = [];
        for (let ty = g.groundY - 4; ty < g.groundY; ty++) cells.push([g.x, ty], [g.x + 1, ty]);
        for (let i = 0; i < 2; i++) this.fillCol(g.x + i, g.groundY, gt);
        this.addGateTiles(gateId, cells);
        this.ent('door', { x: g.x * 32, y: (g.groundY - 4) * 32, id: gateId, open: false });
        g.x += 2;
        this._flat(g, 3, { safe: true });
      } else if (kind === 'leverBridge') {
        // رافعة تبني جسرًا فوق فجوة
        this._flat(g, 4, { safe: true });
        this.ent('lever', { x: (g.x - 2) * 32, y: (g.groundY - 1) * 32, on: false, id: gateId, action: 'bridge' });
        const len = U.rngi(g.rng, 4, 6);
        const cells = [];
        for (let i = 0; i < len; i++) {
          cells.push([g.x + i, g.groundY]);
          this.fillCol(g.x + i, this.h, T().EMPTY, this.wi !== 4 ? this.h - 3 : undefined);
        }
        this.gates[gateId] = cells; // بلا بلاطات — تُبنى عند التفعيل
        g.x += len;
        this._flat(g, 3, { safe: true });
      } else if (kind === 'button') {
        // زر يفتح بوابة لوقت محدود
        this._flat(g, 4, { safe: true });
        this.ent('button', { x: (g.x - 2) * 32, y: (g.groundY - 1) * 32, id: gateId, timer: 0, dur: 5 - Math.floor(g.diffT * 2) });
        this._flat(g, 3, {});
        const cells = [];
        for (let ty = g.groundY - 4; ty < g.groundY; ty++) cells.push([g.x, ty]);
        for (let i = 0; i < 1; i++) this.fillCol(g.x + i, g.groundY, gt);
        this.addGateTiles(gateId, cells);
        g.x += 1;
        this._flat(g, 3, { safe: true });
      } else if (kind === 'box') {
        // صندوق يُدفع فوق لوحة ضغط
        this._flat(g, 8, { safe: true });
        this.ent('box', { x: (g.x - 6) * 32, y: (g.groundY - 2) * 32, vx: 0, vy: 0 });
        this.ent('plate', { x: (g.x - 3) * 32, y: (g.groundY - 1) * 32, id: gateId, pressed: false });
        const cells = [];
        for (let ty = g.groundY - 4; ty < g.groundY; ty++) cells.push([g.x, ty]);
        this.fillCol(g.x, g.groundY, gt);
        this.addGateTiles(gateId, cells);
        g.x += 1;
        this._flat(g, 3, { safe: true });
      } else if (kind === 'torch') {
        // أشعل كل المشاعل بالهجوم
        this._flat(g, 8, { safe: true });
        const count = 2 + (g.diffT > 0.5 ? 1 : 0);
        for (let i = 0; i < count; i++) {
          const px = g.x - 7 + i * 3;
          if (i === 1) { this.setTile(px, g.groundY - 3, T().PLATFORM); this.ent('torch', { x: px * 32 + 16, y: (g.groundY - 4) * 32, lit: false, id: gateId }); }
          else this.ent('torch', { x: px * 32 + 16, y: (g.groundY - 1) * 32, lit: false, id: gateId });
        }
        const cells = [];
        for (let ty = g.groundY - 4; ty < g.groundY; ty++) cells.push([g.x, ty]);
        this.fillCol(g.x, g.groundY, gt);
        this.addGateTiles(gateId, cells);
        g.x += 1;
        this._flat(g, 3, { safe: true });
      } else if (kind === 'mirror') {
        // اضبط المرايا لعكس شعاع الضوء
        this._flat(g, 10, { safe: true });
        const count = 3;
        const want = [];
        for (let i = 0; i < count; i++) {
          const st = U.rngi(g.rng, 0, 1);
          want.push(1); // الهدف: الكل لأعلى
          this.ent('mirror', { x: (g.x - 9 + i * 3) * 32 + 16, y: (g.groundY - 1) * 32, state: st, want: 1, id: gateId });
        }
        this.ent('beamSource', { x: (g.x - 10) * 32, y: (g.groundY - 2) * 32, id: gateId });
        const cells = [];
        for (let ty = g.groundY - 4; ty < g.groundY; ty++) cells.push([g.x, ty]);
        this.fillCol(g.x, g.groundY, gt);
        this.addGateTiles(gateId, cells);
        g.x += 1;
        this._flat(g, 3, { safe: true });
      }
    }

    /* ------------- الأسرار ------------- */
    _secret(g, n) {
      // كهف مخفي تحت الأرض خلف بلاطات قابلة للكسر
      const gt = this._groundTile();
      const len = 7;
      for (let i = 0; i < len; i++) this.fillCol(g.x + i, g.groundY, gt);
      const cx = g.x + 2;
      // غرفة تحت الأرض
      const roomY = g.groundY + 2;
      for (let tx = cx; tx < cx + 4; tx++) {
        for (let ty = roomY; ty < roomY + 3; ty++) this.setTile(tx, ty, T().EMPTY);
      }
      // مدخل قابل للكسر
      this.setTile(cx + 1, g.groundY, T().BREAK);
      this.setTile(cx + 2, g.groundY, T().BREAK);
      this.setTile(cx + 1, g.groundY + 1, T().EMPTY);
      this.setTile(cx + 2, g.groundY + 1, T().EMPTY);
      // المحتوى: كنز أو قطعة أثرية (ذكرى)
      const hasRelic = (this.li === 2 || this.li === 5) && n === 1;
      if (hasRelic) {
        this.ent('chest', { x: (cx + 2) * 32, y: (roomY + 2) * 32, opened: false, contents: 'relic', relicId: this.wi * 2 + (this.li === 2 ? 0 : 1) });
      } else {
        this.ent('chest', { x: (cx + 2) * 32, y: (roomY + 2) * 32, opened: false, contents: 'crystals', amount: U.rngi(g.rng, 10, 25) });
      }
      this.ent('secretZone', { x: cx * 32, y: roomY * 32, w: 4 * 32, h: 3 * 32, found: false });
      this.secretTotal++;
      g.x += len;
    }

    /* ------------- ساحة الزعيم ------------- */
    _genBossArena() {
      const gt = this._groundTile();
      const gy = 24;
      for (let tx = 0; tx < this.w; tx++) this.fillCol(tx, gy, gt);
      // جدران جانبية
      for (let ty = gy - 12; ty < gy; ty++) {
        this.setTile(0, ty, T().SOLID); this.setTile(1, ty, T().SOLID);
        this.setTile(this.w - 1, ty, T().SOLID); this.setTile(this.w - 2, ty, T().SOLID);
      }
      // منصات مساعدة
      for (const px of [12, 24, 40, 52]) {
        this.setTile(px, gy - 5, T().PLATFORM);
        this.setTile(px + 1, gy - 5, T().PLATFORM);
        this.setTile(px + 2, gy - 5, T().PLATFORM);
      }
      this.spawn = { x: 6 * 32, y: (gy - 3) * 32 };
      this.bossSpawn = { x: (this.w - 16) * 32, y: (gy - 3) * 32 };
      this.groundY = gy;
    }

    /* ================= الرسم ================= */
    _hash(tx, ty) {
      let h = (tx * 374761393 + ty * 668265263 + this._decorSeed) | 0;
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    }

    renderTiles(ctx, camX, camY, time) {
      const t = T(), w = this.world;
      const tex = RN.Textures.get(this.wi);
      const x0 = Math.max(0, Math.floor(camX / 32) - 1);
      const x1 = Math.min(this.w - 1, Math.ceil((camX + RN.VW) / 32) + 1);
      const y0 = Math.max(0, Math.floor(camY / 32) - 1);
      const y1 = Math.min(this.h - 1, Math.ceil((camY + RN.VH) / 32) + 1);
      const cm = RN.Save.settings.colorMode;

      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const id = this.tiles[this.idx(tx, ty)];
          if (id === t.EMPTY) continue;
          const px = tx * 32 - camX, py = ty * 32 - camY;
          const above = this.tileAt(tx, ty - 1);
          const hv = this._hash(tx, ty);
          const variant = Math.floor(hv * 4) % 4;
          switch (id) {
            case t.SOLID: {
              const isTop = above !== t.SOLID && above !== t.ICE && above !== t.SAND;
              ctx.drawImage((isTop ? tex.top : tex.ground)[variant], px, py, 32, 32);
              // إضاءة محيطة (AO): تعتيم الحواف المجاورة للفراغ
              const leftAir = !RN.Physics.isSolid(this.tileAt(tx - 1, ty));
              const rightAir = !RN.Physics.isSolid(this.tileAt(tx + 1, ty));
              if (leftAir || rightAir) {
                const ag = ctx.createLinearGradient(px, 0, px + 32, 0);
                ag.addColorStop(0, leftAir ? 'rgba(0,0,15,0.22)' : 'rgba(0,0,15,0)');
                ag.addColorStop(0.3, 'rgba(0,0,15,0)');
                ag.addColorStop(0.7, 'rgba(0,0,15,0)');
                ag.addColorStop(1, rightAir ? 'rgba(0,0,15,0.22)' : 'rgba(0,0,15,0)');
                ctx.fillStyle = ag;
                ctx.fillRect(px, py, 32, 32);
              }
              // عشب متمايل مع الريح فوق سطح الغابة/السماء
              if (isTop && (this.wi === 0 || this.wi === 4) && hv > 0.35) {
                const sway = Math.sin(time * 2.2 + tx * 1.3) * 2.5;
                ctx.strokeStyle = U.shade(w.groundTop, hv > 0.7 ? 0.2 : -0.08);
                ctx.lineWidth = 1.7; ctx.lineCap = 'round';
                for (let b = 0; b < 3; b++) {
                  const bx = px + 5 + b * 10 + hv * 6;
                  const bh = 5 + ((hv * 7 + b) % 4);
                  ctx.beginPath();
                  ctx.moveTo(bx, py + 4);
                  ctx.quadraticCurveTo(bx + sway * 0.5, py - bh * 0.5, bx + sway, py + 3 - bh);
                  ctx.stroke();
                }
              }
              break;
            }
            case t.ICE: {
              const isTop = above !== t.ICE;
              ctx.drawImage((tex.ice && tex.ice[variant]) || tex.ground[variant], px, py, 32, 32);
              if (isTop) {
                ctx.fillStyle = 'rgba(245,252,255,0.95)';
                ctx.fillRect(px, py, 32, 5);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(px, py + 5, 32, 1.5);
              }
              break;
            }
            case t.SAND: {
              ctx.drawImage(tex.ground[variant], px, py, 32, 32);
              const sink = Math.sin(time * 2.2 + tx) * 2;
              ctx.fillStyle = 'rgba(240,212,150,0.85)';
              ctx.fillRect(px, py + 2 + sink, 32, 4);
              ctx.fillStyle = 'rgba(190,150,80,0.5)';
              ctx.fillRect(px, py + 6 + sink, 32, 1.5);
              break;
            }
            case t.PLATFORM: {
              ctx.drawImage(tex.platform[variant], px, py, 32, 32);
              // ظل ناعم أسفل المنصة
              const sg = ctx.createLinearGradient(0, py + 14, 0, py + 22);
              sg.addColorStop(0, 'rgba(10,10,30,0.2)');
              sg.addColorStop(1, 'rgba(10,10,30,0)');
              ctx.fillStyle = sg;
              ctx.fillRect(px, py + 14, 32, 8);
              break;
            }
            case t.SPIKE: {
              ctx.fillStyle = cm === 3 ? '#ff3355' : '#aab4c0';
              for (let k = 0; k < 4; k++) {
                ctx.beginPath();
                ctx.moveTo(px + k * 8, py + 32);
                ctx.lineTo(px + k * 8 + 4, py + 12);
                ctx.lineTo(px + k * 8 + 8, py + 32);
                ctx.closePath(); ctx.fill();
              }
              break;
            }
            case t.LAVA: {
              const isTop = above !== t.LAVA;
              const lg = ctx.createLinearGradient(0, py, 0, py + 32);
              lg.addColorStop(0, isTop ? '#e0552a' : '#c8401e');
              lg.addColorStop(1, '#8a2812');
              ctx.fillStyle = lg;
              ctx.fillRect(px, py, 32, 32);
              if (isTop) {
                const wv = Math.sin(time * 3 + tx * 0.9) * 3;
                ctx.fillStyle = '#ff8a2a';
                ctx.fillRect(px, py + 2 + wv, 32, 6);
                ctx.fillStyle = '#ffd24a';
                ctx.fillRect(px + hv * 20, py + 3 + wv, 7, 3);
                // توهج فوق السطح (Bloom)
                ctx.globalCompositeOperation = 'screen';
                const glow = ctx.createLinearGradient(0, py - 14, 0, py + 6);
                glow.addColorStop(0, 'rgba(255,120,40,0)');
                glow.addColorStop(1, `rgba(255,140,50,${0.3 + Math.sin(time * 4 + tx) * 0.1})`);
                ctx.fillStyle = glow;
                ctx.fillRect(px, py - 14, 32, 20);
                // فقاعة حمم
                if (hv > 0.75) {
                  const bt = (time * 0.8 + hv * 5) % 1;
                  ctx.fillStyle = `rgba(255,210,90,${0.9 - bt})`;
                  ctx.beginPath(); ctx.arc(px + hv * 26, py + 4 + wv - bt * 8, 2.5 * (1 - bt * 0.5), 0, 7); ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
              }
              break;
            }
            case t.WATER: {
              const isTop = above !== t.WATER;
              const wg = ctx.createLinearGradient(0, py, 0, py + 32);
              wg.addColorStop(0, U.alpha(w.liquid, isTop ? 0.62 : 0.75));
              wg.addColorStop(1, U.alpha(U.shade(w.liquid, -0.35), 0.85));
              ctx.fillStyle = wg;
              ctx.fillRect(px, py, 32, 32);
              if (isTop) {
                const wv = Math.sin(time * 2.5 + tx * 0.8) * 2.5;
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillRect(px, py + 2 + wv, 32, 2.5);
                // لمعان انعكاس الشمس المتكسر
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = `rgba(255,250,220,${0.14 + Math.sin(time * 1.6 + tx * 2) * 0.08})`;
                ctx.fillRect(px + 3 + Math.sin(time + tx) * 5, py + 7, 14, 2);
                ctx.fillRect(px + 14 + Math.sin(time * 1.3 + tx) * 4, py + 13, 9, 1.5);
                ctx.globalCompositeOperation = 'source-over';
              }
              break;
            }
            case t.BREAK: {
              ctx.fillStyle = U.shade(w.ground, 0.1);
              U.roundRect(ctx, px + 1, py + 1, 30, 30, 4); ctx.fill();
              ctx.strokeStyle = U.shade(w.ground, -0.3);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px + 8, py + 6); ctx.lineTo(px + 16, py + 16); ctx.lineTo(px + 10, py + 26);
              ctx.moveTo(px + 22, py + 8); ctx.lineTo(px + 18, py + 18);
              ctx.stroke();
              break;
            }
            case t.CLIMB: {
              ctx.strokeStyle = this.wi === 0 ? '#4a8a3a' : '#8a7a5a';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(px + 16 + Math.sin(ty + time * 1.5) * 2, py);
              ctx.lineTo(px + 16 + Math.sin(ty + 1 + time * 1.5) * 2, py + 32);
              ctx.stroke();
              if (this.wi === 0) {
                ctx.fillStyle = '#5aa84a';
                ctx.beginPath(); ctx.ellipse(px + 20, py + 8 + (ty % 2) * 12, 4, 2, 0.5, 0, 7); ctx.fill();
              } else {
                ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(px + 8, py + 10); ctx.lineTo(px + 24, py + 10); ctx.stroke();
              }
              break;
            }
            case t.CRUMBLE: {
              ctx.fillStyle = U.shade(w.ground, 0.05);
              U.roundRect(ctx, px + 1, py + 3, 30, 12, 3); ctx.fill();
              ctx.strokeStyle = U.shade(w.ground, -0.25); ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(px + 10, py + 4); ctx.lineTo(px + 13, py + 14);
              ctx.moveTo(px + 22, py + 4); ctx.lineTo(px + 19, py + 14);
              ctx.stroke();
              break;
            }
            case t.GATE: {
              ctx.fillStyle = '#2a2a3a';
              ctx.fillRect(px + 3, py, 5, 32);
              ctx.fillRect(px + 14, py, 5, 32);
              ctx.fillRect(px + 25, py, 5, 32);
              ctx.fillStyle = '#4a4a6a';
              ctx.fillRect(px, py + 13, 32, 5);
              break;
            }
          }
        }
      }
    }

    // خريطة مصغرة: ترسم شكل التضاريس
    renderMinimap(ctx, x, y, w, h, playerX, playerY, exploredX) {
      ctx.fillStyle = 'rgba(10,12,24,0.65)';
      U.roundRect(ctx, x, y, w, h, 5); ctx.fill();
      const sx = w / (this.w * 32), sy = h / (this.h * 32);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const step = Math.max(1, Math.floor(this.w / 120));
      for (let tx = 0; tx < this.w; tx += step) {
        if (tx * 32 > exploredX + RN.VW) break;
        for (let ty = 0; ty < this.h; ty += 2) {
          const id = this.tiles[this.idx(tx, ty)];
          if (RN.Physics.isSolid(id) || id === T().PLATFORM) {
            ctx.fillRect(x + tx * 32 * sx, y + ty * 32 * sy, Math.max(1, 32 * sx * step), Math.max(1, 64 * sy));
            break;
          }
        }
      }
      if (this.goal) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + this.goal.x * sx - 1, y + this.goal.y * sy - 2, 4, 4);
      }
      ctx.fillStyle = '#4ae08a';
      ctx.beginPath(); ctx.arc(x + playerX * sx, y + playerY * sy, 2.5, 0, 7); ctx.fill();
    }
  }

  RN.Level = Level;
})();
