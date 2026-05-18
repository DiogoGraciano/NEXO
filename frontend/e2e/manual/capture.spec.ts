/**
 * Captura screenshots para o Manual do Usuário NEXO.
 *
 * Saída em: docs/manual/assets/images/*.png
 * Rodar com:   bun run manual:capture
 *
 * Cada bloco é tolerante a falhas (try/catch + best-effort) para que uma
 * tela quebrada não impeça a captura das demais. Mensagens "[manual] ..."
 * indicam capturas bem-sucedidas ou puladas.
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fillField } from '../helpers/forms';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(__dirname, '../../../docs/manual/assets/images');

test.describe.configure({ mode: 'serial' });

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.screenshot({
    path: path.join(SHOTS, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  console.log(`[manual] OK: ${name}.png`);
}

async function safeClick(page: Page, fn: () => Promise<void>, label: string) {
  try {
    await fn();
  } catch (e) {
    console.warn(`[manual] skip ${label}: ${(e as Error).message}`);
  }
}

// =============================================================================
// 01 — ACESSO (sem auth)
// =============================================================================
test.describe('01 — acesso', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login, esqueci minha senha e redefinição', async ({ page, request }) => {
    // Login vazio
    await page.goto('/login');
    await shot(page, '01-login-vazio');

    // Login preenchido (correto)
    await page.getByLabel(/e-?mail/i).fill('admin@nexo.com');
    await page.getByLabel(/senha/i).fill('admin123');
    await shot(page, '01-login-preenchido');

    // Login com erro
    await page.getByLabel(/senha/i).fill('senhaerrada');
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, '01-login-erro');

    // Forgot password — tela vazia
    await page.goto('/forgot-password');
    await shot(page, '01-forgot-vazio');

    // Forgot password — sucesso
    await page.getByLabel(/e-?mail/i).fill('admin@nexo.com');
    await page.getByRole('button', { name: /enviar|recuperar|solicitar/i }).first().click();
    await page.waitForTimeout(2500);
    await shot(page, '01-forgot-sucesso');

    // Reset password — tenta extrair token via Mailpit
    try {
      const res = await request.get('http://localhost:8025/api/v1/messages?limit=1');
      if (res.ok()) {
        const data = await res.json();
        const msgId = data?.messages?.[0]?.ID;
        if (msgId) {
          const msg = await (await request.get(`http://localhost:8025/api/v1/message/${msgId}`)).json();
          const body = String(msg?.HTML || msg?.Text || '');
          const m = body.match(/token=([A-Za-z0-9._-]+)/);
          if (m) {
            await page.goto(`/reset-password?token=${m[1]}`);
            await page.waitForLoadState('networkidle').catch(() => {});
            await fillField(page, /^senha$|nova senha/i, 'admin123').catch(() => {});
            await fillField(page, /confirmar|repita/i, 'admin123').catch(() => {});
            await shot(page, '01-reset-preenchido');

            await page.getByRole('button', { name: /redefinir|confirmar/i }).first().click();
            await page.waitForTimeout(2500);
            await shot(page, '01-reset-sucesso');
          } else {
            console.warn('[manual] reset: token não encontrado no e-mail');
          }
        }
      }
    } catch (e) {
      console.warn('[manual] reset-password skipped:', (e as Error).message);
    }
  });
});

// =============================================================================
// Capturas autenticadas (admin@nexo.com)
// =============================================================================
test.describe('autenticado — admin', () => {
  test('02 — dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000); // espera gráficos animarem
    await shot(page, '02-dashboard-completo');
    // Mesmo frame serve para o alerta (caso não exista, manual mostrará apenas dashboard)
    await shot(page, '02-dashboard-alerta');
  });

  test('03 — alunos: lista, busca, novo, encaminhamentos', async ({ page }) => {
    await page.goto('/cadastros/alunos');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, '03-alunos-lista');

    // Busca
    const search = page.getByPlaceholder(/buscar|pesquisar|procurar/i).first();
    await search.fill('a').catch(() => {});
    await page.waitForTimeout(400);
    await shot(page, '03-alunos-busca');
    await search.fill('').catch(() => {});

    // Modal novo aluno — vazio
    await page.getByRole('button', { name: /^\+?\s*novo aluno$|novo aluno/i }).first().click();
    await page.waitForTimeout(800);
    await shot(page, '03-alunos-novo-vazio');

    // Modal novo aluno — preenchido
    await safeClick(page, async () => {
      await fillField(page, /nome completo|^nome$/i, 'Maria Silva (exemplo)');
      await fillField(page, /e-?mail/i, 'maria.exemplo@email.com');
      await fillField(page, /telefone/i, '(11) 91234-5678');
      await fillField(page, /cpf/i, '111.222.333-44');
      await fillField(page, /c[óo]digo/i, '2024-001');
      await fillField(page, /respons[áa]vel/i, 'João Silva');
      await page.waitForTimeout(400);
      await shot(page, '03-alunos-novo-preenchido');
    }, '03-alunos-novo-preenchido');

    // Fechar
    await page.getByRole('button', { name: /cancelar/i }).first().click().catch(() => {});
    await page.waitForTimeout(400);

    // Encaminhamentos do primeiro aluno
    await safeClick(page, async () => {
      const firstRow = page.locator('tbody tr').first();
      const buttons = firstRow.locator('button');
      const count = await buttons.count();
      // Tenta clicar no botão com title contendo "encaminhamento"
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const t = await buttons.nth(i).getAttribute('title');
        if (t && /encaminhamento/i.test(t)) {
          await buttons.nth(i).click();
          clicked = true;
          break;
        }
      }
      if (!clicked && count >= 2) await buttons.nth(1).click();
      await page.waitForTimeout(900);
      await shot(page, '03-alunos-encaminhamentos');

      // Novo encaminhamento
      const novoBtn = page
        .getByRole('button', { name: /novo encaminhamento|adicionar encaminhamento|\+\s*adicionar/i })
        .first();
      if (await novoBtn.count()) {
        await novoBtn.click();
        await page.waitForTimeout(600);
        await shot(page, '03-alunos-novo-encaminhamento');
      }
    }, '03-alunos-encaminhamentos');
  });

  test('04 — empresas', async ({ page }) => {
    await page.goto('/cadastros/empresas');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, '04-empresas-lista');

    await page
      .getByRole('button', { name: /^\+?\s*nova empresa$|nova empresa|\+\s*adicionar/i })
      .first()
      .click();
    await page.waitForTimeout(700);
    await shot(page, '04-empresas-novo-vazio');

    await safeClick(page, async () => {
      await fillField(page, /raz[ãa]o social|^nome$/i, 'Tech Solutions LTDA');
      await fillField(page, /cnpj/i, '12.345.678/0001-99');
      await fillField(page, /c[eé]p/i, '01310-100');
      await page.waitForTimeout(600);
      await shot(page, '04-empresas-novo-preenchido');
    }, '04-empresas-novo-preenchido');

    await page.getByRole('button', { name: /cancelar/i }).first().click().catch(() => {});
  });

  test('05 — funcionários', async ({ page }) => {
    await page.goto('/cadastros/funcionarios');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, '05-funcionarios-lista');

    // Filtro por função
    await safeClick(page, async () => {
      const select = page.locator('select').first();
      if (await select.count()) {
        const options = await select.locator('option').all();
        if (options.length > 1) {
          const v = await options[1]!.getAttribute('value');
          if (v) await select.selectOption(v);
          await page.waitForTimeout(400);
          await shot(page, '05-funcionarios-filtro');
          await select.selectOption('').catch(() => {});
        }
      }
    }, '05-funcionarios-filtro');

    // Novo funcionário
    await page
      .getByRole('button', { name: /^\+?\s*novo funcion[áa]rio$|novo funcion[áa]rio|\+\s*adicionar/i })
      .first()
      .click();
    await page.waitForTimeout(800);
    await shot(page, '05-funcionarios-novo-vazio');

    await safeClick(page, async () => {
      await fillField(page, /nome completo|^nome$/i, 'Carlos Souza (exemplo)');
      await fillField(page, /e-?mail/i, 'carlos.exemplo@nexo.com');
      await fillField(page, /telefone/i, '(11) 98765-4321');
      await fillField(page, /cpf/i, '999.888.777-66');
      await page.waitForTimeout(300);
      await shot(page, '05-funcionarios-novo-preenchido');
    }, '05-funcionarios-novo-preenchido');

    await page.getByRole('button', { name: /cancelar/i }).first().click().catch(() => {});
    await page.waitForTimeout(400);

    // Editar primeiro funcionário
    await safeClick(page, async () => {
      const firstRow = page.locator('tbody tr').first();
      const editBtn = firstRow.locator('button').first();
      await editBtn.click();
      await page.waitForTimeout(700);
      await shot(page, '05-funcionarios-editar');
      await page.getByRole('button', { name: /cancelar/i }).first().click().catch(() => {});
    }, '05-funcionarios-editar');
  });

  test('06 — questionários', async ({ page }) => {
    await page.goto('/cadastros/questionarios');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, '06-questionarios-lista');

    // Novo
    await page
      .getByRole('button', { name: /^\+?\s*novo question[áa]rio$|novo question[áa]rio|\+\s*adicionar/i })
      .first()
      .click();
    await page.waitForTimeout(800);
    await shot(page, '06-questionarios-novo-vazio');

    // Tentar abrir o seletor de "adicionar campo"
    await safeClick(page, async () => {
      await fillField(page, /t[íi]tulo|^nome$/i, 'Avaliação Semestral (exemplo)').catch(() => {});
      const addBtn = page
        .getByRole('button', { name: /adicionar campo|\+\s*campo|nova pergunta|adicionar pergunta/i })
        .first();
      if (await addBtn.count()) {
        await addBtn.click();
        await page.waitForTimeout(600);
        await shot(page, '06-questionarios-add-campo');
        // Escolhe um tipo (texto/input)
        const tipoBtn = page.getByRole('button', { name: /texto|input/i }).first();
        if (await tipoBtn.count()) await tipoBtn.click();
        await page.waitForTimeout(600);
        await shot(page, '06-questionarios-construtor');
      }
    }, '06-questionarios-builder');

    // Preview
    await safeClick(page, async () => {
      const previewBtn = page
        .getByRole('button', { name: /pr[ée]-?visualizar|preview|visualizar/i })
        .first();
      if (await previewBtn.count()) {
        await previewBtn.click();
        await page.waitForTimeout(700);
        await shot(page, '06-questionarios-preview');
        await page.keyboard.press('Escape');
      }
    }, '06-questionarios-preview');

    // JSON
    await safeClick(page, async () => {
      const jsonBtn = page.getByRole('button', { name: /^json$|editor json|ver json/i }).first();
      if (await jsonBtn.count()) {
        await jsonBtn.click();
        await page.waitForTimeout(500);
        await shot(page, '06-questionarios-json');
      }
    }, '06-questionarios-json');

    await page.getByRole('button', { name: /cancelar|fechar/i }).first().click().catch(() => {});
  });

  test('07 — responder questionário', async ({ page }) => {
    await page.goto('/questionarios/listar');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await shot(page, '07-responder-lista');

    await safeClick(page, async () => {
      const responder = page
        .locator('table button[title="Responder"], table button[title*="Responder" i]')
        .first();
      if (await responder.count()) {
        await responder.click();
      } else {
        // fallback: botão por papel
        await page.getByRole('button', { name: /responder/i }).first().click();
      }
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(700);
      await shot(page, '07-responder-form');

      // Tenta gerar erro de validação clicando enviar sem preencher
      const submit = page.getByRole('button', { name: /enviar|salvar/i }).first();
      if (await submit.count()) {
        await submit.click();
        await page.waitForTimeout(800);
        await shot(page, '07-responder-erro');
      }

      // Tentar preencher minimamente e enviar
      const inputs = page.locator('main input:visible, main textarea:visible');
      const n = await inputs.count();
      for (let i = 0; i < Math.min(n, 6); i++) {
        await inputs.nth(i).fill('Resposta de exemplo').catch(() => {});
      }
      // selects
      const selects = page.locator('main select:visible');
      const ns = await selects.count();
      for (let i = 0; i < ns; i++) {
        const opts = await selects.nth(i).locator('option').all();
        if (opts.length > 1) {
          const v = await opts[1]!.getAttribute('value');
          if (v) await selects.nth(i).selectOption(v).catch(() => {});
        }
      }
      // Selecionar aluno se houver
      const submit2 = page.getByRole('button', { name: /enviar|salvar/i }).first();
      if (await submit2.count()) {
        await submit2.click();
        await page.waitForTimeout(2000);
        await shot(page, '07-responder-sucesso');
      }
    }, '07-responder');
  });

  test('08 — respostas', async ({ page }) => {
    await page.goto('/acompanhamentos/respostas-questionarios');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, '08-respostas-seletor');

    await safeClick(page, async () => {
      const select = page.locator('select').first();
      const opts = await select.locator('option').all();
      if (opts.length > 1) {
        const v = await opts[1]!.getAttribute('value');
        if (v) await select.selectOption(v);
        await page.waitForTimeout(900);
        await shot(page, '08-respostas-tabela');
      }
      // Stats: tenta expandir
      const stats = page.getByRole('button', { name: /estat[íi]sticas/i }).first();
      if (await stats.count()) {
        await stats.click();
        await page.waitForTimeout(500);
        await shot(page, '08-respostas-stats');
      }
      // Detalhe da primeira resposta
      const firstView = page.locator('tbody tr').first().getByRole('button').first();
      if (await firstView.count()) {
        await firstView.click();
        await page.waitForTimeout(800);
        await shot(page, '08-respostas-detalhe');
        await page.getByRole('button', { name: /fechar|cancelar/i }).first().click().catch(() => {});
      }
    }, '08-respostas');

    // Respostas por aluno
    await safeClick(page, async () => {
      await page.goto('/cadastros/alunos');
      await page.waitForLoadState('networkidle').catch(() => {});
      const firstRow = page.locator('tbody tr').first();
      const buttons = firstRow.locator('button');
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const t = await buttons.nth(i).getAttribute('title');
        if (t && /resposta/i.test(t)) {
          await buttons.nth(i).click();
          await page.waitForLoadState('networkidle').catch(() => {});
          await page.waitForTimeout(700);
          await shot(page, '08-respostas-por-aluno');
          return;
        }
      }
      // fallback: tenta navegar via URL conhecido (1)
      await page.goto('/alunos/1/respostas');
      await page.waitForTimeout(700);
      await shot(page, '08-respostas-por-aluno');
    }, '08-respostas-por-aluno');
  });

  test('09 — agenda', async ({ page }) => {
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
    await shot(page, '09-agenda-mes');

    await safeClick(page, async () => {
      const novo = page
        .getByRole('button', { name: /\+\s*adicionar|novo evento|criar|agendar/i })
        .first();
      if (await novo.count()) {
        await novo.click();
        await page.waitForTimeout(700);
        await shot(page, '09-agenda-novo');
        await page.getByRole('button', { name: /cancelar|fechar/i }).first().click().catch(() => {});
      }
    }, '09-agenda-novo');

    // Evento a partir de aluno
    await safeClick(page, async () => {
      await page.goto('/cadastros/alunos');
      await page.waitForLoadState('networkidle').catch(() => {});
      const firstRow = page.locator('tbody tr').first();
      const buttons = firstRow.locator('button');
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const t = await buttons.nth(i).getAttribute('title');
        if (t && /agend|visit|evento/i.test(t)) {
          await buttons.nth(i).click();
          await page.waitForLoadState('networkidle').catch(() => {});
          await page.waitForTimeout(900);
          await shot(page, '09-agenda-evento-aluno');
          return;
        }
      }
    }, '09-agenda-evento-aluno');
  });

  test('10 — relatórios (modais de cada lista)', async ({ page }) => {
    const triggers = [
      { url: '/cadastros/alunos', name: '10-relatorios-modal-alunos' },
      { url: '/cadastros/empresas', name: '10-relatorios-modal-empresas' },
      { url: '/cadastros/funcionarios', name: '10-relatorios-modal-funcionarios' },
      { url: '/acompanhamentos/respostas-questionarios', name: '10-relatorios-modal-respostas' },
    ];
    for (const t of triggers) {
      await safeClick(page, async () => {
        await page.goto(t.url);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);
        // Para a tela de respostas, é preciso selecionar um questionário primeiro
        if (t.url.includes('respostas-questionarios')) {
          const sel = page.locator('select').first();
          const opts = await sel.locator('option').all();
          if (opts.length > 1) {
            const v = await opts[1]!.getAttribute('value');
            if (v) await sel.selectOption(v);
            await page.waitForTimeout(700);
          }
        }
        const btn = page
          .getByRole('button', { name: /relat[óo]rio|gerar relat[óo]rio|baixar/i })
          .first();
        if (await btn.count()) {
          await btn.click();
          await page.waitForTimeout(700);
          await shot(page, t.name);
          await page.getByRole('button', { name: /cancelar|fechar/i }).first().click().catch(() => {});
        }
      }, t.name);
    }
  });

  test('11 — SMTP', async ({ page }) => {
    await page.goto('/configuracao/smtp');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await shot(page, '11-smtp-vazio');

    await safeClick(page, async () => {
      await fillField(page, /host/i, 'smtp.gmail.com');
      await fillField(page, /porta/i, '587');
      await fillField(page, /usu[áa]rio|user/i, 'sistema@exemplo.com');
      await fillField(page, /senha/i, 'app-password-aqui').catch(() => {});
      await fillField(page, /de|from email|email de/i, 'sistema@exemplo.com').catch(() => {});
      await page.waitForTimeout(400);
      await shot(page, '11-smtp-preenchido');

      // Testar conexão — sucesso (mailpit) e erro (host inválido)
      const testBtn = page.getByRole('button', { name: /testar/i }).first();
      if (await testBtn.count()) {
        // Configura para mailpit (sucesso)
        await fillField(page, /host/i, 'localhost').catch(() => {});
        await fillField(page, /porta/i, '1025').catch(() => {});
        await testBtn.click();
        await page.waitForTimeout(2500);
        await shot(page, '11-smtp-teste-ok');

        // Configura host inválido (erro)
        await fillField(page, /host/i, 'invalido.example.test').catch(() => {});
        await testBtn.click();
        await page.waitForTimeout(2500);
        await shot(page, '11-smtp-teste-erro');
      }
    }, '11-smtp');
  });
});

// =============================================================================
// Comparação de sidebar — ADM vs PROF
// =============================================================================
test.describe('sidebar — comparação', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('00 — sidebar ADM e PROF', async ({ browser }) => {
    for (const [email, pwd, suffix] of [
      ['admin@nexo.com', 'admin123', 'adm'],
      ['professor@nexo.com', 'prof123', 'prof'],
    ] as const) {
      const ctx = await browser.newContext({ viewport: { width: 360, height: 900 } });
      const page = await ctx.newPage();
      try {
        await page.goto('/login');
        await page.getByLabel(/e-?mail/i).fill(email);
        await page.getByLabel(/senha/i).fill(pwd);
        await page.getByRole('button', { name: /^entrar$/i }).click();
        await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        // Abrir o menu mobile se necessário
        const toggle = page.getByRole('button', { name: /menu/i }).first();
        if (await toggle.count()) await toggle.click().catch(() => {});
        await page.waitForTimeout(500);

        // Expandir todas as seções
        const sections = await page
          .getByRole('button', { name: /cadastros|acompanhamentos|agenda|configura[çc]/i })
          .all();
        for (const s of sections) await s.click().catch(() => {});
        await page.waitForTimeout(400);

        await page.screenshot({
          path: path.join(SHOTS, `00-sidebar-${suffix}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        console.log(`[manual] OK: 00-sidebar-${suffix}.png`);
      } catch (e) {
        console.warn(`[manual] sidebar-${suffix} falhou:`, (e as Error).message);
      } finally {
        await ctx.close();
      }
    }
  });
});
