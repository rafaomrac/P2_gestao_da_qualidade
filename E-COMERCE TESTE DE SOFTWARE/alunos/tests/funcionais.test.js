"use strict";

/**
 * TESTES FUNCIONAIS: Regras de Cotação de Preço e Frete
 * Rastreabilidade: RF-05, RN-01 (Desconto 10%), RN-02 (Frete Grátis e Frete Padrão)
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { quoteLines } = require("../src/domain/pricing");

/**
 * Função auxiliar para simular uma linha de cotação
 */
function cotar(preco, quantidade = 1) {
  return quoteLines({
    lines: [
      {
        productId: "produto-teste",
        name: "Produto Teste",
        unitPrice: preco,
        quantity: quantidade,
      },
    ],
  });
}

// RN-01 e RN-02: Subtotal de R$ 300,00 tem direito a 10% de desconto e frete grátis
test("funcional: compra de 300 tem desconto e frete grátis", () => {
  const r = cotar(150, 2);

  assert.equal(r.ok, true, "Cotação deve retornar ok: true");
  assert.equal(r.subtotal, 300, "Subtotal deve ser R$ 300,00");
  assert.equal(r.discount, 30, "Desconto deve ser R$ 30,00 (10%)");
  assert.equal(r.shipping, 0, "Frete deve ser grátis (R$ 0,00)");
  assert.equal(r.total, 270, "Total final deve ser R$ 270,00 (300 - 30)");
});

// RN-02: Subtotal abaixo de R$ 300,00 paga taxa fixa de frete de R$ 18,50
test("funcional: abaixo de 300 frete custa 18,50", () => {
  const r = cotar(100);

  assert.equal(r.ok, true);
  assert.equal(r.shipping, 18.5, "Frete abaixo de 300 deve custar R$ 18,50");
  assert.equal(r.total, 118.5, "Total deve ser 100 + 18,50 = R$ 118,50");
});
