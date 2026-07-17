// Aguarda o DOM carregar antes de rodar o script
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // --- MENU MOBILE (hambúrguer + sheet + scrim) ---
  const mobileButton = document.getElementById("menu-mobile-botao");
  const navMenu = document.getElementById("nav-menu");
  const scrim = document.getElementById("menu-scrim");

  if (mobileButton && navMenu && scrim) {
    const setMenu = (aberto) => {
      navMenu.classList.toggle("ativo", aberto);
      mobileButton.classList.toggle("ativo", aberto);
      scrim.classList.toggle("ativo", aberto);
      mobileButton.setAttribute("aria-expanded", aberto);
      mobileButton.setAttribute(
        "aria-label",
        aberto ? "Fechar menu" : "Abrir menu"
      );
    };

    mobileButton.addEventListener("click", () =>
      setMenu(!navMenu.classList.contains("ativo"))
    );
    scrim.addEventListener("click", () => setMenu(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("ativo")) {
        setMenu(false);
        mobileButton.focus();
      }
    });
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  // --- SOMBRA DO HEADER AO ROLAR ---
  const header = document.getElementById("header");
  if (header) {
    const onScroll = () =>
      header.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // --- CARROSSEL DO HERO (crossfade + Ken Burns) ---
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dotsContainer = document.getElementById("hero-dots");
  const temGsap = !!window.gsap;

  if (slides.length > 1 && dotsContainer) {
    let atual = 0;
    let autoplay = null;
    const INTERVALO = 6000;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " ativo" : "");
      dot.setAttribute("aria-label", `Ir para a imagem ${i + 1}`);
      dot.addEventListener("click", () => {
        irPara(i);
        reiniciarAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.children);

    const kenBurns = (slide) => {
      gsap.fromTo(
        slide,
        { scale: 1.08 },
        { scale: 1, duration: INTERVALO / 1000 + 1.2, ease: "none" }
      );
    };

    const irPara = (proximo) => {
      if (proximo === atual) return;
      const sai = slides[atual];
      const entra = slides[proximo];

      if (temGsap && !reduceMotion) {
        gsap.killTweensOf([sai, entra]);
        entra.classList.add("is-active");
        gsap.fromTo(
          entra,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1, ease: "power2.inOut" }
        );
        gsap.to(sai, {
          autoAlpha: 0,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => sai.classList.remove("is-active"),
        });
        kenBurns(entra);
      } else {
        sai.classList.remove("is-active");
        sai.style.opacity = "";
        entra.classList.add("is-active");
        entra.style.opacity = "";
      }

      dots[atual].classList.remove("ativo");
      dots[proximo].classList.add("ativo");
      atual = proximo;
    };

    const iniciarAutoplay = () => {
      if (reduceMotion) return;
      autoplay = setInterval(() => {
        if (!document.hidden) irPara((atual + 1) % slides.length);
      }, INTERVALO);
    };
    const reiniciarAutoplay = () => {
      clearInterval(autoplay);
      iniciarAutoplay();
    };

    if (temGsap && !reduceMotion) kenBurns(slides[0]);
    iniciarAutoplay();
  }

  // --- HOLOFOTE NO MOUSE (cards de valores) ---
  document.querySelectorAll(".valor-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  // --- CARD HOVER TILT (transitions.dev 19-card-tilt) ---
  // Ponteiro rastreado no wrapper plano .t-tilt; o .t-tilt-card rotaciona.
  document.querySelectorAll(".t-tilt").forEach((tilt) => {
    const card = tilt.querySelector(".t-tilt-card");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const MAX = 10; // inclinação máxima em graus (sutil)

    function reset() {
      tilt.classList.remove("is-hover");
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-rx", "0deg");
      card.style.setProperty("--tilt-ry", "0deg");
    }

    function track(e) {
      if (reduce.matches) return;
      const r = tilt.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      tilt.classList.add("is-hover");
      card.classList.add("is-tilting");
      card.style.setProperty("--tilt-ry", ((px - 0.5) * MAX).toFixed(2) + "deg");
      card.style.setProperty("--tilt-rx", ((0.5 - py) * MAX).toFixed(2) + "deg");
      card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
    }

    tilt.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") {
        try {
          tilt.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    });
    tilt.addEventListener("pointermove", track);
    tilt.addEventListener("pointerup", reset);
    tilt.addEventListener("pointercancel", reset);
    tilt.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") reset();
    });
  });

  // --- GALERIA 3D CIRCULAR (Eventos) ---
  // Auto-rotação contínua + impulso extra conforme a seção rola,
  // com fade dos cards que estão "atrás" do anel.
  const anel = document.getElementById("galeria-anel");
  if (anel && !reduceMotion) {
    const itens = Array.from(anel.children);
    const passo = 360 / itens.length;
    const modoAnel = window.matchMedia("(min-width: 641px)"); // mobile usa carrossel deslizante (CSS)
    let rotBase = 0;
    let rotScroll = 0;
    let visivel = false;

    const render = () => {
      if (visivel && modoAnel.matches && !document.hidden) {
        rotBase += 0.05; // ~3°/s de rotação automática
        const total = rotBase + rotScroll;
        anel.style.transform = `rotateY(${total}deg)`;
        itens.forEach((item, i) => {
          const rel = (((i * passo + total) % 360) + 360) % 360;
          const norm = Math.abs(rel > 180 ? 360 - rel : rel);
          item.style.opacity = Math.max(0.28, 1 - norm / 200).toFixed(2);
        });
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: "#eventos",
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visivel = self.isActive),
        onUpdate: (self) => (rotScroll = self.progress * 120),
      });
    } else {
      visivel = true;
    }
  }

  // --- ANIMAÇÕES GSAP (gsap-core + gsap-scrolltrigger) ---
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add(
      {
        full: "(prefers-reduced-motion: no-preference)",
        desktop:
          "(min-width: 801px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        if (!ctx.conditions.full) return; // reduced-motion: nada anima
        const desktop = ctx.conditions.desktop;
      // 1. Entrada do hero
      gsap.from(".hero-content > *", {
        autoAlpha: 0,
        y: 26,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.15,
      });

      // 2. Parallax multicamadas no hero — só no desktop (no mobile a
      //    barra de endereço redimensiona o viewport e o scrub "pula")
      if (desktop) {
        const heroTl = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 0,
          },
        });
        heroTl
          .to('[data-hero-layer="fundo"]', { yPercent: 22, ease: "none" })
          .to(
            '[data-hero-layer="frente"]',
            { yPercent: 58, autoAlpha: 0.15, ease: "none" },
            "<"
          );
      }

      // 3. Títulos e subtítulos de seção
      gsap.utils.toArray(".section-title, .section-sub").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      // 4. Cards do rodízio
      gsap.from(".destaque-item", {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: ".destaques-grid",
          start: "top 80%",
          once: true,
        },
      });

      // 5. Parallax sutil na imagem do sobre (desktop apenas)
      if (desktop) {
        gsap.fromTo(
          ".sobre-imagem-destaque img",
          { yPercent: -14 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".sobre-flex",
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      // 6. Texto do sobre
      gsap.from(".sobre-texto", {
        autoAlpha: 0,
        x: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ".sobre-flex", start: "top 75%", once: true },
      });

      // 7. Contadores
      gsap.utils.toArray(".stat-count").forEach((el) => {
        gsap.from(el, {
          textContent: 0,
          duration: 1.4,
          ease: "power1.out",
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: ".stats-row",
            start: "top 85%",
            once: true,
          },
        });
      });

      // 8. Cards de valores — o do meio chega por último e "assenta"
      gsap.from(".valor-card", {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".valores-grid",
          start: "top 80%",
          once: true,
        },
      });

      // 9. Galeria de eventos: o anel inteiro surge crescendo
      gsap.from(".galeria-3d", {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: "#eventos", start: "top 70%", once: true },
      });

      // 10. Avaliações
      gsap.from("#avaliacoes .t-tilt", {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".avaliacoes-grid",
          start: "top 80%",
          once: true,
        },
      });

      // 11. Rodapé
      gsap.from(".footer-coluna", {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".footer-grid",
          start: "top 88%",
          once: true,
        },
      });
    });
  }
});
