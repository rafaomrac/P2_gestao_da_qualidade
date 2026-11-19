"use strict";

/**
 * CASOS DE TESTE: CT-S01 e CT-S02
 * Modalidade: Teste de Segurança Básica (Não Destrutivo)
 *
 * Objetivo:
 *   1. CT-S01: Validar os controles de autorização e autenticação do sistema (RN-10 e RN-11):
 *      - Proteção de rotas administrativas contra clientes comuns (403 Forbidden).
 *      - Bloqueio de rotas protegidas para requisições anônimas (401 Unauthorized).
 *      - Isolamento na listagem de pedidos por usuário.
 *      - Acesso permitido para administradores autenticados (controle positivo).
 *   2. CT-S02: Validar o tratamento de entradas e sanitização contra ataques comuns:
 *      - Cadastro com e-mail malformado ou senha curta.
 *      - Rejeição de corpo JSON malformado sem vazar stack trace.
 *      - Tratamento seguro de SQL Injection nos campos de login.
 *      - Rejeição de injeção em campos numéricos de carrinho.
 *      - Prevenção de execução/reflexão de tags <script> (XSS).
 *      - Bloqueio de Directory Traversal no servidor estático.
 *
 * Ambiente:
 *   Execução local estritamente autorizada contra cópia descartável da base de dados.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers/servidor");

let ctx;
let tokenA;
let tokenAdmin;

test.before(async () => {
  ctx = await iniciar("aurora-seguranca");
  tokenA = await ctx.login("cliente-a@loja.test");
  tokenAdmin = await ctx.login("admin@loja.test");
});

test.after(async () => {
  if (ctx) await ctx.parar();
});

// ============================================================================
// CT-S01: CONTROLE DE ACESSO E AUTORIZAÇÃO (RN-10 e RN-11)
// ============================================================================

test("CT-S01 passo 1 (RN-10): consulta de pedidos sem autenticação é bloqueada com HTTP 401", async () => {
  // Usuário anônimo não pode acessar histórico de pedidos
  const r = await ctx.chamar("GET", "/api/orders");
  assert.equal(r.status, 401, "Acesso a /api/orders sem login deve responder 401 Unauthorized");
});

test("CT-S01 passo 2 (RN-10): listagem de pedidos do cliente autenticado isola registros de terceiros", async () => {
  // O cliente-a deve receber somente os seus próprios pedidos
  const r = await ctx.chamar("GET", "/api/orders", { token: tokenA });
  assert.equal(r.status, 200);
  assert.ok(
    r.json.every((pedido) => pedido.userId === "cliente-a"),
    "A listagem de pedidos vazou pedidos pertencentes a outro cliente"
  );
});

test("CT-S01 passo 3 (RN-11): cliente comum não acessa a listagem administrativa de pedidos (403)", async () => {
  // Controle de acesso vertical: /api/admin/orders exige perfil 'admin'
  const r = await ctx.chamar("GET", "/api/admin/orders", { token: tokenA });
  assert.equal(r.status, 403, "Cliente comum deve receber 403 Forbidden");
});

test("CT-S01 passo 4 (RN-11): cliente comum não tem permissão para cadastrar novos produtos (403)", async () => {
  // Inclusão de produtos é restrita a administradores
  const r = await ctx.chamar("POST", "/api/admin/products", {
    token: tokenA,
    corpo: { name: "Produto Indevido", price: 10, stock: 10 },
  });
  assert.equal(r.status, 403, "Criação de produto por cliente deve retornar 403 Forbidden");
});

test("CT-S01 passo 5 (RN-11): listagem de produtos administrativos é bloqueada para clientes comuns (403)", async () => {
  // Rota administrativa de produtos não deve ser aberta a clientes
  const r = await ctx.chamar("GET", "/api/admin/products", { token: tokenA });
  assert.equal(r.status, 403, "Acesso de cliente comum a /api/admin/products deve retornar 403");
});

test("CT-S01 passo 6 (RN-11): requisição não autenticada a rotas administrativas responde HTTP 401", async () => {
  // Tentativa anônima de listar pedidos administrativos
  const r = await ctx.chamar("GET", "/api/admin/orders");
  assert.equal(r.status, 401, "Requisição sem token deve retornar 401 Unauthorized");
});

test("CT-S01 passo 7: tentativa de checkout sem autenticação é bloqueada com HTTP 401", async () => {
  // Fechamento de pedido exige cliente autenticado
  const r = await ctx.chamar("POST", "/api/checkout", {
    corpo: { items: [{ productId: "produto-teste", quantity: 1 }] },
  });
  assert.equal(r.status, 401, "Checkout sem login deve retornar 401 Unauthorized");
});

test("CT-S01 passo 8: administrador autenticado acessa e altera dados administrativos com sucesso", async () => {
  // Controle positivo: o administrador possui autorização legítima
  const r = await ctx.chamar("PUT", "/api/admin/products/produto-teste", {
    token: tokenAdmin,
    corpo: { stock: 5 },
  });
  assert.equal(r.status, 200, "Administrador deveria conseguir atualizar o produto");
  assert.equal(r.json.stock, 5);
});

// ============================================================================
// CT-S02: VALIDAÇÃO DE ENTRADAS E SANITIZAÇÃO
// ============================================================================

test("CT-S02 passo 1: cadastro com e-mail malformado é rejeitado com HTTP 400", async () => {
  // Validação de formato de e-mail (rejeição de strings inválidas)
  const r = await ctx.chamar("POST", "/api/auth/register", {
    corpo: { name: "Aluno Teste", email: "email-invalido-sem-arroba", password: "SenhaValida123" },
  });
  assert.equal(r.status, 400, "E-mail malformado deve retornar 400 Bad Request");
});

test("CT-S02 passo 2: cadastro com senha curta (< 6 caracteres) é rejeitado com HTTP 400", async () => {
  // Validação de política mínima de segurança de senha
  const r = await ctx.chamar("POST", "/api/auth/register", {
    corpo: { name: "Aluno Teste", email: `curta.${Date.now()}@loja.test`, password: "123" },
  });
  assert.equal(r.status, 400, "Senha curta deve ser rejeitada com 400");
});

test("CT-S02 passo 3: corpo JSON malformado é rejeitado sem vazar stack trace do Node.js", async () => {
  // O servidor deve interceptar erro de parser de JSON sem expor código ou pilha interna
  const r = await ctx.chamar("POST", "/api/auth/login", {
    bruto: "{ jsonQuebrado: semFechamento",
  });
  assert.equal(r.status, 400, "JSON inválido deve retornar 400");
  assert.ok(!/at .*\.js/.test(r.texto), "A resposta não deve vazar pilha de execução interna");
});

test("CT-S02 passo 4: tentativa de SQL Injection nos campos de login é tratada com segurança", async () => {
  // Entradas com caracteres de injeção são tratadas como strings literais, retornando 401 sem falha de servidor (500)
  const r = await ctx.chamar("POST", "/api/auth/login", {
    corpo: { email: "' OR '1'='1", password: "' OR '1'='1" },
  });
  assert.equal(r.status, 401, "Tentativa de injeção deve ser tratada como credencial inválida");
});

test("CT-S02 passo 5: payload malicioso em campo numérico de quantidade é rejeitado com HTTP 400", async () => {
  // Prevenção contra injeção de comandos ou tipos inválidos na validação de quantidade
  const r = await ctx.chamar("POST", "/api/cart/quote", {
    corpo: { items: [{ productId: "produto-teste", quantity: "1; DROP TABLE users;" }] },
  });
  assert.equal(r.status, 400, "Entrada maliciosa em quantidade deve retornar 400");
});

test("CT-S02 passo 6: tag <script> em identificador de produto não é executada nem refletida", async () => {
  // Prevenção contra Cross-Site Scripting (XSS)
  const r = await ctx.chamar("POST", "/api/cart/quote", {
    corpo: { items: [{ productId: "<script>alert(1)</script>", quantity: 1 }] },
  });
  assert.ok([400, 404].includes(r.status));
  assert.ok(!r.texto.includes("<script>"), "A resposta não deve refletir scripts sem sanitização");
});

test("CT-S02 passo 7: tentativa de Directory Traversal no servidor estático não expõe arquivos do sistema", async () => {
  // Tentativa de fuga de diretório estático: /..%2f..%2fserver.js
  const r = await ctx.chamar("GET", "/..%2f..%2fserver.js");
  assert.ok([400, 403, 404].includes(r.status));
  assert.ok(!r.texto.includes("createServer"), "Código-fonte do servidor não pode ser exposto");
});
