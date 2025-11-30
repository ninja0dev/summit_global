// ========================================================
// SUMMIT GLOBAL INVEST - API Layer v2.0
// Arquivo: cliente/js/api.js
// Descrição: Camada de abstração para comunicação com backend
// ========================================================

(function() {
  'use strict';

  // ========================================================
  // CONFIGURAÇÃO
  // ========================================================
  const API_CONFIG = {
    // Modo de desenvolvimento (usa localStorage simulado)
    isDevelopment: true,
    
    // URL base da API (quando backend estiver pronto)
    baseURL: 'http://localhost:3000/api',
    
    // Timeout padrão (15 segundos)
    timeout: 15000,
    
    // Retry automático em caso de falha
    retryAttempts: 3,
    retryDelay: 1000
  };

  // ========================================================
  // CLASSE API
  // ========================================================
  class SummitAPI {
    constructor(config = {}) {
      this.config = { ...API_CONFIG, ...config };
      this.token = this.getStoredToken();
      
      console.log(`🌐 Summit API v2.0 inicializada (Modo: ${this.config.isDevelopment ? 'Desenvolvimento' : 'Produção'})`);
    }

    // ========================================================
    // GERENCIAMENTO DE TOKEN
    // ========================================================
    getStoredToken() {
      return localStorage.getItem('summit_token') || null;
    }

    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem('summit_token', token);
      } else {
        localStorage.removeItem('summit_token');
      }
    }

    clearToken() {
      this.token = null;
      localStorage.removeItem('summit_token');
      localStorage.removeItem('summit_session');
    }

    // ========================================================
    // REQUISIÇÕES HTTP (Com retry automático)
    // ========================================================
    async request(endpoint, options = {}, attempt = 1) {
      // Se estiver em modo desenvolvimento, simula com localStorage
      if (this.config.isDevelopment) {
        return this.mockRequest(endpoint, options);
      }

      const url = `${this.config.baseURL}${endpoint}`;
      
      const config = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Adiciona token se existir
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }

      // Timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      config.signal = controller.signal;

      try {
        console.log(`📡 API Request: ${config.method} ${endpoint}`);
        
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        // Trata erros HTTP
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new APIError(
            error.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            error
          );
        }

        const data = await response.json();
        console.log(`✅ API Response: ${endpoint}`, data);
        
        return data;

      } catch (error) {
        clearTimeout(timeoutId);

        // Retry automático em caso de erro de rede
        if (attempt < this.config.retryAttempts && error.name === 'AbortError') {
          console.warn(`⚠️ Timeout - Tentativa ${attempt}/${this.config.retryAttempts}`);
          await this.delay(this.config.retryDelay * attempt);
          return this.request(endpoint, options, attempt + 1);
        }

        console.error(`❌ API Error: ${endpoint}`, error);
        throw error;
      }
    }

    // ========================================================
    // MOCK REQUEST (Simula backend com localStorage)
    // ========================================================
    async mockRequest(endpoint, options) {
      console.log(`🔧 Mock API: ${options.method || 'GET'} ${endpoint}`);
      
      // Simula delay de rede
      await this.delay(300);

      const { method = 'GET', body } = options;
      const data = body ? JSON.parse(body) : {};

      // ===== AUTH ENDPOINTS =====
      if (endpoint === '/auth/login') {
        return this.mockLogin(data);
      }

      if (endpoint === '/auth/register') {
        return this.mockRegister(data);
      }

      if (endpoint === '/auth/logout') {
        this.clearToken();
        return { success: true, message: 'Logout realizado' };
      }

      if (endpoint === '/auth/recover') {
        return this.mockRecover(data);
      }

      // ===== USER ENDPOINTS =====
      if (endpoint === '/users/profile') {
        return this.mockGetProfile();
      }

      if (endpoint === '/users/update' && method === 'PUT') {
        return this.mockUpdateProfile(data);
      }

      // ===== TRANSACTION ENDPOINTS =====
      if (endpoint === '/transactions/deposits') {
        return this.mockGetDeposits();
      }

      if (endpoint === '/transactions/withdraws') {
        return this.mockGetWithdraws();
      }

      if (endpoint === '/transactions/deposit' && method === 'POST') {
        return this.mockCreateDeposit(data);
      }

      if (endpoint === '/transactions/withdraw' && method === 'POST') {
        return this.mockCreateWithdraw(data);
      }

      // ===== NETWORK ENDPOINTS =====
      if (endpoint === '/network/team') {
        return this.mockGetTeam();
      }

      // Endpoint não encontrado
      throw new APIError('Endpoint não implementado', 404);
    }

    // ========================================================
    // MOCK METHODS (Simulação de backend)
    // ========================================================
    async mockLogin({ email, password }) {
      const users = JSON.parse(localStorage.getItem('summit_users') || '[]');
      
      // Simula hash (em produção seria no servidor)
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        throw new APIError('Credenciais inválidas', 401);
      }

      // Gera token fake (em produção seria JWT do servidor)
      const token = 'mock_token_' + Date.now();
      this.setToken(token);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nivel: user.nivel,
          saldo: user.saldo,
          refCode: user.refCode
        }
      };
    }

    async mockRegister({ username, email, password, refCode }) {
      const users = JSON.parse(localStorage.getItem('summit_users') || '[]');

      // Verifica duplicatas
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new APIError('E-mail já cadastrado', 400);
      }

      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new APIError('Nome de usuário já existe', 400);
      }

      // Cria novo usuário
      const newUser = {
        id: 'user_' + Date.now(),
        username,
        email,
        password: 'hashed_' + password, // Mock hash
        refCode: this.generateRefCode(username),
        indicadoPor: refCode || null,
        nivel: 'Cristal',
        saldo: 0,
        comissoes: 0,
        dataCadastro: new Date().toISOString(),
        ativo: true
      };

      users.push(newUser);
      localStorage.setItem('summit_users', JSON.stringify(users));

      const token = 'mock_token_' + Date.now();
      this.setToken(token);

      return {
        success: true,
        message: 'Cadastro realizado com sucesso',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          nivel: newUser.nivel,
          refCode: newUser.refCode
        }
      };
    }

    async mockRecover({ email, newPassword }) {
      const users = JSON.parse(localStorage.getItem('summit_users') || '[]');
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        throw new APIError('E-mail não encontrado', 404);
      }

      users[userIndex].password = 'hashed_' + newPassword;
      localStorage.setItem('summit_users', JSON.stringify(users));

      return {
        success: true,
        message: 'Senha redefinida com sucesso'
      };
    }

    async mockGetProfile() {
      const session = JSON.parse(localStorage.getItem('summit_session') || '{}');
      
      if (!session.id) {
        throw new APIError('Não autenticado', 401);
      }

      const users = JSON.parse(localStorage.getItem('summit_users') || '[]');
      const user = users.find(u => u.id === session.id);

      if (!user) {
        throw new APIError('Usuário não encontrado', 404);
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nivel: user.nivel,
          saldo: user.saldo,
          comissoes: user.comissoes,
          refCode: user.refCode,
          dataCadastro: user.dataCadastro
        }
      };
    }

    async mockUpdateProfile(data) {
      const session = JSON.parse(localStorage.getItem('summit_session') || '{}');
      const users = JSON.parse(localStorage.getItem('summit_users') || '[]');
      const userIndex = users.findIndex(u => u.id === session.id);

      if (userIndex === -1) {
        throw new APIError('Usuário não encontrado', 404);
      }

      // Atualiza campos permitidos
      const allowed = ['username', 'email'];
      allowed.forEach(key => {
        if (data[key]) users[userIndex][key] = data[key];
      });

      localStorage.setItem('summit_users', JSON.stringify(users));

      return {
        success: true,
        message: 'Perfil atualizado',
        user: users[userIndex]
      };
    }

    async mockGetDeposits() {
      return {
        success: true,
        deposits: [
          { id: 1, plano: 'Ouro', valor: 10000, status: 'aprovado', data: '2025-09-15' },
          { id: 2, plano: 'Platina', valor: 25000, status: 'aprovado', data: '2025-08-20' }
        ]
      };
    }

    async mockGetWithdraws() {
      return {
        success: true,
        withdraws: [
          { id: 1, valor: 800, status: 'pendente', data: '2025-09-28' },
          { id: 2, valor: 500, status: 'pago', data: '2025-09-20' }
        ]
      };
    }

    async mockCreateDeposit(data) {
      return {
        success: true,
        message: 'Depósito enviado para análise',
        deposit: { id: Date.now(), ...data, status: 'pendente' }
      };
    }

    async mockCreateWithdraw(data) {
      return {
        success: true,
        message: 'Saque solicitado com sucesso',
        withdraw: { id: Date.now(), ...data, status: 'pendente' }
      };
    }

    async mockGetTeam() {
      return {
        success: true,
        team: {
          diretos: 10,
          total: 54,
          ativos: 44,
          inativos: 10,
          volume: 1250000
        }
      };
    }

    // ========================================================
    // UTILITÁRIOS
    // ========================================================
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateRefCode(username) {
      const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return base + random;
    }

    // ========================================================
    // API PÚBLICA (Métodos convenientes)
    // ========================================================

    // Auth
    async login(email, password) {
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    }

    async register(username, email, password, refCode) {
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, refCode })
      });
    }

    async logout() {
      const result = await this.request('/auth/logout', { method: 'POST' });
      this.clearToken();
      return result;
    }

    async recoverPassword(email, newPassword) {
      return this.request('/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword })
      });
    }

    // Users
    async getProfile() {
      return this.request('/users/profile');
    }

    async updateProfile(data) {
      return this.request('/users/update', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }

    // Transactions
    async getDeposits() {
      return this.request('/transactions/deposits');
    }

    async getWithdraws() {
      return this.request('/transactions/withdraws');
    }

    async createDeposit(data) {
      return this.request('/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }

    async createWithdraw(data) {
      return this.request('/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }

    // Network
    async getTeam() {
      return this.request('/network/team');
    }
  }

  // ========================================================
  // CLASSE DE ERRO CUSTOMIZADA
  // ========================================================
  class APIError extends Error {
    constructor(message, statusCode = 500, details = {}) {
      super(message);
      this.name = 'APIError';
      this.statusCode = statusCode;
      this.details = details;
    }
  }

  // ========================================================
  // EXPORTAÇÃO GLOBAL
  // ========================================================
  window.SummitAPI = SummitAPI;
  window.APIError = APIError;

  // Instância global (conveniência)
  window.api = new SummitAPI();

  console.log('✅ Summit API Layer carregada');

})();