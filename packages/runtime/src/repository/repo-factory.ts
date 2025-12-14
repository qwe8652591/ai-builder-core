import { Repo } from '@ai-builder/dsl';
import { InMemoryRepo } from './in-memory-repo';

export class RepoFactory {
  private static repos = new Map<string, Repo<any, any>>();

  static register<T>(entityName: string, repo: Repo<T, any>): void {
    this.repos.set(entityName, repo);
  }

  static get<T>(entityName: string): Repo<T, any> {
    if (!this.repos.has(entityName)) {
      // Auto-create InMemoryRepo for simulation convenience
      this.repos.set(entityName, new InMemoryRepo<any>());
    }
    return this.repos.get(entityName) as Repo<T, any>;
  }

  static clear(): void {
    this.repos.clear();
  }
}






