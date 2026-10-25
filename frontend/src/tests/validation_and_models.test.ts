import { describe, expect, it } from 'vitest';

function validateAccountCode(code: string): boolean {
  return /^[A-Za-z0-9:_\-.]{3,64}$/.test(code);
}

function validateAmountPrecision(amount: string, currency: string): boolean {
  if (!amount || amount.trim() === '') return false;
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return false;

  const parts = amount.split('.');
  if (currency === 'IDR') {
    return parts.length === 1; // No decimal places allowed for IDR
  }
  if (currency === 'USD' || currency === 'EUR') {
    return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
  }
  return false;
}

function isLegalTransactionTransition(from: string, to: string): boolean {
  if (from === 'posted' && to === 'published') return true;
  if (from === 'published' && to === 'processed') return true;
  return false;
}

describe('Domain Model & Input Validation Rules', () => {
  it('validates account code constraints (regex: ^[A-Za-z0-9:_\\-.]{3,64}$)', () => {
    expect(validateAccountCode('USER:ALICE:01')).toBe(true);
    expect(validateAccountCode('SYS_WORLD_CLEARING')).toBe(true);
    expect(validateAccountCode('CUST-MERCHANT.MAIN')).toBe(true);
    expect(validateAccountCode('AB')).toBe(false); // too short (< 3)
    expect(validateAccountCode('A'.repeat(65))).toBe(false); // too long (> 64)
    expect(validateAccountCode('INVALID CODE WITH SPACES')).toBe(false);
    expect(validateAccountCode('INVALID$SPECIAL%CHARS')).toBe(false);
  });

  it('enforces strict per-currency decimal precision rules', () => {
    // USD / EUR allows up to 2 decimal places
    expect(validateAmountPrecision('100', 'USD')).toBe(true);
    expect(validateAmountPrecision('100.50', 'USD')).toBe(true);
    expect(validateAmountPrecision('100.505', 'USD')).toBe(false); // excess precision
    expect(validateAmountPrecision('-50.00', 'USD')).toBe(false); // negative
    expect(validateAmountPrecision('0.00', 'USD')).toBe(false); // zero

    // IDR prohibits fractions
    expect(validateAmountPrecision('500000', 'IDR')).toBe(true);
    expect(validateAmountPrecision('500000.50', 'IDR')).toBe(false); // fraction prohibited
  });

  it('restricts transaction state progression to single forward steps', () => {
    expect(isLegalTransactionTransition('posted', 'published')).toBe(true);
    expect(isLegalTransactionTransition('published', 'processed')).toBe(true);
    expect(isLegalTransactionTransition('posted', 'processed')).toBe(false); // cannot skip published
    expect(isLegalTransactionTransition('processed', 'posted')).toBe(false); // cannot move backward
    expect(isLegalTransactionTransition('posted', 'posted')).toBe(false); // no-op transition
  });
});
