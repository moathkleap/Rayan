'use strict';
/* ============================================================
   Rayan & Naya — الفيزياء
   تصادم بلاطات AABB، منصات أحادية الاتجاه، جليد/رمال/تسلق
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const T = () => RN.C.T;
  const TILE = () => RN.C.TILE;

  const Physics = {
    // هل البلاطة صلبة لهذا الكائن؟
    isSolid(id) {
      const t = T();
      return id === t.SOLID || id === t.ICE || id === t.SAND || id === t.BREAK || id === t.CRUMBLE || id === t.GATE;
    },

    /* تحريك كائن مع حل التصادم مع البلاطات.
       actor: {x,y,w,h,vx,vy} — x,y أعلى يسار الصندوق.
       يعيد معلومات: onGround, onWall(-1/0/1), groundTile, hitCeil, touchedTiles */
    moveActor(level, a, dt) {
      const tile = TILE();
      const res = { onGround: false, onWall: 0, groundTile: 0, hitCeil: false, hazard: null, crumbled: [], onPlatformEnt: null };

      // ---- منصات متحركة (كيانات) ----
      let carryX = 0;
      if (a._ridingPlat) {
        carryX = a._ridingPlat.dx || 0;
        a.y += a._ridingPlat.dy || 0;
        a._ridingPlat = null;
      }

      // ---- أفقي ----
      let nx = a.x + (a.vx * dt) + carryX;
      const dirX = Math.sign(nx - a.x);
      if (dirX !== 0) {
        const edgeX = dirX > 0 ? nx + a.w : nx;
        const tx = Math.floor(edgeX / tile);
        const ty0 = Math.floor(a.y / tile), ty1 = Math.floor((a.y + a.h - 1) / tile);
        let blocked = false;
        for (let ty = ty0; ty <= ty1; ty++) {
          const id = level.tileAt(tx, ty);
          if (this.isSolid(id)) { blocked = true; break; }
        }
        if (blocked) {
          nx = dirX > 0 ? tx * tile - a.w - 0.01 : (tx + 1) * tile + 0.01;
          res.onWall = dirX;
          a.vx = 0;
        }
      }
      a.x = nx;

      // ---- عمودي ----
      let ny = a.y + a.vy * dt;
      const dirY = Math.sign(ny - a.y);
      if (dirY !== 0) {
        const edgeY = dirY > 0 ? ny + a.h : ny;
        const ty = Math.floor(edgeY / tile);
        const tx0 = Math.floor((a.x + 1) / tile), tx1 = Math.floor((a.x + a.w - 1) / tile);
        let blocked = false, gTile = 0;
        for (let tx = tx0; tx <= tx1; tx++) {
          const id = level.tileAt(tx, ty);
          if (this.isSolid(id)) { blocked = true; gTile = id; break; }
          // منصة أحادية الاتجاه: تصد فقط عند الهبوط ومن الأعلى
          if (id === T().PLATFORM && dirY > 0 && !a.dropThrough) {
            const platTop = ty * tile;
            if (a.y + a.h <= platTop + 6) { blocked = true; gTile = id; break; }
          }
        }
        if (blocked) {
          if (dirY > 0) {
            ny = ty * tile - a.h - 0.01;
            res.onGround = true;
            res.groundTile = gTile;
            if (gTile === T().CRUMBLE) {
              for (let tx = tx0; tx <= tx1; tx++) {
                if (level.tileAt(tx, ty) === T().CRUMBLE) res.crumbled.push([tx, ty]);
              }
            }
          } else {
            ny = (ty + 1) * tile + 0.01;
            res.hitCeil = true;
          }
          a.vy = 0;
        }
      }
      a.y = ny;

      // ---- مخاطر البلاطات (أشواك/حمم) ----
      const cx0 = Math.floor((a.x + 3) / tile), cx1 = Math.floor((a.x + a.w - 3) / tile);
      const cy0 = Math.floor((a.y + 3) / tile), cy1 = Math.floor((a.y + a.h - 1) / tile);
      for (let ty = cy0; ty <= cy1; ty++) {
        for (let tx = cx0; tx <= cx1; tx++) {
          const id = level.tileAt(tx, ty);
          if (id === T().SPIKE) res.hazard = 'spike';
          if (id === T().LAVA) res.hazard = 'lava';
        }
      }
      // السقوط خارج المرحلة
      if (a.y > level.h * tile + 100) res.hazard = 'pit';
      return res;
    },

    // هل الكائن ملامس لبلاطة تسلق؟
    onClimbable(level, a) {
      const tile = TILE();
      const tx = Math.floor((a.x + a.w / 2) / tile);
      const ty0 = Math.floor(a.y / tile), ty1 = Math.floor((a.y + a.h - 1) / tile);
      for (let ty = ty0; ty <= ty1; ty++) {
        if (level.tileAt(tx, ty) === T().CLIMB) return true;
      }
      return false;
    },

    // فحص وجود أرض تحت نقطة (لدوريات الأعداء)
    groundAhead(level, x, y) {
      const tile = TILE();
      const tx = Math.floor(x / tile), ty = Math.floor((y + 4) / tile);
      const id = level.tileAt(tx, ty);
      return this.isSolid(id) || id === T().PLATFORM;
    },

    wallAhead(level, x, y) {
      const tile = TILE();
      return this.isSolid(level.tileAt(Math.floor(x / tile), Math.floor(y / tile)));
    },
  };

  RN.Physics = Physics;
})();
