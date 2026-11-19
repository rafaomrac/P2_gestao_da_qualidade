
"use strict";

const { percentOf } = require("./money");

const AUTO_DISCOUNT_MIN_SUBTOTAL = 200;
const AUTO_DISCOUNT_PERCENT = 10;

function automaticDiscount(subtotal) {
  const value = Number(subtotal);

  if (
    subtotal === null ||
    subtotal === undefined ||
    subtotal === "" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error("Subtotal inválido.");
  }

  if (value < AUTO_DISCOUNT_MIN_SUBTOTAL) {
    return 0;
  }

  return percentOf(value, AUTO_DISCOUNT_PERCENT);
}

module.exports = {
  automaticDiscount,
  AUTO_DISCOUNT_MIN_SUBTOTAL,
  AUTO_DISCOUNT_PERCENT
};
