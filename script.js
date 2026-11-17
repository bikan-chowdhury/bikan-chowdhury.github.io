/* ============================================================
   BIKAN CHOWDHURY — PORTFOLIO INTERACTIONS
   custom cursor · particles · 3D tilt · scroll-reveal · nav
   ============================================================ */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ==========================================================
     1. CURSOR FOLLOWER (native cursor stays visible)
     ========================================================== */
  const follower = document.querySelector(".cursor-follower");

  if (finePointer && !prefersReducedMotion && follower) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let fx = mouseX;
    let fy = mouseY;
    let visible = false;

    const showCursor = () => {
      if (!visible) {
        visible = true;
        document.body.classList.add("cursor-on");
      }
    };

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      showCursor();
    }, { passive: true });

    window.addEventListener("mousedown", () => document.body.classList.add("cursor-down"));
    window.addEventListener("mouseup", () => document.body.classList.remove("cursor-down"));
    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("cursor-on");
      visible = false;
    });
    document.addEventListener("mouseenter", showCursor);

    // Hover state on interactive elements
    const hoverSelector = "a, button, [data-cursor='hover'], .tilt";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverSelector)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverSelector)) document.body.classList.remove("cursor-hover");
    });

    // Spring-lag follower
    const lerp = (a, b, n) => a + (b - a) * n;
    const animateCursor = () => {
      fx = lerp(fx, mouseX, 0.16);
      fy = lerp(fy, mouseY, 0.16);
      follower.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
  }

  /* ==========================================================
     2. INTERACTIVE PARTICLE FIELD
     ========================================================== */
  const canvas = document.getElementById("particles");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width = 0, height = 0, dpr = 1;
    let particles = [];
    let animId = null;
    const pointer = { x: -9999, y: -9999, active: false };

    const CONFIG = {
      baseCount: 80,
      maxCount: 130,
      minCount: 40,
      linkDist: 130,
      repelRadius: 150,
      repelForce: 2.2,
      speed: 0.35,
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const particleCount = () => {
      const areaFactor = (width * height) / (1440 * 900);
      return Math.round(Math.min(CONFIG.maxCount, Math.max(CONFIG.minCount, CONFIG.baseCount * areaFactor)));
    };

    const initParticles = () => {
      const n = particleCount();
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        r: Math.random() * 1.6 + 0.6,
        tone: Math.random() < 0.55 ? "ink" : (Math.random() < 0.6 ? "blue" : "orange"),
      }));
    };

    window.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener("mouseout", () => { pointer.active = false; });
    window.addEventListener("resize", resize);

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor repulsion
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONFIG.repelRadius && dist > 0.01) {
            const force = (1 - dist / CONFIG.repelRadius) * CONFIG.repelForce;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Damping toward base speed
        p.vx *= 0.96;
        p.vy *= 0.96;
        const v = Math.hypot(p.vx, p.vy);
        if (v < CONFIG.speed * 0.5) {
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.tone === "ink"
          ? "rgba(19, 19, 22, 0.4)"
          : p.tone === "blue"
            ? "rgba(47, 92, 255, 0.55)"
            : "rgba(255, 92, 56, 0.55)";
        ctx.fill();

        // Links
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONFIG.linkDist) {
            const alpha = (1 - dist / CONFIG.linkDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(19, 19, 22, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        // Subtle line to cursor when near
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONFIG.repelRadius) {
            const alpha = (1 - dist / CONFIG.repelRadius) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(47, 92, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    resize();
    step();

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        animId = null;
      } else if (!animId) {
        step();
      }
    });
  }

  /* ==========================================================
     3. 3D TILT CARDS
     ========================================================== */
  if (finePointer && !prefersReducedMotion) {
    const tiltCards = document.querySelectorAll(".tilt");
    const MAX_TILT = 8;

    tiltCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width;
        const py = y / rect.height;
        const rotateY = (px - 0.5) * MAX_TILT * 2;
        const rotateX = (0.5 - py) * MAX_TILT * 2;

        card.style.transform =
          `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Spotlight position for skill cards
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .6s cubic-bezier(0.22, 1, 0.36, 1)";
        card.style.transform =
          "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        setTimeout(() => { card.style.transition = ""; }, 600);
      });
    });
  }

  /* ==========================================================
     4. SCROLL REVEAL
     ========================================================== */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ==========================================================
     5. SMART STICKY NAV + ACTIVE SECTION
     ========================================================== */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const sectionLinks = document.querySelectorAll(".nav-link[href^='#']");
  const sections = document.querySelectorAll("section[id]");

  // Shrink/blur on scroll
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Active section highlight
  if ("IntersectionObserver" in window && sections.length) {
    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          sectionLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach((s) => sectionIO.observe(s));
  }
})();
