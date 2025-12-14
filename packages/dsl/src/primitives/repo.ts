/**
 * 分页选项
 */
export interface PageOptions {
  pageNo?: number;
  pageSize?: number;
  sort?: Record<string, 'asc' | 'desc'>;
}

/**
 * 泛型仓储接口
 */
export interface Repo<T, ID = any> {
  findById(id: ID): Promise<T | null>;
  findByIdOrThrow(id: ID): Promise<T>;
  findOne(query: Partial<T>): Promise<T | null>;
  find(query: Partial<T>, options?: { sort?: Record<string, 'asc' | 'desc'> }): Promise<T[]>;
  findPage(query: Partial<T>, options: PageOptions): Promise<{ list: T[]; total: number }>;
  save(entity: T): Promise<T>;
  saveAll(entities: T[]): Promise<T[]>;
  deleteById(id: ID): Promise<boolean>;
  delete(entity: T): Promise<boolean>;
  count(query?: Partial<T>): Promise<number>;
}






