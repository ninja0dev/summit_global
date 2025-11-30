````markdown
```markdown
# Summit Global — Backend (scaffold)

Este diretório é um scaffold inicial para o backend da plataforma. Objetivos:
- Fornecer endpoints REST para autenticação, depósitos e saques (modo de teste).
- Implementar lógica de cálculo de rendimentos, teto e multiplicador em jobs (a serem adicionados).
- Integrar com provedor de custódia/sandbox para USDT (modo MOCK inicialmente).

Atenção: este scaffold é para ambiente de desenvolvimento/testes. Antes de rodar em produção:
1. Revisão jurídica (KYC/AML).
2. Auditoria de segurança.
3. Uso de provedores de custódia confiáveis e segregação de chaves.

Como rodar (local):
1. Copie `.env.example` para `.env` e preencha valores.
2. npm install
3. npm run migrate
4. npm run dev

Endpoints iniciais:
- GET /health
- POST /auth/register { name, email, password, referrer }
- POST /auth/login { email, password } -> { token }
- GET /auth/me (Authorization: Bearer <token>)
- POST /deposits/create (mock)
- GET /deposits/my
- POST /withdrawals/request

Notas:
- Fluxos de depósitos/saques com USDT devem passar por provedores custódia ou integração on-chain. Este scaffold usa armazenamento em arquivo JSON para desenvolvimento apenas.
```
````