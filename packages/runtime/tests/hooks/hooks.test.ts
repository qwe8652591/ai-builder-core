import { describe, it, expect, vi } from 'vitest';
import { HookRegistry } from '../../src/hooks/hook-registry';
import { InMemoryRepo } from '../../src/repository/in-memory-repo';

class TestEntity {
  id: string = '';
  value: string = 'initial';
}

describe('HookRegistry', () => {
  it('should execute hooks in order', async () => {
    const registry = new HookRegistry();
    const sequence: string[] = [];

    registry.before('test', () => { sequence.push('before1'); });
    registry.before('test', () => { sequence.push('before2'); });
    registry.after('test', () => { sequence.push('after1'); });

    await registry.executeBefore('test', {});
    await registry.executeAfter('test', {});

    expect(sequence).toEqual(['before1', 'before2', 'after1']);
  });

  it('should integration with InMemoryRepo', async () => {
    const registry = new HookRegistry();
    const repo = new InMemoryRepo<TestEntity>(registry);

    const entity = new TestEntity();
    
    // Test modification in before hook
    registry.before('save:TestEntity', (e: TestEntity) => {
      e.value = 'modified';
    });

    const handler = vi.fn();
    registry.after('save:TestEntity', handler);

    await repo.save(entity);

    expect(entity.value).toBe('modified');
    expect(handler).toHaveBeenCalledTimes(1);
    
    // Verify persistence got the modified value
    const saved = await repo.findById(entity.id);
    expect(saved?.value).toBe('modified');
  });

  it('should abort if before hook throws', async () => {
    const registry = new HookRegistry();
    const repo = new InMemoryRepo<TestEntity>(registry);
    
    registry.before('save:TestEntity', () => {
      throw new Error('Validation failed');
    });

    await expect(repo.save(new TestEntity())).rejects.toThrow('Validation failed');
  });
});






