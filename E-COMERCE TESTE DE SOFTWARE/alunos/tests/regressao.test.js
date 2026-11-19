"use strict";

/**
 * CASOS DE TESTE: CT-CONF01 (Reteste / Confirmação) e CT-R01 a CT-R03 (Regressão)
 *
 * Objetivo:
 *   1. CT-CONF01: Reexecutar exatamente o cenário que falhou no BUG-01 para comprovar
 *      que a correção funcionou (rejeição de compra acima do estoque físico).
 *   2. CT-R01 a CT-R03: Garantir que a alteração no módulo de validação de quantidade
 *      não quebrou nenhuma funcionalidade adjacente (regressão de software).
 *
 * Rastreabilidade:
 *   - RF-05: Carrinho de compras
 *   - RF-06: Controle de estoque
 *   - RF-09: Finalização de compra
 *   - RN-01 / RN-02 / RN-03 / RN-05: Regras financeiras e limites de quantidade
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { iniciar, ENDERECO_VALIDO } = require("./helpers/servidor");

let ctx;
let token;

test.before(async () => {
  // Inicializa servidor em porta dinâmica com banco temporário isolado
  ctx = await iniciar("aurora-regressao");
  token = await ctx.login("cliente-a@loja.test");
});

test.after(async () => {
  if (ctx) await ctx.parar();
});

// Funções utilitárias para simulação direta nas APIs
const cotar = (quantidade, couponCode) =>
  ctx.chamar("POST", "/api/cart/quote", {
    corpo: {
      items: [{ productId: "produto-teste", quantity: quantidade }],
      ...(couponCode ? { couponCode } : {}),
    },
  });

const finalizar = (quantidade) =>
  ctx.chamar("POST", "/api/checkout", {
    token,
    corpo: {
      items: [{ productId: "produto-teste", quantity: quantidade }],
      address: ENDERECO_VALIDO,
    },
  });

// ============================================================================
// 1. TESTE DE CONFIRMAÇÃO (RETESTE DO BUG-01)
// ============================================================================

test("CT-CONF01 passo 1 (BUG-01): cotação com 6 unidades (estoque 5) deve ser rejeitada com HTTP 400", async () => {
  // Antes da correção: retornava 200 OK aceitando a cotação indevidamente.
  // Depois da correção: deve recusar com 400 e informar estoque insuficiente.
  const r = await cotar(6);
  assert.equal(r.status, 400, "Cotação acima do estoque deveria retornar status 400");
  assert.match(r.json.error, /estoque/i, "A mensagem de erro deve citar o estoque");
});

test("CT-CONF01 passo 2 (BUG-01): tentativa de checkout com 6 unidades (estoque 5) deve ser bloqueada", async () => {
  const r = await finalizar(6);
  assert.equal(r.status, 400, "Checkout acima do estoque deveria retornar status 400");
  assert.match(r.json.error, /estoque/i, "A mensagem deve indicar que a quantidade excede o estoque");
});

// ============================================================================
// 2. TESTES DE REGRESSÃO (ÁREAS IMPACTADAS PELA CORREÇÃO)
// ============================================================================

test("CT-R01 (RF-05, RN-03): valores-limite válidos continuam aceitos (1 e 5) e inválidos rejeitados (0 e 1.5)", async () => {
  // Garantir que os limites válidos de quantidade continuam operacionais
  const um = await cotar(1);
  const cinco = await cotar(5);
  assert.equal(um.status, 200, "Quantidade 1 (limite inferior) deve ser aceita");
  assert.equal(um.json.subtotal, 150, "Subtotal para 1 unidade deve ser R$ 150");
  assert.equal(cinco.status, 200, "Quantidade 5 (limite superior) deve ser aceita");
  assert.equal(cinco.json.subtotal, 750, "Subtotal para 5 unidades deve ser R$ 750");

  // Garantir que quantidades inválidas continuam sendo barradas
  assert.equal((await cotar(0)).status, 400, "Quantidade zero deve ser recusada");
  assert.equal((await cotar(1.5)).status, 400, "Quantidade fracionária deve ser recusada");
});

test("CT-R02 (RN-01, RN-02, RN-05): desconto automático, frete grátis e cupom permanecem íntegros", async () => {
  // Compra com subtotal >= R$ 300 deve receber 10% de desconto e frete grátis
  const dois = await cotar(2);
  assert.equal(dois.status, 200);
  assert.equal(dois.json.subtotal, 300);
  assert.equal(dois.json.discount, 30, "Desconto de 10% sobre R$ 300 deve ser R$ 30");
  assert.equal(dois.json.shipping, 0, "Frete para compra a partir de R$ 300 deve ser grátis");
  assert.equal(dois.json.total, 270, "Total final deve ser R$ 270");

  // Aplicação de cupom percentual de 5% sobre R$ 150 (desconto = R$ 7,50, frete = R$ 18,50)
  const cupom = await cotar(1, "CINCO");
  assert.equal(cupom.status, 200);
  assert.equal(cupom.json.discount, 7.5, "Desconto do cupom CINCO deve ser R$ 7,50");
  assert.equal(cupom.json.benefit, "cupom", "O benefício aplicado deve ser identificado como cupom");
  assert.equal(cupom.json.shipping, 18.5, "Frete abaixo de R$ 300 deve ser R$ 18,50");
  assert.equal(cupom.json.total, 161, "Total deve ser 150 - 7,50 + 18,50 = R$ 161,00");
});

test("CT-R03 (RF-09): finalização de compra no limite máximo do estoque (5 de 5) continua com sucesso", async () => {
  // Concluir pedido comprando 100% das unidades disponíveis
  const r = await finalizar(5);
  assert.equal(r.status, 201, "Compra no limite exato do estoque deve ser concluída com 201 Created");
  assert.equal(r.json.order.items[0].quantity, 5, "O pedido deve registrar as 5 unidades");
  assert.equal(r.json.order.subtotal, 750, "Subtotal deve ser R$ 750");
  assert.equal(r.json.order.userId, "cliente-a", "Pedido deve pertencer ao cliente autenticado");
});
