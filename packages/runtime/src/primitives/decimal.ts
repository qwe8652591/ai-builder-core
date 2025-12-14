import DecimalJS from 'decimal.js-light';
import type { Decimal as DecimalInterface, DecimalConstructor } from '@ai-builder/dsl';

// Configure global precision if needed
DecimalJS.set({ precision: 20 });

export class Decimal implements DecimalInterface {
  private _val: DecimalJS;

  constructor(value: string | number | DecimalInterface | Decimal) {
    if (value instanceof Decimal) {
      this._val = value._val;
    } else if (typeof value === 'object' && 'toString' in value) {
      // Handle other Decimal-like objects or the interface mock
      this._val = new DecimalJS(value.toString());
    } else {
      this._val = new DecimalJS(value);
    }
  }

  add(other: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(this._val.plus(new Decimal(other as any)._val));
  }

  sub(other: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(this._val.minus(new Decimal(other as any)._val));
  }

  mul(other: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(this._val.times(new Decimal(other as any)._val));
  }

  div(other: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(this._val.div(new Decimal(other as any)._val));
  }

  equals(other: string | number | DecimalInterface): boolean {
    return this._val.equals(new Decimal(other as any)._val);
  }

  gt(other: string | number | DecimalInterface): boolean {
    return this._val.gt(new Decimal(other as any)._val);
  }

  gte(other: string | number | DecimalInterface): boolean {
    return this._val.gte(new Decimal(other as any)._val);
  }

  lt(other: string | number | DecimalInterface): boolean {
    return this._val.lt(new Decimal(other as any)._val);
  }

  lte(other: string | number | DecimalInterface): boolean {
    return this._val.lte(new Decimal(other as any)._val);
  }

  greaterThan(other: string | number | DecimalInterface): boolean {
    return this.gt(other);
  }

  lessThan(other: string | number | DecimalInterface): boolean {
    return this.lt(other);
  }

  toString(): string {
    return this._val.toString();
  }

  toJSON(): string {
    // 序列化为字符串，避免丢失精度
    return this._val.toString();
  }

  toFixed(fractionDigits?: number): string {
    return this._val.toFixed(fractionDigits);
  }

  toNumber(): number {
    return this._val.toNumber();
  }

  // Static methods to match DecimalConstructor interface
  static add(a: string | number | DecimalInterface, b: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(a).add(b);
  }

  static sub(a: string | number | DecimalInterface, b: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(a).sub(b);
  }

  static mul(a: string | number | DecimalInterface, b: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(a).mul(b);
  }

  static div(a: string | number | DecimalInterface, b: string | number | DecimalInterface): DecimalInterface {
    return new Decimal(a).div(b);
  }
}
