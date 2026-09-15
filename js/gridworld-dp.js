/* GridWorld DP: Policy Iteration & Value Iteration */
(function () {
  "use strict";

  const ROWS = 5;
  const COLS = 7;
  const START = [4, 0];
  const GOAL = [0, 6];
  const PIT = [3, 3];
  const STEP_COST = -0.04;
  const ACTIONS = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];
  const ARROWS = ["↑", "↓", "←", "→"];

  function idx(r, c) { return r * COLS + c; }
  function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  class Grid {
    constructor() {
      this.n = ROWS * COLS;
      this.reset();
    }
    reset() {
      this.v = new Float64Array(this.n);
      this.pi = new Int8Array(this.n).fill(0);
      this.iter = 0;
      this.inner = 0;
      this.delta = Infinity;
      this.done = false;
      this.mode = "vi";
    }
    isTerminal(r, c) {
      return (r === GOAL[0] && c === GOAL[1]) || (r === PIT[0] && c === PIT[1]);
    }
    rewardOf(r, c) {
      if (r === GOAL[0] && c === GOAL[1]) return 1;
      if (r === PIT[0] && c === PIT[1]) return -1;
      return STEP_COST;
    }
    nextState(r, c, a) {
      let nr = r + ACTIONS[a][0];
      let nc = c + ACTIONS[a][1];
      if (!inBounds(nr, nc)) { nr = r; nc = c; }
      return [nr, nc];
    }
    /* deterministic P for teaching */
    q(r, c, a, gamma, v) {
      const [nr, nc] = this.nextState(r, c, a);
      if (this.isTerminal(nr, nc)) return this.rewardOf(nr, nc);
      return this.rewardOf(nr, nc) + gamma * v[idx(nr, nc)];
    }
    stepValueIteration(gamma) {
      const v = this.v;
      let delta = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.isTerminal(r, c)) {
            const old = v[idx(r, c)];
            v[idx(r, c)] = this.rewardOf(r, c);
            delta = Math.max(delta, Math.abs(old - v[idx(r, c)]));
            this.pi[idx(r, c)] = 0;
            continue;
          }
          let best = -Infinity;
          let bestA = 0;
          for (let a = 0; a < 4; a++) {
            const q = this.q(r, c, a, gamma, v);
            if (q > best) { best = q; bestA = a; }
          }
          const old = v[idx(r, c)];
          v[idx(r, c)] = best;
          this.pi[idx(r, c)] = bestA;
          delta = Math.max(delta, Math.abs(old - best));
        }
      }
      this.iter++;
      this.delta = delta;
      if (delta < 1e-4) this.done = true;
      return delta;
    }
    /* Policy Iteration: one "step" = several eval sweeps + improvement */
    stepPolicyIteration(gamma) {
      // evaluate current policy
      let delta = 0;
      for (let sweep = 0; sweep < 20; sweep++) {
        delta = 0;
        const v = this.v;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (this.isTerminal(r, c)) {
              v[idx(r, c)] = this.rewardOf(r, c);
              continue;
            }
            const a = this.pi[idx(r, c)];
            const nv = this.q(r, c, a, gamma, v);
            delta = Math.max(delta, Math.abs(v[idx(r, c)] - nv));
            v[idx(r, c)] = nv;
          }
        }
        if (delta < 1e-4) break;
      }
      this.delta = delta;
      // improve
      let stable = true;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.isTerminal(r, c)) continue;
          let best = -Infinity;
          let bestA = this.pi[idx(r, c)];
          for (let a = 0; a < 4; a++) {
            const q = this.q(r, c, a, gamma, this.v);
            if (q > best + 1e-12) { best = q; bestA = a; }
          }
          if (bestA !== this.pi[idx(r, c)]) {
            this.pi[idx(r, c)] = bestA;
            stable = false;
          }
        }
      }
      this.iter++;
      if (stable) this.done = true;
    }
  }

  function draw(grid, gamma) {
    const canvas = document.getElementById("dp-canvas");
    if (!canvas) return;
    const W = 520, H = 360;
    const ctx = RL.fitCanvas(canvas, W, H);
    const pad = 16;
    const gw = W - pad * 2;
    const gh = H - pad * 2;
    const cw = gw / COLS;
    const ch = gh / ROWS;

    // value range for color
    let vmin = Infinity, vmax = -Infinity;
    for (let i = 0; i < grid.n; i++) {
      vmin = Math.min(vmin, grid.v[i]);
      vmax = Math.max(vmax, grid.v[i]);
    }
    if (!isFinite(vmin)) { vmin = -1; vmax = 1; }
    if (vmax - vmin < 1e-6) vmax = vmin + 1e-6;

    ctx.clearRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = pad + c * cw;
        const y = pad + r * ch;
        const t = (grid.v[idx(r, c)] - vmin) / (vmax - vmin);
        let fill = RL.lerpColor("#1a2744", "#2dd4bf", t);
        if (r === GOAL[0] && c === GOAL[1]) fill = "#1f6b45";
        if (r === PIT[0] && c === PIT[1]) fill = "#6b2a32";
        if (r === START[0] && c === START[1]) fill = "#7a5a12";

        ctx.fillStyle = fill;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cw - 4, ch - 4, 8);
        ctx.fill();
        ctx.stroke();

        // value text
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "600 11px SF Mono, ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = grid.isTerminal(r, c)
          ? (r === GOAL[0] ? "+1" : "−1")
          : grid.v[idx(r, c)].toFixed(2);
        ctx.fillText(label, x + cw / 2, y + ch / 2 - 10);

        // policy arrow
        if (!grid.isTerminal(r, c)) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "700 18px system-ui, sans-serif";
          ctx.fillText(ARROWS[grid.pi[idx(r, c)]], x + cw / 2, y + ch / 2 + 12);
        }
      }
    }

    // labels
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("S", pad + 8, pad + 14);
    ctx.textAlign = "right";
    ctx.fillText("G", W - pad - 8, pad + 14);
  }

  function init() {
    const grid = new Grid();
    const algoSel = document.getElementById("dp-algo");
    const gammaIn = document.getElementById("dp-gamma");
    const gammaV = document.getElementById("dp-gamma-v");
    const iterEl = document.getElementById("dp-iter");
    const deltaEl = document.getElementById("dp-delta");
    const statusEl = document.getElementById("dp-status");
    let timer = null;

    function gamma() { return Number(gammaIn.value); }

    function refreshUI() {
      iterEl.textContent = String(grid.iter);
      deltaEl.textContent = grid.delta === Infinity ? "—" : RL.formatNum(grid.delta, 4);
      statusEl.textContent = grid.done ? "Converged" : timer ? "Running…" : "Ready";
      draw(grid, gamma());
    }

    function doStep() {
      if (grid.done) return;
      if (grid.mode === "vi") grid.stepValueIteration(gamma());
      else grid.stepPolicyIteration(gamma());
      refreshUI();
    }

    document.getElementById("dp-step").addEventListener("click", doStep);
    document.getElementById("dp-reset").addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; }
      grid.reset();
      grid.mode = algoSel.value;
      refreshUI();
    });
    document.getElementById("dp-run").addEventListener("click", () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        statusEl.textContent = grid.done ? "Converged" : "Paused";
        return;
      }
      timer = setInterval(() => {
        if (grid.done) {
          clearInterval(timer);
          timer = null;
          refreshUI();
          return;
        }
        doStep();
      }, 180);
      statusEl.textContent = "Running…";
    });
    algoSel.addEventListener("change", () => {
      if (timer) { clearInterval(timer); timer = null; }
      grid.reset();
      grid.mode = algoSel.value;
      refreshUI();
    });
    gammaIn.addEventListener("input", () => {
      gammaV.textContent = Number(gammaIn.value).toFixed(2);
      if (timer) { clearInterval(timer); timer = null; }
      grid.reset();
      grid.mode = algoSel.value;
      refreshUI();
    });

    refreshUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
