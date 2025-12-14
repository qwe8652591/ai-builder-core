import { describe, it, expect } from 'vitest';
import { ThreadLocalSecurityContext } from '../../src/primitives/security';

describe('ThreadLocalSecurityContext', () => {
  const ctx = new ThreadLocalSecurityContext();

  it('should throw if no context', () => {
    expect(() => ctx.getUserId()).toThrow('SecurityContext: No user logged in');
    expect(ctx.getUserIdOrNull()).toBeNull();
  });

  it('should retrieve values within run()', () => {
    const result = ThreadLocalSecurityContext.run(
      { userId: 'u1', tenantId: 't1', roles: ['admin'] },
      () => {
        expect(ctx.getUserId()).toBe('u1');
        expect(ctx.getTenantId()).toBe('t1');
        expect(ctx.getRoles()).toEqual(['admin']);
        return 'success';
      }
    );
    expect(result).toBe('success');
  });

  it('should handle nested contexts (AsyncLocalStorage behavior)', () => {
    ThreadLocalSecurityContext.run({ userId: 'outer' }, () => {
      expect(ctx.getUserId()).toBe('outer');
      
      ThreadLocalSecurityContext.run({ userId: 'inner' }, () => {
        expect(ctx.getUserId()).toBe('inner');
      });
      
      expect(ctx.getUserId()).toBe('outer');
    });
  });

  it('should support enterWith for testing', () => {
    ThreadLocalSecurityContext.enter({ userId: 'test-user' });
    expect(ctx.getUserId()).toBe('test-user');
  });
});






