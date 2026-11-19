# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: usabilidade.spec.cjs >> acessibilidade: Nome possui rótulo associado
- Location: tests\interface\usabilidade.spec.cjs:9:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#register-form').getByLabel('Nome', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#register-form').getByLabel('Nome', { exact: true }) with timeout 5000ms
  - waiting for locator('#register-form').getByLabel('Nome', { exact: true })

```

```yaml
- link "Ir para o conteúdo":
  - /url: "#conteudo"
- banner:
  - link "Loja Aurora":
    - /url: "#catalogo"
  - searchbox "Buscar no catálogo"
  - navigation "Principal":
    - link "Catálogo":
      - /url: "#catalogo"
    - link "Carrinho 0":
      - /url: "#carrinho"
    - link "Pedidos":
      - /url: "#pedidos"
    - link "Entrar":
      - /url: "#entrar"
- paragraph
- main:
  - heading "Cadastro" [level=1]
  - text: Nome
  - textbox "Nome"
  - text: E-mail
  - textbox "E-mail"
  - text: Senha
  - textbox "Senha"
  - button "Criar conta"
  - paragraph
- contentinfo:
  - paragraph: Loja Aurora — ambiente local com dados fictícios.
```

# Test source

```ts
  1  | const { test,expect } = require('@playwright/test');
  2  | const AxeBuilder = require('@axe-core/playwright').default;
  3  | test('acessibilidade: cadastro sem violações automatizadas detectadas', async ({page}) => {
  4  |   await page.goto('/#cadastro');
  5  |   await expect(page.locator('#view-register')).toBeVisible();
  6  |   const resultado = await new AxeBuilder({page}).analyze();
  7  |   expect(resultado.violations).toEqual([]);
  8  | });
  9  | test('acessibilidade: Nome possui rótulo associado', async ({page}) => {
  10 |   await page.goto('/#cadastro');
  11 |   await expect(page.locator('#view-register')).toBeVisible();
> 12 |   await expect(page.locator('#register-form').getByLabel('Nome',{exact:true})).toBeVisible();
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
  13 | });
  14 | test('acessibilidade: adicionar produto pode receber foco por Tab', async ({page}) => {
  15 |   await page.goto('/#catalogo');
  16 |   const alvo = page.locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]');
  17 |   await expect(alvo).toBeVisible();
  18 |   await page.locator('#refresh-catalog').focus();
  19 |   await page.keyboard.press('Tab');
  20 |   await expect(alvo).toBeFocused();
  21 | });
```