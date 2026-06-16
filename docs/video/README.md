# Vídeo demo narrado do NEXO

Pipeline que gera automaticamente um vídeo demonstrando **todas as telas** do
sistema, com **narração em português** (voz neural) e **legendas**.

Saída em `output/`:
- `nexo-demo.mp4` — vídeo completo 1080p com narração e **capítulos** por seção
- `nexo-demo.srt` — legendas sincronizadas
- `clips/<NN-seção>.mp4` — um clipe por seção (para reaproveitar partes)

## Como funciona (3 etapas)

| Etapa | Comando (rodar em `frontend/`) | O que faz |
|------|--------------------------------|-----------|
| 1. Narração | `bun run video:tts` | Gera `audio/<cena>.mp3` com `edge-tts` (voz pt-BR) e mede durações → `durations.json` |
| 2. Gravação | `bun run video:record` | Playwright navega o app gravando 1 `.webm` por seção, no ritmo da narração → `raw/` + `timeline.json` |
| 3. Montagem | `bun run video:build` | `ffmpeg` encaixa o áudio no tempo certo, muxa, concatena, adiciona capítulos e SRT → `output/` |

Atalho que roda as 3: `bun run video` (em `frontend/`).

## Pré-requisitos

- **edge-tts** (TTS): `pip install --user edge-tts` (precisa de internet). Voz via env `VIDEO_VOICE` (padrão `pt-BR-FranciscaNeural`).
- **ffmpeg/ffprobe** no PATH.
- **Docker** rodando (postgres + mailpit) e dependências instaladas (`bun install` em `frontend/` e `backend/`, `bun run e2e:install`).

### Banco de dados (uma vez)

A gravação usa o banco e2e descartável `nexo_e2e`. Suba a infra e semeie antes:

```bash
cd backend
docker compose up -d postgres mailpit
# cria o banco e2e se não existir
docker exec nexo_postgres psql -U postgres -c 'CREATE DATABASE nexo_e2e'
# schema + dados de exemplo
NODE_ENV=test DB_HOST=localhost DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=postgres DB_NAME=nexo_e2e \
JWT_SECRET=e2e-secret-key bun run migrate:fresh:seed
# aponta o SMTP do app para o mailpit (faz o fluxo "esqueci a senha" funcionar)
docker exec nexo_postgres psql -U postgres -d nexo_e2e \
  -c "UPDATE smtp_configs SET host='localhost', port=1025, \"user\"='', password='', secure=false;"
```

Depois, em `frontend/`:

```bash
E2E_SKIP_DOCKER=true E2E_SKIP_RESEED=true bun run video:record
bun run video:build
```

> `E2E_SKIP_DOCKER`/`E2E_SKIP_RESEED` evitam que o `globalSetup` re-suba o docker
> ou recrie o banco (a gravação só precisa do app no ar; a infra já está pronta).
> Sem esses flags, o `globalSetup` faz tudo, mas o backend (webServer) inicia antes
> do docker e não conecta — por isso provisionamos o banco manualmente.

## Estrutura

```
docs/video/
  narration.ts        # roteiro PT-BR (fonte única de texto + seções) — EDITE AQUI o que é falado
  generate-tts.mjs    # etapa 1
  build.mjs           # etapa 3
  audio/  raw/  output/
frontend/
  playwright.video.config.ts     # config de gravação (reusa infra e2e)
  e2e/video/record.spec.ts        # etapa 2 (gravação Playwright, cursor falso + pacing)
```

## Ajustar o vídeo

- **Mudar o texto falado / ritmo**: edite `narration.ts` e rode `video:tts` de novo
  (só as cenas alteradas são regeneradas), depois `video:record` e `video:build`.
- **Trocar a voz**: `VIDEO_VOICE=pt-BR-AntonioNeural bun run video:tts`.
- **Mudar o que aparece na tela**: edite as ações de cada cena em `e2e/video/record.spec.ts`.
