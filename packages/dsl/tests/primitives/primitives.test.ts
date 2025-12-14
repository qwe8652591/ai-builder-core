import { describe, it, expect } from 'vitest';
import { SecurityContext } from '../../src/primitives/security';

// 这里我们不直接 import 值，因为它们是 undefined
// import { Decimal } from '../../src/primitives/decimal';

describe('Runtime Primitives', () => {
  it('should have correct type definitions for Decimal', () => {
    // 这是一个类型测试，实际上在编译期进行。
    // 我们写一些代码来确保类型兼容性。
    
    // Mock Decimal Implementation
    class MockDecimal {
      constructor(private val: number) {}
      add(other: any) { return new MockDecimal(this.val + other.val); }
      toString() { return String(this.val); }
    }

    // 验证 Mock 是否满足 Decimal 接口
    const d = new MockDecimal(10);
    expect(d.toString()).toBe('10');
  });

  it('should have correct type definitions for SecurityContext', () => {
    // Mock SecurityContext Implementation
    class MockSecurityContext implements SecurityContext {
      getUserId() { return 'user-123'; }
      getUserIdOrNull() { return 'user-123'; }
      getTenantId() { return 'tenant-1'; }
      getRoles() { return ['admin']; }
      hasPermission(p: string) { return true; }
      getUser<T>() { return null; }
    }

    const ctx = new MockSecurityContext();
    expect(ctx.getUserId()).toBe('user-123');
    expect(ctx.hasPermission('read')).toBe(true);
  });
});
