/* Twin critic min visualization */
(function () {
  "use strict";

  let seed = 1;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const TRUE = [];
  function trueQ(x) {
    // multi-modal landscape
    return (
      Math.exp(-Math.pow((x - 0.25) * 4, 2)) * 1.0 +
      Math.exp(-Math.pow((x - 0.7) * 5, 2)) * 0.85 +
      0.05 * Math.sin(x * 12)
    );
  }
  for (let i = 0; i <= 200; i++) TRUE.push(trueQ(i / 200));

  let Q1 = [], Q2 = [];
  function resample(noise) {
    seed = 1;
    Q1 = [];
    Q2 = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const t = trueQ(x);
      Q1.push(t + gauss() * noise * 0.35 + Math.sin(x * 20 + 1) * noise * 0.08);
      Q2.push(t + gauss() * noise * 0.35 + Math.sin(x * 17 + 2) * noise * 0.08);
    }
  }

  function draw() {
    const canvas = document.getElementById("ac-canvas");
    if (!canvas) return;
    const noise = Number(document.getElementById("ac-noise").value);
    const useMin = document.getElementById("ac-min").checked;
    document.getElementById("ac-noise-v").textContent = noise.toFixed(2);

    const W = 640, H = 280;
    const ctx = RL.fitCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);

    const padL = 40, padR = 16, padT = 18, padB = 32;
    const gw = W - padL - padR;
    const gh = H - padT - padB;

    let yMin = -0.5, yMax = 1.6;
    const policy = [];
    for (let i = 0; i <= 200; i++) {
      const v = useMin ? Math.min(Q1[i], Q2[i]) : Math.max(Q1[i], Q2[i]);
      policy.push(v);
      yMin = Math.min(yMin, v, TRUE[i], Q1[i], Q2[i]);
      yMax = Math.max(yMax, v, TRUE[i], Q1[i], Q2[i]);
    }

    function X(i) { return padL + (i / 200) * gw; }
    function Y(v) { return padT + gh - ((v - yMin) / (yMax - yMin + 1e-9)) * gh; }

    ctx.fillStyle = "#0d1426";
    ctx.fillRect(padL, padT, gw, gh);

    function line(data, color, width, dash) {
      ctx.beginPath();
      data.forEach((v, i) => {
        if (i === 0) ctx.moveTo(X(i), Y(v));
        else ctx.lineTo(X(i), Y(v));
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash || []);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    line(TRUE, "rgba(255,255,255,0.35)", 1.5, [4, 3]);
    line(Q1, "rgba(91,140,255,0.35)", 1);
    line(Q2, "rgba(240,180,41,0.35)", 1);
    line(policy, "#3dd6c6", 2.4);

    // argmax of selected policy
    let bestI = 0;
    for (let i = 0; i <= 200; i++) if (policy[i] > policy[bestI]) bestI = i;
    let trueBest = 0;
    for (let i = 0; i <= 200; i++) if (TRUE[i] > TRUE[trueBest]) trueBest = i;

    ctx.fillStyle = "#ff6b7a";
    ctx.beginPath();
    ctx.arc(X(bestI), Y(policy[bestI]), 6, 0, Math.PI * 2);
    ctx.fill();

    document.getElementById("ac-arg").textContent = (bestI / 200).toFixed(2);
    document.getElementById("ac-true").textContent = TRUE[bestI].toFixed(3);
    document.getElementById("ac-regret").textContent = (TRUE[trueBest] - TRUE[bestI]).toFixed(3);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("white dashed = true Q   blue/gold = critics   teal = selected   red = argmax", padL, 12);
  }

  function init() {
    resample(Number(document.getElementById("ac-noise").value));
    document.getElementById("ac-noise").addEventListener("input", () => {
      resample(Number(document.getElementById("ac-noise").value));
      draw();
    });
    document.getElementById("ac-sample").addEventListener("click", () => {
      seed = Math.floor(Math.random() * 1e6) + 1;
      resample(Number(document.getElementById("ac-noise").value));
      draw();
    });
    document.getElementById("ac-min").addEventListener("change", draw);
    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
