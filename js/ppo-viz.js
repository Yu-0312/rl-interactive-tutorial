/* PPO clip objective visualization */
(function () {
  "use strict";

  function clipObj(r, A, eps) {
    const clipped = Math.max(1 - eps, Math.min(1 + eps, r));
    return Math.min(r * A, clipped * A);
  }

  function draw() {
    const canvas = document.getElementById("ppo-canvas");
    if (!canvas) return;
    const A = Number(document.getElementById("ppo-a").value);
    const eps = Number(document.getElementById("ppo-eps").value);
    const rSel = Number(document.getElementById("ppo-r").value);

    document.getElementById("ppo-a-v").textContent = A.toFixed(2);
    document.getElementById("ppo-eps-v").textContent = eps.toFixed(2);
    document.getElementById("ppo-r-v").textContent = rSel.toFixed(2);

    const raw = rSel * A;
    const obj = clipObj(rSel, A, eps);
    const active = Math.abs(rSel - 1) > eps - 1e-9 && Math.abs(raw - obj) > 1e-9;
    document.getElementById("ppo-raw").textContent = raw.toFixed(3);
    document.getElementById("ppo-obj").textContent = obj.toFixed(3);
    document.getElementById("ppo-active").textContent = active ? "是" : "否";

    const W = 640, H = 300;
    const ctx = RL.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);

    const padL = 50, padR = 20, padT = 20, padB = 36;
    const gw = W - padL - padR;
    const gh = H - padT - padB;
    const rMin = 0.4, rMax = 1.8;
    let yMin = -4, yMax = 4;
    // auto range
    let lo = 0, hi = 0;
    for (let i = 0; i <= 100; i++) {
      const r = rMin + ((rMax - rMin) * i) / 100;
      lo = Math.min(lo, r * A, clipObj(r, A, eps));
      hi = Math.max(hi, r * A, clipObj(r, A, eps));
    }
    yMin = lo - 0.3;
    yMax = hi + 0.3;
    if (yMax - yMin < 1) { yMin -= 0.5; yMax += 0.5; }

    function X(r) { return padL + ((r - rMin) / (rMax - rMin)) * gw; }
    function Y(v) { return padT + gh - ((v - yMin) / (yMax - yMin)) * gh; }

    ctx.fillStyle = "#0d1426";
    ctx.fillRect(padL, padT, gw, gh);
    // clip band
    ctx.fillStyle = "rgba(240,180,41,0.08)";
    ctx.fillRect(X(1 - eps), padT, X(1 + eps) - X(1 - eps), gh);
    ctx.strokeStyle = "rgba(240,180,41,0.25)";
    ctx.strokeRect(X(1 - eps), padT, X(1 + eps) - X(1 - eps), gh);

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(padL, Y(0));
    ctx.lineTo(padL + gw, Y(0));
    ctx.moveTo(X(1), padT);
    ctx.lineTo(X(1), padT + gh);
    ctx.stroke();

    // raw r*A
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const r = rMin + ((rMax - rMin) * i) / 100;
      const y = Y(r * A);
      if (i === 0) ctx.moveTo(X(r), y);
      else ctx.lineTo(X(r), y);
    }
    ctx.strokeStyle = "rgba(154,171,200,0.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // clipped objective
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const r = rMin + ((rMax - rMin) * i) / 100;
      const y = Y(clipObj(r, A, eps));
      if (i === 0) ctx.moveTo(X(r), y);
      else ctx.lineTo(X(r), y);
    }
    ctx.strokeStyle = "#5b8cff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // selected point
    ctx.fillStyle = "#3dd6c6";
    ctx.beginPath();
    ctx.arc(X(rSel), Y(obj), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("dashed = r·A   solid = PPO min(clip)   band = [1±ε]", padL, 14);
    ctx.textAlign = "center";
    ctx.fillText("probability ratio r = π_θ / π_old", padL + gw / 2, H - 8);
  }

  function init() {
    ["ppo-a", "ppo-eps", "ppo-r"].forEach((id) => {
      document.getElementById(id).addEventListener("input", draw);
    });
    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
