# Nexo — Sistema de Acompanhamento Acadêmico e Profissional

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)

Sistema web para acompanhamento acadêmico e profissional de estudantes — gerencia cadastros, encaminhamentos para empresas, questionários de avaliação, agenda de visitas e geração de relatórios em PDF.

---

## Documentação

- 📘 **Manual do Usuário (HTML com screenshots):** abra [docs/manual/index.html](docs/manual/index.html) localmente, ou publique via GitHub Pages (instruções abaixo).
- 📄 Documentação técnica/acadêmica: [docs/Nexo-Documentacao.md](docs/Nexo-Documentacao.md).

### Publicar o manual no GitHub Pages

1. No GitHub, vá em **Settings → Pages**.
2. Em **Source**, selecione *Deploy from a branch*.
3. Branch: `main` · Folder: `/docs` · clique em **Save**.
4. Após alguns segundos, o manual estará em
   `https://<usuário>.github.io/<repositório>/` (redireciona para `manual/index.html`).

### Regenerar os screenshots do manual

```bash
cd frontend
bun install                  # se ainda não fez
bun run manual:capture       # sobe backend + frontend + docker + roda Playwright
```

As imagens são gravadas em `docs/manual/assets/images/`. Veja
[frontend/e2e/manual/capture.spec.ts](frontend/e2e/manual/capture.spec.ts).

---

## Funcionalidades

- **Gestão de estudantes** — cadastro completo com histórico de encaminhamentos
- **Gestão de empresas** — cadastro de empresas parceiras e vínculos com estudantes
- **Gestão de funcionários** — controle de equipe interna com funções/cargos
- **Questionários dinâmicos** — criação visual de formulários com múltiplos tipos de campo
- **Respostas e acompanhamentos** — coleta e visualização de respostas por estudante
- **Encaminhamentos** — registro de admissões e desligamentos de estudantes em empresas
- **Agenda** — calendário de eventos com visitas a alunos, empresas ou eventos genéricos
- **Relatórios PDF** — geração de relatórios de alunos, empresas, funcionários e questionários
- **Dashboard analítico** — indicadores de colocação, gráficos de tendência e atividades recentes
- **Recuperação de senha** — fluxo de reset por e-mail com SMTP configurável
- **PWA / Mobile** — suporte a Progressive Web App via Capacitor

---

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| [NestJS](https://nestjs.com) | 11 | Framework principal da API |
| [Bun](https://bun.sh) | latest | Runtime JavaScript |
| [TypeORM](https://typeorm.io) | 0.3 | ORM para PostgreSQL |
| [PostgreSQL](https://postgresql.org) | 17 | Banco de dados relacional |
| [Passport / JWT](https://www.passportjs.org) | — | Autenticação e autorização |
| [PDFKit](https://pdfkit.org) | 0.18 | Geração de relatórios PDF |
| [Nodemailer](https://nodemailer.com) | 7 | Envio de e-mails |
| [Swagger](https://swagger.io) | — | Documentação da API |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 6 | Hash de senhas |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| [React](https://react.dev) | 19 | UI framework |
| [Vite](https://vite.dev) | 7 | Build tool |
| [TypeScript](https://typescriptlang.org) | 5.8 | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Estilização |
| [React Router DOM](https://reactrouter.com) | 7 | Roteamento |
| [Redux Toolkit + Persist](https://redux-toolkit.js.org) | 2 | Estado global e persistência |
| [TanStack React Query](https://tanstack.com/query) | 5 | Cache e fetching de dados |
| [Axios](https://axios-http.com) | 1.11 | Cliente HTTP |
| [Recharts](https://recharts.org) | 3 | Gráficos e visualizações |
| [FullCalendar](https://fullcalendar.io) | 6 | Calendário interativo |
| [Lucide React](https://lucide.dev) | 0.540 | Ícones |
| [Capacitor](https://capacitorjs.com) | 8 | Suporte mobile / PWA |

---

## Pré-requisitos

- [Docker](https://www.docker.com) e Docker Compose (recomendado)
- [Bun](https://bun.sh) ≥ 1.x — **runtime e gerenciador de pacotes oficial do projeto** (não use `npm`/`yarn`; `bun.lock` é o lockfile canônico)
- [Git](https://git-scm.com)

---

## Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd nexo
```

### 2. Configure as variáveis de ambiente do backend

```bash
cd backend
cp _.env .env
```

Edite o `.env` com os valores do seu ambiente (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 3. Configure a URL da API no frontend

```bash
cd frontend
```

Crie um arquivo `.env` ou edite `vite.config.ts` para apontar para o backend:

```env
VITE_API_URL=http://localhost:3000
```

---

## Executando o Projeto

### Opção A: Docker Compose (recomendado)

Sobe o banco de dados PostgreSQL, o servidor de e-mail Mailpit e o backend de uma vez:

```bash
cd backend
docker compose up -d
```

Em seguida, inicie o frontend separadamente:

```bash
cd frontend
bun install
bun run dev
```

Acesse em: **http://localhost:5173**

---

### Opção B: Execução Local

**Backend:**

```bash
cd backend
bun install
bun run start:dev
```

A API ficará disponível em: **http://localhost:3000**

**Frontend:**

```bash
cd frontend
bun install
bun run dev
```

> Certifique-se de que o PostgreSQL está rodando e acessível com as credenciais configuradas no `.env`.

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente de execução |
| `PORT` | `3000` | Porta da API |
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USERNAME` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `DB_NAME` | `nexo_db` | Nome do banco de dados |
| `JWT_SECRET` | — | Chave secreta do JWT (**obrigatório alterar**) |
| `JWT_EXPIRES_IN` | `7d` | Expiração do token JWT |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend (CORS) |
| `SMTP_HOST` | `mailpit` | Host do servidor SMTP |
| `SMTP_PORT` | `1025` | Porta do servidor SMTP |
| `SMTP_USER` | — | Usuário SMTP (opcional) |
| `SMTP_PASSWORD` | — | Senha SMTP (opcional) |
| `SMTP_FROM` | `noreply@localhost` | Remetente padrão dos e-mails |
| `RUN_SEEDERS` | `false` | Executar seeders na inicialização |

### Frontend (`frontend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | URL base da API |

---

## Scripts Disponíveis

### Backend

```bash
bun install              # Instala dependências (usa bun.lock)
bun run start:dev        # Inicia em modo desenvolvimento (watch)
bun run build            # Compila para produção
bun run start:prod       # Inicia a build de produção
bun run lint             # ESLint --fix
bun run test             # Executa os testes unitários (Jest)
bun run test:watch       # Jest em modo watch
bun run test:cov         # Testes com relatório de cobertura (meta: ≥ 90%)
bun run test:e2e         # Testes end-to-end
bun run seed             # Popula o banco com dados iniciais
bun run migrate:fresh    # Recria todas as tabelas (destrói dados)
```

### Frontend

```bash
bun install              # Instala dependências (usa bun.lock)
bun run dev              # Servidor de desenvolvimento (Vite)
bun run build            # Build de produção
bun run preview          # Pré-visualiza o build de produção
bun run lint             # Verifica o código com ESLint
bun run test             # Testes unitários/integração (Vitest)
bun run test:watch       # Vitest em modo watch
bun run test:cov         # Testes com relatório de cobertura (meta: ≥ 90%)
bun run e2e              # Testes end-to-end (Playwright)
bun run e2e:ui           # Playwright em modo UI
bun run generate-pwa-assets  # Gera ícones para PWA
```

---

## Estrutura do Projeto

```
nexo/
├── backend/
│   ├── src/
│   │   ├── auth/                   # Autenticação JWT, login, reset de senha
│   │   ├── employees/              # Gestão de funcionários
│   │   ├── students/               # Gestão de estudantes
│   │   ├── companies/              # Gestão de empresas
│   │   ├── functions/              # Cargos e funções
│   │   ├── questionnaires/         # Templates de questionários
│   │   ├── questions/              # Perguntas dos questionários
│   │   ├── questionnaire-responses/ # Respostas dos estudantes
│   │   ├── referrals/              # Encaminhamentos para empresas
│   │   ├── events/                 # Agenda e eventos
│   │   ├── reports/                # Geração de PDFs
│   │   ├── smtp-config/            # Configuração de e-mail
│   │   ├── database/               # Seeders e migrations
│   │   └── app.module.ts           # Módulo raiz
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── _.env                       # Exemplo de variáveis de ambiente
│
└── frontend/
    ├── src/
    │   ├── components/             # Componentes reutilizáveis (Modal, DataTable, etc.)
    │   │   ├── forms/              # Formulários por domínio
    │   │   ├── inputs/             # Inputs de baixo nível
    │   │   └── dashboard/          # Gráficos e cards do dashboard
    │   ├── pages/
    │   │   ├── cadastros/          # CRUD de alunos, empresas, funcionários, questionários
    │   │   ├── acompanhamentos/    # Respostas de questionários
    │   │   ├── agenda/             # Calendário de eventos
    │   │   └── Dashboard.tsx       # Página inicial com indicadores
    │   ├── hooks/                  # Custom hooks de dados (useStudents, useEvents, etc.)
    │   ├── services/
    │   │   └── api.ts              # Cliente Axios centralizado
    │   ├── store/
    │   │   └── authSlice.ts        # Estado de autenticação (Redux)
    │   └── types/                  # Definições TypeScript
    └── vite.config.ts
```

---

## Documentação da API

Com o backend rodando, acesse a documentação interativa via Swagger:

```
http://localhost:3000/api
```

---

## Serviços Docker

| Serviço | Porta | Descrição |
|---|---|---|
| `nexo_postgres` | `5432` | Banco de dados PostgreSQL 17 |
| `nexo_mailpit` | `8025` (UI) / `1025` (SMTP) | Servidor de e-mail para desenvolvimento |
| `nexo_backend` | `3000` | API NestJS |

O Mailpit captura todos os e-mails enviados durante o desenvolvimento. Acesse a interface em **http://localhost:8025** para visualizá-los.

---

## Autenticação

O sistema usa autenticação JWT com fluxo Bearer token:

1. `POST /auth` com `{ email, senha }` → retorna `{ user, token }`
2. O token é incluído automaticamente em todas as requisições via header `Authorization: Bearer <token>`
3. Tokens expiram em 7 dias (configurável via `JWT_EXPIRES_IN`)
4. Recuperação de senha via e-mail com token de reset

---

## Testes e Qualidade

### Política do projeto

- **Cobertura mínima de 90%** (linhas, funções e statements) tanto no backend quanto no frontend. Os thresholds estão configurados em [`backend/package.json`](backend/package.json) (Jest) e em [`frontend/vite.config.ts`](frontend/vite.config.ts) (Vitest). Não rebaixe esses thresholds para fazer o CI passar — escreva o teste que falta.
- **Toda nova feature e toda correção de bug DEVE vir acompanhada de teste.** Em bug fixes, inclua o teste de regressão que falha antes do fix e passa depois.

### Stack de testes

| Camada | Ferramenta | Localização |
|---|---|---|
| Backend — unit | [Jest](https://jestjs.io) + `@nestjs/testing` | `backend/src/**/*.spec.ts` |
| Backend — e2e | Jest + Supertest | `backend/test/` |
| Frontend — unit/integration | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | `frontend/src/**/*.test.ts(x)` |
| Frontend — e2e | [Playwright](https://playwright.dev) (cobertura via istanbul) | `frontend/e2e/` |

### Antes de abrir um PR

1. `bun run test:cov` no diretório alterado — testes novos passam e cobertura ≥ 90%.
2. `bun run lint` — sem erros.
3. `bun run build` no frontend — type-check + build limpos.
4. Em mudanças de UI, valide no navegador (caminho feliz + casos de borda).

Mais detalhes operacionais estão em [`backend/CLAUDE.md`](backend/CLAUDE.md) e [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

---

## Licença

MIT License — veja o arquivo [LICENSE](LICENSE) para mais detalhes.
