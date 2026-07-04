/* ============================================================================
   RPOD SIMULATOR  —  2D rendezvous & docking on the Clohessy-Wiltshire eqns
   Relative motion of a chaser in the target's LVLH (Hill) frame:
       ẍ - 2n·ẏ - 3n²x = ax        (x = radial / R-bar, + = zenith)
       ÿ + 2n·ẋ        = ay        (y = along-track / V-bar, + = prograde)
   RK4 integration + impulsive RCS thrust. Fly it to a soft dock at the origin.
   Renders inline in the terminal (reuses .orbit-app / .oc* styling). Quit: q
   ============================================================================ */
(function () {
  "use strict";

  const N = 0.0011303;            // target mean motion [rad/s] (~LEO, T≈92.7 min)
  const DV = 0.05;                // RCS impulse per tap [m/s]
  const DOCK_R = 5;               // docking box half-size [m]
  const DOCK_V = 0.15;            // max soft-dock speed [m/s]
  const CRASH_V = 0.60;           // contact above this = collision [m/s]
  const WARPS = [1, 10, 30, 60, 120, 300];

  const G = {
    v: "│", h: "─", tl: "┌", tr: "┐", bl: "└", br: "┘",
    tj: "┬", bj: "┴", lj: "├", rj: "┤",
    axis: "·", grid: "·",
    chaser: "◉", target: "▣", trail: "·", trailHot: "•",
  };

  // ---- scenarios (classic RPOD geometries) ----------------------------------
  // x0 radial [m], y0 along-track [m], vx0/vy0 [m/s]
  const SCEN = [
    { key: "vbar", name: "V-BAR APPROACH", note: "co-elliptic hold, behind",
      x0: 0, y0: -220, vx0: 0, vy0: 0 },
    { key: "rbar", name: "R-BAR APPROACH", note: "from below (nadir)",
      x0: -160, y0: 0, vx0: 0, vy0: 0 },
    { key: "football", name: "NATURAL FOOTBALL", note: "drift-free 2:1 ellipse",
      x0: 70, y0: -150, vx0: 0, vy0: null /* set to -2·n·x0 at init */ },
  ];

  // ---- CW dynamics ----------------------------------------------------------
  function deriv(s) {
    const ax = 3 * N * N * s.x + 2 * N * s.vy;
    const ay = -2 * N * s.vx;
    return { x: s.vx, y: s.vy, vx: ax, vy: ay };
  }
  function rk4(s, dt) {
    const k1 = deriv(s);
    const s2 = { x: s.x + k1.x * dt / 2, y: s.y + k1.y * dt / 2, vx: s.vx + k1.vx * dt / 2, vy: s.vy + k1.vy * dt / 2 };
    const k2 = deriv(s2);
    const s3 = { x: s.x + k2.x * dt / 2, y: s.y + k2.y * dt / 2, vx: s.vx + k2.vx * dt / 2, vy: s.vy + k2.vy * dt / 2 };
    const k3 = deriv(s3);
    const s4 = { x: s.x + k3.x * dt, y: s.y + k3.y * dt, vx: s.vx + k3.vx * dt, vy: s.vy + k3.vy * dt };
    const k4 = deriv(s4);
    return {
      x: s.x + dt / 6 * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      y: s.y + dt / 6 * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
      vx: s.vx + dt / 6 * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
      vy: s.vy + dt / 6 * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
    };
  }

  // ---- screen buffer --------------------------------------------------------
  let COLS = 0, ROWS = 0, buf = null, cls = null;
  function alloc(cols, rows) {
    COLS = cols; ROWS = rows; buf = new Array(rows); cls = new Array(rows);
    for (let r = 0; r < rows; r++) { buf[r] = new Array(cols).fill(" "); cls[r] = new Array(cols).fill(0); }
  }
  function clear() { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { buf[r][c] = " "; cls[r][c] = 0; } }
  function put(c, r, ch, k) { if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return; buf[r][c] = ch; cls[r][c] = k || 0; }
  function text(c, r, str, k) { for (let j = 0; j < str.length; j++) put(c + j, r, str[j], k); }
  function box(c, r, w, h, k) {
    text(c + 1, r, G.h.repeat(Math.max(0, w - 2)), k);
    text(c + 1, r + h - 1, G.h.repeat(Math.max(0, w - 2)), k);
    for (let y = 1; y < h - 1; y++) { put(c, r + y, G.v, k); put(c + w - 1, r + y, G.v, k); }
    put(c, r, G.tl, k); put(c + w - 1, r, G.tr, k); put(c, r + h - 1, G.bl, k); put(c + w - 1, r + h - 1, G.br, k);
  }

  // ---- app state ------------------------------------------------------------
  let appEl = null, screenEl = null, cellW = 9, cellH = 15;
  let mapX, mapY, mapW, mapH, hudX, hudW = 30, cx, cy;
  let state = null, scenIdx = 0, simT = 0, warpIdx = 2, running = true;
  let dvUsed = 0, status = "APPROACH", trail = [], trailAcc = 0;
  let viewHalf = 260, burnFlash = null, rafId = null, lastMs = 0, pendingScroll = false;

  function initScenario(idx) {
    scenIdx = ((idx % SCEN.length) + SCEN.length) % SCEN.length;
    const s = SCEN[scenIdx];
    const vy0 = (s.vy0 === null) ? -2 * N * s.x0 : s.vy0;   // football → drift-free
    state = { x: s.x0, y: s.y0, vx: s.vx0, vy: vy0 };
    simT = 0; dvUsed = 0; status = "APPROACH"; running = true; trail = []; trailAcc = 0;
    viewHalf = Math.max(30, Math.hypot(s.x0, s.y0) * 1.25 || 60);
    burnFlash = null;
  }

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
    const cols = Math.min(240, Math.max(76, Math.floor(availW / cellW)));
    const rows = Math.min(52, Math.max(28, Math.floor((window.innerHeight * 0.82) / cellH)));
    alloc(cols, rows);
    hudX = COLS - hudW - 1;
    mapX = 2; mapY = 3; mapW = hudX - 1 - mapX - 1; mapH = ROWS - 6;
    cx = mapX + mapW / 2; cy = mapY + mapH / 2;
  }

  // world (x=radial, y=along-track) → screen cell, isotropic scale
  function rowScale() { return (mapH / 2) / viewHalf; }
  function colScale() { return (mapH / 2) * (cellH / cellW) / viewHalf; }
  function w2c(y) { return Math.round(cx + y * colScale()); }
  function w2r(x) { return Math.round(cy - x * rowScale()); }
  const inMap = (c, r) => r >= mapY && r < mapY + mapH && c >= mapX && c < mapX + mapW;

  // ---- format helpers -------------------------------------------------------
  function fmt(n, w, d) { let s = (d === undefined) ? String(n) : n.toFixed(d); while (s.length < w) s = " " + s; return s; }
  function sgn(n, d) { return (n >= 0 ? "+" : "") + n.toFixed(d); }
  function hms(sec) { sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s); }

  // ---- render ---------------------------------------------------------------
  function drawFrame() {
    clear();
    box(0, 0, COLS, ROWS, 2);
    text(2, 0, "┤ RPOD SIMULATOR ├", 4);
    const clk = " T+" + hms(simT) + " ";
    text(COLS - clk.length - 2, 0, "┤" + clk + "├", 2);
    for (let y = 1; y < ROWS - 3; y++) put(hudX - 1, y, G.v, 2);
    put(hudX - 1, 0, G.tj, 2); put(hudX - 1, ROWS - 3, G.bj, 2);
    text(1, ROWS - 3, G.h.repeat(COLS - 2), 2);
    put(0, ROWS - 3, G.lj, 2); put(COLS - 1, ROWS - 3, G.rj, 2);
    text(mapX, 1, "(FIG.2) RELATIVE MOTION — LVLH / HILL FRAME · CW EQUATIONS", 1);

    // axes (V-bar horizontal, R-bar vertical) through the target at origin
    const orow = w2r(0), ocol = w2c(0);
    for (let c = mapX; c < mapX + mapW; c++) if (inMap(c, orow)) put(c, orow, G.axis, 3);
    for (let r = mapY; r < mapY + mapH; r++) if (inMap(ocol, r)) put(ocol, r, G.axis, 3);
    // axis labels
    if (inMap(ocol, mapY)) text(ocol + 1, mapY, "+R ZENITH", 1);
    if (inMap(ocol, mapY + mapH - 1)) text(ocol + 1, mapY + mapH - 1, "-R NADIR", 1);
    text(mapX + mapW - 11, orow - 1, "+V PROGRADE", 1);
    text(mapX + 1, orow - 1, "-V", 1);

    // docking box around the target
    const bxr = Math.max(1, Math.round(DOCK_R * rowScale()));
    const bxc = Math.max(1, Math.round(DOCK_R * colScale()));
    box(ocol - bxc, orow - bxr, bxc * 2 + 1, bxr * 2 + 1, 1);
    put(ocol, orow, G.target, 4);

    // trail (natural + burned path) — faint, most-recent hot
    for (let i = 0; i < trail.length; i++) {
      const c = w2c(trail[i].y), r = w2r(trail[i].x);
      const hot = i > trail.length - 18;
      if (inMap(c, r) && !(c === ocol && r === orow)) put(c, r, hot ? G.trailHot : G.trail, hot ? 7 : 3);
    }

    // chaser + velocity vector
    const chc = w2c(state.y), chr = w2r(state.x);
    const spd = Math.hypot(state.vx, state.vy);
    if (spd > 1e-4) {
      const L = 6, ux = state.vx / spd, uy = state.vy / spd;
      for (let i = 1; i <= L; i++) {
        const c = Math.round(chc + uy * i * (cellH / cellW)), r = Math.round(chr - ux * i);
        if (inMap(c, r)) put(c, r, "·", 6);
      }
    }
    if (burnFlash) {
      for (let i = 1; i <= 3; i++) {
        const c = Math.round(chc + burnFlash.dy * i * (cellH / cellW)), r = Math.round(chr - burnFlash.dx * i);
        if (inMap(c, r)) put(c, r, "*", 4);
      }
    }
    put(chc - 1, chr, "‹", 4); put(chc + 1, chr, "›", 4); put(chc, chr, G.chaser, 4);

    // off-screen chaser indicator (arrow toward it from center)
    if (!inMap(chc, chr)) {
      const ang = Math.atan2(-state.x, state.y);
      const ec = Math.round(cx + Math.cos(ang) * (mapW / 2 - 2));
      const er = Math.round(cy - Math.sin(ang) * (mapH / 2 - 2));
      put(ec, er, "◈", 4);
    }

    // ---- HUD ----
    const range = Math.hypot(state.x, state.y);
    const rrate = range > 1e-6 ? (state.x * state.vx + state.y * state.vy) / range : 0; // + opening
    let hy = 2;
    const L = (lab, val, kv) => { text(hudX + 1, hy, lab, 1); text(hudX + hudW - 1 - String(val).length, hy, String(val), kv || 0); hy++; };
    const H = (t) => { hy++; text(hudX + 1, hy, t, 4); hy++; };
    text(hudX + 1, hy, "VEHICLE", 4); hy++;
    text(hudX + 1, hy, "CHASER", 0); hy++;
    text(hudX + 1, hy, SCEN[scenIdx].name, 1); hy++;
    H("REL POSITION");
    L("R  (radial)", sgn(state.x, 1) + " m");
    L("V  (a-track)", sgn(state.y, 1) + " m");
    L("RANGE", fmt(range, 0, 1) + " m", 4);
    H("REL VELOCITY");
    L("Ṙ", sgn(state.vx, 3) + " m/s");
    L("V̇", sgn(state.vy, 3) + " m/s");
    L("SPEED", fmt(Math.hypot(state.vx, state.vy), 0, 3) + " m/s");
    L("RANGE RATE", sgn(rrate, 3) + " m/s", 4);
    H("PROPULSION");
    L("ΔV USED", fmt(dvUsed, 0, 3) + " m/s");
    L("RCS PULSE", DV.toFixed(2) + " m/s");
    H("SIMULATION");
    L("FRAME", "LVLH");
    L("MET", hms(simT));
    L("WARP", WARPS[warpIdx] + "×");
    L("STATE", running ? "▶ RUNNING" : "❚❚ HOLD");
    hy++;
    text(hudX + 1, hy, "STATUS", 4); hy++;
    text(hudX + 1, hy, status, 4); hy++;

    const ctrl = "  ↑↓←→ / WASD thrust    ,/. warp    +/− zoom    [ ] scenario    R reset    Q quit";
    text(1, ROWS - 2, ctrl, 1);
    render();
  }

  function render() {
    let html = "";
    for (let r = 0; r < ROWS; r++) {
      let run = "", rc = -1;
      for (let c = 0; c < COLS; c++) {
        let ch = buf[r][c], k = cls[r][c];
        if (ch === "&") ch = "&amp;"; else if (ch === "<") ch = "&lt;"; else if (ch === ">") ch = "&gt;";
        if (k !== rc) { if (run) html += wrap(run, rc); run = ch; rc = k; } else run += ch;
      }
      html += wrap(run, rc) + "\n";
    }
    screenEl.innerHTML = html;
  }
  function wrap(s, k) { return k ? '<span class="oc' + k + '">' + s + "</span>" : s; }

  // ---- loop & input ---------------------------------------------------------
  function checkStatus() {
    const range = Math.hypot(state.x, state.y);
    const spd = Math.hypot(state.vx, state.vy);
    if (range <= DOCK_R) {
      if (spd <= DOCK_V) { status = "◉ DOCKED — SOFT CAPTURE"; running = false; }
      else if (spd >= CRASH_V) { status = "✖ COLLISION (" + spd.toFixed(2) + " m/s)"; running = false; }
      else status = "CONTACT — TOO FAST, EASE OFF";
    } else if (range > viewHalf * 6) {
      status = "DRIFTING OUT OF RANGE";
    } else {
      status = "APPROACH";
    }
  }
  function loop(ms) {
    if (!appEl) return;
    if (!lastMs) lastMs = ms;
    let dt = (ms - lastMs) / 1000; lastMs = ms;
    if (dt > 0.1) dt = 0.1;
    if (running) {
      const dtSim = dt * WARPS[warpIdx];
      state = rk4(state, dtSim);
      simT += dtSim;
      trailAcc += dtSim;
      if (trailAcc >= 4) { trail.push({ x: state.x, y: state.y }); if (trail.length > 260) trail.shift(); trailAcc = 0; }
      checkStatus();
    }
    if (burnFlash) { burnFlash.t -= dt; if (burnFlash.t <= 0) burnFlash = null; }
    drawFrame();
    if (pendingScroll) { const top = appEl.getBoundingClientRect().top + window.scrollY - 10; window.scrollTo(0, Math.max(0, top)); pendingScroll = false; }
    rafId = requestAnimationFrame(loop);
  }

  function thrust(dx, dy) {
    if (!running) return;
    state.vx += dx * DV; state.vy += dy * DV;
    dvUsed += DV; burnFlash = { dx: -dx, dy: -dy, t: 0.18 }; // plume opposite to Δv
  }
  function onKey(e) {
    const k = e.key;
    if (k === "q" || k === "Q" || k === "Escape") { stopRpod(); e.preventDefault(); return; }
    if (k === " ") { running = !running; e.preventDefault(); return; }
    if (k === "ArrowUp" || k === "w" || k === "W") { thrust(+1, 0); e.preventDefault(); return; }   // +radial
    if (k === "ArrowDown" || k === "s" || k === "S") { thrust(-1, 0); e.preventDefault(); return; }  // -radial
    if (k === "ArrowRight" || k === "d" || k === "D") { thrust(0, +1); e.preventDefault(); return; } // +prograde
    if (k === "ArrowLeft" || k === "a" || k === "A") { thrust(0, -1); e.preventDefault(); return; }  // -prograde
    if (k === "." || k === ">") { warpIdx = Math.min(WARPS.length - 1, warpIdx + 1); e.preventDefault(); return; }
    if (k === "," || k === "<") { warpIdx = Math.max(0, warpIdx - 1); e.preventDefault(); return; }
    if (k === "+" || k === "=") { viewHalf = Math.max(15, viewHalf / 1.2); e.preventDefault(); return; }
    if (k === "-" || k === "_") { viewHalf = Math.min(4000, viewHalf * 1.2); e.preventDefault(); return; }
    if (k === "]") { initScenario(scenIdx + 1); e.preventDefault(); return; }
    if (k === "[") { initScenario(scenIdx - 1); e.preventDefault(); return; }
    if (k === "r" || k === "R") { initScenario(scenIdx); e.preventDefault(); return; }
  }
  function onResize() { if (appEl) layout(); }

  // ---- entry / exit ---------------------------------------------------------
  function startRpod(arg) {
    const key = (arg || "").trim().toLowerCase();
    let idx = SCEN.findIndex((s) => s.key === key);
    initScenario(idx >= 0 ? idx : 0);
    warpIdx = 2; lastMs = 0;

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
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
    pendingScroll = true;
    rafId = requestAnimationFrame(loop);
  }
  function stopRpod() {
    if (rafId) cancelAnimationFrame(rafId); rafId = null;
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onResize);
    if (appEl) appEl.classList.remove("active");
    appEl = null; screenEl = null;
    const cmd = document.getElementById("command");
    if (cmd) cmd.style.display = "";
    const ta = document.getElementById("texter");
    if (ta) setTimeout(() => ta.focus(), 0);
    window.scrollTo(0, document.body.offsetHeight);
  }

  window.startRpod = startRpod;
  window.stopRpod = stopRpod;
})();
