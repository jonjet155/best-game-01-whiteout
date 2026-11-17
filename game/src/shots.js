// Staged scenes for screenshots: ?shot=title|play|draft|win|lose&seed=N builds
// a fixed, deterministic scene with the seeded generator and paints it twice,
// then sets window.__shotReady (and body[data-ready]) so the screenshot
// script knows the frame is done. No wall clock is read here.
import { SCREEN_LOSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, startGame } from './world.js';
import { BLIZZARDS } from './config.js';

export function stageShot(name, world) {
  if (name === 'title') {
    world.screen = SCREEN_TITLE;
    world.best = 24860;
    world.time = 0.6;
    return { screen: SCREEN_TITLE, best: world.best };
  }
  if (name === 'win' || name === 'lose') {
    startGame(world);
    if (name === 'win') {
      world.screen = SCREEN_WIN;
      world.score = 12480;
      world.stats.releases = 41;
      world.stats.rescues = 9;
      world.stats.wolvesScared = 23;
      world.stats.avalanches = 2;
      world.bossDefeated = true;
      world.blizzard = BLIZZARDS;
      world.bestCombo = 12;
      world.villagers.lost = 3;
      world.result = {
        score: 12480, best: 12480, newBest: true, grade: 'S', blizzard: 7,
        releases: 41, rescues: 9, wolves: 23, avalanches: 2, houses: 9, lost: 3,
      };
      world.best = 12480;
      return { screen: SCREEN_WIN, best: 12480 };
    }
    world.screen = SCREEN_LOSE;
    world.score = 4860;
    world.stats.releases = 18;
    world.stats.rescues = 3;
    world.stats.wolvesScared = 7;
    world.stats.avalanches = 5;
    world.blizzard = 5;
    world.villagers.lost = 15;
    world.houses.forEach((h, i) => { if (i >= 2) { h.dead = true; h.hp = 0; } });
    world.loseReason = '15 VILLAGERS LOST';
    world.result = {
      score: 4860, best: 12480, newBest: false, grade: 'C', blizzard: 5,
      releases: 18, rescues: 3, wolves: 7, avalanches: 5, houses: 2, lost: 15,
    };
    world.best = 12480;
    return { screen: SCREEN_LOSE, best: 12480 };
  }
  if (name === 'draft') {
    // Blizzard 4 survived: the thaw draft, mountain still visible behind.
    startGame(world);
    world.blizzard = 4;
    world.score = 5120;
    world.best = 24860;
    world.wood = 41;
    world.food = 30;
    world.warmth = 68;
    world.villagers.evacuated = 12;
    world.villagers.protected = 28;
    world.villagers.atRisk = 8;
    world.villagers.lost = 2;
    world.slopes[0].pack = 82;
    world.slopes[1].pack = 34;
    world.slopes[2].pack = 61;
    world.slopes[3].pack = 92;
    world.slopes[4].pack = 18;
    world.slopes[5].pack = 47;
    world.slopes[6].pack = 73;
    world.slopes[7].pack = 26;
    world.slopes[1].fence = true;
    world.draftFromBlizzard = 4;
    world.draftChoices = [
      { id: 'roots', name: 'DEEP ROOTS', desc: 'Snow fences also cut pack growth on the two neighbouring slopes.' },
      { id: 'hearth', name: 'WARM HEARTH', desc: 'Warmth +20 now, and every house starts each blizzard 15 warmer.' },
      { id: 'charm', name: 'AVALANCHE CHARM', desc: 'Controlled releases pay +50% score and +1 combo each.' },
    ];
    world.screen = 'draft';
    world.time = 12.4;
    return { screen: 'draft', best: world.best };
  }
  // play: dense mid-blizzard-4 whiteout — HUD full, slopes deep, wolves in,
  // a buried villager, a rescue team digging, floats, banner, log lines.
  startGame(world);
  world.blizzard = 4;
  world.phaseIndex = 2; // whiteout
  world.phaseTimer = 6.2;
  world.blizzardTimer = 22.5;
  world.windAngle = -135;
  world.score = 6840;
  world.best = 24860;
  world.wood = 34;
  world.food = 19;
  world.warmth = 61;
  world.combo = 7;
  world.comboTimer = 4.2;
  world.villagers.evacuated = 11;
  world.villagers.protected = 27;
  world.villagers.atRisk = 9;
  world.villagers.lost = 3;
  world.slopes[0].pack = 82;
  world.slopes[1].pack = 34;
  world.slopes[2].pack = 61;
  world.slopes[3].pack = 94;
  world.slopes[4].pack = 18;
  world.slopes[5].pack = 47;
  world.slopes[6].pack = 73;
  world.slopes[7].pack = 88;
  world.slopes[1].fence = true;
  world.slopes[6].fence = true;
  world.slopes[3].flash = 0.5;
  world.selectedSlope = 3;
  world.houses[2].warm = 22;
  world.houses[5].warm = 18;
  world.houses[7].shield = true;
  world.buried.push({ x: 560, y: 470, timer: 9.4, max: 14 });
  world.buried.push({ x: 760, y: 300, timer: 5.1, max: 14 });
  world.rescues.push({ x: 600, y: 430, tx: 560, ty: 470, target: world.buried[0], digging: true, digTimer: 1.6, speed: 65 });
  world.wolves.push({ x: 930, y: 250, speed: 30, warn: 0 });
  world.wolves.push({ x: 380, y: 540, speed: 30, warn: 0 });
  world.wolves.push({ x: 1010, y: 480, speed: 30, warn: 0 });
  world.floats.push({ x: 480, y: 220, text: '+68 RELEASE', color: '#fde68a', life: 0.9, maxLife: 1.1 });
  world.floats.push({ x: 900, y: 300, text: '+40', color: '#fef3c7', life: 0.8, maxLife: 1.1 });
  world.floats.push({ x: 640, y: 180, text: 'COMBO x1.25', color: '#fde68a', life: 1.0, maxLife: 1.1 });
  world.floats.push({ x: 760, y: 520, text: '+50 RESCUED', color: '#86efac', life: 0.7, maxLife: 1.1 });
  world.banner = 'WHITEOUT — WOLVES IN THE SNOW';
  world.bannerTimer = 2.5;
  world.log = [
    'WHITEOUT — visibility drops. Wolves slip out of the trees!',
    'Controlled release on the SE slope — the gully runs clear.',
    'A wolf yelps and bolts for the treeline.',
    'Snowfall thickens on every slope.',
  ];
  world.stats.releases = 19;
  world.stats.rescues = 4;
  world.stats.wolvesScared = 11;
  world.stats.avalanches = 1;
  world.time = 24.5;
  world.screen = SCREEN_PLAY;
  return { screen: SCREEN_PLAY, best: world.best };
}
