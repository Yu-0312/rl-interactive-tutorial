/* Toy 1D chain TD learning illustrating target-network lag */
(function () {
  "use strict";

  const N = 12; // states 0..N-1, goal at N-1

  class Chain {
    constructor(lag, gamma) {
      this.lag = lag;
      this.gamma = gamma;
      this.reset();
    }
    reset() {
      this.Q = new Float64Array(N * 2); // left, right
      this.Qt = new Float64Array(N * 2);
      this.steps = 0;
      this.curve = [];
      this.tdAvg = 0;
      this.tdCount = 0;
    }
    copyTarget() {
      this.Qt.set(this.Q);
    }
    maxQ(Qt, s) {
      return Math.max(Qt[s * 2], Qt[s * 2 + 1]);
    }
    step() {
      let s = Math.floor(Math.random() * (N - 1));
      const a = Math.random() < 0.5 ? 0 : 1;
      const ns = a === 0 ? Math.max(0, s - 1) : Math.min(N - 1, s + 1);
      const done = ns === N - 1;
      const r = done ? 1 : -0.01;
      const y = done ? r : r + this.gamma * this.maxQ(this.Qt, ns);
      const alpha = 0.15;
      const td = y - this.Q[s * 2 + a];
      this.Q[s * 2 + a] += alpha * td;
      this.tdAvg = this.tdAvg * 0.98 + Math.abs(td) * 0.02;
      this.steps++;
      if (this.steps % this.lag === 0) this.copyTarget();
      if (this.steps % 20 === 0) {
        this.curve.push(this.Q[(N - 2) * 2 + 1]); // Q(s near goal, right)
        if (this.curve.length > 120) this.curve.shift();
      }
    }
  }

  function draw(chain) {
    const canvas = document.getElementById("dqn-canvas");
    if (!canvas) return;
    const W = 640, H = 280;
    const ctx = RL.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);

    const padL = 48, padR = 20, padT = 20, padB = 36;
    const gw = W - padL - padR;
    const gh = H - padT - padB;

    // curve
    const vals = chain.curve;
    let vmin = 0, vmax = 1;
    if (vals.length) {
      vmin = Math.min(...vals, 0);
      vmax = Math.max(...vals, 1);
    }
    ctx.fillStyle = "#f3efe4";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ebe5d6";
    ctx.fillRect(padL, padT, gw, gh);

    // ideal Q ~ gamma^distance * 1
    ctx.strokeStyle = "rgba(63,58,50,0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const ideal = chain.gamma ** 1;
    const yIdeal = padT + gh - ((ideal - vmin) / (vmax - vmin + 1e-9)) * gh;
    ctx.moveTo(padL, yIdeal);
    ctx.lineTo(padL + gw, yIdeal);
    ctx.stroke();
    ctx.setLineDash([]);

    if (vals.length > 1) {
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = padL + (i / (vals.length - 1)) * gw;
        const y = padT + gh - ((v - vmin) / (vmax - vmin + 1e-9)) * gh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#7a9e7e";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // state strip
    for (let s = 0; s < N; s++) {
      const x = padL + (s / (N - 1)) * gw;
      const q = chain.Q[s * 2 + 1];
      const t = Math.max(0, Math.min(1, q));
      ctx.fillStyle = RL.lerpColor("#e7e0cf", "#7a9e7e", t);
      ctx.beginPath();
      ctx.roundRect(x - gw / (N * 2.2), H - 24, gw / (N * 1.4), 14, 3);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(63,58,50,0.6)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Q(s_near_goal, right) over training", padL, 14);
    ctx.textAlign = "center";
    ctx.fillText("states (darker green = higher Q to move right)", padL + gw / 2, H - 4);
  }

  function init() {
    const lagSel = document.getElementById("dqn-lag");
    const gammaIn = document.getElementById("dqn-gamma");
    const gammaV = document.getElementById("dqn-gamma-v");
    const stepsEl = document.getElementById("dqn-steps");
    const q0El = document.getElementById("dqn-q0");
    const tdEl = document.getElementById("dqn-td");
    let chain = new Chain(Number(lagSel.value), Number(gammaIn.value));
    let timer = null;

    function refresh() {
      stepsEl.textContent = String(chain.steps);
      q0El.textContent = chain.Q[(N - 2) * 2 + 1].toFixed(3);
      tdEl.textContent = chain.tdAvg.toFixed(3);
      gammaV.textContent = Number(gammaIn.value).toFixed(2);
      draw(chain);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    document.getElementById("dqn-run").addEventListener("click", () => {
      if (timer) { stop(); return; }
      timer = setInterval(() => {
        for (let i = 0; i < 30; i++) chain.step();
        refresh();
        if (chain.steps > 8000) stop();
      }, 30);
    });
    document.getElementById("dqn-reset").addEventListener("click", () => {
      stop();
      chain = new Chain(Number(lagSel.value), Number(gammaIn.value));
      refresh();
    });
    lagSel.addEventListener("change", () => {
      stop();
      chain = new Chain(Number(lagSel.value), Number(gammaIn.value));
      refresh();
    });
    gammaIn.addEventListener("input", () => {
      chain.gamma = Number(gammaIn.value);
      gammaV.textContent = chain.gamma.toFixed(2);
    });

    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
