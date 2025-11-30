// ========================================================
// SUMMIT GLOBAL INVEST - Sistema de Autenticação v3.0
// Arquivo: cliente/js/auth.js
// Descrição: Sistema completo integrado com api.js
// ========================================================

(function() {
  'use strict';

  // ========================================================
  // VERIFICAÇÃO DE DEPENDÊNCIAS
  // ========================================================
  if (typeof window.CONFIG === 'undefined') {
    console.error('❌ ERRO: config.js não foi carregado!');
    throw new Error('config.js é obrigatório. Adicione <script src="js/config.js"></script> antes de auth.js');
  }

  if (typeof window.api === 'undefined') {
    console.error('❌ ERRO: api.js não foi carregado!');
    throw new Error('api.js é obrigatório. Adicione <script src="cliente/js/api.js"></script> antes de auth.js');
  }

  // ========================================================
  // CONFIGURAÇÃO
  // ========================================================
  const AUTH_CONFIG = CONFIG.auth;
  const STORAGE = CONFIG.storage;

  // ========================================================
  // RATE LIMITING
  // ========================================================
  const loginAttempts = {};

  function checkRateLimit(identifier) {
    const now = Date.now();
    const key = identifier.toLowerCase();

    if (!loginAttempts[key]) {
      loginAttempts[key] = [];
    }

    // Remove tentativas antigas
    loginAttempts[key] = loginAttempts[key].filter(
      time => now - time < AUTH_CONFIG.attemptWindow
    );

    // Verifica se excedeu o limite
    if (loginAttempts[key].length >= AUTH_CONFIG.maxLoginAttempts) {
      const oldestAttempt = Math.min(...loginAttempts[key]);
      const waitTime = Math.ceil((AUTH_CONFIG.attemptWindow - (now - oldestAttempt)) / 60000);
      
      return {
        blocked: true,
        msg: `⚠️ Muitas tentativas. Aguarde ${waitTime} minutos.`
      };
    }

    // Registra nova tentativa
    loginAttempts[key].push(now);
    return { blocked: false };
  }

  function clearRateLimit(identifier) {
    const key = identifier.toLowerCase();
    delete loginAttempts[key];
  }

  // ========================================================
  // GERENCIAMENTO DE SESSÃO
  // ========================================================
  
  /**
   * Retorna a sessão atual do localStorage
   */
  function getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE.session);
      if (!data) return null;

      const session = JSON.parse(data);

      // Validação de integridade
      if (!session.id || !session.username) {
        console.warn('⚠️ Sessão corrompida');
        clearSession();
        return null;
      }

      // Verifica expiração
      if (session.expiry && Date.now() > session.expiry) {
        console.warn('⚠️ Sessão expirada');
        clearSession();
        return null;
      }

      // Validação adicional: verifica se usuário ainda existe
      if (CONFIG.isDevelopment) {
        const users = getUsers();
        const userExists = users.find(u => u.id === session.id);
        
        if (!userExists) {
          console.warn('⚠️ Usuário não existe mais no sistema');
          clearSession();
          return null;
        }

        if (!userExists.ativo) {
          console.warn('⚠️ Conta desativada');
          clearSession();
          return null;
        }
      }

      return session;

    } catch (error) {
      console.error('❌ Erro ao ler sessão:', error);
      clearSession();
      return null;
    }
  }

  /**
   * Salva sessão no localStorage
   */
  function saveSession(user, keepConnected = false) {
    try {
      // Remove senha da sessão (segurança)
      const { password, ...safeUser } = user;

      // Define tempo de expiração
      const expiry = keepConnected
        ? Date.now() + AUTH_CONFIG.sessionTimeoutRemember
        : Date.now() + AUTH_CONFIG.sessionTimeout;

      const sessionData = {
        ...safeUser,
        expiry,
        keepConnected,
        lastActivity: Date.now()
      };

      localStorage.setItem(STORAGE.session, JSON.stringify(sessionData));
      CONFIG.log('info', `Sessão salva para: ${user.username}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      return false;
    }
  }

  /**
   * Limpa sessão atual
   */
  function clearSession() {
    localStorage.removeItem(STORAGE.session);
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    sessionStorage.clear();
    CONFIG.log('info', '🔓 Sessão limpa');
  }

  /**
   * Atualiza timestamp de última atividade
   */
  function updateSessionActivity() {
    try {
      const session = getCurrentUser();
      if (session) {
        session.lastActivity = Date.now();
        localStorage.setItem(STORAGE.session, JSON.stringify(session));
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar atividade:', error);
    }
  }

  // ========================================================
  // SANITIZAÇÃO E VALIDAÇÃO
  // ========================================================
  
  function sanitizeInput(input) {
    if (!input) return '';
    return input
      .toString()
      .trim()
      .replace(/[<>"'\\]/g, '')
      .substring(0, 100);
  }

  function validateEmail(email) {
    return CONFIG.validation.email.pattern.test(email);
  }

  function validatePassword(password) {
    return CONFIG.validate('password', password);
  }

  function validateUsername(username) {
    return CONFIG.validate('username', username);
  }

  // ========================================================
  // FUNÇÕES DE USUÁRIO (MOCK - APENAS DESENVOLVIMENTO)
  // ========================================================
  
  function getUsers() {
    if (!CONFIG.isDevelopment) return [];
    
    try {
      const data = localStorage.getItem(STORAGE.users);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao ler usuários:', error);
      return [];
    }
  }

  function saveUsers(users) {
    if (!CONFIG.isDevelopment) return false;
    
    try {
      localStorage.setItem(STORAGE.users, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar usuários:', error);
      return false;
    }
  }

  // ========================================================
  // REGISTRO DE USUÁRIO
  // ========================================================
  
  async function registerUser(username, email, password, refCode = null) {
    CONFIG.log('info', '📝 Iniciando registro...');

    // Sanitização
    username = sanitizeInput(username);
    email = sanitizeInput(email);
    refCode = refCode ? sanitizeInput(refCode) : null;

    // Validações
    if (!username || !email || !password) {
      return { ok: false, msg: '⚠️ Preencha todos os campos obrigatórios' };
    }

    if (!validateEmail(email)) {
      return { ok: false, msg: '⚠️ E-mail inválido' };
    }

    const vUser = validateUsername(username);
    if (!vUser.valid) {
      return { ok: false, msg: vUser.message };
    }

    const vPass = validatePassword(password);
    if (!vPass.valid) {
      return { ok: false, msg: vPass.message };
    }

    // Valida indicação (obrigatória exceto para gato_mestre)
    if (username.toLowerCase() !== 'gato_mestre' && !refCode) {
      return { ok: false, msg: '⚠️ É necessário um código de indicação' };
    }

    try {
      // Chama API
      const result = await window.api.register(username, email, password, refCode);

      if (result.success) {
        // Salva token e sessão
        if (result.token) {
          localStorage.setItem(AUTH_CONFIG.tokenKey, result.token);
        }
        
        saveSession(result.user, false);
        clearRateLimit(email);
        
        CONFIG.log('info', `✅ Usuário registrado: ${username}`);
        
        return {
          ok: true,
          msg: '✅ Cadastro realizado com sucesso!',
          user: result.user
        };
      }

      return { ok: false, msg: result.message || 'Erro ao registrar' };

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      
      // Em desenvolvimento, pode continuar usando localStorage como fallback
      if (CONFIG.isDevelopment && error.statusCode === 404) {
        return registerUserLocal(username, email, password, refCode);
      }
      
      return { ok: false, msg: error.message || 'Erro ao processar cadastro' };
    }
  }

  // Fallback para desenvolvimento (quando backend não existe)
  async function registerUserLocal(username, email, password, refCode) {
    const users = getUsers();

    // Verifica duplicatas
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, msg: '⚠️ Este e-mail já está cadastrado' };
    }

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, msg: '⚠️ Este nome de usuário já existe' };
    }

    // Hash simples (em produção será no servidor)
    const hashedPassword = btoa(password + 'SUMMIT_SALT');

    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      username,
      email,
      password: hashedPassword,
      refCode: generateRefCode(username),
      indicadoPor: refCode || null,
      nivel: 'Cristal',
      saldo: 0,
      comissoes: 0,
      dataCadastro: new Date().toISOString(),
      emailVerificado: false,
      ativo: true,
      ultimoLogin: null
    };

    users.push(newUser);
    saveUsers(users);

    saveSession(newUser, false);

    CONFIG.log('info', `✅ Usuário registrado (LOCAL): ${username}`);

    return {
      ok: true,
      msg: '✅ Cadastro realizado com sucesso!',
      user: newUser
    };
  }

  function generateRefCode(username) {
    const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return base + random;
  }

  // ========================================================
  // LOGIN
  // ========================================================
  
  async function loginUser(identifier, password, keepConnected = false) {
    CONFIG.log('info', '🔐 Tentativa de login...');

    // Sanitização
    identifier = sanitizeInput(identifier);

    // Validação básica
    if (!identifier || !password) {
      return { ok: false, msg: '⚠️ Preencha todos os campos' };
    }

    // Rate limiting
    const rateCheck = checkRateLimit(identifier);
    if (rateCheck.blocked) {
      CONFIG.log('warn', '⚠️ Rate limit atingido:', identifier);
      return { ok: false, msg: rateCheck.msg };
    }

    try {
      // Chama API
      const result = await window.api.login(identifier, password);

      if (result.success) {
        // Salva token e sessão
        if (result.token) {
          localStorage.setItem(AUTH_CONFIG.tokenKey, result.token);
        }

        // Atualiza último login (mock local)
        if (CONFIG.isDevelopment) {
          const users = getUsers();
          const userIndex = users.findIndex(u => 
            u.email.toLowerCase() === identifier.toLowerCase() ||
            u.username.toLowerCase() === identifier.toLowerCase()
          );
          if (userIndex !== -1) {
            users[userIndex].ultimoLogin = new Date().toISOString();
            saveUsers(users);
          }
        }

        saveSession(result.user, keepConnected);
        clearRateLimit(identifier);

        CONFIG.log('info', `✅ Login bem-sucedido: ${result.user.username}`);

        return {
          ok: true,
          msg: '✅ Login efetuado com sucesso!',
          user: result.user
        };
      }

      return { ok: false, msg: result.message || 'Credenciais inválidas' };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      // Fallback para desenvolvimento
      if (CONFIG.isDevelopment && error.statusCode === 404) {
        return loginUserLocal(identifier, password, keepConnected);
      }

      return { ok: false, msg: error.message || 'Erro ao processar login' };
    }
  }

  // Fallback local
  async function loginUserLocal(identifier, password, keepConnected) {
    const users = getUsers();
    const hashedPassword = btoa(password + 'SUMMIT_SALT');

    const user = users.find(u =>
      (u.email.toLowerCase() === identifier.toLowerCase() ||
       u.username.toLowerCase() === identifier.toLowerCase()) &&
      u.password === hashedPassword
    );

    if (!user) {
      return { ok: false, msg: '⚠️ Usuário ou senha incorretos' };
    }

    if (!user.ativo) {
      return { ok: false, msg: '⚠️ Conta desativada. Contate o suporte.' };
    }

    clearRateLimit(identifier);

    user.ultimoLogin = new Date().toISOString();
    saveUsers(users);
    saveSession(user, keepConnected);

    CONFIG.log('info', `✅ Login bem-sucedido (LOCAL): ${user.username}`);

    return {
      ok: true,
      msg: '✅ Login efetuado com sucesso!',
      user
    };
  }

  // ========================================================
  // LOGOUT
  // ========================================================
  
  async function logoutUser() {
    CONFIG.log('info', '🚪 Logout...');

    try {
      // Tenta chamar API para invalidar token no servidor
      if (!CONFIG.isDevelopment) {
        await window.api.logout().catch(() => {
          // Ignora erro - continua logout local
        });
      }
    } finally {
      clearSession();
      window.location.href = CONFIG.getURL('/login.html');
    }
  }

  // ========================================================
  // RECUPERAÇÃO DE SENHA
  // ========================================================
  
  async function recoverPassword(email, newPassword) {
    CONFIG.log('info', '🔄 Recuperação de senha...');

    email = sanitizeInput(email);

    if (!validateEmail(email)) {
      return { ok: false, msg: '⚠️ E-mail inválido' };
    }

    const vPass = validatePassword(newPassword);
    if (!vPass.valid) {
      return { ok: false, msg: vPass.message };
    }

    try {
      const result = await window.api.recoverPassword(email, newPassword);

      if (result.success) {
        CONFIG.log('info', '✅ Senha recuperada');
        return { ok: true, msg: '✅ Senha redefinida com sucesso!' };
      }

      return { ok: false, msg: result.message || 'Erro ao recuperar senha' };

    } catch (error) {
      console.error('❌ Erro na recuperação:', error);

      // Fallback local
      if (CONFIG.isDevelopment && error.statusCode === 404) {
        return recoverPasswordLocal(email, newPassword);
      }

      return { ok: false, msg: error.message || 'Erro ao processar recuperação' };
    }
  }

  // Fallback local
  async function recoverPasswordLocal(email, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return { ok: false, msg: '⚠️ E-mail não encontrado' };
    }

    users[userIndex].password = btoa(newPassword + 'SUMMIT_SALT');
    saveUsers(users);

    CONFIG.log('info', `✅ Senha recuperada (LOCAL): ${users[userIndex].username}`);

    return { ok: true, msg: '✅ Senha redefinida com sucesso!' };
  }

  // ========================================================
  // ALTERAÇÃO DE SENHA
  // ========================================================
  
  async function changePassword(currentPassword, newPassword) {
    CONFIG.log('info', '🔑 Alterando senha...');

    const session = getCurrentUser();
    if (!session) {
      return { ok: false, msg: '⚠️ Sessão inválida' };
    }

    const vPass = validatePassword(newPassword);
    if (!vPass.valid) {
      return { ok: false, msg: vPass.message };
    }

    try {
      // Em produção, enviaria currentPassword para validação no servidor
      const result = await window.api.request('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (result.success) {
        CONFIG.log('info', '✅ Senha alterada');
        return { ok: true, msg: '✅ Senha alterada com sucesso' };
      }

      return { ok: false, msg: result.message || 'Erro ao alterar senha' };

    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);

      // Fallback local
      if (CONFIG.isDevelopment) {
        return changePasswordLocal(session.id, currentPassword, newPassword);
      }

      return { ok: false, msg: error.message || 'Erro ao processar alteração' };
    }
  }

  // Fallback local
  function changePasswordLocal(userId, currentPassword, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { ok: false, msg: '⚠️ Usuário não encontrado' };
    }

    const currentHashed = btoa(currentPassword + 'SUMMIT_SALT');
    if (users[userIndex].password !== currentHashed) {
      return { ok: false, msg: '⚠️ Senha atual incorreta' };
    }

    users[userIndex].password = btoa(newPassword + 'SUMMIT_SALT');
    saveUsers(users);

    CONFIG.log('info', '✅ Senha alterada (LOCAL)');
    return { ok: true, msg: '✅ Senha alterada com sucesso' };
  }

  // ========================================================
  // ATUALIZAÇÃO DE PERFIL
  // ========================================================
  
  async function updateUser(updates) {
    CONFIG.log('info', '✏️ Atualizando perfil...');

    const session = getCurrentUser();
    if (!session) {
      return { ok: false, msg: '⚠️ Sessão inválida' };
    }

    try {
      const result = await window.api.updateProfile(updates);

      if (result.success) {
        // Atualiza sessão local
        const updatedUser = { ...session, ...result.user };
        saveSession(updatedUser, session.keepConnected);

        CONFIG.log('info', '✅ Perfil atualizado');
        return { ok: true, msg: '✅ Dados atualizados com sucesso', user: result.user };
      }

      return { ok: false, msg: result.message || 'Erro ao atualizar' };

    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);

      // Fallback local
      if (CONFIG.isDevelopment) {
        return updateUserLocal(session.id, updates);
      }

      return { ok: false, msg: error.message || 'Erro ao processar atualização' };
    }
  }

  // Fallback local
  function updateUserLocal(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) {
      return { ok: false, msg: '⚠️ Usuário não encontrado' };
    }

    // Campos permitidos
    const allowed = ['username', 'email', 'phone', 'country', 'city'];
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        users[index][key] = updates[key];
      }
    }

    saveUsers(users);

    // Atualiza sessão
    const session = getCurrentUser();
    if (session && session.id === userId) {
      saveSession(users[index], session.keepConnected);
    }

    CONFIG.log('info', '✅ Perfil atualizado (LOCAL)');
    return { ok: true, msg: '✅ Dados atualizados com sucesso', user: users[index] };
  }

  // ========================================================
  // PROTEÇÃO DE PÁGINAS
  // ========================================================
  
  function requireLogin() {
    const user = getCurrentUser();
    
    if (!user) {
      CONFIG.log('warn', '⚠️ Acesso negado - sem autenticação');
      alert('⚠️ Você precisa fazer login primeiro!');
      window.location.href = CONFIG.getURL('/login.html');
      return false;
    }

    CONFIG.log('info', `✅ Acesso autorizado: ${user.username}`);
    return true;
  }

  // ========================================================
  // UTILITÁRIOS
  // ========================================================
  
  function getUserByUsername(username) {
    if (!CONFIG.isDevelopment) return null;
    
    const users = getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  function getIndicacoes(username) {
    if (!CONFIG.isDevelopment) return [];
    
    const users = getUsers();
    return users.filter(u => u.indicadoPor === username);
  }

  function getNivelIcon(nivel) {
    const icons = {
      "Cristal": "img/ranks/cristal.svg",
      "Jade": "img/ranks/jade.svg",
      "Pérola": "img/ranks/perola.svg",
      "Safira": "img/ranks/safira.svg",
      "Esmeralda": "img/ranks/esmeralda.svg",
      "Rubi": "img/ranks/rubi.svg",
      "Diamante": "img/ranks/diamante.svg",
      "Diamante Azul": "img/ranks/diamante-azul.svg",
      "Diamante Verde": "img/ranks/diamante-verde.svg",
      "Diamante Roxo": "img/ranks/diamante-roxo.svg",
      "Diamante Vermelho": "img/ranks/diamante-vermelho.svg",
      "Diamante Platina": "img/ranks/diamante-platina.svg",
      "Diamante Negro": "img/ranks/diamante-negro.svg",
      "Diamante Negro Duplo": "img/ranks/diamante-negro-duplo.svg",
      "Diamante Negro Triplo": "img/ranks/diamante-negro-triplo.svg"
    };
    return icons[nivel] || "img/ranks/cristal.svg";
  }

  // ========================================================
  // USUÁRIO MESTRE (DESENVOLVIMENTO)
  // ========================================================
  
  async function ensureMasterUser() {
    if (!CONFIG.isDevelopment) return;

    const users = getUsers();

    if (users.find(u => u.username.toLowerCase() === 'gato_mestre')) {
      return;
    }

    CONFIG.log('info', '👑 Criando usuário mestre...');

    const masterPassword = btoa('123456' + 'SUMMIT_SALT');

    users.push({
      id: 'gato_mestre_id',
      username: 'gato_mestre',
      email: 'gatomestre@summitglobal.com',
      password: masterPassword,
      refCode: 'MASTER2025',
      indicadoPor: null,
      nivel: 'Diamante Negro Triplo',
      saldo: 999999,
      comissoes: 0,
      ativo: true,
      dataCadastro: new Date().toISOString(),
      ultimoLogin: null
    });

    saveUsers(users);

    CONFIG.log('info', '✅ Usuário mestre criado');
    CONFIG.log('info', ' Username: gato_mestre');
    CONFIG.log('info', ' Senha: 123456');
  }

  // ========================================================
  // MONITORAMENTO DE ATIVIDADE
  // ========================================================
  
  setInterval(() => {
    const session = getCurrentUser();
    
    if (session && !session.keepConnected) {
      const inactiveTime = Date.now() - (session.lastActivity || 0);
      const maxInactivity = 30 * 60 * 1000; // 30 minutos

      if (inactiveTime > maxInactivity) {
        CONFIG.log('warn', '⚠️ Sessão expirada por inatividade');
        clearSession();
        
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('cliente')) {
          alert('⚠️ Sua sessão expirou por inatividade. Faça login novamente.');
          window.location.href = CONFIG.getURL('/login.html');
        }
      }
    }
  }, 60000); // Verifica a cada 1 minuto

  // Atualiza atividade em interações
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
      updateSessionActivity();
    }, { passive: true });
  });

  // ========================================================
  // INICIALIZAÇÃO
  // ========================================================
  
  (async function init() {
    await ensureMasterUser();
    CONFIG.log('info', '🔐 Sistema de Autenticação v3.0 carregado');
    CONFIG.log('info', `🌐 Modo: ${CONFIG.environment}`);
    CONFIG.log('info', `📡 API: ${CONFIG.apiURL}`);
  })();

  // ========================================================
  // EXPORTAÇÃO GLOBAL
  // ========================================================
  
  window.AUTH = {
    // Core
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    recover: recoverPassword,
    changePassword: changePassword,
    updateUser: updateUser,
    
    // Session
    getCurrentUser,
    requireLogin,
    clearSession,
    updateSessionActivity,
    
    // Utils
    getNivelIcon,
    getIndicacoes,
    getUserByUsername,
    
    // Validation
    validateEmail,
    validatePassword,
    validateUsername,
    sanitizeInput
  };

  // Backward compatibility
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.logoutUser = logoutUser;
  window.getCurrentUser = getCurrentUser;
  window.recoverPassword = recoverPassword;
  window.changePassword = changePassword;
  window.updateUser = updateUser;
  window.requireLogin = requireLogin;
  window.getNivelIcon = getNivelIcon;
  window.getIndicacoes = getIndicacoes;
  window.getUserByUsername = getUserByUsername;
  window.clearSession = clearSession;

  console.log('✅ Summit Auth v3.0 carregado');

})();