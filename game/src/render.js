// WHITEOUT — all drawing. Canvas 2D, 1280x720, Lilita One display font.
// Layout is deliberately NOT the top-entries' top-bar + side panels: the
// mountain sits in the centre, a storm ring circles it, and four corner
// tablets hold threats, rescue, build and weather/resources.
import {
  BLIZZARDS, BUILD, CX, CY, H, MOUNTAIN_R, RING_R, SLOPE_ANGLES, SLOPE_NAMES, THREATS,
  VILLAGE_R, W, gradeFor, multFor,
} from './config.js';
import {
  SCREEN_DRAFT, SCREEN_LOSE, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE,
  SCREEN_WIN, housesAlive, phaseOf,
} from './world.js';

const FONT = '"Lilita One", "Arial Black", sans-serif';
const TL = { x: 12, y: 12, w: 296, h: 200 };
const TR = { x: 972, y: 12, w: 296, h: 200 };
const BL = { x: 12, y: 508, w: 430, h: 200 };
const BR = { x: 838, y: 508, w: 430, h: 200 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, outline) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  if (outline) {
    ctx.lineWidth = Math.max(2, size / 6);
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function tablet(ctx, t, title, titleColor) {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.86)';
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.stroke();
  ctx.fillStyle = titleColor || '#fde68a';
  rr(ctx, t.x, t.y, t.w, 26, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.86)';
  ctx.fillRect(t.x, t.y + 16, t.w, 10);
  // Title text sits 1 px lower at 14 px so emoji glyphs (⚠/🔨/🏠/🌦) are
  // not clipped at the top of the 26 px title bar.
  text(ctx, title, t.x + 10, t.y + 20, 14, '#0b1c2c', 'left');
  ctx.restore();
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || 'rgba(255,255,255,0.18)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function packColor(pack) {
  if (pack >= 90) return 'rgba(239, 68, 68, 0.55)';
  if (pack >= 70) return 'rgba(249, 115, 22, 0.5)';
  if (pack >= 45) return 'rgba(253, 224, 71, 0.42)';
  return 'rgba(191, 219, 254, 0.4)';
}

function drawMountain(ctx, world) {
  const a = world.assets;
  // Painterly terrain, full-bleed.
  if (a && a.play) ctx.drawImage(a.play, 0, 0, W, H);
  else { ctx.fillStyle = '#dfe9f2'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(10, 25, 40, 0.18)';
  ctx.fillRect(0, 0, W, H);
  // Mountain disc: soft snow light over the terrain.
  const g = ctx.createRadialGradient(CX, CY, 40, CX, CY, MOUNTAIN_R + 40);
  g.addColorStop(0, 'rgba(255,255,255,0.34)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, MOUNTAIN_R + 40, 0, Math.PI * 2);
  ctx.fill();

  // Gullies: pale channels from the village out along each slope.
  ctx.save();
  ctx.strokeStyle = 'rgba(219, 234, 254, 0.5)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const s of world.slopes) {
    const a = (s.angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * 102, CY + Math.sin(a) * 102);
    ctx.lineTo(CX + Math.cos(a) * (MOUNTAIN_R - 4), CY + Math.sin(a) * (MOUNTAIN_R - 4));
    ctx.stroke();
  }
  ctx.restore();

  // Slope wedges with visible snowpack depth.
  for (const s of world.slopes) {
    const a0 = ((s.angle - 22.5) * Math.PI) / 180;
    const a1 = ((s.angle + 22.5) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, MOUNTAIN_R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = packColor(s.pack);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.stroke();
    // Snowpack fill: white wedge height grows with the pack.
    const rFill = 100 + (s.pack / 100) * (MOUNTAIN_R - 100);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, rFill, a0 + 0.03, a1 - 0.03);
    ctx.closePath();
    ctx.fillStyle = s.pack >= 90 ? 'rgba(254, 202, 202, 0.5)' : 'rgba(255,255,255,0.5)';
    ctx.fill();
    if (s.flash > 0) {
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, MOUNTAIN_R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.6})`;
      ctx.fill();
    }
    // Depth number + mini bar + fence.
    const a = (s.angle * Math.PI) / 180;
    const nx = CX + Math.cos(a) * 208;
    const ny = CY + Math.sin(a) * 208;
    const danger = s.pack >= 70;
    text(ctx, `${s.name} ${Math.round(s.pack)}`, nx, ny, danger ? 17 : 14, danger ? '#fecaca' : '#f8fafc', 'center', 'rgba(7,18,30,0.85)');
    bar(ctx, nx - 22, ny + 5, 44, 6, s.pack / 100, s.pack >= 90 ? '#ef4444' : s.pack >= 70 ? '#f97316' : '#7dd3fc');
    if (s.fence) {
      const fx = CX + Math.cos(a) * 150;
      const fy = CY + Math.sin(a) * 150;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy - 6); ctx.lineTo(fx + 10, fy - 6);
      ctx.moveTo(fx - 8, fy - 12); ctx.lineTo(fx - 8, fy + 2);
      ctx.moveTo(fx, fy - 12); ctx.lineTo(fx, fy + 2);
      ctx.moveTo(fx + 8, fy - 12); ctx.lineTo(fx + 8, fy + 2);
      ctx.stroke();
      text(ctx, 'FENCE', fx, fy + 18, 10, '#fde68a', 'center', 'rgba(7,18,30,0.8)');
    }
    if (s.pack >= 90) {
      const wx = CX + Math.cos(a) * 168;
      const wy = CY + Math.sin(a) * 168;
      const pulse = 0.6 + 0.4 * Math.sin(world.time * 6);
      ctx.fillStyle = `rgba(239,68,68,${pulse})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 11, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '!', wx, wy + 5, 15, '#fff', 'center');
    }
  }

  // Rocks and pines.
  for (const r of world.rocks) {
    ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
    ctx.beginPath();
    ctx.moveTo(r.x - r.s, r.y + r.s * 0.6);
    ctx.lineTo(r.x, r.y - r.s);
    ctx.lineTo(r.x + r.s, r.y + r.s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(r.x - r.s * 0.4, r.y - r.s * 0.55);
    ctx.lineTo(r.x, r.y - r.s);
    ctx.lineTo(r.x + r.s * 0.4, r.y - r.s * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  for (const t of world.trees) {
    const s = t.s;
    ctx.fillStyle = t.shade > 0.5 ? '#14532d' : '#166534';
    ctx.beginPath();
    ctx.moveTo(t.x - 7 * s, t.y + 6 * s);
    ctx.lineTo(t.x, t.y - 11 * s);
    ctx.lineTo(t.x + 7 * s, t.y + 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(t.x - 3.4 * s, t.y - 2 * s);
    ctx.lineTo(t.x, t.y - 11 * s);
    ctx.lineTo(t.x + 3.4 * s, t.y - 2 * s);
    ctx.closePath();
    ctx.fill();
  }

  // Village ground: warm trampled snow.
  const vg = ctx.createRadialGradient(CX, CY, 10, CX, CY, VILLAGE_R + 14);
  vg.addColorStop(0, 'rgba(214, 186, 140, 0.5)');
  vg.addColorStop(1, 'rgba(214, 186, 140, 0)');
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.arc(CX, CY, VILLAGE_R + 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CX, CY, VILLAGE_R + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Houses: cabins with warm windows, smoke, shields, cold/dark states.
  for (const h of world.houses) {
    ctx.save();
    ctx.translate(h.x, h.y);
    if (h.dead) {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.9)';
      ctx.fillRect(-9, -4, 18, 10);
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -8); ctx.lineTo(6, 4);
      ctx.moveTo(6, -8); ctx.lineTo(-6, 4);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const cold = h.warm < 30;
    // glow
    if (!cold) {
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      glow.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
      glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 7, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-9, -5, 18, 12);
    ctx.fillStyle = cold ? '#94a3b8' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-11, -4);
    ctx.lineTo(0, -13);
    ctx.lineTo(11, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cold ? '#334155' : '#fbbf24';
    ctx.fillRect(-3, 0, 6, 5);
    // chimney smoke
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const sy = -14 - ((world.time * 8 + h.smoke) % 14);
    ctx.beginPath();
    ctx.arc(7, sy, 2.2, 0, Math.PI * 2);
    ctx.fill();
    if (h.shield) {
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    // warmth pips under the house
    bar(ctx, -9, 10, 18, 3, h.warm / 100, h.warm < 30 ? '#ef4444' : '#f59e0b');
    ctx.restore();
  }

  // Villagers: tiny dots with bright coats wandering the village green.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + world.time * 0.05 * (i % 2 ? 1 : -1);
    const r = 26 + (i % 4) * 9;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    ctx.fillStyle = ['#ef4444', '#3b82f6', '#f59e0b', '#a855f7'][i % 4];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buried villagers: snow mounds, pulsing ring, countdown arc.
  for (const b of world.buried) {
    const pulse = 0.55 + 0.45 * Math.sin(world.time * 7);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(239,68,68,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * b.timer) / b.max);
    ctx.stroke();
    text(ctx, 'HELP!', b.x, b.y - 24, 12, '#fecaca', 'center', 'rgba(7,18,30,0.85)');
  }

  // Rescue teams: orange wardens with a rope line to their dig site.
  for (const r of world.rescues) {
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.target.x, r.target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(r.x, r.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r.x, r.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    if (r.digging) {
      text(ctx, 'DIGGING…', r.x, r.y - 12, 11, '#fdba74', 'center', 'rgba(7,18,30,0.85)');
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.target.x, r.target.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - r.digTimer / (r.digMax || 3)));
      ctx.stroke();
    }
  }

  // Wolves: grey shapes with red eyes, stalking in from the treeline.
  for (const w of world.wolves) {
    const dx = CX - w.x;
    const dy = CY - w.y;
    const d = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(ang);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -4); ctx.lineTo(11, -8); ctx.lineTo(13, -3);
    ctx.moveTo(9, 4); ctx.lineTo(11, 8); ctx.lineTo(13, 3);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-16, -4, -18, -8 + Math.sin(world.time * 5 + w.x) * 2);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(12, -1.8, 1.3, 0, Math.PI * 2);
    ctx.arc(12, 1.8, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (world.upgrades.includes('eyes')) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Flow particles from a controlled release.
  for (const p of world.particles) {
    if (p.kind !== 'flow') continue;
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, p.life)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStormRing(ctx, world) {
  // Clock-face gauge: 7 blizzard pips around the ring. (Wind arrow is a
  // separate pass, drawWindArrow, drawn after the corner tablets.)
  ctx.save();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < BLIZZARDS; i++) {
    const a = (-90 + i * (360 / BLIZZARDS)) * Math.PI / 180;
    const x = CX + Math.cos(a) * RING_R;
    const y = CY + Math.sin(a) * RING_R;
    const done = i < world.blizzard - 1 || (world.blizzard === BLIZZARDS && world.bossDefeated);
    const current = i === world.blizzard - 1;
    const pulse = current ? 0.7 + 0.3 * Math.sin(world.time * 5) : 1;
    ctx.fillStyle = done ? '#38bdf8' : current ? `rgba(253, 224, 71, ${pulse})` : 'rgba(148, 163, 184, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, current ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(7,18,30,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, String(i + 1), x, y + 4, 11, '#0b1c2c', 'center');
  }
  // Wind arrow lives in its own pass (drawWindArrow, called after the
  // corner tablets) — at ~135° it lands inside the BUILD tablet's bounds,
  // and the opaque tablet used to hide it.

  // The White Giant's storm eye rides the ring on blizzard 7.
  if (world.eye.active && !world.bossDefeated) {
    const ea = (world.eye.angle * Math.PI) / 180;
    const ex = CX + Math.cos(ea) * world.eye.dist;
    const ey = CY + Math.sin(ea) * world.eye.dist;
    const a = world.assets;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, 24, 0, Math.PI * 2);
    ctx.clip();
    if (a && a.giant) ctx.drawImage(a.giant, ex - 24, ey - 36, 48, 72);
    else { ctx.fillStyle = '#c7d2fe'; ctx.fillRect(ex - 24, ey - 24, 48, 48); }
    ctx.restore();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex, ey, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, 30 + Math.sin(world.time * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'STORM EYE — CLICK TO PUSH BACK', ex, ey - 34, 11, '#c7d2fe', 'center', 'rgba(7,18,30,0.85)');
    // faint tether to the village
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(CX, CY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawWindArrow(ctx, world) {
  const wa = (world.windAngle * Math.PI) / 180;
  const wx = CX + Math.cos(wa) * (RING_R + 26);
  const wy = CY + Math.sin(wa) * (RING_R + 26);
  ctx.save();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(wx + Math.cos(wa) * 12, wy + Math.sin(wa) * 12);
  ctx.lineTo(wx + Math.cos(wa + 2.5) * 10, wy + Math.sin(wa + 2.5) * 10);
  ctx.lineTo(wx + Math.cos(wa - 2.5) * 10, wy + Math.sin(wa - 2.5) * 10);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'WIND', wx, wy + 26, 10, '#fde68a', 'center', 'rgba(7,18,30,0.85)');
  ctx.restore();
}

function drawPills(ctx, world) {
  // Always-visible WIN / LOSE lines, flanking the top of the ring.
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, 448, 10, 186, 26, 13); ctx.fill();
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, 'WIN', 458, 28, 13, '#4ade80', 'left');
  text(ctx, world.blizzard === BLIZZARDS ? 'Break the Giant' : `Survive 7 blizzards`, 492, 28, 11, '#f8fafc', 'left');
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, 646, 10, 186, 26, 13); ctx.fill();
  ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, 'LOSE', 656, 28, 13, '#f87171', 'left');
  text(ctx, 'All houses fall · 15 lost', 690, 28, 11, '#f8fafc', 'left');
  ctx.restore();
}

function drawBossBar(ctx, world) {
  if (world.blizzard !== BLIZZARDS && !world.eye.active) return;
  const x = 440;
  const y = 44;
  const w = 400;
  const h = 34;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.88)';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const a = world.assets;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 20, y + 17, 13, 0, Math.PI * 2);
  ctx.clip();
  if (a && a.giant) ctx.drawImage(a.giant, x + 7, y + 1, 26, 39);
  else { ctx.fillStyle = '#c7d2fe'; ctx.fillRect(x + 7, y + 4, 26, 26); }
  ctx.restore();
  text(ctx, world.bossDefeated ? 'WHITE GIANT — BROKEN' : 'WHITE GIANT — STORM EYE', x + 40, y + 15, 14, '#e0e7ff', 'left');
  text(ctx, world.bossDefeated ? 'hold until the storm ends' : `pushed back ${world.eye.pushes}/3`, x + 40, y + 29, 10, '#a5b4fc', 'left');
  // push pips
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < world.eye.pushes ? '#818cf8' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x + w - 18 - i * 20, y + 17, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawThreats(ctx, world) {
  tablet(ctx, TL, '⚠  INCOMING THREATS', '#fca5a5');
  const phase = phaseOf(world);
  const danger = world.slopes.filter((s) => s.pack >= 70).length;
  const critical = world.slopes.filter((s) => s.pack >= 90).length;
  const rows = [
    { icon: '❄', name: 'Avalanche', sub: `${danger} slopes deep · ${critical} critical`, frac: danger / 8, color: '#f97316' },
    { icon: '🌨', name: 'Blizzard', sub: `${world.blizzard} of 7 — ${phase.name.toLowerCase()} now`, frac: world.blizzard / 7, color: '#7dd3fc' },
    { icon: '🧊', name: 'Icefall', sub: critical > 0 ? `${critical} slopes about to break` : 'slopes holding, for now', frac: critical / 8, color: '#38bdf8' },
    { icon: '🌫', name: 'Whiteout', sub: phase.id === 'whiteout' ? 'ACTIVE — visibility down' : `next phase in ${Math.ceil(world.phaseTimer)}s`, frac: phase.id === 'whiteout' ? 1 : 0.3, color: '#cbd5e1' },
    { icon: '🐺', name: 'Wolves', sub: world.wolves.length > 0 ? `${world.wolves.length} on the mountain — click to scare` : 'in the treeline, waiting', frac: world.wolves.length / 5, color: '#a78bfa' },
  ];
  let y = TL.y + 38;
  for (const r of rows) {
    text(ctx, r.icon, TL.x + 10, y + 10, 14, '#fff', 'left');
    text(ctx, r.name, TL.x + 32, y + 8, 13, '#f8fafc', 'left');
    text(ctx, r.sub, TL.x + 32, y + 21, 10, '#cbd5e1', 'left');
    bar(ctx, TL.x + 216, y + 4, 66, 7, r.frac, r.color);
    y += 30;
  }
  const nextPhase = ['calm', 'snowfall', 'whiteout', 'clear'][(world.phaseIndex + 1) % 4].toUpperCase();
  const windDeg = Math.round(((world.windAngle % 360) + 360) % 360);
  text(ctx, `NEXT: ${nextPhase} ${Math.ceil(world.phaseTimer)}s · WIND ${windDeg}°`, TL.x + 10, TL.y + TL.h - 8, 10, '#7dd3fc', 'left');
}

function drawRescue(ctx, world) {
  tablet(ctx, TR, '🏠  VILLAGE RESCUE', '#86efac');
  const v = world.villagers;
  const alive = housesAlive(world);
  const rows = [
    { name: 'Evacuated', n: v.evacuated, color: '#4ade80' },
    { name: 'Protected', n: v.protected, color: '#7dd3fc' },
    { name: 'At risk', n: v.atRisk, color: '#fbbf24' },
    { name: 'Lost', n: v.lost, color: '#f87171' },
  ];
  let y = TR.y + 38;
  for (const r of rows) {
    text(ctx, r.name, TR.x + 12, y, 13, '#f8fafc', 'left');
    bar(ctx, TR.x + 110, y - 10, 120, 8, Math.min(1, r.n / 50), r.color);
    text(ctx, `${r.n} / ${v.total}`, TR.x + 238, y, 13, '#fff', 'left');
    y += 23;
  }
  text(ctx, `HOUSES  ${alive} / 10 standing`, TR.x + 12, y + 1, 12, '#f8fafc', 'left');
  const hpFrac = world.houses.reduce((a, h) => a + Math.max(0, h.hp), 0) / 1000;
  bar(ctx, TR.x + 12, y + 9, 200, 8, hpFrac, '#f59e0b');
  text(ctx, `WARMTH  ${Math.round(world.warmth)}°`, TR.x + 12, y + 31, 12, world.warmth < 30 ? '#fca5a5' : '#f8fafc', 'left');
  bar(ctx, TR.x + 12, y + 39, 200, 8, world.warmth / 100, world.warmth < 30 ? '#ef4444' : '#fbbf24');
  text(ctx, world.buried.length > 0 ? `⚠ ${world.buried.length} BURIED — CLICK TO RESCUE` : 'No one buried. The village breathes.', TR.x + 12, TR.y + TR.h - 8, 11, world.buried.length > 0 ? '#fca5a5' : '#86efac', 'left');
}

function drawBuild(ctx, world) {
  const sel = world.slopes[world.selectedSlope];
  tablet(ctx, BL, `🔨  BUILD  —  SLOPE ${sel.name}`, '#fde68a');
  let y = BL.y + 40;
  for (const b of BUILD) {
    const afford = (!b.cost.wood || world.wood >= b.cost.wood) && (!b.cost.food || world.food >= b.cost.food);
    ctx.fillStyle = afford ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    rr(ctx, BL.x + 8, y - 13, BL.w - 16, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    rr(ctx, BL.x + 14, y - 10, 20, 20, 5);
    ctx.fill();
    text(ctx, b.key, BL.x + 24, y + 5, 13, '#0b1c2c', 'center');
    text(ctx, b.name, BL.x + 42, y + 4, 13, afford ? '#f8fafc' : '#64748b', 'left');
    text(ctx, b.desc, BL.x + 42, y + 16, 10, '#94a3b8', 'left');
    const cost = b.cost.wood ? `🪵${b.cost.wood}` : `🍞${b.cost.food}`;
    text(ctx, cost, BL.x + BL.w - 14, y + 5, 13, afford ? '#fde68a' : '#ef4444', 'right');
    y += 29;
  }
  text(ctx, 'SPACE horn · H stoke hearth · R rescue · P pause · M mute', BL.x + 10, BL.y + BL.h - 8, 11, '#7dd3fc', 'left');
}

function drawWeather(ctx, world) {
  const phase = phaseOf(world);
  tablet(ctx, BR, '🌦  WEATHER & STORES', '#7dd3fc');
  const px = BR.x + 12;
  let y = BR.y + 42;
  text(ctx, `${phase.name} — BLIZZARD ${world.blizzard}/7`, px, y, 14, '#f8fafc', 'left');
  const phaseFrac = 1 - world.phaseTimer / phase.dur;
  bar(ctx, px + 210, y - 11, 150, 8, phaseFrac, '#7dd3fc');
  text(ctx, world.finalStand ? 'FINAL STAND' : `${Math.ceil(world.blizzardTimer)}s left`, BR.x + BR.w - 12, y, 12, '#fde68a', 'right');
  y += 24;
  // resources
  const res = [
    { icon: '🪵', name: 'WOOD', n: world.wood },
    { icon: '🍞', name: 'FOOD', n: world.food },
    { icon: '🔥', name: 'WARMTH', n: `${Math.round(world.warmth)}°` },
  ];
  for (const r of res) {
    text(ctx, `${r.icon} ${r.name}`, px, y, 13, '#f8fafc', 'left');
    text(ctx, String(r.n), px + 150, y, 15, '#fff', 'left');
    y += 22;
  }
  // combo + grade + score
  const mult = multFor(world.combo);
  text(ctx, `COMBO  x${mult.toFixed(2)}`, px, y + 2, 15, '#fde68a', 'left');
  bar(ctx, px + 130, y - 8, 110, 8, world.comboTimer / 6, '#fde68a');
  text(ctx, `chain ${world.combo}`, px + 250, y + 2, 11, '#cbd5e1', 'left');
  // grade badge
  const grade = gradeFor(world.score);
  ctx.fillStyle = grade === 'S' ? '#fde68a' : grade === 'A' ? '#4ade80' : '#7dd3fc';
  ctx.beginPath();
  ctx.arc(BR.x + BR.w - 46, y - 2, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1c2c';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, grade, BR.x + BR.w - 46, y + 6, 22, '#0b1c2c', 'center');
  text(ctx, 'GRADE', BR.x + BR.w - 46, y + 34, 9, '#cbd5e1', 'center');
  y += 30;
  text(ctx, 'SCORE', px, y, 11, '#94a3b8', 'left');
  text(ctx, world.score.toLocaleString('en-US'), px + 60, y, 18, '#fff', 'left');
  text(ctx, 'BEST', px + 200, y, 11, '#94a3b8', 'left');
  text(ctx, Math.max(world.best, world.score).toLocaleString('en-US'), px + 240, y, 18, '#fde68a', 'left');
  text(ctx, world.audioMuted ? 'SOUND OFF [M]' : 'SOUND ON [M]', BR.x + BR.w - 12, BR.y + BR.h - 8, 11, '#7dd3fc', 'right');
}

function drawLog(ctx, world) {
  if (world.log.length === 0) return;
  const x = 452;
  const y = 668;
  const w = 376;
  const h = 40;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.8)';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const fit = (s) => {
    ctx.font = `11px ${FONT}`;
    let t = s;
    while (t.length > 0 && ctx.measureText(t).width > w - 20) t = t.slice(0, -1);
    return t.length < s.length ? t.slice(0, -1) + '…' : t;
  };
  text(ctx, fit(world.log[0] || ''), x + 10, y + 15, 11, '#f8fafc', 'left');
  if (world.log[1]) text(ctx, fit(world.log[1]), x + 10, y + 31, 11, '#94a3b8', 'left');
  ctx.restore();
  ctx.restore();
}

function drawBanner(ctx, world) {
  if (world.bannerTimer <= 0 || !world.banner) return;
  const w = 560;
  const x = CX - w / 2;
  const y = 84;
  ctx.save();
  ctx.fillStyle = 'rgba(7, 18, 30, 0.88)';
  rr(ctx, x, y, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, world.banner, CX, y + 20, 15, '#fde68a', 'center');
  ctx.restore();
}

function drawFloats(ctx, world) {
  for (const f of world.floats) {
    const alpha = Math.max(0, Math.min(1, f.life / 0.6));
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y, 16, f.color, 'center', 'rgba(7,18,30,0.9)');
    ctx.globalAlpha = 1;
  }
}

function drawSnow(ctx, world) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const p of world.particles) {
    if (p.kind !== 'snow') continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWhiteout(ctx, world) {
  if (phaseOf(world).id !== 'whiteout' || world.screen !== SCREEN_PLAY) return;
  const g = ctx.createRadialGradient(CX, CY, 120, CX, CY, 620);
  g.addColorStop(0, 'rgba(226, 232, 240, 0.05)');
  g.addColorStop(1, 'rgba(226, 232, 240, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// --- full screens -----------------------------------------------------------

function drawTitle(ctx, world) {
  const a = world.assets;
  if (a && a.title) ctx.drawImage(a.title, 0, 0, W, H);
  else { ctx.fillStyle = '#0b1c2c'; ctx.fillRect(0, 0, W, H); }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,18,30,0.25)');
  g.addColorStop(0.55, 'rgba(7,18,30,0.45)');
  g.addColorStop(1, 'rgba(7,18,30,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'WHITEOUT', CX, 150, 110, '#f8fafc', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, 'HOLD THE VILLAGE THROUGH 7 BLIZZARDS', CX, 196, 24, '#fde68a', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, 'The snow itself is the enemy. Release it before it releases itself.', CX, 226, 16, '#e2e8f0', 'center', 'rgba(7,18,30,0.85)');

  // Left panel: how to play.
  const px = 150;
  const py = 268;
  ctx.fillStyle = 'rgba(7, 18, 30, 0.82)';
  rr(ctx, px, py, 470, 250, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'HOW TO PLAY', px + 18, py + 30, 18, '#fde68a', 'left');
  const lines = [
    ['❄', 'CLICK A SLOPE — release its snowpack before it hits 100.'],
    ['🐺', 'CLICK A WOLF — scare it off before it steals food.'],
    ['🆘', 'CLICK A BURIED VILLAGER — send a rescue team (2 food).'],
    ['🔥', 'CLICK A HOUSE — stoke its hearth (2 wood) or it goes cold.'],
    ['🔨', 'KEYS 1–5 — fence, ice wall, tunnel, bell, heater.'],
    ['📯', 'SPACE — horn: scares every wolf.  P pause · M mute.'],
  ];
  let y = py + 58;
  for (const [icon, s] of lines) {
    text(ctx, icon, px + 18, y, 15, '#fff', 'left');
    text(ctx, s, px + 44, y, 13, '#f8fafc', 'left');
    y += 26;
  }
  text(ctx, 'Between blizzards: draft 1 of 3 upgrades. On blizzard 7, push', px + 18, y + 6, 12, '#94a3b8', 'left');
  text(ctx, 'the White Giant’s storm eye back 3 times to break it.', px + 18, y + 24, 12, '#94a3b8', 'left');

  // Right panel: win / lose + features.
  const qx = 660;
  ctx.fillStyle = 'rgba(7, 18, 30, 0.82)';
  rr(ctx, qx, py, 470, 250, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'WIN  ·  LOSE', qx + 18, py + 30, 18, '#fde68a', 'left');
  text(ctx, 'WIN — survive all 7 blizzards and break the White Giant.', qx + 18, py + 58, 13, '#4ade80', 'left');
  text(ctx, 'LOSE — every house falls, or 15 villagers are lost.', qx + 18, py + 82, 13, '#f87171', 'left');
  text(ctx, 'WHAT MAKES IT WHITEOUT', qx + 18, py + 116, 15, '#7dd3fc', 'left');
  const feats = [
    'Snowpack depth on every slope — the mountain is the enemy.',
    'Warmth & hearths: houses go cold if you forget them.',
    'Rescue teams, weather phases, wolves in the whiteout.',
    'A storm ring, not a top bar. The map IS the screen.',
  ];
  let fy = py + 142;
  for (const f of feats) {
    text(ctx, '✦ ' + f, qx + 18, fy, 12, '#e2e8f0', 'left');
    fy += 22;
  }
  text(ctx, `BEST SCORE  ${Math.max(world.best, 0).toLocaleString('en-US')}`, qx + 18, py + 232, 14, '#fde68a', 'left');

  // PLAY button.
  ctx.fillStyle = '#f59e0b';
  rr(ctx, CX - 130, 548, 260, 56, 12); ctx.fill();
  ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, '▶  PLAY', CX, 586, 28, '#0b1c2c', 'center');
  text(ctx, 'CLICK PLAY OR PRESS ENTER  ·  SEED 20261117  ·  SOUND ON [M]', CX, 636, 12, '#cbd5e1', 'center');
  // giant cameo
  if (a && a.giant) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(1150, 120, 52, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(a.giant, 1098, 40, 104, 156);
    ctx.restore();
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(1150, 120, 52, 0, Math.PI * 2); ctx.stroke();
    text(ctx, 'THE WHITE GIANT', 1150, 190, 12, '#c7d2fe', 'center', 'rgba(7,18,30,0.85)');
  }
}

function drawDraft(ctx, world) {
  ctx.fillStyle = 'rgba(7, 18, 30, 0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'THE THAW', CX, 92, 54, '#fde68a', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, `BLIZZARD ${world.draftFromBlizzard} SURVIVED — THE SNOW PAUSES. CHOOSE ONE UPGRADE.`, CX, 128, 17, '#e2e8f0', 'center', 'rgba(7,18,30,0.85)');
  text(ctx, `SCORE ${world.score.toLocaleString('en-US')}  ·  HOUSES ${housesAlive(world)}/10  ·  LOST ${world.villagers.lost}  ·  WOOD ${world.wood}  ·  FOOD ${world.food}`, CX, 156, 14, '#7dd3fc', 'center', 'rgba(7,18,30,0.85)');
  const cw = 300;
  const ch = 330;
  const gap = 30;
  const total = cw * 3 + gap * 2;
  let x = CX - total / 2;
  const y = 190;
  world.draftChoices.forEach((c, i) => {
    ctx.fillStyle = 'rgba(15, 32, 52, 0.95)';
    rr(ctx, x, y, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(x + cw / 2, y + 58, 34, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1), x + cw / 2, y + 70, 30, '#0b1c2c', 'center');
    text(ctx, c.name, x + cw / 2, y + 128, 22, '#f8fafc', 'center');
    ctx.strokeStyle = 'rgba(125,211,252,0.4)';
    ctx.beginPath(); ctx.moveTo(x + 30, y + 146); ctx.lineTo(x + cw - 30, y + 146); ctx.stroke();
    // wrap description
    const words = c.desc.split(' ');
    let line = '';
    let ly = y + 176;
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 30) {
        text(ctx, line.trim(), x + cw / 2, ly, 13, '#e2e8f0', 'center');
        line = w;
        ly += 22;
      } else line += ' ' + w;
    }
    if (line.trim()) text(ctx, line.trim(), x + cw / 2, ly, 13, '#e2e8f0', 'center');
    text(ctx, `PRESS ${i + 1} OR CLICK`, x + cw / 2, y + ch - 22, 12, '#fde68a', 'center');
    x += cw + gap;
  });
  text(ctx, 'The next blizzard starts the moment you choose. The mountain does not wait.', CX, 566, 14, '#94a3b8', 'center');
}

function drawEnd(ctx, world, won) {
  const a = world.assets;
  if (a && a.title) ctx.drawImage(a.title, 0, 0, W, H);
  else { ctx.fillStyle = '#0b1c2c'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(7, 18, 30, 0.72)';
  ctx.fillRect(0, 0, W, H);
  const r = world.result || { score: 0, best: 0, grade: 'D', blizzard: 1, releases: 0, rescues: 0, wolves: 0, avalanches: 0, houses: 0, lost: 0 };
  text(ctx, won ? 'THE VILLAGE STANDS' : 'THE SNOW WINS', CX, 108, 64, won ? '#fde68a' : '#fca5a5', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, won ? 'Seven blizzards. One broken Giant. Every hearth still lit.' : world.loseReason || 'The mountain keeps what it takes.', CX, 148, 17, '#e2e8f0', 'center', 'rgba(7,18,30,0.85)');
  // grade badge + score
  ctx.fillStyle = r.grade === 'S' ? '#fde68a' : r.grade === 'A' ? '#4ade80' : '#7dd3fc';
  ctx.beginPath(); ctx.arc(CX - 190, 210, 52, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0b1c2c'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, r.grade, CX - 190, 228, 56, '#0b1c2c', 'center');
  text(ctx, 'GRADE', CX - 190, 290, 13, '#cbd5e1', 'center');
  text(ctx, r.score.toLocaleString('en-US'), CX + 40, 228, 56, '#fff', 'center');
  text(ctx, r.newBest ? '★ NEW BEST ★' : `BEST ${r.best.toLocaleString('en-US')}`, CX + 40, 262, 15, '#fde68a', 'center');
  // stats grid
  const px = 340;
  const py = 320;
  ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
  rr(ctx, px, py, 600, 190, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  const stats = [
    ['BLIZZARDS', `${r.blizzard} / 7`],
    ['RELEASES', String(r.releases)],
    ['RESCUES', String(r.rescues)],
    ['WOLVES SCARED', String(r.wolves)],
    ['AVALANCHES', String(r.avalanches)],
    ['HOUSES LEFT', `${r.houses} / 10`],
    ['VILLAGERS LOST', String(r.lost)],
    ['COMBO BEST', `x${multFor(world.bestCombo || 0).toFixed(2)}`],
  ];
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = px + 30 + col * 300;
    const sy = py + 38 + row * 40;
    text(ctx, s[0], sx, sy, 12, '#94a3b8', 'left');
    text(ctx, s[1], sx + 150, sy, 16, '#fff', 'left');
  });
  ctx.fillStyle = '#f59e0b';
  rr(ctx, CX - 230, 548, 220, 52, 12); ctx.fill();
  text(ctx, '↻  PLAY AGAIN', CX - 120, 582, 20, '#0b1c2c', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, CX + 10, 548, 220, 52, 12); ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'MENU  [ESC]', CX + 120, 582, 20, '#f8fafc', 'center');
  text(ctx, 'CLICK A BUTTON OR PRESS ENTER TO PLAY AGAIN', CX, 636, 12, '#cbd5e1', 'center');
}

function drawPause(ctx, world) {
  ctx.fillStyle = 'rgba(7, 18, 30, 0.66)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', CX, 300, 72, '#f8fafc', 'center', 'rgba(7,18,30,0.9)');
  text(ctx, `BLIZZARD ${world.blizzard}/7  ·  SCORE ${world.score.toLocaleString('en-US')}  ·  HOUSES ${housesAlive(world)}/10`, CX, 348, 16, '#7dd3fc', 'center');
  text(ctx, 'CLICK A SLOPE — release snow  ·  CLICK A WOLF — scare it  ·  CLICK BURIED — rescue', CX, 396, 14, '#e2e8f0', 'center');
  text(ctx, 'KEYS 1–5 build  ·  SPACE horn  ·  H stoke  ·  R rescue  ·  M mute', CX, 422, 14, '#e2e8f0', 'center');
  text(ctx, 'P / ESC — RESUME', CX, 468, 16, '#fde68a', 'center');
}

// --- hit testing (shared by main.js) ---------------------------------------

export function eyePos(world) {
  const ea = (world.eye.angle * Math.PI) / 180;
  return { x: CX + Math.cos(ea) * world.eye.dist, y: CY + Math.sin(ea) * world.eye.dist };
}

export function hitTest(world, x, y) {
  if (world.screen === SCREEN_TITLE) {
    if (x >= CX - 130 && x <= CX + 130 && y >= 548 && y <= 604) return { kind: 'play' };
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_DRAFT) {
    const cw = 300;
    const gap = 30;
    const total = cw * 3 + gap * 2;
    let bx = CX - total / 2;
    for (let i = 0; i < world.draftChoices.length; i++) {
      if (x >= bx && x <= bx + cw && y >= 190 && y <= 520) return { kind: 'draft', index: i };
      bx += cw + gap;
    }
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
    if (x >= CX - 230 && x <= CX - 10 && y >= 548 && y <= 600) return { kind: 'play' };
    if (x >= CX + 10 && x <= CX + 230 && y >= 548 && y <= 600) return { kind: 'menu' };
    return { kind: 'none' };
  }
  if (world.screen === SCREEN_PAUSE) return { kind: 'resume' };
  if (world.screen !== SCREEN_PLAY) return { kind: 'none' };

  // Boss eye first (it rides the ring).
  if (world.eye.active && !world.bossDefeated) {
    const e = eyePos(world);
    if (Math.hypot(x - e.x, y - e.y) < 30) return { kind: 'eye' };
  }
  for (const w of world.wolves) {
    if (Math.hypot(x - w.x, y - w.y) < 22) return { kind: 'wolf', wolf: w };
  }
  for (const b of world.buried) {
    if (Math.hypot(x - b.x, y - b.y) < 20) return { kind: 'buried', buried: b };
  }
  for (const h of world.houses) {
    if (!h.dead && Math.hypot(x - h.x, y - h.y) < 18) return { kind: 'house', house: h };
  }
  // Build rows.
  if (x >= BL.x && x <= BL.x + BL.w && y >= BL.y + 27 && y <= BL.y + 27 + 5 * 29) {
    const i = Math.floor((y - (BL.y + 27)) / 29);
    if (i >= 0 && i < BUILD.length) return { kind: 'build', index: i };
  }
  // Sound toggle (bottom-right of the weather tablet).
  if (x >= BR.x + BR.w - 120 && x <= BR.x + BR.w && y >= BR.y + BR.h - 24 && y <= BR.y + BR.h) {
    return { kind: 'mute' };
  }
  // Slopes: inside the mountain ring, outside the village.
  const dx = x - CX;
  const dy = y - CY;
  const d = Math.hypot(dx, dy);
  if (d >= 100 && d <= MOUNTAIN_R + 6) {
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    let bestI = 0;
    let bestD = 360;
    for (let i = 0; i < 8; i++) {
      const diff = Math.abs(((ang - SLOPE_ANGLES[i] + 540) % 360) - 180);
      if (diff < bestD) { bestD = diff; bestI = i; }
    }
    if (bestD <= 22.5) return { kind: 'slope', slope: world.slopes[bestI] };
  }
  return { kind: 'none' };
}

// --- main entry --------------------------------------------------------------

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 14, (Math.random() - 0.5) * world.shake * 14);
  }
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_DRAFT) {
    drawMountain(ctx, world);
    drawStormRing(ctx, world);
    drawPills(ctx, world);
    drawThreats(ctx, world);
    drawRescue(ctx, world);
    drawBuild(ctx, world);
    drawWeather(ctx, world);
    drawWindArrow(ctx, world);
    drawDraft(ctx, world);
  } else if (world.screen === SCREEN_WIN) {
    drawEnd(ctx, world, true);
  } else if (world.screen === SCREEN_LOSE) {
    drawEnd(ctx, world, false);
  } else {
    drawMountain(ctx, world);
    drawStormRing(ctx, world);
    drawPills(ctx, world);
    drawBossBar(ctx, world);
    drawThreats(ctx, world);
    drawRescue(ctx, world);
    drawBuild(ctx, world);
    drawWeather(ctx, world);
    drawWindArrow(ctx, world);
    drawLog(ctx, world);
    drawBanner(ctx, world);
    drawWhiteout(ctx, world);
    drawSnow(ctx, world);
    drawFloats(ctx, world);
    if (world.screen === SCREEN_PAUSE) drawPause(ctx, world);
  }
  ctx.restore();
}
