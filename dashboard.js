// ========================================================
// SUMMIT GLOBAL INVEST - Dashboard Principal v2.0
// Arquivo: cliente/js/dashboard.js
// Descrição: Sistema de gerenciamento do dashboard
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  
  // ========================================================
  // PROTEÇÃO: VALIDA SESSÃO ANTES DE TUDO
  // ========================================================
  if (typeof requireLogin === 'function' && !requireLogin()) {
    return; // Para execução se não autenticado
  }
  
  // ========================================================
  // ELEMENTOS DO DOM
  // ========================================================
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("toggle-btn");
  const contentArea = document.getElementById("content-area");
  
  // ========================================================
  // TOGGLE SIDEBAR
  // ========================================================
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
  
  // Fechar sidebar ao clicar fora (mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 900) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove("active");
      }
    }
  });
  
  // Expor função globalmente
  window.loadSection = loadSection;
  
  // ========================================================
  // CARREGAR SEÇÃO COM SKELETON LOADER
  // ========================================================
  async function loadSection(section) {
    console.log(`📂 Carregando seção: ${section}`);
    
    // Skeleton loader
    contentArea.innerHTML = `
      <div class="skeleton-loader">
        <div class="skeleton-header"></div>
        <div class="skeleton-cards">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      </div>
    `;
    
    try {
      const res = await fetch(`sections/${section}.html`, {
        cache: "no-store"
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      let html = await res.text();
      
      // Sanitiza HTML básico (previne XSS)
      html = sanitizeHTML(html);
      
      // Insere conteúdo
      contentArea.innerHTML = html;
      
      // Executa scripts inline
      executeInlineScripts(contentArea);
      
      // Conecta eventos
      attachSectionEvents();
      
      // Atualiza menu ativo
      updateActiveMenu(section);
      
      // Renderizações específicas por seção
      await handleSectionSpecifics(section);
      
      console.log(`✅ Seção carregada: ${section}`);
      
    } catch (error) {
      console.error(`❌ Erro ao carregar ${section}:`, error);
      
      contentArea.innerHTML = `
        <div style="text-align:center; padding:40px;">
          <p style="color:#f66; font-size:18px; margin-bottom:12px;">
            ❌ Erro ao carregar seção: ${section}
          </p>
          <p style="color:#999; margin-bottom:20px;">
            ${error.message || 'Verifique se o arquivo existe em /cliente/sections/'}
          </p>
          <button class="btn-primary" onclick="loadSection('dashboard')">
            🏠 Voltar ao Dashboard
          </button>
        </div>
      `;
    }
  }
  
  // ========================================================
  // SANITIZAÇÃO DE HTML (Previne XSS)
  // ========================================================
  function sanitizeHTML(html) {
    // Remove scripts maliciosos mas mantém os legítimos
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove event handlers inline perigosos
    const elements = temp.querySelectorAll('*');
    elements.forEach(el => {
      // Remove atributos perigosos
      ['onerror', 'onload', 'onclick', 'onmouseover'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          const value = el.getAttribute(attr);
          // Mantém apenas se for uma função conhecida (toggleReq, etc)
          if (!value.startsWith('toggleReq') && !value.startsWith('loadSection')) {
            el.removeAttribute(attr);
          }
        }
      });
    });
    
    return temp.innerHTML;
  }
  
  // ========================================================
  // LÓGICA ESPECÍFICA POR SEÇÃO
  // ========================================================
  async function handleSectionSpecifics(section) {
    const handlers = {
      'dashboard': () => {
        updateDashboardFromRede();
        waitForElement("#painelChart", () => {
          initSectionCharts("dashboard");
        });
      },
      'rede': () => {
        renderRede();
      },
      'depositos': () => {
        waitForElement("#depositosChart", () => {
          initSectionCharts("depositos");
        });
      },
      'saques': () => {
        waitForElement("#saquesChart", () => {
          initSectionCharts("saques");
        });
      },
      'carteira': () => {
        waitForElement("#walletPieChart", () => {
          initSectionCharts("carteira");
        });
      },
      'perfil': () => {
        console.log("📋 Perfil carregado");
      }
    };
    
    if (handlers[section]) {
      await handlers[section]();
    }
  }
  
  // ========================================================
  // AGUARDAR ELEMENTO COM MUTATIONOBSERVER
  // ========================================================
  function waitForElement(selector, callback, timeout = 5000) {
    // Verifica se já existe
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      return;
    }
    
    // Cria observer
    const observer = new MutationObserver((mutations, obs) => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        callback(el);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Timeout de segurança
    setTimeout(() => {
      observer.disconnect();
      console.warn(`⚠️ Timeout: Elemento ${selector} não encontrado`);
    }, timeout);
  }
  
  // ========================================================
  // ATUALIZAR MENU ATIVO
  // ========================================================
  function updateActiveMenu(section) {
    document.querySelectorAll(".menu a").forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === section) {
        link.classList.add("active");
      }
    });
  }
  
  // ========================================================
  // EXECUTAR SCRIPTS INLINE
  // ========================================================
  function executeInlineScripts(container) {
    const scripts = Array.from(container.querySelectorAll("script"));
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      
      // Copia atributos
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Script externo
      if (oldScript.src) {
        // Verifica se já foi carregado
        const alreadyLoaded = Array.from(document.scripts).some(
          s => s.src === oldScript.src
        );
        
        if (!alreadyLoaded) {
          newScript.src = oldScript.src;
          document.body.appendChild(newScript);
        }
      } else {
        // Script inline
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        // Remove imediatamente para evitar re-execução
        document.body.removeChild(newScript);
      }
      
      oldScript.remove();
    });
  }
  
  // ========================================================
  // EVENTOS DAS SEÇÕES (DELEGAÇÃO)
  // ========================================================
  function attachSectionEvents() {
    // Remove listeners antigos recriando o elemento
    const oldContainer = document.getElementById('content-area');
    const newContainer = oldContainer.cloneNode(false);
    
    // Transfere conteúdo
    while (oldContainer.firstChild) {
      newContainer.appendChild(oldContainer.firstChild);
    }
    oldContainer.parentNode.replaceChild(newContainer, oldContainer);
    
    // Delegação de eventos no novo container
    const container = document.getElementById('content-area');
    
    container.addEventListener('click', (e) => {
      // Acessos rápidos do dashboard
      if (e.target.matches('.quick-access')) {
        const section = e.target.getAttribute("data-section");
        if (section) {
          loadSection(section);
          if (window.innerWidth <= 900) {
            sidebar.classList.remove("active");
          }
        }
      }
      
      // Filtros da rede
      const statCard = e.target.closest('.stat-card');
      if (statCard && statCard.id) {
        const filter = statCard.id.replace("card-", "");
        renderRede(filter === "equipe" ? "all" : filter);
      }
      
      // Botão do simulador
      if (e.target.id === 'sim-button') {
        simulatePlan();
      }
    });
    
    // Menu lateral
    document.querySelectorAll(".menu a").forEach(link => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      newLink.addEventListener("click", (ev) => {
        ev.preventDefault();
        const section = newLink.getAttribute("data-section");
        if (section) {
          loadSection(section);
          if (window.innerWidth <= 900) {
            sidebar.classList.remove("active");
          }
        }
      });
    });
  }
  
  // ========================================================
  // SIMULADOR DE RENDIMENTOS
  // ========================================================
  function simulatePlan() {
    const valorInput = document.getElementById("sim-valor");
    const mesesInput = document.getElementById("sim-meses");
    const planoSelect = document.getElementById("sim-plano");
    const resultEl = document.getElementById("sim-result");
    const chartCanvas = document.getElementById("sim-chart");
    
    if (!valorInput || !mesesInput || !planoSelect) {
      showToast("⚠️ Erro: Elementos do simulador não encontrados", "error");
      return;
    }
    
    const valor = parseFloat(valorInput.value || 0);
    const meses = parseInt(mesesInput.value || 0);
    const taxaDia = parseFloat(planoSelect.value || 0);
    
    // Validações
    if (!valor || valor <= 0) {
      showToast("⚠️ Informe um valor válido", "warning");
      return;
    }
    
    if (!meses || meses <= 0) {
      showToast("⚠️ Informe o período em meses", "warning");
      return;
    }
    
    if (!taxaDia) {
      showToast("⚠️ Selecione um plano", "warning");
      return;
    }
    
    // Cálculo com juros compostos (22 dias úteis/mês)
    let saldo = valor;
    let historico = [valor];
    
    for (let m = 1; m <= meses; m++) {
      saldo = saldo * Math.pow(1 + taxaDia, 22);
      historico.push(Math.round(saldo));
    }
    
    const lucro = saldo - valor;
    
    // Exibe resultado
    if (resultEl) {
      resultEl.innerHTML = `
        <div style="padding:14px; border-radius:8px; background:rgba(241,196,15,0.08); border:1px solid rgba(241,196,15,0.2);">
          <p style="margin:6px 0;">
            <strong>💰 Saldo final:</strong>
            <span style="color:#f1c40f;">R$ ${Math.round(saldo).toLocaleString("pt-BR")}</span>
          </p>
          <p style="margin:6px 0;">
            <strong>📈 Lucro total:</strong>
            <span style="color:#2ecc71;">R$ ${Math.round(lucro).toLocaleString("pt-BR")}</span>
          </p>
          <p style="margin:6px 0; opacity:0.7; font-size:13px;">
            Cálculo baseado em 22 dias úteis por mês
          </p>
        </div>
      `;
    }
    
    // Gráfico
    if (chartCanvas) {
      createSimulatorChart(chartCanvas, historico, meses);
    }
    
    showToast("✅ Simulação calculada!", "success");
  }
  
  // ========================================================
  // SISTEMA DE REDE
  // ========================================================
  const fakeUsers = [];
  for (let i = 1; i <= 54; i++) {
    fakeUsers.push({
      name: `Usuário ${i}`,
      email: `user${i}@mail.com`,
      phone: `(11) 90000-${String(1000 + i).padStart(4, "0")}`,
      date: `2025-02-${String((i % 28) + 1).padStart(2, "0")}`,
      status: i % 8 === 0 ? "inativo" : "ativo",
      volume: 1000 + i * 50
    });
  }
  
  function getNetworkSummary() {
    const diretos = 10;
    const equipe = fakeUsers.length;
    const ativos = fakeUsers.filter(u => u.status === "ativo").length;
    const inativos = fakeUsers.filter(u => u.status === "inativo").length;
    const volume = fakeUsers.reduce((acc, u) => acc + u.volume, 0);
    
    return { diretos, equipe, ativos, inativos, volume };
  }
  
  function renderRede(filter = "all") {
    const { diretos, equipe, ativos, inativos, volume } = getNetworkSummary();
    
    // Atualiza resumo (com requestAnimationFrame para performance)
    const updates = {
      "resumo-diretos": diretos,
      "resumo-equipe": equipe,
      "resumo-ativos": ativos,
      "resumo-inativos": inativos,
      "resumo-volume": "R$ " + volume.toLocaleString("pt-BR")
    };
    
    requestAnimationFrame(() => {
      Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    });
    
    // Renderiza lista de usuários
    const grid = document.getElementById("rede-detalhes");
    if (!grid) return;
    
    grid.innerHTML = "";
    
    let lista = fakeUsers;
    if (filter === "diretos") lista = fakeUsers.slice(0, diretos);
    if (filter === "ativos") lista = fakeUsers.filter(u => u.status === "ativo");
    if (filter === "inativos") lista = fakeUsers.filter(u => u.status === "inativo");
    
    // Usa DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();
    
    lista.forEach(u => {
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <strong>${u.name}</strong>
        <small>📧 ${u.email}</small>
        <small>📱 ${u.phone}</small>
        <small>📅 ${u.date}</small>
        <div class="badge ${u.status}">${u.status.toUpperCase()}</div>
      `;
      fragment.appendChild(card);
    });
    
    grid.appendChild(fragment);
  }
  
  function updateDashboardFromRede() {
    const { diretos, equipe, ativos, inativos, volume } = getNetworkSummary();
    
    const updates = {
      "dash-equipe": equipe,
      "dash-diretos": diretos,
      "dash-ativos": ativos,
      "dash-inativos": inativos,
      "dash-volume": "R$ " + volume.toLocaleString("pt-BR")
    };
    
    requestAnimationFrame(() => {
      Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    });
  }
  
  // ========================================================
  // SISTEMA DE GRÁFICOS
  // ========================================================
  window._charts = window._charts || {};
  
  function destroyChart(key) {
    if (window._charts && window._charts[key]) {
      try {
        window._charts[key].destroy();
        delete window._charts[key];
        
        // Limpa canvas
        const canvas = document.getElementById(key);
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        console.log(`🗑️ Gráfico destruído: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao destruir gráfico ${key}:`, error);
      }
    }
  }
  
  function createSimulatorChart(canvas, historico, meses) {
    const key = "simChartInstance";
    destroyChart(key);
    
    const ctx = canvas.getContext("2d");
    
    window._charts[key] = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: meses + 1 }, (_, i) => `Mês ${i}`),
        datasets: [{
          label: "Evolução do Saldo (R$)",
          data: historico,
          borderColor: "#f1c40f",
          backgroundColor: "rgba(241,196,15,0.2)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: "#fff" } },
          tooltip: {
            callbacks: {
              label: (ctx) => `R$ ${ctx.parsed.y.toLocaleString("pt-BR")}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        }
      }
    });
  }
  
  function initSectionCharts(section) {
    console.log(`📊 Inicializando gráficos: ${section}`);
    
    const chartConfigs = {
      dashboard: {
        canvasId: "painelChart",
        config: {
          type: "line",
          data: {
            labels: ["Mai", "Jun", "Jul", "Ago", "Set"],
            datasets: [{
              label: "Evolução Patrimonial (R$)",
              data: [200000, 280000, 340000, 400000, 450000],
              borderColor: "#9b59b6",
              backgroundColor: "rgba(155,89,182,0.18)",
              fill: true,
              tension: 0.35,
              pointBackgroundColor: "#f1c40f",
              pointRadius: 5,
              borderWidth: 3
            }]
          },
          options: getChartOptions("R$")
        }
      },
      depositos: {
        canvasId: "depositosChart",
        config: {
          type: "line",
          data: {
            labels: ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"],
            datasets: [{
              label: "Evolução dos Depósitos (R$)",
              data: [10000, 15000, 25000, 50000, 75000, 100000],
              borderColor: "#f1c40f",
              backgroundColor: "rgba(241,196,15,0.2)",
              fill: true,
              tension: 0.3,
              pointBackgroundColor: "#f1c40f",
              borderWidth: 2
            }]
          },
          options: getChartOptions("R$")
        }
      },
      saques: [
        {
          canvasId: "saquesChart",
          config: {
            type: "bar",
            data: {
              labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"],
              datasets: [{
                label: "Saques (R$)",
                data: [500, 700, 1200, 1500, 1800, 2200, 2500, 2800, 3100],
                backgroundColor: "rgba(241,196,15,0.6)",
                borderColor: "#f1c40f",
                borderWidth: 2,
                borderRadius: 8
              }]
            },
            options: getChartOptions("R$")
          }
        },
        {
          canvasId: "saquesPie",
          config: {
            type: "doughnut",
            data: {
              labels: ["Lucros", "Comissão", "Bônus"],
              datasets: [{
                data: [5200, 1450, 300],
                backgroundColor: ["#f1c40f", "#2ecc71", "#3498db"],
                borderColor: "#111",
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#fff" }
                }
              }
            }
          }
        }
      ],
      carteira: [
        {
          canvasId: "walletPieChart",
          config: {
            type: "doughnut",
            data: {
              labels: ["Disponível", "Lucros", "Comissões", "Bônus"],
              datasets: [{
                data: [2500, 3200, 1100, 500],
                backgroundColor: ["#f1c40f", "#2ecc71", "#3498db", "#9b59b6"],
                borderColor: "#0b0b0d",
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: "#fff", font: { size: 12 } }
                }
              }
            }
          }
        },
        {
          canvasId: "walletLineChart",
          config: {
            type: "line",
            data: {
              labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
              datasets: [{
                label: "Patrimônio Total (USDT)",
                data: [3000, 3800, 4500, 5200, 6100, 7300],
                borderColor: "#f1c40f",
                backgroundColor: "rgba(241,196,15,0.2)",
                fill: true,
                tension: 0.4,
                borderWidth: 2
              }]
            },
            options: getChartOptions("USDT")
          }
        }
      ]
    };
    
    const sectionConfig = chartConfigs[section];
    
    if (!sectionConfig) {
      console.warn(`⚠️ Nenhum gráfico configurado para: ${section}`);
      return;
    }
    
    // Suporta múltiplos gráficos por seção
    const charts = Array.isArray(sectionConfig) ? sectionConfig : [sectionConfig];
    
    charts.forEach(({ canvasId, config }) => {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        destroyChart(canvasId);
        try {
          const ctx = canvas.getContext("2d");
          window._charts[canvasId] = new Chart(ctx, config);
          console.log(`✅ Gráfico criado: ${canvasId}`);
        } catch (error) {
          console.error(`❌ Erro ao criar gráfico ${canvasId}:`, error);
        }
      } else {
        console.warn(`⚠️ Canvas não encontrado: ${canvasId}`);
      }
    });
  }
  
  function getChartOptions(currency = "R$") {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: "#fff", font: { size: 14 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${currency} ${Number(ctx.parsed.y).toLocaleString('pt-BR')}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.06)" }
        },
        y: {
          ticks: {
            color: "#fff",
            callback: v => `${currency} ${v.toLocaleString('pt-BR')}`
          },
          grid: { color: "rgba(255,255,255,0.06)" }
        }
      }
    };
  }
  
  // ========================================================
  // TOAST NOTIFICATIONS
  // ========================================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // ========================================================
  // MONITORAMENTO DE PERFORMANCE
  // ========================================================
  if (window.performance && window.performance.memory) {
    setInterval(() => {
      const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
      const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
      
      if (used / limit > 0.9) {
        console.warn(`⚠️ Uso de memória alto: ${used}MB / ${limit}MB`);
      }
    }, 30000); // Verifica a cada 30s
  }
  
  // ========================================================
  // CARREGAR DASHBOARD INICIAL
  // ========================================================
  loadSection("dashboard");
  
  console.log("✅ Dashboard v2.0 carregado com sucesso");
  
});

// ========================================================
// ESTILOS CSS PARA TOAST (Adicionar dinamicamente)
// ========================================================
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 400px;
  }
  
  .toast-success {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    border-left: 4px solid #1e8449;
  }
  
  .toast-warning {
    background: linear-gradient(135deg, #f39c12, #e67e22);
    border-left: 4px solid #d68910;
  }
  
  .toast-error {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    border-left: 4px solid #a93226;
  }
  
  .toast-hide {
    animation: slideOutRight 0.3s ease;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }