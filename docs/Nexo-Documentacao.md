---
title: "DOCUMENTAÇÃO DO SISTEMA — NEXO"
subtitle: "Sistema de Acompanhamento Educacional e Profissional"
author:
  - Diogo Graciano
  - Luiz Gabriel Boeing
  - Priscila Sérgio Santinoni
date: "2026-05-11"
institute: "Faculdades ESUCRI — Sistemas de Informação — Projeto de Extensão V"
lang: pt-BR
bibliography: referencias.bib
link-citations: true
---

# Introdução

## Contexto do Projeto

O **Instituto de Educação Especial Diomício Freitas** atua no acompanhamento socioeducativo de alunos com deficiência, oferecendo, entre outros serviços, o encaminhamento profissional dos estudantes a empresas parceiras da região. Atualmente, o controle desse fluxo — cadastro do aluno, registro de questionários de avaliação, encaminhamento a empresas, agendamento de visitas técnicas e geração de relatórios — é feito de forma manual ou em planilhas dispersas, o que gera retrabalho, perda de informação e dificuldade de auditoria.

O sistema **Nexo** foi proposto pelos autores deste documento, em parceria com o Instituto, para digitalizar e centralizar todo esse processo em uma única aplicação web, com autenticação por papéis, formulários dinâmicos, calendário integrado e exportação de relatórios em PDF. O nome "Nexo" reflete a função do sistema: ligar o aluno à instituição, à empresa parceira e ao histórico de seu acompanhamento.

O público-alvo direto são os profissionais do Instituto que realizam o acompanhamento dos alunos — coordenadores pedagógicos, equipe de recursos humanos e administradores. O público-alvo indireto são os próprios alunos e as empresas parceiras, beneficiados pela maior agilidade e rastreabilidade do processo.

A importância do sistema para o Instituto reside em três pontos: **redução do tempo** gasto em tarefas administrativas repetitivas, **integridade** dos dados sensíveis sob a guarda da instituição e **visibilidade gerencial** sobre indicadores de colocação profissional dos alunos.

## Objetivos

**Objetivo Geral:** Desenvolver um sistema web completo para gestão e acompanhamento dos alunos do Instituto, suas relações com empresas parceiras e seus históricos de avaliação, substituindo o processo manual atual por uma solução digital integrada, com autenticação, persistência segura e geração automática de relatórios.

**Objetivos Específicos:**

- Implementar cadastros completos para alunos, empresas, funcionários e funções, com validação de campos obrigatórios e formatos (CPF, CNPJ, CEP).
- Disponibilizar um construtor visual de questionários dinâmicos, permitindo que o Instituto crie formulários de avaliação com perguntas dos tipos resposta curta, *checkbox* e *combobox*, sem necessidade de alterar código.
- Registrar encaminhamentos de alunos a empresas, controlando data de admissão, função exercida, contato de RH e data de desligamento, gerando o histórico profissional do aluno.
- Oferecer um módulo de agenda com calendário interativo para registro de visitas a alunos, empresas ou eventos genéricos da instituição.
- Gerar relatórios em PDF com listagens filtráveis de alunos, empresas, funcionários e respostas de questionários, prontos para impressão ou arquivamento.
- Garantir autenticação baseada em JWT com fluxo completo de recuperação de senha por e-mail e configuração SMTP gerenciável pela própria interface.
- Suportar uso em dispositivos móveis através de PWA empacotado com Capacitor.

## Escopo

**O sistema fará:**

- Cadastro completo de alunos com dados pessoais, endereço, código institucional, responsável e observações.
- Cadastro de empresas parceiras com razão social, CNPJ e endereço completo.
- Cadastro de funcionários internos com vínculo à função/cargo e credenciais de acesso.
- Cadastro de funções/cargos reutilizáveis.
- Construção visual de questionários com três tipos de campo (resposta curta, *checkbox* e *combobox*).
- Coleta e visualização de respostas de questionários por aluno.
- Registro de encaminhamentos vinculando aluno a empresa, com controle de admissão e desligamento.
- Agenda com calendário (FullCalendar) para visitas e eventos.
- Geração de relatórios em PDF (PDFKit) para alunos, empresas, funcionários e respostas.
- *Dashboard* analítico com indicadores de colocação e gráficos de tendência (Recharts).
- Autenticação JWT, controle de sessão e recuperação de senha por *e-mail*.
- Configuração SMTP editável via interface (sem necessidade de mexer em variáveis de ambiente em produção).
- Empacotamento mobile via Capacitor.

**O sistema NÃO fará (limitações conscientes):**

- Não fará gestão financeira ou contábil da instituição.
- Não integrará automaticamente com sistemas externos de matrícula da rede pública.
- Não enviará notificações automáticas por SMS ou *push* (apenas e-mail).
- Não fará reconhecimento facial nem controle de frequência biométrica.
- Não substituirá prontuários médicos especializados; serve como apoio socioeducativo.
- Não terá módulo de comunicação interna (chat) entre profissionais.

# Visão Geral do Sistema

## Público-alvo

- **Coordenadores pedagógicos** do Instituto — responsáveis pelos cadastros e acompanhamento.
- **Equipe de Recursos Humanos** — responsáveis pelos encaminhamentos e contatos com empresas.
- **Educadores e profissionais técnicos** — preenchem questionários de avaliação dos alunos.
- **Administradores do sistema** — gerenciam funcionários, funções, configuração SMTP e parâmetros globais.

## Principais Funcionalidades

| Módulo | Funcionalidade | Descrição |
|---|---|---|
| Auth | Autenticação e recuperação de senha | *Login* por e-mail/senha com JWT, *reset* via *token* por *e-mail*, *guards* de rota |
| Students | Gestão de alunos | CRUD completo com dados pessoais, endereço, código e responsável |
| Companies | Gestão de empresas | CRUD de empresas parceiras com CNPJ e endereço |
| Employees | Gestão de funcionários | CRUD de equipe interna com credenciais e vínculo à função |
| Functions | Gestão de funções | CRUD de funções/cargos reutilizáveis |
| Questionnaires | Construtor de questionários | Criação visual de formulários com múltiplos tipos de campo |
| Questions | Banco de perguntas | Perguntas vinculadas a questionários (3 tipos suportados) |
| Questionnaire-Responses | Respostas e acompanhamento | Coleta e visualização de respostas por aluno |
| Referrals | Encaminhamentos | Vínculo aluno–empresa com admissão, função e desligamento |
| Events | Agenda | Calendário com visitas a alunos, empresas ou eventos genéricos |
| Reports | Relatórios PDF | Geração de relatórios filtráveis em PDF (PDFKit) |
| SMTP-Config | Configuração SMTP | Configuração editável do servidor de *e-mail* via interface |
| Dashboard | Painel analítico | Indicadores e gráficos de colocação (no *front-end*) |

# Tecnologias Utilizadas

Versões extraídas diretamente dos arquivos `package.json` de cada projeto.

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Front-end | Vite [@vite2025] | 7.1.2 | *Build tool* e *dev server* rápidos via *ESM* |
| Front-end | React [@react2025] | 19.1.1 | Biblioteca para UI declarativa baseada em componentes |
| Front-end | TypeScript [@typeorm-typescript2025] | 5.8.3 | Tipagem estática reduz *bugs* em tempo de compilação |
| Front-end | Tailwind CSS [@tailwind2025] | 4.1.12 | Estilização *utility-first* com produtividade alta |
| Front-end | React Router DOM | 7.8.1 | Roteamento *client-side* |
| Front-end | Redux Toolkit + Persist [@reduxtoolkit2025] | 2.11.2 | Estado global tipado com persistência em *storage* |
| Front-end | TanStack React Query [@tanstackquery2025] | 5.96.2 | *Cache*, *refetching* e sincronização de dados |
| Front-end | Axios | 1.11.0 | Cliente HTTP com interceptadores |
| Front-end | Recharts | 3.8.1 | Gráficos declarativos para *dashboard* |
| Front-end | FullCalendar | 6.1.15 | Calendário interativo para módulo Agenda |
| Front-end | Lucide React | 0.540.0 | Conjunto de ícones SVG |
| Front-end | Capacitor [@capacitor2025] | 8.3.1 | Empacotamento mobile / PWA |
| Back-end | NestJS [@nestjs2025] | 11.1.8 | Framework HTTP modular orientado a IoC |
| Back-end | Bun [@bun2025] | 1.3+ | *Runtime* JavaScript e gerenciador de pacotes |
| Back-end | TypeORM [@typeorm2025] | 0.3.27 | ORM com suporte a *migrations* e *decorators* |
| Back-end | Passport + JWT [@jwt-rfc7519] | 0.7.0 / 4.0.1 | Estratégia de autenticação por *token* |
| Back-end | PDFKit | 0.18.0 | Geração programática de PDFs |
| Back-end | Nodemailer | 7.0.10 | Envio de *e-mails* via SMTP |
| Back-end | Swagger (`@nestjs/swagger`) | 11.2.6 | Documentação automática da API |
| Back-end | bcrypt | 6.0.0 | *Hash* de senhas com *salt* |
| Banco | PostgreSQL [@postgresql2025] | 17 | Banco relacional com forte conformidade ACID |
| Infra | Docker [@docker2025] | 24+ | Containerização do banco, *mailpit* e API |
| Infra | Mailpit | latest | Captura de *e-mails* em ambiente de desenvolvimento |
| Infra | Git | 2.5+ | Controle de versão distribuído |

# Arquitetura do Sistema

## Diagrama de Arquitetura

> *[Inserir imagem: diagrama de três camadas — SPA React → API NestJS → PostgreSQL — com Mailpit/SMTP lateral. Sugere-se desenhar em <https://app.diagrams.net> com base na descrição abaixo.]*

## Descrição da Arquitetura

O sistema adota uma arquitetura **cliente-servidor de três camadas** com separação estrita entre apresentação, lógica de negócio e persistência:

```
┌──────────────────┐   HTTPS/JSON   ┌──────────────────┐   TCP/SQL   ┌──────────────────┐
│  Front-end SPA   │ ─────────────► │   API REST       │ ──────────► │   PostgreSQL 17  │
│ (React + Vite)   │ ◄───────────── │   (NestJS)       │ ◄────────── │   (Docker)       │
└──────────────────┘                └──────────────────┘             └──────────────────┘
                                            │
                                            │ SMTP
                                            ▼
                                    ┌──────────────────┐
                                    │   Mailpit/SMTP   │
                                    └──────────────────┘
```

**Camada de apresentação (Front-end):** SPA escrita em React 19 com TypeScript, empacotada pelo Vite. O estado global é mantido por Redux Toolkit com persistência em `localStorage`; o estado de servidor (*cache* de listagens, *mutations*) é gerenciado pelo TanStack Query. As requisições HTTP utilizam Axios com interceptadores que anexam o *token* JWT automaticamente e fazem *logout* em respostas 401. O roteamento usa React Router 7. Para suporte mobile, a aplicação é empacotada pelo Capacitor 8, gerando um *bundle* PWA instalável.

**Camada de lógica (Back-end):** API REST construída com NestJS 11, organizada em 12 módulos coesos (um por agregado de domínio). Cada módulo expõe um *controller* HTTP, um *service* com a regra de negócio, um conjunto de DTOs validados por `class-validator` e uma entidade TypeORM. A autenticação usa Passport com estratégia JWT; rotas são protegidas por padrão e marcadas com `@Public()` quando devem ser abertas. A documentação interativa é exposta pelo Swagger em `/api`.

**Camada de persistência:** PostgreSQL 17 rodando em *container* Docker. O ORM TypeORM mapeia as 10 entidades do domínio para tabelas relacionais com chaves estrangeiras e *cascades* configurados (`onDelete: CASCADE` para encaminhamentos do aluno, `SET NULL` para eventos opcionalmente vinculados).

**Serviços auxiliares:** Mailpit em *container* captura *e-mails* em ambiente de desenvolvimento; em produção a configuração SMTP é editável via interface administrativa (tabela `smtp_configs`).

## Fluxo de Dados

Um fluxo típico de requisição segue oito passos:

1. O usuário interage com um componente React (ex.: clica em "Cadastrar Aluno").
2. O *hook* customizado dispara uma *mutation* do TanStack Query.
3. Axios envia a requisição HTTP `POST /students` com `Authorization: Bearer <jwt>` e *payload* JSON.
4. O `JwtAuthGuard` do NestJS valida o *token*; o `RolesGuard` valida a autorização.
5. O *controller* `StudentsController` recebe e delega ao `StudentsService` após validação automática do DTO.
6. O *service* aplica regras de negócio (validação de duplicidade, formatação de CPF) e chama `repository.save()` do TypeORM.
7. TypeORM emite o `INSERT` parametrizado no PostgreSQL; o banco retorna o registro com `id` gerado.
8. A resposta JSON volta pelo *controller*; o TanStack Query invalida o *cache* da listagem e o React renderiza o novo estado.

# Banco de Dados

## Modelo Entidade-Relacionamento (DER)

> *[Inserir imagem: DER com as 10 entidades — alunos, empresas, funcionarios, funcoes, encaminhamentos, questionarios, perguntas, respostas_questionarios, eventos, smtp_configs — e suas chaves estrangeiras. Sugere-se gerar em <https://dbdiagram.io> a partir do dicionário abaixo.]*

## Dicionário de Dados

### Tabela: `alunos`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| nome | VARCHAR(255) | Não | Nome completo do aluno |
| email | VARCHAR(255) | Não | E-mail de contato |
| telefone | VARCHAR(20) | Não | Telefone de contato |
| cpf | VARCHAR(14) | Não | CPF formatado |
| cep | VARCHAR(10) | Não | CEP do endereço |
| cidade | VARCHAR(100) | Não | Cidade |
| estado | VARCHAR(2) | Não | UF |
| bairro | VARCHAR(100) | Não | Bairro |
| pais | VARCHAR(100) | Não | País |
| numero_endereco | VARCHAR(20) | Não | Número |
| complemento | VARCHAR(255) | Não | Complemento |
| codigo | VARCHAR(50) | Sim, único | Código institucional do aluno |
| responsavel | VARCHAR(255) | Sim | Nome do responsável legal |
| observacao | TEXT | Não | Observações livres |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `empresas`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| razao_social | VARCHAR(255) | Sim | Razão social |
| cnpj | VARCHAR(18) | Sim, único | CNPJ formatado |
| cep | VARCHAR(10) | Sim | CEP |
| cidade | VARCHAR(100) | Sim | Cidade |
| estado | VARCHAR(2) | Sim | UF |
| bairro | VARCHAR(100) | Sim | Bairro |
| pais | VARCHAR(100) | Sim | País |
| numero_endereco | VARCHAR(20) | Sim | Número |
| complemento | VARCHAR(255) | Não | Complemento |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `funcionarios`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome completo |
| email | VARCHAR(255) | Sim, único | E-mail (usado para login) |
| telefone | VARCHAR(20) | Sim | Telefone |
| cpf | VARCHAR(14) | Sim, único | CPF |
| senha | VARCHAR(255) | Sim | Hash bcrypt da senha |
| cep | VARCHAR(10) | Sim | CEP |
| cidade | VARCHAR(100) | Sim | Cidade |
| estado | VARCHAR(2) | Sim | UF |
| bairro | VARCHAR(100) | Sim | Bairro |
| pais | VARCHAR(100) | Sim | País |
| numero_endereco | VARCHAR(20) | Sim | Número |
| complemento | VARCHAR(255) | Não | Complemento |
| contato_empresarial | VARCHAR(255) | Não | Contato profissional alternativo |
| funcao_id | INT | Não | FK para `funcoes.id` |
| reset_password_token | VARCHAR(255) | Não | Token de recuperação de senha |
| reset_password_expires | TIMESTAMP | Não | Validade do token de recuperação |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `funcoes`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| codigo | VARCHAR(50) | Sim, único | Código interno da função |
| nome_funcao | VARCHAR(255) | Sim | Nome descritivo |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `encaminhamentos`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| aluno_id | INT | Sim | FK para `alunos.id` (CASCADE no delete) |
| empresa_id | INT | Sim | FK para `empresas.id` |
| funcao | VARCHAR(255) | Não | Função exercida na empresa |
| data_admissao | DATE | Não | Data de admissão |
| contato_rh | VARCHAR(255) | Não | Contato do RH da empresa |
| data_desligamento | DATE | Não | Data de desligamento (se houver) |
| observacao | TEXT | Não | Observações |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `questionarios`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome do questionário |
| questionario_json | TEXT | Sim | Estrutura JSON serializada do *form* |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `perguntas`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| questionario_id | INT | Sim | FK para `questionarios.id` |
| tipo_pergunta | ENUM | Sim | `checkbox`, `resposta_curta` ou `combobox` |
| texto_pergunta | TEXT | Sim | Enunciado |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `respostas_questionarios`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| questionario_id | INT | Sim | FK para `questionarios.id` |
| aluno_id | INT | Sim | FK para `alunos.id` |
| respostas_json | TEXT | Sim | Respostas serializadas em JSON |
| data_envio | TIMESTAMP | Sim | Data e hora do envio |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `eventos`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| titulo | VARCHAR(255) | Sim | Título do evento |
| descricao | TEXT | Não | Descrição livre |
| data_inicio | TIMESTAMP | Sim | Início |
| data_fim | TIMESTAMP | Sim | Fim |
| tipo | VARCHAR(30) | Sim (default `generico`) | `visita_aluno`, `visita_empresa`, `visita_ambos`, `generico` |
| local | VARCHAR(255) | Não | Local do evento |
| observacao | TEXT | Não | Observações |
| aluno_id | INT | Não | FK para `alunos.id` (SET NULL no delete) |
| empresa_id | INT | Não | FK para `empresas.id` (SET NULL no delete) |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

### Tabela: `smtp_configs`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | SERIAL | Sim | Identificador único |
| host | VARCHAR(255) | Sim | *Host* do servidor SMTP |
| port | INT | Sim | Porta SMTP |
| user | VARCHAR(255) | Sim | Usuário SMTP |
| password | VARCHAR(255) | Sim | Senha SMTP |
| from | VARCHAR(255) | Sim | Remetente padrão |
| secure | BOOLEAN | Sim (default `true`) | Usar TLS |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data da última atualização |

## Principais Relacionamentos

- `alunos` 1 — N `encaminhamentos` (CASCADE no *delete* do aluno)
- `alunos` 1 — N `respostas_questionarios`
- `alunos` 1 — N `eventos` (opcional; SET NULL)
- `empresas` 1 — N `encaminhamentos`
- `empresas` 1 — N `eventos` (opcional; SET NULL)
- `questionarios` 1 — N `perguntas`
- `questionarios` 1 — N `respostas_questionarios`
- `funcoes` 1 — N `funcionarios` (opcional)

# Funcionalidades

## Módulo de Autenticação (`auth`)

- *Login* com e-mail e senha; retorna *token* JWT com expiração configurável (padrão 7 dias).
- *Endpoint* `POST /auth/forgot-password` envia *e-mail* com *token* de recuperação.
- *Endpoint* `POST /auth/reset-password` valida o *token* (`reset_password_expires`) e redefine a senha (*hash* bcrypt).
- Proteção global de rotas por `JwtAuthGuard`; rotas públicas marcadas com `@Public()`.

## Módulo de Alunos (`students`)

- CRUD completo de alunos.
- Filtros por nome, código, cidade e responsável na listagem.
- Validação de CPF e CEP via *class-validator*.

## Módulo de Empresas (`companies`)

- CRUD de empresas parceiras.
- Validação de CNPJ único.
- Endereço completo obrigatório.

## Módulo de Funcionários (`employees`)

- CRUD de funcionários internos.
- *Hash* automático da senha em `@BeforeInsert` e `@BeforeUpdate`.
- Vínculo opcional a uma função (`funcao_id`).
- Geração de *token* de recuperação de senha com validade temporal.

## Módulo de Funções (`functions`)

- CRUD de cargos/funções reutilizáveis.
- Código único por função.

## Módulo de Questionários (`questionnaires`)

- Construtor visual de formulários (no *front-end*).
- Estrutura completa serializada em `questionario_json`.
- Suporta três tipos de pergunta: resposta curta, *checkbox* e *combobox*.

## Módulo de Perguntas (`questions`)

- Banco normalizado de perguntas (uma linha por pergunta).
- Relação N:1 com questionário.

## Módulo de Respostas (`questionnaire-responses`)

- Coleta as respostas de um aluno a um questionário.
- Armazena em `respostas_json` com *timestamp* de envio.
- Listagem por aluno e por questionário.

## Módulo de Encaminhamentos (`referrals`)

- Vincula aluno a empresa.
- Controla admissão, função, contato de RH e desligamento.
- Histórico completo por aluno (caminho profissional).

## Módulo de Eventos / Agenda (`events`)

- Quatro tipos de evento: visita ao aluno, visita à empresa, visita a ambos, evento genérico.
- *Front-end* renderiza com FullCalendar (visão mês/semana/dia/lista).
- Vínculo opcional a aluno e/ou empresa.

## Módulo de Relatórios (`reports`)

- Geração de PDFs com PDFKit.
- Listagens filtráveis de alunos, empresas, funcionários e respostas.
- *Stream* direto na resposta HTTP.

## Módulo de Configuração SMTP (`smtp-config`)

- Configuração do servidor de *e-mail* editável via interface.
- Permite trocar de provedor (Mailpit, Gmail, SendGrid, etc.) sem reinício do serviço.

## Dashboard (somente *front-end*)

- *Cards* de indicadores: total de alunos, total de empresas, encaminhamentos ativos.
- Gráficos de tendência (Recharts).
- Lista de próximas visitas (próximos N eventos).

# Demonstração em Vídeo

O sistema possui um **vídeo demonstrativo narrado** (~5 min, em português) que percorre
todas as telas mostrando, ao vivo, como cada funcionalidade funciona. O vídeo é gerado
automaticamente pelo pipeline em `docs/video/` (narração por *text-to-speech*, gravação
via Playwright e montagem com `ffmpeg`).

**Arquivos:**

- Vídeo completo com capítulos: `docs/video/output/nexo-demo.mp4`
- Legendas: `docs/video/output/nexo-demo.srt`
- Clipes por seção: `docs/video/output/clips/`
- Versão interativa: os clipes estão **embutidos no Manual do Usuário HTML** (`docs/manual/`),
  cada tela com sua própria demonstração, e o tour completo na página inicial.

**Capítulos:**

| Tempo | Seção |
|---|---|
| 00:00 | Introdução e Acesso (login, recuperação de senha) |
| 00:45 | Painel Principal (indicadores e gráficos) |
| 01:19 | Cadastro de Alunos (+ encaminhamentos e relatório) |
| 02:02 | Cadastro de Empresas (validação de CNPJ) |
| 02:24 | Cadastro de Funcionários (função e senha) |
| 02:45 | Construtor de Questionários (visual + JSON) |
| 03:27 | Responder Questionários |
| 03:48 | Respostas dos Questionários |
| 04:08 | Agenda e Eventos |
| 04:28 | Configuração de E-mail (SMTP) |
| 04:44 | Encerramento |

Para regenerar o vídeo, consulte `docs/video/README.md`.

# Manual do Usuário

> 💡 As telas abaixo também estão demonstradas em **vídeo narrado** — veja a seção
> [Demonstração em Vídeo](#demonstração-em-vídeo) ou abra o Manual HTML em `docs/manual/`.

## Acessando o sistema

1. Abra o navegador em `http://localhost:5173` (ambiente local) ou no endereço de produção fornecido pelo administrador.
2. A tela inicial é o *login*.

## Tela de Login

> *[Inserir print: tela de login com campos e-mail/senha e link "Esqueci minha senha".]*

1. Informe seu e-mail e senha cadastrados pelo administrador.
2. Clique em **Entrar**.
3. Em caso de credenciais inválidas, uma mensagem de erro será exibida.

## Dashboard

> *[Inserir print: dashboard com cards de indicadores e gráficos.]*

A tela inicial após o *login* exibe:

- Cards com total de alunos, total de empresas e encaminhamentos ativos.
- Gráfico de tendência de colocações nos últimos meses.
- Lista das próximas visitas agendadas.

## Cadastro de Alunos

> *[Inserir print: formulário de cadastro de aluno.]*

1. Acesse **Cadastros → Alunos**.
2. Clique em **Novo Aluno**.
3. Preencha os campos: nome, código institucional, responsável (obrigatórios), e dados de contato/endereço (opcionais).
4. Clique em **Salvar**. O sistema valida os campos e retorna ao listagem.

## Cadastro de Empresas

> *[Inserir print: formulário de cadastro de empresa.]*

1. Acesse **Cadastros → Empresas**.
2. Clique em **Nova Empresa**.
3. Preencha razão social, CNPJ e endereço completo (todos obrigatórios).
4. Clique em **Salvar**.

## Cadastro de Funcionários e Funções

> *[Inserir print: tela de gestão de funcionários com vínculo a função.]*

1. Cadastre primeiro as **Funções** (Cadastros → Funções) — código e nome.
2. Depois cadastre **Funcionários** (Cadastros → Funcionários), selecionando a função na lista suspensa.
3. A senha inicial é definida no cadastro; o funcionário poderá trocá-la via "Esqueci minha senha".

## Criação de Questionários

> *[Inserir print: construtor visual de questionário.]*

1. Acesse **Cadastros → Questionários**.
2. Clique em **Novo Questionário** e dê um nome.
3. Adicione perguntas selecionando o tipo (resposta curta, *checkbox* ou *combobox*).
4. Para *checkbox* e *combobox*, informe as opções.
5. Clique em **Salvar**.

## Registro de Respostas

> *[Inserir print: formulário de resposta para um aluno.]*

1. Acesse **Acompanhamentos → Responder Questionário**.
2. Selecione o aluno e o questionário.
3. Preencha as respostas e clique em **Enviar**.
4. Para consultar respostas anteriores, acesse **Acompanhamentos → Respostas por Aluno**.

## Registro de Encaminhamentos

> *[Inserir print: formulário de encaminhamento aluno → empresa.]*

1. Acesse **Encaminhamentos → Novo Encaminhamento**.
2. Selecione o aluno e a empresa.
3. Informe função, data de admissão e contato de RH (opcionais).
4. Para registrar desligamento posterior, edite o encaminhamento e preencha **Data de desligamento**.

## Agenda

> *[Inserir print: visão mensal do FullCalendar com eventos.]*

1. Acesse **Agenda**.
2. Visualize por mês, semana, dia ou lista.
3. Clique em uma data para criar um evento; escolha o tipo (visita ao aluno, visita à empresa, ambos ou genérico) e, se aplicável, vincule aluno e/ou empresa.

## Recuperação de Senha

> *[Inserir print: tela "Esqueci minha senha".]*

1. Na tela de *login*, clique em **Esqueci minha senha**.
2. Informe o e-mail cadastrado e clique em **Enviar**.
3. Acesse o e-mail recebido e clique no link de recuperação.
4. Defina a nova senha e clique em **Salvar**.

## Configuração SMTP (administradores)

> *[Inserir print: tela de configuração SMTP.]*

1. Acesse **Configurações → SMTP** (visível apenas para administradores).
2. Informe *host*, porta, usuário, senha, remetente padrão e marque "Usar TLS" se necessário.
3. Clique em **Testar conexão** e depois em **Salvar**.

# Guia de Instalação e Configuração

## Pré-requisitos

- **Bun** ≥ 1.3 ([@bun2025]) — *runtime* e gerenciador de pacotes
- **Docker** ≥ 24 ([@docker2025]) — para subir PostgreSQL e Mailpit
- **Git** ≥ 2.5 — controle de versão
- **Node.js** opcional (apenas se preferir não usar Bun para o *front-end*)

## Clonando o repositório

```bash
git clone <url-do-repositorio>
cd PE4
```

## Configurando o Back-end

```bash
cd backend
cp _.env .env
# Edite .env conforme o seu ambiente
docker compose up -d
bun install
bun run start:dev
```

A API ficará disponível em `http://localhost:3000`. A documentação Swagger fica em `http://localhost:3000/api`.

## Configurando o Front-end

```bash
cd ../frontend
bun install
bun run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

## Variáveis de Ambiente

Arquivo `backend/.env`:

| Variável | Descrição | Exemplo |
|---|---|---|
| NODE_ENV | Ambiente de execução | `development` |
| PORT | Porta da API | `3000` |
| DB_HOST | *Host* do PostgreSQL | `localhost` |
| DB_PORT | Porta do PostgreSQL | `5432` |
| DB_USERNAME | Usuário do banco | `postgres` |
| DB_PASSWORD | Senha do banco | `postgres` |
| DB_NAME | Nome do banco de dados | `pe4_db` |
| JWT_SECRET | Chave secreta do JWT | `troque-esta-chave-em-producao` |
| JWT_EXPIRES_IN | Validade do *token* JWT | `7d` |
| FRONTEND_URL | URL do *front-end* (CORS e links de *e-mail*) | `http://localhost:5173` |
| SMTP_HOST | *Host* do servidor SMTP | `mailpit` |
| SMTP_PORT | Porta SMTP | `1025` |
| SMTP_USER | Usuário SMTP | *vazio em dev* |
| SMTP_PASSWORD | Senha SMTP | *vazio em dev* |
| SMTP_FROM | Remetente padrão | `noreply@localhost` |
| RUN_SEEDERS | Executar *seeders* na inicialização | `false` |

Arquivo `frontend/.env` (opcional):

| Variável | Descrição | Exemplo |
|---|---|---|
| VITE_API_URL | URL base da API | `http://localhost:3000` |

## Populando o Banco com Dados Iniciais

```bash
cd backend
bun run seed              # roda os seeders manualmente
# OU defina RUN_SEEDERS=true no .env para rodar automaticamente
bun run migrate:fresh     # recria todo o schema do zero
```

Os *seeders* criam um funcionário administrador inicial e a configuração SMTP padrão (apontando para Mailpit em desenvolvimento).

# Considerações Finais

## Desafios Encontrados

- **Formulários dinâmicos:** Implementar um construtor visual que serializa estrutura arbitrária em `questionario_json` e a deserializa corretamente no momento da resposta exigiu modelagem cuidadosa, separando o *template* (questionário/perguntas) das respostas (snapshot da estrutura no instante do envio).
- **Cobertura de testes obrigatória:** Manter ≥ 90% de cobertura em ambos os projetos (configurado em `jest.coverageThreshold` e `vitest.config`) exigiu disciplina, especialmente em *services* com regras de negócio condicionais.
- **PWA mobile via Capacitor:** Configurar a aplicação React para empacotamento mobile sem regressão da experiência *web* envolveu ajustes de roteamento, *splash screen* e *deep links*.
- **Configuração SMTP editável em tempo de execução:** Substituir a leitura de variáveis de ambiente por uma configuração lida do banco a cada envio de *e-mail* exigiu refatoração do `MailerModule`.

## Melhorias Futuras

- Integração com o sistema de matrícula do Instituto para evitar redigitação de dados de alunos.
- Notificações *push* via *web push* / Capacitor *push notifications*.
- Módulo de comunicação interna (mural de avisos) entre profissionais.
- Exportação de dados em formatos adicionais (Excel, CSV).
- Auditoria detalhada (*log* de alterações por usuário) com *time travel* nas entidades sensíveis.
- Aproximar o Instituto do ciclo de desenvolvimento para validação contínua das *features*.

## Agradecimentos

Os autores agradecem ao **Instituto de Educação Especial Diomício Freitas** pela parceria, ao professor **Esp. Jucemar Formigoni Cândido** pela orientação ao longo da disciplina de Projeto de Extensão V, e às **Faculdades ESUCRI** pelo apoio à formação prática em Sistemas de Informação.

# Referências {-}

::: {#refs}
:::

# Apêndices {-}

## Apêndice A — Códigos de Status HTTP utilizados

| Código | Significado | Uso típico no Nexo |
|---|---|---|
| 200 | OK | Listagens e consultas bem-sucedidas |
| 201 | Criado | Após `POST` de novo recurso |
| 204 | Sem conteúdo | Após `DELETE` bem-sucedido |
| 400 | Requisição inválida | Falha de validação do DTO |
| 401 | Não autorizado | *Token* JWT ausente ou inválido |
| 403 | Proibido | Usuário autenticado sem permissão |
| 404 | Não encontrado | Recurso inexistente |
| 409 | Conflito | Violação de *unique constraint* (CPF, CNPJ, e-mail) |
| 500 | Erro interno | Erro não tratado no servidor |

## Apêndice B — Glossário

| Termo | Definição |
|---|---|
| API | *Application Programming Interface* — Interface de programação de aplicações |
| CRUD | *Create, Read, Update, Delete* — operações básicas de persistência |
| DER | Diagrama Entidade-Relacionamento |
| DTO | *Data Transfer Object* — objeto de transporte entre camadas |
| FK | *Foreign Key* — chave estrangeira |
| JWT | *JSON Web Token* — padrão de *token* compactos para autenticação |
| ORM | *Object-Relational Mapping* — mapeamento objeto-relacional |
| PWA | *Progressive Web App* — aplicação web instalável com recursos nativos |
| REST | *Representational State Transfer* — estilo arquitetural para APIs HTTP |
| SMTP | *Simple Mail Transfer Protocol* — protocolo de envio de *e-mail* |
| SPA | *Single Page Application* — aplicação web de página única |
| TLS | *Transport Layer Security* — protocolo de comunicação segura |
