/**
 * Re-captura das telas que ficaram faltando na primeira rodada:
 *   - 01-reset-preenchido, 01-reset-sucesso  (Mailpit retry + token)
 *   - 06-questionarios-preview               (botão da lista, não do modal)
 *   - 11-smtp-preenchido, 11-smtp-teste-ok, 11-smtp-teste-erro
 *                                            (labels reais do form de SMTP)
 *
 * Rodar com:
 *   bun run manual:capture -- e2e/manual/fix.spec.ts
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(__dirname, '../../../docs/manual/assets/images');

// Cada describe é independente; falha em um não cancela os outros.

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.screenshot({
    path: path.join(SHOTS, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  console.log(`[manual-fix] OK: ${name}.png`);
}

// ---------------------------------------------------------------------------
// SMTP — labels reais: "Servidor SMTP *", "Porta *", "Usuário *", "Senha *",
//                      "Email Remetente *", "Nome do Remetente"
// ---------------------------------------------------------------------------
test.describe('fix: SMTP', () => {
  test('11 — preenchido, teste OK e teste erro', async ({ page }) => {
    await page.goto('/configuracao/smtp');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(700);

    await page.locator('#host').fill('smtp.gmail.com');
    await page.locator('#port').fill('587');
    await page.locator('#user').fill('sistema@exemplo.com');
    await page.locator('#password').fill('app-password-aqui');
    await page.locator('#from_email').fill('sistema@exemplo.com');
    await page.locator('#from_name').fill('Sistema NEXO').catch(() => {});
    await page.waitForTimeout(400);
    await shot(page, '11-smtp-preenchido');

    // Configura mailpit (sucesso) e testa
    await page.locator('#host').fill('localhost');
    await page.locator('#port').fill('1025');
    await page.locator('#user').fill('');
    await page.locator('#password').fill('');
    const testBtn = page.getByRole('button', { name: /testar/i }).first();
    await testBtn.click().catch(() => {});
    await page.waitForTimeout(3000);
    await shot(page, '11-smtp-teste-ok');

    // Host inválido (erro)
    await page.locator('#host').fill('invalido.example.test');
    await testBtn.click().catch(() => {});
    await page.waitForTimeout(4000);
    await shot(page, '11-smtp-teste-erro');
  });
});

// ---------------------------------------------------------------------------
// Questionário — preview
// O botão "Visualizar" (title="Visualizar") é um row-action na lista.
// ---------------------------------------------------------------------------
test.describe('fix: questionário preview', () => {
  test('06 — preview a partir da lista', async ({ page }) => {
    await page.goto('/cadastros/questionarios');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);

    // Em DataTable, há um botão mobile (md:hidden) E um desktop (hidden md:block).
    // O `.first()` pega o mobile, que está display:none. Escopar para a tabela:
    const preview = page.locator('table button[title="Visualizar"]').first();
    await preview.click();
    await page.waitForTimeout(800);
    await shot(page, '06-questionarios-preview');
  });
});

// ---------------------------------------------------------------------------
// Reset password — usa Mailpit para extrair token
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Sidebar — comparação ADM vs PROF (recaptura com viewport desktop)
// No mobile (<1024px) o menu fica escondido atrás do hambúrguer. Usamos
// viewport 1280x900 e recortamos a faixa esquerda (w-64 = 256px).
// ---------------------------------------------------------------------------
test.describe('fix: sidebar', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('00 — sidebar ADM e PROF (desktop)', async ({ browser }) => {
    for (const [email, pwd, suffix] of [
      ['admin@nexo.com', 'admin123', 'adm'],
      ['professor@nexo.com', 'prof123', 'prof'],
    ] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      try {
        await page.goto('/login');
        await page.getByLabel(/e-?mail/i).fill(email);
        await page.getByLabel(/senha/i).fill(pwd);
        await page.getByRole('button', { name: /^entrar$/i }).click();
        await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        // Todas as seções já vêm expandidas por padrão (Layout.tsx). Apenas
        // aguarda animações/render terminarem.
        await page.waitForTimeout(700);

        // Captura o sidebar: clip 256x900 a partir do canto superior esquerdo
        await page.screenshot({
          path: path.join(SHOTS, `00-sidebar-${suffix}.png`),
          clip: { x: 0, y: 0, width: 256, height: 900 },
          animations: 'disabled',
        });
        console.log(`[manual-fix] OK: 00-sidebar-${suffix}.png`);
      } catch (e) {
        console.warn(`[manual-fix] sidebar-${suffix} falhou:`, (e as Error).message);
      } finally {
        await ctx.close();
      }
    }
  });
});

test.describe('fix: reset password', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('01 — reset preenchido', async ({ page }) => {
    // O formulário de redefinição renderiza independentemente da validade
    // do token (validação só acontece no submit). Captura visual do formulário
    // preenchido — não executamos o submit aqui para evitar invalidar a senha
    // do admin@nexo.com (que outros screenshots dependem).
    await page.goto('/reset-password?token=demo-screenshot');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(300);

    await page.locator('#password').fill('NovaSenha@2026');
    await page.locator('#confirmPassword').fill('NovaSenha@2026');
    await page.waitForTimeout(300);
    await shot(page, '01-reset-preenchido');
  });
});
