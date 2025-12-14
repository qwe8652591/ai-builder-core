import type { Repo, PageOptions } from '@ai-builder/dsl';
import { HookRegistry } from '../hooks/hook-registry';

export class InMemoryRepo<T extends { id: any }> implements Repo<T, any> {
  protected store = new Map<string, T>();
  protected hooks: HookRegistry;

  constructor(hooks?: HookRegistry) {
    this.hooks = hooks || HookRegistry.global;
  }

  async save(entity: T): Promise<T> {
    const entityName = entity.constructor.name !== 'Object' ? entity.constructor.name : 'Entity';
    
    // Execute Before Save Hooks
    await this.hooks.executeBefore(`save:${entityName}`, entity);
    await this.hooks.executeBefore(`save:*`, entity);

    if (!entity.id) {
      // Simple ID generation for simulation
      (entity as any).id = Math.random().toString(36).substring(2, 9);
    }
    
    this.store.set(String(entity.id), JSON.parse(JSON.stringify(entity))); // Deep copy
    
    // Execute After Save Hooks
    await this.hooks.executeAfter(`save:${entityName}`, entity);
    await this.hooks.executeAfter(`save:*`, entity);
    
    return entity;
  }

  async findById(id: any): Promise<T | null> {
    const item = this.store.get(String(id));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async findByIdOrThrow(id: any): Promise<T> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return item;
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const all = Array.from(this.store.values());
    const found = all.find(item => this.matches(item, query));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async find(query: Partial<T>, options?: { sort?: Record<string, 'asc' | 'desc'> }): Promise<T[]> {
    let all = Array.from(this.store.values());
    all = all.filter(item => this.matches(item, query));
    
    if (options?.sort) {
      all = this.sortItems(all, options.sort);
    }
    
    return all.map(item => JSON.parse(JSON.stringify(item)));
  }

  async findPage(query: Partial<T>, options: PageOptions): Promise<{ list: T[]; total: number }> {
    let all = Array.from(this.store.values());
    all = all.filter(item => this.matches(item, query));
    
    const total = all.length;
    const pageNo = options.pageNo || 1;
    const pageSize = options.pageSize || 10;
    const start = (pageNo - 1) * pageSize;
    const end = start + pageSize;
    
    if (options.sort) {
      all = this.sortItems(all, options.sort);
    }
    
    const list = all.slice(start, end).map(item => JSON.parse(JSON.stringify(item)));

    return { list, total };
  }

  async saveAll(entities: T[]): Promise<T[]> {
    const saved: T[] = [];
    for (const entity of entities) {
      saved.push(await this.save(entity));
    }
    return saved;
  }

  async deleteById(id: any): Promise<boolean> {
    const exists = this.store.has(String(id));
    this.store.delete(String(id));
    return exists;
  }

  async delete(entity: T): Promise<boolean> {
    return this.deleteById(entity.id);
  }

  async count(query?: Partial<T>): Promise<number> {
    if (!query) {
      return this.store.size;
    }
    const all = Array.from(this.store.values());
    return all.filter(item => this.matches(item, query)).length;
  }

  // Helper methods
  private matches(item: T, query: Partial<T>): boolean {
    for (const key in query) {
      if (query[key] !== (item as any)[key]) {
        return false;
      }
    }
    return true;
  }

  private sortItems(items: T[], sort: Record<string, 'asc' | 'desc'>): T[] {
    return items.sort((a, b) => {
      for (const key in sort) {
        const aVal = (a as any)[key];
        const bVal = (b as any)[key];
        if (aVal < bVal) return sort[key] === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort[key] === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Helper for testing
  clear(): void {
    this.store.clear();
  }
}
