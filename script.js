// Aguarda o DOM carregar antes de rodar o script
document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA DO MENU MOBILE (Revisada) ---
  const mobileButton = document.getElementById("menu-mobile-botao");
  const navMenu = document.getElementById("nav-menu");

  if (mobileButton && navMenu) {
    const toggleMenu = () => {
      navMenu.classList.toggle("ativo");
      mobileButton.classList.toggle("ativo"); // Adiciona 'ativo' ao botão também

      const estaAtivo = navMenu.classList.contains("ativo");
      mobileButton.setAttribute("aria-expanded", estaAtivo);

      if (estaAtivo) {
        mobileButton.setAttribute("aria-label", "Fechar menu");
        mobileButton.textContent = "Fechar"; // Muda o texto do botão
      } else {
        mobileButton.setAttribute("aria-label", "Abrir menu");
        mobileButton.textContent = "Menu"; // Volta o texto do botão
      }
    };

    mobileButton.addEventListener("click", toggleMenu);

    // Fecha o menu ao clicar em um link (experiência melhor no mobile)
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("ativo")) {
          toggleMenu();
        }
      });
    });
  }

  // --- NOVA LÓGICA DO SLIDER ---
  const sliderWrapper = document.querySelector(".slider-wrapper");
  const slides = document.querySelectorAll(".slide");
  const dotsContainer = document.querySelector(".slider-dots");

  // Só executa o código do slider se os elementos existirem (na index.html)
  if (sliderWrapper && slides.length > 0 && dotsContainer) {
    let currentIndex = 0;
    const totalSlides = slides.length;
    let slideInterval;

    // 1. Criar as bolinhas (dots) de navegação
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.classList.add("dot");
      dot.setAttribute("aria-label", `Ir para o slide ${index + 1}`);
      dot.addEventListener("click", () => {
        goToSlide(index);
        resetInterval(); // Reinicia o timer ao clicar
      });
      dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".slider-dots .dot");

    // 2. Função para ir para um slide específico
    const goToSlide = (index) => {
      if (index < 0) {
        index = totalSlides - 1;
      } else if (index >= totalSlides) {
        index = 0;
      }

      // Move o wrapper (o container de todos os slides)
      sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
      currentIndex = index;
      updateDots();
    };

    // 3. Função para atualizar qual bolinha está ativa
    const updateDots = () => {
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.classList.add("ativo");
        } else {
          dot.classList.remove("ativo");
        }
      });
    };

    // 4. Função para ir ao próximo slide
    const nextSlide = () => {
      goToSlide(currentIndex + 1);
    };

    // 5. Iniciar a troca automática
    const startInterval = () => {
      // Troca a cada 5 segundos
      slideInterval = setInterval(nextSlide, 5000);
    };

    // 6. Reiniciar o timer (para quando o usuário interage)
    const resetInterval = () => {
      clearInterval(slideInterval);
      startInterval();
    };

    // Inicia tudo
    goToSlide(0); // Garante que o primeiro slide e dot estejam ativos
    startInterval();
  }
});
