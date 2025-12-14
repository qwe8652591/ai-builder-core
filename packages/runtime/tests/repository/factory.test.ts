import { describe, it, expect, beforeEach } from 'vitest';
import { RepoFactory } from '../../src/repository/repo-factory';
import { InMemoryRepo } from '../../src/repository/in-memory-repo';

describe('RepoFactory', () => {
  beforeEach(() => {
    RepoFactory.clear();
  });

  it('should auto-create in-memory repo', () => {
    const repo = RepoFactory.get('User');
    expect(repo).toBeInstanceOf(InMemoryRepo);
  });

  it('should return registered repo', () => {
    class CustomRepo extends InMemoryRepo<any> {}
    const custom = new CustomRepo();
    RepoFactory.register('Custom', custom);

    const retrieved = RepoFactory.get('Custom');
    expect(retrieved).toBe(custom);
  });

  it('should return singleton instance', () => {
    const r1 = RepoFactory.get('User');
    const r2 = RepoFactory.get('User');
    expect(r1).toBe(r2);
  });
});






