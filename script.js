/* ===== EDIT HERE ===== */
const CONFIG = {
  whatsappNumber: "",            // 10-digit Indian number, e.g. "9876543210" (without +91)
  email: "swaminarayandigitalmedia@gmail.com"
};
/* ===================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------- central requestAnimationFrame loop ----------
     Every animation registers a task fn(time, deltaMs). The loop only runs
     while at least one task is registered and the tab is visible. */
  const tasks = new Set();
  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    tasks.forEach(fn => fn(now, dt));
    if (tasks.size && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && tasks.size && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  const addTask = fn => { tasks.add(fn); kick(); };
  const delTask = fn => tasks.delete(fn);
  document.addEventListener("visibilitychange", kick);

  // run a task only while its element is on screen
  function whenVisible(el, fn, onChange) {
    if (!("IntersectionObserver" in window)) { addTask(fn); return; }
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) addTask(fn); else delTask(fn);
      onChange && onChange(e.isIntersecting);
    }), { rootMargin: "80px" }).observe(el);
  }

  /* ---------- links: WhatsApp + mailto ---------- */
  const waURL = text => `https://wa.me/${CONFIG.whatsappNumber ? "91" + CONFIG.whatsappNumber.replace(/\D/g, "") : ""}?text=${encodeURIComponent(text)}`;
  const defaultMsg = "Hello SDM, I would like to know more about your digital marketing services.";
  $$(".wa-link").forEach(a => { a.href = waURL(defaultMsg); a.target = "_blank"; a.rel = "noopener"; });
  $$("a[href^='mailto:']").forEach(a => { a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Enquiry from SDM website")}&body=${encodeURIComponent("Hello SDM, I would like to know more about your services.")}`; });

  /* ---------- mobile menu ---------- */
  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu"), totop = $("#totop");
  const setMenu = open => { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", e => { if (!menu.contains(e.target) && !burger.contains(e.target)) setMenu(false); });
  matchMedia("(min-width:1000px)").addEventListener("change", () => setMenu(false));

  /* ---------- scroll effects, batched into one rAF per scroll burst ---------- */
  const progress = $("#progress"), steps = $("#steps"), stepItems = $$("li", steps);
  const secs = $$("main section[id]"), links = $$("a", menu), orbs = $$(".orb");
  const hero = $("#home");
  function applyScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    nav.classList.toggle("solid", y > 30);
    totop.classList.toggle("show", y > 600);

    let cur = "home";
    secs.forEach(s => { if (y + 140 >= s.offsetTop) cur = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur && !a.classList.contains("btn")));

    if (!reduce && y < hero.offsetHeight) orbs.forEach(o => { o.style.transform = `translate3d(0,${(y * parseFloat(o.dataset.speed)).toFixed(1)}px,0)`; });

    // process timeline fills as it scrolls into view
    const r = steps.getBoundingClientRect();
    const p = reduce ? 1 : clamp((vh * 0.75 - r.top) / (r.height + vh * 0.1));
    steps.style.setProperty("--prog", p.toFixed(3));
    stepItems.forEach((li, i) => li.classList.toggle("on", p >= (i + 0.35) / stepItems.length - 0.02));
  }
  let pending = false;
  const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; applyScroll(); }); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  applyScroll();
  totop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- reveal on scroll (staggered) ---------- */
  const groups = [".cards .card", ".cards.three .feat", ".values li", ".info", ".form", ".steps li"];
  groups.forEach(sel => $$(sel).forEach((e, i) => { e.classList.add("rv"); e.style.setProperty("--i", i % 4); }));
  const items = $$(".rv");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    items.forEach(e => io.observe(e));
  } else items.forEach(e => e.classList.add("in"));

  /* ---------- hero: particle network on <canvas> ---------- */
  (function network() {
    const cv = $("#net"), ctx = cv.getContext("2d");
    let w = 0, h = 0, pts = [], mx = -9999, my = -9999;
    function resize() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 15000, 22, 90));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.5 + .6 }));
      if (reduce) draw(0, 0);
    }
    function draw(_, dt) {
      const k = dt / 16.7, link = clamp(w / 6, 80, 150);
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx * k; p.y += p.vy * k;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) { const f = (1 - Math.sqrt(d2) / 120) * .6 * k; p.x += dx * f * .05; p.y += dy * f * .05; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < link) { ctx.strokeStyle = `rgba(14,165,233,${(1 - d / link) * .35})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.fillStyle = "rgba(2,132,199,.7)"; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
    }
    new ResizeObserver(resize).observe(cv);
    resize();
    hero.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    hero.addEventListener("pointerleave", () => { mx = my = -9999; });
    if (!reduce) whenVisible(hero, draw);
  })();

  /* ---------- hero dashboard: bars + line chart, eased per frame ---------- */
  (function dashboard() {
    const dash = $("#dash"), cv = $("#spark"), ctx = cv.getContext("2d"), bars = $$(".bars b", dash);
    const hs = bars.map(b => parseFloat(b.style.getPropertyValue("--h")) / 100);
    let w = 0, h = 0, start = 0, done = false;
    function resize() { const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render(done ? 1 : 0, 0); }
    function render(p, t) {
      ctx.clearRect(0, 0, w, h);
      const e = hs.map((_, i) => ease(clamp((p - i * .09) / .55)));
      bars.forEach((b, i) => { b.style.transform = `scaleY(${e[i]})`; });
      const pts = hs.map((v, i) => [(i + .5) / hs.length * w, h - v * e[i] * h - 8]);
      // line, revealed left to right
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w * clamp(p * 1.15), h); ctx.clip();
      ctx.lineWidth = 3; ctx.lineJoin = ctx.lineCap = "round";
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#38BDF8"); g.addColorStop(1, "#0369A1");
      ctx.strokeStyle = g; ctx.shadowColor = "rgba(14,165,233,.5)"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) { const mxp = (pts[i - 1][0] + pts[i][0]) / 2, myp = (pts[i - 1][1] + pts[i][1]) / 2; ctx.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], mxp, myp); }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); ctx.stroke(); ctx.restore();
      // pulsing end dot
      if (p >= 1) {
        const [x, y] = pts[pts.length - 1], pulse = (t / 1400) % 1;
        ctx.fillStyle = "#0369A1"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = `rgba(14,165,233,${1 - pulse})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5 + pulse * 14, 0, 6.2832); ctx.stroke();
      }
    }
    function tick(now) {
      if (!start) start = now;
      const p = clamp((now - start) / 1700);
      if (p >= 1) done = true;
      render(p, now);
    }
    new ResizeObserver(resize).observe(cv);
    if (reduce) { done = true; resize(); return; }
    resize();
    whenVisible(dash, tick);
  })();

  /* ---------- dashboard float + card tilt (smoothed per frame) ---------- */
  (function motion() {
    if (reduce) return;
    const dash = $("#dash");
    whenVisible(dash, t => { dash.style.transform = `translateY(${(Math.sin(t / 900) * 8).toFixed(2)}px)`; });
    if (!finePointer) return;
    const st = new Map(); // card -> {rx, ry, trx, try}
    function step() {
      let moving = false;
      st.forEach((s, el) => {
        s.rx += (s.trx - s.rx) * .14; s.ry += (s.try - s.ry) * .14;
        if (Math.abs(s.trx - s.rx) > .01 || Math.abs(s.try - s.ry) > .01) moving = true; else { s.rx = s.trx; s.ry = s.try; }
        el.style.setProperty("--rx", s.rx.toFixed(2) + "deg"); el.style.setProperty("--ry", s.ry.toFixed(2) + "deg");
      });
      if (!moving) delTask(step);
    }
    $$("[data-tilt]").forEach(el => {
      const s = { rx: 0, ry: 0, trx: 0, try: 0 }; st.set(el, s);
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        s.try = ((e.clientX - r.left) / r.width - .5) * 8; s.trx = -((e.clientY - r.top) / r.height - .5) * 8; addTask(step);
      });
      el.addEventListener("pointerleave", () => { s.trx = s.try = 0; addTask(step); });
    });
  })();

  /* ---------- marquee driven by frames (pauses on hover/offscreen) ---------- */
  (function marquee() {
    const box = $("#marquee"), track = $("#mtrack");
    const base = track.innerHTML; let x = 0, half = 0, hover = false;
    function build() {
      track.innerHTML = base; const one = track.scrollWidth || 1;
      const reps = Math.max(2, Math.ceil(box.clientWidth / one) + 1);
      track.innerHTML = base.repeat(reps * 2); half = track.scrollWidth / 2; x = x % (half || 1);
    }
    build(); new ResizeObserver(() => build()).observe(box);
    box.addEventListener("pointerenter", () => hover = true); box.addEventListener("pointerleave", () => hover = false);
    if (reduce) return;
    whenVisible(box, (_, dt) => { if (hover) return; x = (x + dt * .05) % half; track.style.transform = `translate3d(${-x}px,0,0)`; });
  })();

  /* ---------- map iframe: load only when near viewport ---------- */
  (function map() {
    const f = $("#mapFrame"), src = f.dataset.src;
    const load = () => { if (!f.src || f.src === "about:blank") f.src = src; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { load(); io.disconnect(); } }), { rootMargin: "400px" });
      io.observe($("#mapBox"));
    } else load();
  })();

  /* ---------- service buttons preselect form ---------- */
  $$("[data-service]").forEach(b => b.addEventListener("click", () => { $("#service").value = b.dataset.service; }));

  /* ---------- form ---------- */
  const form = $("#form"), msg = $("#msg");
  const fields = () => Object.fromEntries(new FormData(form).entries());
  const text = d => `New enquiry – SDM website\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nCompany: ${d.company || "-"}\nService: ${d.service}\n\nProject details:\n${d.details}`;
  function validate() {
    let ok = true, first = null;
    $$("[required]", form).forEach(f => {
      const bad = !f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) || (f.type === "tel" && f.value.replace(/\D/g, "").length < 10);
      f.classList.toggle("err", bad); if (bad) { ok = false; first = first || f; }
    });
    if (!ok) { msg.className = "bad"; msg.textContent = "Please fill all required fields with valid details (phone needs at least 10 digits)."; first.focus(); }
    return ok;
  }
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) return;
    const d = fields();
    msg.className = "ok";
    msg.textContent = "Your email app should open with the enquiry ready to send. Please press Send there. If it doesn't open, use the WhatsApp button.";
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Website enquiry – " + d.service)}&body=${encodeURIComponent(text(d))}`;
  });
  $("#waForm").addEventListener("click", e => {
    if (!validate()) { e.preventDefault(); return; }
    e.currentTarget.href = waURL(text(fields()));
  });
})();
