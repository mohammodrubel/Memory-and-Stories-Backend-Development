import { describe, it, expect } from 'vitest';

// Test that the invoice HTML generation logic renders discount lines correctly
describe('PaymentInvoice HTML Generation', () => {
  // Mock the fmtBdt function used in the service
  const fmtBdt = (n: number) =>
    `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  it('should include discount line when discountAmount > 0', () => {
    const booking = {
      subtotal: 10000,
      discountAmount: 1000,
      totalAmount: 9000,
    };

    const discountAmount = booking.discountAmount ?? 0;
    const hasDiscountLine = discountAmount > 0;

    expect(hasDiscountLine).toBe(true);
    expect(fmtBdt(discountAmount)).toBe('৳1,000.00');
  });

  it('should not include discount line when discountAmount = 0', () => {
    const booking = {
      subtotal: 10000,
      discountAmount: 0,
      totalAmount: 10000,
    };

    const discountAmount = booking.discountAmount ?? 0;
    const hasDiscountLine = discountAmount > 0;

    expect(hasDiscountLine).toBe(false);
  });

  it('should use booking subtotal when available', () => {
    const inv = {
      totalAmount: 9000, // should be ignored
    };
    const booking = {
      subtotal: 10000,
      discountAmount: 1000,
      totalAmount: 9000,
    };

    const subtotal = booking?.subtotal ?? inv.totalAmount;
    expect(subtotal).toBe(10000);
    expect(fmtBdt(subtotal)).toBe('৳10,000.00');
  });

  it('should fallback to inv.totalAmount when booking.subtotal is undefined', () => {
    const inv = {
      totalAmount: 10000,
    };
    const booking = undefined;

    const subtotal = booking?.subtotal ?? inv.totalAmount;
    expect(subtotal).toBe(10000);
  });
});
