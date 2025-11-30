// ========================================================
// SUMMIT GLOBAL INVEST - JavaScript Institucional v2.1
// Arquivo: js/institucional.js
// ========================================================

(function() {
  'use strict';

  // ========================================================
  // CONFIGURAÇÕES
  // ========================================================
  const CONFIG = {
    isMobile: window.innerWidth <= 768,
    isLowEnd: navigator.hardwareConcurrency <= 2,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ========================================================
  // MENU MOBILE
  // ========================================================
  function initMobileMenu() {
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    
    if (!menuToggle || !mobileMenu) return;
    
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle("active");
      mobileMenu.classList.toggle("active");
    });

    // Fecha ao clicar em link
    document.querySelectorAll('.nav-mobile a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove("active");
        mobileMenu.classList.remove("active");
      });
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });
  }

  // ========================================================
  // CALCULADORA DE RENDIMENTOS
  // ========================================================
  let graficoInstance = null;

  function calcular() {
    const valorEl = document.getElementById("valor");
    const mesesEl = document.getElementById("tempo");
    const planoEl = document.getElementById("plano");
    const resultDiv = document.getElementById("resultados");
    const graficoCanvas = document.getElementById("grafico");
    
    if (!valorEl || !mesesEl || !planoEl || !resultDiv || !graficoCanvas) {
      console.warn('Elementos da calculadora não encontrados');
      return;
    }
    
    const valor = parseFloat(valorEl.value || 0);
    const meses = parseInt(mesesEl.value || 0);
    const taxa = parseFloat(planoEl.value || 0);
    
    // Validações
    if (isNaN(valor) || isNaN(meses) || valor < 300 || meses < 1) {
      alert("⚠️ Por favor, preencha todos os campos corretamente.\nValor mínimo: R$ 300");
      return;
    }

    if (meses > 36) {
      alert("⚠️ Período máximo: 36 meses");
      return;
    }

    // Cálculo com juros compostos (22 dias úteis/mês)
    let saldo = valor;
    const labels = ["Início"];
    const data = [valor];
    
    for (let i = 1; i <= meses; i++) {
      saldo = saldo * Math.pow(1 + taxa, 22);
      labels.push(`${i}M`);
      data.push(saldo);
    }
    
    const lucro = saldo - valor;

    // Exibe resultado
    resultDiv.innerHTML = `
      <p class="saldo">💰 Saldo Final: R$ ${saldo.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</p>
      <p class="lucro">📈 Lucro Estimado: R$ ${lucro.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</p>
      <p style="font-size: 14px; margin-top: 16px; opacity: 0.8; color: #ddd;">
        Cálculo baseado em 22 dias úteis por mês
      </p>
    `;
    resultDiv.classList.add('show');

    // Cria gráfico
    graficoCanvas.style.display = "block";
    
    // Verifica se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js não carregado ainda');
      setTimeout(() => calcular(), 1000); // Tenta novamente após 1s
      return;
    }
    
    if (graficoInstance) {
      graficoInstance.destroy();
    }
    
    const ctx = graficoCanvas.getContext("2d");
    graficoInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Crescimento do Investimento (R$)",
          data: data,
          borderColor: "#f1c40f",
          backgroundColor: "rgba(241, 196, 15, 0.15)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#f1c40f",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { 
            labels: { 
              color: "#fff",
              font: { size: 14, weight: '600' },
              padding: 15
            } 
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#f1c40f',
            bodyColor: '#fff',
            borderColor: '#f1c40f',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return 'R$ ' + context.parsed.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              }
            }
          }
        },
        scales: {
          x: { 
            ticks: { 
              color: "#ccc",
              font: { size: 12 }
            }, 
            grid: { 
              color: "rgba(255, 255, 255, 0.08)",
              drawBorder: false
            } 
          },
          y: { 
            ticks: { 
              color: "#ccc",
              font: { size: 12 },
              callback: function(value) {
                return 'R$ ' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              }
            }, 
            grid: { 
              color: "rgba(255, 255, 255, 0.08)",
              drawBorder: false
            } 
          }
        }
      }
    });

    // Scroll suave para resultado
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ========================================================
  // PARTÍCULAS DE FUNDO
  // ========================================================
  function initParticles() {
    if (!window.tsParticles) {
      console.warn('tsParticles não carregado ainda');
      // Tenta novamente após 1 segundo
      setTimeout(initParticles, 1000);
      return;
    }

    const particleConfig = {
      background: { 
        color: "transparent" 
      },
      particles: {
        number: { 
          value: CONFIG.prefersReducedMotion ? 10 : (CONFIG.isMobile ? 20 : (CONFIG.isLowEnd ? 40 : 60)),
          density: {
            enable: true,
            value_area: CONFIG.isMobile ? 1500 : 1000
          }
        },
        color: { 
          value: "#f1c40f" 
        },
        shape: { 
          type: "circle" 
        },
        opacity: { 
          value: 0.4,
          random: true,
          anim: {
            enable: !CONFIG.prefersReducedMotion,
            speed: 0.5,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: { 
          value: CONFIG.isMobile ? 2 : 3,
          random: true,
          anim: {
            enable: !CONFIG.prefersReducedMotion,
            speed: 2,
            size_min: 0.5,
            sync: false
          }
        },
        move: { 
          enable: true, 
          speed: CONFIG.prefersReducedMotion ? 0.3 : (CONFIG.isMobile ? 0.5 : 1),
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false
        },
        line_linked: {
          enable: !CONFIG.isMobile && !CONFIG.prefersReducedMotion,
          distance: 150,
          color: "#f1c40f",
          opacity: 0.15,
          width: 1
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: !CONFIG.isMobile && !CONFIG.isLowEnd && !CONFIG.prefersReducedMotion,
            mode: "repulse"
          },
          onclick: {
            enable: !CONFIG.prefersReducedMotion,
            mode: "push"
          },
          resize: true
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4
          },
          push: {
            particles_nb: CONFIG.isMobile ? 2 : 4
          }
        }
      },
      retina_detect: true,
      fps_limit: CONFIG.isMobile ? 30 : 60
    };

    tsParticles.load("tsparticles", particleConfig).then(() => {
      console.log('🎨 Partículas carregadas');
    }).catch(err => {
      console.error('Erro ao carregar partículas:', err);
    });
  }

  // ========================================================
  // SMOOTH SCROLL
  // ========================================================
  function initSmoothScroll() {
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    const handleSmoothScroll = debounce((target) => {
      if (target) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 70;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        if (href === '#' || href === '') {
          return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        handleSmoothScroll(target);
      });
    });
  }

  // ========================================================
  // HIGHLIGHT MENU AO SCROLL
  // ========================================================
  function initMenuHighlight() {
    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    const highlightMenu = debounce(() => {
      const sections = document.querySelectorAll('.section, .hero');
      const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
      
      let current = '';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= (sectionTop - 100)) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.style.color = '';
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
          link.style.color = '#f1c40f';
        }
      });
    }, 100);

    window.addEventListener('scroll', highlightMenu, { passive: true });
  }

  // ========================================================
  // LAZY LOADING DE IMAGENS
  // ========================================================
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // ========================================================
  // INICIALIZAÇÃO
  // ========================================================
  function init() {
    console.log('🚀 Inicializando Summit Global Institucional v2.1');
    
    // Aguarda DOM completo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      initAll();
    }
  }

  function initAll() {
    // Inicializa componentes
    initMobileMenu();
    initSmoothScroll();
    initMenuHighlight();
    initLazyLoading();
    
    // Calculadora (aguarda DOM)
    setTimeout(() => {
      const calcBtn = document.getElementById('calcular-btn');
      if (calcBtn) {
        calcBtn.addEventListener('click', calcular);
        console.log('✅ Calculadora inicializada');
      }
    }, 500);
    
    // Partículas (aguarda biblioteca)
    setTimeout(() => {
      if (window.tsParticles) {
        initParticles();
      } else {
        console.warn('⚠️ tsParticles não disponível');
      }
    }, 1000);
    
    console.log('✅ Sistema institucional carregado');
  }

  // Inicia
  init();

})();