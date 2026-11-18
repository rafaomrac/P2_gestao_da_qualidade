
"use strict";

function validateQuantity(quantity) {
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    !Number.isInteger(quantity)
  ) {
    return {
      ok: false,
      message: "Quantidade inválida"
    };
  }

  return {
    ok: true,
    quantity
  };
}

module.exports = {
  validateQuantity
};
