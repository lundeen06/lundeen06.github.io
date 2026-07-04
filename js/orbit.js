/* ============================================================================
   ORBITAL PROPAGATOR  —  ASCII ground-track visualizer
   Real 2-body Keplerian propagation + J2 secular precession + Earth rotation.
   Renders a full-screen monospace TUI: world map, ground track, telemetry HUD.
   No dependencies. Launched from the terminal via `startOrbit(preset)`, quit `q`.
   ============================================================================ */
(function () {
  "use strict";

  // ---- physical constants ----------------------------------------------------
  const MU = 398600.4418;        // Earth GM [km^3/s^2]
  const RE = 6378.137;           // Earth equatorial radius [km]
  const J2 = 1.08262668e-3;      // Earth oblateness
  const OMEGA_E = 7.2921159e-5;  // Earth rotation rate [rad/s]
  const DEG = Math.PI / 180;
  const TWO_PI = Math.PI * 2;

  // ---- presets (classical elements) ------------------------------------------
  // a [km], e, i/raan/argp/M0 [deg]
  const PRESETS = {
    samwise: { name: "SAMWISE", note: "2U CUBESAT · SSO", a: 6903, e: 0.0012, i: 97.5, raan: 247, argp: 90, M0: 0 },
    iss:     { name: "ISS (ZARYA)", note: "LEO · CREWED", a: 6795, e: 0.0006, i: 51.64, raan: 130, argp: 60, M0: 20 },
    geo:     { name: "GEOSTATIONARY", note: "GEO · 35786 km", a: 42164, e: 0.0001, i: 0.05, raan: 0, argp: 0, M0: 100 },
    molniya: { name: "MOLNIYA", note: "HEO · 12h", a: 26600, e: 0.74, i: 63.4, raan: 300, argp: 270, M0: 0 },
    gps:     { name: "GPS (NAVSTAR)", note: "MEO · 20200 km", a: 26560, e: 0.001, i: 55, raan: 45, argp: 0, M0: 10 },
  };
  const PRESET_ORDER = ["samwise", "iss", "gps", "geo", "molniya"];
  const WARPS = [1, 10, 30, 60, 120, 300, 600, 1800];

  // ---- glyphs (single place to tune the look) --------------------------------
  const G = {
    land: "·",        // continent fill (muted)
    grat: "·",        // graticule dot (faint)
    equator: "·",
    track: "•",       // ground-track point (bold)
    trackFaint: "·",  // older track point
    sat: "◉",         // current sub-satellite point
    v: "│", h: "─", tl: "┌", tr: "┐", bl: "└", br: "┘", tj: "┬", bj: "┴", lj: "├", rj: "┤", cross: "┼",
  };

  // ---- coarse continent polygons [lon,lat] (silhouettes, not survey-grade) ----
  const LAND = [
    // North America
    [[-168,65],[-165,60],[-150,58],[-140,60],[-130,54],[-124,48],[-124,40],[-117,33],[-106,23],[-97,18],[-90,18],[-83,22],[-81,25],[-80,31],[-75,35],[-70,42],[-66,44],[-60,47],[-64,52],[-78,53],[-80,62],[-95,60],[-95,68],[-110,69],[-125,70],[-140,70],[-156,71],[-168,65]],
    // Greenland
    [[-45,60],[-30,60],[-18,68],[-20,78],[-35,83],[-52,80],[-56,70],[-45,60]],
    // South America
    [[-80,9],[-72,11],[-60,10],[-50,0],[-35,-6],[-38,-15],[-48,-25],[-58,-35],[-66,-43],[-71,-52],[-74,-53],[-72,-45],[-72,-34],[-71,-28],[-76,-16],[-81,-5],[-80,3],[-80,9]],
    // Europe
    [[-10,36],[-9,43],[-1,48],[3,51],[-4,58],[6,62],[14,66],[26,71],[35,70],[42,63],[40,55],[33,50],[28,45],[20,41],[14,40],[8,44],[0,43],[-6,36],[-10,36]],
    // British Isles
    [[-6,50],[-2,52],[-3,58],[-8,57],[-10,52],[-6,50]],
    // Africa
    [[-17,15],[-16,21],[-9,28],[1,34],[11,37],[24,32],[33,31],[36,22],[43,12],[51,11],[48,1],[41,-6],[40,-16],[35,-25],[27,-34],[20,-35],[16,-28],[12,-16],[9,-2],[6,4],[-4,5],[-13,9],[-17,15]],
    // Madagascar
    [[43,-13],[50,-16],[50,-25],[45,-25],[43,-13]],
    // Asia
    [[40,66],[60,70],[78,73],[105,77],[130,73],[150,70],[168,68],[180,66],[180,60],[160,60],[150,55],[142,48],[135,45],[128,42],[122,40],[121,34],[123,30],[118,24],[108,19],[100,10],[95,15],[89,22],[82,8],[77,8],[73,20],[66,25],[57,26],[50,30],[46,38],[49,43],[41,46],[40,66]],
    // Japan
    [[130,31],[133,34],[140,38],[143,43],[139,40],[135,35],[130,31]],
    // Indonesia / New Guinea
    [[95,5],[118,2],[135,-1],[147,-4],[142,-9],[120,-9],[100,-3],[95,5]],
    // Australia
    [[113,-22],[122,-18],[130,-12],[137,-12],[142,-11],[147,-19],[153,-28],[150,-37],[143,-39],[135,-35],[129,-32],[118,-35],[114,-30],[113,-22]],
    // New Zealand
    [[166,-46],[171,-44],[175,-41],[174,-37],[172,-40],[167,-45],[166,-46]],
  ];

  function pointInPoly(lon, lat, poly) {
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const xi = poly[a][0], yi = poly[a][1], xj = poly[b][0], yj = poly[b][1];
      if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function isLand(lon, lat) {
    if (lat < -63) return true; // Antarctica band
    for (let k = 0; k < LAND.length; k++) if (pointInPoly(lon, lat, LAND[k])) return true;
    return false;
  }

  // ---- orbital propagation ---------------------------------------------------
  function makeVehicle(p) {
    const a = p.a, e = p.e, inc = p.i * DEG;
    const n = Math.sqrt(MU / (a * a * a));           // mean motion [rad/s]
    const period = TWO_PI / n;                        // [s]
    const pOrb = a * (1 - e * e);
    const j2f = 1.5 * n * J2 * (RE / pOrb) * (RE / pOrb);
    const raanDot = -j2f * Math.cos(inc);                       // [rad/s]
    const argpDot = 0.5 * j2f * (5 * Math.cos(inc) * Math.cos(inc) - 1);
    return {
      preset: p, a, e, inc, n, period, pOrb,
      raan0: p.raan * DEG, argp0: p.argp * DEG, M0: p.M0 * DEG,
      raanDot, argpDot,
    };
  }

  function propagate(veh, t) {
    const e = veh.e, a = veh.a;
    const M = veh.M0 + veh.n * t;
    const raan = veh.raan0 + veh.raanDot * t;
    const argp = veh.argp0 + veh.argpDot * t;
    // solve Kepler
    let E = M;
    for (let k = 0; k < 8; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);
    const r = a * (1 - e * Math.cos(E));
    const xp = r * Math.cos(nu), yp = r * Math.sin(nu);
    // perifocal -> ECI
    const cO = Math.cos(raan), sO = Math.sin(raan);
    const cw = Math.cos(argp), sw = Math.sin(argp);
    const ci = Math.cos(veh.inc), si = Math.sin(veh.inc);
    const x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
    const y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
    const z = (sw * si) * xp + (cw * si) * yp;
    const rmag = Math.sqrt(x * x + y * y + z * z);
    const lat = Math.asin(z / rmag) / DEG;
    const theta = OMEGA_E * t; // GMST0 = 0 at epoch
    let lon = (Math.atan2(y, x) - theta) / DEG;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    const alt = rmag - RE;
    const speed = Math.sqrt(MU * (2 / rmag - 1 / a));
    return { lat, lon, alt, speed, r: rmag, x, y, z, gmst: theta };
  }

  // ---- screen buffer ---------------------------------------------------------
  let COLS = 0, ROWS = 0;
  let buf = null, cls = null; // char + class grids
  function allocBuffer(cols, rows) {
    COLS = cols; ROWS = rows;
    buf = new Array(rows); cls = new Array(rows);
    for (let r = 0; r < rows; r++) { buf[r] = new Array(cols).fill(" "); cls[r] = new Array(cols).fill(0); }
  }
  function clearBuffer() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { buf[r][c] = " "; cls[r][c] = 0; }
  }
  function put(c, r, ch, k) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    buf[r][c] = ch; cls[r][c] = k || 0;
  }
  function text(c, r, str, k) { for (let j = 0; j < str.length; j++) put(c + j, r, str[j], k); }
  function box(c, r, w, h, k) {
    text(c + 1, r, G.h.repeat(Math.max(0, w - 2)), k);
    text(c + 1, r + h - 1, G.h.repeat(Math.max(0, w - 2)), k);
    for (let y = 1; y < h - 1; y++) { put(c, r + y, G.v, k); put(c + w - 1, r + y, G.v, k); }
    put(c, r, G.tl, k); put(c + w - 1, r, G.tr, k);
    put(c, r + h - 1, G.bl, k); put(c + w - 1, r + h - 1, G.br, k);
  }

  // ---- app state -------------------------------------------------------------
  let appEl = null, screenEl = null, cellW = 10, cellH = 16;
  let veh = null, presetKey = "samwise", view = "globe";
  let simT = 0, warpIdx = 3, running = true, rafId = null, lastMs = 0, pendingScroll = false;
  let mapX = 0, mapY = 0, mapW = 0, mapH = 0, hudX = 0, hudW = 26;
  let backdrop = null; // cached {ch,k} for static map region

  function lonToCol(lon) { return mapX + Math.round((lon + 180) / 360 * (mapW - 1)); }
  function latToRow(lat) { return mapY + Math.round((90 - lat) / 180 * (mapH - 1)); }

  function buildBackdrop() {
    backdrop = [];
    for (let ry = 0; ry < mapH; ry++) {
      const lat = 90 - (ry / (mapH - 1)) * 180;
      for (let rx = 0; rx < mapW; rx++) {
        const lon = -180 + (rx / (mapW - 1)) * 360;
        let ch = " ", k = 0;
        if (isLand(lon, lat)) { ch = G.land; k = 5; }
        else {
          const nearMer = Math.abs(((lon + 195) % 30) - 15) < (180 / mapW * 0.9);
          const nearPar = Math.abs(((lat + 90) % 30) - 0) < (90 / mapH * 0.9) || Math.abs(((lat + 90) % 30) - 30) < (90 / mapH * 0.9);
          if (Math.abs(lat) < (90 / mapH * 0.9)) { ch = G.equator; k = 3; }
          else if (nearMer || nearPar) { ch = G.grat; k = 3; }
        }
        backdrop.push({ x: mapX + rx, y: mapY + ry, ch, k });
      }
    }
  }

  // ---- 3D globe geometry (Earth-fixed unit-sphere points, rotated each frame) --
  const CAM_EL = 30 * DEG;            // camera elevation above equator
  const SIN_EL = Math.sin(CAM_EL), COS_EL = Math.cos(CAM_EL);
  // Camera azimuth tracks the orbit plane's node so the orbit always reads as a
  // 3D ellipse (never edge-on), with a gentle sway for depth. The orbit is drawn
  // in fixed ECI while the Earth rotates underneath — true inertial frame.
  let camAz = 2.7, swayPhase = 0;
  let caz = Math.cos(camAz), saz = Math.sin(camAz);
  let zoom = 1;
  let globePts = null;               // [{x0,y0,z0,k}] on unit sphere (Earth-fixed)
  let gcx = 0, gcy = 0, gR = 0, gYk = 1; // screen center, radius (cols), y-squash
  function buildGlobe() {
    globePts = [];
    // continents (dense sample, keep land)
    for (let lat = -88; lat <= 88; lat += 1.7) {
      for (let lon = -180; lon < 180; lon += 1.7) {
        if (!isLand(lon, lat)) continue;
        globePts.push(spherePt(lat, lon, 5));
      }
    }
    // graticule: parallels every 30°, meridians every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) globePts.push(spherePt(lat, lon, 3));
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -84; lat <= 84; lat += 4) globePts.push(spherePt(lat, lon, 3));
    }
    // poles
    globePts.push(spherePt(90, 0, 1)); globePts.push(spherePt(-90, 0, 1));
  }
  function spherePt(lat, lon, k) {
    const la = lat * DEG, lo = lon * DEG;
    const cl = Math.cos(la);
    return { x0: cl * Math.cos(lo), y0: cl * Math.sin(lo), z0: Math.sin(la), k };
  }
  let gBaseR = 0;
  function layoutGlobe() {
    gcx = mapX + mapW / 2;
    gcy = mapY + mapH / 2;
    gYk = cellW / cellH;                          // squash Y so the disk is round
    gBaseR = Math.min(mapW / 2 - 1, (mapH / 2 - 1) / gYk) * 0.72;
    gR = gBaseR * zoom;
  }
  // display radius (units of RE) — exaggerate altitude so orbits read clearly.
  // true LEO sits ~1.08 RE (hugs surface); this lifts it while preserving
  // relative altitude/eccentricity ordering. NOT TO SCALE (labeled as such).
  function dispR(trueRatio) { return 1 + 1.55 * Math.tanh((trueRatio - 1) / 0.32); }
  function projectOrbit(x, y, z) {
    const rr = Math.sqrt(x * x + y * y + z * z);
    const s = dispR(rr / RE) / (rr / RE);         // scale factor on the RE-normalized vec
    return project(x / RE * s, y / RE * s, z / RE * s);
  }
  // project an ECI-frame point → {c,r,zc,pr}. Camera orbits at azimuth camAz,
  // fixed elevation. Orthonormal basis: R=right, U=up, C=toward viewer.
  function project(x, y, z) {
    const Xc = -saz * x + caz * y;                             // P·R
    const Yc = -SIN_EL * caz * x - SIN_EL * saz * y + COS_EL * z; // P·U
    const Zc = COS_EL * caz * x + COS_EL * saz * y + SIN_EL * z;  // P·C (viewer)
    const c = Math.round(gcx + Xc * gR);
    const r = Math.round(gcy - Yc * gR * gYk);
    return { c, r, zc: Zc, pr: Math.sqrt(Xc * Xc + Yc * Yc) };
  }

  function measureCell() {
    const fs = screenEl ? getComputedStyle(screenEl).fontSize : "16px";
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-family:var(--mono);font-size:" + fs + ";line-height:1;";
    probe.textContent = "MMMMMMMMMMMMMMMMMMMM";
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    cellW = rect.width / 20;
    cellH = rect.height;
    document.body.removeChild(probe);
  }

  function layout() {
    measureCell();
    const term = document.getElementById("terminal");
    const availW = (term ? term.clientWidth : window.innerWidth) - 2;
    const cols = Math.min(240, Math.max(76, Math.floor(availW / cellW)));
    // bound height to most of the viewport so it stays inline yet fully visible
    const rows = Math.min(52, Math.max(28, Math.floor((window.innerHeight * 0.82) / cellH)));
    allocBuffer(cols, rows);
    hudW = 28;
    mapX = 2;
    hudX = COLS - hudW - 1;
    mapW = hudX - 1 - mapX - 1;
    // hold a true 2:1 equirectangular aspect given the cell aspect ratio
    const availTop = 3, availBot = ROWS - 4;
    const availH = availBot - availTop + 1;
    const aspectH = Math.round((mapW * cellW / cellH) / 2);
    mapH = Math.max(12, Math.min(availH, aspectH));
    mapY = availTop + Math.floor((availH - mapH) / 2);
    buildBackdrop();
    if (!globePts) buildGlobe();
    layoutGlobe();
  }

  // ---- rendering -------------------------------------------------------------
  function fmt(n, w, d) {
    let s = (d === undefined) ? String(n) : n.toFixed(d);
    while (s.length < w) s = " " + s;
    return s;
  }
  function hms(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  const inMap = (c, r) => r >= mapY && r < mapY + mapH && c >= mapX && c < mapX + mapW;

  // -------- ground-track (2D) view --------
  function drawMapRegion() {
    text(mapX, 1, "(FIG.1) GROUND TRACK — EQUIRECTANGULAR", 1);
    for (let b = 0; b < backdrop.length; b++) { const d = backdrop[b]; put(d.x, d.y, d.ch, d.k); }
    const P = veh.period;
    const Nfull = 320;
    for (let s = 0; s <= Nfull; s++) {
      const q = propagate(veh, simT + (s / Nfull) * P);
      const c = lonToCol(q.lon), r = latToRow(q.lat);
      if (inMap(c, r)) put(c, r, G.trackFaint, 3);
    }
    const trail = 0.4 * P, Ntr = 120;
    for (let s = 0; s < Ntr; s++) {
      const tt = simT - trail + (s / Ntr) * trail;
      if (tt < 0) continue;
      const q = propagate(veh, tt);
      const c = lonToCol(q.lon), r = latToRow(q.lat);
      if (inMap(c, r)) put(c, r, G.track, 4);
    }
    const cur = propagate(veh, simT);
    const sc = lonToCol(cur.lon), sr = latToRow(cur.lat);
    put(sc - 1, sr, "‹", 4); put(sc + 1, sr, "›", 4);
    put(sc, sr, G.sat, 4);
  }

  // -------- 3D globe view --------
  function drawGlobeRegion() {
    text(mapX, 1, "(FIG.1) ORBITAL VIEW — GEOCENTRIC INERTIAL · ALT NOT TO SCALE", 1);
    // camera azimuth tracks the orbit plane's ascending node (so the ring reads
    // face-on) with a gentle sway; orbit is fixed in ECI, Earth rotates under it.
    const Om = veh.raan0 + veh.raanDot * simT;
    camAz = Math.atan2(-Math.cos(Om), Math.sin(Om)) + 0.42 * Math.sin(swayPhase);
    caz = Math.cos(camAz); saz = Math.sin(camAz);
    const G0 = OMEGA_E * simT;               // Earth rotation angle
    const cG = Math.cos(G0), sG = Math.sin(G0);
    // z-buffer over the map region so front-hemisphere features overwrite the back
    const zb = {};
    const stamp = (c, r, ch, k, z) => {
      if (!inMap(c, r)) return;
      const key = r * COLS + c;
      if (zb[key] === undefined || z > zb[key]) { zb[key] = z; put(c, r, ch, k); }
    };
    // Earth surface (rotate Earth-fixed pts by GMST, project, cull back hemisphere)
    for (let i = 0; i < globePts.length; i++) {
      const g = globePts[i];
      const x = g.x0 * cG - g.y0 * sG;
      const y = g.x0 * sG + g.y0 * cG;
      const pj = project(x, y, g.z0);
      if (pj.zc <= 0) continue;               // back hemisphere hidden
      stamp(pj.c, pj.r, g.k === 5 ? G.land : G.grat, g.k, pj.zc);
    }
    // limb (crisp disk silhouette)
    for (let a = 0; a < TWO_PI; a += 0.02) {
      const c = Math.round(gcx + Math.cos(a) * gR);
      const r = Math.round(gcy - Math.sin(a) * gR * gYk);
      if (inMap(c, r)) { const key = r * COLS + c; if (zb[key] === undefined) { put(c, r, "·", 1); } }
    }
    // orbit: full ellipse (faint, occluded segments dropped) + bold recent trail
    const P = veh.period;
    const Nfull = 360;
    for (let s = 0; s <= Nfull; s++) {
      const q = propagate(veh, simT + (s / Nfull) * P);
      const pj = projectOrbit(q.x, q.y, q.z);
      if (pj.zc < 0 && pj.pr < 1) continue;       // behind the globe disk
      stamp(pj.c, pj.r, pj.zc < 0 ? G.trackFaint : G.track, pj.zc < 0 ? 6 : 7, 100 + pj.zc);
    }
    const trail = 0.45 * P, Ntr = 140;
    for (let s = 0; s < Ntr; s++) {
      const tt = simT - trail + (s / Ntr) * trail;
      if (tt < 0) continue;
      const q = propagate(veh, tt);
      const pj = projectOrbit(q.x, q.y, q.z);
      if (pj.zc < 0 && pj.pr < 1) continue;
      stamp(pj.c, pj.r, G.track, 4, 200 + pj.zc);
    }
    const cur = propagate(veh, simT);
    const pj = projectOrbit(cur.x, cur.y, cur.z);
    if (!(pj.zc < 0 && pj.pr < 1)) {
      put(pj.c - 1, pj.r, "‹", 4); put(pj.c + 1, pj.r, "›", 4);
      put(pj.c, pj.r, G.sat, 4);
    }
  }

  function drawFrame() {
    clearBuffer();
    const p = veh.preset;

    // outer frame
    box(0, 0, COLS, ROWS, 2);
    const title = " ORBITAL PROPAGATOR ";
    text(2, 0, "┤" + title + "├", 4);
    const clock = " T+" + hms(simT) + " ";
    text(COLS - clock.length - 2, 0, "┤" + clock + "├", 2);
    for (let y = 1; y < ROWS - 3; y++) put(hudX - 1, y, G.v, 2);
    put(hudX - 1, 0, G.tj, 2);
    put(hudX - 1, ROWS - 3, G.bj, 2);
    text(1, ROWS - 3, G.h.repeat(COLS - 2), 2);
    put(0, ROWS - 3, G.lj, 2); put(COLS - 1, ROWS - 3, G.rj, 2);

    if (view === "globe") drawGlobeRegion(); else drawMapRegion();
    const cur = propagate(veh, simT);

    // ---- HUD ----
    let hy = 2;
    const L = (label, val, kv) => { text(hudX + 1, hy, label, 1); text(hudX + hudW - 1 - String(val).length, hy, String(val), kv || 0); hy++; };
    const H = (t) => { hy++; text(hudX + 1, hy, t, 4); hy++; };

    text(hudX + 1, hy, "VEHICLE", 4); hy++;
    text(hudX + 1, hy, p.name, 0); hy++;
    text(hudX + 1, hy, p.note, 1); hy++;

    H("ELEMENTS");
    L("SMA", fmt(veh.a, 0, 1) + " km");
    L("ECC", fmt(veh.e, 0, 4));
    L("INC", fmt(p.i, 0, 2) + "°");
    L("RAAN", fmt(((veh.raan0 + veh.raanDot * simT) / DEG % 360 + 360) % 360, 0, 1) + "°");
    L("ARGP", fmt(p.argp, 0, 1) + "°");
    L("PER", fmt(veh.period / 60, 0, 1) + " min");

    H("STATE VECTOR");
    L("ALT", fmt(cur.alt, 0, 1) + " km", 0);
    L("VEL", fmt(cur.speed, 0, 3) + " km/s", 0);
    L("LAT", (cur.lat >= 0 ? "+" : "") + fmt(cur.lat, 0, 2) + "°", 0);
    L("LON", (cur.lon >= 0 ? "+" : "") + fmt(cur.lon, 0, 2) + "°", 0);

    H("SIMULATION");
    L("FRAME", "ECI");
    L("MET", hms(simT));
    L("WARP", WARPS[warpIdx] + "×");
    L("ZOOM", fmt(zoom, 0, 2) + "×");
    L("STATE", running ? "▶ RUNNING" : "❚❚ PAUSED");

    // orbit count
    const orbits = simT / veh.period;
    L("REV", fmt(orbits, 0, 2));

    // footer controls
    const ctrl = "  SPACE pause   ,/. warp   +/− zoom   [ ] vehicle   V " + (view === "globe" ? "map" : "globe") + " view   R reset   Q quit";
    text(1, ROWS - 2, ctrl, 1);

    render();
  }

  function render() {
    let html = "";
    for (let r = 0; r < ROWS; r++) {
      let run = "", runCls = -1;
      for (let c = 0; c < COLS; c++) {
        const k = cls[r][c];
        let ch = buf[r][c];
        if (ch === "&") ch = "&amp;"; else if (ch === "<") ch = "&lt;"; else if (ch === ">") ch = "&gt;";
        if (k !== runCls) {
          if (run) html += wrap(run, runCls);
          run = ch; runCls = k;
        } else run += ch;
      }
      html += wrap(run, runCls) + "\n";
    }
    screenEl.innerHTML = html;
  }
  function wrap(str, k) {
    if (k === 1) return '<span class="oc1">' + str + "</span>";
    if (k === 2) return '<span class="oc2">' + str + "</span>";
    if (k === 3) return '<span class="oc3">' + str + "</span>";
    if (k === 4) return '<span class="oc4">' + str + "</span>";
    if (k === 5) return '<span class="oc5">' + str + "</span>";
    if (k === 6) return '<span class="oc6">' + str + "</span>";
    if (k === 7) return '<span class="oc7">' + str + "</span>";
    return str;
  }

  // ---- loop & input ----------------------------------------------------------
  function loop(ms) {
    if (!appEl) return;
    if (!lastMs) lastMs = ms;
    let dt = (ms - lastMs) / 1000;
    lastMs = ms;
    if (dt > 0.1) dt = 0.1; // clamp tab-switch jumps
    if (running) simT += dt * WARPS[warpIdx];
    swayPhase += dt * 0.32;                    // gentle camera sway (~20s / cycle)
    if (swayPhase > TWO_PI) swayPhase -= TWO_PI;
    drawFrame();
    if (pendingScroll) {
      const top = appEl.getBoundingClientRect().top + window.scrollY - 10;
      window.scrollTo(0, Math.max(0, top));
      pendingScroll = false;
    }
    rafId = requestAnimationFrame(loop);
  }

  function onKey(e) {
    const k = e.key;
    if (k === "q" || k === "Q" || k === "Escape") { stopOrbit(); e.preventDefault(); return; }
    if (k === " ") { running = !running; e.preventDefault(); return; }
    if (k === "." || k === ">") { warpIdx = Math.min(WARPS.length - 1, warpIdx + 1); e.preventDefault(); return; }
    if (k === "," || k === "<") { warpIdx = Math.max(0, warpIdx - 1); e.preventDefault(); return; }
    if (k === "+" || k === "=") { zoom = Math.min(3.2, zoom * 1.15); gR = gBaseR * zoom; e.preventDefault(); return; }
    if (k === "-" || k === "_") { zoom = Math.max(0.45, zoom / 1.15); gR = gBaseR * zoom; e.preventDefault(); return; }
    if (k === "r" || k === "R") { simT = 0; zoom = 1; gR = gBaseR; e.preventDefault(); return; }
    if (k === "v" || k === "V") { view = (view === "globe") ? "map" : "globe"; e.preventDefault(); return; }
    if (k === "]" || k === "[") {
      const idx = PRESET_ORDER.indexOf(presetKey);
      const next = (idx + (k === "]" ? 1 : PRESET_ORDER.length - 1)) % PRESET_ORDER.length;
      presetKey = PRESET_ORDER[next];
      veh = makeVehicle(PRESETS[presetKey]);
      simT = 0; e.preventDefault(); return;
    }
  }

  function onResize() { if (appEl) layout(); }

  // ---- public entry / exit ---------------------------------------------------
  function startOrbit(arg) {
    const key = (arg || "").trim().toLowerCase();
    presetKey = PRESETS[key] ? key : "samwise";
    veh = makeVehicle(PRESETS[presetKey]);
    simT = 0; warpIdx = 5; running = true; lastMs = 0; zoom = 1; swayPhase = 0;

    // render inline in the terminal, right after the latest command
    const term = document.getElementById("terminal");
    const anchor = document.getElementById("before");
    appEl = document.createElement("div");
    appEl.className = "orbit-app active";
    screenEl = document.createElement("pre");
    screenEl.className = "orbit-screen";
    appEl.appendChild(screenEl);
    if (term && anchor) term.insertBefore(appEl, anchor);
    else document.body.appendChild(appEl);

    // hand keyboard control to the propagator: hide only the input line
    // (leave the social buttons visible)
    const cmd = document.getElementById("command");
    if (cmd) cmd.style.display = "none";
    const ta = document.getElementById("texter");
    if (ta) ta.blur();

    layout();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
    pendingScroll = true;                     // scroll into view once the first frame renders
    rafId = requestAnimationFrame(loop);
  }

  function stopOrbit() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onResize);
    // freeze the last frame in the terminal scroll history
    if (appEl) appEl.classList.remove("active");
    appEl = null; screenEl = null;
    const cmd = document.getElementById("command");
    if (cmd) cmd.style.display = "";
    const ta = document.getElementById("texter");
    if (ta) setTimeout(() => ta.focus(), 0);
    window.scrollTo(0, document.body.offsetHeight);
  }

  window.startOrbit = startOrbit;
  window.stopOrbit = stopOrbit;
})();
