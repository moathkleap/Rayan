'use strict';
/* ============================================================
   Rayan & Naya — Core Utilities
   أدوات مساعدة عامة: رياضيات، عشوائية مزروعة، ألوان، تصادم
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  U.aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.moveToward = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

  // مولد أرقام عشوائية مزروع (mulberry32) — لضمان ثبات تصميم المراحل
  U.rng = function (seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.rngi = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
  U.rngPick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  // ---- ألوان ----
  U.hexToRgb = function (hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  // تفتيح/تعتيم لون: amt من -1 إلى 1
  U.shade = function (hex, amt) {
    const [r, g, b] = U.hexToRgb(hex);
    if (amt >= 0) return U.rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
    return U.rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  };
  U.alpha = function (hex, a) {
    const [r, g, b] = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  U.mix = function (hexA, hexB, t) {
    const a = U.hexToRgb(hexA), b = U.hexToRgb(hexB);
    return U.rgbToHex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };

  // ---- رسم مساعد ----
  U.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // بريق نجمي رباعي الأذرع حول نقطة الأصل الحالية (يفترض ctx مُترجَمًا/مُدارًا مسبقًا)
  // outer: طول الذراع من المركز، inner: بداية الذراع (0 = من المركز)، aw: عرض الذراع
  U.sparkle = function (ctx, outer, inner, aw) {
    for (let k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-aw / 2, -outer, aw, outer - inner);
    }
  };

  // عزل نص بأرقام داخل اتجاه LTR (لمنع قلب "0 / 19" في واجهة عربية)
  U.ltr = (s) => '\u2066' + s + '\u2069';

  U.formatTime = function (sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  };

  RN.U = U;
})();
