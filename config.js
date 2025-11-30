// ========================================================
// SUMMIT GLOBAL INVEST - Configuração Global v2.0
// Arquivo: js/config.js
// Descrição: Configurações centralizadas da aplicação
// ========================================================

(function() {
  'use strict';

  // ========================================================
  // DETECÇÃO DE AMBIENTE
  // ========================================================
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168');
  const isProduction = !isDevelopment;

  // ========================================================
  // CONFIGURAÇÃO PRINCIPAL
  // ========================================================
  window.SUMMIT_CONFIG = {
    // ===== AMBIENTE =====
    environment: isDevelopment ? 'development' : 'production',
    isDevelopment,
    isProduction,
    
    // ===== VERSÃO =====
    version: '2.0.0',
    buildDate: '2025-11-28',
    
    // ===== URLs BASE =====
    basePath: isProduction ? '/summit' : '',
    apiURL: isDevelopment 
      ? 'http://localhost:3000/api'
      : 'https://api.summitglobal.com/api',
    
    // ===== CAMINHOS DE ASSETS =====
    paths: {
      css: isDevelopment ? '/css' : '/summit/css',
      js: isDevelopment ? '/js' : '/summit/js',
      img: isDevelopment ? '/img' : '/summit/img',
      cliente: isDevelopment ? '/cliente' : '/summit/cliente'
    },
    
    // ===== AUTENTICAÇÃO =====
    auth: {
      tokenKey: 'summit_token_v2',
      sessionKey: 'summit_session_v2',
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
      sessionTimeoutRemember: 30 * 24 * 60 * 60 * 1000, // 30 dias
      maxLoginAttempts: 5,
      attemptWindow: 15 * 60 * 1000 // 15 minutos
    },
    
    // ===== STORAGE KEYS (NAMESPACE) =====
    storage: {
      users: 'sg_v2_users',
      session: 'sg_v2_session',
      profile: 'sg_v2_profile',
      kyc: 'sg_v2_kyc',
      sessions: 'sg_v2_sessions',
      password: 'sg_v2_password',
      transactions: 'sg_v2_transactions',
      network: 'sg_v2_network'
    },
    
    // ===== API =====
    api: {
      timeout: 15000, // 15 segundos
      retryAttempts: 3,
      retryDelay: 1000, // 1 segundo
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '2.0.0',
        'X-Platform': 'web'
      }
    },
    
    // ===== VALIDAÇÕES =====
    validation: {
      username: {
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/,
        message: 'Nome de usuário deve ter 3-20 caracteres (letras, números e _)'
      },
      email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: 'E-mail inválido'
      },
      password: {
        minLength: 6,
        maxLength: 50,
        requireNumber: true,
        requireLetter: false,
        requireSpecial: false,
        message: 'Senha deve ter no mínimo 6 caracteres e conter pelo menos um número'
      }
    },
    
    // ===== PLANOS DE INVESTIMENTO =====
    plans: {
      start: { min: 300, max: 999, rate: 0.003, label: 'Start' },
      bronze: { min: 1000, max: 4999, rate: 0.004, label: 'Bronze' },
      prata: { min: 5000, max: 9999, rate: 0.005, label: 'Prata' },
      ouro: { min: 10000, max: 24999, rate: 0.006, label: 'Ouro' },
      platina: { min: 25000, max: 49999, rate: 0.007, label: 'Platina' },
      diamante: { min: 50000, max: Infinity, rate: 0.0076, label: 'Diamante' }
    },
    
    // ===== NÍVEIS DE CARREIRA =====
    career: {
      cristal: { volume: 1500, bonus: 500, diretos: 1 },
      jade: { volume: 2250, bonus: 750, diretos: 2 },
      perola: { volume: 3000, bonus: 1000, diretos: 2 },
      safira: { volume: 7500, bonus: 2500, diretos: 3 },
      esmeralda: { volume: 21000, bonus: 7000, diretos: 3 },
      rubi: { volume: 66000, bonus: 22000, diretos: 4 },
      diamante: { volume: 240000, bonus: 80000, diretos: 5 },
      diamante_azul: { volume: 450000, bonus: 150000, diretos: 6 },
      diamante_verde: { volume: 1050000, bonus: 350000, diretos: 7 },
      diamante_roxo: { volume: 1800000, bonus: 600000, diretos: 8 },
      diamante_vermelho: { volume: 3900000, bonus: 1300000, diretos: 8 },
      diamante_platina: { volume: 13500000, bonus: 4500000, diretos: 9 },
      diamante_negro: { volume: 21000000, bonus: 7000000, diretos: 10 },
      diamante_negro_duplo: { volume: 48000000, bonus: 16000000, diretos: 10 },
      diamante_negro_triplo: { volume: 120000000, bonus: 40000000, diretos: 10 }
    },
    
    // ===== UI/UX =====
    ui: {
      toastDuration: 3000,
      loadingDelay: 300,
      animationDuration: 300,
      particlesCount: window.innerWidth <= 768 ? 20 : 40,
      chartColors: {
        primary: '#f1c40f',
        success: '#2ecc71',
        danger: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12',
        purple: '#9b59b6'
      }
    },
    
    // ===== PERFORMANCE =====
    performance: {
      enableLazyLoading: true,
      enableServiceWorker: isProduction,
      enableAnalytics: isProduction,
      cacheStaticAssets: isProduction,
      compressionEnabled: isProduction
    },
    
    // ===== FEATURES FLAGS =====
    features: {
      twoFactorAuth: true,
      kyc: true,
      referralSystem: true,
      notifications: true,
      darkMode: true,
      multiLanguage: false // Futuro
    },
    
    // ===== SEGURANÇA =====
    security: {
      enableCSRF: isProduction,
      enableCSP: isProduction,
      enableHTTPSOnly: isProduction,
      sanitizeInputs: true,
      logSecurityEvents: isProduction
    },
    
    // ===== LOGS =====
    logging: {
      enabled: true,
      level: isDevelopment ? 'debug' : 'error',
      sendToServer: isProduction,
      consoleEnabled: isDevelopment
    },
    
    // ===== CONTATOS =====
    contact: {
      email: 'contato@summitglobal.com',
      support: 'suporte@summitglobal.com',
      whatsapp: '+55 11 99999-9999',
      telegram: '@summitglobal'
    },
    
    // ===== SOCIAL MEDIA =====
    social: {
      facebook: 'https://facebook.com/summitglobal',
      instagram: 'https://instagram.com/summitglobal',
      twitter: 'https://twitter.com/summitglobal',
      linkedin: 'https://linkedin.com/company/summitglobal'
    },
    
    // ===== MÉTODOS DE PAGAMENTO =====
    paymentMethods: {
      usdt: {
        name: 'USDT (TRC20)',
        network: 'TRC20',
        enabled: true,
        minDeposit: 100,
        minWithdraw: 50,
        fee: 0
      },
      pix: {
        name: 'PIX',
        enabled: true,
        minDeposit: 100,
        minWithdraw: 50,
        fee: 0
      }
    },
    
    // ===== LIMITES =====
    limits: {
      withdraw: {
        frequency: '1x por semana',
        minimum: 100,
        maximum: null, // sem limite
        fee: 0.03 // 3%
      },
      deposit: {
        minimum: 300,
        maximum: null
      }
    }
  };

  // ========================================================
  // MÉTODOS AUXILIARES
  // ========================================================
  
  /**
   * Retorna URL completa com base path
   */
  SUMMIT_CONFIG.getURL = function(path) {
    return `${this.basePath}${path}`;
  };

  /**
   * Retorna path de asset
   */
  SUMMIT_CONFIG.getAssetPath = function(type, filename) {
    if (!this.paths[type]) {
      console.warn(`Tipo de asset desconhecido: ${type}`);
      return filename;
    }
    return `${this.paths[type]}/${filename}`;
  };

  /**
   * Valida se está em ambiente de desenvolvimento
   */
  SUMMIT_CONFIG.isDev = function() {
    return this.isDevelopment;
  };

  /**
   * Retorna chave de storage com namespace
   */
  SUMMIT_CONFIG.getStorageKey = function(key) {
    return this.storage[key] || key;
  };

  /**
   * Log condicional baseado no ambiente
   */
  SUMMIT_CONFIG.log = function(level, ...args) {
    if (!this.logging.enabled) return;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.logging.level);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= currentLevel) {
      console[level]('[Summit]', ...args);
    }
  };

  /**
   * Valida campo baseado na configuração
   */
  SUMMIT_CONFIG.validate = function(field, value) {
    const rule = this.validation[field];
    if (!rule) return { valid: true };
    
    switch(field) {
      case 'username':
        if (value.length < rule.minLength || value.length > rule.maxLength) {
          return { valid: false, message: rule.message };
        }
        if (!rule.pattern.test(value)) {
          return { valid: false, message: rule.message };
        }
        break;
        
      case 'email':
        if (!rule.pattern.test(value)) {
          return { valid: false, message: rule.message };
        }
        break;
        
      case 'password':
        if (value.length < rule.minLength || value.length > rule.maxLength) {
          return { valid: false, message: rule.message };
        }
        if (rule.requireNumber && !/[0-9]/.test(value)) {
          return { valid: false, message: rule.message };
        }
        if (rule.requireLetter && !/[a-zA-Z]/.test(value)) {
          return { valid: false, message: 'Senha deve conter letras' };
        }
        if (rule.requireSpecial && !/[^a-zA-Z0-9]/.test(value)) {
          return { valid: false, message: 'Senha deve conter caracteres especiais' };
        }
        break;
    }
    
    return { valid: true };
  };

  /**
   * Retorna configuração de plano baseado no valor
   */
  SUMMIT_CONFIG.getPlanByValue = function(value) {
    for (const [key, plan] of Object.entries(this.plans)) {
      if (value >= plan.min && value <= plan.max) {
        return { ...plan, key };
      }
    }
    return null;
  };

  // ========================================================
  // INICIALIZAÇÃO
  // ========================================================
  
  // Congela objeto para prevenir modificações
  Object.freeze(SUMMIT_CONFIG.auth);
  Object.freeze(SUMMIT_CONFIG.storage);
  Object.freeze(SUMMIT_CONFIG.api);
  Object.freeze(SUMMIT_CONFIG.validation);
  Object.freeze(SUMMIT_CONFIG.plans);
  Object.freeze(SUMMIT_CONFIG.career);
  
  // Log de inicialização
  SUMMIT_CONFIG.log('info', 'Configuração carregada:', {
    environment: SUMMIT_CONFIG.environment,
    version: SUMMIT_CONFIG.version,
    apiURL: SUMMIT_CONFIG.apiURL
  });

  // Expõe globalmente
  window.CONFIG = SUMMIT_CONFIG;

  console.log(`✅ Summit Global Config v${SUMMIT_CONFIG.version} carregado`);
  console.log(`📍 Ambiente: ${SUMMIT_CONFIG.environment}`);
  console.log(`🌐 API: ${SUMMIT_CONFIG.apiURL}`);

})();