/* ============================================================================
   ASTEROIDS  —  vector-style ASCII arcade game (monochrome)
   Newtonian ship (rotate / thrust / inertia), splitting rocks, wrap-around.
   Renders inline in the terminal (reuses .orbit-app / .oc* styling). Quit: q
   Controls: ←/→ or A/D rotate · ↑ or W thrust · SPACE fire · P pause · Q quit
   ============================================================================ */
(function () {
  "use strict";

  const TWO_PI = Math.PI * 2;
  const SHIP_TURN = 3.6;         // rad/s
  const SHIP_THRUST = 46;        // units/s^2
  const SHIP_DRAG = 0.5;         // per-second exponential damping
  const SHIP_R = 1.5;            // collision radius (units)
  const BULLET_SPD = 52;         // units/s
  const BULLET_LIFE = 1.15;      // s
  const FIRE_CD = 0.17;          // s between shots
  const MAX_BULLETS = 6;
  const INVULN = 2.2;            // s of respawn invulnerability
  const ROCK_R = { 3: 5.2, 2: 3.0, 1: 1.7 };
  const ROCK_SPD = { 3: 6, 2: 9, 1: 13 };
  const ROCK_SCORE = { 3: 20, 2: 50, 1: 100 };

  const G = {
    v: "│", h: "─", tl: "┌", tr: "┐", bl: "└", br: "┘", lj: "├", rj: "┤",
    bullet: "•", star: "·", flame: "▪",
  };

  // ---- screen buffer --------------------------------------------------------
  let COLS = 0, ROWS = 0, buf = null, cls = null;
  function alloc(cols, rows) {
    COLS = cols; ROWS = rows; buf = new Array(rows); cls = new Array(rows);
    for (let r = 0; r < rows; r++) { buf[r] = new Array(cols).fill(" "); cls[r] = new Array(cols).fill(0); }
  }
  function clear() { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { buf[r][c] = " "; cls[r][c] = 0; } }
  function put(c, r, ch, k) { c = Math.round(c); r = Math.round(r); if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return; buf[r][c] = ch; cls[r][c] = k || 0; }
  function text(c, r, s, k) { for (let j = 0; j < s.length; j++) put(c + j, r, s[j], k); }
  function box(c, r, w, h, k) {
    text(c + 1, r, G.h.repeat(Math.max(0, w - 2)), k);
    text(c + 1, r + h - 1, G.h.repeat(Math.max(0, w - 2)), k);
    for (let y = 1; y < h - 1; y++) { put(c, r + y, G.v, k); put(c + w - 1, r + y, G.v, k); }
    put(c, r, G.tl, k); put(c + w - 1, r, G.tr, k); put(c, r + h - 1, G.bl, k); put(c + w - 1, r + h - 1, G.br, k);
  }
  function line(c0, r0, c1, r1, ch, k) {           // Bresenham in cell space
    c0 = Math.round(c0); r0 = Math.round(r0); c1 = Math.round(c1); r1 = Math.round(r1);
    const dc = Math.abs(c1 - c0), dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1, sr = r0 < r1 ? 1 : -1;
    let err = dc - dr, guard = 0;
    for (;;) {
      put(c0, r0, ch, k);
      if (c0 === c1 && r0 === r1) break;
      if (guard++ > 400) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c0 += sc; }
      if (e2 < dc) { err += dc; r0 += sr; }
    }
  }

  // ---- app / world state ----------------------------------------------------
  let appEl = null, screenEl = null, cellW = 9, cellH = 15;
  let mapX, mapY, mapCols, mapRows, uW, uH, aspect;   // aspect = cellH/cellW
  let ship, rocks, bullets, stars, keys, fireCd, score, lives, wave, phase, invuln, overBlink;
  let rafId = null, lastMs = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function wrap(v, m) { return ((v % m) + m) % m; }
  function wrapDelta(d, m) { d = ((d % m) + m) % m; return d > m / 2 ? d - m : d; }

  function measureCell() {
    const fs = screenEl ? getComputedStyle(screenEl).fontSize : "15px";
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-family:var(--mono);font-size:" + fs + ";line-height:1;";
    probe.textContent = "MMMMMMMMMMMMMMMMMMMM";
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    cellW = rect.width / 20; cellH = rect.height;
    document.body.removeChild(probe);
  }
  function layout() {
    measureCell();
    const term = document.getElementById("terminal");
    const availW = (term ? term.clientWidth : window.innerWidth) - 2;
    const cols = Math.min(220, Math.max(76, Math.floor(availW / cellW)));
    const rows = Math.min(50, Math.max(28, Math.floor((window.innerHeight * 0.82) / cellH)));
    alloc(cols, rows);
    mapX = 1; mapY = 2; mapCols = COLS - 2; mapRows = ROWS - 4;
    aspect = cellH / cellW;                 // cols-per-unit horizontally
    uW = mapCols / aspect;                  // world width in isotropic units
    uH = mapRows;                           // world height in units
  }

  // world (ux,uy) → screen cell (isotropic: 1 unit = 1 row height)
  function sc_c(ux) { return mapX + ux * aspect; }
  function sc_r(uy) { return mapY + uy; }

  // ---- entities -------------------------------------------------------------
  function makeRock(x, y, size) {
    const verts = [];
    const nv = 9;
    for (let i = 0; i < nv; i++) verts.push(rnd(0.72, 1.12));
    const dir = rnd(0, TWO_PI), spd = ROCK_SPD[size] * rnd(0.7, 1.15);
    return { x, y, vx: Math.cos(dir) * spd, vy: Math.sin(dir) * spd, size, r: ROCK_R[size], verts, ang: rnd(0, TWO_PI), spin: rnd(-1.4, 1.4) };
  }
  function spawnWave(n) {
    rocks = [];
    for (let i = 0; i < n; i++) {
      // spawn away from the ship
      let x, y, tries = 0;
      do { x = rnd(0, uW); y = rnd(0, uH); tries++; }
      while (tries < 30 && Math.hypot(wrapDelta(x - ship.x, uW), wrapDelta(y - ship.y, uH)) < 18);
      rocks.push(makeRock(x, y, 3));
    }
  }
  function resetShip() { ship.x = uW / 2; ship.y = uH / 2; ship.vx = 0; ship.vy = 0; ship.ang = -Math.PI / 2; invuln = INVULN; }

  function startGame() {
    ship = { x: uW / 2, y: uH / 2, vx: 0, vy: 0, ang: -Math.PI / 2 };
    bullets = []; fireCd = 0; score = 0; lives = 3; wave = 1; phase = "play"; invuln = INVULN; overBlink = 0;
    stars = [];
    const nStars = Math.floor(mapCols * mapRows * 0.014);
    for (let i = 0; i < nStars; i++) stars.push({ c: Math.floor(rnd(mapX, mapX + mapCols)), r: Math.floor(rnd(mapY, mapY + mapRows)) });
    spawnWave(4);
  }

  function fire() {
    if (bullets.length >= MAX_BULLETS) return;
    const bx = ship.x + Math.cos(ship.ang) * 1.4, by = ship.y + Math.sin(ship.ang) * 1.4;
    bullets.push({ x: wrap(bx, uW), y: wrap(by, uH), vx: ship.vx + Math.cos(ship.ang) * BULLET_SPD, vy: ship.vy + Math.sin(ship.ang) * BULLET_SPD, life: BULLET_LIFE });
    fireCd = FIRE_CD;
  }

  function splitRock(rk, idx) {
    score += ROCK_SCORE[rk.size];
    rocks.splice(idx, 1);
    if (rk.size > 1) { rocks.push(makeRock(rk.x, rk.y, rk.size - 1)); rocks.push(makeRock(rk.x, rk.y, rk.size - 1)); }
  }

  // ---- update ---------------------------------------------------------------
  function update(dt) {
    if (phase === "over") { overBlink += dt; return; }
    // ship control
    if (keys.left) ship.ang -= SHIP_TURN * dt;
    if (keys.right) ship.ang += SHIP_TURN * dt;
    if (keys.thrust) { ship.vx += Math.cos(ship.ang) * SHIP_THRUST * dt; ship.vy += Math.sin(ship.ang) * SHIP_THRUST * dt; }
    const damp = Math.exp(-SHIP_DRAG * dt);
    ship.vx *= damp; ship.vy *= damp;
    ship.x = wrap(ship.x + ship.vx * dt, uW); ship.y = wrap(ship.y + ship.vy * dt, uH);
    fireCd -= dt; if (invuln > 0) invuln -= dt;
    if (keys.fire && fireCd <= 0) fire();

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x = wrap(b.x + b.vx * dt, uW); b.y = wrap(b.y + b.vy * dt, uH); b.life -= dt;
      if (b.life <= 0) bullets.splice(i, 1);
    }
    // rocks
    for (const rk of rocks) { rk.x = wrap(rk.x + rk.vx * dt, uW); rk.y = wrap(rk.y + rk.vy * dt, uH); rk.ang += rk.spin * dt; }

    // bullet vs rock
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = rocks.length - 1; j >= 0; j--) {
        const rk = rocks[j];
        if (Math.hypot(wrapDelta(b.x - rk.x, uW), wrapDelta(b.y - rk.y, uH)) < rk.r) {
          bullets.splice(i, 1); splitRock(rk, j); break;
        }
      }
    }
    // ship vs rock
    if (invuln <= 0) {
      for (let j = 0; j < rocks.length; j++) {
        const rk = rocks[j];
        if (Math.hypot(wrapDelta(ship.x - rk.x, uW), wrapDelta(ship.y - rk.y, uH)) < rk.r + SHIP_R) {
          lives--; if (lives <= 0) { phase = "over"; overBlink = 0; } else resetShip();
          break;
        }
      }
    }
    // wave clear
    if (rocks.length === 0) { wave++; resetShip(); invuln = INVULN * 0.6; spawnWave(3 + wave); }
  }

  // ---- draw -----------------------------------------------------------------
  function drawRock(rk) {
    const cc = sc_c(rk.x), cr = sc_r(rk.y), nv = rk.verts.length;
    let pc, pr, fc, fr;
    for (let i = 0; i <= nv; i++) {
      const a = rk.ang + (i % nv) / nv * TWO_PI, rr = rk.r * rk.verts[i % nv];
      const vc = cc + Math.cos(a) * rr * aspect, vr = cr + Math.sin(a) * rr;
      if (i === 0) { fc = vc; fr = vr; } else { line(pc, pr, vc, vr, "#", 5); }
      pc = vc; pr = vr;
    }
  }
  function drawShip() {
    if (invuln > 0 && Math.floor(invuln * 10) % 2 === 0) return;   // blink while invulnerable
    const cc = sc_c(ship.x), cr = sc_r(ship.y), a = ship.ang;
    const nose = [cc + Math.cos(a) * 2.0 * aspect, cr + Math.sin(a) * 2.0];
    const bl = [cc + Math.cos(a + 2.5) * 1.7 * aspect, cr + Math.sin(a + 2.5) * 1.7];
    const br = [cc + Math.cos(a - 2.5) * 1.7 * aspect, cr + Math.sin(a - 2.5) * 1.7];
    line(nose[0], nose[1], bl[0], bl[1], "*", 4);
    line(nose[0], nose[1], br[0], br[1], "*", 4);
    line(bl[0], bl[1], br[0], br[1], "*", 4);
    if (keys.thrust && Math.floor(lastMs / 60) % 2 === 0) {
      put(cc - Math.cos(a) * 2.2 * aspect, cr - Math.sin(a) * 2.2, G.flame, 4);
    }
  }
  function draw() {
    clear();
    box(0, 0, COLS, ROWS, 2);
    text(2, 0, "┤ ASTEROIDS ├", 4);
    for (const s of stars) put(s.c, s.r, G.star, 3);
    for (const rk of rocks) drawRock(rk);
    for (const b of bullets) put(sc_c(b.x), sc_r(b.y), G.bullet, 4);
    if (phase === "play") drawShip();

    // top status
    text(2, 1, "SCORE " + String(score).padStart(6, "0"), 1);
    const wv = "WAVE " + wave;
    text(Math.floor((COLS - wv.length) / 2), 1, wv, 1);
    text(COLS - 3 - lives * 2, 1, "▲ ".repeat(lives).trim(), 4);

    // bottom bar
    text(1, ROWS - 2, "  ←/→ A D rotate    ↑ W thrust    SPACE fire    P pause    Q quit", 1);

    if (phase === "paused") banner("❚❚ PAUSED", "SPACE / P to resume");
    if (phase === "over") {
      if (Math.floor(overBlink * 2) % 2 === 0) banner("GAME OVER", "SCORE " + score + "  ·  WAVE " + wave);
      else banner("GAME OVER", "R retry   ·   Q quit");
    }
    render();
  }
  function banner(a, b) {
    const w = Math.max(a.length, b.length) + 8, h = 5;
    const c = Math.floor((COLS - w) / 2), r = Math.floor((ROWS - h) / 2);
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) put(x, y, " ", 0);
    box(c, r, w, h, 4);
    text(Math.floor((COLS - a.length) / 2), r + 1, a, 4);
    text(Math.floor((COLS - b.length) / 2), r + 3, b, 1);
  }

  function render() {
    let html = "";
    for (let r = 0; r < ROWS; r++) {
      let run = "", rc = -1;
      for (let c = 0; c < COLS; c++) {
        let ch = buf[r][c], k = cls[r][c];
        if (ch === "&") ch = "&amp;"; else if (ch === "<") ch = "&lt;"; else if (ch === ">") ch = "&gt;";
        if (k !== rc) { if (run) html += wrapc(run, rc); run = ch; rc = k; } else run += ch;
      }
      html += wrapc(run, rc) + "\n";
    }
    screenEl.innerHTML = html;
  }
  function wrapc(s, k) { return k ? '<span class="oc' + k + '">' + s + "</span>" : s; }

  // ---- loop & input ---------------------------------------------------------
  function loop(ms) {
    if (!appEl) return;
    if (!lastMs) lastMs = ms;
    let dt = (ms - lastMs) / 1000; lastMs = ms;
    if (dt > 0.05) dt = 0.05;
    if (phase === "play" || phase === "over") update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }
  function onKey(e) {
    const k = e.key;
    if (k === "q" || k === "Q" || k === "Escape") { stopAsteroids(); e.preventDefault(); return; }
    if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = true; e.preventDefault(); return; }
    if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = true; e.preventDefault(); return; }
    if (k === "ArrowUp" || k === "w" || k === "W") { keys.thrust = true; e.preventDefault(); return; }
    if (k === " ") {
      if (phase === "over") { startGame(); }
      else if (phase === "paused") { phase = "play"; }
      else keys.fire = true;
      e.preventDefault(); return;
    }
    if (k === "p" || k === "P") { phase = (phase === "paused") ? "play" : (phase === "play" ? "paused" : phase); e.preventDefault(); return; }
    if (k === "r" || k === "R") { if (phase === "over") startGame(); e.preventDefault(); return; }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
    else if (k === "ArrowUp" || k === "w" || k === "W") keys.thrust = false;
    else if (k === " ") keys.fire = false;
  }
  function onResize() { if (appEl) { layout(); } }

  // ---- entry / exit ---------------------------------------------------------
  function startAsteroids() {
    keys = { left: false, right: false, thrust: false, fire: false };
    lastMs = 0;

    const term = document.getElementById("terminal");
    const anchor = document.getElementById("before");
    appEl = document.createElement("div");
    appEl.className = "orbit-app active";
    screenEl = document.createElement("pre");
    screenEl.className = "orbit-screen";
    appEl.appendChild(screenEl);
    if (term && anchor) term.insertBefore(appEl, anchor); else document.body.appendChild(appEl);

    const cmd = document.getElementById("command");
    if (cmd) cmd.style.display = "none";
    const ta = document.getElementById("texter");
    if (ta) ta.blur();

    layout();
    startGame();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize);
    const top = appEl.getBoundingClientRect().top + window.scrollY - 10;
    window.scrollTo(0, Math.max(0, top));
    rafId = requestAnimationFrame(loop);
  }
  function stopAsteroids() {
    if (rafId) cancelAnimationFrame(rafId); rafId = null;
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("resize", onResize);
    if (appEl) appEl.classList.remove("active");
    appEl = null; screenEl = null;
    const cmd = document.getElementById("command");
    if (cmd) cmd.style.display = "";
    const ta = document.getElementById("texter");
    if (ta) setTimeout(() => ta.focus(), 0);
    window.scrollTo(0, document.body.offsetHeight);
  }

  window.startAsteroids = startAsteroids;
  window.stopAsteroids = stopAsteroids;
})();
