import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepo } from '../../src/repository/in-memory-repo';

interface User {
  id: string;
  name: string;
  email: string;
}

describe('InMemoryRepo', () => {
  let repo: InMemoryRepo<User>;

  beforeEach(() => {
    repo = new InMemoryRepo<User>();
  });

  it('should save and find entity', async () => {
    const user: User = { id: '', name: 'Alice', email: 'alice@example.com' };
    const saved = await repo.save(user);

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('Alice');

    const found = await repo.findById(saved.id);
    expect(found).toEqual(saved);
    expect(found).not.toBe(saved); // Deep copy check
  });

  it('should update entity', async () => {
    const user = await repo.save({ id: '1', name: 'Bob', email: 'bob@example.com' });
    user.name = 'Bobby';
    await repo.save(user);

    const found = await repo.findById('1');
    expect(found?.name).toBe('Bobby');
  });

  it('should delete entity', async () => {
    const user = await repo.save({ id: '2', name: 'Charlie', email: 'c@example.com' });
    const deleted = await repo.delete(user);
    expect(deleted).toBe(true);
    
    const found = await repo.findById(user.id);
    expect(found).toBeNull();
  });

  it('should find page', async () => {
    for (let i = 0; i < 15; i++) {
      await repo.save({ id: `id-${i}`, name: `User ${i}`, email: `u${i}@test.com` });
    }

    const page1 = await repo.findPage({}, { pageNo: 1, pageSize: 10 });
    expect(page1.list).toHaveLength(10);
    expect(page1.total).toBe(15);

    const page2 = await repo.findPage({}, { pageNo: 2, pageSize: 10 });
    expect(page2.list).toHaveLength(5);
  });

  it('should count entities', async () => {
    await repo.save({ id: '1', name: 'Alice', email: 'alice@test.com' });
    await repo.save({ id: '2', name: 'Bob', email: 'bob@test.com' });

    const count = await repo.count();
    expect(count).toBe(2);
  });
});
