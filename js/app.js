/* Shared utilities for Interactive RL Tutorial */
(function () {
  "use strict";

  const STORAGE_KEY = "rl-tutorial-progress-v1";

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function markLessonDone(id, pct) {
    const p = loadProgress();
    p[id] = Math.max(p[id] || 0, pct || 100);
    saveProgress(p);
  }

  function getLessonProgress(id) {
    return loadProgress()[id] || 0;
  }

  function overallProgress() {
    const p = loadProgress();
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    const total = weeks.reduce((s, w) => s + (p[w] || 0), 0);
    return Math.round(total / weeks.length);
  }

  function renderTopNav(active) {
    const el = document.getElementById("topnav");
    if (!el) return;
    el.innerHTML = `
      <div class="inner">
        <a class="brand" href="${relRoot()}index.html">
          <span class="brand-mark">RL</span>
          <span>強化學習 · 新手版</span>
        </a>
        <nav class="nav-links">
          <a href="${relRoot()}index.html#syllabus" class="${active === "home" ? "active" : ""}">課綱</a>
          <a href="${relRoot()}index.html#ml-track" class="hide-sm">ML 補課</a>
          <a href="${relRoot()}index.html#path" class="hide-sm">新手路徑</a>
          <a href="${relRoot()}lessons/01-overview.html">從第 1 週開始</a>
          <a href="${relRoot()}index.html#progress">進度 <span id="nav-progress">0%</span></a>
        </nav>
      </div>`;
    const p = document.getElementById("nav-progress");
    if (p) p.textContent = overallProgress() + "%";
  }

  function relRoot() {
    const path = location.pathname;
    if (path.includes("/lessons/")) return "../";
    return "";
  }

  function bindQuizzes() {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      const answer = Number(quiz.dataset.answer);
      const feedback = quiz.querySelector(".quiz-feedback");
      const buttons = quiz.querySelectorAll(".quiz-opt");
      buttons.forEach((btn, idx) => {
        btn.addEventListener("click", () => {
          if (quiz.dataset.done === "1") return;
          quiz.dataset.done = "1";
          if (idx === answer) {
            btn.classList.add("correct");
            if (feedback) {
              feedback.textContent = quiz.dataset.ok || "答對了！";
              feedback.className = "quiz-feedback ok";
            }
            const lesson = document.body.dataset.lesson;
            if (lesson) {
              const cur = getLessonProgress(Number(lesson));
              markLessonDone(Number(lesson), Math.max(cur, 90));
            }
          } else {
            btn.classList.add("wrong");
            buttons[answer]?.classList.add("correct");
            if (feedback) {
              feedback.textContent = quiz.dataset.no || "再想想——正確選項已標示。";
              feedback.className = "quiz-feedback no";
            }
          }
        });
      });
    });
  }

  function bindToc() {
    const toc = document.querySelector(".toc");
    if (!toc) return;
    const links = [...toc.querySelectorAll("a")];
    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    function update() {
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= 120) current = s;
      }
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current?.id));
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function bindLessonProgress() {
    const lesson = document.body.dataset.lesson;
    if (!lesson) return;
    // Mark 60% on scroll depth
    let marked = false;
    window.addEventListener(
      "scroll",
      () => {
        if (marked) return;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0 && window.scrollY / h > 0.55) {
          marked = true;
          const cur = getLessonProgress(Number(lesson));
          markLessonDone(Number(lesson), Math.max(cur, 60));
          const p = document.getElementById("nav-progress");
          if (p) p.textContent = overallProgress() + "%";
        }
      },
      { passive: true }
    );
  }

  function showWeekProgress() {
    const el = document.getElementById("overall-progress");
    if (el) {
      const pct = overallProgress();
      el.textContent = pct + "%";
      const bar = document.getElementById("overall-bar");
      if (bar) bar.style.width = pct + "%";
    }
  }

  // ---- Canvas helpers ----
  function fitCanvas(canvas, cssW, cssH) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function lerpColor(a, b, t) {
    const parse = (hex) => {
      const h = hex.replace("#", "");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function formatNum(n, d = 2) {
    return Number(n).toFixed(d);
  }

  window.RL = {
    loadProgress,
    saveProgress,
    markLessonDone,
    getLessonProgress,
    overallProgress,
    renderTopNav,
    bindQuizzes,
    bindToc,
    bindLessonProgress,
    showWeekProgress,
    fitCanvas,
    lerpColor,
    formatNum,
  };
})();
