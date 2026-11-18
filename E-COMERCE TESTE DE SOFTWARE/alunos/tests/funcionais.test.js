
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { quoteLines } = require("../src/domain/pricing");


function cotar(preco, quantidade = 1) {
  return quoteLines({
    lines: [
      {
        productId: "produto-teste",
        name: "Produto Teste",
        unitPrice: preco,
        quantity: quantidade
      }
    ]
  });
}


test("funcional: compra de 300 tem desconto e frete grátis", () => {
  const r = cotar(150, 2);

  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 300);
  assert.equal(r.discount, 30);
  assert.equal(r.shipping, 0);
  assert.equal(r.total, 270);
});


test("funcional: abaixo de 300 frete custa 18,50", () => {
  const r = cotar(100);

  assert.equal(r.ok, true);
  assert.equal(r.shipping, 18.5);
  assert.equal(r.total, 118.5);
});
