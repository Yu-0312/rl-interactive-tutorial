/* Linear FA TD(0) on 1D track with tile coding */
(function () {
  "use strict";

  const N_TILES_DEFAULT = 4;
  const TILES_PER = 8;
  const N_ACTIONS = 3; // accel -1, 0, +1

  function features(pos, action, nTilings) {
    // pos in [0,1]
    const n = nTilings * TILES_PER * N_ACTIONS;
    const phi = new Float64Array(n);
    for (let t = 0; t < nTilings; t++) {
      const offset = t / nTilings;
      const x = (pos + offset) % 1;
      const tile = Math.min(TILES_PER - 1, Math.floor(x * TILES_PER));
      const idx = t * TILES_PER * N_ACTIONS + tile * N_ACTIONS + action;
      phi[idx] = 1;
    }
    return phi;
  }

  function vhat(pos, action, w, nTilings) {
    const phi = features(pos, action, nTilings);
    let s = 0;
    for (let i = 0; i < phi.length; i++) if (phi[i]) s += w[i];
    return s;
  }

  class Track {
    constructor() {
      this.reset(N_TILES_DEFAULT, 0.1, 0.9);
    }
    reset(nTilings, alpha, gamma) {
      this.nTilings = nTilings;
      this.alpha = alpha;
      this.gamma = gamma;
      this.w = new Float64Array(nTilings * TILES_PER * N_ACTIONS);
      this.episodes = 0;
      this.lastSteps = null;
      this.curve = [];
    }
    episode() {
      let pos = Math.random() * 0.8;
      let steps = 0;
      for (; steps < 80; steps++) {
        const a = Math.floor(Math.random() * N_ACTIONS) - 1; // -1,0,1 → store 0,1,2
        const act = a + 1;
        const nextPos = Math.max(0, Math.min(1, pos + 0.08 * a + 0.02));
        const terminal = nextPos >= 0.97;
        const reward = terminal ? 1 : -0.02;
        const phi = features(pos, act, this.nTilings);
        let v = 0;
        for (let i = 0; i < phi.length; i++) if (phi[i]) v += this.w[i];
        let target = reward;
        if (!terminal) {
          // greedy next for value of (s', a)
          let best = -Infinity;
          for (let aa = 0; aa < N_ACTIONS; aa++) {
            const vv = vhat(nextPos, aa, this.w, this.nTilings);
            if (vv > best) best = vv;
          }
          target = reward + this.gamma * best;
        }
        const td = target - v;
        for (let i = 0; i < phi.length; i++) if (phi[i]) this.w[i] += this.alpha * td;
        pos = nextPos;
        if (terminal) break;
      }
      this.episodes++;
      this.lastSteps = steps + 1;
      this.curve.push(this.lastSteps);
      if (this.curve.length > 80) this.curve.shift();
    }
  }

  function draw(track) {
    const canvas = document.getElementById("fa-canvas");
    if (!canvas) return;
    const W = 640, H = 300;
    const ctx = RL.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);

    // Value curve for action=1 (coast)
    const n = 80;
    const xs = [];
    const ys = [];
    let vmin = Infinity, vmax = -Infinity;
    for (let i = 0; i <= n; i++) {
      const p = i / n;
      let best = -Infinity;
      for (let a = 0; a < N_ACTIONS; a++) best = Math.max(best, vhat(p, a, track.w, track.nTilings));
      xs.push(p);
      ys.push(best);
      vmin = Math.min(vmin, best);
      vmax = Math.max(vmax, best);
    }
    if (!isFinite(vmin)) { vmin = 0; vmax = 1; }
    if (vmax - vmin < 1e-6) vmax = vmin + 1e-6;

    // background track
    const padL = 40, padR = 20, padT = 24, padB = 50;
    const gw = W - padL - padR;
    const gh = H - padT - padB;

    ctx.fillStyle = "#f3efe4";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ebe5d6";
    ctx.fillRect(padL, padT, gw, gh);
    ctx.strokeStyle = "rgba(63,58,50,0.1)";
    ctx.strokeRect(padL, padT, gw, gh);

    // goal band
    ctx.fillStyle = "rgba(122,158,126,0.22)";
    ctx.fillRect(padL + gw * 0.97, padT, gw * 0.03, gh);

    // polyline
    ctx.beginPath();
    xs.forEach((p, i) => {
      const x = padL + p * gw;
      const y = padT + gh - ((ys[i] - vmin) / (vmax - vmin)) * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#7a9e7e";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // axes labels
    ctx.fillStyle = "rgba(63,58,50,0.55)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("state: position on track →", W / 2, H - 18);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("max_a q̂(s,a)", 0, 0);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillText("Learned value curve (tile-coded linear FA)", padL, 16);

    // last episode steps sparkline
    if (track.curve.length > 1) {
      const maxS = Math.max(...track.curve, 10);
      ctx.strokeStyle = "#d4a574";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      track.curve.forEach((s, i) => {
        const x = padL + (i / (track.curve.length - 1)) * gw;
        const y = H - 36 - (s / maxS) * 28;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "rgba(166,122,61,0.85)";
      ctx.textAlign = "right";
      ctx.fillText("episode length (recent)", W - padR, H - 36);
    }
  }

  function init() {
    const track = new Track();
    const tIn = document.getElementById("fa-tilings");
    const aIn = document.getElementById("fa-alpha");
    const gIn = document.getElementById("fa-gamma");
    const tV = document.getElementById("fa-tilings-v");
    const aV = document.getElementById("fa-alpha-v");
    const gV = document.getElementById("fa-gamma-v");
    const epEl = document.getElementById("fa-episodes");
    const stEl = document.getElementById("fa-steps");
    const nmEl = document.getElementById("fa-norm");

    function norm(w) {
      let s = 0;
      for (let i = 0; i < w.length; i++) s += w[i] * w[i];
      return Math.sqrt(s);
    }
    function refresh() {
      tV.textContent = tIn.value;
      aV.textContent = Number(aIn.value).toFixed(2);
      gV.textContent = Number(gIn.value).toFixed(2);
      epEl.textContent = String(track.episodes);
      stEl.textContent = track.lastSteps == null ? "—" : String(track.lastSteps);
      nmEl.textContent = norm(track.w).toFixed(2);
      draw(track);
    }
    function reinit() {
      track.reset(Number(tIn.value), Number(aIn.value), Number(gIn.value));
      refresh();
    }
    function train(n) {
      track.alpha = Number(aIn.value);
      track.gamma = Number(gIn.value);
      for (let i = 0; i < n; i++) track.episode();
      refresh();
    }

    document.getElementById("fa-ep").addEventListener("click", () => train(1));
    document.getElementById("fa-200").addEventListener("click", () => train(200));
    document.getElementById("fa-reset").addEventListener("click", reinit);
    tIn.addEventListener("change", reinit);
    aIn.addEventListener("input", () => {
      track.alpha = Number(aIn.value);
      aV.textContent = track.alpha.toFixed(2);
    });
    gIn.addEventListener("input", () => {
      track.gamma = Number(gIn.value);
      gV.textContent = track.gamma.toFixed(2);
    });

    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
