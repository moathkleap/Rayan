'use strict';
/* ============================================================
   Rayan & Naya — إعدادات اللعبة
   العوالم، البلاطات، الصعوبة، الملابس، القوى الخاصة
   ============================================================ */
window.RN = window.RN || {};
(function () {
  const C = {};

  C.TILE = 32;
  C.WORLD_COUNT = 7;
  C.LEVELS_PER_WORLD = 8; // المرحلة 8 هي مواجهة الزعيم

  // أنواع البلاطات
  C.T = {
    EMPTY: 0, SOLID: 1, PLATFORM: 2, SPIKE: 3, ICE: 4, SAND: 5,
    LAVA: 6, WATER: 7, BREAK: 8, CLIMB: 9, CRUMBLE: 10, GATE: 11, GOAL: 12,
  };

  // هوية كل عالم: ألوان، طقس، مخاطر
  C.WORLDS = [
    {
      id: 'forest',
      bgSky: ['#5fb0dd', '#8fd0e8', '#eaf7e8'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#7ec8e3', '#cfeef7'], far: '#5da177', mid: '#3f8a5e', ground: '#7a5230',
      groundTop: '#58b24d', accent: '#2f6e46', weather: 'leaves', fog: 'rgba(210,240,220,0.25)',
      hazard: 'water', liquid: '#2e7fb8',
      enemies: ['beetle', 'wasp', 'plant', 'hopper'],
      puzzles: ['keyDoor', 'leverBridge', 'box'],
    },
    {
      id: 'desert',
      bgSky: ['#e8a84a', '#f5c76b', '#fdeec6'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#f5c76b', '#fdeec6'], far: '#d9a04e', mid: '#c08637', ground: '#b98a4a',
      groundTop: '#e0b263', accent: '#8a5f2a', weather: 'sandstorm', fog: 'rgba(240,210,150,0.22)',
      hazard: 'quicksand', liquid: '#d8b264',
      enemies: ['scorpion', 'statue', 'vulture', 'mummyRat'],
      puzzles: ['keyDoor', 'button', 'box'],
    },
    {
      id: 'ice',
      bgSky: ['#6f9cc8', '#a8c8e8', '#eef6ff'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#8fb8de', '#e8f4ff'], far: '#a9c8e8', mid: '#7ea6cf', ground: '#9db9d6',
      groundTop: '#e9f6ff', accent: '#5b7ea6', weather: 'snow', fog: 'rgba(230,245,255,0.3)',
      hazard: 'freeze', liquid: '#7db8e8',
      enemies: ['snowWolf', 'frostBat', 'iceGolem', 'icicle'],
      puzzles: ['leverBridge', 'button', 'torch'],
    },
    {
      id: 'volcano',
      bgSky: ['#2a1418', '#6e2a1e', '#c8552a'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#3b1f24', '#8a3324'], far: '#5c2a24', mid: '#7c3526', ground: '#4a3038',
      groundTop: '#6e4a50', accent: '#e0562a', weather: 'embers', fog: 'rgba(120,40,20,0.28)',
      hazard: 'lava', liquid: '#ff6a1e',
      enemies: ['lavaSlug', 'fireImp', 'rockCrawler', 'magmaTurret'],
      puzzles: ['keyDoor', 'button', 'torch'],
    },
    {
      id: 'sky',
      bgSky: ['#3a6cc8', '#6f9fe0', '#cfe8ff'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#4a7fd4', '#bfe3ff'], far: '#7fa8e8', mid: '#5f8ed8', ground: '#d8e6f4',
      groundTop: '#f4fbff', accent: '#3a67b0', weather: 'wind', fog: 'rgba(255,255,255,0.3)',
      hazard: 'fall', liquid: '#6fa8e8',
      enemies: ['stormBird', 'cloudJelly', 'windWisp', 'skyDrake'],
      puzzles: ['leverBridge', 'button', 'box'],
    },
    {
      id: 'stars',
      bgSky: ['#0b1030', '#20306e', '#3a4a8e'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#0f1440', '#3a4a8e'], far: '#2a3470', mid: '#3c4a90', ground: '#2e2c58',
      groundTop: '#7a74d8', accent: '#ffd76a', weather: 'stardust', fog: 'rgba(120,130,230,0.18)',
      hazard: 'void', liquid: '#4a3aa8',
      enemies: ['starWisp', 'cometHawk', 'nebulaJelly', 'starSentinel'],
      puzzles: ['keyDoor', 'leverBridge', 'button'],
    },
    {
      id: 'dark',
      bgSky: ['#0a0718', '#231640', '#3a2560'], // تدرج سماء الخلفية (3 توقفات)
      sky: ['#0d0a1e', '#2a1a4a'], far: '#241a45', mid: '#352a5c', ground: '#2c2440',
      groundTop: '#4a3d6e', accent: '#8a5cff', weather: 'shadowMist', fog: 'rgba(40,20,80,0.4)',
      hazard: 'void', liquid: '#3a1a6a',
      enemies: ['shadowGhost', 'darkKnight', 'gargoyle', 'shadeCaster'],
      puzzles: ['keyDoor', 'torch', 'mirror'],
    },
  ];

  // إعدادات الصعوبة: قلوب البداية، ضرر الأعداء، صحة الزعماء
  C.DIFFICULTY = [
    { hearts: 8, enemyDmg: 0.5, bossHp: 0.7, checkpoints: true, name: 'easy' },
    { hearts: 6, enemyDmg: 1.0, bossHp: 1.0, checkpoints: true, name: 'normal' },
    { hearts: 4, enemyDmg: 1.5, bossHp: 1.3, checkpoints: true, name: 'hard' },
    { hearts: 3, enemyDmg: 2.0, bossHp: 1.6, checkpoints: false, name: 'nightmare' },
  ];

  // القدرة المكتسبة بعد هزيمة زعيم كل عالم
  C.ABILITY_UNLOCKS = ['doubleJump', 'dash', 'wallJump', 'glide', 'slam', null, null];
  // قدرات تُشترى من المتجر
  C.SHOP_ABILITIES = [
    { id: 'shot', cost: 250 },
    { id: 'timeSlow', cost: 400 },
  ];

  // ملابس ريان: لوحات ألوان تُطبق على الرسم الإجرائي
  C.OUTFITS = {
    explorer: { cost: 0, shirt: '#f4f1e8', shirtDeco: '#e8862a', pants: '#27324a', shoes: '#d8dde8', hat: null },
    knight: { cost: 150, shirt: '#8a93a8', shirtDeco: '#d8b23a', pants: '#4a5468', shoes: '#6a7488', hat: 'helm' },
    ninja: { cost: 200, shirt: '#23283a', shirtDeco: '#c03a3a', pants: '#181c2a', shoes: '#23283a', hat: 'band' },
    robot: { cost: 300, shirt: '#9fb8c8', shirtDeco: '#3ad8e8', pants: '#5f7888', shoes: '#3a4858', hat: 'antenna' },
    space: { cost: 350, shirt: '#e8e8f4', shirtDeco: '#7a5cff', pants: '#8a8ab8', shoes: '#c8c8e8', hat: 'visor' },
    hunter: { cost: 250, shirt: '#8a6a3a', shirtDeco: '#e8d23a', pants: '#5a442a', shoes: '#8a6a3a', hat: 'fedora' },
  };
  C.OUTFIT_ORDER = ['explorer', 'knight', 'ninja', 'robot', 'space', 'hunter'];

  // ملابس نايا (تظهر في المشاهد السينمائية والذكريات)
  C.NAYA_OUTFITS = {
    princess: { dress: '#f6f2df', deco: '#e8a8c8', cost: 0 },
    explorer: { dress: '#c8a86a', deco: '#8a6a3a', cost: 100 },
    scholar: { dress: '#b8a888', deco: '#6a5a3a', cost: 100 },
    winter: { dress: '#a8c8e8', deco: '#ffffff', cost: 150 },
    desert: { dress: '#e8c88a', deco: '#c08637', cost: 150 },
  };

  // القوى المؤقتة القابلة للجمع داخل المراحل
  C.POWERUPS = {
    fireball: { dur: 12, color: '#ff7a2a', icon: '🔥' },
    lightning: { dur: 10, color: '#ffe14a', icon: '⚡' },
    freeze: { dur: 8, color: '#7ad8ff', icon: '❄' },
    shield: { dur: 0, color: '#7affc8', icon: '🛡' },       // حتى أول ضربة
    power2x: { dur: 15, color: '#ff5a8a', icon: '✦' },
    speed2x: { dur: 12, color: '#4affff', icon: '➤' },
    magnet: { dur: 15, color: '#c88aff', icon: '◎' },
    invincible: { dur: 8, color: '#ffd700', icon: '★' },
  };

  // تطويرات المتجر
  C.UPGRADES = {
    hp: { max: 4, baseCost: 100 },
    energy: { max: 4, baseCost: 80 },
    magnet: { max: 3, baseCost: 120 },
  };

  // فيزياء اللاعب
  C.PHYS = {
    gravity: 2100,
    runSpeed: 250,
    sprintSpeed: 335,
    accel: 1900,
    friction: 1600,
    iceFriction: 260,
    jumpVel: 720,
    doubleJumpVel: 650,
    wallSlideMax: 130,
    wallJumpX: 330,
    climbSpeed: 150,
    dashSpeed: 560,
    dashTime: 0.17,
    glideFall: 95,
    slamSpeed: 950,
    coyote: 0.09,
    jumpBuffer: 0.12,
    maxFall: 900,
  };

  RN.C = C;
})();
