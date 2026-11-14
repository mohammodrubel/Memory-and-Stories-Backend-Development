"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseBestDiscount = exports.computeDiscountAmount = exports.round2 = void 0;
const round2 = (n) => {
    return Math.round((n + Number.EPSILON) * 100) / 100;
};
exports.round2 = round2;
const computeDiscountAmount = (input) => {
    const { subtotal, type, value, maxDiscountAmount } = input;
    if (value <= 0 || subtotal <= 0)
        return 0;
    let raw;
    if (type === 'FLAT') {
        raw = value;
    }
    else {
        raw = (subtotal * value) / 100;
        if (maxDiscountAmount != null && maxDiscountAmount > 0) {
            raw = Math.min(raw, maxDiscountAmount);
        }
    }
    raw = Math.min(raw, subtotal);
    return (0, exports.round2)(raw);
};
exports.computeDiscountAmount = computeDiscountAmount;
const chooseBestDiscount = (a, b) => {
    if (!a)
        return b;
    if (!b)
        return a;
    return a.amount >= b.amount ? a : b;
};
exports.chooseBestDiscount = chooseBestDiscount;
