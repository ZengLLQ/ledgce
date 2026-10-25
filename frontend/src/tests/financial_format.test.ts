import { describe, expect, it } from 'vitest';

export function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  if (currency === 'IDR') {
    return `IDR ${Math.trunc(num).toLocaleString('id-ID')}`;
  }
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateTransferInvariants(debit: string, credit: string): boolean {
  const d = parseFloat(debit);
  const c = parseFloat(credit);
  if (isNaN(d) || isNaN(c)) return false;
  return Math.abs(d - c) < 0.000001 && d > 0;
}

export function validateIdempotencyKey(key: string): boolean {
  return key.trim().length >= 8 && key.trim().length <= 128;
}

describe('Financial Invariants & Formatting Unit Tests', () => {
  it('formats USD and EUR with exact two decimal places', () => {
    expect(formatCurrency('1250.5', 'USD')).toBe('USD 1,250.50');
    expect(formatCurrency('0', 'EUR')).toBe('EUR 0.00');
    expect(formatCurrency('999999.99', 'USD')).toBe('USD 999,999.99');
  });

  it('formats IDR without decimal places', () => {
    expect(formatCurrency('5000000', 'IDR')).toContain('5.000.000');
  });

  it('validates double-entry balancing strictly', () => {
    expect(validateTransferInvariants('250.00', '250.00')).toBe(true);
    expect(validateTransferInvariants('250.00', '250.01')).toBe(false);
    expect(validateTransferInvariants('0.00', '0.00')).toBe(false); // zero amount prohibited
    expect(validateTransferInvariants('-50.00', '-50.00')).toBe(false); // negative prohibited
  });

  it('enforces idempotency key constraints', () => {
    expect(validateIdempotencyKey('short')).toBe(false);
    expect(validateIdempotencyKey('valid-idempotency-key-1234')).toBe(true);
    expect(validateIdempotencyKey('a'.repeat(129))).toBe(false);
  });
});
