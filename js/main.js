'use strict';
/* ============================================================
   Rayan & Naya — نقطة الانطلاق
   تهيئة الأنظمة، ربط الإدخال باللمس والنقر، بدء المحرك
   ============================================================ */
(function () {
  function boot() {
    const canvas = document.getElementById('game');

    // الإعدادات المحفوظة
    const settings = RN.Save.loadSettings();
    RN.I18N.lang = settings.lang || 'ar';
    if (settings.keymap) RN.Input.map = settings.keymap;

    RN.Input.init();
    RN.Engine.init(canvas);
    RN.Audio.setMusicVol(settings.musicVol);
    RN.Audio.setSfxVol(settings.sfxVol);

    // أول تفاعل: تفعيل الصوت (متطلب المتصفحات)
    const unlockAudio = () => {
      RN.Audio.init();
      RN.Audio.resume();
      RN.Audio.setMusicVol(RN.Save.settings.musicVol);
      RN.Audio.setSfxVol(RN.Save.settings.sfxVol);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // نقرات الواجهة + نبضة ارتداد للأزرار المضغوطة
    canvas.addEventListener('pointerdown', (e) => {
      const v = RN.Engine.toVirtual(e.clientX, e.clientY);
      const scene = RN.Engine.scene;
      if (!scene) return;
      for (const list of [scene.buttons, scene._pauseButtons, scene._resultButtons, scene._goButtons]) {
        if (!list) continue;
        for (const b of list) {
          if (!b.invisible && RN.UI.hit(b, v.x, v.y)) RN.UI.press(b);
        }
      }
      try { if (scene.onClick) scene.onClick(v.x, v.y); } catch (err) { console.error('[RN] click error:', err); }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // أزرار اللمس
    const touchLayer = document.getElementById('touch');
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      touchLayer.classList.add('visible');
      for (const btn of touchLayer.querySelectorAll('[data-action]')) {
        const action = btn.getAttribute('data-action');
        const down = (e) => { e.preventDefault(); btn.classList.add('active'); RN.Input.setTouch(action, true); };
        const up = (e) => { e.preventDefault(); btn.classList.remove('active'); RN.Input.setTouch(action, false); };
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });
        btn.addEventListener('touchcancel', up, { passive: false });
        btn.addEventListener('pointerdown', down);
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointerleave', up);
      }
    }

    // منع تمرير الصفحة أثناء اللعب
    document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // إخفاء شاشة التحميل
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    RN.Engine.setScene(new RN.Scenes.MenuScene());
    RN.Engine.start();

    // Service Worker للعمل دون اتصال (عند التقديم عبر خادم)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
