import { describe, it, expect } from 'vitest';
import { Decimal } from '../../src/primitives/decimal';

describe('Decimal', () => {
  it('should handle precise addition', () => {
    const a = new Decimal(0.1);
    const b = new Decimal(0.2);
    const result = a.add(b);
    expect(result.toString()).toBe('0.3');
    expect(result.toNumber()).toBe(0.3);
  });

  it('should handle multiplication', () => {
    const a = new Decimal(2.5);
    const b = new Decimal(4);
    const result = a.mul(b);
    expect(result.toString()).toBe('10');
  });

  it('should handle comparison', () => {
    const a = new Decimal(10);
    const b = new Decimal(20);
    expect(a.lt(b)).toBe(true);
    expect(a.gt(b)).toBe(false);
    expect(a.equals(new Decimal(10))).toBe(true);
  });

  it('should work with static methods', () => {
    const result = Decimal.add(0.1, 0.2);
    expect(result.toString()).toBe('0.3');
  });

  it('should handle string input', () => {
    const d = new Decimal('123.456');
    expect(d.toString()).toBe('123.456');
  });
});






