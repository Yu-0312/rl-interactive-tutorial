/* Cliff World SARSA vs Q-learning */
(function () {
  "use strict";

  const ROWS = 4;
  const COLS = 12;
  const START = [3, 0];
  const GOAL = [3, 11];
  const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const ARROWS = ["↑", "↓", "←", "→"];

  function isCliff(r, c) {
    return r === 3 && c >= 1 && c <= 10;
  }
  function idx(r, c) { return r * COLS + c; }
  function inB(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  class Agent {
    constructor() {
      this.reset(0.1, 0.2, 0.95);
    }
    reset(eps, alpha, gamma) {
      this.eps = eps;
      this.alpha = alpha;
      this.gamma = gamma;
      this.Q = new Float64Array(ROWS * COLS * 4);
      this.episodes = 0;
      this.returns = [];
      this.lastPath = [];
    }
    qAt(r, c, a) { return this.Q[idx(r, c) * 4 + a]; }
    setQ(r, c, a, v) { this.Q[idx(r, c) * 4 + a] = v; }
    greedyA(r, c) {
      let best = 0, bv = this.qAt(r, c, 0);
      for (let a = 1; a < 4; a++) {
        const v = this.qAt(r, c, a);
        if (v > bv) { bv = v; best = a; }
      }
      return best;
    }
    policyA(r, c, eps) {
      if (Math.random() < eps) return Math.floor(Math.random() * 4);
      return this.greedyA(r, c);
    }
    step(r, c, a) {
      let nr = r + ACTIONS[a][0];
      let nc = c + ACTIONS[a][1];
      if (!inB(nr, nc)) { nr = r; nc = c; }
      if (isCliff(nr, nc)) {
        return { r: nr, c: nc, reward: -100, terminal: true, cliff: true };
      }
      if (nr === GOAL[0] && nc === GOAL[1]) {
        return { r: nr, c: nc, reward: -1, terminal: true, cliff: false };
      }
      return { r: nr, c: nc, reward: -1, terminal: false, cliff: false };
    }
    runEpisode(algo) {
      let r = START[0], c = START[1];
      let a = this.policyA(r, c, this.eps);
      let G = 0;
      const path = [[r, c]];
      let guard = 0;
      while (guard++ < 500) {
        const t = this.step(r, c, a);
        path.push([t.r, t.c]);
        G += t.reward;
        if (t.terminal) {
          const old = this.qAt(r, c, a);
          this.setQ(r, c, a, old + this.alpha * (t.reward - old));
          break;
        }
        const a2 = this.policyA(t.r, t.c, this.eps);
        let target;
        if (algo === "q") {
          target = t.reward + this.gamma * this.qAt(t.r, t.c, this.greedyA(t.r, t.c));
        } else {
          target = t.reward + this.gamma * this.qAt(t.r, t.c, a2);
        }
        const old = this.qAt(r, c, a);
        this.setQ(r, c, a, old + this.alpha * (target - old));
        r = t.r; c = t.c; a = a2;
      }
      this.episodes++;
      this.returns.push(G);
      this.lastPath = path;
      return G;
    }
    avgLast(n) {
      const xs = this.returns.slice(-n);
      if (!xs.length) return null;
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    }
  }

  function draw(agent) {
    const canvas = document.getElementById("cliff-canvas");
    if (!canvas) return;
    const W = 640, H = 320;
    const ctx = RL.fitCanvas(canvas, W, H);
    const pad = 12;
    const cw = (W - pad * 2) / COLS;
    const ch = (H - pad * 2) / ROWS;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f3efe4";
    ctx.fillRect(0, 0, W, H);
    const pathSet = new Set(agent.lastPath.map(([r, c]) => idx(r, c)));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = pad + c * cw;
        const y = pad + r * ch;
        let fill = "#e8e2d4";
        if (isCliff(r, c)) fill = "#d4a0a0";
        if (r === GOAL[0] && c === GOAL[1]) fill = "#8fb892";
        if (r === START[0] && c === START[1]) fill = "#e0c090";
        if (pathSet.has(idx(r, c)) && !isCliff(r, c) && !(r === GOAL[0] && c === GOAL[1])) {
          fill = "#c5d5c8";
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = "rgba(63,58,50,0.08)";
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, cw - 3, ch - 3, 6);
        ctx.fill();
        ctx.stroke();

        // Q values max
        let qmax = -Infinity;
        for (let a = 0; a < 4; a++) qmax = Math.max(qmax, agent.qAt(r, c, a));
        if (!isCliff(r, c) && agent.episodes > 0) {
          ctx.fillStyle = "rgba(63,58,50,0.45)";
          ctx.font = "500 9px SF Mono, ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(qmax.toFixed(0), x + cw / 2, y + ch / 2 - 12);
        }

        if (!isCliff(r, c) && agent.episodes > 0 && !(r === GOAL[0] && c === GOAL[1])) {
          ctx.fillStyle = "#3f3a32";
          ctx.font = "700 16px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ARROWS[agent.greedyA(r, c)], x + cw / 2, y + ch / 2 + 8);
        }
      }
    }

    // draw last path
    if (agent.lastPath.length > 1) {
      ctx.strokeStyle = "rgba(122,158,126,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      agent.lastPath.forEach(([r, c], i) => {
        const x = pad + c * cw + cw / 2;
        const y = pad + r * ch + ch / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(63,58,50,0.55)";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("S", pad + 6, pad + 14);
    ctx.textAlign = "center";
    ctx.fillText("CLIFF  (−100)", W / 2, H - 6);
    ctx.textAlign = "right";
    ctx.fillText("G", W - pad - 6, pad + 14);
  }

  function init() {
    const agent = new Agent();
    const algoSel = document.getElementById("cliff-algo");
    const epsIn = document.getElementById("cliff-eps");
    const alphaIn = document.getElementById("cliff-alpha");
    const gammaIn = document.getElementById("cliff-gamma");
    const epsV = document.getElementById("cliff-eps-v");
    const alphaV = document.getElementById("cliff-alpha-v");
    const gammaV = document.getElementById("cliff-gamma-v");
    const epEl = document.getElementById("cliff-episodes");
    const retEl = document.getElementById("cliff-return");
    const avgEl = document.getElementById("cliff-avg");

    function syncHyper() {
      agent.eps = Number(epsIn.value);
      agent.alpha = Number(alphaIn.value);
      agent.gamma = Number(gammaIn.value);
      epsV.textContent = agent.eps.toFixed(2);
      alphaV.textContent = agent.alpha.toFixed(2);
      gammaV.textContent = agent.gamma.toFixed(2);
    }
    function refresh() {
      epEl.textContent = String(agent.episodes);
      const last = agent.returns[agent.returns.length - 1];
      retEl.textContent = last === undefined ? "—" : last.toFixed(0);
      const avg = agent.avgLast(20);
      avgEl.textContent = avg === null ? "—" : avg.toFixed(1);
      draw(agent);
    }

    function runN(n) {
      const algo = algoSel.value;
      for (let i = 0; i < n; i++) agent.runEpisode(algo);
      refresh();
    }

    document.getElementById("cliff-ep").addEventListener("click", () => runN(1));
    document.getElementById("cliff-50").addEventListener("click", () => runN(50));
    document.getElementById("cliff-reset").addEventListener("click", () => {
      syncHyper();
      agent.reset(agent.eps, agent.alpha, agent.gamma);
      refresh();
    });
    [epsIn, alphaIn, gammaIn].forEach((el) => el.addEventListener("input", () => {
      syncHyper();
      refresh();
    }));
    algoSel.addEventListener("change", refresh);

    syncHyper();
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
