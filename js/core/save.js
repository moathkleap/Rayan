'use strict';
/* ============================================================
   Rayan & Naya — نظام الحفظ
   حفظ تلقائي + يدوي + ملفات متعددة + تصدير/استيراد (سحابي)
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const KEY_PREFIX = 'rayan_naya_v1_profile_';
  const KEY_SETTINGS = 'rayan_naya_v1_settings';
  const PROFILE_COUNT = 3;

  function defaultProfile() {
    return {
      created: 0,
      playTime: 0,
      world: 0,            // آخر عالم مفتوح
      level: 0,            // آخر مرحلة مفتوحة داخل العالم
      crystals: 0,
      totalCrystals: 0,
      relics: [],          // معرفات القطع الأثرية المجموعة (ذكريات)
      stars: {},           // "w-l" -> 0..3
      bestTimes: {},       // "w-l" -> seconds
      secrets: {},         // "w-l" -> عدد الأسرار المكتشفة
      abilities: { doubleJump: false, dash: false, wallJump: false, glide: false, slam: false, shot: false, timeSlow: false },
      upgrades: { hp: 0, energy: 0, magnet: 0 },
      outfitsOwned: ['explorer'],
      outfit: 'explorer',
      nayaOutfit: 'princess',
      achievements: [],    // معرفات الإنجازات المفتوحة
      statsCounters: { kills: 0, jumps: 0, deaths: 0, chests: 0, distance: 0, bossNoHit: [], worldNoDeath: [] },
      cinematicsSeen: [],
      finished: false,
    };
  }

  function defaultSettings() {
    return {
      lang: 'ar',
      musicVol: 0.7,
      sfxVol: 0.9,
      difficulty: 1,       // 0 سهل .. 3 كابوس
      textScale: 1,        // 0.85 / 1 / 1.2
      colorMode: 0,        // 0 عادي 1 ديوتان 2 بروتان 3 تباين عالٍ
      assist: 0,           // 0 بدون 1 قفزات إضافية 2 حماية
      quality: 2,          // 0..2
      keymap: null,
    };
  }

  const Save = {
    profileIndex: 0,
    data: defaultProfile(),
    settings: defaultSettings(),
    _lastAuto: 0,
    onSaved: null,

    loadSettings() {
      try {
        const raw = localStorage.getItem(KEY_SETTINGS);
        if (raw) this.settings = Object.assign(defaultSettings(), JSON.parse(raw));
      } catch (e) { /* تخزين غير متاح */ }
      return this.settings;
    },
    saveSettings() {
      try { localStorage.setItem(KEY_SETTINGS, JSON.stringify(this.settings)); } catch (e) {}
    },

    listProfiles() {
      const out = [];
      for (let i = 0; i < PROFILE_COUNT; i++) {
        try {
          const raw = localStorage.getItem(KEY_PREFIX + i);
          out.push(raw ? JSON.parse(raw) : null);
        } catch (e) { out.push(null); }
      }
      return out;
    },

    loadProfile(i) {
      this.profileIndex = i;
      try {
        const raw = localStorage.getItem(KEY_PREFIX + i);
        this.data = raw ? Object.assign(defaultProfile(), JSON.parse(raw)) : defaultProfile();
      } catch (e) { this.data = defaultProfile(); }
      if (!this.data.created) this.data.created = Date.now();
      return this.data;
    },

    newProfile(i) {
      this.profileIndex = i;
      this.data = defaultProfile();
      this.data.created = Date.now();
      this.commit();
      return this.data;
    },

    deleteProfile(i) {
      try { localStorage.removeItem(KEY_PREFIX + i); } catch (e) {}
    },

    commit(manual) {
      try {
        localStorage.setItem(KEY_PREFIX + this.profileIndex, JSON.stringify(this.data));
        if (this.onSaved) this.onSaved(manual);
      } catch (e) {}
    },

    // حفظ تلقائي (مخفف — مرة كل بضع ثوانٍ كحد أقصى)
    auto() {
      const now = Date.now();
      if (now - this._lastAuto < 2000) return;
      this._lastAuto = now;
      this.commit(false);
    },

    /* الحفظ السحابي: تصدير/استيراد رمز Base64.
       نقطة الربط المستقبلية: استبدل هاتين الدالتين بمزامنة خادم حقيقي. */
    exportCode() {
      try { return btoa(unescape(encodeURIComponent(JSON.stringify(this.data)))); } catch (e) { return ''; }
    },
    importCode(code) {
      try {
        const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (typeof obj !== 'object' || obj === null) return false;
        this.data = Object.assign(defaultProfile(), obj);
        this.commit(true);
        return true;
      } catch (e) { return false; }
    },

    starKey(w, l) { return w + '-' + l; },
  };

  RN.Save = Save;
  RN.defaultProfile = defaultProfile;
})();
