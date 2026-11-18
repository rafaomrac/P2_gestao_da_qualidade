
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { automaticDiscount } = require("../src/domain/discount");
const { validateQuantity } = require("../src/domain/quantity");
const { percentOf } = require("../src/domain/money");


test("unitário: abaixo de 200 não há desconto", () => {
  assert.equal(automaticDiscount(199.99), 0);
});


test("unitário: exatamente 200 recebe 10%", () => {
  assert.equal(automaticDiscount(200), 20);
});


test("unitário: quantidade negativa é inválida", () => {
  assert.equal(validateQuantity(-1).ok, false);
});


test("unitário: meio centavo arredonda para cima", () => {
  assert.equal(percentOf(200.05, 10), 20.01);
});
